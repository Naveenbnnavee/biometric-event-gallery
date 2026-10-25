import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated, setRuntimeAuthEnv } from './lib/auth';
import { setRuntimeDbEnv, initStoreFromKV } from './lib/db';
import { getCloudflareEnv } from './lib/cloudflare';
import { getClientIp, checkRateLimit, createRateLimitResponse, applySecurityHeaders } from './lib/security';

export const onRequest = defineMiddleware(async (context, next) => {
  const env = await getCloudflareEnv();

  if (env) {
    setRuntimeAuthEnv(env);
    setRuntimeDbEnv(env);

    // If Cloudflare KV binding is present, ensure store is primed
    const kv = env.FH_STUDIO_KV || env.STUDIO_KV || env.SESSION;
    if (kv) {
      await initStoreFromKV(kv);
    }
  }

  const url = new URL(context.request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  // 1. Global API Protection: Prevent abusive flooding (max 120 calls per 60s per IP)
  if (path.startsWith('/api')) {
    const clientIp = getClientIp(context.request);
    const globalRate = checkRateLimit(`global_api:${clientIp}`, 120, 60);
    if (!globalRate.allowed) {
      const rateResp = createRateLimitResponse(globalRate, 'Excessive API requests detected. Please slow down.');
      applySecurityHeaders(rateResp.headers);
      return rateResp;
    }
  }

  // 2. Access Control for /admin routes
  if (path.startsWith('/admin')) {
    const authed = await isAuthenticated(context.request, env);

    if (path === '/admin/login') {
      if (authed) {
        return context.redirect('/admin');
      }
    } else if (!authed) {
      // All other /admin routes require valid authentication
      return context.redirect('/admin/login');
    }
  }

  // 3. Process Request
  const response = await next();

  // 4. Apply OWASP Best-Practice Security Headers to all responses
  applySecurityHeaders(response.headers);

  return response;
});
