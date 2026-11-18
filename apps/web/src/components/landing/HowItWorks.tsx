'use client';

import React from 'react';
import { m } from 'framer-motion';
import { UserPlus, Link2, Database, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { SlideIn, StaggerList, StaggerItem } from '@/components/motion';
import { MOTION_EASE, MOTION_VIEWPORT } from '@/lib/motion/tokens';

export function HowItWorks() {
  const steps = [
    {
      step: 'Step 01',
      num: '01',
      title: 'Create Your Account',
      description: 'Register using the verified role onboarding flow.',
      detail:
        'Sign up as a Patient, Doctor, Pharmacy, or Diagnostic Laboratory with secure credentials and multi-channel verification.',
      icon: <UserPlus className="h-5 w-5" aria-hidden="true" />,
      accentBg: 'bg-primary/10 text-primary',
    },
    {
      step: 'Step 02',
      num: '02',
      title: 'Connect Your Health Identity',
      description: 'Link your ABHA-compatible digital health identifier.',
      detail:
        'Associate your health address under Ayushman Bharat Digital Mission (ABDM) aligned standards to prepare for connected record discovery.',
      icon: <Link2 className="h-5 w-5" aria-hidden="true" />,
      accentBg: 'bg-secondary/10 text-secondary',
    },
    {
      step: 'Step 03',
      num: '03',
      title: 'Access Your Records',
      description: 'Review longitudinal health records in one timeline.',
      detail:
        'View clinical encounter summaries, digital prescriptions, and structured laboratory diagnostic reports from participating facilities.',
      icon: <Database className="h-5 w-5" aria-hidden="true" />,
      accentBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    },
    {
      step: 'Step 04',
      num: '04',
      title: 'Share With Consent',
      description: 'Authorize time-limited provider access on your terms.',
      detail:
        'Approve explicit consent artefacts with clear scopes and expiry dates. Audit every access event and revoke permissions anytime.',
      icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
      accentBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/35 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SlideIn inView className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center mb-12 md:mb-16">
          <div className="lg:col-span-6 space-y-3 text-left">
            <Badge variant="teal" size="md">
              How It Works
            </Badge>
            <h2 className="text-page-heading sm:text-4xl font-bold text-balance">
              Four Simple Steps to Connected Care
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              A structured, patient-first workflow designed to make accessing and sharing health
              information clear, auditable, and effortless.
            </p>
          </div>
          <div className="lg:col-span-6">
            <EditorialVisual
              asset="howItWorksTelehealth"
              aspectClassName="aspect-[16/9]"
              sizes="(max-width: 1024px) 100vw, 560px"
              caption="Structured clinical workflows connecting patients and clinicians seamlessly"
            />
          </div>
        </SlideIn>

        {/* Connected Timeline */}
        <div className="relative">
          {/* Animated Desktop Progress Line */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-11 left-[12%] right-[12%] h-0.5 bg-border z-0 overflow-hidden rounded-pill"
          >
            <m.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={MOTION_VIEWPORT}
              transition={{ duration: 0.7, ease: MOTION_EASE.standard }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full bg-gradient-to-r from-brand-blue via-brand-teal to-brand-cyan"
            />
          </div>

          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative z-10">
            {steps.map((step) => (
              <StaggerItem key={step.step} className="flex">
                <Card className="group flex flex-col justify-between w-full hover-lift">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-11 h-11 rounded-md ${step.accentBg} flex items-center justify-center border border-border/60 transition-transform duration-150 group-hover:scale-105`}
                      >
                        {step.icon}
                      </div>
                      <span className="font-mono text-2xl font-bold text-muted-foreground/35 group-hover:text-primary transition-colors tabular-nums">
                        {step.num}
                      </span>
                    </div>

                    <div>
                      <Badge variant="outline" size="sm" className="uppercase mb-2">
                        {step.step}
                      </Badge>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <p className="text-xs font-semibold text-secondary mt-1">
                        {step.description}
                      </p>
                    </div>

                    <CardDescription className="text-xs sm:text-sm leading-relaxed pt-1">
                      {step.detail}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>

        {/* Architecture Transparency Note */}
        <div className="mt-10 max-w-2xl mx-auto text-center p-4 rounded-lg bg-card border border-border shadow-xs">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Architecture Specification:</strong>{' '}
            HealthBridge India implements ABHA-compatible identity association and consent artefact
            workflows. Live national ABDM gateway exchange requires participating facility onboarding
            and production NHA credentials.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
