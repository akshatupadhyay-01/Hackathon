import React, { useState } from 'react';
import {
  PhoneCall,
  Sparkles,
  MapPin,
  QrCode,
  Compass,
  X,
  ChevronUp,
  ShieldAlert,
  Download,
  Leaf,
  Layers,
} from 'lucide-react';
import { usePWA } from '../../contexts/pwa-context';
import { useI18n } from '../../contexts/i18n-context';
import { EmergencyHelpModal } from '../common/emergency-help-modal';
import { OfflineMapModal } from '../../features/map/components/offline-map-modal';

interface MobileQuickActionsProps {
  navigate: (path: string) => void;
  currentPath: string;
}

export function MobileQuickActions({ navigate, currentPath }: MobileQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isOfflineMapOpen, setIsOfflineMapOpen] = useState(false);
  const { triggerHaptic } = usePWA();
  const { t } = useI18n();

  // Only render on homepage; on other pages top bar SOS and bottom nav handle navigation without obscuring UI
  if (currentPath !== '/') {
    return (
      <>
        <EmergencyHelpModal
          isOpen={isSosOpen}
          onClose={() => setIsSosOpen(false)}
          navigate={navigate}
        />
        <OfflineMapModal
          isOpen={isOfflineMapOpen}
          onClose={() => setIsOfflineMapOpen(false)}
          onNavigateToRegion={() => {
            setIsOfflineMapOpen(false);
            navigate('/map');
          }}
        />
      </>
    );
  }

  const handleToggle = () => {
    triggerHaptic(10);
    setIsExpanded(!isExpanded);
  };

  const handleAction = (callback: () => void) => {
    triggerHaptic(15);
    callback();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Floating Action Speed Dial for Mobile (Bottom Right above nav) */}
      <div className="md:hidden fixed bottom-[4.25rem] right-3.5 z-40 flex flex-col items-end pointer-events-auto select-none">
        {/* Expanded Speed Dial Menu Items */}
        {isExpanded && (
          <div className="flex flex-col items-end gap-2.5 mb-3 animate-in slide-in-from-bottom-3 fade-in duration-200">
            {/* 1. Emergency Forest SOS Action */}
            <button
              onClick={() => handleAction(() => setIsSosOpen(true))}
              className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-rose-600 active:bg-rose-700 text-white font-extrabold text-xs shadow-xl border border-rose-400/50 cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-sm">🆘</span>
              <span>{t('quickActions.forestSos', '24x7 Forest SOS (112)')}</span>
            </button>

            {/* 2. Offline Eco Map & Tiles */}
            <button
              onClick={() => handleAction(() => setIsOfflineMapOpen(true))}
              className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-stone-900 dark:bg-stone-800 active:bg-stone-950 text-emerald-300 font-bold text-xs shadow-xl border border-emerald-500/40 cursor-pointer active:scale-95 transition-transform"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t('quickActions.offlineMap', 'Offline GPS Map')}</span>
            </button>

            {/* 3. AI Smart Itinerary Planner */}
            <button
              onClick={() => handleAction(() => navigate('/trip-planner'))}
              className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xl border border-emerald-400/50 cursor-pointer active:scale-95 transition-transform"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{t('quickActions.aiTrip', 'AI Trip in 10s')}</span>
            </button>

            {/* 4. Eco Passes / QR Tickets */}
            <button
              onClick={() => handleAction(() => navigate('/profile?tab=passes'))}
              className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-stone-900 dark:bg-stone-800 active:bg-stone-950 text-stone-100 font-bold text-xs shadow-xl border border-stone-700 cursor-pointer active:scale-95 transition-transform"
            >
              <QrCode className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('quickActions.myPasses', 'My Eco Passes')}</span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <div className="flex items-center gap-2">
          {/* Quick 1-Tap SOS Pill when menu is closed */}
          {!isExpanded && (
            <button
              onClick={() => {
                triggerHaptic(20);
                setIsSosOpen(true);
              }}
              title="Emergency SOS"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-600/95 active:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-900/30 border border-rose-400/60 backdrop-blur-md cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-xs">🆘</span>
              <span>SOS</span>
            </button>
          )}

          {/* Speed Dial Menu Toggle Button */}
          <button
            onClick={handleToggle}
            aria-label={isExpanded ? 'Close mobile quick menu' : 'Open mobile quick menu'}
            className={`h-11 w-11 rounded-full flex items-center justify-center shadow-xl border backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
              isExpanded
                ? 'bg-stone-900 text-stone-200 border-stone-700 rotate-90'
                : 'bg-emerald-600 active:bg-emerald-700 text-white border-emerald-400/60 shadow-emerald-900/30'
            }`}
          >
            {isExpanded ? (
              <X className="h-5 w-5" />
            ) : (
              <Layers className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      <EmergencyHelpModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        navigate={navigate}
      />

      {/* Offline Map Modal */}
      <OfflineMapModal
        isOpen={isOfflineMapOpen}
        onClose={() => setIsOfflineMapOpen(false)}
        onNavigateToRegion={() => {
          setIsOfflineMapOpen(false);
          navigate('/map');
        }}
      />
    </>
  );
}
