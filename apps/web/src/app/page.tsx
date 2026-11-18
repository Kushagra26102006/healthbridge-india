'use client';

import React, { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InfoModal, type InfoModalType } from '@/components/layout/InfoModal';
import { HeroSection } from '@/components/landing/HeroSection';
import { PlatformCapabilitiesBar } from '@/components/landing/PlatformCapabilitiesBar';
import { PlatformOverview } from '@/components/landing/PlatformOverview';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { UserEcosystem } from '@/components/landing/UserEcosystem';
import { PrivacySection } from '@/components/landing/PrivacySection';
import { AbhaInformation } from '@/components/landing/AbhaInformation';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { AuthModal } from '@/components/auth/AuthModal';
import { SystemStatus } from '@/components/system-status';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { dropdownEntrance } from '@/lib/motion/variants';

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
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200 overflow-x-clip">
      {/* 1. Sticky Glassmorphic Navbar */}
      <Navbar onOpenAuth={(view) => handleOpenAuth(view)} />

      {/* 2. Main Landing Page Sections */}
      <main id="main-content" className="flex-1">
        <HeroSection onGetStarted={() => handleOpenAuth('REGISTER', 'PATIENT')} />

        <PlatformCapabilitiesBar />

        <PlatformOverview />

        <ServicesSection />

        <HowItWorks />

        <UserEcosystem
          onSelectRole={(role) => {
            handleOpenAuth('REGISTER', role);
          }}
        />

        <PrivacySection />

        <AbhaInformation onExplore={() => handleScrollTo('services')} />

        <FinalCTA
          onGetStarted={() => handleOpenAuth('REGISTER', 'PATIENT')}
          onExplore={() => handleScrollTo('overview')}
        />
      </main>

      {/* 3. Comprehensive Footer */}
      <Footer onOpenInfo={(type) => setInfoModalType(type)} />

      {/* 4. Auth Modal Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        view={authView}
        defaultRole={selectedRole}
        onClose={() => setAuthModalOpen(false)}
        onSwitchView={(view) => setAuthView(view)}
      />

      {/* 5. Legal & Consent Informational Modal */}
      <InfoModal type={infoModalType} onClose={() => setInfoModalType(null)} />

      {/* 6. Collapsible Real-time API Health Inspector (Unobtrusive Glass Pill) */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="relative">
          <AnimatePresence>
            {showStatusDrawer && (
              <m.div
                variants={dropdownEntrance}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-panel absolute bottom-12 right-0 w-80 sm:w-96 rounded-xl p-4 mb-2"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                    <span>Platform API Status</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStatusDrawer(false)}
                    className="text-muted-foreground hover:text-foreground text-xs font-medium focus-ring rounded-sm px-1.5 py-0.5"
                  >
                    Minimize
                  </button>
                </div>
                <SystemStatus />
              </m.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setShowStatusDrawer((prev) => !prev)}
            aria-expanded={showStatusDrawer}
            aria-label="Toggle backend system health inspector"
            className="glass-panel flex items-center gap-2 px-3 py-2 rounded-pill text-xs font-semibold text-foreground hover:border-primary/30 transition-all duration-150 focus-ring"
          >
            <StatusIndicator status="online" pulse size="sm" />
            <span>API Status</span>
            {showStatusDrawer ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
