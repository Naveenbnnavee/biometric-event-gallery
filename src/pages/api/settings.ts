import type { APIRoute } from 'astro';
import { getStudioSettingsAsync, updateStudioSettingsAsync } from '../../lib/db';
import { isAuthenticated } from '../../lib/auth';
import { getCloudflareEnv } from '../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const env = await getCloudflareEnv();
    const settings = await getStudioSettingsAsync(env);
    return new Response(JSON.stringify(settings), {
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

export const PUT: APIRoute = async ({ request }) => {
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

    // Strict validation for Indian phone numbers (+91 default, exactly 10 digits)
    if (body.primaryPhone !== undefined) {
      const primaryDigits = String(body.primaryPhone).replace(/\D/g, '').slice(-10);
      if (primaryDigits.length !== 10) {
        return new Response(JSON.stringify({
          error: 'Primary Voice Line must contain exactly 10 digits (India +91).'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      body.primaryPhone = `+91-${primaryDigits}`;
    }

    if (body.whatsappConcierge !== undefined) {
      const whatsappDigits = String(body.whatsappConcierge).replace(/\D/g, '').slice(-10);
      if (whatsappDigits.length !== 10) {
        return new Response(JSON.stringify({
          error: 'WhatsApp Concierge Number must contain exactly 10 digits (India +91).'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      body.whatsappConcierge = `+91${whatsappDigits}`;
    }

    if (body.clientPortalVisible !== undefined) {
      body.clientPortalVisible = Boolean(body.clientPortalVisible);
    }

    const updated = await updateStudioSettingsAsync(body, env);

    return new Response(JSON.stringify({ success: true, settings: updated }), {
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
