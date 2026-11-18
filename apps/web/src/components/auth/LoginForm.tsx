'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Loader2,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Pill,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { loginValidationSchema } from '@healthbridge/validation';
import type { PortalShowcaseKey } from './AuthLayout';

export type QuickFillRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onRoleSelect?: (portal: PortalShowcaseKey) => void;
  redirectTo?: string;
}

const DEMO_ACCOUNTS: ReadonlyArray<{
  role: QuickFillRole;
  label: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
  showcasePortal?: PortalShowcaseKey;
}> = [
  {
    role: 'PATIENT',
    label: 'Patient',
    email: 'ramesh.patel@healthbridge.local',
    icon: HeartPulse,
    showcasePortal: 'PATIENT',
  },
  {
    role: 'DOCTOR',
    label: 'Doctor',
    email: 'dr.priya.sharma@healthbridge.local',
    icon: Stethoscope,
    showcasePortal: 'DOCTOR',
  },
  {
    role: 'PHARMACY',
    label: 'Pharmacy',
    email: 'pharmacy.demo@healthbridge.local',
    icon: Pill,
    showcasePortal: 'PHARMACY',
  },
  {
    role: 'LABORATORY',
    label: 'Lab',
    email: 'lab.demo@healthbridge.local',
    icon: FlaskConical,
    showcasePortal: 'LABORATORY',
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    email: 'admin.demo@healthbridge.local',
    icon: ShieldCheck,
  },
];

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onRoleSelect,
  redirectTo,
}: LoginFormProps) {
  const router = useRouter();
  const { login, isLoading, error: authError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedDemoRole, setSelectedDemoRole] = useState<QuickFillRole | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const payload = {
      identifier: identifier.trim(),
      password,
    };

    const validation = loginValidationSchema.safeParse(payload);
    if (!validation.success) {
      setLocalError(validation.error.issues[0]?.message || 'Please check your login details');
      return;
    }

    try {
      const authResult = await login(payload);
      if (onSuccess) {
        onSuccess();
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Role-based redirection from verified server-side response
        const userRole = authResult?.user?.role;
        if (userRole === 'PATIENT') {
          router.push('/patient/dashboard');
        } else if (userRole === 'DOCTOR') {
          router.push('/doctor/dashboard');
        } else if (userRole === 'PHARMACY') {
          router.push('/pharmacy/dashboard');
        } else if (userRole === 'LABORATORY') {
          router.push('/laboratory/dashboard');
        } else if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setLocalError(msg);
    }
  };

  const handleQuickFill = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setIdentifier(account.email);
    setPassword('DemoSecure#2026');
    setSelectedDemoRole(account.role);
    setLocalError(null);
    if (account.showcasePortal) {
      onRoleSelect?.(account.showcasePortal);
    }
  };

  return (
    <div className="space-y-5 text-left">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sign In to HealthBridge
          </h2>
          <Badge variant="abha" className="text-[10px]">
            ABHA Integrated
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter your registered email address or 10-digit Indian mobile number
        </p>
      </div>

      <FormError message={localError || authError} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-identifier" className="block text-xs font-semibold text-foreground">
            Email or 10-Digit Mobile Number
          </label>
          <div className="relative">
            <User className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              id="login-identifier"
              type="text"
              placeholder="e.g. ramesh.patel@healthbridge.local or 9876543212"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setSelectedDemoRole(null);
              }}
              disabled={isLoading}
              className="pl-9"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="login-password"
            label=""
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Remember Session */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-teal-600 focus:ring-teal-500"
            />
            <span>Remember session on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="teal"
          size="lg"
          className="w-full shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating Credentials...
            </>
          ) : (
            'Sign In to Healthcare Portal'
          )}
        </Button>
      </form>

      {/* Quick Fill Demo Helper for All 5 Seeded Portals */}
      <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            Quick-Fill Synthetic Demo Accounts
          </span>
          <span className="text-[10px] font-normal text-muted-foreground">All 5 Portals</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isActive = selectedDemoRole === account.role;
            return (
              <button
                key={account.role}
                type="button"
                onClick={() => handleQuickFill(account)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold rounded-xl border transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-card border-border hover:border-teal-500/50 hover:bg-accent text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{account.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Link to Registration */}
      <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border">
        Don&apos;t have an account yet?{' '}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Register for ABHA Access
          </button>
        ) : (
          <Link
            href="/register"
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Register for ABHA Access
          </Link>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
