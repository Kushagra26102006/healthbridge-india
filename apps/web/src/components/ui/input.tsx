'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 sm:h-8 text-sm sm:text-xs px-2.5 rounded-sm',
  md: 'h-11 sm:h-10 text-base sm:text-sm px-3 rounded-md',
  lg: 'h-12 sm:h-11 text-base px-3.5 rounded-md',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type,
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const hasMessage = Boolean(error || success || helperText);

    const inputElement = (
      <div className={cn('relative flex items-center w-full', !label && containerClassName)}>
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-3 inline-flex items-center text-muted-foreground"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'flex w-full border bg-surface text-foreground shadow-xs transition-colors duration-150',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground/80',
            'hover:border-foreground/25',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60',
            sizeClasses[inputSize],
            leftIcon && 'pl-9',
            (rightIcon || error || success) && 'pr-9',
            error
              ? 'border-error focus-visible:ring-error focus-visible:border-error'
              : success
                ? 'border-success focus-visible:ring-success focus-visible:border-success'
                : 'border-input',
            className
          )}
          ref={ref}
          {...props}
        />
        {(rightIcon || error || success) && (
          <span
            className="absolute right-3 inline-flex items-center text-muted-foreground"
            aria-hidden="true"
          >
            {rightIcon ??
              (error ? (
                <AlertCircle className="h-4 w-4 text-error" />
              ) : success ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : null)}
          </span>
        )}
      </div>
    );

    if (!label && !hasMessage) {
      return inputElement;
    }

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-label inline-flex items-center gap-1">
            <span>{label}</span>
            {required && (
              <span className="text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {inputElement}
        {hasMessage && (
          <p
            id={messageId}
            role={error ? 'alert' : undefined}
            className={cn(
              'text-xs leading-normal',
              error
                ? 'text-error font-medium'
                : success
                  ? 'text-success font-medium'
                  : 'text-muted-foreground'
            )}
          >
            {error ?? success ?? helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
