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

  const crowdLabels = {
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
      className={`group overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-1 ${
        className || ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={destination.featured_image}
          alt={destination.name}
          onError={handleImageError}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {destination.is_eco_certified && (
            <Badge variant="emerald" className="bg-emerald-950/90 text-emerald-200 border-emerald-700/80 backdrop-blur-md gap-1">
              <Leaf className="h-3 w-3" />
              Eco Certified
            </Badge>
          )}
          <Badge variant={crowdBadgeVariant} className="backdrop-blur-md capitalize ml-auto">
            <Users className="h-3 w-3 mr-1" />
            {crowdLabels[destination.crowd_status]}
          </Badge>
        </div>

        {/* Bottom District & Category on Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-xs font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>{destination.district?.name || 'Jharkhand'} District</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold bg-emerald-900/80 backdrop-blur-md px-2 py-0.5 rounded text-emerald-200">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{destination.rating.toFixed(1)}</span>
            <span className="text-[10px] opacity-80">({destination.review_count})</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {destination.name}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium line-clamp-1 italic">
            {destination.tagline || destination.best_time_to_visit}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
            {destination.description}
          </p>
        </div>

        {/* Tags & Explore Link */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {destination.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Explore</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Card>
  );
}
