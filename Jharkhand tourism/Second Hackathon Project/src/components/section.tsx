import * as React from 'react';
import { cn } from '../lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
  containerClassName,
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-12 md:py-16', className)} {...props}>
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', containerClassName)}>
        {(title || subtitle || action) && (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              {title && (
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1.5 text-sm md:text-base text-stone-500 dark:text-stone-400 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
