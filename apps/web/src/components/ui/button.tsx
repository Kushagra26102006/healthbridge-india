'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm hover:-translate-y-[0.5px]',
        primary:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm hover:-translate-y-[0.5px]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:opacity-92 hover:shadow-sm hover:-translate-y-[0.5px]',
        outline:
          'border border-border bg-surface text-foreground shadow-xs hover:bg-muted/80 hover:border-foreground/20',
        ghost: 'text-foreground hover:bg-muted/80 hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 hover:shadow-sm',
        teal: 'bg-secondary text-secondary-foreground shadow-xs hover:opacity-92 hover:shadow-glow hover:-translate-y-[0.5px]',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto font-medium active:scale-100',
        gradient:
          'bg-gradient-to-r from-brand-blue via-brand-teal to-brand-cyan text-white shadow-sm hover:shadow-md hover:brightness-105 hover:-translate-y-[0.5px]',
        subtleTeal:
          'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-sm px-3 text-xs',
        lg: 'h-11 rounded-md px-6 text-sm font-semibold',
        xl: 'h-12 rounded-lg px-7 text-base font-semibold shadow-sm',
        icon: 'h-9 w-9 rounded-md p-0',
        'icon-sm': 'h-8 w-8 rounded-sm p-0',
        'icon-lg': 'h-10 w-10 rounded-md p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const computedClassName = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      return React.cloneElement(child, {
        ...props,
        className: cn(computedClassName, child.props.className as string | undefined),
        'aria-disabled': disabled || loading ? true : undefined,
      });
    }

    return (
      <button
        className={computedClassName}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
