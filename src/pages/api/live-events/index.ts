import type { APIRoute } from 'astro';
import { getLiveEventsAsync, saveLiveEventAsync, getLiveEventBySlugAsync, getLiveEventByIdAsync, type LiveEvent } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const env = await getCloudflareEnv();
    const events = await getLiveEventsAsync(env);
    return new Response(JSON.stringify({ success: true, events }), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { title, ceremonyType, venue, date, slug, accessMode, allowDownload, watermarkPreview, status } = body;

    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Event Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let existingPhotos: any[] = [];
    if (body.id) {
      const existing = await getLiveEventByIdAsync(body.id, env);
      if (existing && Array.isArray(existing.photos)) {
        existingPhotos = existing.photos;
      }
    } else {
      const existing = await getLiveEventBySlugAsync(cleanSlug, env);
      if (existing) {
        return new Response(JSON.stringify({ error: `An event with slug "${cleanSlug}" already exists.` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const newEvent: LiveEvent = {
      id: body.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      slug: cleanSlug,
      title: title.trim(),
      ceremonyType: ceremonyType || 'weddings',
      venue: venue?.trim() || 'Heritage Venue',
      date: date || new Date().toISOString().split('T')[0],
      status: (status as 'upcoming' | 'live' | 'archived') || 'live',
      accessMode: ['face_only', 'open_gallery', 'face_and_all', 'face_match'].includes(accessMode) ? accessMode : 'face_only',
      allowDownload: allowDownload !== false,
      watermarkPreview: watermarkPreview !== false,
      ingestionToken: body.ingestionToken || `live_${Math.random().toString(36).slice(2, 12)}`,
      photos: Array.isArray(body.photos) ? body.photos : existingPhotos,
      createdAt: body.createdAt || new Date().toISOString()
    };

    const saved = await saveLiveEventAsync(newEvent, env);

    return new Response(JSON.stringify({ success: true, event: saved }), {
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
