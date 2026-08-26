import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  Sparkles,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  MapPin,
  QrCode,
} from 'lucide-react';
import { usePWA } from '../../contexts/pwa-context';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function PWAInstallBanner() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isOnline,
    isUpdateAvailable,
    showInstallModal,
    setShowInstallModal,
    promptInstall,
    updateServiceWorker,
    triggerHaptic,
  } = usePWA();

  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('jharkhand_pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('jharkhand_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    triggerHaptic([15, 10, 20]);
    if (isIOS) {
      setShowInstallModal(true);
      return;
    }
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {/* 1. Offline Mode Alert Banner */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 shadow-md relative z-50 animate-in slide-in-from-top"
        >
          <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
          <span>
            <strong>Offline Mode Active:</strong> Sanctuary GIS checkpoints, emergency helpline & saved Eco-Passes remain accessible.
          </span>
        </aside>
      )}

      {/* 2. Service Worker Update Notification Banner */}
      {isUpdateAvailable && (
        <aside
          role="status"
          aria-live="polite"
          className="bg-emerald-700 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between shadow-lg relative z-50"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
            <span>A new version of Jharkhand Eco-Tourism is ready.</span>
          </div>
          <Button
            size="sm"
            onClick={updateServiceWorker}
            className="h-7 text-xs bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-3 rounded-lg cursor-pointer"
          >
            Update Now
          </Button>
        </aside>
      )}

      {/* 3. Floating App Install Bar on Mobile & Web (if not already standalone & not dismissed) */}
      {!isInstalled && isInstallable && !dismissed && (
        <aside
          role="banner"
          aria-label="Install App"
          className="fixed bottom-16 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-40 bg-stone-900/95 dark:bg-stone-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 p-0.5 shrink-0 shadow-md flex items-center justify-center border border-emerald-400/30">
              <img
                src="/icon-192.svg"
                alt="Jharkhand Eco App"
                className="w-full h-full rounded-[10px] object-cover"
              />
            </div>

            {/* App Pitch Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-white truncate">Jharkhand Eco App</h4>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] px-1 py-0">
                    Fast PWA
                  </Badge>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">
                Install for offline GIS trails, instant permits & 1-tap forest SOS.
              </p>

              {/* Install CTA Button */}
              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold px-3 rounded-lg shadow-sm gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
                </Button>
                <button
                  onClick={() => setShowInstallModal(true)}
                  className="text-[11px] text-emerald-400 hover:underline px-1 py-1 font-medium"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 4. Full Feature Install Modal / iOS Guided Instructions */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-1 shrink-0 flex items-center justify-center shadow-lg">
                  <img src="/icon-192.svg" alt="App Icon" className="w-full h-full rounded-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-900 dark:text-white leading-tight">
                    Jharkhand Eco-Tourism
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Official Web & Mobile Application</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* App Capabilities List */}
            <div className="space-y-2.5 bg-stone-50 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 text-xs">
              <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Offline Sanctuary GIS:</strong> Navigate waterfalls, national parks & hills even without mobile signal.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>1-Tap Forest SOS:</strong> Direct offline dialer for Jharkhand Forest Patrol, Police & Snake Rescue.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
                <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Digital Eco-Passes:</strong> Instant QR passes and booking confirmations stored on your device.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Store Downloads:</strong> Instant install under 2 MB, auto-updates seamlessly.
                </span>
              </div>
            </div>

            {/* Installation Guidance based on OS */}
            {isIOS ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" /> Install on Apple iOS (Safari):
                </p>
                <ol className="text-xs text-stone-700 dark:text-stone-300 space-y-2 list-decimal list-inside font-medium">
                  <li className="flex items-center gap-2">
                    <span>1. Tap the</span>
                    <span className="inline-flex items-center gap-1 bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-bold">
                      <Share className="h-3.5 w-3.5 text-blue-500" /> Share
                    </span>
                    <span>button in Safari toolbar.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>2. Scroll down and tap</span>
                    <span className="inline-flex items-center gap-1 bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-bold">
                      <PlusSquare className="h-3.5 w-3.5 text-emerald-600" /> Add to Home Screen
                    </span>
                  </li>
                  <li>3. Tap <strong>Add</strong> at top right to launch as a native standalone app.</li>
                </ol>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={handleInstallClick}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-lg cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isInstalled ? 'App Already Installed' : 'Install App Now'}</span>
              </Button>
            )}

            <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
              Developed for Jharkhand State Eco & Cultural Tourism GIS (SIH 2025)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
