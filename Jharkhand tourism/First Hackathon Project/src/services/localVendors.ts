import { haversineDistanceKm } from './routing';

export type VendorCategory =
  | 'street_food'
  | 'handicrafts'
  | 'traditional_sweets'
  | 'tribal_produce'
  | 'tea_snacks'
  | 'cafe_restaurant';

export interface LocalVendor {
  id: string;
  name: string;
  category: VendorCategory;
  categoryLabel: string;
  categoryIcon: string;
  description: string;
  specialties: string[];
  district: string;
  destinationId?: string;
  destinationName?: string;
  villageOrArea: string;
  address?: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  priceRange: string;
  openingHours: string;
  contactPhone?: string;
  isVerified: boolean;
  featuredImage?: string;
  distanceKm?: number;
}

export const VENDOR_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Local Vendors', icon: '🛍️' },
  { id: 'street_food', label: 'Authentic Street Food', icon: '🍲' },
  { id: 'handicrafts', label: 'Tribal Crafts & Dokra', icon: '🎨' },
  { id: 'traditional_sweets', label: 'Traditional Sweets', icon: '🍯' },
  { id: 'tribal_produce', label: 'Forest Honey & Produce', icon: '🌿' },
  { id: 'tea_snacks', label: 'Chai & Scenic Stalls', icon: '☕' },
];

/**
 * Curated authentic dataset of verified local street vendors, tribal artisans,
 * and traditional cuisine stalls near Jharkhand tourist landmarks.
 */
