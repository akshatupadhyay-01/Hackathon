import React from 'react';
import { Compass, MapPin, Sparkles, ShoppingBag, QrCode, User, AlertCircle } from 'lucide-react';
import { usePWA } from '../lib/pwa-context';
import { useAuth } from '../lib/auth-context';

interface MobileBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
  onOpenSos?: () => void;
}

export function MobileBottomNav({ currentPath, navigate, onOpenSos }: MobileBottomNavProps) {
  const { triggerHaptic } = usePWA();
  const { user } = useAuth();

  const handleTabClick = (path: string) => {
    triggerHaptic(12);
    navigate(path);
  };

  const navTabs = [
    {
      id: 'home',
      label: 'Explore',
      path: '/',
      icon: Compass,
      isActive: currentPath === '/' || currentPath === '/explore' || currentPath.startsWith('/destinations/'),
    },
    {
      id: 'map',
      label: 'Eco Map',
      path: '/map',
      icon: MapPin,
      isActive: currentPath === '/map',
      badge: 'SOS',
    },
    {
      id: 'trips',
      label: 'AI Planner',
      path: '/trip-planner',
      icon: Sparkles,
      isActive: currentPath === '/trip-planner',
    },
    {
      id: 'local',
      label: 'Artisans',
      path: '/discover-local',
      icon: ShoppingBag,
      isActive: currentPath === '/discover-local',
    },
    {
      id: 'profile',
      label: user ? 'Eco Passes' : 'Account',
      path: user ? '/profile' : '/signin',
      icon: user ? QrCode : User,
      isActive:
        currentPath === '/profile' ||
        currentPath === '/my-trips' ||
        currentPath === '/my-reservations' ||
        currentPath === '/signin' ||
        currentPath === '/signup',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-lg border-t border-stone-200/90 dark:border-stone-800/90 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-around px-1.5 py-1.5 max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {/* Active Tab Background Pill */}
              {active && (
                <span className="absolute -top-1 w-8 h-1 bg-emerald-600 dark:bg-emerald-500 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
              )}

              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-xs'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 ${
                      active ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                  />
                </div>

                {/* Badge e.g. SOS indicator on Map */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 bg-rose-600 text-white text-[8px] font-black tracking-tight rounded-full animate-pulse shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] leading-tight mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
