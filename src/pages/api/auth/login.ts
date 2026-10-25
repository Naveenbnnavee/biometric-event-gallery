import type { APIRoute } from 'astro';
import { validatePassword, getSessionCookieHeader, setRuntimeAuthEnv } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '../../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = getClientIp(request);

    // Anti-Brute-Force: Max 5 login attempts per 10 minutes per IP
    const rateCheck = checkRateLimit(`login_attempt:${clientIp}`, 5, 600);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(
        rateCheck,
        `Too many failed login attempts. For security, your IP has been temporarily locked. Try again in ${rateCheck.resetInSeconds}s.`
      );
    }

    const env = await getCloudflareEnv();
    if (env) {
      setRuntimeAuthEnv(env);
    }

    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Password is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!validatePassword(password, env)) {
      return new Response(JSON.stringify({
        error: 'Invalid admin credentials',
        remainingAttempts: rateCheck.remaining
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cookieHeader = await getSessionCookieHeader(request, env);

    return new Response(JSON.stringify({ success: true, message: 'Authentication successful' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
