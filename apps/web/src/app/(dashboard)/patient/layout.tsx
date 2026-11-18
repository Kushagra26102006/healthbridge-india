'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Calendar, FileText, Pill } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { PatientSidebar } from '@/components/patient/PatientSidebar';
import { PatientTopbar } from '@/components/patient/PatientTopbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageTransition } from '@/components/motion/MotionPrimitives';

const PATIENT_MOBILE_NAV = [
  { label: 'Overview', href: '/patient/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Visits', href: '/patient/appointments', icon: Calendar },
  { label: 'Records', href: '/patient/records', icon: FileText },
  { label: 'Rx', href: '/patient/prescriptions', icon: Pill },
];

export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['PATIENT']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-row transition-colors duration-200">
        <PatientSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <PatientTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          <main
            id="main-content"
            className="flex-1 container mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-8 max-w-7xl"
          >
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="hidden lg:block border-t border-border/80 py-4 px-6 text-center text-xs text-muted-foreground bg-card/40">
            © {new Date().getFullYear()} HealthBridge India · Consent-First Patient Health Portal
          </footer>
        </div>

        <MobileBottomNav
          items={PATIENT_MOBILE_NAV}
          onOpenMore={() => setMobileDrawerOpen(true)}
          ariaLabel="Patient mobile navigation"
        />
      </div>
    </ProtectedRoute>
  );
}
