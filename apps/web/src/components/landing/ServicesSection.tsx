'use client';

import React from 'react';
import {
  FileText,
  CalendarCheck,
  Pill,
  FlaskConical,
  Store,
  ShieldAlert,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ServiceItem {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  accentClass: string;
  points: string[];
}

export function ServicesSection() {
  const services: ServiceItem[] = [
    {
      id: 'records',
      title: 'Health Records',
      badge: 'Longitudinal EHR',
      icon: <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      accentClass: 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400',
      points: [
        'View available medical records.',
        'Organize health documents.',
        'Access medical history.',
      ],
    },
    {
      id: 'appointments',
      title: 'Appointments',
      badge: 'Scheduling',
      icon: <CalendarCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      accentClass: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
      points: [
        'Explore appointment management.',
        'View appointment information.',
        'Manage upcoming visits.',
      ],
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      badge: 'Digital Rx',
      icon: <Pill className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      accentClass: 'bg-cyan-600/10 text-cyan-600 dark:bg-cyan-600/20 dark:text-cyan-400',
      points: [
        'Access available prescriptions.',
        'Review medication instructions.',
        'Maintain prescription history.',
      ],
    },
    {
      id: 'labs',
      title: 'Laboratory Reports',
      badge: 'Diagnostics',
      icon: <FlaskConical className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      accentClass:
        'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400',
      points: [
        'View available diagnostic reports.',
        'Organize test information.',
        'Access report history.',
      ],
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy Services',
      badge: 'Dispensation',
      icon: <Store className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      accentClass: 'bg-amber-600/10 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400',
      points: [
        'Explore connected pharmacy services.',
        'Review medication-related information.',
        'Track dispensation status.',
      ],
    },
    {
      id: 'consent',
      title: 'Consent Management',
      badge: 'Access Control',
      icon: <ShieldAlert className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      accentClass: 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400',
      points: [
        'Review access requests.',
        'Grant or revoke permissions.',
        'Understand information-sharing activity.',
      ],
    },
  ];

  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide uppercase">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything You Need for a Connected Health Journey
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Modular healthcare workflows engineered to support patients, clinicians, and health
            facilities with structured, interoperable data.
          </p>
        </div>

        {/* 6 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group flex flex-col justify-between border-border/90 bg-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200"
            >
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${service.accentClass} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}
                  >
                    {service.icon}
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {service.badge}
                  </Badge>
                </div>

                <div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-0">
                {service.points.map((pt, pIdx) => (
                  <div
                    key={pIdx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-tight text-foreground/80">{pt}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Operational Context Banner */}
        <div className="mt-10 max-w-2xl mx-auto flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border/80 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground font-semibold">Product Capability Notice:</strong>{' '}
            These sections represent supported digital health modules and interface capabilities.
            Live availability for individual healthcare facilities depends on participating provider
            onboarding and regional network rollout.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
