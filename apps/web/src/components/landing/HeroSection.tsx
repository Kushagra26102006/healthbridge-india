'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AbhaPreviewCard } from './AbhaPreviewCard';

export interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section id="top" className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Background radial gradient subtle highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-teal-500/10 via-blue-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* National Mission Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-50/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-brand-indiaOrange" />
              <span className="text-xs font-semibold tracking-wide">
                Ayushman Bharat Digital Mission (ABDM) Compatible
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              Your Health Records.{' '}
              <span className="bg-gradient-to-r from-blue-700 via-teal-600 to-cyan-500 bg-clip-text text-transparent">
                Connected. Secure.
              </span>{' '}
              In Your Control.
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-normal">
              Access and manage your health information through one secure digital healthcare
              experience. Connect with healthcare providers and share your records with consent.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Button
                variant="teal"
                size="xl"
                onClick={onGetStarted}
                className="group shadow-md hover:shadow-glow"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button variant="outline" size="xl" asChild className="hover:border-primary/50">
                <a href="#how-it-works">Explore How It Works</a>
              </Button>
            </div>

            {/* Trust Indicators / Badges */}
            <div className="pt-6 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-semibold text-foreground">ABHA-Ready</p>
                  <p className="text-[11px] text-muted-foreground">National Architecture</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-semibold text-foreground">Consent-Based</p>
                  <p className="text-[11px] text-muted-foreground">Patient-Owned Sharing</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-semibold text-foreground">Secure Exchange</p>
                  <p className="text-[11px] text-muted-foreground">DISHA & HIPAA Standard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Dashboard Composition */}
          <div className="lg:col-span-5 relative">
            <AbhaPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