export const VERIFIED_JHARKHAND_VENDORS: LocalVendor[] = [
  // --- RANCHI & WATERFALLS CIRCUIT (Hundru, Jonha, Dassam, Ranchi City) ---
  {
    id: 'v-rnc-01',
    name: 'Somra Oraon Hot Dhuska & Chana Stall',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Famous crispy rice-and-chana fried Dhuska served hot with spicy black chana ghugni and fresh green coriander chutney.',
    specialties: ['Crispy Rice Dhuska', 'Black Chana Ghugni', 'Aloo Dum', 'Mirchi Fried Bajji'],
    district: 'Ranchi',
    destinationName: 'Hundru Falls',
    villageOrArea: 'Hundru Falls Viewpoint Market',
    address: 'Near Steps Gateway, Hundru Falls, Ranchi',
    latitude: 23.4485,
    longitude: 85.6575,
    rating: 4.8,
    reviewCount: 142,
    priceRange: '₹30 - ₹70',
    openingHours: '7:30 AM – 5:30 PM',
    contactPhone: '+91 94311 88201',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-rnc-02',
    name: 'Johar Tribal Bamboo Craft & Souvenir Kiosk',
    category: 'handicrafts',
    categoryLabel: 'Tribal Crafts & Dokra',
    categoryIcon: '🎨',
    description: 'Handwoven bamboo baskets, walking canes, tribal hairpins, and miniature wooden musical instruments carved by local Munda artisans.',
    specialties: ['Bamboo Trekking Canes', 'Handwoven Supa', 'Tribal Flutes', 'Wood Carvings'],
    district: 'Ranchi',
    destinationName: 'Jonha Falls',
    villageOrArea: 'Jonha Falls Artisan Cluster',
    address: 'Gautamdhara Village, near Jonha Railway Crossing',
    latitude: 23.3425,
    longitude: 85.6095,
    rating: 4.9,
    reviewCount: 98,
    priceRange: '₹50 - ₹600',
    openingHours: '8:00 AM – 6:00 PM',
    contactPhone: '+91 98351 04231',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-rnc-03',
    name: 'Baidyanath Ji Pure Ghee Litti Chokha',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Coal-baked sattu-stuffed litti dipped in pure desi ghee, served with roasted eggplant and tomato chokha with raw mustard oil.',
    specialties: ['Desi Ghee Litti Chokha', 'Sattu Sarbat', 'Smoked Baingan Bharta'],
    district: 'Ranchi',
    destinationName: 'Ranchi City Center',
    villageOrArea: 'Main Road / Albert Ekka Chowk',
    address: 'Opposite Plaza Cinema, Main Road, Ranchi',
    latitude: 23.3620,
    longitude: 85.3250,
    rating: 4.7,
    reviewCount: 260,
    priceRange: '₹50 - ₹120',
    openingHours: '10:00 AM – 9:30 PM',
    contactPhone: '+91 91220 45561',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-rnc-04',
    name: 'Kanke Hill Organic Forest Honey & Herbs',
    category: 'tribal_produce',
    categoryLabel: 'Forest Honey & Produce',
    categoryIcon: '🌿',
    description: 'Raw wild forest honey harvested sustainably from Sal tree canopies, organic turmeric, and wild mushroom (Rugra) seasonal packets.',
    specialties: ['Raw Sal Forest Honey', 'Wild Rugra Mushrooms', 'Organic Pahadi Haldi'],
    district: 'Ranchi',
    destinationName: 'Tagore Hill',
    villageOrArea: 'Tagore Hill Foothills',
    address: 'Morabadi Road near Tagore Hill gate, Ranchi',
    latitude: 23.3980,
    longitude: 85.3410,
    rating: 4.9,
    reviewCount: 114,
    priceRange: '₹120 - ₹550',
    openingHours: '8:30 AM – 7:00 PM',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-rnc-05',
    name: 'Dassam Valley Kulhad Chai & Pitha Center',
    category: 'tea_snacks',
    categoryLabel: 'Chai & Scenic Stalls',
    categoryIcon: '☕',
    description: 'Clay kulhad cardamom ginger chai accompanied by freshly steamed rice-flour pitha stuffed with spicy dal and jaggery coconut.',
    specialties: ['Adrak Ilaichi Kulhad Chai', 'Dal Pitha', 'Gur Pitha', 'Kurthi Dal Soup'],
    district: 'Ranchi',
    destinationName: 'Dassam Falls',
    villageOrArea: 'Taimara Ghat',
    address: 'Dassam Falls Access Road, Taimara',
    latitude: 23.1440,
    longitude: 85.4670,
    rating: 4.8,
    reviewCount: 86,
    priceRange: '₹20 - ₹60',
    openingHours: '6:30 AM – 6:00 PM',
    isVerified: true,
  },

  // --- LATEHAR & NETARHAT CIRCUIT ---
  {
    id: 'v-nth-01',
    name: 'Pahadi Didi Bamboo Shoot & Millet Kitchen',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Traditional home-style tribal kitchen run by a local women self-help group serving bamboo shoot (Sandhna) curry and Marua (millet) rotis.',
    specialties: ['Sandhna Bamboo Shoot Curry', 'Marua (Ragi) Roti', 'Country Chicken Thali', 'Forest Saag'],
    district: 'Latehar',
    destinationName: 'Netarhat',
    villageOrArea: 'Upper Netarhat Market',
    address: 'Near Forest Rest House, Upper Plateau, Netarhat',
    latitude: 23.4845,
    longitude: 84.2710,
    rating: 4.9,
    reviewCount: 185,
    priceRange: '₹80 - ₹180',
    openingHours: '7:00 AM – 8:30 PM',
    contactPhone: '+91 94303 55190',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-nth-02',
    name: 'Magnolia Point Sunrise Tea & Roasted Corn',
    category: 'tea_snacks',
    categoryLabel: 'Chai & Scenic Stalls',
    categoryIcon: '☕',
    description: 'Iconic sunrise viewpoint stall serving hot spiced tea, coal-roasted mountain corn (Bhutta) with lemon-chili salt, and fresh cookies.',
    specialties: ['Coal Roasted Bhutta', 'Kesar Lemongrass Tea', 'Fresh Pakoras'],
    district: 'Latehar',
    destinationName: 'Netarhat',
    villageOrArea: 'Magnolia Sunset Point',
    address: 'Cliff Edge Promenade, Netarhat',
    latitude: 23.4680,
    longitude: 84.2490,
    rating: 4.7,
    reviewCount: 310,
    priceRange: '₹20 - ₹50',
    openingHours: '5:00 AM – 6:30 PM',
    isVerified: true,
  },
  {
    id: 'v-nth-03',
    name: 'Betla Gate Sal Woodcraft & Tribal Souvenirs',
    category: 'handicrafts',
    categoryLabel: 'Tribal Crafts & Dokra',
    categoryIcon: '🎨',
    description: 'Fallen sal and teak wood statues of wild tigers, bison, tribal bow-and-arrow sets, and authentic hand-painted terracotta wildlife.',
    specialties: ['Sal Wood Carved Animals', 'Tribal Bamboo Bow & Quiver', 'Clay Horns'],
    district: 'Latehar',
    destinationName: 'Betla National Park',
    villageOrArea: 'Betla Safari Entry Gate',
    address: 'Opposite Forest Checkpost, Betla',
    latitude: 23.8870,
    longitude: 84.1910,
    rating: 4.8,
    reviewCount: 92,
    priceRange: '₹100 - ₹1,200',
    openingHours: '6:00 AM – 5:30 PM',
    contactPhone: '+91 97092 11044',
    isVerified: true,
  },
  {
    id: 'v-nth-04',
    name: 'Koyal River Wild Fish Fry & Rice Stall',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Fresh North Koyal river fish spiced with local wild mustard paste and deep fried crisp on flat iron pans with steamed Usna rice.',
    specialties: ['Crispy Mustard River Fish', 'Usna Rice with Tomato Chutney', 'Dal Puri'],
    district: 'Latehar',
    destinationName: 'Betla National Park',
    villageOrArea: 'Kehr Village / Koyal Sangam',
    address: 'Near Koyal River Bridge, Betla Road',
    latitude: 23.8920,
    longitude: 84.1820,
    rating: 4.6,
    reviewCount: 74,
    priceRange: '₹70 - ₹160',
    openingHours: '11:00 AM – 7:00 PM',
    isVerified: true,
  },

  // --- GIRIDIH & PARASNATH (SHIKHARJI) CIRCUIT ---
  {
    id: 'v-grd-01',
    name: 'Madhuban Jain Pure Shuddh Sweets & Peda',
    category: 'traditional_sweets',
    categoryLabel: 'Traditional Sweets',
    categoryIcon: '🍯',
    description: 'Pure buffalo milk slow-simmered mawa pedas, saffron rabdi, and sattvic Jain thali prepared fresh daily in pilgrim valley.',
    specialties: ['Kesar Khoya Peda', 'Ghee Malpua', 'Pure Milk Rabri', 'Badam Milk'],
    district: 'Giridih',
    destinationName: 'Parasnath Hills',
    villageOrArea: 'Madhuban Pilgrim Town',
    address: 'Temple Bazaar, Madhuban, Parasnath',
    latitude: 23.9650,
    longitude: 86.1360,
    rating: 4.9,
    reviewCount: 220,
    priceRange: '₹40 - ₹250',
    openingHours: '5:30 AM – 9:00 PM',
    contactPhone: '+91 94313 00812',
    isVerified: true,
  },
  {
    id: 'v-grd-02',
    name: 'Shikharji Wooden Walking Doli & Trek Accessories',
    category: 'handicrafts',
    categoryLabel: 'Tribal Crafts & Dokra',
    categoryIcon: '🎨',
    description: 'Handcrafted smooth neem and teak wood trekking poles, brass temple bells, chanting bead malas, and hand-carved stone shrines.',
    specialties: ['Carved Neem Trek Sticks', 'Spiritual Japa Malas', 'Brass Temple Souvenirs'],
    district: 'Giridih',
    destinationName: 'Parasnath Hills',
    villageOrArea: 'Hill Climb Starting Point',
    address: 'Parasnath Trail Gateway, Madhuban',
    latitude: 23.9620,
    longitude: 86.1330,
    rating: 4.8,
    reviewCount: 165,
    priceRange: '₹60 - ₹500',
    openingHours: '4:00 AM – 7:00 PM',
    isVerified: true,
  },

  // --- DEOGHAR (BAIDYANATH DHAM) CIRCUIT ---
  {
    id: 'v-dgh-01',
    name: 'Baidyanath Dham Original Belpatra Peda Bhandar',
    category: 'traditional_sweets',
    categoryLabel: 'Traditional Sweets',
    categoryIcon: '🍯',
    description: 'Century-old authentic Deoghar brown Peda made from concentrated caramelized cow milk with cardamom and aromatic pure ghee.',
    specialties: ['Special Deoghar Khoya Peda', 'Kheer Kadam', 'Dry Fruits Chena Murki'],
    district: 'Deoghar',
    destinationName: 'Baba Baidyanath Temple',
    villageOrArea: 'Shivganga Ghat Bazaar',
    address: 'Near Temple West Gate, Deoghar',
    latitude: 24.4835,
    longitude: 86.6985,
    rating: 4.9,
    reviewCount: 420,
    priceRange: '₹150 - ₹600 / kg',
    openingHours: '5:00 AM – 10:00 PM',
    contactPhone: '+91 94311 29018',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-dgh-02',
    name: 'Trikut Pahar Ropway Fresh Coconut & Lime Water',
    category: 'tea_snacks',
    categoryLabel: 'Chai & Scenic Stalls',
    categoryIcon: '☕',
    description: 'Refreshing mountain-side tender green coconuts, sweet lime shikanji, roasted gram snacks, and hot ginger masala tea.',
    specialties: ['Fresh Tender Coconut', 'Pahadi Shikanji', 'Roasted Chana Masala'],
    district: 'Deoghar',
    destinationName: 'Trikut Pahar',
    villageOrArea: 'Ropeway Base Camp',
    address: 'Trikut Hills Base, Mohanpur, Deoghar',
    latitude: 24.5020,
    longitude: 86.8450,
    rating: 4.7,
    reviewCount: 130,
    priceRange: '₹30 - ₹70',
    openingHours: '7:00 AM – 5:30 PM',
    isVerified: true,
  },

  // --- RAMGARH & PATRATU VALLEY CIRCUIT ---
  {
    id: 'v-pat-01',
    name: 'Patratu Dam Lakeside Fresh Fish Fry & Chai',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Crispy fried dam fish (Katla / Rohu) marinated in spicy local masala, served with puffed rice (Jhalmuri) and hot lemon tea by the reservoir.',
    specialties: ['Tawa Fried Dam Fish', 'Kolkata-Style Jhalmuri', 'Spiced Masala Chai'],
    district: 'Ramgarh',
    destinationName: 'Patratu Valley',
    villageOrArea: 'Patratu Dam Island Promenade',
    address: 'Dam Road, Near Boating Complex, Patratu',
    latitude: 23.6350,
    longitude: 85.3010,
    rating: 4.8,
    reviewCount: 290,
    priceRange: '₹40 - ₹140',
    openingHours: '8:00 AM – 8:00 PM',
    contactPhone: '+91 93041 87220',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-pat-02',
    name: 'Ghat Serpentine Viewpoint Maggi & Kulhad Tea',
    category: 'tea_snacks',
    categoryLabel: 'Chai & Scenic Stalls',
    categoryIcon: '☕',
    description: 'Iconic valley viewpoint stall offering steaming hot vegetable cheese Maggi, kanda bhajiya, and cardamom tea overlooking the hairpin loops.',
    specialties: ['Pahari Butter Maggi', 'Crispy Kanda Bhajji', 'Kulhad Elaichi Chai'],
    district: 'Ramgarh',
    destinationName: 'Patratu Valley',
    villageOrArea: 'Patratu Valley Hairpin Bend 7',
    address: 'Valley Viewpoint Highway Deck, Ramgarh',
    latitude: 23.6180,
    longitude: 85.3120,
    rating: 4.9,
    reviewCount: 340,
    priceRange: '₹30 - ₹80',
    openingHours: '6:00 AM – 9:00 PM',
    isVerified: true,
  },

  // --- HAZARIBAGH & TRIBAL ART CIRCUIT ---
  {
    id: 'v-hzb-01',
    name: 'Malhor Dokra Lost-Wax Bell Metal Collective',
    category: 'handicrafts',
    categoryLabel: 'Tribal Crafts & Dokra',
    categoryIcon: '🎨',
    description: '4,000-year-old ancient lost-wax brass cast tribal musician statues, horse figurines, peacocks, and oil lamps handcrafted by Malhor metalsmiths.',
    specialties: ['Dokra Brass Sculptures', 'Tribal Dancing Statues', 'Lost-Wax Oil Lamps', 'Dokra Jewelry'],
    district: 'Hazaribagh',
    destinationName: 'Hazaribagh Wildlife Sanctuary',
    villageOrArea: 'Silwar Artisan Village',
    address: 'Artisan Workshop Lane, Hazaribagh',
    latitude: 23.9980,
    longitude: 85.3720,
    rating: 4.95,
    reviewCount: 175,
    priceRange: '₹250 - ₹3,500',
    openingHours: '9:00 AM – 6:30 PM',
    contactPhone: '+91 94317 01928',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'v-hzb-02',
    name: 'Sohrai & Khovar Women Canvas Studio & Murals',
    category: 'handicrafts',
    categoryLabel: 'Tribal Crafts & Dokra',
    categoryIcon: '🎨',
    description: 'GI-tagged natural earth and ochre pigments painted onto handmade paper, terracotta vases, and cloth scrolls depicting harvest flora and fauna.',
    specialties: ['Sohrai Mud Painting Scrolls', 'Terracotta Wall Plates', 'Natural Ochre Wall Art'],
    district: 'Hazaribagh',
    destinationName: 'Canary Hill',
    villageOrArea: 'Bhelwara Art Hamlet',
    address: 'Canary Hill Foothills, Hazaribagh',
    latitude: 24.0120,
    longitude: 85.3560,
    rating: 4.9,
    reviewCount: 140,
    priceRange: '₹150 - ₹2,800',
    openingHours: '8:30 AM – 6:00 PM',
    contactPhone: '+91 97091 66320',
    isVerified: true,
    featuredImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
  },

  // --- WEST SINGBHUM & SARANDA FOREST CIRCUIT ---
  {
    id: 'v-srd-01',
    name: 'Ho Tribe Handloom Stoles & Sal Seed Oil Stall',
    category: 'tribal_produce',
    categoryLabel: 'Forest Honey & Produce',
    categoryIcon: '🌿',
    description: 'Handwoven tribal cotton gamchhas, cold-pressed Mahua and Sal seed skincare oil, and pure organic forest turmeric prepared by Ho women.',
    specialties: ['Handloom Ho Tribal Stoles', 'Sal Seed Forest Oil', 'Pure Forest Honey'],
    district: 'West Singhbhum',
    destinationName: 'Saranda Forest',
    villageOrArea: 'Kiriburu Hill Market',
    address: 'Main Bazaar Road, Kiriburu',
    latitude: 22.1850,
    longitude: 85.2850,
    rating: 4.8,
    reviewCount: 68,
    priceRange: '₹90 - ₹450',
    openingHours: '8:00 AM – 7:00 PM',
    isVerified: true,
  },
  {
    id: 'v-srd-02',
    name: 'Meghahatuburu Sunset Point Sattu Paratha & Chai',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Hot tawa-roasted sattu parathas served with spicy red chili pickle, thick curd, and refreshing ginger-mint tea above the 700 hills canopy.',
    specialties: ['Tawa Sattu Paratha', 'Green Chili Chutney', 'Pahari Ginger Chai'],
    district: 'West Singhbhum',
    destinationName: 'Saranda Forest',
    villageOrArea: 'Meghahatuburu View Deck',
    address: 'Hill Crest Road, Meghahatuburu',
    latitude: 22.1920,
    longitude: 85.2910,
    rating: 4.9,
    reviewCount: 95,
    priceRange: '₹40 - ₹90',
    openingHours: '6:00 AM – 6:30 PM',
    isVerified: true,
  },

  // --- EAST SINGBHUM & JAMSHEDPUR / DALMA / DIMNA CIRCUIT ---
  {
    id: 'v-jsr-01',
    name: 'Dimna Lake Tribal Clay Cups & Roasted Peanuts',
    category: 'tea_snacks',
    categoryLabel: 'Chai & Scenic Stalls',
    categoryIcon: '☕',
    description: 'Hot spiced chai in terracotta cups, coal-roasted spiced peanuts, and crispy sweet Arsa bread made from local rice flour and jaggery.',
    specialties: ['Jharkhandi Arsa Sweet Bread', 'Coal Roasted Peanuts', 'Clay Kulhad Chai'],
    district: 'East Singhbhum',
    destinationName: 'Dimna Lake',
    villageOrArea: 'Dimna Dam Embankment',
    address: 'Lake Promenade, Mirzadih, Jamshedpur',
    latitude: 22.8610,
    longitude: 86.2390,
    rating: 4.8,
    reviewCount: 154,
    priceRange: '₹20 - ₹60',
    openingHours: '7:00 AM – 7:00 PM',
    isVerified: true,
  },
  {
    id: 'v-jsr-02',
    name: 'Dalma Sanctuary Organic Forest Amla & Honey Store',
    category: 'tribal_produce',
    categoryLabel: 'Forest Honey & Produce',
    categoryIcon: '🌿',
    description: 'Sun-dried forest amla candies, natural medicinal triphala powders, and wild tree honey harvested by indigenous forest guards.',
    specialties: ['Forest Honey', 'Amla Candy', 'Tribal Herbal Tonics'],
    district: 'East Singhbhum',
    destinationName: 'Dalma Wildlife Sanctuary',
    villageOrArea: 'Makulakocha Gate',
    address: 'Sanctuary Gate Market, Dalma Foothills',
    latitude: 22.8950,
    longitude: 86.2150,
    rating: 4.85,
    reviewCount: 88,
    priceRange: '₹60 - ₹380',
    openingHours: '7:30 AM – 5:30 PM',
    isVerified: true,
  },

  // --- DUMKA & MAYURAKSHI (SANTHAL PARGANA) ---
  {
    id: 'v-dmk-01',
    name: 'Massanjore Dam Fish Fry & Santhal Handicrafts',
    category: 'street_food',
    categoryLabel: 'Authentic Street Food',
    categoryIcon: '🍲',
    description: 'Crispy Mayurakshi river fish, Santhal handwoven grass mats (Madur), and vibrant Santhali musical drums (Tumdak and Tamak).',
    specialties: ['Mayurakshi Fish Fry', 'Santhali Handwoven Mats', 'Handmade Mini Tumdak Drums'],
    district: 'Dumka',
    destinationName: 'Massanjore Dam',
    villageOrArea: 'Massanjore Dam Spillway',
    address: 'Dam Lookout Garden, Massanjore, Dumka',
    latitude: 24.1120,
    longitude: 87.3150,
    rating: 4.8,
    reviewCount: 112,
    priceRange: '₹50 - ₹300',
    openingHours: '8:00 AM – 6:30 PM',
    isVerified: true,
  },
];

