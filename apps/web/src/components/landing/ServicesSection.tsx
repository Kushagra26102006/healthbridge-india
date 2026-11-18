'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CalendarCheck,
  Pill,
  FlaskConical,
  Store,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import type { EditorialAssetKey } from '@/lib/assets/image-manifest';
import { SlideIn, StaggerList, StaggerItem } from '@/components/motion';

interface ServiceItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  imageAsset: EditorialAssetKey;
  accentClass: string;
  points: string[];
}

export function ServicesSection() {
  const services: ServiceItem[] = [
    {
      id: 'records',
      title: 'Health Records',
      badge: 'Longitudinal EHR',
      description: 'Access, organize, and upload clinical history in a patient-controlled timeline.',
      href: '/patient/records',
      icon: <FileText className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'platformDigitalRecords',
      accentClass: 'bg-primary/10 text-primary',
      points: [
        'View structured clinical records and documents.',
        'Track historical consultations and summaries.',
        'Prepare ABHA-compatible record discovery.',
      ],
    },
    {
      id: 'appointments',
      title: 'Appointments',
      badge: 'Scheduling',
      description: 'Discover doctors, view available slots, and manage in-person or teleconsult visits.',
      href: '/patient/appointments',
      icon: <CalendarCheck className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'serviceAppointmentsBooking',
      accentClass: 'bg-secondary/10 text-secondary',
      points: [
        'Search verified clinicians by specialization.',
        'Book, reschedule, or cancel visits easily.',
        'Stay synced with live appointment updates.',
      ],
    },
    {
      id: 'prescriptions',
      title: 'Digital Prescriptions',
      badge: 'Digital Rx',
      description: 'Review electronic prescriptions with clear dosage, duration, and refill visibility.',
      href: '/patient/prescriptions',
      icon: <Pill className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'serviceDigitalPrescriptions',
      accentClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
      points: [
        'Structured medication dosages and instructions.',
        'Eliminate ambiguity from handwritten scripts.',
        'Direct verification pathway for pharmacies.',
      ],
    },
    {
      id: 'labs',
      title: 'Laboratory Reports',
      badge: 'Diagnostics',
      description: 'Receive diagnostic lab results with structured reference ranges and version history.',
      href: '/patient/lab-reports',
      icon: <FlaskConical className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'serviceLabReports',
      accentClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      points: [
        'Structured observations with abnormal flags.',
        'Review approved diagnostic PDFs securely.',
        'Share reports directly with treating doctors.',
      ],
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy Services',
      badge: 'Fulfillment',
      description: 'Connect prescriptions to pharmacy verification, order fulfillment, and pickup tracking.',
      href: '/patient/orders',
      icon: <Store className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'ecosystemPharmacyDispensing',
      accentClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      points: [
        'Verify digital prescriptions before dispensing.',
        'Track medication order status in real time.',
        'Maintain clear dispensation receipts.',
      ],
    },
    {
      id: 'consent',
      title: 'Consent Management',
      badge: 'Access Control',
      description: 'Review incoming provider access requests and manage active consent artefacts.',
      href: '/patient/consent',
      icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'serviceConsentControl',
      accentClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
      points: [
        'Approve or reject scoped data requests.',
        'Set clear expiration dates and purposes.',
        'Revoke active permissions at any time.',
      ],
    },
  ];

  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SlideIn inView className="max-w-3xl mx-auto text-center space-y-3 mb-12 md:mb-16">
          <Badge variant="teal" size="md">
            Healthcare Services
          </Badge>
          <h2 className="text-page-heading sm:text-4xl font-bold text-balance">
            Everything You Need for a Connected Health Journey
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Modular healthcare workflows engineered for patients, clinicians, pharmacies, and
            diagnostic laboratories with structured, interoperable data.
          </p>
        </SlideIn>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {services.map((service) => (
            <StaggerItem key={service.id} className="flex">
              <Card className="group flex flex-col justify-between w-full overflow-hidden hover-lift">
                <div className="px-4 pt-4">
                  <EditorialVisual
                    asset={service.imageAsset}
                    aspectClassName="aspect-[16/10]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                    className="rounded-lg border-border/60 shadow-none"
                  />
                </div>
                <CardHeader className="space-y-3.5 pb-4 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-md ${service.accentClass} flex items-center justify-center transition-transform duration-150 group-hover:scale-105`}
                    >
                      {service.icon}
                    </div>
                    <Badge variant="outline" size="sm">
                      {service.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {service.title}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 pb-4 flex-1">
                  {service.points.map((pt) => (
                    <div
                      key={pt}
                      className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                    >
                      <CheckCircle2
                        className="h-4 w-4 text-secondary shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="leading-snug text-foreground/85">{pt}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-3 border-t border-border/70">
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover transition-colors focus-ring rounded-sm"
                  >
                    <span>Learn More</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </CardFooter>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>

        <div className="mt-10 max-w-2xl mx-auto flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="text-foreground font-semibold">Capability Notice:</strong> Portal
            links require signing in with an authorized account role. Availability of external
            facility data depends on participating provider onboarding.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
