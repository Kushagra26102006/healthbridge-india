'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiagramVisual } from '@/components/ui/visual-asset';
import { SlideIn } from '@/components/motion';

export interface FinalCTAProps {
  onGetStarted?: () => void;
  onExplore?: () => void;
}

export function FinalCTA({ onGetStarted, onExplore }: FinalCTAProps) {
  return (
    <section id="get-started" className="py-16 md:py-24 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SlideIn inView>
          <div className="glass-panel relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-secondary/[0.06] to-transparent p-8 sm:p-12 md:p-16 text-center space-y-6 max-w-5xl mx-auto shadow-lg">
            {/* Subtle Ambient Glows */}
            <div
              aria-hidden="true"
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[240px] rounded-full bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 blur-3xl pointer-events-none"
            />

            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-blue-50/90 dark:bg-primary/20 text-blue-700 dark:text-blue-200 border border-blue-200/80 dark:border-primary/30 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Connected Digital Healthcare</span>
              </div>

              <h2 className="text-page-heading sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight text-balance">
                Take Control of Your Digital Health Journey.
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Experience unified health records, structured clinical workflows, and explicit
                patient-controlled consent in one modern platform.
              </p>

              <div className="max-w-2xl mx-auto pt-1">
                <DiagramVisual
                  asset="connectedHealthcareNetwork"
                  className="bg-slate-950/90 border-slate-800 p-1.5"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="xl"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto shadow-md group"
                >
                  <span>Get Started</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  onClick={onExplore}
                  className="w-full sm:w-auto"
                >
                  Explore the Platform
                </Button>
              </div>
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
}

export default FinalCTA;
