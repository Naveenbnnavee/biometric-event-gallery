import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getLiveEventsAsync, addPhotoToLiveEventAsync, type LiveEventPhoto } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '../../../lib/security';

export const prerender = false;

function tryWriteFile(buffer: Buffer, filename: string): string | null {
  try {
    const root = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '.';
    const dir = path.join(root, 'public', 'uploads');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    return null;
  }
}

async function tryHostBridgeWrite(buffer: Buffer, filename: string): Promise<string | null> {
  const base64Data = buffer.toString('base64');
  const urls = [
    'http://localhost:4321/__dev_upload_file',
    'http://[::1]:4321/__dev_upload_file',
    'http://127.0.0.1:4321/__dev_upload_file'
  ];
  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, base64Data })
      });
      if (resp.ok) {
        const data = await resp.json() as { ok?: boolean; url?: string };
        if (data && data.url) return data.url;
      }
    } catch {}
  }
  return null;
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`live_ingest:${clientIp}`, 40, 60);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, 'Upload rate limit exceeded. Please wait a moment.');
    }

    const env = await getCloudflareEnv();

    // Ingestion Token Authentication
    const queryToken = url.searchParams.get('token') || '';
    const headerToken = request.headers.get('x-ingestion-token') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';

    const providedToken = (queryToken || headerToken || bearerToken).trim();

    const allEvents = await getLiveEventsAsync(env);
    let matchedEvent = allEvents.find(e => e.ingestionToken === providedToken && providedToken.length > 0);

    // If no matching ingestion token, check if authenticated admin
    if (!matchedEvent) {
      const authed = await isAuthenticated(request, env);
      const targetSlug = url.searchParams.get('slug') || url.searchParams.get('eventId');
      if (authed && targetSlug) {
        matchedEvent = allEvents.find(e => e.id === targetSlug || e.slug === targetSlug);
      }
    }

    if (!matchedEvent) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid ingestion token or event not found.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = request.headers.get('content-type') || '';
    const addedPhotos: LiveEventPhoto[] = [];

    // Case 1: Multipart FormData (SD Card dropzone or mobile file picker)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const singleFile = formData.get('file') as File | null;
      const fileList: File[] = files.length > 0 ? files : (singleFile ? [singleFile] : []);

      // Optional face embeddings passed as JSON string
      const facesJson = formData.get('faces') as string | null;
      let parsedFaces: number[][] | undefined = undefined;
      if (facesJson) {
        try { parsedFaces = JSON.parse(facesJson); } catch {}
      }

      for (const file of fileList) {
        if (!file || typeof file.arrayBuffer !== 'function') continue;
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        const ext = file.name ? path.extname(file.name).toLowerCase() || '.jpg' : '.jpg';
        const cleanName = `live-${matchedEvent.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;

        let savedUrl = tryWriteFile(buffer, cleanName);
        if (!savedUrl) {
          savedUrl = await tryHostBridgeWrite(buffer, cleanName);
        }
        if (!savedUrl) {
          // In-memory base64 fallback for serverless sandbox
          const mime = file.type || 'image/jpeg';
          savedUrl = `data:${mime};base64,${buffer.toString('base64')}`;
        }

        const photo: LiveEventPhoto = {
          id: `photo-live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: savedUrl,
          thumbnailUrl: savedUrl,
          timestamp: new Date().toISOString(),
          faces: parsedFaces
        };

        await addPhotoToLiveEventAsync(matchedEvent.id, photo, env);
        addedPhotos.push(photo);
      }
    } 
    // Case 2: JSON payload (URL or base64)
    else if (contentType.includes('application/json')) {
      const body = await request.json();
      const { url: photoUrl, base64, filename, faces } = body;

      let finalUrl = photoUrl;

      if (base64) {
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const fname = filename || `live-${matchedEvent.slug}-${Date.now()}.jpg`;

        finalUrl = tryWriteFile(buffer, fname);
        if (!finalUrl) {
          finalUrl = await tryHostBridgeWrite(buffer, fname);
        }
        if (!finalUrl) {
          finalUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${cleanBase64}`;
        }
      }

      if (!finalUrl) {
        return new Response(JSON.stringify({ error: 'Missing image data (url, base64, or file required).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const photo: LiveEventPhoto = {
        id: `photo-live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: finalUrl,
        thumbnailUrl: finalUrl,
        timestamp: new Date().toISOString(),
        faces: Array.isArray(faces) ? faces : undefined
      };

      await addPhotoToLiveEventAsync(matchedEvent.id, photo, env);
      addedPhotos.push(photo);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully ingested ${addedPhotos.length} photo(s) into "${matchedEvent.title}"`,
      event: { id: matchedEvent.id, slug: matchedEvent.slug, title: matchedEvent.title },
      photos: addedPhotos
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
