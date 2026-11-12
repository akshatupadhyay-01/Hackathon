import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../contexts/theme-context';
import { AuthProvider } from '../contexts/auth-context';
import { PWAProvider } from '../contexts/pwa-context';
import { I18nProvider } from '../contexts/i18n-context';
import { SiteHeader } from '../components/layout/site-header';
import { SiteFooter } from '../components/layout/site-footer';
import { MobileBottomNav } from '../components/layout/mobile-bottom-nav';
import { MobileQuickActions } from '../components/layout/mobile-quick-actions';
import { PWAInstallBanner } from '../components/common/pwa-install-banner';
import { HomePage } from '../features/home/pages';
import { ExplorePage } from '../features/destinations/pages/explore';
import { DestinationDetailPage } from '../features/destinations/pages/destinations.$slug';
import { MapPage } from '../features/map/pages/map';
import { DiscoverLocalPage } from '../features/discover-local/pages/discover-local';
import { TripPlannerPage } from '../features/trip-planner/pages/trip-planner';
import { BusinessPage } from '../features/discover-local/pages/business';
import { ProfilePage } from '../features/profile/pages/profile';
import { AdminPage } from '../features/admin/pages/admin';
import { SignInPage } from '../features/auth/pages/sign-in';
import { SignUpPage } from '../features/auth/pages/sign-up';
import { ForgotPasswordPage } from '../features/auth/pages/forgot-password';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname || '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getQueryParam = (param: string): string | undefined => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || undefined;
  };

  // Route matching
  const renderRoute = () => {
    // Check dynamic route: /destinations/:slug
    if (currentPath.startsWith('/destinations/')) {
      const slug = currentPath.replace('/destinations/', '').split('/')[0];
      return <DestinationDetailPage slug={slug} navigate={navigate} />;
    }

    switch (currentPath) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/explore':
      case '/destinations':
        return (
          <ExplorePage
            navigate={navigate}
            initialSearch={getQueryParam('search') || ''}
            initialCategory={getQueryParam('category') || 'all'}
          />
        );
      case '/map':
        return (
          <MapPage
            navigate={navigate}
            selectedDestinationId={getQueryParam('destinationId')}
            selectedDestinationSlug={getQueryParam('destination') || getQueryParam('slug')}
            itineraryMode={getQueryParam('itinerary') === 'active' || getQueryParam('mode') === 'itinerary'}
          />
        );
      case '/discover-local':
        return <DiscoverLocalPage navigate={navigate} />;
      case '/trip-planner':
        return <TripPlannerPage navigate={navigate} />;
      case '/business':
        return <BusinessPage navigate={navigate} />;
      case '/profile':
        return <ProfilePage navigate={navigate} />;
      case '/my-trips':
        return <ProfilePage navigate={navigate} initialTab="trips" />;
      case '/my-reservations':
        return <ProfilePage navigate={navigate} initialTab="passes" />;
      case '/signin':
      case '/login':
        return <SignInPage navigate={navigate} redirectPath={getQueryParam('redirect')} />;
      case '/signup':
      case '/register':
        return <SignUpPage navigate={navigate} />;
      case '/forgot-password':
        return <ForgotPasswordPage navigate={navigate} isResetMode={false} />;
      case '/reset-password':
        return <ForgotPasswordPage navigate={navigate} isResetMode={true} />;
      case '/admin':
        return <AdminPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <PWAProvider>
          <I18nProvider>
            <div 
              className="min-h-screen min-h-[100dvh] flex flex-col bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-emerald-500 selection:text-white"
              style={{ minHeight: '100dvh' }}
            >
              <PWAInstallBanner />
              <SiteHeader currentPath={currentPath} navigate={navigate} />
              <main 
                className={`flex-1 w-full min-h-0 ${currentPath === '/map' ? 'pb-16 md:pb-0' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0'}`}
                style={{ minHeight: 0 }}
              >
                {renderRoute()}
              </main>
              {currentPath !== '/map' && <SiteFooter navigate={navigate} />}
              <MobileQuickActions currentPath={currentPath} navigate={navigate} />
              <MobileBottomNav currentPath={currentPath} navigate={navigate} />
            </div>
          </I18nProvider>
        </PWAProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

