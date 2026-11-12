import { Compass, Home, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';

interface NotFoundPageProps {
  navigate: (path: string) => void;
  path?: string;
}

export function NotFoundPage({ navigate, path }: NotFoundPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-stone-50/50 dark:bg-stone-950">
      <div className="max-w-md text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
          <Compass className="h-9 w-9" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          Off the trail
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          We couldn&apos;t find{' '}
          <span className="font-mono text-xs bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded">
            {path || 'this page'}
          </span>
          . It may have been moved, or the link is incorrect.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button onClick={() => navigate('/')} className="bg-emerald-700 text-white text-xs">
            <Home className="h-4 w-4 mr-2" />
            Back to home
          </Button>
          <Button variant="outline" onClick={() => navigate('/explore')} className="text-xs">
            <MapPin className="h-4 w-4 mr-2" />
            Explore destinations
          </Button>
        </div>
      </div>
    </div>
  );
}
