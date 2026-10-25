import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { isAuthenticated } from '../../lib/auth';

export const prerender = false;

function tryWriteFile(buffer: Buffer, filename: string): string | null {
  try {
    const root = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '.';
    const dir = path.join(root, 'public', 'uploads');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignored in read-only sandboxes
      }
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const authed = await isAuthenticated(request);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle Multipart Form Data (file input / drag & drop)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const singleFile = formData.get('file') as File | null;

      const fileList: File[] = files.length > 0 ? files : (singleFile ? [singleFile] : []);

      if (fileList.length === 0) {
        return new Response(JSON.stringify({ error: 'No files provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const uploadedUrls: string[] = [];

      for (const file of fileList) {
        if (!file || typeof file.arrayBuffer !== 'function') continue;
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name || 'photo.jpg';
        const ext = path.extname(originalName) || '.jpg';
        const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${cleanBase}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext.toLowerCase()}`;
        
        // 1. Try local filesystem write first
        let url = tryWriteFile(buffer, filename);
        
        // 2. In dev workerd sandbox, bridge to Node.js host to write file to disk
        if (!url) {
          url = await tryHostBridgeWrite(buffer, filename);
        }

        // 3. Fallback to data URL only if host write also unavailable
        if (!url) {
          const mime = file.type || 'image/jpeg';
          const base64 = buffer.toString('base64');
          url = `data:${mime};base64,${base64}`;
        }

        uploadedUrls.push(url);
      }

      return new Response(JSON.stringify({
        success: true,
        urls: uploadedUrls,
        url: uploadedUrls[0] || null,
        count: uploadedUrls.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle JSON Base64 Payload
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { dataUrl, filename: reqFilename } = body;

      if (!dataUrl || !dataUrl.startsWith('data:')) {
        return new Response(JSON.stringify({ error: 'Valid image dataUrl is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const mimeMatch = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = dataUrl.replace(/^data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = '.jpg';
      if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';

      const filename = reqFilename || `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;
      
      let url = tryWriteFile(buffer, filename);
      if (!url) {
        url = await tryHostBridgeWrite(buffer, filename);
      }
      if (!url) {
        url = dataUrl;
      }

      return new Response(JSON.stringify({
        success: true,
        url,
        urls: [url]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported media type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
