import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await isAuthenticated(request);
  return new Response(JSON.stringify({ authenticated: auth }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
