import type { APIRoute } from 'astro';
import { getLiveEventByIdAsync, getLiveEventBySlugAsync, completeLiveEventAsync } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/auth';
import { getCloudflareEnv } from '../../../../lib/cloudflare';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, url }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID or slug required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const event = (await getLiveEventByIdAsync(id, env)) || (await getLiveEventBySlugAsync(id, env));
    if (!event) {
      return new Response(JSON.stringify({ error: 'Live event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Allow authenticated admin OR request with correct ingestion token
    const queryToken = url.searchParams.get('token') || '';
    const headerToken = request.headers.get('x-ingestion-token') || '';
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const bodyToken = body.token || body.ingestionToken || '';
    const providedToken = (queryToken || headerToken || bodyToken).trim();

    if (!authed && (!providedToken || providedToken !== event.ingestionToken)) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin credentials or event token required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const {
      pin,
      clientName,
      clientPhone,
      clientEmail,
      targetAlbumCount
    } = body;

    const result = await completeLiveEventAsync(event.id, {
      pin,
      clientName,
      clientPhone,
      clientEmail,
      targetAlbumCount: typeof targetAlbumCount === 'number' ? targetAlbumCount : undefined
    }, env);

    const siteOrigin = url.origin && !url.origin.includes('localhost') && !url.origin.includes('127.0.0.1')
      ? url.origin
      : 'https://framesbyhithu.pages.dev';

    const { getStudioSettingsAsync } = await import('../../../../lib/db');
    const settings = await getStudioSettingsAsync(env);
    const googleReviewUrl = settings.googleReviewUrl || 'https://g.page/r/FramesByHithu/review';
    const ceremonyType = result.event.ceremonyType || 'wedding photography';
    const cityLocation = result.event.venue || settings.city || 'Bangalore';

    const fullProofingUrl = `${siteOrigin}/client-portal?pin=${result.pin}`;
    const totalPhotos = result.event.photos?.length || result.client.photosCount || 0;

    const whatsappMessage = `✨ *Frames By Hithu • Sacred Ceremony Heirloom Proofing* ✨\n\n` +
      `Dear ${result.client.clientName},\n` +
      `Your sacred memories from *${result.event.title}* have been curated into your private proofing suite!\n\n` +
      `We invite you to review your master high-resolution frames and heart-select your favorites for your Heirloom Italian Leatherette Album:\n\n` +
      `🔐 *Private Proofing Gallery:* ${fullProofingUrl}\n` +
      `🔑 *Secure 6-Digit PIN:* *${result.pin}*\n` +
      `📸 *Total Frames:* ${totalPhotos} photographs\n\n` +
      `🌟 *Share Your Experience on Google:*\n` +
      `If you loved our coverage, we would be deeply honored if you could leave us a 5-star Google review:\n` +
      `👉 ${googleReviewUrl}\n` +
      `_(Tip: Please mention our coverage of your ${ceremonyType} in ${cityLocation} — your kind words help other families discover our art!)_\n\n` +
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
      googleReviewUrl,
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
