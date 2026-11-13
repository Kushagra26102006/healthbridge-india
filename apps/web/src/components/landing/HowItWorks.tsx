'use client';

import React from 'react';
import { UserPlus, Link2, Database, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function HowItWorks() {
  const steps = [
    {
      step: 'Step 01',
      title: 'Create Your Account',
      description: 'Register using the supported authentication flow.',
      detail:
        'Sign up as a Patient, Doctor, Pharmacy, or Laboratory using verified mobile credentials and secure passwords.',
      icon: <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      accentBg: 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400',
    },
    {
      step: 'Step 02',
      title: 'Connect Your Health Identity',
      description: 'Explore the platform’s ABHA integration pathway.',
      detail:
        'Prepare your digital health identifier to link with national health networks under Ayushman Bharat Digital Mission guidelines.',
      icon: <Link2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      accentBg: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
    },
    {
      step: 'Step 03',
      title: 'Access Your Records',
      description: 'View available health information and documents.',
      detail:
        'Consolidate clinical encounter summaries, diagnostic test reports, and electronic prescriptions in one organized view.',
      icon: <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      accentBg: 'bg-cyan-600/10 text-cyan-600 dark:bg-cyan-600/20 dark:text-cyan-400',
    },
    {
      step: 'Step 04',
      title: 'Share With Consent',
      description: 'Authorize access to your records when required.',
      detail:
        'Grant explicit, time-delimited access to healthcare providers. Monitor who views your records and revoke permissions whenever needed.',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      accentBg: 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/30 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide uppercase">
            Visual Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            A four-step structured flow designed to make accessing and sharing digital health
            information intuitive and secure.
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
                className="group relative flex flex-col justify-between border-border/90 bg-card/95 backdrop-blur-xs hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-muted-foreground/30 group-hover:text-primary transition-colors">
                      {step.step.replace('Step ', '')}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl ${step.accentBg} flex items-center justify-center border border-border/60 group-hover:scale-105 transition-transform`}
                    >
                      {step.icon}
                    </div>
                  </div>

                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold mb-2">
                      {step.step}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {step.title}
                    </CardTitle>
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1">
                      {step.description}
                    </p>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {step.detail}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Architecture Note */}
        <div className="mt-12 max-w-2xl mx-auto text-center p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Architecture Specification:</strong>{' '}
            HealthBridge India provides the digital framework for ABHA identity association and
            consent artifacts. Connectivity with live national ABDM endpoints is enabled as regional
            healthcare providers connect to the gateway.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
