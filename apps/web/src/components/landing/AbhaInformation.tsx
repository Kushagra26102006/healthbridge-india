'use client';

import React from 'react';
import { Sparkles, ArrowRight, Layers, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface AbhaInformationProps {
  onExplore?: () => void;
}

export function AbhaInformation({ onExplore }: AbhaInformationProps) {
  const topics = [
    {
      title: 'What is an ABHA Address?',
      icon: <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      description:
        'An Ayushman Bharat Health Account (ABHA) address is a unique 14-digit digital health identifier. It provides a standardized way for citizens to establish a recognized health identity across participating hospitals and clinics in India.',
    },
    {
      title: 'How It Supports Connected Healthcare',
      icon: <HeartHandshake className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      description:
        'Instead of carrying folders of paper reports or repeating diagnostic tests, a digital health identity allows authorized medical facilities to access your past consultations and test results with your explicit permission.',
    },
    {
      title: 'How ABDM-Enabled Ecosystems Work',
      icon: <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      description:
        'The Ayushman Bharat Digital Mission (ABDM) framework establishes standardized digital protocols so diverse electronic health record systems—public hospitals, private providers, diagnostic labs, and pharmacies—can communicate securely.',
    },
    {
      title: 'Why Explicit Consent Matters',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      description:
        'In an interoperable healthcare ecosystem, your privacy remains paramount. No doctor, insurer, or hospital can access your medical records without your specific digital authorization, giving you complete ownership over your data.',
    },
  ];

  return (
    <section id="abha" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide uppercase">
            Educational Guide
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Understanding ABHA and Digital Healthcare
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Learn how India’s digital health architecture is transforming medical records from
            fragmented paper documents into secure, patient-controlled digital history.
          </p>
        </div>

        {/* 4 Topic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {topics.map((topic, idx) => (
            <Card
              key={idx}
              className="border-border/90 bg-card hover:shadow-cardHover transition-all duration-200"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/80 flex items-center justify-center border border-border">
                    {topic.icon}
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">{topic.title}</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {topic.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Educational CTA & Independent Platform Notice */}
        <div className="mt-12 text-center space-y-4">
          <Button variant="teal" size="lg" onClick={onExplore} className="shadow-sm group">
            <span>Explore Digital Health</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            <em>
              Note: HealthBridge India is an independent healthcare technology platform designed to
              support ABDM interoperability frameworks. It is not an official government agency or
              government-operated application.
            </em>
          </p>
        </div>
      </div>
    </section>
  );
}

export default AbhaInformation;
