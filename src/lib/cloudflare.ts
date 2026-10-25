/**
 * Safely get Cloudflare Workers environment bindings (KV, Secrets, D1).
 * In modern Astro (@astrojs/cloudflare on Astro v5+ / v6+), bindings are imported from 'cloudflare:workers'.
 * In local dev (Node.js/Vite), it falls back to process.env.
 * Note: Never access Astro.locals.runtime.env, as that was deprecated and throws in modern Astro.
 */

let cachedEnv: any = null;

export async function getCloudflareEnv(): Promise<any> {
  if (cachedEnv) return cachedEnv;

  try {
    // @ts-ignore
    const cf = await import('cloudflare:workers');
    if (cf && cf.env) {
      cachedEnv = cf.env;
      return cachedEnv;
    }
  } catch {
    // Non-workerd environment (e.g. Node dev server)
  }

  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }

  return {};
}

export function getSyncCloudflareEnv(): any {
  if (cachedEnv) return cachedEnv;
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  return {};
}
