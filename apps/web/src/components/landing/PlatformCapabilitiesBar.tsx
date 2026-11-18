'use client';

import React from 'react';
import { FolderHeart, ShieldCheck, Users, Smartphone } from 'lucide-react';
import { StaggerList, StaggerItem } from '@/components/motion';

/**
 * Verified Platform Capability Highlights (zero invented metrics or fabricated user counts).
 */
export function PlatformCapabilitiesBar() {
  const highlights = [
    {
      metric: '5 Role Portals',
      title: 'Multi-Role Healthcare',
      description: 'Dedicated workspaces for Patients, Doctors, Pharmacies, Labs, and Admins.',
      icon: <Users className="h-5 w-5 text-primary" aria-hidden="true" />,
    },
    {
      metric: 'Unified EHR',
      title: 'Unified Health Records',
      description: 'Structured clinical encounters, digital prescriptions, and lab diagnostics.',
      icon: <FolderHeart className="h-5 w-5 text-secondary" aria-hidden="true" />,
    },
    {
      metric: 'Zero-Trust',
      title: 'Consent-Based Access',
      description: 'Time-delimited, purpose-bound consent artefacts revocable at any time.',
      icon: <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />,
    },
    {
      metric: 'All Devices',
      title: 'Responsive Access',
      description: 'Accessible Light & Dark clinical experience across desktop, tablet, and mobile.',
      icon: <Smartphone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />,
    },
  ];

  return (
    <section
      aria-label="Platform capabilities"
      className="py-10 sm:py-12 border-y border-border bg-surface/70"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {highlights.map((item) => (
            <StaggerItem key={item.title}>
              <div className="rounded-lg border border-border bg-card p-5 shadow-xs hover-lift h-full flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {item.metric}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/80">
                    {item.icon}
                  </div>
                </div>
                <h2 className="text-card-heading">{item.title}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

export default PlatformCapabilitiesBar;
