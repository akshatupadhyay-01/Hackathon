import * as React from 'react';
import { cn } from '../../utils/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-stone-200 dark:bg-stone-800', className)}
      {...props}
    />
  );
}
