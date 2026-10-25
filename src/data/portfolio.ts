import { getPortfolioItems, getCategories, getInstantDeckPhotos } from '../lib/db';

export interface InstantDeckCard {
  id: string;
  title: string;
  caption: string;
  location: string;
  venue: string;
  image: string;
  badge: string;
}

export interface InstantDeckCategory {
  id: string;
  label: string;
  kannadaLabel: string;
  emoji: string;
  cards: InstantDeckCard[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  location: string;
  venue: string;
  image: string;
  aspect: 'portrait' | 'landscape' | 'square';
  caption: string;
  featured: boolean;
  rawImage?: string;
}

/**
 * Dynamically builds instant decks directly from the database (data/store.json / KV).
 * When photos are added, edited, or reordered in /admin/portfolio,
 * this immediately reflects those database changes without hardcoding.
 */
export function getDynamicInstantDecks(): InstantDeckCategory[] {
  const dbInstantPhotos = getInstantDeckPhotos();
  const dbCategories = getCategories();

  return dbCategories.map(cat => {
    const matchingPhotos = dbInstantPhotos.filter(p => p.category === cat.id);
    return {
      id: cat.id,
      label: cat.label,
      kannadaLabel: cat.kannadaLabel,
      emoji: cat.emoji,
      cards: matchingPhotos.map((p, idx) => ({
        id: p.id,
        title: p.title,
        caption: p.subline || p.headline || p.title,
        location: p.location || 'Karnataka, India',
        venue: p.venue || 'Heritage Venue',
        image: p.image,
        badge: p.deckBadge || (idx === 0 ? 'Muhurtham Finery' : 'Fine-Art Moment')
      }))
    };
  }).filter(deck => deck.cards.length > 0);
}

/**
 * Dynamically retrieves portfolio items directly from the database.
 */
export function getDynamicPortfolioItems(): PortfolioItem[] {
  return getPortfolioItems().map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    categoryLabel: p.categoryLabel || p.category,
    location: p.location || 'Karnataka, India',
    venue: p.venue || 'Heritage Venue',
    image: p.image,
    aspect: (p.aspectRatio || p.aspect || 'portrait') as 'portrait' | 'landscape' | 'square',
    caption: p.subline || p.headline || p.title,
    featured: Boolean(p.featured),
    rawImage: p.beforeImage || p.image
  }));
}

// Proxied exports so any existing component importing `instantDecks` or `portfolioItems`
// receives live data dynamically fetched from the database rather than hardcoded URLs.
export const instantDecks: InstantDeckCategory[] = new Proxy([] as InstantDeckCategory[], {
  get(_target, prop) {
    const live = getDynamicInstantDecks();
    if (prop === 'length') return live.length;
    if (prop === Symbol.iterator) return live[Symbol.iterator].bind(live);
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return live[Number(prop)];
    }
    const val = (live as any)[prop];
    return typeof val === 'function' ? val.bind(live) : val;
  }
});

export const portfolioItems: PortfolioItem[] = new Proxy([] as PortfolioItem[], {
  get(_target, prop) {
    const live = getDynamicPortfolioItems();
    if (prop === 'length') return live.length;
    if (prop === Symbol.iterator) return live[Symbol.iterator].bind(live);
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return live[Number(prop)];
    }
    const val = (live as any)[prop];
    return typeof val === 'function' ? val.bind(live) : val;
  }
});

export const portfolioCategories = [
  { id: 'all', label: 'All Celebrations', kannadaLabel: 'ಎಲ್ಲಾ' },
  { id: 'weddings', label: 'Weddings & Muhurtham', kannadaLabel: 'ವಿವಾಹ' },
  { id: 'housewarming', label: 'Gruhapravesham', kannadaLabel: 'ಗೃಹಪ್ರವೇಶ' },
  { id: 'pre-wedding', label: 'Pre-Wedding', kannadaLabel: 'ಪೂರ್ವ-ವಿವಾಹ' },
  { id: 'poojas-rituals', label: 'Poojas & Sacred Rites', kannadaLabel: 'ಧಾರ್ಮಿಕ ಪೂಜೆ' },
  { id: 'milestones', label: 'Family Milestones', kannadaLabel: 'ಸೀಮಂತ' }
];
