'use client';

import React from 'react';
import { ShieldCheck, FileText, Pill, Lock, QrCode, CheckCircle2, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AbhaPreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Decorative gradient backdrops */}
      <div className="absolute -top-6 -left-6 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Showcase Container */}
      <div className="relative rounded-3xl border border-border/90 bg-card/95 backdrop-blur-xl p-5 sm:p-7 shadow-cardHover transition-all duration-300 hover:shadow-2xl space-y-5">
        {/* Synthetic Demo Disclaimer Banner */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 border border-border/70 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Interactive Sample Preview</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-border">
            ABDM Sandbox Architecture
          </span>
        </div>

        {/* 1. ABHA Digital Identity Card Element */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-slate-900 to-teal-950 p-5 text-white shadow-lg border border-teal-500/20">
          {/* Subtle Indian tricolor accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500 opacity-80" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300">
                  Ayushman Bharat Digital Mission
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight text-white mt-0.5">
                ABHA Health ID
              </h3>
            </div>
            <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-xs text-white">
              <QrCode className="h-6 w-6 text-teal-300" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300 font-medium">Aarav Sharma</p>
              <p className="font-mono text-sm tracking-wider font-semibold text-teal-200 mt-0.5">
                91-4523-8891-2309
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">aarav.sharma@abdm</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
              <p className="text-[10px] text-slate-400 mt-1">DOB: 14/08/1988</p>
            </div>
          </div>
        </div>

        {/* 2. Longitudinal Health Records Teaser */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Connected Health Records (EHR)
            </span>
            <span className="text-[11px] text-muted-foreground font-normal">
              2 Linked Hospitals
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border border-border/80 hover:bg-accent/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">AIIMS New Delhi</p>
                  <p className="text-[11px] text-muted-foreground">Comprehensive Health Panel</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-[10px] font-medium">
                  12 Oct 2026
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border border-border/80 hover:bg-accent/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Fortis Heart Institute</p>
                  <p className="text-[11px] text-muted-foreground">Cardiology Consultation & Rx</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-[10px] font-medium">
                  28 Sep 2026
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Consent Management Indicator */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-transparent border border-teal-500/25">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-400">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Active Consent Artifact</p>
                <p className="text-[10px] text-muted-foreground">
                  Dr. Priya Sen • Max Super Speciality
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              Valid for 30 Days
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-teal-500/15">
            <span>Purpose: Diagnostic Care</span>
            <span className="text-teal-600 dark:text-teal-400 font-medium">Patient Revocable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AbhaPreviewCard;
