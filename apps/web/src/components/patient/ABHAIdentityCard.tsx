'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'framer-motion';
import {
  ShieldCheck,
  Link2,
  ExternalLink,
  AlertCircle,
  Sparkles,
  RotateCw,
  QrCode,
  Download,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/motion';
import { useInteractionPreferences } from '@/lib/motion/preferences';
import type { IPatientProfile, AbhaLinkageStatus } from '@healthbridge/shared-types';

export interface ABHAIdentityCardProps {
  profile?: IPatientProfile | null;
  patientName?: string;
}

export function ABHAIdentityCard({ profile, patientName }: ABHAIdentityCardProps) {
  const [showBack, setShowBack] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { triggerFeedback } = useInteractionPreferences();

  const abhaStatus: AbhaLinkageStatus = profile?.abhaLinkageStatus || 'NOT_LINKED';
  const abhaAddress = profile?.abhaAddress;
  const rawAbhaNumber = profile?.abhaNumber;

  const formatMaskedAbha = (num?: string): string => {
    if (!num) return 'Not Linked';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}-XXXX-XXXX-${cleaned.slice(10)}`;
    }
    return num;
  };

  const isLinked = abhaStatus === 'LINKED' && Boolean(abhaAddress || rawAbhaNumber);
  const maskedNumber = formatMaskedAbha(rawAbhaNumber);

  const handleDownloadCard = () => {
    if (!isLinked) return;
    const safeName = (patientName || 'Account Holder').replace(/[<>&"]/g, '');
    const safeAddress = (abhaAddress || 'Not set').replace(/[<>&"]/g, '');
    const safeNumber = maskedNumber.replace(/[<>&"]/g, '');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420" viewBox="0 0 760 420">
      <rect width="760" height="420" rx="20" fill="#080F1E"/>
      <rect width="760" height="8" fill="#0D9488"/>
      <text x="40" y="64" fill="#2DD4BF" font-family="sans-serif" font-size="14" font-weight="700">AYUSHMAN BHARAT HEALTH ACCOUNT (MASKED SUMMARY)</text>
      <text x="40" y="128" fill="#F8FAFC" font-family="sans-serif" font-size="26" font-weight="700">${safeName}</text>
      <text x="40" y="192" fill="#94A3B8" font-family="sans-serif" font-size="13">MASKED ABHA NUMBER</text>
      <text x="40" y="224" fill="#2DD4BF" font-family="monospace" font-size="24" font-weight="700">${safeNumber}</text>
      <text x="40" y="280" fill="#94A3B8" font-family="sans-serif" font-size="13">ABHA ADDRESS</text>
      <text x="40" y="310" fill="#F8FAFC" font-family="monospace" font-size="18">${safeAddress}</text>
      <text x="40" y="382" fill="#94A3B8" font-family="sans-serif" font-size="12">Generated from HealthBridge India Patient Portal • Status: ${abhaStatus}</text>
    </svg>`;

    try {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'healthbridge-abha-card-summary.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      triggerFeedback('confirm');
      window.setTimeout(() => setDownloaded(false), 2000);
    } catch {
      triggerFeedback('error');
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle ABDM Top Accent */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-brand-indiaOrange via-brand-blue to-brand-indiaGreen"
      />

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-secondary/12 text-secondary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Ayushman Bharat Digital Mission
              </span>
              <h3 className="text-card-heading">ABHA Digital Health Card</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                abhaStatus === 'LINKED'
                  ? 'abha'
                  : abhaStatus === 'PENDING'
                    ? 'warning'
                    : 'neutral'
              }
              size="sm"
            >
              {abhaStatus === 'LINKED'
                ? 'Linked'
                : abhaStatus === 'PENDING'
                  ? 'Link Pending'
                  : 'Not Connected'}
            </Badge>

            {isLinked && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBack((prev) => !prev)}
                aria-label={showBack ? 'Show card front' : 'Show QR & governance back'}
                className="h-7 px-2 text-xs gap-1"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{showBack ? 'Front' : 'Details / QR'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Linked vs Unlinked Body */}
        {isLinked ? (
          <AnimatePresence mode="wait" initial={false}>
            {!showBack ? (
              <m.div
                key="front"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-md bg-muted/40 border border-border/80 space-y-1">
                    <span className="text-xs font-medium text-muted-foreground block">
                      ABHA Address (PHR)
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-sm text-foreground truncate">
                        {abhaAddress || 'Not set'}
                      </span>
                      {abhaAddress && (
                        <CopyButton
                          value={abhaAddress}
                          label="Copy"
                          copiedLabel="Copied"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs shrink-0"
                        />
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-md bg-muted/40 border border-border/80 space-y-1">
                    <span className="text-xs font-medium text-muted-foreground block">
                      14-Digit ABHA Number (Masked)
                    </span>
                    <span className="font-mono font-semibold text-sm text-foreground tracking-wider block pt-0.5">
                      {maskedNumber}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                    <span>Holder: {patientName || 'Authenticated Patient'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCard}
                      className="h-7 text-xs px-2.5"
                    >
                      {downloaded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Download Card</span>
                        </>
                      )}
                    </Button>

                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2.5">
                      <Link href="/patient/abha">
                        <span>Manage ABHA</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </m.div>
            ) : (
              <m.div
                key="back"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-md bg-muted/40 border border-border/80"
              >
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">ABHA Consent &amp; Privacy Boundary</p>
                  <p className="leading-relaxed">
                    Linking your ABHA identity enables provider record discovery, but does not
                    automatically share clinical records. Explicit consent approval is always
                    required.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface p-3 shrink-0">
                  <QrCode className="h-12 w-12 text-foreground" aria-hidden="true" />
                  <span className="font-mono text-[10px] text-muted-foreground mt-1">
                    ABHA QR VIEW
                  </span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="p-4 rounded-lg bg-primary/[0.04] dark:bg-primary/10 border border-primary/20 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Connect Your ABHA Health Identity
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Link your Ayushman Bharat Health Account (ABHA) to discover records across
                  participating facilities under explicit patient consent.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button variant="primary" size="sm" asChild>
                <Link href="/patient/abha/link">
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Link ABHA Identity</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/patient/abha">View ABHA Status</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ABHAIdentityCard;
