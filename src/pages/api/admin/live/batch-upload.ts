import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getLiveEventsAsync, addPhotosBatchToLiveEventAsync, type LiveEventPhoto } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/auth';
import { getCloudflareEnv } from '../../../../lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '../../../../lib/security';

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
    const rateCheck = checkRateLimit(`batch_upload:${clientIp}`, 60, 60);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, 'Upload rate limit exceeded. Please wait a moment.');
    }

    const env = await getCloudflareEnv();

    const queryToken = url.searchParams.get('token') || '';
    const headerToken = request.headers.get('x-ingestion-token') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';

    const allEvents = await getLiveEventsAsync(env);
    const authedAdmin = await isAuthenticated(request, env);

    const contentType = request.headers.get('content-type') || '';
    let targetEventId = url.searchParams.get('eventId') || url.searchParams.get('id') || '';
    let framesInput: any[] = [];
    let fileList: File[] = [];
    let tokenFromPayload = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      targetEventId = body.eventId || body.id || targetEventId;
      framesInput = Array.isArray(body.frames) ? body.frames : (body.photos ? body.photos : []);
      tokenFromPayload = body.token || body.ingestionToken || '';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      targetEventId = (formData.get('eventId') as string) || (formData.get('id') as string) || targetEventId;
      tokenFromPayload = (formData.get('token') as string) || (formData.get('ingestionToken') as string) || '';
      
      const files = formData.getAll('files') as File[];
      const singleFile = formData.get('file') as File | null;
      fileList = files.length > 0 ? files : (singleFile ? [singleFile] : []);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported Content-Type. Use application/json or multipart/form-data.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const providedToken = (queryToken || headerToken || bearerToken || tokenFromPayload).trim();

    let matchedEvent = allEvents.find(e => 
      (providedToken && e.ingestionToken === providedToken) ||
      (targetEventId && (e.id === targetEventId || e.slug === targetEventId))
    );

    // If authenticated via admin session, allow access even if token wasn't provided
    if (!matchedEvent && authedAdmin && targetEventId) {
      matchedEvent = allEvents.find(e => e.id === targetEventId || e.slug === targetEventId);
    }

    if (!matchedEvent) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token or target event not found.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const photosToSave: LiveEventPhoto[] = [];

    // Process JSON frames array (batch of 15-20 frames)
    if (framesInput.length > 0) {
      for (let i = 0; i < framesInput.length; i++) {
        const item = framesInput[i];
        let photoUrl = item.url || '';
        const base64 = item.base64 || (typeof photoUrl === 'string' && photoUrl.startsWith('data:image/') ? photoUrl : null);

        if (base64) {
          const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          const filename = `live-${matchedEvent.slug}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}.jpg`;

          let savedPath = tryWriteFile(buffer, filename);
          if (!savedPath) {
            savedPath = await tryHostBridgeWrite(buffer, filename);
          }
          photoUrl = savedPath || photoUrl;
        }

        if (!photoUrl) continue;

        photosToSave.push({
          id: item.id || `frame_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          url: photoUrl,
          thumbnailUrl: item.thumbnailUrl || photoUrl,
          timestamp: item.timestamp || new Date().toISOString(),
          faces: Array.isArray(item.faces) ? item.faces : undefined
        });
      }
    }

    // Process multipart files if passed
    if (fileList.length > 0) {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file || typeof file.arrayBuffer !== 'function') continue;

        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const ext = file.name ? path.extname(file.name).toLowerCase() || '.jpg' : '.jpg';
        const cleanName = `live-${matchedEvent.slug}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}${ext}`;

        let savedUrl = tryWriteFile(buffer, cleanName);
        if (!savedUrl) {
          savedUrl = await tryHostBridgeWrite(buffer, cleanName);
        }
        if (!savedUrl) {
          const mime = file.type || 'image/jpeg';
          savedUrl = `data:${mime};base64,${buffer.toString('base64')}`;
        }

        photosToSave.push({
          id: `frame_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          url: savedUrl,
          thumbnailUrl: savedUrl,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (photosToSave.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid frames or image files found in batch payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // High-Efficiency Single KV Write for the whole batch
    const result = await addPhotosBatchToLiveEventAsync(matchedEvent.id, photosToSave, env);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully ingested batch of ${photosToSave.length} frames (KV writes reduced to 1)`,
      added: photosToSave.length,
      total: result.total,
      photos: photosToSave
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Batch upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
