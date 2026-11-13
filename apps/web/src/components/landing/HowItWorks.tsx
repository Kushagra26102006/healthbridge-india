'use client';

import React from 'react';
import { UserPlus, Link2, Database, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      title: 'Create Your Account',
      subtitle: 'Fast, Verified Registration',
      description:
        'Register your account with your verified Indian mobile number and secure credentials. Select your role as a Patient, Healthcare Professional, or Facility.',
      tag: 'Step 1: Identity',
    },
    {
      number: '02',
      icon: <Link2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'Connect Health Identity',
      subtitle: 'ABHA Linkage Framework',
      description:
        'Link your 14-digit Ayushman Bharat Health Account (ABHA) address or prepare your profile for official ABDM sandbox gateway verification.',
      tag: 'Step 2: ABHA Ready',
    },
    {
      number: '03',
      icon: <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      title: 'Access Available Records',
      subtitle: 'Encrypted Digital Repository',
      description:
        'Consolidate clinical encounters, diagnostic lab reports, and doctor prescriptions from participating hospitals into one longitudinal health locker.',
      tag: 'Step 3: Ingestion',
    },
    {
      number: '04',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      title: 'Share With Explicit Consent',
      subtitle: 'Time-Bound Permissions',
      description:
        'Approve specific doctor consultation requests with granular parameters. Set expiration windows and revoke clinical record access whenever you choose.',
      tag: 'Step 4: Governance',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide uppercase">
            Seamless Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How HealthBridge India Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            A 4-step streamlined experience engineered to connect Indian citizens and healthcare
            providers with zero paper friction.
          </p>
        </div>

        {/* 4 Steps Timeline / Card Grid */}
        <div className="relative">
          {/* Subtle connecting line across desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600/30 via-teal-500/30 to-emerald-500/30 -translate-y-8 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, idx) => (
              <Card
                key={idx}
                className="group relative border-border/90 bg-card/90 backdrop-blur-xs hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-extrabold text-muted-foreground/30 group-hover:text-primary transition-colors">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-accent/80 flex items-center justify-center border border-border group-hover:scale-105 transition-transform">
                      {step.icon}
                    </div>
                  </div>

                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold mb-2">
                      {step.tag}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {step.title}
                    </CardTitle>
                    <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>

                  <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Architecture Note Disclaimer */}
        <div className="mt-12 max-w-2xl mx-auto text-center p-4 rounded-2xl bg-muted/50 border border-border/80">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Architectural Context:</strong>{' '}
            HealthBridge India provides an ABDM Milestone 1–3 compliant architecture designed for
            seamless integration with the National Health Authority (NHA) gateway endpoints.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
