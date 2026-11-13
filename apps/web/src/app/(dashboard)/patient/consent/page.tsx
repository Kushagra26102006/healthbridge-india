'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileCheck2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PatientConsentPage() {
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
              Consent Management
            </h2>
            <p className="text-xs text-muted-foreground">
              Granular, electronic consent controls under ABDM and DISHA privacy frameworks
            </p>
          </div>
        </div>

        <Badge variant="abha" className="text-xs">
          Consent-First Architecture
        </Badge>
      </div>

      <Card className="border-border shadow-card bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Consent Control Dashboard Shell
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                View, approve, deny, or revoke electronic health record access for care providers
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
              <Lock className="h-4 w-4" />
              <span>Zero-Knowledge Patient Sovereignty</span>
            </div>
            <p>
              Under ABDM standards, no hospital, physician, or lab can view your medical records
              without your explicit, time-bounded digital authorization. Interactive consent
              approvals and one-click revocation will be wired in the dedicated consent milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Active Consents</span>
              <p className="text-muted-foreground text-[11px]">
                Currently authorized doctors and clinics.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Pending Requests</span>
              <p className="text-muted-foreground text-[11px]">Awaiting your approval or denial.</p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Revocation History</span>
              <p className="text-muted-foreground text-[11px]">
                Immutable audit trail of access changes.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-border pt-4">
          <Link href="/patient/dashboard">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Dashboard
            </Button>
          </Link>
          <Button variant="teal" size="sm" className="text-xs gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            Review Access Permissions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
