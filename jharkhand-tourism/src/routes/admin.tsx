import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Leaf,
  MapPin,
  Building,
  AlertTriangle,
  Zap,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Info,
  Compass,
  ArrowUpRight,
  ArrowLeft,
  FileText,
  Clock,
  Eye,
  Store,
  HelpCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CrowdIntelligenceMap } from '../components/crowd-intelligence-map';
import { TouristVoiceHeatmap } from '../components/tourist-voice-heatmap';
import { Destination, District, Category } from '../types/database';
import {
  fetchDestinations,
  fetchDistricts,
  fetchCategories,
} from '../services/destinations';
import {
  GovCrowdStatus,
  GOV_CROWD_CONFIGS,
  getGovCrowdStatus,
  getTourismPulseMetrics,
  getUnderutilizedDestinations,
  getTouristSpendingBreakdown,
  getDemoComplaints,
  getRecommendedGovernmentActions,
  getDistrictIntelligenceData,
  getDestinationIntelligenceRecords,
  DestinationIntelligenceRecord,
} from '../services/tourismIntelligence';
import {
  getGovernmentReviewIntelligence,
  getStoredTouristReviews,
  getDestinationReviewSummary,
  approveTouristReview,
  rejectTouristReview,
  flagTouristReview,
  TouristReview,
  ReviewGovIntelligence,
  DestinationReviewSummary,
  ALL_REVIEW_TAGS,
} from '../services/reviewIntelligence';

interface AdminPageProps {
  navigate: (path: string) => void;
}

