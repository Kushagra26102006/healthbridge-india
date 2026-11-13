'use client';

import React from 'react';
import { UserCheck, ShieldAlert, Network, Smartphone, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TrustSection() {
  const principles = [
    {
      icon: <UserCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      accentBg: 'bg-teal-500/10 dark:bg-teal-500/20',
      badge: 'Ownership',
      title: 'Patient-Controlled Health Records',
      description:
        'Your medical data belongs entirely to you. Access, organize, and manage your lifelong diagnostic history, discharge summaries, and prescriptions across all healthcare visits in one unified personal health locker.',
      benefit: 'No fragmented paper files across hospitals',
    },
    {
      icon: <ShieldAlert className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      accentBg: 'bg-blue-600/10 dark:bg-blue-600/20',
      badge: 'Privacy By Design',
      title: 'Secure Consent-Based Sharing',
      description:
        'No provider can view your health records without your explicit, time-delimited digital authorization. Approve, modify, or revoke doctor access anytime with full audit transparency under DISHA regulations.',
      benefit: 'Granular, time-bound consent artifacts',
    },
    {
      icon: <Network className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      accentBg: 'bg-cyan-600/10 dark:bg-cyan-600/20',
      badge: 'Interoperability',
      title: 'Connected Healthcare Providers',
      description:
        'Seamlessly bridges government hospitals, private specialty clinics, NABL diagnostic laboratories, and neighborhood pharmacies under the Ayushman Bharat Digital Mission (ABDM) standards.',
      benefit: 'Unified national health network',
    },
    {
      icon: <Smartphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      accentBg: 'bg-indigo-600/10 dark:bg-indigo-600/20',
      badge: 'Accessibility',
      title: 'Accessible Digital Health Information',
      description:
        'Retrieve encrypted clinical test results, digital prescriptions, and immunization schedules instantly from your smartphone, tablet, or computer with zero paper hassle anywhere across India.',
      benefit: 'Real-time multi-device synchronization',
    },
  ];

  return (
    <section id="principles" className="py-16 md:py-24 bg-muted/40 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            Platform Pillars
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Built on Trust, Privacy, and Universal Access
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Designed to protect patient rights and streamline clinical care through an
            interoperable, zero-trust digital health architecture.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((item, index) => (
            <Card
              key={index}
              className="group hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200 border-border/90 bg-card flex flex-col justify-between"
            >
              <CardHeader className="space-y-4 pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.accentBg} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}
                  >
                    {item.icon}
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {item.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{item.benefit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
