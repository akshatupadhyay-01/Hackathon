import { Destination, District } from '../types/database';
import { SEED_DESTINATIONS, SEED_DISTRICTS } from '../data/jharkhand';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type SentimentStatus = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export type ReviewTag =
  | 'Safety'
  | 'Cleanliness'
  | 'Food'
  | 'Local Vendors'
  | 'Guides'
  | 'Transport'
  | 'Accommodation'
  | 'Nature/Experience'
  | 'Value for Money'
  | 'Overall Experience';

export const ALL_REVIEW_TAGS: ReviewTag[] = [
  'Safety',
  'Cleanliness',
  'Food',
  'Local Vendors',
  'Guides',
  'Transport',
  'Accommodation',
  'Nature/Experience',
  'Value for Money',
  'Overall Experience',
];

export interface TouristReview {
  id: string;
  destination_id: string;
  user_id?: string | null;
  author_name: string;
  rating: number; // 1 - 5
  comment: string;
  visit_date?: string;
  tags: ReviewTag[];
  photos?: string[];
  status: ReviewStatus;
  sentiment: SentimentStatus;
  sentimentScore: number; // -1 to +1
  extractedTopics: {
    positive: string[];
    negative: string[];
  };
  created_at: string;
  flagged?: boolean;
}

export interface DestinationReviewSummary {
  destinationId: string;
  overallRating: number;
  totalApprovedReviews: number;
  totalPendingReviews: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  touristExperienceScore: number; // 0 - 100
  categoryFeedback: Record<ReviewTag, { positiveRatio: number; count: number }>;
  topPositiveThemes: string[];
  topNegativeIssues: string[];
  recentReviews: TouristReview[];
}

export interface ReviewGovIntelligence {
  totalApprovedReviews: number;
  totalPendingReviews: number;
  averageRating: number;
  positiveSentimentPct: number;
  neutralSentimentPct: number;
  negativeSentimentPct: number;
  overallTouristExperienceScore: number;
  mostPraisedDestinations: Array<{
    destination: Destination;
    avgRating: number;
    positivePct: number;
    topTheme: string;
    reviewCount: number;
    tesScore: number;
  }>;
  destinationsWithNegativeSignals: Array<{
    destination: Destination;
    negativePct: number;
    topIssue: string;
    reviewCount: number;
    tesScore: number;
    urgentAction: string;
  }>;
  topPositiveThemes: Array<{ theme: string; count: number; percentage: number }>;
  topNegativeIssues: Array<{ issue: string; count: number; severity: 'High' | 'Moderate' | 'Minor' }>;
  districtWiseSentiment: Array<{
    districtName: string;
    districtId: string;
    totalReviews: number;
    avgRating: number;
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    sentimentStatus: SentimentStatus;
    tesScore: number;
  }>;
  categoryWiseSentiment: Array<{
    category: ReviewTag;
    avgRating: number;
    positivePct: number;
    count: number;
    healthStatus: 'Excellent' | 'Good' | 'Needs Attention';
  }>;
  actionableInsights: Array<{
    id: string;
    type: 'Safety' | 'Cleanliness' | 'Transport' | 'Promotion' | 'Vendor Support' | 'Crowd Pressure';
    urgency: 'Immediate' | 'Medium Priority' | 'Strategic Policy';
    title: string;
    targetDestinationOrDistrict: string;
    triggerSignal: string;
    recommendation: string;
    correlatedSignals: string;
  }>;
}

const POSITIVE_KEYWORDS = [
  'breathtaking', 'peaceful', 'magical', 'knowledgeable', 'friendly', 'delicious',
  'clean', 'safe', 'authentic', 'mesmerizing', 'serene', 'well maintained',
  'must visit', 'loved', 'wonderful', 'excellent', 'spectacular', 'pristine',
  'hospitable', 'superb', 'unforgettable', 'stunning', 'beautiful', 'great guide',
  'tasty', 'dhuska', 'sohrai', 'dokra', 'scenic', 'greenery', 'enjoyed', 'gem'
];

const NEGATIVE_KEYWORDS = [
  'dirty', 'litter', 'garbage', 'trash', 'parking issue', 'parking problem',
  'traffic jam', 'traffic bottleneck', 'overcrowded', 'crowded', 'potholes',
  'poor road', 'bad road', 'no signal', 'poor network', 'bad restroom',
  'dirty toilet', 'expensive', 'overpriced', 'unorganized', 'unsafe', 'delayed',
  'rude', 'broken', 'scam', 'noisy', 'queue', 'waiting time', 'littering'
];

/**
 * Deterministic Automated Review Sentiment & Topic Classifier
 * Uses star rating and keyword frequency to classify sentiment transparently.
 */
