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
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PrivacySection() {
  const principles = [
    {
      title: 'Explicit Consent Before Sharing',
      description:
        'Health information is only shared after you grant explicit digital permission. You control the recipient and scope.',
      icon: <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
    },
    {
      title: 'Role-Based Access Architecture',
      description:
        'Healthcare participants can only access interfaces and data categories relevant to their verified role.',
      icon: <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: 'Secure Authentication',
      description:
        'Multi-factor validation pathways and dual-token session handling protect user access from unauthorized login attempts.',
      icon: <KeyRound className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
    },
    {
      title: 'Controlled Access Duration',
      description:
        'Consent requests include defined expiration windows so access is naturally time-delimited and easily revocable.',
      icon: <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      title: 'Auditability of Platform Activity',
      description:
        'Relevant access requests and sharing events are recorded to maintain transparency over who accessed your records.',
      icon: <FileCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      title: 'Privacy-Conscious Design',
      description:
        'Zero plaintext credential storage and defense-in-depth sanitization prevent unauthorized enumeration of patient data.',
      icon: <EyeOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
  ];

  return (
    <section id="privacy" className="py-16 md:py-24 bg-muted/40 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Principles & Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide uppercase">
              Privacy & Governance
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Your Health Information.{' '}
              <span className="text-teal-600 dark:text-teal-400">Your Permission.</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
              Privacy and data protection are fundamental to our architecture. The platform is
              engineered around the principle that patients must have clear visibility and sovereign
              control over their digital healthcare records.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {principles.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-card border border-border/80 shadow-subtle flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-accent/80 text-foreground">
                        {item.icon}
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dashboard-Style Security Visual */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Consent Governance Console
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Active Access Policy Summary
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Sample View
                </Badge>
              </div>

              {/* Security Check 1: Explicit Consent Status */}
              <div className="p-3.5 rounded-xl bg-accent/40 border border-border/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Consent Artifact #CA-8821</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Authorized
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grantee: Dr. Priya Sharma (Cardiology Consultation)
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>Scope: Diagnostic & Rx Records</span>
                  <span className="text-teal-600 dark:text-teal-400 font-medium">
                    Valid for 7 Days
                  </span>
                </div>
              </div>

              {/* Security Check 2: Role Access Barrier */}
              <div className="p-3.5 rounded-xl bg-accent/40 border border-border/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Role Boundary Enforcement</span>
                  <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                    RBAC Layer 1
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unverified roles and cross-tenant queries are blocked before data resolution.
                </p>
              </div>

              {/* Security Check 3: Audit Trail Log */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Access Activity Log
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60">
                    <span className="text-foreground">Record Access Approved</span>
                    <span className="text-[11px]">Today, 10:14 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60">
                    <span className="text-foreground">Consent Requested</span>
                    <span className="text-[11px]">Today, 10:12 AM</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                All records accessed require active unexpired authorization from the account holder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PrivacySection;
