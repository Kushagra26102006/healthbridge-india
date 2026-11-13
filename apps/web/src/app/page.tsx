'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { UserRoles } from '@/components/landing/UserRoles';
import { AuthModal } from '@/components/auth/AuthModal';
import { SystemStatus } from '@/components/system-status';
import { Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<
    'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY'
  >('PATIENT');
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);

  const handleOpenAuth = (
    view: 'LOGIN' | 'REGISTER',
    role?: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY'
  ) => {
    setAuthView(view);
    if (role) setSelectedRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Sticky Responsive Navbar */}
      <Navbar onOpenAuth={(view) => handleOpenAuth(view)} />

      {/* 2. Main Landing Page Sections */}
      <main className="flex-1">
        {/* Hero Section with Interactive ABHA Dashboard Preview */}
        <HeroSection onGetStarted={() => handleOpenAuth('REGISTER', 'PATIENT')} />

        {/* Platform Trust & Core Principles */}
        <TrustSection />

        {/* 4-Step How It Works Flow */}
        <HowItWorks />

        {/* Stakeholder Ecosystem / User Roles */}
        <UserRoles
          onSelectRole={(role) => {
            handleOpenAuth('REGISTER', role);
          }}
        />

        {/* Security & National Compliance Banner */}
        <section id="security-banner" className="py-12 bg-background border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-blue-900/10 via-teal-900/10 to-transparent border border-teal-500/30 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="abha">ABDM Milestone 1–3 Architecture</Badge>
                  <Badge variant="success">DISHA & HIPAA Standard</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Ready for India&apos;s Digital Health Revolution
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Engineered with cryptographic session security, append-only audit logging, and
                  two-tier authorization combining role permissions with explicit patient consent
                  artifacts.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <Button
                  variant="teal"
                  size="lg"
                  onClick={() => handleOpenAuth('REGISTER', 'PATIENT')}
                  className="w-full sm:w-auto shadow-md hover:shadow-glow"
                >
                  Create Your ABHA Account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleOpenAuth('LOGIN')}
                  className="w-full sm:w-auto"
                >
                  Sign In to Portal
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Comprehensive Professional Footer */}
      <Footer />

      {/* 4. Auth Modal Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        view={authView}
        defaultRole={selectedRole}
        onClose={() => setAuthModalOpen(false)}
        onSwitchView={(view) => setAuthView(view)}
      />

      {/* 5. Floating Real-time API Health Inspector (Day 1 Integration Assurance) */}
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
