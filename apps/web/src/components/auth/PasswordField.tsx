'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PasswordFieldProps extends Omit<InputProps, 'type'> {
  label?: string;
  error?: string;
  showStrength?: boolean;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, label = 'Password', error, id = 'password', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5 text-left">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
export default PasswordField;
