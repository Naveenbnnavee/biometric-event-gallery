export interface Story {
  slug: string;
  title: string;
  coupleOrFamily: string;
  ceremonyType: string;
  location: string;
  venue: string;
  date: string;
  coverImage: string;
  heroHeadline: string;
  summary: string;
  synopsis: string[];
  gallery: {
    image: string;
    caption: string;
    aspect: 'portrait' | 'landscape';
  }[];
  quote: {
    text: string;
    author: string;
  };
}

export const stories: Story[] = [
  {
    slug: 'ananya-rohit-bangalore-palace',
    title: 'The Royal Heritage Wedding',
    coupleOrFamily: 'Ananya & Rohit',
    ceremonyType: 'Grand Karnataka Wedding & Reception',
    location: 'Bengaluru',
    venue: 'Bangalore Palace, Sheesh Mahal Grounds',
    date: 'February 2026',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bangalore_Palace.jpg/1280px-Bangalore_Palace.jpg',
    heroHeadline: 'Timeless Tudor Opulence Meets Vedic Karnataka Traditions',
    summary: 'A breathtaking celebration spread across three sunlit days at the iconic Bangalore Palace grounds, merging ancient Brahmin Vedic rituals with regal evening grandeur.',
    synopsis: [
      'The morning began with the sacred Kashi Yatra and early morning Varapooja under the ancient Tudor arches of the palace grounds. Soft sandalwood incense mingled with morning dew as the Shehnai melodies echoed across the stone courtyards.',
      'During the Muhurtham hour, as family elders gathered around the sacred Homa, our lenses focused on the unguarded glances—the tear in a mother’s eye, the sudden joyous laughter as Rohit playfully competed during the Kanya Daana, and the glowing radiance of Ananya’s heirloom Kanjeevaram sari.',
      'As twilight descended, the Sheesh Mahal transformed into a warm candlelit amphitheatre with thousands of fairy lights cascading from century-old banyan trees, framing the grand reception with cinematic depth.'
    ],
    gallery: [
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bangalore_Palace.jpg/1280px-Bangalore_Palace.jpg',
        caption: 'The sacred Mangalya Dharana solemnized amidst showers of yellow akshathe blessings.',
        aspect: 'portrait'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Pooja_during_Hindu_wedding.jpg',
        caption: 'Traditional Jeerada Bella moment atop the ornate floral mandapam.',
        aspect: 'landscape'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/The_Bangalore_Palace.jpg/1280px-The_Bangalore_Palace.jpg',
        caption: 'Heirloom temple jewellery and crimson silk bridal portrait.',
        aspect: 'landscape'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bangalore_Palace_4903.jpg/1280px-Bangalore_Palace_4903.jpg',
        caption: 'Unrehearsed joyous laughter during the Sapthapadi circumambulation.',
        aspect: 'portrait'
      }
    ],
    quote: {
      text: 'Frames By Hithu did not just photograph our wedding; they captured the invisible emotional soul of our families. Looking through our album feels like reliving every holy chant and heartbeat.',
      author: 'Ananya & Rohit'
    }
  },
  {
    slug: 'kavya-vikram-mysore-muhurtham',
    title: 'A Vedic Dawn Muhurtham',
    coupleOrFamily: 'Kavya & Vikram',
    ceremonyType: 'Traditional Mysuru Heritage Muhurtham',
    location: 'Mysuru',
    venue: 'Lalitha Mahal Palace Heritage Courtyard',
    date: 'January 2026',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Lalitha_Mahal_Palace_Hotel.jpg/1280px-Lalitha_Mahal_Palace_Hotel.jpg',
    heroHeadline: 'Royal Heritage Echoes & Golden Morning Light in the City of Palaces',
    summary: 'Infused with royal Mysuru heritage, authentic Chamundeshwari blessings, and classical Carnatic Nadaswaram, this muhurtham was poetry frozen in time.',
    synopsis: [
      'Mysuru weddings hold an unmistakable quiet dignity. At 5:30 AM, while mist rolled over the Chamundi foothills, the Nadaswaram announced the beginning of Kavya’s Gowri Pooja in the palace courtyard.',
      'The morning golden light illuminated the intricate pure gold zari weaves of the bride’s traditional Mysore silk. We utilized low-light fast prime lenses to maintain the sanctity of the Vedic homa without intrusive flash bursts.',
      'Every tradition—from the playful Oonjal (swing) songs to the sacred Tali tying—was documented unobtrusively, preserving the genuine reverence of the elders.'
    ],
    gallery: [
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Lalitha_Mahal_Palace_Hotel.jpg/1280px-Lalitha_Mahal_Palace_Hotel.jpg',
        caption: 'Morning sunbeams illuminating hand-woven Mysore silk zari.',
        aspect: 'landscape'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Diya%2C_an_oil_lamp.jpg',
        caption: 'The sacred Kalasha and Vedic fire offerings.',
        aspect: 'portrait'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Mysore_Palace_Morning.jpg/1280px-Mysore_Palace_Morning.jpg',
        caption: 'Generational blessings from the maternal grandmother.',
        aspect: 'landscape'
      }
    ],
    quote: {
      text: 'Their team understands South Indian rituals like family members. No directions or disruptions—just pure, artistic witnessing of our heritage.',
      author: 'Kavya & Vikram'
    }
  },
  {
    slug: 'sharma-family-gruhapravesham',
    title: 'Sacred Beginnings: Gruhapravesham',
    coupleOrFamily: 'The Sharma Family',
    ceremonyType: 'Vedic Gruhapravesham & Vastu Shanti',
    location: 'Bengaluru',
    venue: 'Prestige Golfshire, North Bengaluru',
    date: 'December 2025',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Pooja_materials_for_Hindu_rituals.jpg',
    heroHeadline: 'Welcoming Auspicious Energies into an Architectural Marvel',
    summary: 'A pristine blend of modern minimalist architecture and timeless Sanatana rituals: Gau Pooja, Halu Ubbisuvudu (milk boiling), and Navagraha Homa.',
    synopsis: [
      'Building a dream home takes decades of love and devotion. Capturing its consecration requires both an architectural eye and deep reverence for Vedic ceremonies.',
      'The ceremony commenced before dawn with the threshold Torana decoration made of freshly strung mango leaves and fragrant Sevanti flowers. The sacred cow and calf entered first, surrounded by family chanting Sri Suktam.',
      'The triumphant overflow of boiling milk in a gleaming antique brass vessel symbolized boundless prosperity, captured in razor-sharp high-speed detail with our signature warm grade.'
    ],
    gallery: [
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Indian_home_pooja.jpg',
        caption: 'The threshold decorated with rangoli powder and marigold garlands.',
        aspect: 'landscape'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Pooja_materials_for_Hindu_rituals.jpg',
        caption: 'The auspicious Halu Ubbisuvudu milk boiling moment.',
        aspect: 'portrait'
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Diya%2C_an_oil_lamp.jpg',
        caption: 'Navagraha Homa sparks rising towards the sunlit courtyard atrium.',
        aspect: 'portrait'
      }
    ],
    quote: {
      text: 'Our housewarming memories look like an international architecture editorial steeped in divine Indian devotion. Frames By Hithu is unmatched in Karnataka.',
      author: 'Dr. Suresh & Radhika Sharma'
    }
  }
];
