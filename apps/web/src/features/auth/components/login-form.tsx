'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!identifier.trim()) {
      setLocalError('Please enter your email or 10-digit mobile number');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      await login({ identifier: identifier.trim(), password });
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLocalError(msg);
    }
  };

  const handleQuickFill = (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    if (role === 'PATIENT') {
      setIdentifier('ramesh.patel@healthbridge.local');
      setPassword('DemoSecure#2026');
    } else if (role === 'DOCTOR') {
      setIdentifier('dr.priya.sharma@healthbridge.local');
      setPassword('DemoSecure#2026');
    } else if (role === 'ADMIN') {
      setIdentifier('admin.demo@healthbridge.local');
      setPassword('DemoSecure#2026');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Sign In to HealthBridge
          </CardTitle>
          <Badge variant="outline" className="text-xs text-teal-700 bg-teal-50 border-teal-200">
            ABHA Integrated
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          Enter your registered email address or 10-digit mobile number
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="p-3 text-sm rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email or Mobile Number</label>
            <div className="relative">
              <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. ramesh@abdm or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                className="text-xs text-teal-600 hover:underline"
                onClick={() => alert('Please use the forgot-password API or contact admin')}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-10 py-2 text-sm border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Quick-fill fixtures for review */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Synthetic demo accounts:</p>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleQuickFill('PATIENT')}
              >
                Patient
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleQuickFill('DOCTOR')}
              >
                Doctor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleQuickFill('ADMIN')}
              >
                Admin
              </Button>
            </div>
          </div>

          {onSwitchToRegister && (
            <div className="text-center text-xs text-slate-500 pt-2">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-teal-600 font-semibold hover:underline"
              >
                Register here
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

