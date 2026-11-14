'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Laptop,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDoctorChangePassword, useDoctorSessions } from '@/features/doctor/hooks/use-doctor';

export function DoctorSecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { changePassword, isChanging } = useDoctorChangePassword();
  const { sessions } = useDoctorSessions();

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

    if (!passwordsMatch) {
      setErrorMsg('New password and confirm password do not match');
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccessMsg('Account password updated successfully! All active sessions remain secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change password. Please check your current password.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="font-semibold">{errorMsg}</div>
        </div>
      )}

      {/* Change Password Card */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Change Doctor Account Password
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Ensure your account is protected with a high-entropy password following clinical security standards
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your existing account password"
                  className="pr-10 text-xs h-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Password</label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    className="pr-10 text-xs h-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10 text-xs h-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Password Strength Meter */}
            {newPassword && (
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground">Password Complexity:</span>
                  <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(validCount / 5) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-muted-foreground pt-1">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : ''}`}>
                    <CheckCircle2 className="h-3 w-3" /> Min 8 characters
                  </div>
                  <div className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-600 font-semibold' : ''}`}>
                    <CheckCircle2 className="h-3 w-3" /> Uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center gap-1 ${hasLowercase ? 'text-emerald-600 font-semibold' : ''}`}>
                    <CheckCircle2 className="h-3 w-3" /> Lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-semibold' : ''}`}>
                    <CheckCircle2 className="h-3 w-3" /> Numeric digit (0-9)
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-semibold' : ''}`}>
                    <CheckCircle2 className="h-3 w-3" /> Special character (!@#$)
                  </div>
                  <div className={`flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 font-semibold' : ''}`}>
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/60 py-3.5 px-6 flex justify-end bg-muted/10">
            <Button
              type="submit"
              size="sm"
              disabled={isChanging || !currentPassword || validCount < 5 || !passwordsMatch}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Lock className="h-3.5 w-3.5" />
              {isChanging ? 'Updating Password...' : 'Update Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Active Sessions Quick Summary */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Active Devices & Clinical Sessions
              </CardTitle>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-xs h-7 gap-1">
              <Link href="/doctor/settings/sessions">
                Manage Sessions <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Monitor and revoke active logins across web browsers, clinic tablets, and mobile devices
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 text-xs space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
            <div>
              <p className="font-bold text-foreground">Currently Active Sessions</p>
              <p className="text-muted-foreground text-[11px]">
                {sessions.length} device{sessions.length !== 1 ? 's' : ''} currently authenticated with your practitioner credentials.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              {sessions.length} Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security Compliance Safeguards */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              National Health Authority (ABDM) Safeguards
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Healthcare Professionals Registry (HPR)</p>
              <p className="text-muted-foreground text-[11px]">ABDM digitally verified medical council identity</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
              Enforced
            </Badge>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">HttpOnly Cookie Token Storage</p>
              <p className="text-muted-foreground text-[11px]">Prevents Cross-Site Scripting (XSS) credential theft</p>
            </div>
            <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px]">
              Active
            </Badge>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Clinical Audit Trail (AuditLog)</p>
              <p className="text-muted-foreground text-[11px]">Immutable tracking of patient record access and prescription issuance</p>
            </div>
            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px]">
              Audited
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DoctorSecuritySettings;
