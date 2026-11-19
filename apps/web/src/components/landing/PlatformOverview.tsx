'use client';

import React from 'react';
import { HeartPulse, Network, ShieldCheck, Smartphone, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { SlideIn, StaggerList, StaggerItem } from '@/components/motion';

interface FeatureCardData {
  title: string;
  badge: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
  accentClass: string;
}

export function PlatformOverview() {
  const features: FeatureCardData[] = [
    {
      title: 'Patient-Centered Records',
      badge: 'Unified Locker',
      description: 'A single timeline for available health records.',
      detail:
        'Organize consultation summaries, laboratory reports, and digital prescriptions inside one structured personal health interface.',
      icon: <HeartPulse className="h-5 w-5" aria-hidden="true" />,
      accentClass: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Connected Healthcare',
      badge: 'Interoperability',
      description: 'Bridging patients and participating care providers.',
      detail:
        'Connect clinics, clinicians, pharmacies, and diagnostic laboratories on shared clinical workflows and FHIR-aligned schemas.',
      icon: <Network className="h-5 w-5" aria-hidden="true" />,
      accentClass: 'bg-primary/10 text-primary',
    },
    {
      title: 'Consent-Based Sharing',
      badge: 'Access Control',
      description: 'Explicit permission before records are shared.',
      detail:
        'Authorize who can view specific medical categories, for what purpose, and for what duration — with instant revocation.',
      icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
      accentClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
    {
      title: 'Digital Accessibility',
      badge: 'Multi-Device',
      description: 'Engineered for clarity on every screen size.',
      detail:
        'WCAG-conscious contrast, keyboard accessibility, and responsive layouts built for smartphones, tablets, and clinical workstations.',
      icon: <Smartphone className="h-5 w-5" aria-hidden="true" />,
      accentClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    },
  ];

  return (
    <section id="overview" className="py-16 md:py-24 bg-muted/35 border-b border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SlideIn inView className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center mb-12 md:mb-16">
          <div className="lg:col-span-6 space-y-3 text-left">
            <Badge variant="info" size="md">
              Platform Overview
            </Badge>
            <h2 className="text-page-heading sm:text-4xl font-bold text-balance">
              One Connected Healthcare Experience
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Bring your healthcare journey together with a platform designed to make medical
              information easier to access, manage, and share securely across participating care
              providers.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="relative group overflow-hidden rounded-xl">
              <EditorialVisual
                asset="authPortalClinic"
                aspectClassName="aspect-[16/9]"
                sizes="(max-width: 1024px) 100vw, 560px"
                caption="Modern connected healthcare infrastructure designed for citizens and care teams"
                imageClassName="transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Floating Verified Facility Network Badge */}
              <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md border border-border/80 shadow-md text-xs font-semibold text-foreground transition-all duration-300 group-hover:scale-105">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Verified Facility Network (HFR Linked)</span>
              </div>
            </div>
          </div>
        </SlideIn>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((feature) => (
            <StaggerItem key={feature.title} className="flex">
              <Card className="group flex flex-col justify-between w-full hover-lift transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <CardHeader className="space-y-4 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.accentClass} flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md shadow-xs border border-border/40`}
                    >
                      <span className="transition-transform duration-300 group-hover:scale-110">
                        {feature.icon}
                      </span>
                    </div>
                    <Badge variant="outline" size="sm" className="transition-colors group-hover:border-primary/40">
                      {feature.badge}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <p className="text-xs font-semibold text-secondary mt-1">
                      {feature.description}
                    </p>
                  </div>

                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    {feature.detail}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-3.5 border-t border-border/70">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
                    <span>Integrated workflow support</span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

export default PlatformOverview;
