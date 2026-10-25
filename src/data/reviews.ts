export interface Review {
  id: string;
  clientName: string;
  eventType: string;
  location: string;
  venue: string;
  rating: number;
  date: string;
  comment: string;
  avatar?: string;
  highlight: string;
}

export const reviews: Review[] = [
  {
    id: 'rev-1',
    clientName: 'Deepa & Chethan Hegde',
    eventType: 'Traditional South Indian Wedding',
    location: 'Bengaluru',
    venue: 'Palace Grounds, Bengaluru',
    rating: 5,
    date: 'January 2026',
    highlight: 'Captured our rituals with zero artificial interruptions',
    comment: 'Frames By Hithu is in a league of their own. Most photographers turn sacred Muhurtham into a chaotic photoshoot. Hithu’s team was invisible yet captured the tears during Kanyadaana, the spark of the agni fire, and the exact golden tone of my Kanjeevaram sari. Our luxury album is pure art.'
  },
  {
    id: 'rev-2',
    clientName: 'Sanjay & Meera Rao',
    eventType: 'Vedic Gruhapravesham & Vastu Shanti',
    location: 'Bengaluru',
    venue: 'Sadashivanagar Villa',
    rating: 5,
    date: 'February 2026',
    highlight: 'The Halu Ubbisuvudu and Gau Pooja shots were breathtaking',
    comment: 'We built our home over two years and wanted someone who could capture both the architectural beauty and the Vedic rituals. They arrived at 4:30 AM before sunrise, completely prepared. The milk boiling shot in the brass vessel with steam rising in morning light is framed in our living room!'
  },
  {
    id: 'rev-3',
    clientName: 'Aishwarya & Karthik Shenoy',
    eventType: 'Pre-Wedding & Heritage Muhurtham',
    location: 'Mysuru & Melukote',
    venue: 'Lalitha Mahal Palace',
    rating: 5,
    date: 'December 2025',
    highlight: 'Editorial fine-art aesthetics that look like Vogue Wedding',
    comment: 'From the stone arches of Melukote for our couple portraits to our royal Mysuru wedding, every frame has this warm, glowing editorial tone. No garish oversaturated filters—just timeless, regal Karnataka colors. Worth every single rupee.'
  },
  {
    id: 'rev-4',
    clientName: 'Ramesh & Savitha Kulkarni',
    eventType: 'Upanayana (Sacred Thread Ceremony)',
    location: 'Udupi',
    venue: 'Rathabeedi Mutt Hall',
    rating: 5,
    date: 'November 2025',
    highlight: 'Reverent treatment of Vedic traditions',
    comment: 'Our family elders are very traditional and sensitive about camera crews intruding in mutt sanctums. Hithu’s photographers wore traditional dhotis, respected the priests completely, and still captured world-class candid memories of our son’s initiation.'
  }
];
