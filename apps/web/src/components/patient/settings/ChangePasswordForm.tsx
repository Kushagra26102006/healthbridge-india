'use client';

import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChangePassword } from '@/features/patient/hooks/use-profile';

export const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const changePasswordMutation = useChangePassword();

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const validCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(
    Boolean
  ).length;

  const getStrengthLabel = () => {
    if (!newPassword) return { label: 'Empty', color: 'bg-muted', textColor: 'text-muted-foreground' };
    if (validCount <= 2) return { label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-500' };
    if (validCount === 3 || validCount === 4)
      return { label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Current password is required');
      return;
    }

    if (validCount < 5) {
      setErrorMsg('New password does not meet all security complexity requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    try {
      const res = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccessMsg(res.message || 'Your password was updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password. Please verify current password.';
      setErrorMsg(msg);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Change Account Password
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Ensure your account is protected with a high-entropy password
            </p>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Lock className="h-3 w-3 text-muted-foreground" />
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="text-xs rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-teal-600" />
                New Password
              </label>
              {newPassword && (
                <span className={`text-[10px] font-bold ${strength.textColor}`}>
                  Strength: {strength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters with upper, lower, number, special"
                required
                className="text-xs rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength Bar */}
            {newPassword && (
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${(validCount / 5) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 text-[11px]">
            <span className="font-semibold text-muted-foreground block">Password Requirements:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${hasMinLength ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <span className={hasMinLength ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${hasUppercase ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <span className={hasUppercase ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  One uppercase letter (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${hasLowercase ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <span className={hasLowercase ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  One lowercase letter (a-z)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${hasNumber ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <span className={hasNumber ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  One numeric digit (0-9)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${hasSpecial ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <span className={hasSpecial ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  One special character (!@#$%)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="text-xs rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-destructive">Passwords do not match</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2.5 p-4 border-t border-border/60 bg-muted/10">
          <Button
            type="submit"
            size="sm"
            disabled={changePasswordMutation.isPending || !passwordsMatch || validCount < 5}
            className="text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

