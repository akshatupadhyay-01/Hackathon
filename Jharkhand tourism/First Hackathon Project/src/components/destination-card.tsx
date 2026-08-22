import React from 'react';
import { MapPin, Star, Users, Leaf, ArrowRight } from 'lucide-react';
import { Destination } from '../types/database';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

export interface DestinationCardProps {
  key?: React.Key;
  destination: Destination;
  onClick: (slug: string) => void;
  className?: string;
}

export function DestinationCard({ destination, onClick, className }: DestinationCardProps) {
  const crowdBadgeVariant = {
    low: 'amber' as const,
    moderate: 'emerald' as const,
    high: 'destructive' as const,
    peak: 'destructive' as const,
  }[destination.crowd_status] || 'secondary';

  const crowdLabels: Record<string, string> = {
    low: '🟡 Low Crowd',
    moderate: '🟢 Medium Crowd',
    high: '🔴 High Crowd',
    peak: '🔴 High Crowd',
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80';
  };

  return (
    <Card
      onClick={() => onClick(destination.slug)}
      className={`group overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-1.5 bg-gradient-to-b from-emerald-800 via-emerald-900 to-teal-900 border border-emerald-600/60 shadow-lg hover:shadow-2xl hover:border-emerald-400/80 text-white ${
        className || ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-900 shrink-0">
        <img
          src={destination.featured_image}
          alt={destination.name}
          onError={handleImageError}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {destination.is_eco_certified && (
            <Badge
              variant="emerald"
              className="bg-emerald-950/90 text-emerald-200 border-emerald-500/80 backdrop-blur-md gap-1 font-semibold text-[11px] shadow-sm"
            >
              <Leaf className="h-3 w-3 text-emerald-400" />
              Eco Certified
            </Badge>
          )}
          <Badge
            variant={crowdBadgeVariant}
            className="backdrop-blur-md capitalize ml-auto font-bold text-[11px] shadow-sm"
          >
            <Users className="h-3 w-3 mr-1" />
            {crowdLabels[destination.crowd_status] || destination.crowd_status}
          </Badge>
        </div>

        {/* Bottom District & Rating Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
          <div className="flex items-center gap-1.5 text-xs font-medium bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[140px]">{destination.district?.name || 'Jharkhand'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span>{destination.rating.toFixed(1)}</span>
            <span className="text-[10px] text-stone-300 font-normal">({destination.review_count})</span>
          </div>
        </div>
      </div>

      {/* Card Content Body — Premium Forest Emerald Green */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4 text-white">
        <div className="space-y-2">
          <h3 className="font-black tracking-tight text-lg sm:text-xl text-white group-hover:text-emerald-200 transition-colors line-clamp-1">
            {destination.name}
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-emerald-300 line-clamp-1">
            {destination.tagline || destination.best_time_to_visit}
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-emerald-50/90 line-clamp-2 font-normal">
            {destination.description}
          </p>
        </div>

        {/* Tags & Explore Link */}
        <div className="pt-3.5 border-t border-emerald-700/50 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {destination.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white group-hover:text-emerald-200 transition-transform group-hover:translate-x-1 shrink-0">
            <span>Explore</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Card>
  );
}


