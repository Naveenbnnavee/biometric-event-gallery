import type { APIRoute } from 'astro';
import { getClearSessionCookieHeader } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ success: true, message: 'Logged out' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': getClearSessionCookieHeader(request)
    }
  });
};
