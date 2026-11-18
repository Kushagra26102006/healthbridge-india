'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  placeholder?: string;
  options?: SelectOption[];
  selectSize?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 sm:h-8 text-sm sm:text-xs pl-2.5 pr-8 rounded-sm',
  md: 'h-11 sm:h-10 text-base sm:text-sm pl-3 pr-9 rounded-md',
  lg: 'h-12 sm:h-11 text-base pl-3.5 pr-10 rounded-md',
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      success,
      placeholder,
      options,
      selectSize = 'md',
      id,
      required,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const messageId = `${selectId}-message`;
    const hasMessage = Boolean(error || success || helperText);

    const selectEl = (
      <div className={cn('relative w-full', !label && containerClassName)}>
        <select
          id={selectId}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'flex w-full appearance-none border bg-surface text-foreground shadow-xs transition-colors duration-150',
            'hover:border-foreground/25',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60',
            sizeClasses[selectSize],
            error
              ? 'border-error focus-visible:ring-error focus-visible:border-error'
              : success
                ? 'border-success focus-visible:ring-success focus-visible:border-success'
                : 'border-input',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );

    if (!label && !hasMessage) {
      return selectEl;
    }

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-label inline-flex items-center gap-1">
            <span>{label}</span>
            {required && (
              <span className="text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {selectEl}
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
Select.displayName = 'Select';

export { Select };
