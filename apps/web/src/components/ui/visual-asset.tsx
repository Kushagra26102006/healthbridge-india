'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  EDITORIAL_ASSETS,
  DIAGRAM_ASSETS,
  EMPTY_STATE_ASSETS,
  type EditorialAssetKey,
  type DiagramAssetKey,
  type EmptyStateAssetKey,
} from '@/lib/assets/image-manifest';

export interface EditorialVisualProps {
  asset: EditorialAssetKey;
  priority?: boolean;
  sizes?: string;
  aspectClassName?: string;
  className?: string;
  imageClassName?: string;
  altOverride?: string;
  caption?: string;
}

/**
 * Optimized Next.js Image container for editorial healthcare photography.
 * Preserves aspect ratio (zero CLS), respects prefers-reduced-motion, and supports priority hero loading.
 */
export function EditorialVisual({
  asset,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px',
  aspectClassName = 'aspect-[16/10]',
  className,
  imageClassName,
  altOverride,
  caption,
}: EditorialVisualProps) {
  const item = EDITORIAL_ASSETS[asset];

  return (
    <figure
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-sm',
        className
      )}
    >
      <div className={cn('relative w-full overflow-hidden', aspectClassName)}>
        <Image
          src={item.src}
          alt={altOverride ?? item.alt}
          width={item.width}
          height={item.height}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          unoptimized
          sizes={sizes}
          className={cn(
            'h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025]',
            imageClassName
          )}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent dark:from-slate-950/35"
        />
      </div>
      {caption && (
        <figcaption className="px-3.5 py-2 text-[11px] font-medium text-muted-foreground bg-card/90 border-t border-border/60">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export interface DiagramVisualProps {
  asset: DiagramAssetKey;
  className?: string;
  altOverride?: string;
}

export function DiagramVisual({ asset, className, altOverride }: DiagramVisualProps) {
  const item = DIAGRAM_ASSETS[asset];
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/80 bg-card p-2 sm:p-3 shadow-xs',
        className
      )}
    >
      <Image
        src={item.src}
        alt={altOverride ?? item.alt}
        width={item.width}
        height={item.height}
        loading="lazy"
        unoptimized
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
}

export interface EmptyIllustrationProps {
  asset: EmptyStateAssetKey;
  compact?: boolean;
  className?: string;
}

export function EmptyIllustration({
  asset,
  compact = false,
  className,
}: EmptyIllustrationProps) {
  const item = EMPTY_STATE_ASSETS[asset];
  return (
    <Image
      src={item.src}
      alt=""
      aria-hidden="true"
      width={item.width}
      height={item.height}
      loading="lazy"
      unoptimized
      className={cn(
        'mx-auto select-none pointer-events-none object-contain transition-transform duration-300 motion-safe:hover:-translate-y-0.5',
        compact ? 'w-28 h-20' : 'w-40 h-28',
        className
      )}
    />
  );
}
