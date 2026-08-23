import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n, Language } from '../lib/i18n-context';
import { usePWA } from '../lib/pwa-context';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'pill' | 'segmented';
  className?: string;
}

export function LanguageSwitcher({ variant = 'pill', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage } = useI18n();
  const { triggerHaptic } = usePWA();

  const handleToggle = () => {
    triggerHaptic(12);
    toggleLanguage();
  };

  const handleSelect = (lang: Language) => {
    if (lang !== language) {
      triggerHaptic(15);
      setLanguage(lang);
    }
  };

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 ${className}`}
      >
        <button
          type="button"
          onClick={() => handleSelect('en')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
          aria-pressed={language === 'en'}
        >
          <span>English</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelect('hi')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            language === 'hi'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
          aria-pressed={language === 'hi'}
        >
          <span>हिंदी</span>
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={language === 'en' ? 'हिंदी में बदलें (Switch to Hindi)' : 'Switch to English'}
        aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
        className={`flex items-center justify-center h-8 w-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100/90 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer shrink-0 font-bold text-xs ${className}`}
      >
        <span className="font-extrabold">{language === 'en' ? 'हिं' : 'EN'}</span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 ${className}`}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {language === 'en' ? 'Language / भाषा' : 'भाषा / Language'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSelect('hi')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'hi'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>
    );
  }

  // Default: Elegant Pill Button
  return (
    <button
      type="button"
      onClick={handleToggle}
      title={language === 'en' ? 'हिंदी में बदलें (Switch to Hindi)' : 'Switch to English'}
      aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100/90 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold transition-all shadow-xs cursor-pointer select-none group ${className}`}
    >
      <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:rotate-45" />
      <span className="font-bold tracking-tight">
        {language === 'en' ? (
          <span className="flex items-center gap-1">
            <span className="text-stone-900 dark:text-stone-100 font-bold">EN</span>
            <span className="text-stone-400 text-[10px]">|</span>
            <span className="text-stone-500 hover:text-emerald-600">हिंदी</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-stone-500">EN</span>
            <span className="text-stone-400 text-[10px]">|</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">हिंदी</span>
          </span>
        )}
      </span>
    </button>
  );
}
