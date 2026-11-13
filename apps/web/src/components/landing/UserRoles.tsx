'use client';

import React from 'react';
import { User, Stethoscope, Pill, FlaskConical, ArrowRight, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface UserRolesProps {
  onSelectRole?: (role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY') => void;
}

export function UserRoles({ onSelectRole }: UserRolesProps) {
  const roles = [
    {
      id: 'PATIENT' as const,
      role: 'Patients',
      target: 'patients',
      badge: 'Individual & Family',
      icon: <User className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      accentBg: 'bg-teal-500/10 dark:bg-teal-500/20',
      description:
        'Manage your longitudinal health record, connect your 14-digit ABHA address, access diagnostic reports from any hospital, and grant consent to doctors.',
      features: [
        'Unified personal health locker',
        'Time-bound doctor consent control',
        'Family health account linkage',
      ],
      ctaText: 'Explore Patient Portal',
      btnVariant: 'teal' as const,
    },
    {
      id: 'DOCTOR' as const,
      role: 'Doctors',
      target: 'doctors',
      badge: 'Clinicians & Specialists',
      icon: <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      accentBg: 'bg-blue-600/10 dark:bg-blue-600/20',
      description:
        'Access longitudinal medical histories with patient consent, create digital e-prescriptions, track patient encounters, and make faster diagnostic decisions.',
      features: [
        'Longitudinal EHR access via consent',
        'Standardized e-prescriptions',
        'NMC registry verification ready',
      ],
      ctaText: 'Doctor Onboarding',
      btnVariant: 'default' as const,
    },
    {
      id: 'PHARMACY' as const,
      role: 'Pharmacies',
      target: 'providers',
      badge: 'Dispensaries & Retailers',
      icon: <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      accentBg: 'bg-emerald-600/10 dark:bg-emerald-600/20',
      description:
        'Digitally verify authentic doctor prescriptions, eliminate handwritten dispensing errors, and maintain real-time order fulfillment histories.',
      features: [
        'Tamper-proof digital prescription verification',
        'Dispensation tracking & fulfillment',
        'Drug license & GSTIN compliance',
      ],
      ctaText: 'Pharmacy Network',
      btnVariant: 'outline' as const,
    },
    {
      id: 'LABORATORY' as const,
      role: 'Diagnostic Laboratories',
      target: 'providers',
      badge: 'NABL & Diagnostic Centers',
      icon: <FlaskConical className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      accentBg: 'bg-cyan-600/10 dark:bg-cyan-600/20',
      description:
        'Publish NABL-accredited pathology and radiology test results directly to patient health lockers with cryptographically verifiable diagnostic reports.',
      features: [
        'Automated digital report delivery',
        'Structured observation data & ranges',
        'Instant patient & doctor notification',
      ],
      ctaText: 'Laboratory Registration',
      btnVariant: 'outline' as const,
    },
  ];

  return (
    <section id="patients" className="py-16 md:py-24 bg-muted/30 border-t border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase">
            Stakeholder Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            A Unified Platform Tailored for Every Healthcare Stakeholder
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Whether you are managing your personal health or delivering clinical care, HealthBridge
            provides dedicated workflows tailored to your specific role.
          </p>
        </div>

        {/* 4 User Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item) => (
            <div key={item.id} id={item.target === 'doctors' ? 'doctors' : undefined}>
              <Card className="h-full flex flex-col justify-between border-border/90 bg-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl ${item.accentBg} flex items-center justify-center`}
                    >
                      {item.icon}
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {item.badge}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">{item.role}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                      {item.description}
                    </CardDescription>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/50">
                    {item.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-foreground/80">
                        <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardHeader>

                <CardFooter className="pt-2">
                  <Button
                    variant={item.btnVariant}
                    className="w-full text-xs sm:text-sm font-semibold justify-between group"
                    onClick={() => onSelectRole?.(item.id)}
                  >
                    <span>{item.ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UserRoles;
