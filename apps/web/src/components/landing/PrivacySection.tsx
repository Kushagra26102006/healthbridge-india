'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck2,
  Clock,
  EyeOff,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { SlideIn, StaggerList, StaggerItem } from '@/components/motion';

export function PrivacySection() {
  const principles = [
    {
      title: 'Explicit Consent',
      description:
        'Health information is shared only after explicit digital permission with clear purpose and data-category scope.',
      icon: <Lock className="h-4 w-4 text-secondary" aria-hidden="true" />,
    },
    {
      title: 'Role-Based Access',
      description:
        'Strict RBAC boundaries ensure every participant only accesses workflows and records authorized for their role.',
      icon: <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />,
    },
    {
      title: 'Secure Authentication',
      description:
        'HTTP-only refresh cookie rotation, CSRF protection, and active session management safeguard user accounts.',
      icon: <KeyRound className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />,
    },
    {
      title: 'Controlled Access Duration',
      description:
        'Every consent artefact enforces explicit expiration timestamps and immediate patient-initiated revocation.',
      icon: <Clock className="h-4 w-4 text-success" aria-hidden="true" />,
    },
    {
      title: 'Auditability',
      description:
        'Consent decisions, clinical access events, and privacy requests are recorded in tamper-conscious audit logs.',
      icon: <FileCheck2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />,
    },
    {
      title: 'Privacy-Conscious Design',
      description:
        'Application-level field encryption, private document storage, and zero client-side token persistence.',
      icon: <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
    },
  ];

  return (
    <section id="privacy" className="py-16 md:py-24 bg-muted/35 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center">
          {/* Left Column: Principles */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <SlideIn inView className="space-y-3">
              <Badge variant="teal" size="md">
                Privacy &amp; Security Architecture
              </Badge>
              <h2 className="text-page-heading sm:text-4xl font-bold leading-tight text-balance">
                Your Health Information.{' '}
                <span className="text-secondary">Your Permission.</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Engineered around patient data sovereignty — giving citizens clear transparency and
                fine-grained control over every record shared across the platform.
              </p>
            </SlideIn>

            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {principles.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="p-4 rounded-lg bg-card border border-border shadow-xs hover-lift h-full flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-md bg-muted/80 shrink-0">{item.icon}</div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          {/* Right Column: Layered Glass Security Console Preview */}
          <SlideIn inView delay={0.08} className="lg:col-span-5 relative">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent blur-2xl -z-10 pointer-events-none"
            />
            <div className="glass-panel rounded-xl p-5 sm:p-6 shadow-lg space-y-4">
              <EditorialVisual
                asset="privacyConsentShield"
                aspectClassName="aspect-[16/9]"
                sizes="(max-width: 1024px) 100vw, 440px"
                className="rounded-lg border-border/70 shadow-xs"
              />
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-md bg-secondary/15 text-secondary shrink-0">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      Consent Governance Console
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      Policy &amp; Access Audit Preview
                    </p>
                  </div>
                </div>
                <Badge variant="outline" size="sm">
                  Sample View
                </Badge>
              </div>

              <div className="p-3.5 rounded-md bg-surface border border-border space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">Consent Artefact #SAMPLE-01</span>
                  <Badge variant="success" size="sm" dot>
                    Authorized
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grantee: Sample Clinician • Cardiology Review
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/70">
                  <span>Scope: Diagnostic &amp; Rx</span>
                  <span className="text-secondary font-medium">Expires in 7 Days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-surface border border-border space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">Role Boundary Guard</span>
                  <span className="font-mono text-[11px] font-semibold text-primary">
                    RBAC Enforced
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cross-role and unconsented clinical queries are rejected at the API authorization
                  boundary before data resolution.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Illustrative Audit Trail
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/60">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" aria-hidden="true" />
                      <span>Consent Granted</span>
                    </span>
                    <span>Sample Event</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/60">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                      <span>Scoped Record Viewed</span>
                    </span>
                    <span>Audit Logged</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Technical privacy controls support institutional governance; legal compliance
                depends on deployment configuration and qualified legal review.
              </p>
            </div>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}

export default PrivacySection;
