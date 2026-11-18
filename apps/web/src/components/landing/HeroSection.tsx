'use client';

import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Lock, Activity, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { ParallaxLayer, SlideIn, TiltCard } from '@/components/motion';

export interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24 overflow-hidden"
    >
      {/* Subtle Healthcare Network Gradient & Grid Backdrop (desktop-only parallax) */}
      <ParallaxLayer
        offset={28}
        className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[540px] rounded-full bg-gradient-to-b from-primary/14 via-accent/8 to-transparent blur-3xl" />
        <svg
          className="hidden lg:block absolute top-8 left-1/2 -translate-x-1/2 w-[1240px] h-[520px] opacity-[0.07] dark:opacity-[0.09] text-primary"
          viewBox="0 0 1200 500"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M40 380 C 260 220, 480 420, 720 180 S 1020 120, 1160 260"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          <path
            d="M80 120 C 320 260, 560 90, 820 280 S 1060 360, 1140 160"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="260" cy="285" r="4" fill="currentColor" />
          <circle cx="720" cy="180" r="5" fill="currentColor" />
          <circle cx="960" cy="215" r="4" fill="currentColor" />
        </svg>
      </ParallaxLayer>
      <ParallaxLayer
        offset={-16}
        className="hidden md:block absolute inset-0 -z-10 pointer-events-none overflow-hidden"
      >
        <div className="absolute top-28 right-[8%] w-72 h-72 rounded-full bg-secondary/12 blur-3xl" />
        <div className="absolute bottom-8 left-[6%] w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
      </ParallaxLayer>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <SlideIn direction="up" className="lg:col-span-6 xl:col-span-6 space-y-6 text-left">
            {/* ABHA-Compatible Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-blue-200 dark:border-primary/30 bg-blue-50/90 dark:bg-primary/15 text-blue-700 dark:text-blue-200 shadow-xs">
              <span
                aria-hidden="true"
                className="flex h-2 w-2 rounded-pill bg-brand-indiaOrange shrink-0"
              />
              <span className="text-xs font-semibold tracking-wide">
                ABHA-Compatible Architecture • Consent-First Exchange
              </span>
            </div>

            {/* Exact Required Headline */}
            <h1 className="text-display sm:text-5xl xl:text-[3.35rem] font-bold tracking-tight text-foreground leading-[1.1] text-balance">
              Your Health Records.{' '}
              <span className="bg-gradient-to-r from-brand-blue via-brand-teal to-brand-cyan bg-clip-text text-transparent">
                Connected. Secure.
              </span>{' '}
              In Your Control.
            </h1>

            {/* Exact Required Supporting Copy */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              One secure digital healthcare experience connecting patients, doctors, hospitals,
              pharmacies and diagnostic laboratories.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="xl"
                onClick={onGetStarted}
                className="group shadow-md"
              >
                <span>Get Started</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>

              <Button variant="outline" size="xl" asChild>
                <a href="#how-it-works">Explore How It Works</a>
              </Button>
            </div>

            {/* Core Architecture Assurance Badges */}
            <div className="pt-6 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex items-start gap-2.5">
                <div
                  className="p-2 rounded-md bg-secondary/10 text-secondary shrink-0"
                  aria-hidden="true"
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="leading-snug">
                  <p className="text-xs font-semibold text-foreground">ABHA-Compatible</p>
                  <p className="text-xs text-muted-foreground">ABDM-aligned workflows</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div
                  className="p-2 rounded-md bg-primary/10 text-primary shrink-0"
                  aria-hidden="true"
                >
                  <Lock className="h-4 w-4" />
                </div>
                <div className="leading-snug">
                  <p className="text-xs font-semibold text-foreground">Consent-Based</p>
                  <p className="text-xs text-muted-foreground">Patient-controlled sharing</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div
                  className="p-2 rounded-md bg-accent/15 text-cyan-700 dark:text-cyan-300 shrink-0"
                  aria-hidden="true"
                >
                  <Activity className="h-4 w-4" />
                </div>
                <div className="leading-snug">
                  <p className="text-xs font-semibold text-foreground">Secure Exchange</p>
                  <p className="text-xs text-muted-foreground">Role-scoped &amp; audited</p>
                </div>
              </div>
            </div>

            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
              <span>
                Independent healthcare platform supporting ABDM sandbox integration pathways.
              </span>
            </p>
          </SlideIn>

          {/* Right Column: Single Full-Bleed Animated Healthcare Visual */}
          <SlideIn direction="up" delay={0.08} className="lg:col-span-6 xl:col-span-6 relative">
            <ParallaxLayer offset={14}>
              <div className="relative py-4 sm:px-3">
                {/* Ambient Breathing Glow Halo */}
                <m.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-brand-blue/25 via-brand-teal/20 to-brand-cyan/25 blur-2xl"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: [0.97, 1.03, 0.97],
                          opacity: [0.45, 0.75, 0.45],
                        }
                  }
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* 3D Tilt + Gentle Levitation Frame */}
                <TiltCard maxTilt={4} className="relative">
                  <m.div
                    className="relative rounded-2xl p-2 bg-card/80 dark:bg-card/70 backdrop-blur-md border border-border/80 shadow-xl ring-1 ring-primary/10"
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : {
                            y: [0, -8, 0],
                          }
                    }
                    transition={{
                      duration: 5.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl group">
                      <EditorialVisual
                        asset="heroHealthcarePlatform"
                        priority
                        aspectClassName="aspect-[4/3]"
                        sizes="(max-width: 1024px) 100vw, 600px"
                        className="rounded-xl border-0 shadow-none"
                        imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />

                      {/* Animated Soft Light Sheen Sweep */}
                      {!prefersReducedMotion && (
                        <m.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]"
                          animate={{ x: ['-40%', '360%'] }}
                          transition={{
                            duration: 3.4,
                            repeat: Infinity,
                            repeatDelay: 4.5,
                            ease: 'easeInOut',
                          }}
                        />
                      )}

                      {/* Subtle Bottom Vignette + Animated ECG Pulse Strip */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent"
                      />
                      <div className="pointer-events-none absolute inset-x-4 bottom-3.5 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
                          <span className="relative flex h-2 w-2" aria-hidden="true">
                            {!prefersReducedMotion && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                          </span>
                          <span>ABDM Interoperable Care Network</span>
                        </div>

                        <svg
                          viewBox="0 0 120 28"
                          className="hidden sm:block h-7 w-28 text-cyan-300/90"
                          fill="none"
                          aria-hidden="true"
                        >
                          <m.path
                            d="M2 15 H28 L36 6 L44 24 L52 4 L60 20 L68 15 H118"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={prefersReducedMotion ? false : { pathLength: 0.25, opacity: 0.6 }}
                            animate={
                              prefersReducedMotion
                                ? undefined
                                : { pathLength: [0.15, 1, 0.15], opacity: [0.5, 1, 0.5] }
                            }
                            transition={{
                              duration: 3.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Floating Top-Right Security Chip */}
                    <m.div
                      aria-hidden="true"
                      className="hidden sm:flex items-center gap-2 absolute -top-3.5 -right-3 rounded-xl bg-card/95 dark:bg-slate-900/95 backdrop-blur-md border border-border/80 px-3.5 py-2 shadow-lg"
                      animate={
                        prefersReducedMotion
                          ? undefined
                          : {
                              y: [0, -5, 0],
                            }
                      }
                      transition={{
                        duration: 4.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.4,
                      }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <p className="text-[11px] font-semibold text-foreground">Consent-First</p>
                        <p className="text-[10px] text-muted-foreground">End-to-End Audited</p>
                      </div>
                    </m.div>

                    {/* Floating Bottom-Left Care Chip */}
                    <m.div
                      aria-hidden="true"
                      className="hidden sm:flex items-center gap-2 absolute -bottom-3.5 left-5 rounded-xl bg-card/95 dark:bg-slate-900/95 backdrop-blur-md border border-border/80 px-3.5 py-2 shadow-lg"
                      animate={
                        prefersReducedMotion
                          ? undefined
                          : {
                              y: [0, 5, 0],
                            }
                      }
                      transition={{
                        duration: 4.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.8,
                      }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <p className="text-[11px] font-semibold text-foreground">Unified Records</p>
                        <p className="text-[10px] text-muted-foreground">5 Connected Portals</p>
                      </div>
                    </m.div>
                  </m.div>
                </TiltCard>
              </div>
            </ParallaxLayer>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