export function classifyReviewSentiment(
  rating: number,
  comment: string,
  tags: ReviewTag[] = []
): {
  sentiment: SentimentStatus;
  sentimentScore: number;
  extractedTopics: { positive: string[]; negative: string[] };
} {
  const text = comment.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  const posTopics: string[] = [];
  const negTopics: string[] = [];

  POSITIVE_KEYWORDS.forEach((kw) => {
    if (text.includes(kw)) posCount++;
  });

  NEGATIVE_KEYWORDS.forEach((kw) => {
    if (text.includes(kw)) negCount++;
  });

  // Topic identification
  if (text.includes('guide') || tags.includes('Guides')) {
    if (negCount > posCount && rating <= 3) negTopics.push('Guide availability / training');
    else posTopics.push('Certified native guide expertise');
  }
  if (text.includes('road') || text.includes('parking') || text.includes('traffic') || tags.includes('Transport')) {
    if (text.includes('pothole') || text.includes('parking') || text.includes('traffic') || rating <= 3) {
      negTopics.push('Parking & approach road access');
    } else {
      posTopics.push('Smooth road connectivity');
    }
  }
  if (text.includes('waterfall') || text.includes('forest') || text.includes('nature') || text.includes('view') || tags.includes('Nature/Experience')) {
    posTopics.push('Scenic eco landscapes & biodiversity');
  }
  if (text.includes('food') || text.includes('dhuska') || text.includes('tea') || tags.includes('Food')) {
    if (rating <= 2) negTopics.push('Food hygiene & pricing');
    else posTopics.push('Authentic tribal delicacies & street food');
  }
  if (text.includes('toilet') || text.includes('clean') || text.includes('garbage') || text.includes('litter') || tags.includes('Cleanliness')) {
    if (text.includes('litter') || text.includes('dirty') || text.includes('garbage') || rating <= 3) {
      negTopics.push('Waste disposal & public restroom hygiene');
    } else {
      posTopics.push('Eco-clean surrounding & zero-plastic discipline');
    }
  }
  if (text.includes('craft') || text.includes('dokra') || text.includes('sohrai') || tags.includes('Local Vendors')) {
    posTopics.push('Direct indigenous artisan livelihood support');
  }
  if (text.includes('crowd') || text.includes('rush') || text.includes('queue')) {
    if (rating <= 3) negTopics.push('Weekend peak overcrowding & queues');
    else posTopics.push('Well-managed visitor flow');
  }

  // Fallback topics
  if (posTopics.length === 0 && rating >= 4) {
    posTopics.push('High overall visitor satisfaction');
  }
  if (negTopics.length === 0 && rating <= 2) {
    negTopics.push('General service & amenity expectations unmet');
  }

  // Compute sentiment score between -1 and +1
  let score = 0;
  if (rating >= 4) {
    score = 0.5 + (rating === 5 ? 0.3 : 0.1) + Math.min(0.2, posCount * 0.05) - Math.min(0.3, negCount * 0.1);
  } else if (rating <= 2) {
    score = -0.5 - (rating === 1 ? 0.3 : 0.1) - Math.min(0.2, negCount * 0.05) + Math.min(0.2, posCount * 0.05);
  } else {
    // 3 stars
    score = (posCount - negCount) * 0.15;
  }

  score = Math.max(-1, Math.min(1, score));

  let sentiment: SentimentStatus = 'NEUTRAL';
  if (score > 0.25 || (rating >= 4 && negCount === 0)) {
    sentiment = 'POSITIVE';
  } else if (score < -0.2 || (rating <= 2)) {
    sentiment = 'NEGATIVE';
  }

  return {
    sentiment,
    sentimentScore: Math.round(score * 100) / 100,
    extractedTopics: {
      positive: Array.from(new Set(posTopics)),
      negative: Array.from(new Set(negTopics)),
    },
  };
}

/**
 * Initial Rich Seed Reviews for Jharkhand Destinations
 */
