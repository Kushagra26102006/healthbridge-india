'use client';

import React from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Calendar, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePatientDashboard } from '@/features/patient/hooks/use-patient-dashboard';

export default function PatientProfilePage() {
  const { user } = useAuth();
  const { summary } = usePatientDashboard();

  const profile = summary?.profile;

  const formatDateOfBirth = (dob?: Date | string) => {
    if (!dob) return 'Not Provided';
    try {
      const d = new Date(dob);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return String(dob);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Patient Profile
            </h2>
            <p className="text-xs text-muted-foreground">
              Personal identity details, contact information, and verified healthcare identifiers
            </p>
          </div>
        </div>

        <Badge
          variant={user?.accountStatus === 'ACTIVE' ? 'success' : 'warning'}
          className="text-xs font-mono"
        >
          {user?.accountStatus || 'ACTIVE'}
        </Badge>
      </div>

      <Card className="border-border shadow-card bg-card">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                {user?.name || 'Verified Citizen'}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>Account Role:</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  {user?.role || 'PATIENT'}
                </span>
                <span>•</span>
                <span>ID: {user?.id?.slice(0, 8)}...</span>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Full Legal Name
              </span>
              <p className="font-bold text-sm text-foreground">{user?.name}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email Address
              </span>
              <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                {user?.email}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Registered Mobile
              </span>
              <p className="font-mono font-medium text-xs sm:text-sm text-foreground">
                {user?.phone || 'Not set'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date of Birth
              </span>
              <p className="font-medium text-xs sm:text-sm text-foreground">
                {formatDateOfBirth(profile?.dateOfBirth)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Gender</span>
              <p className="font-medium text-xs sm:text-sm text-foreground capitalize">
                {profile?.gender ? profile.gender.toLowerCase() : 'Not Provided'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                ABHA Status
              </span>
              <p className="font-semibold text-xs sm:text-sm text-foreground">
                {profile?.abhaLinkageStatus === 'LINKED' ? 'ABHA Linked' : 'Not Connected'}
              </p>
            </div>
          </div>

          {/* Address & Emergency Contact if available */}
          {profile?.address && (
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Residential Location</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {[
                  profile.address.line1,
                  profile.address.city,
                  profile.address.district,
                  profile.address.state,
                  profile.address.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-border pt-4">
          <Link href="/patient/dashboard">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Dashboard
            </Button>
          </Link>
          <Link href="/patient/settings">
            <Button variant="teal" size="sm" className="text-xs">
              Edit Account Preferences
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
