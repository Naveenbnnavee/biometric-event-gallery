import type { APIRoute } from 'astro';
import { getTestimonialByIdAsync, updateTestimonialStatusAsync, deleteTestimonialAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';
import { sanitizeInput, applySecurityHeaders } from '../../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const env = await getCloudflareEnv();
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Testimonial ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const item = await getTestimonialByIdAsync(id, env);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resp = new Response(JSON.stringify({ success: true, testimonial: item }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    applySecurityHeaders(resp.headers);
    return resp;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Testimonial ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const updates: any = {};

    if (body.status !== undefined) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(body.status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updates.status = body.status;
    }

    if (body.showOnHomepage !== undefined) {
      updates.showOnHomepage = Boolean(body.showOnHomepage);
    }

    if (body.clientName !== undefined) updates.clientName = sanitizeInput(body.clientName, 100);
    if (body.highlight !== undefined) updates.highlight = sanitizeInput(body.highlight, 200);
    if (body.comment !== undefined) updates.comment = sanitizeInput(body.comment, 4000);
    if (body.eventType !== undefined) updates.eventType = sanitizeInput(body.eventType, 100);
    if (body.venue !== undefined) updates.venue = sanitizeInput(body.venue, 100);
    if (body.location !== undefined) updates.location = sanitizeInput(body.location, 100);
    if (body.rating !== undefined) {
      const r = Number(body.rating);
      if (!isNaN(r) && r >= 1 && r <= 5) updates.rating = Math.round(r);
    }

    const updated = await updateTestimonialStatusAsync(id, updates, env);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resp = new Response(JSON.stringify({ success: true, testimonial: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    applySecurityHeaders(resp.headers);
    return resp;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Testimonial ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleted = await deleteTestimonialAsync(id, env);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resp = new Response(JSON.stringify({ success: true, message: 'Testimonial removed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    applySecurityHeaders(resp.headers);
    return resp;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
