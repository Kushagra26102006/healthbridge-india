'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  CheckCircle2,
  HeartPulse,
  Stethoscope,
  Pill,
  FlaskConical,
  QrCode,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { Badge } from '@/components/ui/badge';
import type { EditorialAssetKey } from '@/lib/assets/image-manifest';

export type PortalShowcaseKey = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY';

interface PortalShowcaseItem {
  key: PortalShowcaseKey;
  tabLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  asset: EditorialAssetKey;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  highlights: readonly string[];
}

export const PORTAL_SHOWCASE_ITEMS: readonly PortalShowcaseItem[] = [
  {
    key: 'PATIENT',
    tabLabel: 'Patients',
    eyebrow: 'Citizens & Families',
    title: 'Patients',
    description: 'Manage personal health records, appointments, and consent permissions.',
    asset: 'ecosystemPatientCare',
    icon: HeartPulse,
    accentClass: 'text-teal-300 bg-teal-500/20 border-teal-400/30',
    highlights: [
      'Unified personal medical record timeline.',
      'Grant or revoke provider consent anytime.',
      'Track prescriptions, lab reports, and orders.',
    ],
  },
  {
    key: 'DOCTOR',
    tabLabel: 'Doctors',
    eyebrow: 'Clinicians & Specialists',
    title: 'Doctors',
    description: 'Review consented patient history and manage structured clinical care.',
    asset: 'ecosystemDoctorWorkspace',
    icon: Stethoscope,
    accentClass: 'text-sky-300 bg-sky-500/20 border-sky-400/30',
    highlights: [
      'Consent-verified longitudinal patient overview.',
      'SOAP clinical encounters & digital prescriptions.',
      'Live appointment queue & weekly scheduling.',
    ],
  },
  {
    key: 'PHARMACY',
    tabLabel: 'Pharmacies',
    eyebrow: 'Dispensaries & Networks',
    title: 'Pharmacies',
    description: 'Verify digital prescriptions and manage batch-tracked dispensing.',
    asset: 'ecosystemPharmacyDispensing',
    icon: Pill,
    accentClass: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30',
    highlights: [
      'Structured e-Prescription verification queue.',
      'Batch, expiry, and stock-ledger inventory.',
      'Order fulfillment and pickup verification.',
    ],
  },
  {
    key: 'LABORATORY',
    tabLabel: 'Labs',
    eyebrow: 'Pathology & Diagnostics',
    title: 'Diagnostic Laboratories',
    description: 'Coordinate sample accessioning, quality control, and report publishing.',
    asset: 'ecosystemLaboratoryDiagnostics',
    icon: FlaskConical,
    accentClass: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/30',
    highlights: [
      'Barcode sample tracking & accessioning.',
      'Structured diagnostic report review & sign-off.',
      'QMS instrument, calibration & CAPA logs.',
    ],
  },
];

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  activePortal?: PortalShowcaseKey;
  onPortalChange?: (portal: PortalShowcaseKey) => void;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  activePortal,
  onPortalChange,
}: AuthLayoutProps) {
  const prefersReducedMotion = useReducedMotion();
  const [internalPortal, setInternalPortal] = useState<PortalShowcaseKey>('PATIENT');
  const [isPaused, setIsPaused] = useState(false);

  const selectedKey = activePortal ?? internalPortal;
  const activeItem =
    PORTAL_SHOWCASE_ITEMS.find((item) => item.key === selectedKey) ?? PORTAL_SHOWCASE_ITEMS[0]!;

  const handleSelectPortal = (key: PortalShowcaseKey) => {
    setInternalPortal(key);
    onPortalChange?.(key);
  };

  // Gentle auto-cycle across the 4 healthcare ecosystem portals when idle
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const timer = window.setInterval(() => {
      const idx = PORTAL_SHOWCASE_ITEMS.findIndex((item) => item.key === selectedKey);
      const next = PORTAL_SHOWCASE_ITEMS[(idx + 1) % PORTAL_SHOWCASE_ITEMS.length];
      if (next) {
        setInternalPortal(next.key);
        onPortalChange?.(next.key);
      }
    }, 6500);

    return () => window.clearInterval(timer);
  }, [selectedKey, prefersReducedMotion, isPaused, onPortalChange]);

  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground">
      {/* LEFT SIDE (Desktop Interactive Healthcare Ecosystem Showcase) */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="hidden lg:flex lg:w-[52%] xl:w-1/2 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950 text-white p-8 xl:p-11 flex-col justify-between relative overflow-hidden border-r border-border/60"
      >
        {/* Ambient Animated Glow Highlights */}
        <m.div
          aria-hidden="true"
          className="absolute -top-16 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }
          }
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <m.div
          aria-hidden="true"
          className="absolute bottom-0 -left-12 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1.05, 0.96, 1.05], opacity: [0.4, 0.65, 0.4] }
          }
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Top Brand Bar */}
        <div className="relative z-10 flex items-center justify-between gap-4">
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

          <Badge variant="outline" className="border-teal-400/40 text-teal-300 bg-teal-950/50">
            ABDM Compatible
          </Badge>
        </div>

        {/* Middle Content: Heading + Interactive 4-Portal Ecosystem Showcase */}
        <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-5 space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-[2rem] font-extrabold text-white tracking-tight leading-tight">
              {title || 'Secure Healthcare Access for Every Citizen'}
            </h1>
            <p className="text-xs xl:text-sm text-slate-300 leading-relaxed">
              {subtitle ||
                'Connect with verified doctors, access longitudinal diagnostic records, and share electronic health summaries with explicit digital consent.'}
            </p>
          </div>

          {/* Role Switcher Pills */}
          <div
            role="tablist"
            aria-label="Healthcare portal ecosystem preview"
            className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md"
          >
            {PORTAL_SHOWCASE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = item.key === activeItem.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectPortal(item.key)}
                  className={`relative flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.tabLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Animated Active Portal Card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-4 shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              <m.div
                key={activeItem.key}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Curated Role Editorial Photo */}
                <div className="relative overflow-hidden rounded-xl border border-white/15">
                  <EditorialVisual
                    asset={activeItem.asset}
                    priority={activeItem.key === 'PATIENT'}
                    aspectClassName="aspect-[16/9]"
                    sizes="(max-width: 1280px) 460px, 520px"
                    className="rounded-xl border-0 shadow-none bg-slate-900"
                    imageClassName="transition-transform duration-700 hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"
                  />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md ${activeItem.accentClass}`}
                    >
                      <ActiveIcon className="h-3 w-3" aria-hidden="true" />
                      {activeItem.eyebrow}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-slate-200 backdrop-blur-md">
                      <QrCode className="h-3 w-3 text-teal-300" aria-hidden="true" />
                      ABHA Ready
                    </span>
                  </div>
                </div>

                {/* Role Title, Summary & Capabilities */}
                <div className="space-y-2.5 px-0.5">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {activeItem.title}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                      {activeItem.description}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-1">
                    {activeItem.highlights.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-xs text-slate-200 leading-snug"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </m.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {PORTAL_SHOWCASE_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    tabIndex={-1}
                    onClick={() => handleSelectPortal(item.key)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      item.key === activeItem.key
                        ? 'w-7 bg-teal-400'
                        : 'w-2 bg-white/25 hover:bg-white/45'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-slate-400">
                4 Connected Healthcare Portals + Admin
              </span>
            </div>
          </div>

          {/* Security Assurance Strip */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" aria-hidden="true" />
              <span>Two-Tier Authorization</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <Lock className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
              <span>Token Rotation Protection</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} HealthBridge India Platform</span>
          <span className="text-[11px] text-teal-400 font-medium">Digital India Initiative</span>
        </div>
      </div>

      {/* RIGHT SIDE (Form Viewport) */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-10 overflow-y-auto">
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
        <main id="main-content" className="w-full max-w-xl mx-auto my-auto py-4 space-y-5">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-9 shadow-card">
            {children}
          </div>

          {/* Compact Ecosystem Strip for Mobile/Tablet (visible below lg) */}
          <div className="lg:hidden rounded-2xl border border-border/80 bg-card/80 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">
              Explore HealthBridge Portals
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PORTAL_SHOWCASE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="rounded-xl border border-border/70 bg-muted/40 p-2.5 space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Bottom Legal / Architecture Note */}
        <div className="w-full max-w-xl mx-auto text-center pt-4 text-xs text-muted-foreground">
          <p>HealthBridge India • Secure Health Information Exchange Architecture</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
