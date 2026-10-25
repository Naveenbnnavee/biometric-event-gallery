export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  heroHeadline: string;
  overview: string;
  coverImage: string;
  ritualsCovered: string[];
  deliverables: string[];
  philosophy: string;
  faq: {
    question: string;
    answer: string;
  }[];
}

export const services: Service[] = [
  {
    slug: 'wedding-photography',
    title: 'Weddings & Muhurtham',
    shortDescription: 'Cinematic candid emotion harmonized with reverent Vedic South Indian ritual documentation.',
    heroHeadline: 'Preserving Sacred Unions in Timeless Fine-Art Royalty',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bangalore_Palace.jpg/1280px-Bangalore_Palace.jpg',
    overview: 'Karnataka weddings are a tapestry of Vedic traditions, rich silks, ancestral blessings, and uninhibited celebration. Our wedding commissions are crafted for couples seeking editorial sophistication without compromising the cultural sanctity of sacred rituals like Kanya Daana, Mangalya Dharana, and Sapthapadi.',
    ritualsCovered: [
      'Nandi Pooja & Early Morning Varapooja',
      'Kashi Yatra & Traditional Welcoming',
      'Oonjal (Floral Swing) & Carnatic Songs',
      'Jeerada Bella & Mangalya Dharana Pinnacle',
      'Sapthapadi & Arundhati Nakshatra Darshana',
      'Grand Evening Reception & Candid Afterparty'
    ],
    deliverables: [
      'Bespoke Fine-Art Master Photographers & Cinematographers',
      'Color-Graded High-Resolution Master Gallery with Lifetime Cloud Access',
      'Handcrafted Italian Leatherette Heirloom Flush-Mount Wedding Albums',
      '4K Ultra-HD Cinematic Wedding Film & 60-Second Social Teaser Reel',
      'Full Unedited High-Bitrate Archive on Custom Gold-Plated USB Keepsake'
    ],
    philosophy: 'We believe true wedding photography is discreet. We never interrupt the priest during sacred mantras nor demand artificial poses. Instead, we let the authenticity of your heritage and the spontaneity of your emotions unfold naturally.',
    faq: [
      {
        question: 'How do you formulate a customized quote for our wedding?',
        answer: 'Because every Karnataka wedding is distinct—varying in number of rituals, guest scale, venue lighting, and multi-day schedules—we prepare a bespoke proposal tailored specifically to your requirements after an initial discovery consultation.'
      },
      {
        question: 'Do you cover weddings across all cities in Karnataka?',
        answer: 'Yes. We travel extensively across Bengaluru, Mysuru, Mangaluru, Udupi, Hubballi, Hassan, Shimoga, Coorg, and destination wedding venues throughout South India.'
      },
      {
        question: 'How far in advance should we reserve our wedding dates?',
        answer: 'Auspicious Muhurtham dates in Karnataka are heavily booked up to 6–12 months in advance. We take on a strictly limited number of commissions each season to ensure absolute artistic dedication.'
      }
    ]
  },
  {
    slug: 'pre-wedding-shoots',
    title: 'Pre-Wedding & Couple Essays',
    shortDescription: 'Editorial narrative portraiture set against dramatic heritage architecture and Karnataka landscapes.',
    heroHeadline: 'Romantic Cinema in Heritage Temples and Misty Western Ghats',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Melkote_kalyani.jpg/1280px-Melkote_kalyani.jpg',
    overview: 'Step away from clichéd poses. Our pre-wedding sessions are conceived as cinematic short stories, capturing the genuine connection between two people against dramatic architectural ruins, ancient stepwells, or misty hill plantations.',
    ritualsCovered: [
      'Melukote Stepwells & Raya Gopura Architectural Sessions',
      'Bangalore Palace & Heritage Courtyard Editorial Portraits',
      'Coorg & Chikmagalur Misty Coffee Plantation Escapes',
      'Malpe, Kaup & Gokarna Sunset Coastal Horizons',
      'Urban Architectural & Modern Chic Bengaluru Stories'
    ],
    deliverables: [
      'Personal Creative Direction & Moodboard Styling Consultation',
      'Comprehensive Multi-Look Wardrobe & Lighting Guidance',
      'High-Resolution Retouched Master Portraits for Save-the-Date & Displays',
      'Cinematic 4K 2-Minute Romantic Story Film with Drone Vistas',
      'Complimentary Custom Wooden Keepsake Print Box'
    ],
    philosophy: 'Your pre-wedding shoot should feel like an effortless romantic getaway rather than a high-pressure photoshoot. We guide you gently into natural movement, golden natural light, and quiet laughter.',
    faq: [
      {
        question: 'Do you assist with venue permissions and styling concepts?',
        answer: 'Yes! We advise on ideal permits for Melukote, Coorg estates, or Bangalore Palace, and coordinate wardrobe color palettes that complement the landscape perfectly.'
      },
      {
        question: 'Can we include drone aerial cinematography?',
        answer: 'Yes, licensed 4K aerial drone coverage is integrated into all our outdoor estate and architectural sessions where permissible.'
      }
    ]
  },
  {
    slug: 'housewarming-gruhapravesham',
    title: 'Gruhapravesham & Sacred Sanctuaries',
    shortDescription: 'Documenting the consecration of your dream residence with architectural grandeur and Vedic devotion.',
    heroHeadline: 'Consecrating Your Living Legacy in Warm Golden Hues',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Pooja_materials_for_Hindu_rituals.jpg',
    overview: 'A Gruhapravesham is one of the most auspicious milestones in life. It marks the culmination of architectural dreams and the invocation of divine blessings through Agni, Tulsi, Gau Pooja, and Vastu Homa.',
    ritualsCovered: [
      'Threshold Doorway Rangoli & Mango Leaf Torana Decor',
      'Sacred Cow & Calf Entry (Gau Pooja)',
      'Auspicious Milk Boiling Ritual (Halu Ubbisuvudu)',
      'Navagraha Homa & Vastu Shanti Purificatory Rites',
      'Goddess Lakshmi Invocation & Ganapathi Homam',
      'Architectural Interior & Family Legacy Group Portraits'
    ],
    deliverables: [
      'Specialized Architectural & Low-Light Ceremony Specialists',
      'Crisp High-Speed Capture of the Milk Boiling (Halu Ubbisuvudu) Moment',
      'Wide-Angle Architectural Photographs of Interiors & Landscape',
      'Handmade Premium Coffee-Table Heirloom Album',
      'Prompt 72-Hour Express Digital Sneak-Peek Gallery'
    ],
    philosophy: 'We capture the divine energy of the Vedic fires without washing away the architectural ambiance of your newly built spaces. Our wide-aperture lenses showcase both the intricate pooja details and the clean lines of your architecture.',
    faq: [
      {
        question: 'How early do you arrive for Gruhapravesham ceremonies?',
        answer: 'Because Gau Pooja and threshold rites frequently occur during Brahma Muhurtha (4:30 AM – 6:00 AM), our team arrives 45 minutes prior to ensure all preliminary rituals and decor are captured in pristine lighting.'
      },
      {
        question: 'Do you take formal portraits of all attending relatives and guests?',
        answer: 'Absolutely. We balance sacred documentary ceremony coverage with dedicated formal family portraits in the living spaces.'
      }
    ]
  },
  {
    slug: 'poojas-traditional-rituals',
    title: 'Traditional Poojas & Sacred Rites',
    shortDescription: 'Preserving Upanayana, Satyanarayana Poojas, and family rites with reverence and cultural mastery.',
    heroHeadline: 'The Sacred Soul of Sanatana Dharma Passed Down Generations',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Udupi_Krishna_Temple.jpg/1280px-Udupi_Krishna_Temple.jpg',
    overview: 'From the sacred investiture of the Yajnopavita (Upanayana/Munji) to solemn Ayushya Homas and vibrant Satyanarayana Poojas, these rituals anchor families across Karnataka. We document them with deep respect for every chant and offering.',
    ritualsCovered: [
      'Upanayana / Munji (Brahmopadesha & Gayatri Initiation)',
      'Sri Satyanarayana Swamy Pooja & Vratha Kathas',
      'Seemantha / Baby Shower Traditional Celebrations',
      'Namakarana & Annaprashana Baby Milestones',
      'Shashti Poorthi (60th) & Bheema Ratha Shanti Jubilees'
    ],
    deliverables: [
      'Unobtrusive Master Photographers Versed in Vedic Ceremonies',
      'Full High-Res Curated Digital Collection with Signature Color Grade',
      'Handcrafted Heirloom Keepsake Album for Grandparents & Family',
      'Short Cinematic Highlight Reel with Traditional Carnatic/Vedic Soundtrack',
      'Private Online Gallery for Easy Sharing Across Worldwide Family'
    ],
    philosophy: 'Traditional rituals have their own sacred rhythm. We honor the priests’ space, dress in appropriate traditional ethnic attire, and preserve these priceless spiritual heirlooms for your grandchildren.',
    faq: [
      {
        question: 'Can we book coverage for half-day poojas or multi-session homas?',
        answer: 'Yes. Our bespoke commissions are tailored to the exact duration and rituals of your celebration.'
      },
      {
        question: 'How do you handle low-light mutt or ancestral home environments?',
        answer: 'We utilize ultra-fast f/1.2 and f/1.4 prime cinema lenses that capture rich, atmospheric photographs in natural diya (lamp) light without harsh, jarring flash.'
      }
    ]
  }
];
