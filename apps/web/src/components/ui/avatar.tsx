'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { type StatusIndicatorTone } from './status-indicator';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: StatusIndicatorTone;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const statusColorMap: Record<StatusIndicatorTone, string> = {
  online: 'bg-success',
  verified: 'bg-secondary',
  success: 'bg-success',
  pending: 'bg-warning',
  warning: 'bg-warning',
  busy: 'bg-error',
  error: 'bg-error',
  info: 'bg-primary',
  offline: 'bg-muted-foreground/50',
  neutral: 'bg-muted-foreground/60',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !imgFailed;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-pill bg-primary/10 text-primary font-semibold select-none border border-primary/15',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt ?? name ?? 'User avatar'}
          onError={() => setImgFailed(true)}
          className="h-full w-full rounded-pill object-cover"
        />
      ) : (
        <span aria-hidden={Boolean(alt)}>{getInitials(name ?? alt)}</span>
      )}

      {status && (
        <span
          aria-label={`Status: ${status}`}
          className={cn(
            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-pill ring-2 ring-surface',
            statusColorMap[status]
          )}
        />
      )}
    </div>
  );
}

export function AvatarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center -space-x-2 [&>*]:ring-2 [&>*]:ring-surface', className)}>
      {children}
    </div>
  );
}
