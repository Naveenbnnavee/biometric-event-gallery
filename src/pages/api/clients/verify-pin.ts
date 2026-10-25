import type { APIRoute } from 'astro';
import { verifyClientPinAsync } from '../../../lib/db';
import { getCloudflareEnv } from '../../../lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '../../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = getClientIp(request);

    // Anti-Brute-Force: Max 8 PIN verification attempts per 10 minutes per IP
    const rateCheck = checkRateLimit(`pin_verify:${clientIp}`, 8, 600);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(
        rateCheck,
        `Too many incorrect access passcode attempts. For gallery privacy, please wait ${rateCheck.resetInSeconds} seconds before trying again.`
      );
    }

    const env = await getCloudflareEnv();
    const body = await request.json().catch(() => ({}));
    const pin = body.pin || body.passcode;
    const secondaryIdentifier = body.secondaryIdentifier || body.email || body.phone;

    if (!pin) {
      return new Response(JSON.stringify({ error: 'Access Key or Passcode is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = await verifyClientPinAsync(String(pin), secondaryIdentifier ? String(secondaryIdentifier) : undefined, env);
    if (!client) {
      return new Response(JSON.stringify({
        error: 'Invalid or inactive access passcode. Please verify your credentials or contact the studio.',
        remainingAttempts: rateCheck.remaining
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      client: {
        id: client.id,
        clientName: client.clientName,
        eventTitle: client.eventTitle,
        ceremonyDate: client.ceremonyDate,
        targetAlbumCount: client.targetAlbumCount,
        photosCount: (client.photos && client.photos.length > 0) ? client.photos.length : client.photosCount,
        coverImage: client.coverImage,
        albumDriveLink: client.albumDriveLink,
        photos: client.photos || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Verification failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