export function AdminPage({ navigate }: AdminPageProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<
    | 'reviews'
    | 'sentiment_map'
    | 'map'
    | 'underutilized'
    | 'spending'
    | 'complaints'
    | 'recommendations'
    | 'districts'
    | 'table'
    | 'verification'
  >('reviews');

  // Master Table Filters
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableDistrictFilter, setTableDistrictFilter] = useState<string>('all');
  const [tableCrowdFilter, setTableCrowdFilter] = useState<string>('all');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>('all');

  // Selected Destination for Drill-Down Review Intelligence
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);

  // Search & Filters for Tourist Destinations
  const [destSearch, setDestSearch] = useState<string>('');
  const [destDistrict, setDestDistrict] = useState<string>('all');
  const [destCategory, setDestCategory] = useState<string>('all');
  const [destCrowd, setDestCrowd] = useState<string>('all');
  const [destSentiment, setDestSentiment] = useState<string>('all');
  const [showModerationQueue, setShowModerationQueue] = useState<boolean>(false);

  // Review Intelligence & Moderation State
  const [allReviews, setAllReviews] = useState<TouristReview[]>(() => getStoredTouristReviews());
  const [moderationStatusFilter, setModerationStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewSearchQuery, setReviewSearchQuery] = useState<string>('');
  const [reviewDistrictFilter, setReviewDistrictFilter] = useState<string>('all');

  const refreshReviews = () => {
    setAllReviews(getStoredTouristReviews());
  };

  const handleApproveReview = (id: string) => {
    approveTouristReview(id);
    refreshReviews();
  };

  const handleRejectReview = (id: string) => {
    rejectTouristReview(id);
    refreshReviews();
  };

  const handleFlagReview = (id: string) => {
    flagTouristReview(id);
    refreshReviews();
  };

  // Existing Provider Verification Queue
  const [queue, setQueue] = useState([
    {
      id: '1',
      name: 'Malhor Dokra Brass Art Collective',
      type: 'Artisan Craft Guild',
      district: 'Hazaribagh',
      status: 'Verified',
      contact: '+91 94317 01928',
    },
    {
      id: '2',
      name: 'Netarhat Sal Grove Homestay',
      type: 'Eco Homestay',
      district: 'Latehar',
      status: 'Verified',
      contact: '+91 94303 55190',
    },
    {
      id: '3',
      name: 'Paitkar Scroll Art Studio',
      type: 'Indigenous Craft',
      district: 'East Singhbhum',
      status: 'Pending Verification',
      contact: '+91 98351 12345',
    },
    {
      id: '4',
      name: 'Jonha Waterfall Tea & Tribal Snacks Guild',
      type: 'Street Food Stall Collective',
      district: 'Ranchi',
      status: 'Pending Verification',
      contact: '+91 94311 55432',
    },
  ]);

  const handleApprove = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Verified' } : item))
    );
  };

  // Load Data
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [destData, distData, catData] = await Promise.all([
          fetchDestinations(),
          fetchDistricts(),
          fetchCategories(),
        ]);
        if (!isCancelled) {
          setDestinations(destData);
          setDistricts(distData);
          setCategories(catData);
        }
      } catch (err) {
        console.error('Error loading intelligence data:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Compute Intelligence Metrics
  const pulseMetrics = useMemo(() => {
    return getTourismPulseMetrics(destinations);
  }, [destinations]);

  const underutilizedOpportunities = useMemo(() => {
    return getUnderutilizedDestinations(destinations);
  }, [destinations]);

  const spendingBreakdown = useMemo(() => {
    return getTouristSpendingBreakdown(pulseMetrics.estimatedMonthlySpendInr);
  }, [pulseMetrics.estimatedMonthlySpendInr]);

  const complaintsList = useMemo(() => {
    return getDemoComplaints();
  }, []);

  const govActions = useMemo(() => {
    return getRecommendedGovernmentActions(destinations);
  }, [destinations]);

  const districtIntelligence = useMemo(() => {
    return getDistrictIntelligenceData(districts, destinations);
  }, [districts, destinations]);

  const masterRecords = useMemo(() => {
    return getDestinationIntelligenceRecords(destinations);
  }, [destinations]);

  // Review & Tourist Voice Intelligence
  const reviewGovIntelligence = useMemo(() => {
    return getGovernmentReviewIntelligence(destinations);
  }, [destinations, allReviews]);

  const pendingReviews = useMemo(() => {
    return allReviews.filter((r) => r.status === 'pending');
  }, [allReviews]);

  // Destination Intelligence List (for clean drill-down view)
  const destinationIntelligenceList = useMemo(() => {
    return destinations.map((d) => {
      const summary = getDestinationReviewSummary(d.id, destinations);
      const crowdStatus = getGovCrowdStatus(d.crowd_status);
      
      let sentimentType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
      if (summary.positivePercentage >= 75) {
        sentimentType = 'POSITIVE';
      } else if (summary.negativePercentage >= 20 || summary.overallRating < 3.5) {
        sentimentType = 'NEGATIVE';
      }

      // Actionable government insight
      let govInsight = 'Balanced visitor flow with stable sentiment index. Maintain routine eco-guideline adherence and native vendor coordination.';
      if (crowdStatus === 'HIGH' && sentimentType === 'POSITIVE') {
        govInsight = 'High visitor pressure with mostly positive sentiment. Monitor crowd management and parking during peak periods.';
      } else if (crowdStatus === 'HIGH' && sentimentType === 'NEGATIVE') {
        govInsight = 'Critical visitor congestion causing service and sanitation bottlenecks. Immediate deployment of parking wardens and waste management required.';
      } else if (crowdStatus === 'LOW' && sentimentType === 'POSITIVE') {
        govInsight = 'High traveler delight with underutilized capacity. Prime candidate for state diversion campaigns to relieve pressure from flagship hubs.';
      } else if (crowdStatus === 'LOW' && sentimentType === 'NEGATIVE') {
        govInsight = 'Underutilized site with basic infrastructure deficits reported. Address approach road signage and sanitation facilities before major marketing.';
      }

      return {
        destination: d,
        summary,
        crowdStatus,
        sentimentType,
        govInsight,
      };
    });
  }, [destinations, allReviews]);

  // Filtered Destinations for List View
  const filteredDestinations = useMemo(() => {
    return destinationIntelligenceList.filter((item) => {
      const matchSearch =
        !destSearch ||
        item.destination.name.toLowerCase().includes(destSearch.toLowerCase()) ||
        item.destination.district?.name.toLowerCase().includes(destSearch.toLowerCase()) ||
        item.destination.category?.name.toLowerCase().includes(destSearch.toLowerCase());

      const matchDistrict =
        destDistrict === 'all' || item.destination.district_id === destDistrict;

      const matchCategory =
        destCategory === 'all' ||
        item.destination.category?.slug === destCategory ||
        item.destination.category_id === destCategory;

      const matchCrowd =
        destCrowd === 'all' || item.crowdStatus === destCrowd;

      const matchSentiment =
        destSentiment === 'all' || item.sentimentType === destSentiment;

      return matchSearch && matchDistrict && matchCategory && matchCrowd && matchSentiment;
    });
  }, [destinationIntelligenceList, destSearch, destDistrict, destCategory, destCrowd, destSentiment]);

  // Selected Destination Drill-Down Data
  const selectedDestinationItem = useMemo(() => {
    if (!selectedDestId) return null;
    return destinationIntelligenceList.find((i) => i.destination.id === selectedDestId) || null;
  }, [selectedDestId, destinationIntelligenceList]);

  // Filter Master Records
  const filteredMasterRecords = useMemo(() => {
    return masterRecords.filter((record) => {
      const matchSearch =
        !tableSearch ||
        record.destination.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        record.destination.district?.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        record.destination.category?.name.toLowerCase().includes(tableSearch.toLowerCase());

      const matchDistrict =
        tableDistrictFilter === 'all' || record.destination.district_id === tableDistrictFilter;

      const matchCrowd =
        tableCrowdFilter === 'all' || record.crowdStatus === tableCrowdFilter;

      const matchCategory =
        tableCategoryFilter === 'all' || record.destination.category?.slug === tableCategoryFilter;

      return matchSearch && matchDistrict && matchCrowd && matchCategory;
    });
  }, [masterRecords, tableSearch, tableDistrictFilter, tableCrowdFilter, tableCategoryFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 py-6 md:py-10 text-stone-900 dark:text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        
        {/* ========================================================================= */}
        {/* DASHBOARD HEADER & SYSTEM STATUS                                         */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald" className="gap-1.5 text-xs font-bold px-2.5 py-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Directorate of Tourism • Govt. of Jharkhand
              </Badge>
              <Badge
                variant="outline"
                className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
              >
                📊 Estimated Demo Analytics Mode
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Jharkhand Tourism Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-3xl">
              State-wide tourist footfall monitoring, carrying capacity alerts, underutilized destination detection, community economic impact, and actionable governance recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-9 gap-1.5 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/business')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold shadow-sm"
            >
              + Register Provider
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOURISM PULSE: TOP 8 KPI SECTION                                         */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Tourism Pulse • Key Indicators
              </h2>
            </div>
            <span className="text-[11px] text-stone-400">
              *Metrics derived transparently from active project dataset
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Total Destinations */}
            <Card className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-semibold text-stone-500">Total Sites</span>
              <div className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                {pulseMetrics.totalDestinations}
              </div>
              <span className="text-[9.5px] text-stone-400 block">8 Districts</span>
            </Card>

            {/* 🔴 High Crowd Destinations */}
            <Card className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                <span>🔴</span> High Crowd
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-red-700 dark:text-red-300">
                {pulseMetrics.highCrowdDestinations}
              </div>
              <span className="text-[9.5px] text-red-600 dark:text-red-400 block font-medium">
                High Pressure Sites
              </span>
            </Card>

            {/* 🟢 Medium Crowd Destinations */}
            <Card className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>🟢</span> Med Crowd
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {pulseMetrics.mediumCrowdDestinations}
              </div>
              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 block font-medium">
                Balanced Eco-Flow
              </span>
            </Card>

            {/* 🟡 Low Crowd / Opportunity */}
            <Card className="p-3.5 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <span>🟡</span> Low Crowd
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-800 dark:text-amber-300">
                {pulseMetrics.lowCrowdDestinations}
              </div>
              <span className="text-[9.5px] text-amber-700 dark:text-amber-400 block font-medium">
                Opportunity Hubs
              </span>
            </Card>

            {/* Estimated Footfall */}
            <Card className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-semibold text-stone-500">Est. Footfall</span>
              <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100">
                ~{(pulseMetrics.estimatedMonthlyFootfall / 1000).toFixed(1)}k
              </div>
              <span className="text-[9.5px] text-stone-400 block">Monthly visitors</span>
            </Card>

            {/* Local Economic Impact */}
            <Card className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300">
                Local Impact
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                ₹{(pulseMetrics.estimatedMonthlySpendInr / 10000000).toFixed(2)} Cr
              </div>
              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 block">
                Direct village retain
              </span>
            </Card>

            {/* Active Local Vendors */}
            <Card className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-semibold text-stone-500">Local Vendors</span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                {pulseMetrics.activeVendorsCount}+
              </div>
              <span className="text-[9.5px] text-stone-400 block">Food & crafts stalls</span>
            </Card>

            {/* Complaints Resolution */}
            <Card className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-xs">
              <span className="text-[10.5px] font-semibold text-stone-500">Complaints</span>
              <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                <span>{pulseMetrics.totalComplaints}</span>
                <span className="text-[11px] font-normal text-emerald-600">
                  ({pulseMetrics.resolvedComplaints} fixed)
                </span>
              </div>
              <span className="text-[9.5px] text-amber-600 dark:text-amber-400 block font-semibold">
                {pulseMetrics.openComplaints} active cases
              </span>
            </Card>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRIMARY NAVIGATION TABS                                                   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 scrollbar-none">
          {[
            {
              id: 'reviews',
              label: '📍 Tourist Destinations',
              badge: `${destinations.length} Sites`,
            },
            {
              id: 'sentiment_map',
              label: '🗺️ Tourist Sentiment Heatmap',
              badge: 'WOW #6',
            },
            { id: 'map', label: '🗺️ Crowd Intelligence Map', badge: 'WOW #1' },
            { id: 'underutilized', label: '🔍 Underutilized Detector', badge: 'WOW #2' },
            { id: 'spending', label: '💰 Spending & Local Economy', badge: 'WOW #3' },
            { id: 'complaints', label: '⚠️ Complaint Intelligence', badge: 'WOW #4' },
            { id: 'recommendations', label: '⚡ Recommended Govt Actions', badge: 'WOW #5' },
            { id: 'districts', label: '📊 District Intelligence', badge: '8 Districts' },
            { id: 'table', label: '📋 Master Destination Table', badge: 'Searchable' },
            {
              id: 'verification',
              label: '🛡️ Provider Verification',
              badge: `${queue.filter((q) => q.status !== 'Verified').length} Pending`,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB: TOURIST DESTINATIONS & DRILL-DOWN REVIEW INTELLIGENCE                */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* View Mode 1: Review Moderation Queue (if toggled) */}
            {showModerationQueue ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModerationQueue(false)}
                    className="text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Tourist Destinations</span>
                  </Button>

                  <Badge variant="outline" className="text-xs font-bold bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-stone-300 dark:border-stone-700">
                    🛡️ Pending Moderation: {pendingReviews.length}
                  </Badge>
                </div>

                <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span>🛡️</span>
                        <span>Tourist Review Moderation Queue</span>
                      </h4>
                      <p className="text-xs text-stone-500">
                        Review and approve submitted tourist experiences before public display and intelligence ingestion.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setModerationStatusFilter(st)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            moderationStatusFilter === st
                              ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-500'
                              : 'bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-750 hover:bg-stone-200 dark:hover:bg-stone-800'
                          }`}
                        >
                          {st === 'pending'
                            ? `Pending (${pendingReviews.length})`
                            : st === 'approved'
                            ? 'Approved'
                            : st === 'rejected'
                            ? 'Rejected'
                            : 'All Reviews'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase tracking-wider">
                          <th className="pb-3 pl-2">Reviewer</th>
                          <th className="pb-3">Destination</th>
                          <th className="pb-3">Rating</th>
                          <th className="pb-3">Sentiment</th>
                          <th className="pb-3">Feedback</th>
                          <th className="pb-3">Tags</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {allReviews
                          .filter((r) => moderationStatusFilter === 'all' || r.status === moderationStatusFilter)
                          .map((rev) => {
                            const dest = destinations.find((d) => d.id === rev.destination_id);
                            return (
                              <tr key={rev.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                                <td className="py-3 pl-2 font-bold text-stone-900 dark:text-stone-100">
                                  {rev.author_name}
                                </td>
                                <td className="py-3 text-stone-700 dark:text-stone-300">
                                  {dest?.name || 'Destination'}
                                </td>
                                <td className="py-3 text-amber-500 font-bold">
                                  ★ {rev.rating}
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9.5px] font-bold ${
                                      rev.sentiment === 'POSITIVE'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : rev.sentiment === 'NEUTRAL'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : 'bg-rose-50 text-rose-800 border-rose-300'
                                    }`}
                                  >
                                    {rev.sentiment === 'POSITIVE'
                                      ? '🟢 Positive'
                                      : rev.sentiment === 'NEUTRAL'
                                      ? '🟡 Neutral'
                                      : '🔴 Negative'}
                                  </Badge>
                                </td>
                                <td className="py-3 text-stone-600 dark:text-stone-300 max-w-xs text-[11px] leading-relaxed">
                                  "{rev.comment}"
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {rev.tags?.slice(0, 2).map((t) => (
                                      <span
                                        key={t}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant={
                                      rev.status === 'approved'
                                        ? 'emerald'
                                        : rev.status === 'pending'
                                        ? 'amber'
                                        : 'destructive'
                                    }
                                    className="text-[10px] font-bold"
                                  >
                                    {rev.status}
                                  </Badge>
                                </td>
                                <td className="py-3 text-right pr-2">
                                  {rev.status === 'pending' ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveReview(rev.id)}
                                        className="h-7 text-[10.5px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectReview(rev.id)}
                                        className="h-7 text-[10.5px] text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 border-rose-300 dark:border-rose-800 font-bold bg-transparent"
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-stone-400">
                                      {rev.status === 'approved' ? '✓ Published' : '✗ Rejected'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : selectedDestinationItem ? (
              /* View Mode 2: DRILL-DOWN REVIEW INTELLIGENCE VIEW */
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDestId(null)}
                    className="text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Tourist Destinations</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium hidden sm:inline">Switch Site:</span>
                    <select
                      value={selectedDestId || ''}
                      onChange={(e) => setSelectedDestId(e.target.value)}
                      className="text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-3 py-1.5 font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.district?.name})
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/destinations/${selectedDestinationItem.destination.slug}`)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1"
                    >
                      <span>Public Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Drill-down Intelligence Card */}
                <Card className="p-6 md:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-6 shadow-sm">
                  {/* Destination Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-emerald-700 text-white text-[10px] font-bold">
                          {selectedDestinationItem.destination.category?.name || 'Ecotourism'}
                        </Badge>
                        <span className="text-xs text-stone-500 font-medium">
                          {selectedDestinationItem.destination.district?.name}, Jharkhand
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                        {selectedDestinationItem.destination.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold px-3 py-1 rounded-xl ${
                          selectedDestinationItem.crowdStatus === 'HIGH'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300'
                            : selectedDestinationItem.crowdStatus === 'MEDIUM'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                        }`}
                      >
                        {selectedDestinationItem.crowdStatus === 'HIGH'
                          ? '🔴 High Crowd'
                          : selectedDestinationItem.crowdStatus === 'MEDIUM'
                          ? '🟡 Moderate Crowd'
                          : '🟢 Low Crowd'}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`text-xs font-bold px-3 py-1 rounded-xl ${
                          selectedDestinationItem.sentimentType === 'POSITIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            : selectedDestinationItem.sentimentType === 'NEUTRAL'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300'
                        }`}
                      >
                        {selectedDestinationItem.sentimentType === 'POSITIVE'
                          ? '🟢 Positive Sentiment'
                          : selectedDestinationItem.sentimentType === 'NEUTRAL'
                          ? '🟡 Neutral Sentiment'
                          : '🔴 Negative Signals'}
                      </Badge>
                    </div>
                  </div>

                  {/* Section Title: TOURIST REVIEW INTELLIGENCE */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-4">
                      <span>🗣️</span>
                      <span>TOURIST REVIEW INTELLIGENCE</span>
                      <span className="h-px flex-1 bg-emerald-200 dark:bg-emerald-900/60 ml-2" />
                    </div>

                    {/* KPI Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Rating Metric */}
                      <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                          Average Rating
                        </span>
                        <div className="text-3xl sm:text-4xl font-black text-amber-500 flex items-center gap-1.5">
                          <span>⭐</span>
                          <span>{selectedDestinationItem.summary.overallRating}</span>
                          <span className="text-sm font-normal text-stone-400">/ 5</span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium">
                          From {selectedDestinationItem.summary.totalApprovedReviews} verified tourist reviews
                        </p>
                      </div>

                      {/* Sentiment Breakdown */}
                      <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2">
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                          Sentiment Breakdown
                        </span>
                        <div className="space-y-1.5 text-xs pt-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <span>🟢</span> Positive
                            </span>
                            <span className="font-extrabold text-stone-900 dark:text-stone-100">
                              {selectedDestinationItem.summary.positivePercentage}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <span>🟡</span> Neutral
                            </span>
                            <span className="font-extrabold text-stone-900 dark:text-stone-100">
                              {selectedDestinationItem.summary.neutralPercentage}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                              <span>🔴</span> Negative
                            </span>
                            <span className="font-extrabold text-stone-900 dark:text-stone-100">
                              {selectedDestinationItem.summary.negativePercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tourist Experience Score (TES) */}
                      <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 space-y-1">
                        <span className="text-xs font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wide">
                          Tourist Experience Score
                        </span>
                        <div className="text-3xl sm:text-4xl font-black text-teal-700 dark:text-teal-300">
                          {selectedDestinationItem.summary.touristExperienceScore}
                          <span className="text-sm font-bold text-teal-600/70"> / 100</span>
                        </div>
                        <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                          {selectedDestinationItem.summary.touristExperienceScore >= 80
                            ? '🌟 Excellent Traveler Satisfaction'
                            : selectedDestinationItem.summary.touristExperienceScore >= 65
                            ? '👍 Good Visitor Health'
                            : '⚠️ Needs Operational Attention'}
                        </p>
                      </div>
                    </div>

                    {/* Top Positive Feedback & Top Issues */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                      {/* Top Positive Feedback */}
                      <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 space-y-2.5">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Top Positive Feedback</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium">
                          {selectedDestinationItem.summary.topPositiveThemes.map((theme, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{theme}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Top Issues */}
                      <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 space-y-2.5">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Top Issues</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium">
                          {selectedDestinationItem.summary.topNegativeIssues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-600 font-bold">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Government Insight */}
                    <div className="mt-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                          Government Insight & Actionable Directive
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                        "{selectedDestinationItem.govInsight}"
                      </p>
                    </div>

                    {/* Aspect Satisfaction Breakdown */}
                    <div className="mt-6 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                        Aspect Satisfaction Breakdown
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {Object.entries(selectedDestinationItem.summary.categoryFeedback)
                          .filter(([_, data]) => data.count > 0)
                          .map(([tag, data]) => (
                            <div
                              key={tag}
                              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-1"
                            >
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-stone-700 dark:text-stone-300 truncate">{tag}</span>
                                <span className="text-emerald-600">{Math.round(data.positiveRatio * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${Math.round(data.positiveRatio * 100)}%` }}
                                  className="bg-emerald-600 h-full rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Recent Approved Reviews */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          Recent Approved Tourist Reviews ({selectedDestinationItem.summary.recentReviews.length})
                        </h4>
                      </div>

                      {selectedDestinationItem.summary.recentReviews.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                          No approved reviews submitted yet for this destination.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedDestinationItem.summary.recentReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-xs text-stone-900 dark:text-stone-100">
                                  {rev.author_name}
                                </div>
                                <div className="text-xs text-amber-500 font-bold">
                                  {'★'.repeat(rev.rating)}
                                </div>
                              </div>
                              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                "{rev.comment}"
                              </p>
                              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                                <div className="flex flex-wrap gap-1">
                                  {rev.tags.map((t) => (
                                    <span key={t} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                                <span>{rev.visit_date || 'Verified tourist'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              /* View Mode 3: CLEAN DESTINATION LIST WITH SEARCH & FILTERS */
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-700 text-white text-xs font-bold">
                        Tourist Destinations
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-stone-500">
                        {filteredDestinations.length} of {destinations.length} Sites
                      </Badge>
                    </div>
                    <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
                      Statewide Tourist Destinations
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                      Select any destination to open its detailed Tourist Review Intelligence, sentiment breakdown, and government directives.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowModerationQueue(true)}
                      className="text-xs font-bold flex items-center gap-1.5 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Review Moderation</span>
                      {pendingReviews.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                          {pendingReviews.length}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* SEARCH + FILTERS BAR */}
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        value={destSearch}
                        onChange={(e) => setDestSearch(e.target.value)}
                        placeholder="Search destination by name, district, or category..."
                        className="pl-9 text-xs rounded-xl bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 h-9"
                      />
                      {destSearch && (
                        <button
                          onClick={() => setDestSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter: District */}
                    <select
                      value={destDistrict}
                      onChange={(e) => setDestDistrict(e.target.value)}
                      className="text-xs rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 px-3 py-2 text-stone-800 dark:text-stone-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
                    >
                      <option value="all">All Districts (8)</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    {/* Filter: Category */}
                    <select
                      value={destCategory}
                      onChange={(e) => setDestCategory(e.target.value)}
                      className="text-xs rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 px-3 py-2 text-stone-800 dark:text-stone-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    {/* Filter: Crowd Level */}
                    <select
                      value={destCrowd}
                      onChange={(e) => setDestCrowd(e.target.value)}
                      className="text-xs rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 px-3 py-2 text-stone-800 dark:text-stone-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
                    >
                      <option value="all">All Crowd Levels</option>
                      <option value="LOW">🟢 Low Crowd</option>
                      <option value="MEDIUM">🟡 Moderate Crowd</option>
                      <option value="HIGH">🔴 High Crowd</option>
                    </select>

                    {/* Filter: Sentiment */}
                    <select
                      value={destSentiment}
                      onChange={(e) => setDestSentiment(e.target.value)}
                      className="text-xs rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 px-3 py-2 text-stone-800 dark:text-stone-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
                    >
                      <option value="all">All Sentiments</option>
                      <option value="POSITIVE">🟢 Positive</option>
                      <option value="NEUTRAL">🟡 Neutral</option>
                      <option value="NEGATIVE">🔴 Negative</option>
                    </select>

                    {/* Reset Filters */}
                    {(destSearch || destDistrict !== 'all' || destCategory !== 'all' || destCrowd !== 'all' || destSentiment !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDestSearch('');
                          setDestDistrict('all');
                          setDestCategory('all');
                          setDestCrowd('all');
                          setDestSentiment('all');
                        }}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 h-9 px-2.5 font-bold shrink-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* DESTINATION LIST (Compact, Clean & Scannable Grid) */}
                {filteredDestinations.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3">
                    <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                      No destinations match the selected search and filter criteria.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDestSearch('');
                        setDestDistrict('all');
                        setDestCategory('all');
                        setDestCrowd('all');
                        setDestSentiment('all');
                      }}
                      className="text-xs font-bold bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDestinations.map((item) => (
                      <div
                        key={item.destination.id}
                        onClick={() => setSelectedDestId(item.destination.id)}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/70 dark:hover:border-emerald-500/70 hover:shadow-md transition-all cursor-pointer group space-y-3.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {item.destination.name}
                              </h4>
                              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                                {item.destination.district?.name} • {item.destination.category?.name}
                              </p>
                            </div>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-0.5">
                              Intelligence →
                            </span>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                          {/* Crowd Status */}
                          <div className="flex items-center font-semibold">
                            {item.crowdStatus === 'HIGH' ? (
                              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold">
                                <span>🔴</span> High Crowd
                              </span>
                            ) : item.crowdStatus === 'MEDIUM' ? (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                                <span>🟡</span> Moderate Crowd
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                                <span>🟢</span> Low Crowd
                              </span>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1 font-bold text-amber-500">
                            <span>⭐</span>
                            <span>{item.summary.overallRating}</span>
                            <span className="text-[10px] text-stone-400 font-normal">
                              ({item.summary.totalApprovedReviews})
                            </span>
                          </div>

                          {/* Sentiment */}
                          <div className="flex items-center">
                            {item.sentimentType === 'POSITIVE' ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10px] font-bold"
                              >
                                🟢 Positive
                              </Badge>
                            ) : item.sentimentType === 'NEUTRAL' ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 text-[10px] font-bold"
                              >
                                🟡 Neutral
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 text-[10px] font-bold"
                              >
                                🔴 Negative
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: WOW #6 — TOURIST VOICE SENTIMENT HEATMAP                             */}
        {/* ========================================================================= */}
        {activeTab === 'sentiment_map' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Statewide Tourist Sentiment Spatial Heatmap</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Spatial representation of tourist satisfaction across all 8 districts: 🟢 GREEN = High Positive (&gt;75%) • 🟡 DARK YELLOW = Mixed/Neutral • 🔴 RED = Significant Issues.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-bold border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  🟢 Positive Sentiments
                </Badge>
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-bold border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  🟡 Mixed Sentiments
                </Badge>
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-bold border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  🔴 Negative Signals
                </Badge>
              </div>
            </div>

            <TouristVoiceHeatmap
              destinations={destinations}
              districts={districts}
              navigate={navigate}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: WOW #1 — TOURISM CROWD INTELLIGENCE MAP                            */}
        {/* ========================================================================= */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Statewide Crowd Pressure & Carrying Capacity Map</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time spatial visualization using standardized classification: 🔴 RED = High Crowd • 🟢 GREEN = Medium Crowd • 🟡 DARK YELLOW = Low Crowd.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-bold border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  🔴 {pulseMetrics.highCrowdDestinations} High
                </Badge>
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-bold border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  🟢 {pulseMetrics.mediumCrowdDestinations} Medium
                </Badge>
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-bold border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  🟡 {pulseMetrics.lowCrowdDestinations} Low
                </Badge>
              </div>
            </div>

            <CrowdIntelligenceMap
              destinations={destinations}
              districts={districts}
              navigate={navigate}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: WOW #2 — UNDERUTILIZED DESTINATION DETECTOR                         */}
        {/* ========================================================================= */}
        {activeTab === 'underutilized' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-200/80 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-600 text-white text-xs font-bold">
                  🔍 Underutilized Destination Intelligence
                </Badge>
                <Badge variant="outline" className="text-[10px] text-stone-500">
                  Demo Insight • Based on available project data
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                High-Potential Ecotourism Zones Requiring Promotional Redistribution
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-3xl">
                The detector automatically identifies destinations with low crowd footprints (🟡 Dark Yellow) that possess exceptional ecological or cultural value, providing tourism authorities with immediate strategies to distribute footfall from congested hubs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {underutilizedOpportunities.map((opp) => (
                <Card
                  key={opp.destination.id}
                  className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4 bg-white dark:bg-stone-900 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border-amber-300">
                          🟡 Opportunity Score: {opp.opportunityScore}/100
                        </Badge>
                        <h4 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 mt-1.5">
                          {opp.destination.name}
                        </h4>
                        <span className="text-xs text-stone-500">
                          📍 {opp.destination.district?.name} District
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                      <span className="font-bold text-amber-900 dark:text-amber-300 block">
                        🌿 Key Eco Advantage:
                      </span>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        {opp.keyEcoAdvantage}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-stone-500 font-semibold block text-[11px]">
                          Available Capacity Headroom:
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {opp.carryingCapacityHeadroom}
                        </span>
                      </div>

                      <div>
                        <span className="text-stone-500 font-semibold block text-[11px]">
                          Load-Balancing Source (Nearby Congested Hub):
                        </span>
                        <span className="font-bold text-red-700 dark:text-red-400">
                          🔴 {opp.nearbyCongestedHub}
                        </span>
                      </div>

                      <div>
                        <span className="text-stone-500 font-semibold block text-[11px]">
                          Diversion Potential:
                        </span>
                        <span className="text-stone-800 dark:text-stone-200 font-medium">
                          {opp.diversionPotential}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                      <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-emerald-600" />
                        Suggested Govt Promotion:
                      </span>
                      <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                        {opp.suggestedAction}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-stone-500">
                      Infra Status: <strong className="text-stone-800 dark:text-stone-200">{opp.infrastructureStatus}</strong>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/destinations/${opp.destination.slug}`)}
                      className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold"
                    >
                      View Site Page
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: WOW #3 — TOURIST SPENDING & LOCAL ECONOMIC IMPACT                  */}
        {/* ========================================================================= */}
        {activeTab === 'spending' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-700 text-white text-xs font-bold">
                  💰 Tourist Spending & Community Retained Value
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700">
                  Estimated Demo Data • Transparently derived from project bookings & vendor catalog
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                Total Estimated Monthly Tourist Spending: ₹{(pulseMetrics.estimatedMonthlySpendInr / 10000000).toFixed(2)} Crores
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-3xl">
                Analysis of economic distribution across local homestays, traditional cuisine vendors, tribal Dokra artisans, certified guides, and regional eco-transits.
              </p>
            </div>

            {/* Spending Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spendingBreakdown.spendingCategories.map((item) => (
                <Card
                  key={item.id}
                  className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {item.category}
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          Avg. ₹{item.avgPerTouristInr} / visitor
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs font-extrabold">
                      {item.percentage}% Share
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${item.percentage * 2.5}%` }}
                    />
                  </div>

                  <div className="text-xs space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Est. Monthly Volume:</span>
                      <strong className="text-stone-900 dark:text-stone-100 font-bold">
                        ₹{(item.estimatedSpendMonthlyInr / 100000).toFixed(1)} Lakhs
                      </strong>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      {item.description}
                    </p>
                    <span className="inline-block text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">
                      👥 Beneficiaries: {item.localBeneficiaries}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Local Economic Impact Scorecard */}
            <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div>
                  <h4 className="font-extrabold text-lg text-emerald-400 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Local Economic Impact & Retention Scorecard</span>
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Measuring direct wealth retention within tribal villages and rural self-help groups.
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  81% Direct Local Retention
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                  <span className="text-xs text-stone-400 font-medium">Local Vendors Benefited</span>
                  <div className="text-2xl font-extrabold text-amber-400">
                    {spendingBreakdown.economicImpact.verifiedVendorsBenefited} Stalls
                  </div>
                  <span className="text-[10px] text-stone-400">Food, snacks & tea</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                  <span className="text-xs text-stone-400 font-medium">Tribal Artisans Supported</span>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {spendingBreakdown.economicImpact.tribalArtisansSupported} Families
                  </div>
                  <span className="text-[10px] text-stone-400">Dokra & Sohrai guilds</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                  <span className="text-xs text-stone-400 font-medium">Village Homestays</span>
                  <div className="text-2xl font-extrabold text-blue-400">
                    {spendingBreakdown.economicImpact.homestaysActive} Cottages
                  </div>
                  <span className="text-[10px] text-stone-400">Community managed</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                  <span className="text-xs text-stone-400 font-medium">Certified Local Guides</span>
                  <div className="text-2xl font-extrabold text-teal-400">
                    {spendingBreakdown.economicImpact.certifiedGuidesEngaged} Guides
                  </div>
                  <span className="text-[10px] text-stone-400">100% digital QR payout</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: WOW #4 — TOURIST COMPLAINT INTELLIGENCE                             */}
        {/* ========================================================================= */}
        {activeTab === 'complaints' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-3xl bg-red-500/10 border border-red-200 dark:border-red-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-700 text-white text-xs font-bold">
                  ⚠️ Tourist Complaint & Problem Heatmap
                </Badge>
                <Badge variant="outline" className="text-[10px] text-stone-500">
                  Demo Incident & Feedback Intelligence
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                Where are Tourists Facing Bottlenecks & Infrastructure Challenges?
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-3xl">
                Incident categorization by safety, sanitation, transport, basic amenities, and queue overcrowding across key pilgrimage and cascade circuits.
              </p>
            </div>

            {/* Complaints Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaintsList.map((c) => (
                <Card
                  key={c.id}
                  className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            c.severity === 'Critical'
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : c.severity === 'Moderate'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {c.severity} Severity
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {c.category}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 mt-1.5">
                        {c.destinationName} ({c.districtName} District)
                      </h4>
                    </div>

                    <Badge
                      className={`text-[10px] ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-700 text-white'
                          : c.status === 'In Progress'
                          ? 'bg-amber-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    "{c.summary}"
                  </p>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                    <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Authority Action & Intervention:
                    </span>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                      {c.resolutionAction}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-stone-400 pt-1">
                    <span>Logged on: {c.reportedDate}</span>
                    <span className="font-medium">Incident Ref #{c.id.toUpperCase()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: WOW #5 — RECOMMENDED GOVERNMENT ACTIONS                            */}
        {/* ========================================================================= */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-700 text-white text-xs font-bold">
                  ⚡ AI & Smart Governance Recommendations
                </Badge>
                <Badge variant="outline" className="text-[10px] text-stone-500">
                  Advisory recommendations derived from platform signals & project dataset
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                Actionable Interventions for Sustainable Footfall & Local Growth
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-3xl">
                The intelligence system synthesizes crowd telemetry, complaints, and vendor distributions into concrete policy and operational actions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {govActions.map((act) => (
                <Card
                  key={act.id}
                  className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] font-bold ${
                            act.urgency === 'Immediate'
                              ? 'bg-red-700 text-white'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {act.urgency} Urgency
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {act.category}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 mt-2">
                        {act.title}
                      </h4>
                      <span className="text-xs text-stone-500">
                        📍 Target: {act.district} • {act.affectedDestinations.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block">
                      Trigger Signal:
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11.5px]">
                      {act.triggerSignal}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1.5">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-emerald-600" />
                      Recommended Authority Intervention:
                    </span>
                    <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                      {act.recommendedIntervention}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200 block">
                      🎯 Expected Strategic Outcome:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                      {act.expectedOutcome}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: DISTRICT INTELLIGENCE                                              */}
        {/* ========================================================================= */}
        {activeTab === 'districts' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-3xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>📊</span>
                <span>District-by-District Tourism Footprint</span>
              </h3>
              <p className="text-xs text-stone-500">
                Comparative analysis of crowd pressure, active local vendor density, and priority interventions across all 8 major tourism districts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {districtIntelligence.map((item) => (
                <Card
                  key={item.district.id}
                  className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3.5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                          {item.district.name}
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          {item.district.division} Division
                        </span>
                      </div>
                      <Badge className={`text-[9.5px] font-bold ${item.statusBadge.color}`}>
                        {item.statusBadge.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 text-center text-xs">
                      <div>
                        <span className="text-[9.5px] text-stone-400 block">🔴 High</span>
                        <strong className="text-red-700 dark:text-red-400 font-extrabold">
                          {item.crowdBreakdown.high}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-stone-400 block">🟢 Med</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                          {item.crowdBreakdown.medium}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-stone-400 block">🟡 Low</span>
                        <strong className="text-amber-700 dark:text-amber-400 font-extrabold">
                          {item.crowdBreakdown.low}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Est. Monthly Visitors:</span>
                        <strong className="text-stone-900 dark:text-stone-100 font-bold">
                          ~{(item.estimatedMonthlyFootfall / 1000).toFixed(1)}k
                        </strong>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Active Local Stalls:</span>
                        <strong className="text-amber-700 dark:text-amber-400 font-bold">
                          {item.activeVendorsCount} Vendors
                        </strong>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Logged Issues:</span>
                        <strong className="text-stone-800 dark:text-stone-200 font-medium">
                          {item.complaintCount} cases
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-850 p-2 rounded-xl">
                      "{item.primaryStrategicFocus}"
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTableDistrictFilter(item.district.id);
                      setActiveTab('table');
                    }}
                    className="w-full text-xs h-8 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-semibold"
                  >
                    Filter Sites in Table →
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: MASTER DESTINATION INTELLIGENCE TABLE                              */}
        {/* ========================================================================= */}
        {activeTab === 'table' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>📋</span>
                    <span>Statewide Destination Intelligence Master Table</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Comprehensive view of crowd classifications, visitor loads, vendor presence, and authority recommendations.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-bold self-start sm:self-auto bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-stone-300 dark:border-stone-700">
                  Showing {filteredMasterRecords.length} of {masterRecords.length} Sites
                </Badge>
              </div>

              {/* Table Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search destination, district..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-stone-50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border-stone-200 dark:border-stone-700"
                  />
                </div>

                <select
                  value={tableCrowdFilter}
                  onChange={(e) => setTableCrowdFilter(e.target.value)}
                  className="h-9 text-xs bg-stone-50 dark:bg-stone-850 text-stone-800 dark:text-stone-100 font-semibold px-3 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none"
                >
                  <option value="all">All Crowd Levels</option>
                  <option value="HIGH">🔴 High Crowd Only</option>
                  <option value="MEDIUM">🟢 Medium Crowd Only</option>
                  <option value="LOW">🟡 Low Crowd / Opportunities</option>
                </select>

                <select
                  value={tableDistrictFilter}
                  onChange={(e) => setTableDistrictFilter(e.target.value)}
                  className="h-9 text-xs bg-stone-50 dark:bg-stone-850 text-stone-800 dark:text-stone-100 font-semibold px-3 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} District
                    </option>
                  ))}
                </select>

                <select
                  value={tableCategoryFilter}
                  onChange={(e) => setTableCategoryFilter(e.target.value)}
                  className="h-9 text-xs bg-stone-50 dark:bg-stone-850 text-stone-800 dark:text-stone-100 font-semibold px-3 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Destination</th>
                      <th className="pb-3">District</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Crowd Status</th>
                      <th className="pb-3">Est. Footfall</th>
                      <th className="pb-3">Vendors</th>
                      <th className="pb-3">Issues</th>
                      <th className="pb-3">Recommended Govt Action</th>
                      <th className="pb-3 text-right pr-2">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredMasterRecords.map((r) => (
                      <tr key={r.destination.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-stone-900 dark:text-stone-100">
                          {r.destination.name}
                        </td>
                        <td className="py-3.5 text-stone-600 dark:text-stone-300">
                          {r.destination.district?.name}
                        </td>
                        <td className="py-3.5 text-stone-500">
                          {r.destination.category?.name}
                        </td>
                        <td className="py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-extrabold ${r.crowdConfig.badgeBg} ${r.crowdConfig.badgeText} ${r.crowdConfig.badgeBorder}`}
                          >
                            {r.crowdStatus === 'HIGH' ? '🔴' : r.crowdStatus === 'MEDIUM' ? '🟢' : '🟡'} {r.crowdConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 font-semibold text-stone-800 dark:text-stone-200">
                          ~{r.estimatedMonthlyFootfall.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-amber-700 dark:text-amber-400 font-bold">
                          {r.activeVendorsNearCount} Stalls
                        </td>
                        <td className="py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[9.5px] ${
                              r.complaintSeverity === 'High'
                                ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                                : r.complaintSeverity === 'Moderate'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {r.complaintCount} cases ({r.complaintSeverity})
                          </Badge>
                        </td>
                        <td className="py-3.5 text-stone-600 dark:text-stone-300 max-w-xs text-[11px] leading-relaxed">
                          {r.recommendedGovAction}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/destinations/${r.destination.slug}`)}
                            className="h-7 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold"
                          >
                            View →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: PROVIDER VERIFICATION QUEUE (ORIGINAL WORKFLOW PRESERVED)          */}
        {/* ========================================================================= */}
        {activeTab === 'verification' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4 bg-white dark:bg-stone-900 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Local Provider & Artisan Verification Queue</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Review and verify indigenous artisans, homestay hosts, and local culinary stalls applying for state ecotourism accreditation.
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">
                  {queue.filter((q) => q.status !== 'Verified').length} Pending Review
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase tracking-wider">
                      <th className="pb-3">Provider / Business Name</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">District</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {queue.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                        <td className="py-3.5 font-bold text-stone-900 dark:text-stone-100">
                          {item.name}
                        </td>
                        <td className="py-3.5 text-stone-600 dark:text-stone-300">{item.type}</td>
                        <td className="py-3.5 text-stone-600 dark:text-stone-300">{item.district}</td>
                        <td className="py-3.5 text-stone-600 dark:text-stone-300">{item.contact}</td>
                        <td className="py-3.5">
                          <Badge
                            variant={item.status === 'Verified' ? 'emerald' : 'amber'}
                            className="text-[10px] font-bold"
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          {item.status !== 'Verified' ? (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(item.id)}
                              className="text-[11px] h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                            >
                              Approve & Publish
                            </Button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                              ✓ Active on Map
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
