import type { APIRoute } from 'astro';
import { getCategoriesAsync, addCategoryAsync, saveStoreAsync, getStoreAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const env = await getCloudflareEnv();
    const cats = await getCategoriesAsync(env);
    return new Response(JSON.stringify(cats), {
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
    const env = await getCloudflareEnv();
    const authed = await isAuthenticated(request, env);
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { id, label, kannadaLabel, emoji, description } = body;

    if (!label) {
      return new Response(JSON.stringify({ error: 'Category label is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const categoryId = id ? id.toLowerCase().replace(/[^a-z0-9-]/g, '-') : label.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const newCat = await addCategoryAsync({
      id: categoryId,
      label: label.trim(),
      kannadaLabel: kannadaLabel?.trim() || '',
      emoji: emoji?.trim() || '📸',
      description: description?.trim() || ''
    }, env);

    return new Response(JSON.stringify({ success: true, category: newCat }), {
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
    if (Array.isArray(body)) {
      const store = await getStoreAsync(env);
      store.categories = body;
      await saveStoreAsync(store, env);
      return new Response(JSON.stringify({ success: true, categories: store.categories }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Expected array of categories' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