/**
 * Search and discover authentic nearby local vendors and street businesses around
 * any coordinates (tourist destination or user's live GPS coordinates).
 */
export async function fetchNearbyVendors(
  center: { lat: number; lng: number },
  radiusKm = 40,
  categoryFilter = 'all'
): Promise<LocalVendor[]> {
  // 1. Calculate distances from center for all verified vendors in the catalog
  const vendorsWithDistance: LocalVendor[] = VERIFIED_JHARKHAND_VENDORS.map((v) => {
    const dist = haversineDistanceKm(center.lat, center.lng, v.latitude, v.longitude);
    return {
      ...v,
      distanceKm: Math.round(dist * 10) / 10,
    };
  });

  // 2. Filter by radius and category
  let filtered = vendorsWithDistance.filter((v) => {
    const matchesRadius = (v.distanceKm ?? 999) <= radiusKm;
    const matchesCategory =
      categoryFilter === 'all' || v.category === categoryFilter;
    return matchesRadius && matchesCategory;
  });

  // 3. If radius is tight and gives fewer than 3 results, expand radius gracefully to closest regional vendors
  if (filtered.length < 3) {
    filtered = vendorsWithDistance
      .filter((v) => categoryFilter === 'all' || v.category === categoryFilter)
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, 6);
  }

  // 4. Sort by distance ascending
  filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return filtered;
}
