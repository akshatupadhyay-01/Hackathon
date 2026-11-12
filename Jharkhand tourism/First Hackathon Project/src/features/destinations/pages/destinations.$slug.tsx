import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Star,
  Clock,
  Ticket,
  Calendar,
  Leaf,
  ShieldCheck,
  Users,
  Compass,
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle2,
  Phone,
  MessageSquare,
  AlertCircle,
  Car,
  Navigation,
  Sparkles,
  RefreshCw,
  LocateFixed,
  Route,
  Plus,
  Minus,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { Destination, LocalGuide, Review } from '../../../types/database';
import {
  fetchDestinationBySlug,
  fetchLocalGuides,
  fetchReviews,
  createBooking,
} from '../services/destinations';
import {
  calculateRoadRoute,
  requestUserLocation,
  resolveLocationCoords,
  RouteResult,
  formatTimeHours,
  isValidCoord,
} from '../../map/services/routing';
import { LocalVendor, fetchNearbyVendors } from '../../discover-local/services/localVendors';
import {
  getDestinationReviewSummary,
  submitTouristReview,
  TouristReview,
  ReviewTag,
  ALL_REVIEW_TAGS,
  DestinationReviewSummary,
} from '../../intelligence/services/reviewIntelligence';
import { GovCrowdStatus } from '../../intelligence/services/tourismIntelligence';

import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { useAuth } from '../../../contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { DigitalEcoPass } from '../../bookings/components/digital-eco-pass';
import { SEO } from '../../../components/common/seo';

