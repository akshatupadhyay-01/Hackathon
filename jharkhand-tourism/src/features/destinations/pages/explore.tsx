import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Leaf,
  Compass,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { Destination, Category, District } from '../../../types/database';
import { fetchDestinations, fetchCategories, fetchDistricts } from '../services/destinations';
import { DestinationCard } from '../components/destination-card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Section } from '../../../components/layout/section';
import { Skeleton } from '../../../components/ui/skeleton';
import { SEO } from '../../../components/common/seo';

interface ExplorePageProps {
  navigate: (path: string) => void;
  initialSearch?: string;
  initialCategory?: string;
}

export function ExplorePage({
  navigate,
  initialSearch = '',
  initialCategory = 'all',
}: ExplorePageProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [ecoCertifiedOnly, setEcoCertifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync state if props change (e.g. navigation query params)
  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Load initial dropdown options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [catData, distData] = await Promise.all([
          fetchCategories(),
          fetchDistricts(),
        ]);
        setCategories(catData);
        setDistricts(distData);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch destinations from data layer whenever filter states update
  useEffect(() => {
    let isCancelled = false;

    async function loadDestinations() {
      setLoading(true);
      try {
        const data = await fetchDestinations({
          categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined,
          districtId: selectedDistrict !== 'all' ? selectedDistrict : undefined,
          searchQuery: searchQuery.trim() || undefined,
          ecoCertifiedOnly: ecoCertifiedOnly ? true : undefined,
        });
        if (!isCancelled) {
          setDestinations(data);
        }
      } catch (err) {
        console.error('Error loading destinations:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadDestinations();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, selectedDistrict, searchQuery, ecoCertifiedOnly]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDistrict('all');
    setEcoCertifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-stone-50/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-8 md:py-12">
      <SEO
        title="Explore All Destinations — Waterfalls, Hills, Sanctuaries & Temples"
        description="Browse certified eco-tourism destinations across 8 districts of Jharkhand. Filter by district, waterfalls, spiritual sites, wildlife reserves, and crowd levels."
        keywords="Jharkhand destinations, Ranchi waterfalls, Latehar hills, Betla safari, Parasnath Jain peak, Patratu valley, Baidyanath Jyotirlinga, Jharkhand eco tourism catalog"
        canonicalPath="/explore"
        ogType="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" className="gap-1 text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold">
                <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Live Destination Catalog
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Explore Jharkhand Eco & Cultural Sites
            </h1>
            <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 max-w-3xl">
              Browse state-wide eco-tourism hotspots, sacred waterfalls, ancient shrines, and biodiversity parks. Filter by district, theme, and eco-certification.
            </p>
          </div>
          <Button
            onClick={() => navigate('/map')}
            className="self-start sm:self-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shrink-0 shadow-md"
          >
            <Compass className="h-4 w-4 text-white" />
            <span>Explore Map</span>
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          {/* Top Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination name, district, activities or tags..."
              className="pl-10 h-11 text-sm bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white font-bold shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-medium'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-emerald-700 text-white font-bold shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-medium'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Secondary District Dropdown & Eco Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* District Select */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-stone-600 dark:text-stone-400 font-medium">District:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All Districts (8 Active)</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Eco-Certified Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-lg text-emerald-800 dark:text-emerald-300 font-semibold">
                <input
                  type="checkbox"
                  checked={ecoCertifiedOnly}
                  onChange={(e) => setEcoCertifiedOnly(e.target.checked)}
                  className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Eco-Certified Only</span>
              </label>
            </div>

            {/* Reset Button */}
            {(searchQuery || selectedCategory !== 'all' || selectedDistrict !== 'all' || ecoCertifiedOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white text-xs gap-1 h-7"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
          <span>
            Showing <strong className="text-stone-900 dark:text-stone-100 font-bold">{destinations.length}</strong> destinations
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
            Verified Jharkhand Database
          </span>
        </div>

        {/* Destination Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
            ))}
          </div>
        ) : destinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {destinations.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onClick={(slug) => navigate(`/destinations/${slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
            <Compass className="h-12 w-12 text-stone-400 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              No destinations match your criteria
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Try adjusting your search query, removing district filters, or clearing the category selection.
            </p>
            <Button onClick={handleResetFilters} className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
