import type { APIRoute } from 'astro';
import { getLiveEventsAsync, completeLiveEventAsync } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/auth';
import { getCloudflareEnv } from '../../../../lib/cloudflare';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);

    const body = await request.json().catch(() => ({}));
    const eventId = body.eventId || body.id || url.searchParams.get('eventId') || url.searchParams.get('id');

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allEvents = await getLiveEventsAsync(env);
    const event = allEvents.find(e => e.id === eventId || e.slug === eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: 'Live event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const providedToken = (body.token || body.ingestionToken || url.searchParams.get('token') || '').trim();
    if (!authed && (!providedToken || providedToken !== event.ingestionToken)) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin credentials or event token required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await completeLiveEventAsync(event.id, {
      pin: body.pin,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      clientEmail: body.clientEmail,
      targetAlbumCount: typeof body.targetAlbumCount === 'number' ? body.targetAlbumCount : undefined
    }, env);

    const siteOrigin = url.origin && !url.origin.includes('localhost') && !url.origin.includes('127.0.0.1')
      ? url.origin
      : 'https://framesbyhithu.pages.dev';

    const fullProofingUrl = `${siteOrigin}/client-portal?pin=${result.pin}`;
    const totalPhotos = result.event.photos?.length || result.client.photosCount || 0;

    const whatsappMessage = `✨ *Frames By Hithu • Sacred Ceremony Heirloom Proofing* ✨\n\n` +
      `Dear ${result.client.clientName},\n` +
      `Your sacred memories from *${result.event.title}* have been curated into your private proofing suite!\n\n` +
      `We invite you to review your master high-resolution frames and heart-select your favorites for your Heirloom Italian Leatherette Album:\n\n` +
      `🔐 *Private Proofing Gallery:* ${fullProofingUrl}\n` +
      `🔑 *Secure 6-Digit PIN:* *${result.pin}*\n` +
      `📸 *Total Frames:* ${totalPhotos} photographs\n\n` +
      `With warm regards,\n` +
      `*Hithu & The Frames By Hithu Team*`;

    const cleanPhone = (result.client.clientPhone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    return new Response(JSON.stringify({
      success: true,
      message: `Event "${result.event.title}" completed and transitioned to Client Portal!`,
      event: result.event,
      client: result.client,
      pin: result.pin,
      proofingUrl: result.proofingUrl,
      fullProofingUrl,
      whatsappMessage,
      whatsappUrl,
      isNewClient: result.isNewClient
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Complete event failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
