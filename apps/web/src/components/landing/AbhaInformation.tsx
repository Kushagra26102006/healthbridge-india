'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  HeartHandshake,
  Download,
  Check,
  QrCode,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiagramVisual } from '@/components/ui/visual-asset';
import { CopyButton, SlideIn, StaggerList, StaggerItem } from '@/components/motion';
import { useInteractionPreferences } from '@/lib/motion/preferences';

export interface AbhaInformationProps {
  onExplore?: () => void;
}

const SAMPLE_ABHA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="440" viewBox="0 0 760 440">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#080F1E"/>
      <stop offset="55%" stop-color="#111C30"/>
      <stop offset="100%" stop-color="#0D3B4C"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF9933"/>
      <stop offset="50%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient>
  </defs>
  <rect width="760" height="440" rx="24" fill="url(#bg)"/>
  <rect width="760" height="8" fill="url(#accent)"/>
  <text x="44" y="64" fill="#2DD4BF" font-family="sans-serif" font-size="14" font-weight="700" letter-spacing="2">AYUSHMAN BHARAT DIGITAL MISSION • SAMPLE PREVIEW</text>
  <text x="44" y="106" fill="#F8FAFC" font-family="sans-serif" font-size="30" font-weight="700">ABHA Digital Health Identity</text>
  <text x="44" y="182" fill="#94A3B8" font-family="sans-serif" font-size="14">SAMPLE HOLDER NAME</text>
  <text x="44" y="214" fill="#F8FAFC" font-family="sans-serif" font-size="24" font-weight="600">Sample Citizen</text>
  <text x="44" y="274" fill="#94A3B8" font-family="sans-serif" font-size="14">MASKED SAMPLE IDENTIFIER</text>
  <text x="44" y="308" fill="#2DD4BF" font-family="monospace" font-size="26" font-weight="700">XX-XXXX-XXXX-2309</text>
  <text x="44" y="346" fill="#CBD5E1" font-family="monospace" font-size="16">sample.citizen@abdm</text>
  <rect x="556" y="150" width="152" height="152" rx="16" fill="#17243A" stroke="#26364D" stroke-width="2"/>
  <text x="632" y="232" text-anchor="middle" fill="#94A3B8" font-family="monospace" font-size="14">QR SAMPLE</text>
  <text x="44" y="404" fill="#94A3B8" font-family="sans-serif" font-size="13">ILLUSTRATIVE PREVIEW ONLY — NOT AN OFFICIAL GOVERNMENT ID OR REAL PATIENT RECORD</text>
