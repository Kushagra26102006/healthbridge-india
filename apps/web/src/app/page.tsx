'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InfoModal, type InfoModalType } from '@/components/layout/InfoModal';
import { HeroSection } from '@/components/landing/HeroSection';
import { PlatformOverview } from '@/components/landing/PlatformOverview';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { UserEcosystem } from '@/components/landing/UserEcosystem';
import { PrivacySection } from '@/components/landing/PrivacySection';
import { AbhaInformation } from '@/components/landing/AbhaInformation';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { AuthModal } from '@/components/auth/AuthModal';
import { SystemStatus } from '@/components/system-status';
import { Activity, ChevronUp, ChevronDown } from 'lucide-react';

export default function HomePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<
    'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY'
  >('PATIENT');
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);

  const handleOpenAuth = (
    view: 'LOGIN' | 'REGISTER',
    role?: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY'
  ) => {
    setAuthView(view);
    if (role) setSelectedRole(role);
    setAuthModalOpen(true);
  };

  const handleScrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Sticky Responsive Navbar */}
      <Navbar onOpenAuth={(view) => handleOpenAuth(view)} />

      {/* 2. Main Landing Page Sections */}
      <main className="flex-1">
        {/* Hero Section with Interactive ABHA Dashboard Preview */}
        <HeroSection onGetStarted={() => handleOpenAuth('REGISTER', 'PATIENT')} />

        {/* Section 1: Platform Overview */}
        <PlatformOverview />

        {/* Section 2: Platform Services */}
        <ServicesSection />

        {/* Section 3: How It Works */}
        <HowItWorks />

        {/* Section 4: User Ecosystem */}
        <UserEcosystem
          onSelectRole={(role) => {
            handleOpenAuth('REGISTER', role);
          }}
        />

        {/* Section 5: Privacy and Security */}
        <PrivacySection />

        {/* Section 6: ABHA and ABDM Information */}
        <AbhaInformation onExplore={() => handleScrollTo('services')} />

        {/* Section 7: Final Call to Action */}
        <FinalCTA
          onGetStarted={() => handleOpenAuth('REGISTER', 'PATIENT')}
          onExplore={() => handleScrollTo('overview')}
        />
      </main>

      {/* 3. Comprehensive Professional Footer */}
      <Footer onOpenInfo={(type) => setInfoModalType(type)} />

      {/* 4. Auth Modal Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        view={authView}
        defaultRole={selectedRole}
        onClose={() => setAuthModalOpen(false)}
        onSwitchView={(view) => setAuthView(view)}
      />

      {/* 5. Informational Modal (Privacy, Terms, Consent) */}
      <InfoModal type={infoModalType} onClose={() => setInfoModalType(null)} />

      {/* 6. Floating Real-time API Health Inspector (Day 1 Integration Assurance) */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="relative">
          {showStatusDrawer && (
            <div className="absolute bottom-12 right-0 w-80 sm:w-96 rounded-2xl border border-border bg-card/98 backdrop-blur-xl p-4 shadow-2xl mb-2 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Live API Telemetry
                </span>
                <button
                  type="button"
                  onClick={() => setShowStatusDrawer(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Minimize
                </button>
              </div>
              <SystemStatus />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowStatusDrawer(!showStatusDrawer)}
            aria-label="Toggle backend system health inspector"
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/80 bg-background/90 backdrop-blur-md text-xs font-semibold text-foreground shadow-lg hover:bg-accent transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>API Status</span>
            {showStatusDrawer ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
