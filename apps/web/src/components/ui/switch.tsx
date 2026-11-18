'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { MOTION_SPRING } from '@/lib/motion/tokens';
import { triggerHaptic } from '@/lib/motion/haptics';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  id,
  label,
  description,
  size = 'md',
  'aria-label': ariaLabel,
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;

  const handleClick = () => {
    if (disabled) return;
    triggerHaptic('selection');
    onCheckedChange?.(!checked);
  };

  const trackSize = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const thumbSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const thumbOffsetX = size === 'sm' ? (checked ? 16 : 0) : checked ? 20 : 0;

  const buttonEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      id={switchId}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        trackSize,
        checked ? 'bg-primary' : 'bg-muted-foreground/30 dark:bg-border',
        !label && !description && className
      )}
    >
      <m.span
        aria-hidden="true"
        animate={{ x: thumbOffsetX }}
        transition={MOTION_SPRING.snappy}
        className={cn(
          'pointer-events-none inline-block rounded-pill bg-white shadow-sm ring-0 will-change-transform',
          thumbSize
        )}
      />
    </button>
  );

  if (!label && !description) {
    return buttonEl;
  }

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex flex-col gap-0.5">
        {label && (
          <label
            htmlFor={switchId}
            className={cn(
              'text-sm font-medium leading-snug text-foreground',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            )}
          >
            {label}
          </label>
        )}
        {description && <span className="text-xs leading-normal text-muted-foreground">{description}</span>}
      </div>
      {buttonEl}
    </div>
  );
}

export const Toggle = Switch;
export type ToggleProps = SwitchProps;

export default Switch;
