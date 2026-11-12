import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  Users,
  Calendar,
  Briefcase,
  ShieldCheck,
  Menu,
  X,
  Leaf,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Route,
  QrCode,
  ChevronDown,
  LogIn,
  UserPlus,
  MoreVertical,
  Download,
  Smartphone,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { isSupabaseConfigured } from '../../services/supabase/client';
import { useTheme } from '../../contexts/theme-context';
import { useAuth } from '../../contexts/auth-context';
import { usePWA } from '../../contexts/pwa-context';
import { useI18n } from '../../contexts/i18n-context';
import { LanguageSwitcher } from '../common/language-switcher';
import { EmergencyHelpModal } from '../common/emergency-help-modal';

interface SiteHeaderProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export function SiteHeader({ currentPath, navigate }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { isInstallable, isInstalled, setShowInstallModal, promptInstall, triggerHaptic } = usePWA();
  const { t, language, toggleLanguage, setLanguage, isHindi } = useI18n();
  const isDbLive = isSupabaseConfigured();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setOverflowMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOutClick = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: t('nav.explore', 'Explore'), path: '/explore', icon: Compass },
    { label: t('nav.ecoMap', 'Eco Map'), path: '/map', icon: MapPin },
    { label: t('nav.artisansGuides', 'Artisans & Guides'), path: '/discover-local', icon: Users },
    { label: t('nav.tripPlanner', 'Trip Planner'), path: '/trip-planner', icon: Calendar },
    { label: t('nav.hostPortal', 'Host Portal'), path: '/business', icon: Briefcase },
    { label: t('nav.govDashboard', 'Gov Dashboard'), path: '/admin', icon: ShieldCheck },
  ];

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || (isHindi ? 'यात्री' : 'Traveler');
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div
          onClick={() => {
            navigate('/');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none min-w-0 mr-2"
        >
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform shrink-0">
            <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-100" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-stone-900 dark:text-stone-50 block leading-tight truncate">
              {t('brand.name', 'Johar Jharkhand')}
            </span>
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium tracking-tight sm:tracking-wide block leading-none truncate">
              {t('brand.tagline', 'Eco & Cultural Tourism Platform')}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Badges (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* i18n Language Switcher (Desktop) */}
          <LanguageSwitcher variant="pill" />

          {/* Install App CTA (Desktop & Tablet) */}
          {!isInstalled && isInstallable && (
            <button
              onClick={() => {
                triggerHaptic(15);
                setShowInstallModal(true);
              }}
              title="Install Jharkhand Eco-Tourism as Native App"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all shadow-xs cursor-pointer select-none hover:scale-[1.02] shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('nav.installApp', 'Install App')}</span>
            </button>
          )}

          {/* Emergency / SOS Primary Action Button (Desktop, Laptop, Tablet) */}
          <button
            onClick={() => setSosModalOpen(true)}
            aria-label={t('nav.sos', 'Emergency SOS')}
            title="Emergency SOS (24x7 Ambulance 108, Police 112, Fire 101)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-xs font-bold transition-all shadow-xs cursor-pointer select-none hover:scale-[1.02] shrink-0"
          >
            <span className="text-sm">🆘</span>
            <span>{t('nav.sos', 'SOS')}</span>
          </button>

          {/* Live DB Indicator */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            title={isDbLive ? 'Connected to Supabase PostgreSQL' : 'Operating with verified Seed Dataset'}
          >
            <div className={`h-2 w-2 rounded-full ${isDbLive ? 'bg-emerald-500 animate-pulse' : 'bg-teal-500'}`} />
            <span className="text-stone-600 dark:text-stone-300">
              {isDbLive ? 'Live DB' : 'Seed Data'}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 text-xs font-semibold transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
                <span className="text-[11px]">{t('nav.lightMode', 'Light')}</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-emerald-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
                <span className="text-[11px]">{t('nav.darkMode', 'Dark')}</span>
              </>
            )}
          </button>

          {/* User Auth Menu (Desktop) */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 bg-stone-50 dark:bg-stone-900 transition-all cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 max-w-[100px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="h-3 w-3 text-stone-400" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-1.5 z-50 animate-in fade-in-50">
                  <div className="px-3.5 py-2 border-b border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t('nav.profile', 'Profile & Settings')}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/profile?tab=trips');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Route className="h-3.5 w-3.5 text-teal-600" />
                      <span>{t('nav.myTrips', 'My Saved Trips')}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/profile?tab=passes');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <QrCode className="h-3.5 w-3.5 text-amber-600" />
                      <span>{t('nav.myPasses', 'My Reservations & Passes')}</span>
                    </button>

                    {!isInstalled && isInstallable && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setShowInstallModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors font-medium"
                      >
                        <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{t('nav.installApp', 'Install App on Device')}</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800 pt-1">
                    <button
                      onClick={handleSignOutClick}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t('nav.signOut', 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/signin')}
                className="text-xs h-8 px-2.5 text-stone-700 dark:text-stone-300 hover:text-stone-900 font-semibold"
              >
                <LogIn className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                {t('nav.signIn', 'Sign In')}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="text-xs h-8 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {t('nav.signUp', 'Sign Up')}
              </Button>
            </div>
          )}

          {/* Three-dot (⋮) Overflow Menu Trigger (Desktop) */}
          <div className="relative" ref={overflowRef}>
            <button
              onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
              aria-label="More options and Emergency SOS"
              title="More options (⋮)"
              className="p-1.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Three-dot Overflow Dropdown Menu */}
            {overflowMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl py-1.5 z-50 animate-in fade-in-50">
                {/* 1. Emergency / SOS (Highlighted as primary action) */}
                <div className="p-1 border-b border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setSosModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-200 transition-colors text-left font-bold text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">🆘</span>
                      <div>
                        <span className="block font-extrabold text-rose-700 dark:text-rose-300">
                          {t('sos.title', 'Emergency / SOS')}
                        </span>
                        <span className="block text-[10px] font-medium text-rose-600/80 dark:text-rose-400">
                          Ambulance, Police, Fire & GPS
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border-rose-300 text-[9px] py-0 px-1">
                      24x7
                    </Badge>
                  </button>
                </div>

                {/* 2. Secondary Overflow Options */}
                <div className="py-1">
                  {/* Language switch option in overflow */}
                  <div className="px-3.5 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                      {t('nav.language', 'Language')}
                    </span>
                    <LanguageSwitcher variant="segmented" />
                  </div>

                  {!isInstalled && isInstallable && (
                    <button
                      onClick={() => {
                        setOverflowMenuOpen(false);
                        setShowInstallModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left font-medium"
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                      <span>{t('nav.installApp', 'Install Web App')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{t('nav.govDashboard', 'Government Dashboard')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex md:hidden items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Mobile SOS Quick Button */}
          <button
            onClick={() => setSosModalOpen(true)}
            aria-label={t('nav.sos', 'Emergency SOS')}
            title="Emergency SOS"
            className="p-1 sm:p-1.5 px-1.5 sm:px-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <span className="text-xs">🆘</span>
            <span className="text-[10px] sm:text-[11px] font-bold">SOS</span>
          </button>

          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700" />
            )}
          </button>

          {user ? (
            <div
              onClick={() => {
                navigate('/profile');
              }}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shadow-sm cursor-pointer shrink-0"
            >
              {userInitial}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/signin')}
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold shrink-0"
            >
              {t('nav.signIn', 'Sign In')}
            </Button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-1 sm:p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 pt-3 pb-36 space-y-3 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain shadow-2xl">
          {/* Emergency / SOS Primary Banner in Mobile Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setSosModalOpen(true);
            }}
            className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 flex items-center justify-between text-left text-rose-700 dark:text-rose-200 font-bold shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🆘</span>
              <div>
                <span className="block text-sm font-extrabold text-rose-700 dark:text-rose-300">
                  {t('sos.title', 'Emergency / SOS')}
                </span>
                <span className="block text-[10px] font-medium text-rose-600 dark:text-rose-400">
                  Ambulance (108), Police (112), Fire (101) & GPS
                </span>
              </div>
            </div>
            <Badge variant="outline" className="bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border-rose-400 text-[10px]">
              Helpline
            </Badge>
          </button>

          {/* User Account Quick Card if logged in - Fully clickable */}
          {user ? (
            <div
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0 ring-2 ring-emerald-300 dark:ring-emerald-600">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{displayName}</p>
                    <span className="text-[9px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold px-1.5 py-0.5 rounded-full">
                      Account
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[170px]">{user.email}</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 mt-0.5">
                    <span>Manage Profile & Passes</span>
                    <span className="text-xs">→</span>
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignOutClick();
                }}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold px-2 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg shrink-0 border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900"
              >
                {t('nav.signOut', 'Sign Out')}
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 text-center">
                Welcome Traveler! Sign in to access your digital passes & trips
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/signin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center text-xs border-stone-300 dark:border-stone-700"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  {t('nav.signIn', 'Sign In')}
                </Button>
                <Button
                  onClick={() => {
                    navigate('/signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  {t('nav.createAccount', 'Create Account')}
                </Button>
              </div>
            </div>
          )}

          {/* Language Switcher Full Tile in Mobile Drawer */}
          <LanguageSwitcher variant="full" className="my-1" />

          {/* Navigation Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User specific menu links on mobile */}
          {user && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-3 py-1">
                My Travel Space
              </div>
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-stone-800 dark:text-stone-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              >
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>My Profile & Account</span>
              </button>
              <button
                onClick={() => {
                  navigate('/profile?tab=trips');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Route className="h-4 w-4 text-teal-600 shrink-0" />
                <span>{t('nav.myTrips', 'My Saved Trips')}</span>
              </button>
              <button
                onClick={() => {
                  navigate('/profile?tab=passes');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <QrCode className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{t('nav.myPasses', 'My Reservations & Passes')}</span>
              </button>
            </div>
          )}

          {/* Mobile Theme Switcher Row */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 my-2">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {t('nav.appearance', 'Appearance')}
            </span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold shadow-sm text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>{t('nav.lightMode', 'Light Mode')}</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t('nav.darkMode', 'Dark Mode')}</span>
                </>
              )}
            </button>
          </div>

          {/* Install App & Quick Access Action Buttons */}
          <div className="pt-1 flex flex-col gap-2">
            {!isInstalled && isInstallable && (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowInstallModal(true);
                }}
                className="w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-xs text-white font-bold shadow-md gap-2 h-10 rounded-xl"
              >
                <Download className="h-4 w-4" />
                <span>{t('nav.installMobileApp', 'Install Jharkhand Eco App')}</span>
              </Button>
            )}
            <Button
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-center bg-emerald-700 hover:bg-emerald-800 text-xs text-white font-bold h-10 rounded-xl shadow-sm"
            >
              <Sparkles className="h-4 w-4 mr-2 text-amber-300" />
              <span>{t('nav.profile', 'Traveler Profile & Passes')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Emergency / SOS Modal */}
      <EmergencyHelpModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        navigate={navigate}
      />
    </header>
  );
}
