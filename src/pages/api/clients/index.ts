import type { APIRoute } from 'astro';
import { getClientGalleriesAsync, addClientGalleryAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clients = await getClientGalleriesAsync(env);
    return new Response(JSON.stringify(clients), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { clientName, eventTitle, ceremonyDate, pin, targetAlbumCount, photosCount, status, coverImage, albumDriveLink, photos, clientEmail, clientPhone, requireTwoFactor, notes } = body;

    if (!clientName || !eventTitle || !pin) {
      return new Response(JSON.stringify({ error: 'Client Name, Event Title, and Access Key / Passcode are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const photosList = Array.isArray(photos) ? photos.filter((p: any) => typeof p === 'string' && p.trim()) : [];

    const newClient = await addClientGalleryAsync({
      clientName: clientName.trim(),
      eventTitle: eventTitle.trim(),
      ceremonyDate: ceremonyDate || new Date().toISOString().split('T')[0],
      pin: pin.trim(),
      clientEmail: clientEmail?.trim() || undefined,
      clientPhone: clientPhone?.trim() || undefined,
      requireTwoFactor: Boolean(requireTwoFactor),
      targetAlbumCount: Number(targetAlbumCount) || 40,
      photosCount: photosList.length > 0 ? photosList.length : (Number(photosCount) || 48),
      status: status === 'archived' ? 'archived' : 'active',
      coverImage: coverImage?.trim() || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1080&q=85',
      albumDriveLink: albumDriveLink?.trim() || undefined,
      photos: photosList,
      notes: notes?.trim() || undefined
    }, env);

    return new Response(JSON.stringify({ success: true, client: newClient }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