</svg>`;

export function AbhaInformation({ onExplore }: AbhaInformationProps) {
  const [downloaded, setDownloaded] = useState(false);
  const { triggerFeedback } = useInteractionPreferences();

  const handleDownloadPreview = () => {
    try {
      const blob = new Blob([SAMPLE_ABHA_SVG], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'healthbridge-sample-abha-preview.svg';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      triggerFeedback('confirm');
      window.setTimeout(() => setDownloaded(false), 2200);
    } catch {
      triggerFeedback('error');
    }
  };

  const topics = [
    {
      title: 'What is ABHA?',
      icon: <Layers className="h-5 w-5 text-secondary" aria-hidden="true" />,
      description:
        'An Ayushman Bharat Health Account (ABHA) provides a standardized 14-digit digital health identifier and user-friendly ABHA address to establish a consistent health identity across participating care facilities in India.',
    },
    {
      title: 'How Digital Health Identity Works',
      icon: <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />,
      description:
        'Your digital health identity links your records across clinics, hospitals, pharmacies, and diagnostic laboratories without forcing you to carry folders of paper documents.',
    },
    {
      title: 'How Consent-Based Sharing Works',
      icon: <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />,
      description:
        'Linking an ABHA identity never grants automatic record access. Every share request requires your explicit approval specifying data types, clinical purpose, and duration.',
    },
    {
      title: 'How Participating Providers Connect',
      icon: <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />,
      description:
        'Under the Ayushman Bharat Digital Mission (ABDM) framework, Health Information Providers (HIPs) and Health Information Users (HIUs) exchange structured FHIR R4 bundles over standardized consent gateways.',
    },
  ];

  return (
    <section id="abha" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12 md:space-y-16">
        {/* Section Header */}
        <SlideIn inView className="max-w-3xl mx-auto text-center space-y-3">
          <Badge variant="abha" size="md">
            About ABHA &amp; ABDM
          </Badge>
          <h2 className="text-page-heading sm:text-4xl font-bold text-balance">
            Understanding ABHA Digital Health Identity
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Learn how India’s digital health architecture connects fragmented medical records into
            a portable, patient-controlled health history.
          </p>
        </SlideIn>

        {/* Dedicated ABHA Digital Identity Card Preview (Illustrative Sample Only) */}
        <SlideIn inView className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-xl border border-border bg-card p-5 sm:p-8 shadow-md">
            {/* Visual Digital ID Card */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#080F1E] via-[#111C30] to-[#0D3B4C] p-5 sm:p-6 text-slate-50 shadow-lg border border-slate-700/60">
                <div
                  aria-hidden="true"
                  className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-indiaOrange via-brand-blue to-brand-indiaGreen"
                />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-300">
                      Ayushman Bharat Digital Mission
                    </p>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      ABHA Health Identity
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-pill border border-teal-400/30 bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-teal-200">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Illustrative Status
                  </span>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">
                        Sample Holder
                      </p>
                      <p className="text-base font-semibold text-white">Sample Citizen</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">
                        Masked Sample Identifier
                      </p>
                      <p className="font-mono text-sm sm:text-base font-semibold tracking-wider text-teal-200">
                        XX-XXXX-XXXX-2309
                      </p>
                    </div>
                    <p className="font-mono text-xs text-slate-300 truncate">
                      sample.citizen@abdm
                    </p>
                  </div>

                  {/* Stylized QR Placeholder */}
                  <div
                    aria-label="Illustrative QR code placeholder"
                    className="flex flex-col items-center justify-center rounded-md border border-slate-600/70 bg-white/10 p-2.5 shrink-0"
                  >
                    <QrCode className="h-12 w-12 text-teal-200" aria-hidden="true" />
                    <span className="text-[10px] font-mono text-slate-300 mt-1">SAMPLE QR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Preview Details & Actions */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <Badge variant="info" size="sm">
                  Illustrative Preview Only
                </Badge>
                <h3 className="text-section-heading">Portable Digital Health ID</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Preview how verified ABHA identity details appear inside your Patient Portal once
                  linked. No real citizen data is shown here.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadPreview}
                >
                  {downloaded ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Preview Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Download Preview (.svg)</span>
                    </>
                  )}
                </Button>

                <CopyButton
                  value="sample.citizen@abdm"
                  label="Copy Sample Address"
                  copiedLabel="Copied"
                  size="sm"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Real ABHA identifiers remain strictly masked and separated from internal database
                keys.
              </p>
            </div>
          </div>
        </SlideIn>

        {/* Neutral ABDM Interoperability Architecture Diagram */}
        <SlideIn inView className="max-w-4xl mx-auto space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Consent-Mediated Health Information Exchange Architecture
          </p>
          <DiagramVisual asset="abdmEcosystemFlow" />
        </SlideIn>

        {/* 4 Educational Topic Cards */}
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {topics.map((topic) => (
            <StaggerItem key={topic.title} className="flex">
              <Card className="w-full hover-lift">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-muted/80 flex items-center justify-center border border-border shrink-0">
                      {topic.icon}
                    </div>
                    <CardTitle>{topic.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    {topic.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* Educational CTA & Independent Notice */}
        <div className="text-center space-y-4">
          <Button variant="secondary" size="lg" onClick={onExplore} className="group shadow-sm">
            <span>Explore Platform Services</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Button>

          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            <em>
              Note: HealthBridge India is an independent healthcare technology platform built to
              align with ABDM interoperability specifications. It is not an official government
              agency or government-operated portal.
            </em>
          </p>
        </div>
      </div>
    </section>
  );
}

export default AbhaInformation;
