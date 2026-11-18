'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      success,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const messageId = `${textareaId}-message`;
    const hasMessage = Boolean(error || success || helperText);

    const textareaEl = (
      <textarea
        id={textareaId}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          'flex min-h-[88px] w-full rounded-md border bg-surface px-3 py-2 text-base sm:text-sm text-foreground shadow-xs transition-colors duration-150',
          'placeholder:text-muted-foreground/80',
          'hover:border-foreground/25',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60',
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
    );

    if (!label && !hasMessage) {
      return textareaEl;
    }

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-label inline-flex items-center gap-1">
            <span>{label}</span>
            {required && (
              <span className="text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {textareaEl}
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
Textarea.displayName = 'Textarea';

export { Textarea };
