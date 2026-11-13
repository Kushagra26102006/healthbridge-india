'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FinalCTAProps {
  onGetStarted?: () => void;
  onExplore?: () => void;
}

export function FinalCTA({ onGetStarted, onExplore }: FinalCTAProps) {
  return (
    <section id="get-started" className="py-16 md:py-24 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/10 via-teal-900/10 to-transparent border border-teal-500/30 p-8 sm:p-12 md:p-16 text-center space-y-6 max-w-5xl mx-auto shadow-card">
          {/* Subtle Glow Backdrops */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Join the Connected Healthcare Network
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Take Control of Your Digital Health Journey
          </h2>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start building a more connected and organized healthcare experience today. Secure,
            consent-driven, and designed for you.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              variant="teal"
              size="xl"
              onClick={onGetStarted}
              className="w-full sm:w-auto shadow-md hover:shadow-glow group"
            >
              <span>Get Started</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button variant="outline" size="xl" onClick={onExplore} className="w-full sm:w-auto">
              Explore the Platform
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
