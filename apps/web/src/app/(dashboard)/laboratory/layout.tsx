'use client';

import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, FlaskConical, FileText } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { LaboratorySidebar } from '@/components/laboratory/LaboratorySidebar';
import { LaboratoryTopbar } from '@/components/laboratory/LaboratoryTopbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageTransition } from '@/components/motion/MotionPrimitives';

const LABORATORY_MOBILE_NAV = [
  { label: 'Overview', href: '/laboratory/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Orders', href: '/laboratory/orders', icon: ClipboardList },
  { label: 'Samples', href: '/laboratory/samples', icon: FlaskConical },
  { label: 'Reports', href: '/laboratory/reports', icon: FileText },
];

export default function LaboratoryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['LABORATORY']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-row transition-colors duration-200">
        <LaboratorySidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <LaboratoryTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          <main
            id="main-content"
            className="flex-1 container mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-8 max-w-7xl"
          >
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="hidden lg:block border-t border-border/80 py-4 px-6 text-center text-xs text-muted-foreground bg-card/60">
            © {new Date().getFullYear()} HealthBridge India · Diagnostic Laboratory Information Management Workspace
          </footer>
        </div>

        <MobileBottomNav
          items={LABORATORY_MOBILE_NAV}
          onOpenMore={() => setMobileDrawerOpen(true)}
          ariaLabel="Laboratory mobile navigation"
        />
      </div>
    </ProtectedRoute>
  );
}
