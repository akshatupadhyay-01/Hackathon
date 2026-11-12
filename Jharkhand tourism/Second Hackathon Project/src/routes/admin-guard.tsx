import { ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { AdminPage } from './admin';

interface AdminGuardProps {
  navigate: (path: string) => void;
}

/**
 * Access gate for the Government Tourism Intelligence Dashboard.
 * Authority comes from the `user_roles` table resolved in AuthProvider,
 * never from client-side storage or the self-editable profile row.
 */
export function AdminGuard({ navigate }: AdminGuardProps) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
            <LogIn className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Official sign-in required
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            The Government Tourism Intelligence Dashboard is restricted to authorised
            Department of Tourism officials.
          </p>
          <Button
            onClick={() => navigate('/signin?redirect=/admin')}
            className="bg-emerald-700 text-white text-xs"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Restricted area
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Your account does not hold the Tourism Department administrator role.
            Contact the State Tourism Board to request dashboard access.
          </p>
          <Button variant="outline" onClick={() => navigate('/')} className="text-xs">
            Return to home
          </Button>
        </div>
      </div>
    );
  }

  return <AdminPage navigate={navigate} />;
}
