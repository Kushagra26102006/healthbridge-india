'use client';

import React from 'react';
import Link from 'next/link';
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
    { label: 'Services', href: '#services' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'About ABHA', href: '#abha' },
  ];

  const patientLinks = [
    { label: 'Patient Portal', href: '/patient/dashboard' },
    { label: 'Health Records', href: '/patient/records' },
    { label: 'Appointments', href: '/patient/appointments' },
    { label: 'Consent Management', href: '/patient/consent' },
  ];

  const doctorLinks = [
    { label: 'Doctor Portal', href: '/doctor/dashboard' },
    { label: 'Clinical Encounters', href: '/doctor/encounters' },
    { label: 'Digital Prescriptions', href: '/doctor/prescriptions' },
    { label: 'Schedule Management', href: '/doctor/schedule' },
  ];

  const partnerLinks = [
    { label: 'Pharmacy Portal', href: '/pharmacy/dashboard' },
    { label: 'Laboratory Portal', href: '/laboratory/dashboard' },
    { label: 'Ecosystem Overview', href: '#ecosystem' },
    { label: 'Privacy & Security', href: '#privacy' },
  ];

  const legalLinks: { label: string; type: NonNullable<InfoModalType> }[] = [
    { label: 'Privacy Summary', type: 'PRIVACY' },
    { label: 'Terms of Service', type: 'TERMS' },
    { label: 'Consent Information', type: 'CONSENT' },
  ];

  return (
    <footer className="bg-card text-card-foreground border-t border-border">
      {/* Top Banner */}
      <div className="border-b border-border/80 bg-muted/40 py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary/15 text-secondary shrink-0">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Designed in alignment with{' '}
              <strong className="text-foreground">Ayushman Bharat Digital Mission (ABDM)</strong>{' '}
              architecture and consent-based health data governance principles.
            </p>
          </div>
          <Badge variant="abha" size="sm" className="shrink-0">
            One Nation • One Health Record
          </Badge>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="sm:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gradient-to-br from-brand-blue via-brand-teal to-brand-cyan text-white shadow-sm">
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
                  <path d="M12 3v18M3 12h18" stroke="white" strokeWidth="2.4" />
                  <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                Health<span className="text-secondary">Bridge</span> India
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              HealthBridge India is a digital healthcare platform connecting patients, doctors,
              pharmacies, and diagnostic laboratories through secure, consent-based health
              information exchange.
            </p>

            <p className="text-xs text-muted-foreground italic leading-relaxed max-w-sm">
              Disclaimer: Independent healthcare technology platform designed to support national
              digital health interoperability. Not an official government agency.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors focus-ring rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Patient Resources */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Patients</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {patientLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors focus-ring rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Doctor & Partner Resources */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Clinicians &amp; Partners
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {doctorLinks.slice(0, 2).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors focus-ring rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {partnerLinks.slice(0, 2).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors focus-ring rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Legal</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-primary transition-colors focus-ring rounded-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              {legalLinks.map((link) => (
                <li key={link.type}>
                  <button
                    type="button"
                    onClick={() => onOpenInfo?.(link.type)}
                    className="text-left hover:text-primary transition-colors focus-ring rounded-sm text-xs sm:text-sm text-muted-foreground"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} HealthBridge India Platform. All rights reserved.</p>
          <p>
            Engineered for{' '}
            <span className="font-semibold text-foreground">Digital Healthcare in India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
