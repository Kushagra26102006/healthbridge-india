'use client';

import React, { useState } from 'react';
import { LayoutDashboard, ShieldAlert, ScrollText, Server } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageTransition } from '@/components/motion/MotionPrimitives';

const ADMIN_MOBILE_NAV = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'SecOps', href: '/admin/security/overview', icon: ShieldAlert },
  { label: 'Audit', href: '/admin/audit-logs', icon: ScrollText },
  { label: 'Health', href: '/admin/system-monitoring', icon: Server },
];

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <AdminTopbar onOpenMobileSidebar={() => setMobileMenuOpen(true)} />
          <main
            id="main-content"
            className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-8"
          >
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        <MobileBottomNav
          items={ADMIN_MOBILE_NAV}
          onOpenMore={() => setMobileMenuOpen(true)}
          ariaLabel="Administrator mobile navigation"
        />
      </div>
    </ProtectedRoute>
  );
}
