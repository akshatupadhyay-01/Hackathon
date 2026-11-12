import React from 'react';
import { MapPin, Star, Navigation, Compass, Layers, ShieldCheck } from 'lucide-react';
import { Destination, District } from '../../../types/database';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

interface MockMapProps {
  destinations: Destination[];
  districts: District[];
  selectedDistrict: string;
  onSelectDistrict: (id: string) => void;
  onSelectDestination: (slug: string) => void;
}

export function MockMap({
  destinations,
  districts,
  selectedDistrict,
  onSelectDistrict,
  onSelectDestination,
}: MockMapProps) {
  const [activePin, setActivePin] = React.useState<Destination | null>(
    destinations[0] || null
  );

  // Map coordinates normalized relative to Jharkhand bounding box
  // Lat: 22.0 to 25.0, Lon: 83.5 to 88.0
  const minLat = 22.0;
  const maxLat = 25.0;
  const minLon = 83.5;
  const maxLon = 88.0;

  const getPosition = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 80 + 10;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 80 + 10;
    return { left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` };
  };

  const filteredDestinations =
    selectedDistrict === 'all'
      ? destinations
      : destinations.filter((d) => d.district_id === selectedDistrict);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 text-white shadow-2xl overflow-hidden">
      {/* Map Canvas */}
      <div className="lg:col-span-2 relative h-[420px] sm:h-[500px] rounded-2xl bg-gradient-to-b from-stone-950 via-stone-900 to-emerald-950/40 border border-stone-800 p-4 flex flex-col justify-between overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#26262610_1px,transparent_1px),linear-gradient(to_bottom,#26262610_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* Map Top Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 backdrop-blur-md p-3 rounded-xl border border-stone-800">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-emerald-400 animate-spin" style={{ animationDuration: '12s' }} />
            <span className="font-bold text-sm text-stone-100">
              Jharkhand Eco-Interactive Map
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="emerald" className="bg-emerald-900/60 text-emerald-300 border-emerald-700">
              8 District Hubs Active
            </Badge>
          </div>
        </div>

        {/* Pins on Map */}
        <div className="relative flex-1 my-2">
          {filteredDestinations.map((dest) => {
            const pos = getPosition(dest.latitude, dest.longitude);
            const isSelected = activePin?.id === dest.id;

            return (
              <div
                key={dest.id}
                style={pos}
                onClick={() => setActivePin(dest)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
              >
                {/* Ping animation if selected */}
                {isSelected && (
                  <span className="absolute -inset-2 rounded-full bg-emerald-400/40 animate-ping" />
                )}

                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg transition-all transform ${
                    isSelected
                      ? 'bg-emerald-500 text-stone-950 scale-110 ring-2 ring-white ring-offset-2 ring-offset-stone-950'
                      : 'bg-stone-800 text-stone-200 hover:bg-stone-700 hover:scale-105 border border-stone-700'
                  }`}
                >
                  <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'fill-stone-950' : 'text-emerald-400'}`} />
                  <span className="max-w-[110px] truncate">{dest.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map District Legend & Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 bg-stone-900/90 backdrop-blur-md p-2.5 rounded-xl border border-stone-800 overflow-x-auto text-xs">
          <span className="text-stone-400 font-medium px-2">District:</span>
          <button
            onClick={() => onSelectDistrict('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedDistrict === 'all'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            All Jharkhand
          </button>
          {districts.map((dist) => (
            <button
              key={dist.id}
              onClick={() => onSelectDistrict(dist.id)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedDistrict === dist.id
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {dist.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Location Card Panel */}
      <div className="flex flex-col justify-between h-[420px] sm:h-[500px] bg-stone-950/80 rounded-2xl border border-stone-800 p-5">
        {activePin ? (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="relative h-44 rounded-xl overflow-hidden bg-stone-900 border border-stone-800">
                <img
                  src={activePin.featured_image}
                  alt={activePin.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1 text-emerald-300">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{activePin.rating.toFixed(1)}</span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-stone-200">
                  {activePin.district?.name} District
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white line-clamp-1">
                  {activePin.name}
                </h3>
                <p className="text-xs text-emerald-400 font-medium line-clamp-1 mt-0.5">
                  {activePin.tagline || activePin.best_time_to_visit}
                </p>
                <p className="text-xs text-stone-400 line-clamp-3 mt-2 leading-relaxed">
                  {activePin.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-stone-800/80">
                <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block">Timings</span>
                  <span className="text-stone-200 font-medium">{activePin.timings}</span>
                </div>
                <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block">Entry Eco Fee</span>
                  <span className="text-emerald-400 font-medium">
                    {activePin.entry_fee_inr === 0 ? 'Free Entry' : `₹${activePin.entry_fee_inr}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800">
              <Button
                onClick={() => onSelectDestination(activePin.slug)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm"
              >
                View Full Itinerary & Bookings
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 space-y-2">
            <MapPin className="h-10 w-10 text-stone-700" />
            <p className="text-sm">Click on any marker pin to explore destination details</p>
          </div>
        )}
      </div>
    </div>
  );
}
