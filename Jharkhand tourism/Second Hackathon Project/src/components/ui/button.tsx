import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'emerald';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants = {
      default:
        'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 active:bg-emerald-900',
      emerald:
        'bg-emerald-600 text-white shadow hover:bg-emerald-700 active:bg-emerald-800',
      destructive:
        'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
      outline:
        'border border-stone-300 dark:border-stone-700 bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100',
      secondary:
        'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700',
      ghost:
        'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300',
      link: 'text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-lg px-6 text-base',
      icon: 'h-9 w-9',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
