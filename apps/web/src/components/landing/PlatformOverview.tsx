'use client';

import React from 'react';
import { HeartPulse, Network, ShieldCheck, Smartphone, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      description: 'A unified place to access available health information.',
      detail:
        'Bring together discharge summaries, consultation notes, and historical health records into one secure personal interface.',
      icon: <HeartPulse className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      accentClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Connected Healthcare',
      badge: 'Interoperability',
      description:
        'A digital experience connecting patients and participating healthcare providers.',
      detail:
        'Bridge the communication gap between clinics, hospitals, diagnostic centers, and local pharmacies seamlessly.',
      icon: <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      accentClass: 'bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Consent-Based Sharing',
      badge: 'Zero-Trust Security',
      description: 'Users can authorize the sharing of their health information.',
      detail:
        'You decide who can see your medical history, for what purpose, and for how long. Revoke permissions at any time.',
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      accentClass:
        'bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Digital Accessibility',
      badge: 'Multi-Device',
      description: 'Access supported health information through a modern digital interface.',
      detail:
        'Engineered for all modern devices—smartphones, tablets, and desktop computers—with full responsive accessibility.',
      icon: <Smartphone className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      accentClass: 'bg-cyan-600/10 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    <section id="overview" className="py-16 md:py-24 bg-muted/40 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            Platform Overview
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            One Connected Healthcare Experience
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Bring your healthcare journey together with a platform designed to make health
            information easier to access, manage and share securely.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="group flex flex-col justify-between border-border/90 bg-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200"
            >
              <CardHeader className="space-y-4 pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${feature.accentClass} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}
                  >
                    {feature.icon}
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {feature.badge}
                  </Badge>
                </div>

                <div>
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1">
                    {feature.description}
                  </p>
                </div>

                <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {feature.detail}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Integrated workflow support</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlatformOverview;
