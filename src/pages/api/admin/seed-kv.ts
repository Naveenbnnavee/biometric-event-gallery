import type { APIRoute } from 'astro';
import { isAuthenticated, setRuntimeAuthEnv } from '../../../lib/auth';
import { getStore, getKVBinding, setRuntimeDbEnv, saveStoreAsync } from '../../../lib/db';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = await getCloudflareEnv();
    if (env) {
      setRuntimeAuthEnv(env);
      setRuntimeDbEnv(env);
    }

    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin credentials required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const currentStore = getStore(env);
    const kv = getKVBinding(env);

    if (kv) {
      await kv.put('studio_store', JSON.stringify(currentStore));
      return new Response(JSON.stringify({
        success: true,
        target: 'Cloudflare KV (FH_STUDIO_KV)',
        message: 'Successfully seeded Cloudflare KV namespace with studio data.',
        stats: {
          portfolioItems: currentStore.portfolio.length,
          categories: currentStore.categories.length,
          clientGalleries: currentStore.clients.length,
          studioName: currentStore.settings.studioName
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Local development fallback
    await saveStoreAsync(currentStore, env);
    return new Response(JSON.stringify({
      success: true,
      target: 'Local Filesystem (data/store.json)',
      message: 'Local store synced successfully.',
      stats: {
        portfolioItems: currentStore.portfolio.length,
        categories: currentStore.categories.length,
        clientGalleries: currentStore.clients.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to seed KV' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
