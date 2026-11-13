'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, QrCode } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground">
      {/* LEFT SIDE (Desktop Branding & Visual Showcase) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-slate-900 to-teal-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-border/60">
        {/* Glow Highlights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-md">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Health<span className="text-teal-400">Bridge</span> India
              </span>
              <p className="text-[10px] text-teal-200 font-medium">
                One Nation • One Health Record
              </p>
            </div>
          </Link>

          <Badge variant="outline" className="border-teal-400/40 text-teal-300 bg-teal-950/40">
            ABDM Compatible
          </Badge>
        </div>

        {/* Middle Visual: Card Graphic */}
        <div className="relative z-10 max-w-md my-auto space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {title || 'Secure Healthcare Access for Every Citizen'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {subtitle ||
                'Connect with verified doctors, access longitudinal diagnostic records, and share electronic health summaries with explicit digital consent.'}
            </p>
          </div>

          {/* Mini Showcase Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-teal-300 font-semibold uppercase tracking-wider">
                ABHA Identity Security
              </span>
              <QrCode className="h-4 w-4 text-teal-300" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                ✓
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white">Patient Data Sovereignty</p>
                <p className="text-slate-400">Zero unauthorized medical record sharing</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Two-Tier Authorization</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>Token Rotation Protection</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} HealthBridge India Platform</span>
          <span className="text-[11px] text-teal-400 font-medium">Digital India Initiative</span>
        </div>
      </div>

      {/* RIGHT SIDE (Form Viewport) */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>

          <ThemeToggle />
        </div>

        {/* Center Container for Forms */}
        <div className="w-full max-w-xl mx-auto my-auto py-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-card">
            {children}
          </div>
        </div>

        {/* Mobile Footer Note */}
        <div className="w-full max-w-xl mx-auto text-center pt-4 text-xs text-muted-foreground">
          <p>HealthBridge India • Secure Health Information Exchange Architecture</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
