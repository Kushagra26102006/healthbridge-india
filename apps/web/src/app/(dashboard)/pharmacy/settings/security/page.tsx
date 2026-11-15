'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Save,
} from 'lucide-react';
import { useChangePharmacyPassword } from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PharmacySecuritySettingsPage() {
  const changePasswordMutation = useChangePharmacyPassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Policy validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPolicySatisfied = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isPolicySatisfied) {
      setFeedback({
        type: 'error',
        message: 'New password does not fulfill the required security criteria.',
      });
      return;
    }

    if (!passwordsMatch) {
      setFeedback({
        type: 'error',
        message: 'New password and confirmation password do not match.',
      });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
        revokeOtherSessions,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({
        type: 'success',
        message: 'Password changed successfully. Your account is secured.',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update password. Verify current password.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Account Security & IAM</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Account Security & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Update your dispensary portal password and enforce account protection standards.
        </p>
      </div>

      <PharmacySettingsNav />

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Password Change Form */}
        <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-rose-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Change Pharmacy Login Password
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a strong new password"
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeOtherSessions}
                  onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>
                  Log out of all other active browser sessions and devices automatically
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending || !isPolicySatisfied || !passwordsMatch}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>

        {/* Password Policy Card */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Password Policy Rules
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  hasMinLength ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={hasMinLength ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                At least 8 characters
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  hasUpper ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={hasUpper ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                At least one uppercase letter (A-Z)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  hasLower ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={hasLower ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                At least one lowercase letter (a-z)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  hasNumber ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={hasNumber ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                At least one numeric digit (0-9)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  hasSpecial ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={hasSpecial ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                At least one special character (!@#$%^&*)
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  passwordsMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={passwordsMatch ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                Passwords match
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

