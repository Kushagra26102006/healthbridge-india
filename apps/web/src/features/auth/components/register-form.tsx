'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, User, Mail, Phone, Lock, Loader2 } from 'lucide-react';
import type { UserRole } from '@healthbridge/shared-types';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role,
      });

      setSuccessMessage(result.message || 'Registration successful!');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setLocalError(msg);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Create HealthBridge Account
          </CardTitle>
          <Badge variant="outline" className="text-xs text-teal-700 bg-teal-50 border-teal-200">
            DISHA Compliant
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          Join India&apos;s unified, ABHA-integrated healthcare network
        </p>
      </CardHeader>

      <CardContent>
        {successMessage ? (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h4 className="font-semibold text-emerald-900">Registration Submitted</h4>
            <p className="text-xs text-emerald-700">{successMessage}</p>
            {onSwitchToLogin && (
              <Button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2"
              >
                Proceed to Sign In
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {(error || localError) && (
              <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{localError || error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Account Type</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-md border text-center transition-all ${
                      role === r
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {role !== 'PATIENT' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-sm border border-amber-200">
                  ⚠️ Healthcare provider accounts require verification before full activation.
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Legal Name</label>
              <div className="relative">
                <User className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-md border-slate-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border rounded-md border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Phone</label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border rounded-md border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border rounded-md border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Confirm</label>
                <div className="relative">
                  <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border rounded-md border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>

            {onSwitchToLogin && (
              <div className="text-center text-xs text-slate-500 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
