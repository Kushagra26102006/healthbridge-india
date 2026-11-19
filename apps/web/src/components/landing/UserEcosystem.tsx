'use client';

import React from 'react';
import { User, Stethoscope, Pill, FlaskConical, ArrowRight, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import type { EditorialAssetKey } from '@/lib/assets/image-manifest';
import { SlideIn, StaggerList, StaggerItem } from '@/components/motion';

export interface UserEcosystemProps {
  onSelectRole?: (role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY') => void;
}

interface RoleCardData {
  id: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY';
  title: string;
  badge: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  imageAsset: EditorialAssetKey;
  accentBg: string;
  surfaceTint: string;
  ctaText: string;
  btnVariant: 'primary' | 'secondary' | 'outline';
}

export function UserEcosystem({ onSelectRole }: UserEcosystemProps) {
  const roles: RoleCardData[] = [
    {
      id: 'PATIENT',
      title: 'Patients',
      badge: 'Citizens & Families',
      description: 'Manage personal health records, appointments, and consent permissions.',
      benefits: [
        'Unified personal medical record timeline.',
        'Grant or revoke provider consent anytime.',
        'Track prescriptions, lab reports, and orders.',
      ],
      icon: <User className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'ecosystemPatientCare',
      accentBg: 'bg-secondary/10 text-secondary',
      surfaceTint: 'from-secondary/[0.05] via-transparent to-transparent',
      ctaText: 'Register as Patient',
      btnVariant: 'secondary',
    },
    {
      id: 'DOCTOR',
      title: 'Doctors',
      badge: 'Clinicians & Specialists',
      description: 'Review consented patient history and manage structured clinical care.',
      benefits: [
        'Consent-verified longitudinal patient overview.',
        'SOAP clinical encounters & digital prescriptions.',
        'Live appointment queue & weekly scheduling.',
      ],
      icon: <Stethoscope className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'ecosystemDoctorWorkspace',
      accentBg: 'bg-primary/10 text-primary',
      surfaceTint: 'from-primary/[0.05] via-transparent to-transparent',
      ctaText: 'Register as Doctor',
      btnVariant: 'primary',
    },
    {
      id: 'PHARMACY',
      title: 'Pharmacies',
      badge: 'Dispensaries & Networks',
      description: 'Verify digital prescriptions and manage batch-tracked dispensing.',
      benefits: [
        'Structured e-Prescription verification queue.',
        'Batch, expiry, and stock-ledger inventory.',
        'Order fulfillment and pickup verification.',
      ],
      icon: <Pill className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'ecosystemPharmacyDispensing',
      accentBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      surfaceTint: 'from-amber-500/[0.05] via-transparent to-transparent',
      ctaText: 'Register Pharmacy',
      btnVariant: 'outline',
    },
    {
      id: 'LABORATORY',
      title: 'Diagnostic Laboratories',
      badge: 'Pathology & Diagnostics',
      description: 'Coordinate sample accessioning, quality control, and report publishing.',
      benefits: [
        'Barcode sample tracking & accessioning.',
        'Structured diagnostic report review & sign-off.',
        'QMS instrument, calibration & CAPA logs.',
      ],
      icon: <FlaskConical className="h-5 w-5" aria-hidden="true" />,
      imageAsset: 'ecosystemLaboratoryDiagnostics',
      accentBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
      surfaceTint: 'from-cyan-500/[0.05] via-transparent to-transparent',
      ctaText: 'Register Laboratory',
      btnVariant: 'outline',
    },
  ];

  return (
    <section id="ecosystem" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SlideIn inView className="max-w-3xl mx-auto text-center space-y-3 mb-12 md:mb-16">
          <Badge variant="info" size="md">
            Healthcare Ecosystem
          </Badge>
          <h2 className="text-page-heading sm:text-4xl font-bold text-balance">
            Built for Every Participant in Care Delivery
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Role-tailored workspaces designed around real healthcare workflows — connecting
            citizens and providers on a unified platform.
          </p>
        </SlideIn>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {roles.map((item) => (
            <StaggerItem key={item.id} className="flex">
              <Card
                className={`group flex flex-col justify-between w-full overflow-hidden bg-gradient-to-b ${item.surfaceTint} hover-lift transition-all duration-300 hover:shadow-lg hover:border-primary/30`}
              >
                <div className="px-4 pt-4">
                  <div className="relative overflow-hidden rounded-lg group/img">
                    <EditorialVisual
                      asset={item.imageAsset}
                      aspectClassName="aspect-[16/10]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                      className="rounded-lg border-border/60 shadow-none transition-transform duration-500 ease-out group-hover:scale-105"
                      imageClassName="transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Floating Role Status Pill on image */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md border border-border/70 shadow-sm text-[10px] font-semibold text-foreground tracking-wide transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>Verified Portal</span>
                    </div>

                    {/* Gradient Shimmer on hover */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </div>
                </div>

                <CardHeader className="space-y-4 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-12 h-12 rounded-xl ${item.accentBg} flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md shadow-xs border border-border/40`}
                    >
                      <span className="transition-transform duration-300 group-hover:scale-110">
                        {item.icon}
                      </span>
                    </div>
                    <Badge variant="outline" size="sm" className="transition-colors group-hover:border-primary/40">
                      {item.badge}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm leading-relaxed mt-1">
                      {item.description}
                    </CardDescription>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/70">
                    {item.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-start gap-2 text-xs text-muted-foreground group-hover:text-foreground/90 transition-colors"
                      >
                        <Check
                          className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                          aria-hidden="true"
                        />
                        <span className="leading-snug text-foreground/85">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardHeader>

                <CardFooter className="pt-2">
                  <Button
                    variant={item.btnVariant}
                    size="sm"
                    className="w-full justify-between font-semibold group/btn"
                    onClick={() => onSelectRole?.(item.id)}
                  >
                    <span>{item.ctaText}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Button>
                </CardFooter>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

export default UserEcosystem;
