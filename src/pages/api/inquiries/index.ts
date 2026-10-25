import type { APIRoute } from 'astro';
import { getInquiriesAsync, saveInquiryAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse, sanitizeInput } from '../../../lib/security';

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

    const inquiries = await getInquiriesAsync(env);
    return new Response(JSON.stringify({ success: true, inquiries }), {
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
    const clientIp = getClientIp(request);

    // Rate Limiting: Max 4 inquiries per 10 minutes per IP to prevent spam & KV exhaustion
    const rateCheck = checkRateLimit(`inquiry_submit:${clientIp}`, 4, 600);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(
        rateCheck,
        `Too many inquiry requests from this network. Please wait ${rateCheck.resetInSeconds} seconds before submitting again.`
      );
    }

    const env = await getCloudflareEnv();
    const body = await request.json().catch(() => ({}));

    // Honeypot Bot Trap: If an automated bot filled the hidden honeypot field, drop silently
    if (body.website_url || body.honeypot || body.faxNumber) {
      return new Response(JSON.stringify({ success: true, message: 'Inquiry received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientName = sanitizeInput(body.clientName, 100);
    const phone = sanitizeInput(body.phone, 30);
    const email = sanitizeInput(body.email, 120);
    const ceremonyType = sanitizeInput(body.ceremonyType, 100);
    const eventDate = sanitizeInput(body.eventDate, 40);
    const venue = sanitizeInput(body.venue, 150);
    const location = sanitizeInput(body.location, 100);
    const estimatedGuests = sanitizeInput(body.estimatedGuests, 60);
    const notes = sanitizeInput(body.notes, 1500);
    const status = body.status;

    if (!clientName || !phone || !eventDate) {
      return new Response(
        JSON.stringify({ error: 'Client Name, Phone Number, and Event Date are required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const validStatuses = ['new', 'contacted', 'confirmed', 'archived'] as const;
    const finalStatus = validStatuses.includes(status) ? status : 'new';

    const saved = await saveInquiryAsync(
      {
        clientName,
        phone,
        email,
        ceremonyType: ceremonyType || 'Grand Karnataka Wedding & Muhurtham',
        eventDate,
        venue,
        location: location || 'Karnataka',
        estimatedGuests: estimatedGuests || 'Mid-Scale (100 - 400 Guests)',
        notes: notes || undefined,
        status: finalStatus
      },
      env
    );

    return new Response(JSON.stringify({ success: true, inquiry: saved }), {
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
