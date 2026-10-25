import type { APIRoute } from 'astro';
import { getTestimonialsAsync, getApprovedTestimonialsAsync, addTestimonialAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse, sanitizeInput, applySecurityHeaders } from '../../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const env = await getCloudflareEnv();
    const isAll = url.searchParams.get('all') === 'true';

    if (isAll) {
      const authed = await isAuthenticated(request, env);
      if (!authed) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const all = await getTestimonialsAsync(env);
      const resp = new Response(JSON.stringify({ success: true, testimonials: all }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      applySecurityHeaders(resp.headers);
      return resp;
    }

    const approved = await getApprovedTestimonialsAsync(env);
    const resp = new Response(JSON.stringify({ success: true, testimonials: approved }), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = getClientIp(request);

    // 1. Sliding Window Rate Limiting (Max 3 submissions per 10 minutes per IP)
    const rateCheck = checkRateLimit(`feedback:${clientIp}`, 3, 600);
    if (!rateCheck.allowed) {
      const rateResp = createRateLimitResponse(rateCheck, 'Too many review submissions. Please wait before submitting again.');
      applySecurityHeaders(rateResp.headers);
      return rateResp;
    }

    const body = await request.json();

    // 2. Honeypot Anti-Spam (Silent drop for bot harvesters)
    if (body.company_website || body.honeypot || body.hp_check) {
      console.warn(`[Security] Bot honeypot triggered on feedback form by IP: ${clientIp}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you for your valuable feedback!'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Validation & Sanitization
    const clientName = sanitizeInput(body.clientName || '', 100);
    const comment = sanitizeInput(body.comment || '', 3000);
    const highlight = sanitizeInput(body.highlight || '', 180);
    const eventType = sanitizeInput(body.eventType || 'Grand Karnataka Wedding & Muhurtham', 100);
    const venue = sanitizeInput(body.venue || '', 120);
    const location = sanitizeInput(body.location || '', 100);
    const email = sanitizeInput(body.email || '', 100);
    const phone = sanitizeInput(body.phone || '', 30);
    
    const parsedRating = Number(body.rating);
    const rating = (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) ? Math.round(parsedRating) : 5;

    if (!clientName || clientName.length < 2) {
      return new Response(JSON.stringify({ error: 'Please enter your name.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!comment || comment.length < 10) {
      return new Response(JSON.stringify({ error: 'Please share at least a short sentence regarding your experience.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const env = await getCloudflareEnv();

    // 4. Save Testimonial as 'pending' with showOnHomepage: false (awaiting Admin approval)
    const newTestimonial = await addTestimonialAsync({
      clientName,
      comment,
      highlight: highlight || comment.slice(0, 80) + '...',
      eventType,
      venue,
      location,
      rating,
      email,
      phone,
      status: 'pending',
      showOnHomepage: false,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }, env);

    const response = new Response(JSON.stringify({
      success: true,
      message: 'Thank you for sharing your experience! Your review has been received and will appear on the website once verified by our concierge.',
      testimonial: newTestimonial
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

    applySecurityHeaders(response.headers);
    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error processing feedback' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
