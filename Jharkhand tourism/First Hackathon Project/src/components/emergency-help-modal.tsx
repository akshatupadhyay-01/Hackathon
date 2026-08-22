import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Phone,
  PhoneCall,
  MapPin,
  LocateFixed,
  AlertTriangle,
  Shield,
  HeartPulse,
  Flame,
  LifeBuoy,
  X,
  Copy,
  Check,
  ExternalLink,
  Navigation,
  Building2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  EMERGENCY_SERVICES,
  JHARKHAND_DISTRICT_EMERGENCY,
  ADMIN_CONTACT_CONFIG,
  getNearbyEmergencyFacilitySearchUrl,
} from '../data/emergency-contacts';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface EmergencyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate?: (path: string) => void;
}

export type GeolocationStatus =
  | 'idle'
  | 'locating'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unsupported';

export function EmergencyHelpModal({ isOpen, onClose, navigate }: EmergencyHelpModalProps) {
  const [geoStatus, setGeoStatus] = useState<GeolocationStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('ranchi');
  const [showDistrictList, setShowDistrictList] = useState<boolean>(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open and restore on close
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num.replace(/[^0-9+]/g, ''));
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const handleCopyCoordinates = () => {
    if (!coords) return;
    const text = `My Emergency GPS Location: Lat ${coords.lat.toFixed(6)}, Lng ${coords.lng.toFixed(6)} (Accuracy: ~${Math.round(coords.accuracy)}m)`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 3000);
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      return;
    }

    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGeoStatus('granted');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied');
        } else {
          setGeoStatus('unavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  const handleOpenOnMap = () => {
    if (coords && navigate) {
      onClose();
      navigate(
        `/map?directions=true&originLat=${coords.lat}&originLng=${coords.lng}&originName=My+Current+Location&isGps=true`
      );
    }
  };

  const selectedDistrictData = JHARKHAND_DISTRICT_EMERGENCY.find(
    (d) => d.districtId === selectedDistrictId
  ) || JHARKHAND_DISTRICT_EMERGENCY[0];

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-hidden pt-[max(0.6rem,env(safe-area-inset-top,0px))] pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] pl-[max(0.6rem,env(safe-area-inset-left,0px))] pr-[max(0.6rem,env(safe-area-inset-right,0px))] animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container — Strict viewport boundary + internal flexbox scrolling */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-dialog-title"
        className="relative w-full max-w-2xl max-h-[calc(100dvh-1.25rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] sm:max-h-[88dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all my-auto"
      >
        {/* Header with High-Visibility Emergency Header */}
        <div className="relative bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 shadow-md gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0">
              🆘
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 id="emergency-dialog-title" className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  Emergency Help & SOS
                </h2>
                <Badge variant="outline" className="bg-rose-900/50 text-rose-100 border-rose-300/40 text-[9px] sm:text-[10px] uppercase font-bold py-0.5 px-1.5">
                  24x7 Verified
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-100/90 font-medium line-clamp-1 sm:line-clamp-none">
                Immediate assistance, official helplines, and GPS location sharing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close emergency panel"
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Scrollable Content Body with min-h-0 to guarantee container constraints */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4 sm:space-y-6 pb-6">
          {/* Quick Notice Banner */}
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 dark:text-rose-200">
              <span className="font-bold">Life-threatening emergency?</span> Dial{' '}
              <a href="tel:112" className="underline font-bold hover:text-rose-700 dark:hover:text-rose-100">
                112 (National ERSS)
              </a>{' '}
              or{' '}
              <a href="tel:108" className="underline font-bold hover:text-rose-700 dark:hover:text-rose-100">
                108 (Ambulance)
              </a>{' '}
              immediately. These services operate toll-free 24 hours a day across Jharkhand.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: PRIMARY ONE-TOUCH EMERGENCY CALL CARDS                       */}
          {/* ========================================================================= */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
              <span>National & State Emergency Helplines</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Centralized Admin Emergency Hotline */}
              <div className="relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between bg-stone-50 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700/80 hover:border-emerald-500/50 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none" role="img" aria-label="Admin">
                        🛡️
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                          {ADMIN_CONTACT_CONFIG.name}
                        </h4>
                        <span className="inline-block text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wide">
                          Tourism Safety & Control
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    Direct 24x7 emergency response and assistance from the tourism admin desk.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-700/70 flex items-center">
                  <a
                    href={`tel:${ADMIN_CONTACT_CONFIG.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Admin</span>
                  </a>
                </div>
              </div>

              {EMERGENCY_SERVICES.map((service) => {
                const isCopied = copiedNumber === service.number;
                return (
                  <div
                    key={service.id}
                    className="relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between bg-stone-50 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700/80 hover:border-emerald-500/50 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none" role="img" aria-label={service.name}>
                            {service.icon}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                              {service.name}
                            </h4>
                            <span className="inline-block text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wide">
                              Dial {service.number}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Action Buttons: Direct Mobile Call + Copy on Desktop */}
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-700/70 flex items-center gap-2">
                      <a
                        href={`tel:${service.number}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call {service.number}</span>
                      </a>

                      <button
                        onClick={() => handleCopyNumber(service.number)}
                        title={`Copy ${service.number}`}
                        aria-label={`Copy ${service.number}`}
                        className="h-8 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1 text-[11px] hidden sm:inline">
                          {isCopied ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: MY LOCATION & FIND NEARBY HELP                               */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <LocateFixed className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    My Location & Nearby Help
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Detect your exact coordinates to guide first responders or find nearby facilities
                  </p>
                </div>
              </div>

              {geoStatus === 'granted' && coords && (
                <Badge variant="emerald" className="text-[10px] py-0.5">
                  GPS Active
                </Badge>
              )}
            </div>

            {/* State: Idle */}
            {geoStatus === 'idle' && (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={requestUserLocation}
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs h-9 px-4 rounded-xl gap-2 font-bold shadow-sm cursor-pointer"
                >
                  <LocateFixed className="h-4 w-4" />
                  <span>Use My Location</span>
                </Button>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center sm:text-left">
                  Your coordinates stay private on your device.
                </p>
              </div>
            )}

            {/* State: Locating */}
            {geoStatus === 'locating' && (
              <div className="py-3 flex items-center justify-center gap-2.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
                <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin" />
                <span>Acquiring precise GPS coordinates from your device...</span>
              </div>
            )}

            {/* State: Granted / Location Available */}
            {geoStatus === 'granted' && coords && (
              <div className="space-y-3 pt-1 animate-in fade-in-50">
                <div className="p-3 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">
                      Current GPS Coordinates
                    </span>
                    <div className="font-mono text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mt-0.5">
                      <span>Lat {coords.lat.toFixed(5)}°</span>
                      <span className="text-stone-400">,</span>
                      <span>Lng {coords.lng.toFixed(5)}°</span>
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      Accuracy: within ~{Math.round(coords.accuracy)} meters
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCoordinates}
                      className="flex-1 sm:flex-none text-xs h-8 rounded-lg gap-1 font-semibold border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 cursor-pointer"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Coordinates Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Coordinates</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleOpenOnMap}
                      className="flex-1 sm:flex-none text-xs h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white gap-1 font-semibold shadow-sm cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>View on Eco Map</span>
                    </Button>
                  </div>
                </div>

                {/* External Navigation / Nearby Search Links */}
                <div>
                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Find Nearby Facilities:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={getNearbyEmergencyFacilitySearchUrl(coords.lat, coords.lng, 'hospital')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 hover:border-emerald-500/50 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-rose-600" />
                        <span>Nearby Hospitals in Google Maps</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    </a>

                    <a
                      href={getNearbyEmergencyFacilitySearchUrl(coords.lat, coords.lng, 'police')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 hover:border-emerald-500/50 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Nearby Police in Google Maps</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* State: Permission Denied */}
            {geoStatus === 'denied' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p>
                  <strong>Location access was denied.</strong> You can still call emergency services directly or open your preferred navigation app.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestUserLocation}
                    className="text-xs h-7 rounded-lg border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Again
                  </Button>
                  <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-amber-900 dark:text-amber-100 underline inline-flex items-center gap-1"
                  >
                    <span>Open Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* State: Location Unavailable / Timeout */}
            {geoStatus === 'unavailable' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-2">
                <p>
                  <strong>Location unavailable.</strong> Unable to detect your GPS signal. Please verify that location services are turned on.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestUserLocation}
                  className="text-xs h-7 rounded-lg border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            )}

            {/* State: Geolocation Unsupported */}
            {geoStatus === 'unsupported' && (
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 text-xs text-stone-700 dark:text-stone-300">
                Geolocation is not supported by your current browser. You can dial emergency helplines directly above.
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: JHARKHAND DISTRICT CONTROL ROOMS & HOSPITALS                  */}
          {/* ========================================================================= */}
          <div className="border border-stone-200 dark:border-stone-700/80 rounded-2xl overflow-hidden bg-stone-50 dark:bg-stone-800/90">
            <button
              onClick={() => setShowDistrictList(!showDistrictList)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-100/60 dark:hover:bg-stone-750 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    District Hospital & Police Directory
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Official district headquarters, Sadar hospitals, and forest ranges in Jharkhand
                  </p>
                </div>
              </div>
              <div className="text-stone-400">
                {showDistrictList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {showDistrictList && (
              <div className="p-4 border-t border-stone-200 dark:border-stone-700/80 space-y-3 bg-stone-50/50 dark:bg-stone-850/60 animate-in fade-in-50">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Select Tourist Region / District:
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {JHARKHAND_DISTRICT_EMERGENCY.map((dist) => (
                      <option key={dist.districtId} value={dist.districtId}>
                        {dist.districtName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">
                      Police Control Room
                    </span>
                    <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                      <span className="text-xs">{selectedDistrictData.policeControlRoom}</span>
                      <a
                        href={`tel:${selectedDistrictData.policeControlRoom}`}
                        className="inline-flex items-center justify-center h-7 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Call
                      </a>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">
                      Sadar Hospital / Medical Center
                    </span>
                    <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                      <span className="text-xs">{selectedDistrictData.sadarHospital}</span>
                      <a
                        href={`tel:${selectedDistrictData.sadarHospital}`}
                        className="inline-flex items-center justify-center h-7 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                </div>

                {selectedDistrictData.notes && (
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 italic bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/80">
                    ℹ️ {selectedDistrictData.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer — Always pinned and accessible */}
        <div className="p-3 sm:p-4 bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 text-xs shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 sm:line-clamp-none">
            Helplines operate 24/7 toll-free without login.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold h-9 px-4 rounded-xl shrink-0 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 shadow-sm cursor-pointer transition-colors"
          >
            Close Panel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