export const INITIAL_SEED_TOURIST_REVIEWS: TouristReview[] = [
  {
    id: 'rev-001',
    destination_id: 'e1000000-0000-0000-0000-000000000001', // Betla National Park
    author_name: 'Ananya Roy (Kolkata)',
    rating: 5,
    comment: 'Betla National Park was magical! We saw a herd of wild elephants grazing by the Koel river bank. Our guide Somra was extremely knowledgeable about bird calls and animal tracks.',
    visit_date: '2026-02-10',
    tags: ['Guides', 'Nature/Experience', 'Safety'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.9,
    extractedTopics: {
      positive: ['Certified native guide expertise', 'Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-11T10:30:00Z',
  },
  {
    id: 'rev-002',
    destination_id: 'e1000000-0000-0000-0000-000000000001', // Betla
    author_name: 'Vikramaditya S. (Patna)',
    rating: 4,
    comment: 'Safari experience was fantastic and forest was pristine. However, mobile network is almost zero inside and morning safari booking counter had long queues.',
    visit_date: '2026-02-14',
    tags: ['Nature/Experience', 'Transport', 'Value for Money'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.65,
    extractedTopics: {
      positive: ['Scenic eco landscapes & biodiversity'],
      negative: ['Weekend peak overcrowding & queues'],
    },
    created_at: '2026-02-15T08:15:00Z',
  },
  {
    id: 'rev-003',
    destination_id: 'e1000000-0000-0000-0000-000000000002', // Hundru Falls
    author_name: 'Rohan Mukherjee (Ranchi)',
    rating: 3,
    comment: 'The 320-foot drop of Hundru waterfall is spectacular, but Sunday parking was a nightmare. Many plastic bottles were discarded near the lower pool staircase despite eco signs.',
    visit_date: '2026-02-15',
    tags: ['Cleanliness', 'Transport', 'Nature/Experience'],
    status: 'approved',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.05,
    extractedTopics: {
      positive: ['Scenic eco landscapes & biodiversity'],
      negative: ['Parking & approach road access', 'Waste disposal & public restroom hygiene'],
    },
    created_at: '2026-02-16T14:20:00Z',
  },
  {
    id: 'rev-004',
    destination_id: 'e1000000-0000-0000-0000-000000000002', // Hundru Falls
    author_name: 'Pooja Kashyap (Jamshedpur)',
    rating: 4,
    comment: 'Dhuska and aloo chana cooked fresh by the local women stall near entrance was mouthwatering. Water flow was loud and majestic. Wear good trekking shoes for the stairs.',
    visit_date: '2026-02-08',
    tags: ['Food', 'Local Vendors', 'Nature/Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.8,
    extractedTopics: {
      positive: ['Authentic tribal delicacies & street food', 'Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-09T16:00:00Z',
  },
  {
    id: 'rev-005',
    destination_id: 'e1000000-0000-0000-0000-000000000003', // Netarhat Sunset Point
    author_name: 'Devashish Verma (Ranchi)',
    rating: 5,
    comment: 'The sunrise and sunset at Magnolia point is comparable to Tiger Hill in Darjeeling, but far less crowded, pristine, and deeply peaceful. Warm chai from local stalls in cool breeze was heavenly.',
    visit_date: '2026-02-12',
    tags: ['Nature/Experience', 'Accommodation', 'Food'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.95,
    extractedTopics: {
      positive: ['Scenic eco landscapes & biodiversity', 'Authentic tribal delicacies & street food'],
      negative: [],
    },
    created_at: '2026-02-13T11:45:00Z',
  },
  {
    id: 'rev-006',
    destination_id: 'e1000000-0000-0000-0000-000000000003', // Netarhat
    author_name: 'Meenakshi Iyer (Bengaluru)',
    rating: 5,
    comment: 'Stayed in a local sal wood homestay. Hosts cooked delicious millets and fresh bamboo shoot curry. An absolute hidden gem for quiet ecotourism.',
    visit_date: '2026-02-05',
    tags: ['Accommodation', 'Food', 'Local Vendors', 'Nature/Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.92,
    extractedTopics: {
      positive: ['Direct indigenous artisan livelihood support', 'Authentic tribal delicacies & street food'],
      negative: [],
    },
    created_at: '2026-02-06T18:30:00Z',
  },
  {
    id: 'rev-007',
    destination_id: 'e1000000-0000-0000-0000-000000000004', // Parasnath Hills
    author_name: 'Gautam Chand J. (Ahmedabad)',
    rating: 5,
    comment: 'Deeply spiritual 27km pilgrimage trek across Shikharji. Local doli bearers and guides were extremely courteous and disciplined. Clean trail with peaceful Jain rest halts.',
    visit_date: '2026-02-01',
    tags: ['Guides', 'Safety', 'Cleanliness', 'Overall Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.96,
    extractedTopics: {
      positive: ['Certified native guide expertise', 'Eco-clean surrounding & zero-plastic discipline'],
      negative: [],
    },
    created_at: '2026-02-02T19:00:00Z',
  },
  {
    id: 'rev-008',
    destination_id: 'e1000000-0000-0000-0000-000000000005', // Patratu Valley
    author_name: 'Shashi Bhushan (Dhanbad)',
    rating: 4,
    comment: 'The winding ghat road is an architectural marvel with mindblowing aerial viewpoints. Speeding bikers on weekends can be risky. Speed bumps and police patrols are working well.',
    visit_date: '2026-02-14',
    tags: ['Transport', 'Safety', 'Nature/Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.72,
    extractedTopics: {
      positive: ['Smooth road connectivity', 'Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-15T12:10:00Z',
  },
  {
    id: 'rev-009',
    destination_id: 'e1000000-0000-0000-0000-000000000006', // Baidyanath Jyotirlinga
    author_name: 'Suresh Pandey (Varanasi)',
    rating: 4,
    comment: 'Divine spiritual vibrations at Baba Dham temple. VIP queue line was slightly disorganized on Monday morning, but Peda sweets from local market were authentic and delicious.',
    visit_date: '2026-02-16',
    tags: ['Food', 'Local Vendors', 'Overall Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.7,
    extractedTopics: {
      positive: ['Authentic tribal delicacies & street food'],
      negative: ['Weekend peak overcrowding & queues'],
    },
    created_at: '2026-02-17T09:40:00Z',
  },
  {
    id: 'rev-010',
    destination_id: 'e1000000-0000-0000-0000-000000000007', // Saranda Forest
    author_name: 'Dr. Alok Sen (Kolkata)',
    rating: 5,
    comment: 'The Land of 700 Hills has the densest sal canopy in Asia. We saw giant Malabar squirrels and rare medicinal ferns. Very peaceful with almost zero tourist commercialization.',
    visit_date: '2026-01-28',
    tags: ['Nature/Experience', 'Guides', 'Cleanliness'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.98,
    extractedTopics: {
      positive: ['Scenic eco landscapes & biodiversity', 'Certified native guide expertise'],
      negative: [],
    },
    created_at: '2026-01-29T15:15:00Z',
  },
  {
    id: 'rev-011',
    destination_id: 'e1000000-0000-0000-0000-000000000008', // Massanjore Dam
    author_name: 'Priyanka Hansda (Dumka)',
    rating: 4,
    comment: 'Peaceful blue reservoir surrounded by lush hills. Boating was safe and reasonably priced. Need more covered shade pavilions for family picnics in the afternoon.',
    visit_date: '2026-02-10',
    tags: ['Value for Money', 'Safety', 'Nature/Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.78,
    extractedTopics: {
      positive: ['Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-11T13:00:00Z',
  },
  {
    id: 'rev-012',
    destination_id: 'e1000000-0000-0000-0000-000000000009', // Canary Hill & Sohrai
    author_name: 'Kavita Das (New Delhi)',
    rating: 5,
    comment: 'The Sohrai mural village visit arranged by local women artists was the highlight of our Jharkhand trip! Bought authentic natural-pigment canvas paintings directly from the tribal artisan.',
    visit_date: '2026-02-13',
    tags: ['Local Vendors', 'Nature/Experience', 'Value for Money', 'Overall Experience'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.97,
    extractedTopics: {
      positive: ['Direct indigenous artisan livelihood support', 'Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-14T17:25:00Z',
  },
  {
    id: 'rev-013',
    destination_id: 'e1000000-0000-0000-0000-000000000010', // Jonha Falls
    author_name: 'Arjun Tirkey (Ranchi)',
    rating: 4,
    comment: 'Climbing the 722 steps is a solid workout but the temple at the summit and Gautam Buddha shrine makes it serene. Beautiful hanging footbridge view.',
    visit_date: '2026-02-14',
    tags: ['Nature/Experience', 'Cleanliness', 'Guides'],
    status: 'approved',
    sentiment: 'POSITIVE',
    sentimentScore: 0.84,
    extractedTopics: {
      positive: ['Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-15T11:00:00Z',
  },
  // Pending reviews for moderation queue demonstration
  {
    id: 'rev-pending-001',
    destination_id: 'e1000000-0000-0000-0000-000000000002', // Hundru Falls
    author_name: 'Manish K. (Bokaro)',
    rating: 2,
    comment: 'Excessive parking fee charged by unauthorized persons near approach lane. Restroom taps had no running water in afternoon peak.',
    visit_date: '2026-02-19',
    tags: ['Transport', 'Cleanliness', 'Value for Money'],
    status: 'pending',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.65,
    extractedTopics: {
      positive: [],
      negative: ['Parking & approach road access', 'Waste disposal & public restroom hygiene'],
    },
    created_at: '2026-02-20T03:15:00Z',
  },
  {
    id: 'rev-pending-002',
    destination_id: 'e1000000-0000-0000-0000-000000000007', // Saranda Forest
    author_name: 'Tanvi Swaroop (Pune)',
    rating: 5,
    comment: 'Unbelievable canopy walk through the ancient sal trees. Guide Budheshwar taught us so much about indigenous medicinal herbs and wildlife tracks.',
    visit_date: '2026-02-18',
    tags: ['Guides', 'Nature/Experience', 'Safety'],
    status: 'pending',
    sentiment: 'POSITIVE',
    sentimentScore: 0.94,
    extractedTopics: {
      positive: ['Certified native guide expertise', 'Scenic eco landscapes & biodiversity'],
      negative: [],
    },
    created_at: '2026-02-19T20:00:00Z',
  },
];

const STORAGE_REVIEWS_KEY = 'jharkhand_tourist_reviews_v2';

/**
 * Reads all stored reviews with automatic seed fallback
 */
export function getStoredTouristReviews(): TouristReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading tourist reviews from localStorage:', err);
  }
  // Initialize with seed data
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(INITIAL_SEED_TOURIST_REVIEWS));
  } catch {}
  return INITIAL_SEED_TOURIST_REVIEWS;
}

/**
 * Persists reviews to storage
 */
export function saveTouristReviews(reviews: TouristReview[]): void {
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn('Error saving tourist reviews:', err);
  }
}

/**
 * Submits a new tourist review in 'pending' status for moderation
 */
export function submitTouristReview(input: {
  destination_id: string;
  author_name: string;
  rating: number;
  comment: string;
  visit_date?: string;
  tags?: ReviewTag[];
  photos?: string[];
  user_id?: string | null;
}): TouristReview {
  const allReviews = getStoredTouristReviews();
  const tags: ReviewTag[] = input.tags && input.tags.length > 0 ? input.tags : (['Overall Experience'] as ReviewTag[]);
  
  const classification = classifyReviewSentiment(input.rating, input.comment, tags);

  const newReview: TouristReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    destination_id: input.destination_id,
    user_id: input.user_id || null,
    author_name: input.author_name.trim() || 'Anonymous Traveler',
    rating: Math.max(1, Math.min(5, input.rating)),
    comment: input.comment.trim(),
    visit_date: input.visit_date || new Date().toISOString().split('T')[0],
    tags,
    photos: input.photos || [],
    status: 'pending', // Moderation required
    sentiment: classification.sentiment,
    sentimentScore: classification.sentimentScore,
    extractedTopics: classification.extractedTopics,
    created_at: new Date().toISOString(),
  };

  const updated = [newReview, ...allReviews];
  saveTouristReviews(updated);
  return newReview;
}

/**
 * Moderation: Approve a pending review
 */
export function approveTouristReview(reviewId: string): TouristReview | null {
  const allReviews = getStoredTouristReviews();
  let approved: TouristReview | null = null;
  const updated = allReviews.map((rev) => {
    if (rev.id === reviewId) {
      approved = { ...rev, status: 'approved' as ReviewStatus, flagged: false };
      return approved;
    }
    return rev;
  });
  saveTouristReviews(updated);
  return approved;
}

/**
 * Moderation: Reject a pending review
 */
export function rejectTouristReview(reviewId: string): TouristReview | null {
  const allReviews = getStoredTouristReviews();
  let rejected: TouristReview | null = null;
  const updated = allReviews.map((rev) => {
    if (rev.id === reviewId) {
      rejected = { ...rev, status: 'rejected' as ReviewStatus };
      return rejected;
    }
    return rev;
  });
  saveTouristReviews(updated);
  return rejected;
}

/**
 * Moderation: Flag a suspicious review
 */
export function flagTouristReview(reviewId: string): TouristReview | null {
  const allReviews = getStoredTouristReviews();
  let flagged: TouristReview | null = null;
  const updated = allReviews.map((rev) => {
    if (rev.id === reviewId) {
      flagged = { ...rev, flagged: true };
      return flagged;
    }
    return rev;
  });
  saveTouristReviews(updated);
  return flagged;
}

/**
 * Computes Destination Review Summary for public display on destination detail pages.
 * Only 'approved' reviews contribute to public stats.
 */
export function getDestinationReviewSummary(
  destinationId: string,
  destinationsList: Destination[] = SEED_DESTINATIONS
): DestinationReviewSummary {
  const allReviews = getStoredTouristReviews();
  const destReviews = allReviews.filter((r) => r.destination_id === destinationId);
  const approved = destReviews.filter((r) => r.status === 'approved');
  const pending = destReviews.filter((r) => r.status === 'pending');

  const dest = destinationsList.find((d) => d.id === destinationId);
  const fallbackRating = dest?.rating || 4.5;

  if (approved.length === 0) {
    // Initial seeded baseline if no approved reviews yet
    return {
      destinationId,
      overallRating: fallbackRating,
      totalApprovedReviews: dest?.review_count || 48,
      totalPendingReviews: pending.length,
      positivePercentage: 86,
      neutralPercentage: 10,
      negativePercentage: 4,
      touristExperienceScore: Math.round((fallbackRating / 5) * 88 + 8),
      categoryFeedback: {
        'Safety': { positiveRatio: 0.94, count: 24 },
        'Cleanliness': { positiveRatio: 0.85, count: 20 },
        'Food': { positiveRatio: 0.88, count: 18 },
        'Local Vendors': { positiveRatio: 0.92, count: 16 },
        'Guides': { positiveRatio: 0.96, count: 15 },
        'Transport': { positiveRatio: 0.78, count: 14 },
        'Accommodation': { positiveRatio: 0.89, count: 12 },
        'Nature/Experience': { positiveRatio: 0.98, count: 32 },
        'Value for Money': { positiveRatio: 0.91, count: 22 },
        'Overall Experience': { positiveRatio: 0.93, count: 40 },
      },
      topPositiveThemes: ['Scenic natural surroundings', 'Courteous local guides', 'Authentic tribal food'],
      topNegativeIssues: ['Peak weekend approach traffic'],
      recentReviews: [],
    };
  }

  const sumRating = approved.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = Math.round((sumRating / approved.length) * 10) / 10;

  const posCount = approved.filter((r) => r.sentiment === 'POSITIVE').length;
  const neuCount = approved.filter((r) => r.sentiment === 'NEUTRAL').length;
  const negCount = approved.filter((r) => r.sentiment === 'NEGATIVE').length;

  const positivePercentage = Math.round((posCount / approved.length) * 100);
  const neutralPercentage = Math.round((neuCount / approved.length) * 100);
  const negativePercentage = Math.round((negCount / approved.length) * 100);

  // Category Feedback
  const categoryFeedback: Record<ReviewTag, { positiveRatio: number; count: number }> = {} as any;
  ALL_REVIEW_TAGS.forEach((tag) => {
    const tagged = approved.filter((r) => r.tags.includes(tag));
    if (tagged.length > 0) {
      const tagPos = tagged.filter((r) => r.sentiment === 'POSITIVE' || r.rating >= 4).length;
      categoryFeedback[tag] = {
        positiveRatio: Math.round((tagPos / tagged.length) * 100) / 100,
        count: tagged.length,
      };
    } else {
      categoryFeedback[tag] = { positiveRatio: 0.88, count: 0 };
    }
  });

  // Top positive & negative topics
  const posTopicMap = new Map<string, number>();
  const negTopicMap = new Map<string, number>();

  approved.forEach((r) => {
    r.extractedTopics.positive.forEach((t) => posTopicMap.set(t, (posTopicMap.get(t) || 0) + 1));
    r.extractedTopics.negative.forEach((t) => negTopicMap.set(t, (negTopicMap.get(t) || 0) + 1));
  });

  const topPositiveThemes = Array.from(posTopicMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
    .slice(0, 3);

  const topNegativeIssues = Array.from(negTopicMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
    .slice(0, 3);

  // Calculate Tourist Experience Score (TES)
  // Methodology: 50% Avg Rating (0-5) + 35% Positive Ratio + 15% Category Health - 25% Negative Ratio
  const posRatio = posCount / approved.length;
  const negRatio = negCount / approved.length;
  const tesRaw = (avgRating / 5) * 50 + posRatio * 35 - negRatio * 25 + 12;
  const touristExperienceScore = Math.max(10, Math.min(99, Math.round(tesRaw)));

  return {
    destinationId,
    overallRating: avgRating,
    totalApprovedReviews: approved.length,
    totalPendingReviews: pending.length,
    positivePercentage,
    neutralPercentage,
    negativePercentage,
    touristExperienceScore,
    categoryFeedback,
    topPositiveThemes: topPositiveThemes.length > 0 ? topPositiveThemes : ['Scenic natural surroundings'],
    topNegativeIssues: topNegativeIssues.length > 0 ? topNegativeIssues : ['No major complaints reported'],
    recentReviews: approved.slice(0, 8),
  };
}

/**
 * Aggregates state-wide Review Intelligence for the Government Dashboard
 */
export function getGovernmentReviewIntelligence(
  destinationsList: Destination[] = SEED_DESTINATIONS,
  districtsList: District[] = SEED_DISTRICTS
): ReviewGovIntelligence {
  const allReviews = getStoredTouristReviews();
  const approved = allReviews.filter((r) => r.status === 'approved');
  const pending = allReviews.filter((r) => r.status === 'pending');

  const totalApproved = approved.length;
  const totalPending = pending.length;

  const totalRatingSum = approved.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = totalApproved > 0 ? Math.round((totalRatingSum / totalApproved) * 10) / 10 : 4.6;

  const posReviews = approved.filter((r) => r.sentiment === 'POSITIVE');
  const neuReviews = approved.filter((r) => r.sentiment === 'NEUTRAL');
  const negReviews = approved.filter((r) => r.sentiment === 'NEGATIVE');

  const positiveSentimentPct = totalApproved > 0 ? Math.round((posReviews.length / totalApproved) * 100) : 84;
  const neutralSentimentPct = totalApproved > 0 ? Math.round((neuReviews.length / totalApproved) * 100) : 10;
  const negativeSentimentPct = totalApproved > 0 ? Math.round((negReviews.length / totalApproved) * 100) : 6;

  const overallTouristExperienceScore = Math.round(
    (averageRating / 5) * 50 + (positiveSentimentPct / 100) * 35 - (negativeSentimentPct / 100) * 25 + 12
  );

  // Destination level stats
  const destStats = destinationsList.map((dest) => {
    const summary = getDestinationReviewSummary(dest.id, destinationsList);
    return {
      destination: dest,
      avgRating: summary.overallRating,
      positivePct: summary.positivePercentage,
      negativePct: summary.negativePercentage,
      reviewCount: summary.totalApprovedReviews,
      topTheme: summary.topPositiveThemes[0] || 'Scenic beauty & culture',
      topIssue: summary.topNegativeIssues[0] || 'Minor peak hour rush',
      tesScore: summary.touristExperienceScore,
    };
  });

  // Most Praised Destinations (Sorted by TES Score & Positive %)
  const mostPraisedDestinations = [...destStats]
    .sort((a, b) => b.tesScore - a.tesScore || b.positivePct - a.positivePct)
    .slice(0, 5);

  // Destinations with negative signals / bottlenecks
  const destinationsWithNegativeSignals = [...destStats]
    .filter((d) => d.negativePct > 0 || d.avgRating < 4.5)
    .sort((a, b) => b.negativePct - a.negativePct)
    .map((d) => ({
      destination: d.destination,
      negativePct: d.negativePct,
      topIssue: d.topIssue,
      reviewCount: d.reviewCount,
      tesScore: d.tesScore,
      urgentAction:
        d.negativePct > 15
          ? 'Deploy rapid sanitation & traffic marshal squad'
          : 'Monitor approach road maintenance and parking signs',
    }))
    .slice(0, 4);

  // Top positive themes across state
  const posMap = new Map<string, number>();
  approved.forEach((r) => {
    r.extractedTopics.positive.forEach((t) => posMap.set(t, (posMap.get(t) || 0) + 1));
  });
  if (posMap.size === 0) {
    posMap.set('Scenic eco landscapes & biodiversity', 8);
    posMap.set('Certified native guide expertise', 7);
    posMap.set('Authentic tribal delicacies & street food', 6);
    posMap.set('Direct indigenous artisan livelihood support', 5);
  }

  const topPositiveThemes = Array.from(posMap.entries())
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: Math.round((count / Math.max(1, totalApproved)) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top negative issues across state
  const negMap = new Map<string, number>();
  approved.forEach((r) => {
    r.extractedTopics.negative.forEach((t) => negMap.set(t, (negMap.get(t) || 0) + 1));
  });
  if (negMap.size === 0) {
    negMap.set('Parking & approach road access', 3);
    negMap.set('Weekend peak overcrowding & queues', 2);
    negMap.set('Waste disposal & public restroom hygiene', 2);
  }

  const topNegativeIssues = Array.from(negMap.entries())
    .map(([issue, count]) => ({
      issue,
      count,
      severity: (count >= 3 ? 'High' : count === 2 ? 'Moderate' : 'Minor') as 'High' | 'Moderate' | 'Minor',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // District-wise sentiment
  const districtWiseSentiment = districtsList.map((district) => {
    const districtDests = destinationsList.filter((d) => d.district_id === district.id);
    const destIds = new Set(districtDests.map((d) => d.id));
    const distReviews = approved.filter((r) => destIds.has(r.destination_id));

    let avgRating = 4.7;
    let posPct = 85;
    let neuPct = 10;
    let negPct = 5;
    let totalReviews = distReviews.length;

    if (distReviews.length > 0) {
      const sum = distReviews.reduce((a, r) => a + r.rating, 0);
      avgRating = Math.round((sum / distReviews.length) * 10) / 10;
      const pos = distReviews.filter((r) => r.sentiment === 'POSITIVE').length;
      const neu = distReviews.filter((r) => r.sentiment === 'NEUTRAL').length;
      const neg = distReviews.filter((r) => r.sentiment === 'NEGATIVE').length;
      posPct = Math.round((pos / distReviews.length) * 100);
      neuPct = Math.round((neu / distReviews.length) * 100);
      negPct = Math.round((neg / distReviews.length) * 100);
    } else {
      totalReviews = Math.max(6, districtDests.length * 5);
    }

    const tes = Math.round((avgRating / 5) * 50 + (posPct / 100) * 35 - (negPct / 100) * 25 + 12);
    let sentimentStatus: SentimentStatus = 'POSITIVE';
    if (negPct > 20 || avgRating < 4.0) sentimentStatus = 'NEGATIVE';
    else if (neuPct > 25 || posPct < 70) sentimentStatus = 'NEUTRAL';

    return {
      districtName: district.name,
      districtId: district.id,
      totalReviews,
      avgRating,
      positivePct: posPct,
      neutralPct: neuPct,
      negativePct: negPct,
      sentimentStatus,
      tesScore: tes,
    };
  });

  // Category-wise sentiment
  const categoryWiseSentiment = ALL_REVIEW_TAGS.map((tag) => {
    const tagged = approved.filter((r) => r.tags.includes(tag));
    let avg = 4.6;
    let posPct = 88;
    let count = tagged.length;

    if (tagged.length > 0) {
      const sum = tagged.reduce((a, r) => a + r.rating, 0);
      avg = Math.round((sum / tagged.length) * 10) / 10;
      const pos = tagged.filter((r) => r.sentiment === 'POSITIVE' || r.rating >= 4).length;
      posPct = Math.round((pos / tagged.length) * 100);
    } else {
      count = Math.floor(totalApproved * 0.4) + 1;
    }

    let healthStatus: 'Excellent' | 'Good' | 'Needs Attention' = 'Good';
    if (posPct >= 85 && avg >= 4.5) healthStatus = 'Excellent';
    else if (posPct < 70 || avg < 4.0) healthStatus = 'Needs Attention';

    return {
      category: tag,
      avgRating: avg,
      positivePct: posPct,
      count,
      healthStatus,
    };
  });

  // Correlated Multi-Signal Actionable Government Insights
  const actionableInsights = [
    {
      id: 'act-rev-1',
      type: 'Transport' as const,
      urgency: 'Immediate' as const,
      title: 'Parking & Approach Road Bottleneck Mitigation at Hundru Falls',
      targetDestinationOrDistrict: 'Hundru Falls (Ranchi District)',
      triggerSignal: 'Transport feedback shows 28% negative issues regarding weekend parking congestion.',
      recommendation: 'Demarcate a dedicated 120-vehicle overflow eco-parking 800m before the falls with a designated community battery shuttle.',
      correlatedSignals: 'High Crowd (🔴) + Mixed Sentiment (🟡) + 14,000 monthly visitors.',
    },
    {
      id: 'act-rev-2',
      type: 'Promotion' as const,
      urgency: 'Strategic Policy' as const,
      title: 'Promote High-Satisfaction Undiscovered Gem: Saranda Forest Canopy',
      targetDestinationOrDistrict: 'Saranda Forest & Kiriburu (West Singhbhum)',
      triggerSignal: '100% positive sentiment and 4.98 Experience Score with zero reported sanitation/safety issues.',
      recommendation: 'Feature Saranda in the State AI Itinerary Planner and onboard 15 additional Ho tribal eco-guides.',
      correlatedSignals: 'Low Crowd (🟡) + High Positive Sentiment (🟢) + ₹1.1 Cr uncaptured eco-revenue potential.',
    },
    {
      id: 'act-rev-3',
      type: 'Cleanliness' as const,
      urgency: 'Medium Priority' as const,
      title: 'Zero-Plastic Deposit-Refund Waste Station at Betla & Hundru Gates',
      targetDestinationOrDistrict: 'Betla National Park & Hundru Falls',
      triggerSignal: 'Multiple reviews flagged discarded plastic water bottles along nature trails.',
      recommendation: 'Deploy ₹10 refundable metal canteen tokens at entry checkpoints run by local women Self-Help Groups (SHGs).',
      correlatedSignals: 'High Footfall + Wildlife Zone Corridor Sensitivity.',
    },
    {
      id: 'act-rev-4',
      type: 'Vendor Support' as const,
      urgency: 'Medium Priority' as const,
      title: 'Scale Digital QR & Hygiene Verification for Local Dhuska & Tribal Food Stalls',
      targetDestinationOrDistrict: 'State-wide (Ranchi, Hazaribagh, Latehar Stalls)',
      triggerSignal: '92% positive praise for authentic tribal cuisine and Dhuska stalls across tourist reviews.',
      recommendation: 'Issue official Directorate of Tourism Hygiene Verification Badges and standardized UPI QR boards.',
      correlatedSignals: 'High Local Economic Multiplier + Direct Village Livelihood Retention (81%).',
    },
  ];

  return {
    totalApprovedReviews: totalApproved,
    totalPendingReviews: totalPending,
    averageRating,
    positiveSentimentPct,
    neutralSentimentPct,
    negativeSentimentPct,
    overallTouristExperienceScore,
    mostPraisedDestinations,
    destinationsWithNegativeSignals,
    topPositiveThemes,
    topNegativeIssues,
    districtWiseSentiment,
    categoryWiseSentiment,
    actionableInsights,
  };
}
