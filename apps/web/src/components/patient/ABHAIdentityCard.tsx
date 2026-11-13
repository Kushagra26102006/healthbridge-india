'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Link2, ExternalLink, AlertCircle, Copy, Check, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IPatientProfile, AbhaLinkageStatus } from '@healthbridge/shared-types';

export interface ABHAIdentityCardProps {
  profile?: IPatientProfile | null;
  patientName?: string;
}

export function ABHAIdentityCard({ profile, patientName }: ABHAIdentityCardProps) {
  const [copied, setCopied] = useState(false);

  const abhaStatus: AbhaLinkageStatus = profile?.abhaLinkageStatus || 'NOT_LINKED';
  const abhaAddress = profile?.abhaAddress;
  const rawAbhaNumber = profile?.abhaNumber;

  // Mask ABHA number appropriately if present (e.g. 91-XXXX-XXXX-1234)
  const formatMaskedAbha = (num?: string): string => {
    if (!num) return 'Not Linked';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}-XXXX-XXXX-${cleaned.slice(10)}`;
    }
    return num;
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLinked = abhaStatus === 'LINKED' && (abhaAddress || rawAbhaNumber);

  return (
    <Card className="relative overflow-hidden border-border/80 shadow-card bg-gradient-to-br from-card via-card to-accent/20">
      {/* Decorative Tricolor Top Accent Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-indiaOrange via-white to-brand-indiaGreen" />

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Card Header: National Health Authority & ABHA Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/15 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Ayushman Bharat Digital Mission
              </span>
              <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                ABHA Health Identity
              </h3>
            </div>
          </div>

          <Badge
            variant={
              abhaStatus === 'LINKED' ? 'abha' : abhaStatus === 'PENDING' ? 'warning' : 'secondary'
            }
            className="text-[10px] font-bold uppercase tracking-wide"
          >
            {abhaStatus === 'LINKED'
              ? 'ABHA Linked'
              : abhaStatus === 'PENDING'
                ? 'Link Pending'
                : 'Not Connected'}
          </Badge>
        </div>

        {/* Identity Details */}
        {isLinked ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* ABHA Address */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  ABHA Address (PHR)
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs sm:text-sm text-foreground truncate">
                    {abhaAddress || 'Not set'}
                  </span>
                  {abhaAddress && (
                    <button
                      type="button"
                      onClick={() => handleCopy(abhaAddress)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="Copy ABHA Address"
                      aria-label="Copy ABHA Address"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Masked ABHA Number */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  14-Digit ABHA Number
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-wider">
                  {formatMaskedAbha(rawAbhaNumber)}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                Linked to {patientName || 'Verified Citizen'}
              </span>

              <Link href="/patient/settings">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2.5">
                  <span>Manage ABHA</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Clear Onboarding State When ABHA Not Linked */
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Connect Your ABHA Health ID</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Link your Ayushman Bharat Health Account (ABHA) to enable seamless, consent-based
                  health record sharing with hospitals, diagnostic labs, and clinics nationwide.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href="/patient/settings">
                <Button variant="teal" size="sm" className="text-xs font-semibold gap-1.5 h-8">
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Link 14-Digit ABHA</span>
                </Button>
              </Link>
              <Link
                href="#abha-info"
                className="text-[11px] text-teal-700 dark:text-teal-300 font-medium hover:underline p-1"
              >
                Learn about ABHA
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ABHAIdentityCard;
