import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md dark:shadow-none',
        teal: 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:shadow-glow dark:bg-teal-500 dark:hover:bg-teal-600',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background/80 backdrop-blur-xs shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-slate-300 dark:hover:border-slate-700',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-sm',
        ghost: 'hover:bg-accent/80 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto font-normal',
        gradient:
          'bg-gradient-to-r from-blue-700 via-teal-600 to-cyan-600 text-white shadow-md hover:shadow-lg hover:brightness-105',
        subtleTeal:
          'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base font-semibold',
        xl: 'h-12 rounded-xl px-8 text-base font-semibold shadow-md',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
