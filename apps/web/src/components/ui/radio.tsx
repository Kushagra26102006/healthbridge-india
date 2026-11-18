'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  name: string;
  value?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  label,
  error,
  orientation = 'vertical',
  className,
  children,
  ...props
}: RadioGroupProps) {
  const generatedName = React.useId();
  const groupName = name ?? generatedName;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const handleChange = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <RadioGroupContext.Provider
      value={{ name: groupName, value: activeValue, disabled, onChange: handleChange }}
    >
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        className={cn('flex flex-col gap-2', className)}
        {...props}
      >
        {label && <span className="text-label">{label}</span>}
        <div
          className={cn(
            'flex gap-2.5',
            orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'
          )}
        >
          {children}
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioItemProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  variant?: 'default' | 'card';
  className?: string;
  id?: string;
}

export function RadioItem({
  value,
  label,
  description,
  disabled = false,
  variant = 'default',
  className,
  id,
}: RadioItemProps) {
  const ctx = React.useContext(RadioGroupContext);
  const generatedId = React.useId();
  const itemId = id ?? generatedId;
  const isDisabled = disabled || Boolean(ctx?.disabled);
  const isChecked = ctx?.value === value;

  return (
    <label
      htmlFor={itemId}
      className={cn(
        'relative flex items-start gap-2.5 select-none transition-all duration-150',
        variant === 'card' &&
          cn(
            'rounded-md border p-3.5 shadow-xs',
            isChecked
              ? 'border-primary bg-primary/[0.04] dark:bg-primary/10 ring-1 ring-primary/30'
              : 'border-border bg-surface hover:border-foreground/25 hover:bg-muted/30'
          ),
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
    >
      <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input
          id={itemId}
          type="radio"
          name={ctx?.name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => ctx?.onChange(value)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-all duration-150',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            isChecked
              ? 'border-primary bg-primary'
              : 'border-input bg-surface hover:border-foreground/30'
          )}
        >
          {isChecked && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
        </span>
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
        {description && <span className="text-xs leading-normal text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
