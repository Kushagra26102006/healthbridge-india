'use client';

import React, { useState } from 'react';
import { LayoutDashboard, ListOrdered, Calendar, Users } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';
import { DoctorTopbar } from '@/components/doctor/DoctorTopbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageTransition } from '@/components/motion/MotionPrimitives';

const DOCTOR_MOBILE_NAV = [
  { label: 'Overview', href: '/doctor/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Queue', href: '/doctor/queue', icon: ListOrdered },
  { label: 'Schedule', href: '/doctor/appointments', icon: Calendar },
  { label: 'Patients', href: '/doctor/patients', icon: Users },
];

export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-row transition-colors duration-200">
        <DoctorSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <DoctorTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          <main
            id="main-content"
            className="flex-1 container mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-8 max-w-7xl"
          >
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="hidden lg:block border-t border-border/80 py-4 px-6 text-center text-xs text-muted-foreground bg-card/40">
            © {new Date().getFullYear()} HealthBridge India · Clinical Workspace · ABDM-Aligned Architecture
          </footer>
        </div>

        <MobileBottomNav
          items={DOCTOR_MOBILE_NAV}
          onOpenMore={() => setMobileDrawerOpen(true)}
          ariaLabel="Doctor mobile navigation"
        />
      </div>
    </ProtectedRoute>
  );
}
