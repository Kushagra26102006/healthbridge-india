'use client';

import React, { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormErrorItem {
  fieldId?: string;
  label?: string;
  message: string;
}

export interface FormErrorSummaryProps {
  errors: FormErrorItem[];
  title?: string;
  className?: string;
}

/**
 * WCAG 2.2 AA 3.3.1 / 3.3.3 Form Validation Error Summary:
 * Moves focus to the summary on submit errors and lets keyboard users jump directly to invalid inputs.
 */
export function FormErrorSummary({
  errors,
  title = 'Please correct the following before continuing:',
  className,
}: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) {
      ref.current?.focus();
    }
  }, [errors.length]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      aria-labelledby="form-error-summary-heading"
      className={cn(
        'rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/35 p-4 text-xs text-rose-800 dark:text-rose-200 focus-ring space-y-2',
        className
      )}
    >
      <div className="flex items-center gap-2 font-semibold" id="form-error-summary-heading">
        <AlertCircle className="h-4 w-4 text-error shrink-0" aria-hidden="true" />
        <span>
          {title} ({errors.length})
        </span>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {errors.map((err, idx) => (
          <li key={`${err.fieldId ?? 'err'}-${idx}`}>
            {err.fieldId ? (
              <a
                href={`#${err.fieldId}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(err.fieldId!);
                  el?.focus();
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="underline font-medium hover:opacity-80 focus-ring rounded-sm"
              >
                {err.label ? `${err.label}: ` : ''}
                {err.message}
              </a>
            ) : (
              <span>
                {err.label ? `${err.label}: ` : ''}
                {err.message}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FormErrorSummary;
