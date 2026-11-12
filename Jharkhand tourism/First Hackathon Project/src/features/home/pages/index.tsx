import React, { useEffect, useState } from 'react';
import {
  Search,
  Sparkles,
  Leaf,
  Compass,
  ArrowRight,
  ShieldCheck,
  Users,
  Mountain,
  Waves,
  Palette,
  Landmark,
  TreePine,
  Activity,
  X,
  MapPin,
  QrCode,
  Download,
  Flame,
  PhoneCall,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { Destination, Category, District } from '../../../types/database';
import { fetchDestinations, fetchCategories, fetchDistricts } from '../../destinations/services/destinations';
import { DestinationCard } from '../../destinations/components/destination-card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Section } from '../../../components/layout/section';
import { EmergencyHelpModal } from '../../../components/common/emergency-help-modal';
import { SEO } from '../../../components/common/seo';
import { usePWA } from '../../../contexts/pwa-context';
import { useI18n } from '../../../contexts/i18n-context';

interface HomePageProps {
  navigate: (path: string) => void;
}

export function HomePage({ navigate }: HomePageProps) {
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const { triggerHaptic } = usePWA();
  const { t, isHindi } = useI18n();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [destData, catData, distData] = await Promise.all([
          fetchDestinations({ isFeatured: true }),
          fetchCategories(),
          fetchDistricts(),
        ]);
        setFeaturedDestinations(destData.slice(0, 6));
        setCategories(catData);
        setDistricts(distData);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'waterfalls':
        return Waves;
      case 'sacred_temples':
        return Landmark;
      case 'wildlife_eco':
        return TreePine;
      case 'hills_valleys':
        return Mountain;
      case 'tribal_heritage':
        return Palette;
      default:
        return Compass;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title="Johar Jharkhand — Official Eco & Cultural Tourism Platform"
        description="Discover Jharkhand's sacred hills, cascades, living tribal heritage, and national parks. Book certified indigenous guides, authentic rural homestays, digital eco-passes, and explore live crowd-monitored GIS maps."
        keywords="Jharkhand tourism, eco tourism Jharkhand, Betla National Park, Hundru Falls, Netarhat sunset, Parasnath Shikharji, Patratu valley, Dokra craft, Sohrai art, SIH25032"
        canonicalPath="/"
        ogType="website"
      />
      {/* 1. Hero Banner Section — Rich Forest & Teal Gradient */}
      <div className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[620px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-stone-950 via-emerald-950 to-stone-950 text-white py-14 sm:py-16 md:py-20">
        {/* Background Image with High Contrast Gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=85"
            alt="Jharkhand Waterfall and Forest"
            className="w-full h-full object-cover object-center scale-105 opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-emerald-950/70 to-stone-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-stone-950/70 to-stone-950" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg">
            <Leaf className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{t('brand.badge', 'Jharkhand Eco & Cultural Tourism Platform')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
            {t('home.heroTitle1', 'Discover Untamed')}{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              {t('home.heroTitle2', 'Jharkhand')}
            </span>
            <br />
            <span className="block mt-2 text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-stone-100">
              {t('home.heroSubtitle', 'Sacred Hills, Cascades & Living Tribal Art')}
            </span>
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-stone-200 max-w-3xl mx-auto font-normal leading-relaxed">
            {t('home.heroDescription', 'Experience community-driven, carbon-conscious travel across 8 eco-rich districts. Connect with certified indigenous guides, book tribal homestays, and celebrate Dokra and Sohrai artisans.')}
          </p>

          {/* Search Bar with Clear Button */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl mx-auto mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-500/20"
          >
            <div className="relative flex-1 w-full flex items-center pl-3 pr-2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder', 'Search Betla, Hundru, Netarhat, Dokra art...')}
                className="w-full bg-transparent border-none text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none py-2.5 min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shrink-0 cursor-pointer h-10 sm:h-11"
            >
              {t('home.exploreNow', 'Explore Now')}
            </Button>
          </form>

          {/* Quick Category Pills with Horizontal Touch Scroll */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 pt-2 max-w-2xl mx-auto overflow-x-auto no-scrollbar pb-1 px-1">
            <span className="text-xs text-stone-300 font-semibold shrink-0">{t('home.quickFilters', 'Quick Filters:')}</span>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/explore?category=${cat.slug}`)}
                className="text-xs px-3 py-1 rounded-full bg-stone-900/80 hover:bg-emerald-800/80 border border-emerald-700/50 text-stone-200 hover:text-white transition-colors backdrop-blur-sm cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Mobile-Only Quick Action Hub: 6 Instant Thumb-Tap Tiles */}
      <div className="md:hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-b border-stone-800 px-4 py-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mobile Speed Hub</span>
          </span>
          <span className="text-[10px] text-stone-400 font-medium">1-Tap Fast Travel</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* 1. Eco Map & GPS */}
          <button
            onClick={() => {
              triggerHaptic(12);
              navigate('/map');
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-900/90 border border-emerald-500/30 text-center active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-100 block leading-tight">Eco Map</span>
            <span className="text-[9px] text-stone-400 block mt-0.5">Live GPS</span>
          </button>

          {/* 2. AI Trip Planner */}
          <button
            onClick={() => {
              triggerHaptic(12);
              navigate('/trip-planner');
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-emerald-950/80 to-stone-900 border border-emerald-400/40 text-center active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-1.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-100 block leading-tight">AI Planner</span>
            <span className="text-[9px] text-amber-300 font-semibold block mt-0.5">Custom In 10s</span>
          </button>

          {/* 3. Tribal Artisans & Crafts */}
          <button
            onClick={() => {
              triggerHaptic(12);
              navigate('/discover-local');
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-900/90 border border-amber-500/30 text-center active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
              <Palette className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-100 block leading-tight">Artisans</span>
            <span className="text-[9px] text-stone-400 block mt-0.5">Dokra Crafts</span>
          </button>

          {/* 4. Waterfalls & Sanctuaries */}
          <button
            onClick={() => {
              triggerHaptic(12);
              navigate('/explore?category=waterfalls');
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-900/90 border border-teal-500/30 text-center active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-1.5">
              <Waves className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-100 block leading-tight">Waterfalls</span>
            <span className="text-[9px] text-stone-400 block mt-0.5">Cascades</span>
          </button>

          {/* 5. Digital Eco Passes */}
          <button
            onClick={() => {
              triggerHaptic(12);
              navigate('/profile?tab=passes');
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-900/90 border border-emerald-500/30 text-center active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-1.5">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-100 block leading-tight">Eco Passes</span>
            <span className="text-[9px] text-stone-400 block mt-0.5">QR Entry</span>
          </button>

          {/* 6. Emergency Forest SOS (Instant 112) */}
          <button
            onClick={() => {
              triggerHaptic(20);
              setSosModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-center active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-rose-500/30 text-rose-300 flex items-center justify-center mb-1.5">
              <span className="text-base">🆘</span>
            </div>
            <span className="text-xs font-black text-rose-200 block leading-tight">Forest SOS</span>
            <span className="text-[9px] text-rose-300 font-bold block mt-0.5">24x7 Help</span>
          </button>
        </div>
      </div>

      {/* Emergency Help Modal */}
      <EmergencyHelpModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        navigate={navigate}
      />

      {/* 2. Key SIH Pillar Highlights — Clean Light Neutral Surface */}
      <div className="border-y border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/70 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Green Eco-Pass
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">100% Zero Plastic & Forest-Safe</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-800">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Indigenous Artisans
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">Dokra & Sohrai GI Crafts</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-300 dark:border-blue-800">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Certified Tribal Guides
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">Direct Native Livelihoods</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-300 dark:border-teal-800">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Interactive Tourism Map
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">Live Crowd & Route Info</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Featured Destinations Section — Clean White Surface with Green Destination Cards */}
      <section className="w-full py-12 sm:py-16 md:py-20 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 relative overflow-hidden border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Featured Tourist Places</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                Must-Visit Eco & Heritage Destinations
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl">
                Curated key attractions across Jharkhand featuring real-time crowd indicators, entry timings, and certified native guides.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/explore')}
              className="gap-2 font-bold text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0 self-start sm:self-auto shadow-sm"
            >
              <span>View All Destinations</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 animate-pulse border border-stone-200 dark:border-stone-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredDestinations.map((dest) => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  onClick={(slug) => navigate(`/destinations/${slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Real-Time Crowd Intelligence & Responsible Travel Section — Rich Forest Emerald Gradient */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white relative overflow-hidden border-y border-emerald-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live State Tourism Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Smart Crowd Monitoring & Underutilized Destinations
              </h2>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                Prevent overcrowding at fragile ecological landmarks. Our live telemetry identifies quiet hidden gems like Lodh Falls and Kiriburu, helping you enjoy unhurried nature while distributing economic benefits to local tribal hamlets.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-red-500/30 text-xs font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-300">🔴 High Crowd</span>
                </div>
                <div className="flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300">🟢 Medium Crowd</span>
                </div>
                <div className="flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="text-amber-300">🟡 Low Crowd (Recommended)</span>
                </div>
              </div>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate('/map')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-6 py-2.5 shadow-lg"
                >
                  <Compass className="h-4 w-4 mr-1.5" />
                  Open Live Eco Map
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="border-emerald-400/40 text-emerald-100 hover:bg-emerald-900/50 hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Government Dashboard
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-emerald-700/40 space-y-2">
                <div className="text-emerald-400 font-extrabold text-2xl">8</div>
                <div className="text-sm font-bold text-white">Active District Hubs</div>
                <div className="text-xs text-stone-400">Ranchi, Latehar, Giridih, East Singhbhum & more</div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-emerald-700/40 space-y-2">
                <div className="text-emerald-400 font-extrabold text-2xl">100%</div>
                <div className="text-sm font-bold text-white">Plastic-Free Mandate</div>
                <div className="text-xs text-stone-400">Enforced by digital eco-checkpoints & rangers</div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-emerald-700/40 space-y-2">
                <div className="text-amber-400 font-extrabold text-2xl">GI-Tagged</div>
                <div className="text-sm font-bold text-white">Sohrai & Dokra Art</div>
                <div className="text-xs text-stone-400">Direct artisan cooperatives with fair wage guarantees</div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-emerald-700/40 space-y-2">
                <div className="text-emerald-400 font-extrabold text-2xl">24x7</div>
                <div className="text-sm font-bold text-white">Emergency SOS</div>
                <div className="text-xs text-stone-400">Instant GPS dispatch for ambulance, police & rescue</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Explore by Tourism Category — Light Neutral Section */}
      <Section
        title="Experience Jharkhand by Theme"
        subtitle="From soaring waterfalls to ancient Jain pilgrimage trails and tiger wildlife reserves."
        className="bg-stone-50/70 dark:bg-stone-900/40"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            return (
              <div
                key={category.id}
                onClick={() => navigate(`/explore?category=${category.slug}`)}
                className="group p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between h-44"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h4 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 6. Call to Action: Sustainable Itinerary Builder — The Visual Benchmark */}
      <Section className="py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 p-8 sm:p-12 text-white shadow-2xl border border-emerald-500/30">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Create Your Custom Jharkhand Itinerary in 60 Seconds
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Select your travel style, preferred districts, and group budget. Our smart planner calculates your estimated eco-carbon offset and generates a day-by-day travel map with certified local guides.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/trip-planner')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/80 font-bold px-6 py-3 shadow-lg hover:shadow-xl transition-all h-11"
              >
                <Sparkles className="h-4 w-4 mr-1.5 text-amber-300" />
                <span className="text-white font-bold">Start Trip Planner</span>
              </Button>
              <Button
                onClick={() => navigate('/map')}
                className="bg-emerald-950/80 hover:bg-emerald-900 text-white border-2 border-emerald-400/60 font-bold px-6 py-3 shadow-md hover:shadow-lg transition-all h-11"
              >
                <Compass className="h-4 w-4 mr-1.5 text-emerald-300" />
                <span className="text-white">Explore Map</span>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

