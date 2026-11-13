'use client';

import React from 'react';
import { ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Footer() {
  const productLinks = [
    { label: 'For Patients', href: '#patients' },
    { label: 'For Doctors', href: '#doctors' },
    { label: 'Healthcare Facilities', href: '#providers' },
    { label: 'ABHA Linkage', href: '#how-it-works' },
    { label: 'Consent Manager', href: '#principles' },
  ];

  const resourceLinks = [
    { label: 'Architecture Overview', href: '#top' },
    { label: 'ABDM Guidelines', href: 'https://abdm.gov.in', external: true },
    { label: 'Developer API Specs', href: '/api/v1/health' },
    { label: 'Security & Compliance', href: '#about' },
    { label: 'Support & Help Desk', href: '#contact' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '#privacy-policy' },
    { label: 'Terms of Service', href: '#terms-of-service' },
    { label: 'ABDM Consent Rules', href: '#consent-rules' },
    { label: 'DISHA Compliance', href: '#disha' },
  ];

  return (
    <footer id="about" className="bg-card text-card-foreground border-t border-border">
      {/* Top Footer Banner: National Healthcare Commitment */}
      <div className="border-b border-border/80 bg-muted/40 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600/15 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built in accordance with{' '}
              <strong className="text-foreground">Ayushman Bharat Digital Mission (ABDM)</strong>{' '}
              standards and DISHA privacy regulations.
            </p>
          </div>
          <Badge variant="abha" className="text-[11px] shrink-0">
            One Nation • One Health Record
          </Badge>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
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
              HealthBridge India is a national digital health platform designed to unify patient
              records, clinical consultations, e-prescriptions, and diagnostic investigations
              through explicit patient consent and ABHA architecture.
            </p>

            <div className="pt-2 text-xs text-muted-foreground space-y-1" id="contact">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>National Helpline: 1800-XXX-XXXX (Placeholder)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Support Desk: support@healthbridge.india.placeholder</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {productLinks.map((link, idx) => (
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

          {/* Resources */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Resources</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {resourceLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policy */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Compliance</p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {legalLinks.map((link, idx) => (
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
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 HealthBridge India Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for <span className="font-semibold text-foreground">Digital India</span>{' '}
            under ABDM
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
