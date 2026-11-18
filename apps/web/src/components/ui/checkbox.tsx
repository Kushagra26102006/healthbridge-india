'use client';

import * as React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { triggerHaptic } from '@/lib/motion/haptics';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      indeterminate = false,
      checked,
      defaultChecked,
      disabled,
      id,
      onCheckedChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked));
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      triggerHaptic('selection');
      onCheckedChange?.(e.target.checked);
      onChange?.(e);
    };

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'inline-flex items-start gap-2.5 select-none',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          )}
        >
          <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <input
              ref={innerRef}
              id={inputId}
              type="checkbox"
              checked={isControlled ? checked : undefined}
              defaultChecked={!isControlled ? defaultChecked : undefined}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              onChange={handleChange}
              className="peer sr-only"
              {...props}
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border shadow-xs transition-all duration-150',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                isChecked || indeterminate
                  ? 'border-primary bg-primary text-primary-foreground'
                  : error
                    ? 'border-error bg-surface'
                    : 'border-input bg-surface hover:border-foreground/30'
              )}
            >
              <AnimatePresence initial={false} mode="wait">
                {indeterminate ? (
                  <m.span
                    key="indeterminate"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="inline-flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3 stroke-[2.75]" />
                  </m.span>
                ) : isChecked ? (
                  <m.span
                    key="checked"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="inline-flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 stroke-[2.75]" />
                  </m.span>
                ) : null}
              </AnimatePresence>
            </span>
          </span>

          {(label || description) && (
            <span className="flex flex-col gap-0.5">
              {label && <span className="text-sm font-medium leading-snug text-foreground">{label}</span>}
              {description && <span className="text-xs leading-normal text-muted-foreground">{description}</span>}
            </span>
          )}
        </label>

        {error && (
          <p role="alert" className="text-xs font-medium text-error pl-7">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
