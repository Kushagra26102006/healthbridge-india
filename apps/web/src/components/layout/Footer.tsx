'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InfoModalType } from './InfoModal';

export interface FooterProps {
  onOpenInfo?: (type: NonNullable<InfoModalType>) => void;
}

export function Footer({ onOpenInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'Health Records', href: '#services' },
    { label: 'Appointments', href: '#services' },
    { label: 'Prescriptions', href: '#services' },
  ];

  const userLinks = [
    { label: 'Patients', href: '#ecosystem' },
    { label: 'Doctors', href: '#ecosystem' },
    { label: 'Pharmacies', href: '#ecosystem' },
    { label: 'Laboratories', href: '#ecosystem' },
  ];

  const resourceLinks = [
    { label: 'About ABHA', href: '#abha' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Help Center', href: '#overview' },
  ];

  const legalLinks: { label: string; type: NonNullable<InfoModalType> }[] = [
    { label: 'Privacy Policy', type: 'PRIVACY' },
    { label: 'Terms of Service', type: 'TERMS' },
    { label: 'Consent Information', type: 'CONSENT' },
  ];

  return (
    <footer className="bg-card text-card-foreground border-t border-border">
      {/* Top Banner: ABDM Compliance Context */}
      <div className="border-b border-border/80 bg-muted/40 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600/15 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Designed in alignment with{' '}
              <strong className="text-foreground">Ayushman Bharat Digital Mission (ABDM)</strong>{' '}
              architecture and national data governance standards.
            </p>
          </div>
          <Badge variant="abha" className="text-[11px] shrink-0">
            One Nation • One Health Record
          </Badge>
        </div>
      </div>

      {/* Main Footer Navigation Columns */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Info & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-teal-600 to-cyan-500 text-white shadow-sm">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2v20M2 12h20" stroke="white" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                Health<span className="text-teal-600 dark:text-teal-400">Bridge</span> India
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              HealthBridge India is a digital healthcare platform designed to connect patients,
              doctors, pharmacies, and diagnostic centers through secure, consent-based health
              information exchange.
            </p>

            <p className="text-[11px] text-muted-foreground italic">
              Independent digital health platform. Built to support national health
              interoperability.
            </p>
          </div>

          {/* 1. Platform Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {platformLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. For Users Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">For Users</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {userLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Resources Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Resources</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {resourceLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Legal Links (Modal Triggers) */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Legal</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {legalLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => onOpenInfo?.(link.type)}
                    className="text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline text-xs sm:text-sm text-muted-foreground"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Mission Attribution */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} HealthBridge India Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for{' '}
            <span className="font-semibold text-foreground">Digital Healthcare in India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
