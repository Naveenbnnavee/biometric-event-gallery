import type { APIRoute } from 'astro';
import { getLiveEventByIdAsync, getLiveEventBySlugAsync } from '../../../lib/db';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const env = await getCloudflareEnv();
    const id = url.searchParams.get('id') || url.searchParams.get('eventId') || url.searchParams.get('slug') || '';
    const since = url.searchParams.get('since') || '';

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

    let photos = event.photos || [];

    if (since) {
      const sinceDate = new Date(since).getTime();
      if (!isNaN(sinceDate)) {
        photos = photos.filter(p => new Date(p.timestamp).getTime() > sinceDate);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      eventId: event.id,
      slug: event.slug,
      status: event.status,
      accessMode: event.accessMode,
      allowDownload: event.allowDownload,
      watermarkPreview: event.watermarkPreview,
      totalCount: (event.photos || []).length,
      newPhotosCount: photos.length,
      photos
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=6, s-maxage=6, stale-while-revalidate=4'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