interface DestinationDetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export function DestinationDetailPage({ slug, navigate }: DestinationDetailPageProps) {
  const { user, profile } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [guides, setGuides] = useState<LocalGuide[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [nearbyVendors, setNearbyVendors] = useState<LocalVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<LocalGuide | null>(null);
  const [visitorName, setVisitorName] = useState<string>(
    profile?.full_name || user?.user_metadata?.full_name || 'Akshat Kumar'
  );

  useEffect(() => {
    if (profile?.full_name) {
      setVisitorName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setVisitorName(user.user_metadata.full_name);
    }
  }, [profile, user]);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [guestInput, setGuestInput] = useState<string>('1');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [confirmedPass, setConfirmedPass] = useState<{
    bookingId: string;
    visitorName: string;
    numberOfGuests: number;
    visitDate: string;
    guide: LocalGuide | null;
    totalAmountInr: number;
    status: string;
  } | null>(null);

  // Directions & Travel Time State
  const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
  const [originInput, setOriginInput] = useState<string>('Ranchi');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number; name: string; isGps?: boolean } | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'>('idle');
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Review & Intelligence State
  const [reviewSummary, setReviewSummary] = useState<DestinationReviewSummary | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewAuthorName, setReviewAuthorName] = useState<string>(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewVisitDate, setReviewVisitDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reviewSelectedTags, setReviewSelectedTags] = useState<ReviewTag[]>([
    'Nature/Experience',
    'Overall Experience',
  ]);
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'all'>('all');
  const [reviewFilterTag, setReviewFilterTag] = useState<string>('all');

  const toggleReviewTag = (tag: ReviewTag) => {
    setReviewSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleOpenReviewModal = () => {
    setReviewRating(5);
    setReviewHoverRating(0);
    setReviewComment('');
    setReviewSuccessMessage(null);
    if (profile?.full_name) {
      setReviewAuthorName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setReviewAuthorName(user.user_metadata.full_name);
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    if (!reviewComment.trim()) return;

    setReviewSubmitting(true);
    try {
      const author = reviewAuthorName.trim() || 'Anonymous Traveler';
      submitTouristReview({
        destination_id: destination.id,
        author_name: author,
        rating: reviewRating,
        comment: reviewComment,
        visit_date: reviewVisitDate,
        tags: reviewSelectedTags,
        user_id: user?.id || null,
      });

      setReviewSuccessMessage(
        'Thanks for sharing your experience!\nYour review has been submitted for verification.'
      );

      // Refresh summary
      const updatedSummary = getDestinationReviewSummary(destination.id);
      setReviewSummary(updatedSummary);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenBooking = (guide?: LocalGuide | null) => {
    setSelectedGuide(guide || null);
    setGuestInput('1');
    setGuestError(null);
    setConfirmedPass(null);
    setBookingModalOpen(true);
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadDestinationDetails() {
      setLoading(true);
      try {
        const dest = await fetchDestinationBySlug(slug);
        if (!isCancelled && dest) {
          setDestination(dest);
          setSelectedImage(dest.featured_image);

          // Fetch guides, reviews, and nearby local street vendors concurrently
          const [guidesData, reviewsData, vendorsData] = await Promise.all([
            fetchLocalGuides(dest.id),
            fetchReviews(dest.id),
            fetchNearbyVendors({ lat: dest.latitude, lng: dest.longitude }, 35),
          ]);

          if (!isCancelled) {
            setGuides(guidesData);
            setReviews(reviewsData);
            setNearbyVendors(vendorsData);
            setReviewSummary(getDestinationReviewSummary(dest.id));
          }
        }
      } catch (err) {
        console.error('Error loading destination detail:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadDestinationDetails();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // Initial road travel estimate from Ranchi default hub
  useEffect(() => {
    if (destination) {
      const defaultOrigin = resolveLocationCoords(originInput);
      setOriginCoords(defaultOrigin);
      calculateRoadRoute(
        { lat: defaultOrigin.lat, lng: defaultOrigin.lng },
        { lat: destination.latitude, lng: destination.longitude }
      ).then((res) => {
        setRouteResult(res);
      }).catch((err) => {
        console.warn('Initial road calculation failed:', err);
      });
    }
  }, [destination]);

  const handleCalculateDirections = async (originToUse?: { lat: number; lng: number; name: string; isGps?: boolean }) => {
    if (!destination) return;
    if (!isValidCoord(destination.latitude, destination.longitude)) {
      console.error('[Routing] Destination coordinates missing or invalid:', destination);
      setLocationNotice('Route unavailable: destination location is missing.');
      return;
    }

    setCalculatingRoute(true);
    setLocationNotice(null);
    try {
      const resolvedOrigin = originToUse || originCoords || resolveLocationCoords(originInput);
      console.log('[Routing] Calculating directions on destination page:', {
        origin: resolvedOrigin,
        destination: { name: destination.name, lat: destination.latitude, lng: destination.longitude }
      });
      const res = await calculateRoadRoute(
        { lat: resolvedOrigin.lat, lng: resolvedOrigin.lng },
        { lat: destination.latitude, lng: destination.longitude }
      );
      setRouteResult(res);
      setOriginCoords(resolvedOrigin);
    } catch (err: any) {
      console.error('Error calculating route:', err);
      setLocationNotice(err?.message || 'Unable to calculate live route. Using estimated regional road distance.');
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleUseGpsLocation = async () => {
    if (!destination) return;
    console.log('[GPS Flow] User requested GPS on destination page for:', destination.name);
    setGpsStatus('locating');
    setGpsErrorMessage(null);
    setLocationNotice(null);

    try {
      const pos = await requestUserLocation();
      setGpsStatus('granted');
      const origin = {
        lat: pos.lat,
        lng: pos.lng,
        name: 'Your Location',
        isGps: true,
      };
      setOriginCoords(origin);
      setOriginInput('Your Location');
      setLocationNotice(`Real GPS location acquired (${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E)`);
      await handleCalculateDirections(origin);
    } catch (err: any) {
      console.error('[GPS Flow] Destination page GPS error:', err);
      const errType = err?.type;
      const errCode = err?.code;

      if (errType === 'PERMISSION_DENIED' || errCode === 1) {
        setGpsStatus('denied');
        setGpsErrorMessage(
          err?.message || 'Location permission is blocked. Please allow location access for this site in your browser settings, then tap Try Again.'
        );
      } else if (errType === 'TIMEOUT' || errCode === 3) {
        setGpsStatus('timeout');
        setGpsErrorMessage('Location request timed out. Please verify GPS is enabled and try again.');
      } else if (errType === 'NOT_SUPPORTED') {
        setGpsStatus('unsupported');
        setGpsErrorMessage(err?.message || 'Location services are not supported on this browser.');
      } else {
        setGpsStatus('unavailable');
        setGpsErrorMessage(
          err?.message || 'Unable to determine your GPS location. Please check device location settings and try again.'
        );
      }
    }
  };

  const handleOpenDirectionsModal = () => {
    setDirectionsModalOpen(true);
    setGpsStatus('idle');
    setGpsErrorMessage(null);
    if (!routeResult) {
      handleCalculateDirections();
    }
  };

  const handleNavigateOnMap = () => {
    if (!destination) return;
    const origin = originCoords || resolveLocationCoords(originInput);
    const isGpsStr = origin.isGps ? '&isGps=true' : '';
    navigate(
      `/map?directions=true&dest=${destination.slug}&originLat=${origin.lat}&originLng=${origin.lng}&originName=${encodeURIComponent(origin.name)}${isGpsStr}`
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    const trimmedGuests = guestInput.trim();
    if (!trimmedGuests) {
      setGuestError('Please enter the number of guests (minimum 1).');
      return;
    }

    const parsedGuests = parseInt(trimmedGuests, 10);
    if (isNaN(parsedGuests) || parsedGuests < 1) {
      setGuestError('Please enter a valid number of guests of at least 1.');
      return;
    }

    setGuestError(null);
    setBookingSubmitting(true);
    try {
      const guideFee = selectedGuide ? selectedGuide.daily_rate_inr : 0;
      const entryTotal = destination.entry_fee_inr * parsedGuests;
      const totalAmount = entryTotal + guideFee;
      const finalVisitor = visitorName.trim() || 'Akshat Kumar';

      const bookingRes = await createBooking({
        destination_id: destination.id,
        user_id: user?.id || null,
        visitor_name: finalVisitor,
        booking_date: bookingDate,
        number_of_guests: parsedGuests,
        guide_id: selectedGuide ? selectedGuide.id : null,
        vendor_id: null,
        total_amount_inr: totalAmount,
      });

      if (bookingRes.booking) {
        setConfirmedPass({
          bookingId: bookingRes.booking.id,
          visitorName: finalVisitor,
          numberOfGuests: parsedGuests,
          visitDate: bookingDate,
          guide: selectedGuide,
          totalAmountInr: totalAmount,
          status: 'CONFIRMED',
        });
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
      setGuestError('Booking creation failed. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-stone-500 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          <span>Loading destination insights...</span>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200">
          Destination Not Found
        </h2>
        <p className="text-sm text-stone-500 mt-1 mb-4">
          The requested ecological site could not be found.
        </p>
        <Button onClick={() => navigate('/destinations')} variant="outline">
          Back to Catalog
        </Button>
      </div>
    );
  }

  const crowdLabels: Record<string, string> = {
    low: 'Quiet / Low Footfall',
    moderate: 'Moderate Visitor Flow',
    high: 'Peak Rush Hours',
    peak: 'Peak Rush Hours',
  };

  const destinationSchema = destination
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristDestination',
            '@id': `https://johar-jharkhand-tourism.gov.in/destinations/${destination.slug}`,
            name: destination.name,
            description: destination.description,
            image: destination.images && destination.images.length > 0 ? destination.images : [destination.featured_image],
            url: `https://johar-jharkhand-tourism.gov.in/destinations/${destination.slug}`,
            touristType: destination.tags || ['Eco-Tourism', 'Heritage'],
            geo: {
              '@type': 'GeoCoordinates',
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            address: {
              '@type': 'PostalAddress',
              addressRegion: destination.district?.name || 'Jharkhand',
              addressCountry: 'IN',
            },
            aggregateRating: destination.rating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: destination.rating,
                  bestRating: 5,
                  ratingCount: destination.review_count || 100,
                }
              : undefined,
            offers: {
              '@type': 'Offer',
              price: destination.entry_fee_inr,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
            publicAccess: true,
            isAccessibleForFree: destination.entry_fee_inr === 0,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://johar-jharkhand-tourism.gov.in/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Destinations',
                item: 'https://johar-jharkhand-tourism.gov.in/explore',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: destination.name,
                item: `https://johar-jharkhand-tourism.gov.in/destinations/${destination.slug}`,
              },
            ],
          },
        ],
      }
    : undefined;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 md:py-12">
      <SEO
        title={destination ? `${destination.name} — ${destination.tagline || 'Eco Destination'}` : 'Destination Details'}
        description={destination ? `${destination.description.slice(0, 155)}... Book local guides & digital eco-pass.` : undefined}
        keywords={destination ? `${destination.name}, ${destination.district?.name || 'Jharkhand'}, ${destination.category?.name || 'Eco Tourism'}, ${destination.tags?.join(', ') || ''}, Jharkhand travel guide, tourist booking` : undefined}
        canonicalPath={`/destinations/${destination?.slug || slug}`}
        ogImage={destination?.featured_image}
        ogType="place"
        schema={destinationSchema}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/destinations')}
            className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Destinations</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/map?destination=${destination.slug}`)}
              className="text-xs gap-1.5 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-600" />
              <span>Explore on Map</span>
            </Button>
          </div>
        </div>

        {/* Hero Title & Primary Information */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="emerald" className="gap-1">
              <Leaf className="h-3.5 w-3.5" />
              {destination.category?.name || 'Eco Landmark'}
            </Badge>
            <Badge variant="outline" className="text-stone-600 dark:text-stone-400">
              {destination.district?.name || 'Jharkhand'} District
            </Badge>
            {destination.is_eco_certified && (
              <Badge variant="emerald" className="bg-teal-900 text-teal-200 border-teal-700">
                🌱 Certified Eco Site
              </Badge>
            )}
            {/* Crowd Level Badge */}
            {(() => {
              const s = (destination.crowd_status || '').toLowerCase();
              const isHigh = s === 'high' || s === 'peak';
              const isLow = s === 'low';
              const level = isHigh ? 'High Crowd' : isLow ? 'Low Crowd' : 'Medium Crowd';
              const icon = isHigh ? '🔴' : isLow ? '🟡' : '🟢';
              const badgeClass = isHigh
                ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800 font-bold'
                : isLow
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 font-bold'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 font-bold';
              return (
                <Badge variant="outline" className={`gap-1.5 ${badgeClass}`}>
                  <span>{icon}</span>
                  <span>{level}</span>
                </Badge>
              );
            })()}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            {destination.name}
          </h1>

          <p className="text-base md:text-lg text-emerald-800 dark:text-emerald-300 font-medium">
            {destination.tagline || destination.best_time_to_visit}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-stone-900 dark:text-stone-100 font-extrabold">
                  {reviewSummary ? reviewSummary.overallRating.toFixed(1) : destination.rating.toFixed(1)}
                </span>
                <span className="text-stone-500 dark:text-stone-400 font-normal">
                  ({reviewSummary ? reviewSummary.totalApprovedReviews : reviews.length} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>
                  {destination.latitude.toFixed(4)}° N, {destination.longitude.toFixed(4)}° E
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Timings: {destination.timings || 'Sunrise to Sunset'}</span>
              </div>
            </div>

            {/* ⭐ Write a Review Button - Clearly Visible in Top Info Header */}
            <Button
              size="sm"
              onClick={handleOpenReviewModal}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-amber-400 shrink-0"
            >
              <Star className="h-4 w-4 fill-stone-950 text-stone-950" />
              <span>⭐ Write a Review</span>
            </Button>
          </div>
        </div>

        {/* Media Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 h-[320px] sm:h-[460px] rounded-3xl overflow-hidden shadow-lg bg-stone-900 relative">
            <img
              src={selectedImage || destination.featured_image}
              alt={destination.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
              <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium">
                Verified Ecological Landmark
              </span>
              <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
                {destination.district?.name}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[destination.featured_image, ...(destination.images || [])]
              .slice(0, 3)
              .map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-24 sm:h-28 lg:h-[142px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    (selectedImage || destination.featured_image) === img
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Description, Highlights, Guides, & Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Story */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                About this Destination
              </h2>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {destination.description}
              </p>
            </div>

            {/* Ecological Features & Sustainable Guidelines */}
            <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>Responsible Eco-Tourism Guidelines</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 dark:text-stone-400">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Zero Single-Use Plastic
                  </span>
                  <span>
                    Carry refillable steel or glass water flasks. Forest checkpoints inspect single-use plastics.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Native Guide Empowerment
                  </span>
                  <span>
                    100% of guide hiring fees directly benefit indigenous Munda, Oraon, and Santhal households.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Quiet Zone & Wildlife Respect
                  </span>
                  <span>
                    Loud speakers and drone operations are strictly regulated to protect nesting birds and fauna.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Verified Digital Eco-Pass
                  </span>
                  <span>
                    Instant QR generation upon reservation with direct forest ranger desk integration.
                  </span>
                </div>
              </div>
            </Card>

            {/* Verified Local Street Vendors & Stalls Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-amber-600" />
                    <span>Local Street Vendors & Stalls ({nearbyVendors.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Authentic tribal cuisine, sweets, and indigenous handicrafts near {destination.name}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/map?destination=${destination.slug}`)}
                  className="text-xs border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                >
                  View on Map
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nearbyVendors.slice(0, 4).map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold">
                          {vendor.categoryIcon} {vendor.categoryLabel}
                        </Badge>
                        <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                          {vendor.name}
                        </h5>
                        <span className="text-[11px] text-stone-500">
                          {vendor.villageOrArea}
                        </span>
                      </div>
                      {vendor.distanceKm !== undefined && (
                        <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          📍 {vendor.distanceKm} km
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {vendor.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {vendor.specialties.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {vendor.priceRange}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/map?destination=${destination.slug}`)}
                        className="text-xs bg-amber-700 hover:bg-amber-800 text-white h-7 gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>Locate on Map</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Local Community Guides Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span>Verified Native Eco-Guides ({guides.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guides.map((guide) => (
                  <Card
                    key={guide.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                        {guide.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {guide.name}
                          </h5>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          {guide.badge}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {guide.bio}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        ₹{guide.daily_rate_inr} / day
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenBooking(guide)}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 h-7"
                      >
                        Book With Guide
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Public Tourist Reviews & Review Intelligence Display */}
            <div className="space-y-6 pt-6 border-t border-stone-200 dark:border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗣️</span>
                    <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                      Tourist Voice & Public Reviews
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      Approved Only
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Authentic visitor experiences, category-level ratings, and automated review intelligence.
                  </p>
                </div>

                <Button
                  onClick={handleOpenReviewModal}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs sm:text-sm font-bold gap-2 self-start sm:self-auto cursor-pointer shadow-md shrink-0 px-4 py-2 rounded-xl border border-amber-400"
                >
                  <Star className="h-4 w-4 fill-stone-950 text-stone-950" />
                  <span>⭐ Write a Review</span>
                </Button>
              </div>

              {/* Aggregated Score & Sentiment Breakdown Card */}
              {reviewSummary && (
                <Card className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Left: Overall Rating */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-stone-100">
                          {reviewSummary.overallRating}
                        </span>
                        <span className="text-stone-400 font-bold text-lg">/ 5</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(reviewSummary.overallRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        Based on {reviewSummary.totalApprovedReviews} approved tourist reviews
                      </span>
                    </div>

                    {/* Middle: Sentiment Ratio Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          🟢 Positive {reviewSummary.positivePercentage}%
                        </span>
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          🟡 Neutral {reviewSummary.neutralPercentage}%
                        </span>
                        <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                          🔴 Critical {reviewSummary.negativePercentage}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${reviewSummary.positivePercentage}%` }}
                          className="bg-emerald-600 h-full transition-all"
                          title={`Positive: ${reviewSummary.positivePercentage}%`}
                        />
                        <div
                          style={{ width: `${reviewSummary.neutralPercentage}%` }}
                          className="bg-amber-500 h-full transition-all"
                          title={`Neutral: ${reviewSummary.neutralPercentage}%`}
                        />
                        <div
                          style={{ width: `${reviewSummary.negativePercentage}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`Negative: ${reviewSummary.negativePercentage}%`}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        Sentiment classified via automated NLP keyword and rating analysis.
                      </p>
                    </div>

                    {/* Right: Tourist Experience Score */}
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                        Tourist Experience Score
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                        {reviewSummary.touristExperienceScore}
                        <span className="text-xs font-bold text-emerald-600/80"> / 100</span>
                      </div>
                      <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                        Deterministic composite of star rating, positive ratio & tag satisfaction
                      </p>
                    </div>
                  </div>

                  {/* Category Level Feedback Bars */}
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                      Category Insights & Experience Health:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {ALL_REVIEW_TAGS.slice(0, 5).map((tag) => {
                        const feedback = reviewSummary.categoryFeedback[tag] || { positiveRatio: 0.88, count: 5 };
                        const pct = Math.round(feedback.positiveRatio * 100);
                        return (
                          <div
                            key={tag}
                            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-stone-700 dark:text-stone-300 truncate">
                                {tag}
                              </span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="bg-emerald-600 h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* Review Filters & Tag Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400 mr-1">Filter:</span>
                  <button
                    onClick={() => setReviewFilterRating('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      reviewFilterRating === 'all'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    All Ratings
                  </button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReviewFilterRating(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        reviewFilterRating === r
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      <span>{r}</span>
                      <Star className="h-3 w-3 fill-current" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={reviewFilterTag}
                    onChange={(e) => setReviewFilterTag(e.target.value)}
                    className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Category Tags</option>
                    {ALL_REVIEW_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* List of Approved Reviews */}
              {(() => {
                const approvedList = (reviewSummary?.recentReviews || []).filter((rev) => {
                  const matchRating = reviewFilterRating === 'all' || rev.rating === reviewFilterRating;
                  const matchTag = reviewFilterTag === 'all' || rev.tags.includes(reviewFilterTag as ReviewTag);
                  return matchRating && matchTag;
                });

                if (approvedList.length === 0) {
                  return (
                    <Card className="p-8 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl">
                        ✍️
                      </div>
                      <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                        No reviews match your selected filter
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Be the first to share your firsthand experience visiting {destination.name}!
                      </p>
                      <Button
                        size="sm"
                        onClick={handleOpenReviewModal}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                      >
                        Share Your Experience
                      </Button>
                    </Card>
                  );
                }

                return (
                  <div className="space-y-3.5">
                    {approvedList.map((rev) => (
                      <Card
                        key={rev.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                              {rev.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                                {rev.author_name}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {rev.visit_date ? `Visited ${rev.visit_date}` : 'Verified Traveler'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                rev.sentiment === 'POSITIVE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : rev.sentiment === 'NEUTRAL'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {rev.sentiment === 'POSITIVE'
                                ? '🟢 Positive'
                                : rev.sentiment === 'NEUTRAL'
                                ? '🟡 Mixed'
                                : '🔴 Critical Issue'}
                            </Badge>

                            <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          "{rev.comment}"
                        </p>

                        {/* Category Tags */}
                        {rev.tags && rev.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {rev.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Sticky Booking & Road Travel Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              <Card className="p-6 rounded-3xl border-2 border-emerald-600/30 shadow-xl bg-white dark:bg-stone-900 space-y-5">
                <div className="space-y-1">
                  <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                    Digital Eco-Pass & Entry
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                      {destination.entry_fee_inr === 0 ? 'Free' : `₹${destination.entry_fee_inr}`}
                    </span>
                    <span className="text-xs text-stone-500">per traveler</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">Crowd Level:</span>
                    <Badge variant="emerald">{crowdLabels[destination.crowd_status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">Plastic Policy:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Strictly Prohibited
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">Native Guide Support:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      Gram Panchayat Certified
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenBooking(null)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  Book Digital Eco-Pass
                </Button>

                <p className="text-[11px] text-center text-stone-500">
                  Instant QR Confirmation • Supports local tribal self-help groups
                </p>
              </Card>

              {/* Road Directions & Travel Time Card */}
              <Card className="p-4 rounded-2xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white space-y-3 border border-stone-200 dark:border-stone-800 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                      <Car className="h-3.5 w-3.5" />
                      <span>Road Travel & Directions</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                      {routeResult ? `${routeResult.durationFormatted} (${routeResult.distanceKm} km from ${originCoords?.name || 'Your Location'})` : 'Calculate road travel'}
                    </p>
                  </div>
                  {routeResult?.isLiveRouting && (
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[10px] py-0.5">
                      Live Route
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleOpenDirectionsModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1 shadow-sm"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Get Directions</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/map?destination=${destination.slug}`)}
                    className="text-xs text-stone-700 dark:text-white border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    View on Map
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Road Directions Dialog Modal */}
      <Dialog open={directionsModalOpen} onOpenChange={setDirectionsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onClose={() => setDirectionsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Get Directions to {destination.name}</span>
            </DialogTitle>
            <DialogDescription>
              Calculate real road distance and estimated driving time from your GPS location or starting city.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Origin Input & GPS Location Action */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Starting Location / Origin
                </label>
                <button
                  type="button"
                  onClick={handleUseGpsLocation}
                  disabled={gpsStatus === 'locating'}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <LocateFixed className={`h-3.5 w-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                  <span>{gpsStatus === 'locating' ? 'Getting your current location...' : 'Use My GPS'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={originInput}
                  onChange={(e) => {
                    setOriginInput(e.target.value);
                    setGpsStatus('idle');
                    setGpsErrorMessage(null);
                  }}
                  placeholder="Enter starting city (e.g. Ranchi, Jamshedpur, Deoghar)"
                  className="h-10 text-xs"
                />
                <Button
                  type="button"
                  onClick={() => handleCalculateDirections()}
                  disabled={calculatingRoute}
                  className="shrink-0 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                >
                  {calculatingRoute ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Calculate'}
                </Button>
              </div>

              {/* Status & Feedback Messages */}
              {gpsStatus === 'locating' && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 flex items-center gap-2 text-[11px]">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                  <span>Getting your current location...</span>
                </div>
              )}

              {gpsStatus === 'granted' && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Your location found</span>
                </div>
              )}

              {(gpsStatus === 'denied' || gpsStatus === 'timeout') && gpsErrorMessage && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 space-y-2 text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{gpsErrorMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUseGpsLocation}
                      className="h-6 text-[10px] px-2 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100"
                    >
                      Try Again
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setOriginInput('Ranchi');
                        const resolved = resolveLocationCoords('Ranchi');
                        setOriginCoords(resolved);
                        handleCalculateDirections(resolved);
                        setGpsStatus('idle');
                        setGpsErrorMessage(null);
                      }}
                      className="text-[10px] text-stone-600 dark:text-stone-300 underline font-medium hover:text-stone-900"
                    >
                      Choose Starting Location (e.g. Ranchi)
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Hub Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-stone-500">Popular Hubs:</span>
                {['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'].map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => {
                      setOriginInput(hub);
                      setGpsStatus('idle');
                      setGpsErrorMessage(null);
                      const resolved = resolveLocationCoords(hub);
                      setOriginCoords(resolved);
                      handleCalculateDirections(resolved);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      originInput.toLowerCase() === hub.toLowerCase()
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {hub}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Journey Summary Card with Exact Flow Display */}
            {routeResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-stone-900 text-white space-y-3 shadow-md border border-blue-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">
                    🛣️ Road Journey Summary
                  </span>
                  <Badge variant="outline" className="text-xs text-blue-200 border-blue-600 font-mono">
                    {routeResult.isLiveRouting ? 'Live Routing' : 'Regional Road Network'}
                  </Badge>
                </div>

                {/* Flow Display */}
                <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <span>{originCoords?.name || originInput}</span>
                  </div>
                  <div className="pl-3 border-l-2 border-dashed border-blue-500/60 py-1 text-[11px] text-blue-300">
                    <span>↓ Road Route ({routeResult.distanceKm} km • {routeResult.durationFormatted})</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{destination.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 block uppercase font-semibold">Distance</span>
                    <span className="text-lg font-black text-white">{routeResult.distanceKm} km</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 block uppercase font-semibold">Estimated Travel Time</span>
                    <span className="text-lg font-black text-amber-300">{routeResult.durationFormatted}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Route Highlights / Steps */}
            {routeResult?.steps && routeResult.steps.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-stone-700 dark:text-stone-300 block text-xs">
                  Route Highlights & Highway Segments:
                </span>
                <div className="space-y-1 text-stone-600 dark:text-stone-400 max-h-32 overflow-y-auto pr-1">
                  {routeResult.steps.map((step, idx) => (
                    <div key={idx} className="p-2 bg-stone-50 dark:bg-stone-800/60 rounded-lg border border-stone-200 dark:border-stone-800 flex items-start gap-2 text-[11px]">
                      <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDirectionsModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleNavigateOnMap}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 shadow-md"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Open Road Navigation on Map</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking & Eco-Pass Dialog Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className={confirmedPass ? "max-w-xl max-h-[90vh] overflow-y-auto" : "max-w-md"} onClose={() => setBookingModalOpen(false)}>
          {confirmedPass ? (
            <div className="py-2">
              <DialogHeader className="sr-only">
                <DialogTitle>Digital Eco-Pass Confirmed</DialogTitle>
                <DialogDescription>Your travel permit is confirmed.</DialogDescription>
              </DialogHeader>

              <DigitalEcoPass
                bookingId={confirmedPass.bookingId}
                destination={destination}
                visitorName={confirmedPass.visitorName}
                numberOfGuests={confirmedPass.numberOfGuests}
                visitDate={confirmedPass.visitDate}
                guide={confirmedPass.guide}
                totalAmountInr={confirmedPass.totalAmountInr}
                status={confirmedPass.status}
                onClose={() => {
                  setBookingModalOpen(false);
                  setConfirmedPass(null);
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit}>
              <DialogHeader>
                <DialogTitle>Generate Digital Eco-Pass</DialogTitle>
                <DialogDescription>
                  {destination.name} • {destination.district?.name} District
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Primary Visitor Name
                  </label>
                  <Input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    required
                    placeholder="Enter full name (e.g. Akshat Kumar)"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Date of Visit
                  </label>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(guestInput, 10) || 1;
                        const next = Math.max(1, cur - 1);
                        setGuestInput(next.toString());
                        if (guestError) setGuestError(null);
                      }}
                      aria-label="Decrease guests"
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={guestInput}
                        onChange={(e) => {
                          setGuestInput(e.target.value);
                          if (guestError) setGuestError(null);
                        }}
                        onBlur={() => {
                          const parsed = parseInt(guestInput.trim(), 10);
                          if (!guestInput.trim() || isNaN(parsed) || parsed < 1) {
                            setGuestInput('1');
                          } else if (parsed > 50) {
                            setGuestInput('50');
                          } else {
                            setGuestInput(parsed.toString());
                          }
                          if (guestError) setGuestError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const parsed = parseInt(guestInput.trim(), 10);
                            if (!guestInput.trim() || isNaN(parsed) || parsed < 1) {
                              setGuestInput('1');
                            } else if (parsed > 50) {
                              setGuestInput('50');
                            } else {
                              setGuestInput(parsed.toString());
                            }
                            if (guestError) setGuestError(null);
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder="Enter number of guests (e.g. 1)"
                        className={`h-10 text-xs text-center font-semibold ${guestError ? 'border-rose-500 ring-rose-500' : ''}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(guestInput, 10) || 1;
                        const next = Math.min(50, cur + 1);
                        setGuestInput(next.toString());
                        if (guestError) setGuestError(null);
                      }}
                      aria-label="Increase guests"
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {guestError && (
                    <p className="text-xs text-rose-500 font-medium mt-1 animate-in fade-in-50">
                      {guestError}
                    </p>
                  )}
                </div>

                {selectedGuide && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                        Guide: {selectedGuide.name}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {selectedGuide.badge}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      ₹{selectedGuide.daily_rate_inr}
                    </span>
                  </div>
                )}

                {(() => {
                  const parsedGuestsForCalc = parseInt(guestInput.trim(), 10);
                  const displayGuestCount =
                    !isNaN(parsedGuestsForCalc) && parsedGuestsForCalc > 0 ? parsedGuestsForCalc : 0;

                  return (
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl space-y-1">
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Entry Fee ({displayGuestCount}x):</span>
                        <span>₹{destination.entry_fee_inr * displayGuestCount}</span>
                      </div>
                      {selectedGuide && (
                        <div className="flex justify-between text-stone-600 dark:text-stone-400">
                          <span>Guide Fee:</span>
                          <span>₹{selectedGuide.daily_rate_inr}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-200 dark:border-stone-700 text-sm">
                        <span>Total Amount:</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          ₹{destination.entry_fee_inr * displayGuestCount + (selectedGuide?.daily_rate_inr || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingModalOpen(false)}
                  disabled={bookingSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 font-bold"
                >
                  {bookingSubmitting ? 'Confirming...' : 'Confirm Reservation'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Write a Review Dialog Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onClose={() => setReviewModalOpen(false)}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              <span>Write a Review — {destination.name}</span>
            </DialogTitle>
            <DialogDescription>
              Share your firsthand experience for {destination.name} ({destination.district?.name || 'Jharkhand'} District).
            </DialogDescription>
          </DialogHeader>

          {reviewSuccessMessage ? (
            <div className="py-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl font-bold">
                ✓
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                  Thanks for sharing your experience!
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Your review has been submitted for verification.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  <span>⏳</span>
                  <span>Review Status: Pending</span>
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl text-[11px] text-stone-500 max-w-xs mx-auto border border-stone-200 dark:border-stone-700">
                Destination: <strong className="text-stone-800 dark:text-stone-200">{destination.name}</strong> • Once approved by team moderation, your review will be published.
              </div>
              <Button
                onClick={() => setReviewModalOpen(false)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 py-2 text-xs">
              {/* Star Rating Picker */}
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Star Rating (1–5) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (reviewHoverRating || reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {(reviewHoverRating || reviewRating) === 5
                      ? '5 ★ (Exceptional)'
                      : (reviewHoverRating || reviewRating) === 4
                      ? '4 ★ (Very Good)'
                      : (reviewHoverRating || reviewRating) === 3
                      ? '3 ★ (Average)'
                      : (reviewHoverRating || reviewRating) === 2
                      ? '2 ★ (Poor)'
                      : '1 ★ (Very Poor)'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-1">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Review Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about your visit, nature trail, guide helpfulness, approach roads, cleanliness, local food, or safety..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category / Experience Aspect (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Category / Experience Tags <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_REVIEW_TAGS.map((tag) => {
                    const isSelected = reviewSelectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleReviewTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Author Name and Visit Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                    Your Name / Pseudonym <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={reviewAuthorName}
                    onChange={(e) => setReviewAuthorName(e.target.value)}
                    placeholder="e.g. Priya S."
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                    Visit Date <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={reviewVisitDate}
                    onChange={(e) => setReviewVisitDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              {/* Privacy Safe Callout */}
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 space-y-1">
                <p className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Privacy-Safe & Verified Process</span>
                </p>
                <p>
                  Review will be saved against <strong>{destination.name}</strong>. Reviews undergo automated verification and moderation before appearing publicly.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={reviewSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile-Only Sticky Floating Booking Action Bar */}
      {destination && (
        <div className="lg:hidden fixed bottom-[calc(3.85rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-3 py-2 pointer-events-none">
          <div className="max-w-lg mx-auto bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 pointer-events-auto text-white">
            <div className="pl-2">
              <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                Digital Eco-Pass
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-white">
                  {destination.entry_fee_inr === 0 ? 'Free Entry' : `₹${destination.entry_fee_inr}`}
                </span>
                <span className="text-[10px] text-stone-400">/ person</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenDirectionsModal}
                className="h-9 px-2.5 rounded-xl border-stone-700 bg-stone-800 text-stone-200 text-xs font-semibold hover:bg-stone-700"
              >
                <Car className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenBooking(null)}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
              >
                Book Eco-Pass
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
