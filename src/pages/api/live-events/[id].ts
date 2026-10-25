import type { APIRoute } from 'astro';
import { getLiveEventByIdAsync, getLiveEventBySlugAsync, saveLiveEventAsync, deleteLiveEventAsync, deletePhotoFromLiveEventAsync, completeLiveEventAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const env = await getCloudflareEnv();
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID or slug required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const event = (await getLiveEventByIdAsync(id, env)) || (await getLiveEventBySlugAsync(id, env));
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, event }), {
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

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = (await getLiveEventByIdAsync(id, env)) || (await getLiveEventBySlugAsync(id, env));
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();

    // Check if this is a delete photo request
    if (body.action === 'delete_photo' && body.photoId) {
      const removed = await deletePhotoFromLiveEventAsync(existing.id, body.photoId, env);
      return new Response(JSON.stringify({ success: removed }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.action === 'clear_all_photos') {
      existing.photos = [];
      const saved = await saveLiveEventAsync(existing, env);
      return new Response(JSON.stringify({ success: true, event: saved }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.action === 'complete_event') {
      const result = await completeLiveEventAsync(existing.id, {
        pin: body.pin,
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        clientEmail: body.clientEmail,
        targetAlbumCount: body.targetAlbumCount
      }, env);
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = {
      ...existing,
      ...body,
      id: existing.id, // Immutable ID
      slug: body.slug ? body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : existing.slug,
      photos: Array.isArray(body.photos) ? body.photos : existing.photos
    };

    const saved = await saveLiveEventAsync(updated, env);

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

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleted = await deleteLiveEventAsync(id, env);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Event not found or failed to delete' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Event deleted' }), {
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
