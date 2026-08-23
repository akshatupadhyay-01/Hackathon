import React from 'react';
import { Leaf, Heart, ShieldCheck, Smartphone } from 'lucide-react';
import { usePWA } from '../lib/pwa-context';
import { useI18n } from '../lib/i18n-context';
import { LanguageSwitcher } from './language-switcher';

interface SiteFooterProps {
  navigate: (path: string) => void;
}

export function SiteFooter({ navigate }: SiteFooterProps) {
  const { isInstallable, isInstalled, setShowInstallModal, triggerHaptic } = usePWA();
  const { t } = useI18n();

  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-stone-900 text-stone-300 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Platform Overview */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                {t('brand.name', 'Johar Jharkhand')}
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              {t('footer.tagline', 'Dedicated to promoting sustainable eco-tourism, indigenous tribal heritage, and authentic rural livelihoods across Jharkhand.')}
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-lg w-fit">
                <ShieldCheck className="h-4 w-4" />
                <span>{t('brand.deptBadge', 'Dept. of Tourism, Govt. of Jharkhand')}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <LanguageSwitcher variant="segmented" />
              </div>
              {!isInstalled && isInstallable && (
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setShowInstallModal(true);
                  }}
                  className="flex items-center gap-2 text-xs text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 px-3 py-1.5 rounded-lg w-fit font-medium cursor-pointer transition-colors"
                >
                  <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t('nav.installMobileApp', 'Install Official Mobile App')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Col 2: Destinations */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.exploreTitle', 'Explore Jharkhand')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('/explore')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  All 8 Key Eco-Zones
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/destinations/betla-national-park')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Betla Tiger Reserve
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/destinations/netarhat-sunset-point')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Netarhat Hill Station
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/destinations/parasnath-hills-shikharji')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Parasnath Peak (Shikharji)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/destinations/patratu-valley')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Patratu Valley & Dam
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Cultural & Community */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.communityTitle', 'Community & Culture')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('/discover-local')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Dokra Lost-Wax Metal Art
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/discover-local')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Sohrai & Kohbar Murals
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/discover-local')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Tribal Homestay Network
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/business')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Artisan & Host Onboarding
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/trip-planner')}
                  className="hover:text-emerald-400 transition-colors text-stone-400 cursor-pointer"
                >
                  Carbon-Neutral Trip Planner
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Eco Principles & SIH Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.charterTitle', 'Green Tourism Charter')}
            </h4>
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700 space-y-2 text-xs text-stone-300">
              <p className="font-semibold text-emerald-400">
                🌿 Zero-Plastic & Fair-Wage Promise
              </p>
              <p className="text-stone-400 leading-normal">
                {t('footer.charterText', '100% of guide and homestay bookings directly empower local indigenous Gram Panchayats and self-help cooperatives.')}
              </p>
              <div className="pt-2 border-t border-stone-700 flex items-center justify-between text-[11px] text-stone-400">
                <span>District Hubs: 8 Active</span>
                <span>Version: Phase 2 (Supabase)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>{t('footer.rights', '© 2026 Johar Jharkhand Tourism Platform — SIH25032 Hackathon Prototype.')}</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/map')} className="hover:text-stone-300">
              {t('nav.ecoMap', 'Explore Map')}
            </button>
            <span>•</span>
            <button onClick={() => navigate('/admin')} className="hover:text-stone-300">
              {t('nav.govDashboard', 'Government Tourism Dashboard')}
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-stone-400">
              {t('footer.builtWith', 'Built for Jharkhand with')} <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
