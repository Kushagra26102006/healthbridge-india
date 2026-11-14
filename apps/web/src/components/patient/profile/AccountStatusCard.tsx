'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, Lock, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PatientProfileDto } from '@healthbridge/shared-types';

export interface AccountStatusCardProps {
  profile?: PatientProfileDto;
}

export const AccountStatusCard: React.FC<AccountStatusCardProps> = ({ profile }) => {
  const completion = profile?.completionPercentage ?? 75;

  const checklist = [
    {
      label: 'Basic Identity & Legal Name',
      completed: Boolean(profile?.name),
    },
    {
      label: 'Date of Birth & Demographics',
      completed: Boolean(profile?.dateOfBirth),
    },
    {
      label: 'Residential Postal Address',
      completed: Boolean(profile?.address?.postalCode && profile?.address?.city),
    },
    {
      label: 'Emergency Contact Verified',
      completed: Boolean(profile?.emergencyContact?.phone),
    },
    {
      label: 'Primary Email Verified',
      completed: Boolean(profile?.emailVerified),
    },
    {
      label: 'National ABHA ID Linked',
      completed: profile?.abhaLinkageStatus === 'LINKED',
    },
  ];

  return (
    <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Account Health & Security Level
            </CardTitle>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-600 dark:text-purple-400">
            {completion === 100 ? 'Level 3: Comprehensive' : 'Level 2: Standard'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 text-xs">
        {/* Progress header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Profile Readiness Score</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{completion}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            Verification Readiness Checklist:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50 text-[11px]"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span
                  className={
                    item.completed
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security footnote */}
        <div className="pt-2 text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/60">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            <span>256-bit AES Vault Encryption Active</span>
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span>HIPAA & DPDP Guarded</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

