import type { APIRoute } from 'astro';
import { getPortfolioItemsAsync, addPortfolioItemAsync } from '../../../lib/db';
import { isAuthenticated } from '../../../lib/auth';
import { getCloudflareEnv } from '../../../lib/cloudflare';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const env = await getCloudflareEnv();
    const category = url.searchParams.get('category');
    const placement = url.searchParams.get('placement');
    const featuredOnly = url.searchParams.get('featured') === 'true';

    let items = await getPortfolioItemsAsync(env);

    if (category && category !== 'all') {
      items = items.filter(i => i.category === category);
    }

    if (placement) {
      if (placement === 'heroSlider') {
        items = items.filter(i => i.placements?.heroSlider);
      } else if (placement === 'instantDeck') {
        items = items.filter(i => i.placements?.instantDeck);
      } else if (placement === 'portfolioGrid') {
        items = items.filter(i => i.placements?.portfolioGrid);
      } else if (placement === 'clientStories') {
        items = items.filter(i => i.placements?.clientStories);
      } else if (placement === 'beforeAfterSlider') {
        items = items.filter(i => i.placements?.beforeAfterSlider);
      }
    }

    if (featuredOnly) {
      items = items.filter(i => i.placements?.instantDeck);
    }

    return new Response(JSON.stringify(items), {
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
    const {
      title,
      image,
      category,
      categoryLabel,
      venue,
      location,
      altText,
      aspectRatio,
      aspect,
      placements,
      headline,
      subline,
      beforeImage,
      displayOrder,
      featured,
      featuredInInstantDeck,
      deckBadge
    } = body;

    if (!title || !image || !category) {
      return new Response(JSON.stringify({ error: 'Title, Image URL, and Category are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resolvedPlacements = placements || {
      heroSlider: Boolean(body.heroSlider),
      instantDeck: typeof featuredInInstantDeck === 'boolean' ? featuredInInstantDeck : Boolean(body.instantDeck),
      portfolioGrid: body.portfolioGrid !== undefined ? Boolean(body.portfolioGrid) : true,
      clientStories: Boolean(body.clientStories),
      beforeAfterSlider: Boolean(body.beforeAfterSlider)
    };

    const newItem = await addPortfolioItemAsync({
      title: title.trim(),
      image: image.trim(),
      category: category.trim(),
      categoryLabel: categoryLabel || category,
      venue: venue?.trim() || 'Heritage Venue',
      location: location?.trim() || 'Karnataka, India',
      aspectRatio: aspectRatio || aspect || 'portrait',
      aspect: aspect || aspectRatio || 'portrait',
      altText: altText?.trim() || `${title} by Frames By Hithu`,
      placements: resolvedPlacements,
      headline: headline?.trim() || title.trim(),
      subline: subline?.trim() || venue?.trim() || '',
      beforeImage: beforeImage?.trim() || undefined,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      featured: typeof featured === 'boolean' ? featured : resolvedPlacements.instantDeck,
      featuredInInstantDeck: resolvedPlacements.instantDeck,
      deckBadge: deckBadge?.trim() || undefined
    }, env);

    return new Response(JSON.stringify({ success: true, item: newItem }), {
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
