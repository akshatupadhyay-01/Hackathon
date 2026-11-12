import React from 'react';
import { Star, MapPin, Phone, ShieldCheck, Tag, Heart } from 'lucide-react';
import { Vendor, LocalGuide } from '../types/database';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface VendorCardProps {
  vendor: Vendor;
  onBook?: (vendor: Vendor) => void;
}

export function VendorCard({ vendor, onBook }: VendorCardProps) {
  const isArtisan = vendor.vendor_type === 'artisan_craft';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80';
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col h-full hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[16/11] overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={vendor.featured_image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800'}
          alt={vendor.business_name}
          onError={handleImageError}
          className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="emerald" className="backdrop-blur-md">
            {isArtisan ? 'Tribal Artisan' : 'Eco Homestay'}
          </Badge>
          {vendor.tribal_art_form && (
            <Badge variant="amber" className="backdrop-blur-md text-[11px]">
              {vendor.tribal_art_form}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span>{vendor.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span>{vendor.village_or_area}</span>
          </div>
          <h4 className="font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
            {vendor.business_name}
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
            {vendor.description}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 block">Pricing / Range</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {vendor.price_range || 'Contact Host'}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => onBook?.(vendor)}
            className="text-xs bg-emerald-700 hover:bg-emerald-800"
          >
            {isArtisan ? 'Inquire / Order' : 'Book Stay'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function GuideCard({ guide, onHire }: { guide: LocalGuide; onHire?: (guide: LocalGuide) => void }) {
  return (
    <Card className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3.5">
        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-lg shrink-0 border-2 border-emerald-500/30">
          {guide.name.charAt(0)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
              {guide.name}
            </h4>
            <span title="Verified Tourism Guide">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </span>
          </div>
          <Badge variant="emerald" className="text-[10px] py-0">
            {guide.badge}
          </Badge>
          <p className="text-xs text-stone-500">
            {guide.experience_years}+ years experience • {guide.languages_spoken.join(', ')}
          </p>
        </div>
      </div>

      <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
        {guide.bio}
      </p>

      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-stone-400 block">Daily Eco Fee</span>
          <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
            ₹{guide.daily_rate_inr} <span className="text-xs font-normal text-stone-400">/ day</span>
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => onHire?.(guide)}
          className="text-xs bg-emerald-700 hover:bg-emerald-800"
        >
          Book Certified Guide
        </Button>
      </div>
    </Card>
  );
}
