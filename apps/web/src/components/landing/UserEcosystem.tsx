'use client';

import React from 'react';
import { User, Stethoscope, Pill, FlaskConical, ArrowRight, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  accentBg: string;
  ctaText: string;
  btnVariant: 'teal' | 'default' | 'outline';
}

export function UserEcosystem({ onSelectRole }: UserEcosystemProps) {
  const roles: RoleCardData[] = [
    {
      id: 'PATIENT',
      title: 'Patients',
      badge: 'Citizens & Families',
      description: 'Manage personal health information and control consent.',
      benefits: [
        'Consolidate personal medical history in one place.',
        'Grant and revoke provider access permissions easily.',
        'Access digital prescriptions and test records securely.',
      ],
      icon: <User className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      accentBg: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
      ctaText: 'Get Started as Patient',
      btnVariant: 'teal',
    },
    {
      id: 'DOCTOR',
      title: 'Doctors',
      badge: 'Clinicians & Specialists',
      description: 'Access authorized patient information and manage clinical workflows.',
      benefits: [
        'Review longitudinal medical records with patient consent.',
        'Create structured electronic prescriptions.',
        'Streamline clinical consultations and follow-up reviews.',
      ],
      icon: <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      accentBg: 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400',
      ctaText: 'Join as Doctor',
      btnVariant: 'default',
    },
    {
      id: 'PHARMACY',
      title: 'Pharmacies',
      badge: 'Retailers & Dispensaries',
      description: 'Support medication and prescription-related workflows.',
      benefits: [
        'Verify digital prescriptions securely before dispensation.',
        'Maintain accurate records of fulfilled medications.',
        'Reduce errors associated with handwritten prescriptions.',
      ],
      icon: <Pill className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      accentBg: 'bg-amber-600/10 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400',
      ctaText: 'Register Pharmacy',
      btnVariant: 'outline',
    },
    {
      id: 'LABORATORY',
      title: 'Diagnostic Laboratories',
      badge: 'Pathology & Imaging Centers',
      description: 'Support laboratory orders and diagnostic report workflows.',
      benefits: [
        'Deliver diagnostic test results directly to patient accounts.',
        'Organize laboratory orders with structured reference ranges.',
        'Accelerate reporting workflows for referring physicians.',
      ],
      icon: <FlaskConical className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      accentBg: 'bg-cyan-600/10 text-cyan-600 dark:bg-cyan-600/20 dark:text-cyan-400',
      ctaText: 'Connect Diagnostic Lab',
      btnVariant: 'outline',
    },
  ];

  return (
    <section id="ecosystem" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase">
            User Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Built for Every Participant in the Healthcare Journey
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Whether you are managing your personal health or delivering clinical services,
            HealthBridge India provides role-appropriate tools.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between border-border/90 bg-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-200"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.accentBg} flex items-center justify-center transition-transform hover:scale-105 duration-200`}
                  >
                    {item.icon}
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {item.badge}
                  </Badge>
                </div>

                <div>
                  <CardTitle className="text-xl font-bold text-foreground">{item.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed mt-1.5">
                    {item.description}
                  </CardDescription>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  {item.benefits.map((benefit, bIdx) => (
                    <div
                      key={bIdx}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span className="leading-tight text-foreground/80">{benefit}</span>
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
          ))}
        </div>
      </div>
    </section>
  );
}

export default UserEcosystem;
