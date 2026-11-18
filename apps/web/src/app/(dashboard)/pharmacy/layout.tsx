'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Pill, Package, ShoppingCart } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { PharmacySidebar } from '@/components/pharmacy/PharmacySidebar';
import { PharmacyTopbar } from '@/components/pharmacy/PharmacyTopbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageTransition } from '@/components/motion/MotionPrimitives';

const PHARMACY_MOBILE_NAV = [
  { label: 'Overview', href: '/pharmacy/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Rx Queue', href: '/pharmacy/prescriptions', icon: Pill },
  { label: 'Stock', href: '/pharmacy/inventory', icon: Package },
  { label: 'Orders', href: '/pharmacy/orders', icon: ShoppingCart },
];

export default function PharmacyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['PHARMACY']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-row transition-colors duration-200">
        <PharmacySidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <PharmacyTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          <main
            id="main-content"
            className="flex-1 container mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-8 max-w-7xl"
          >
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="hidden lg:block border-t border-border/80 py-4 px-6 text-center text-xs text-muted-foreground bg-card/60">
            © {new Date().getFullYear()} HealthBridge India · Pharmacy Portal · Digital Dispensing &amp; Inventory
          </footer>
        </div>

        <MobileBottomNav
          items={PHARMACY_MOBILE_NAV}
          onOpenMore={() => setMobileDrawerOpen(true)}
          ariaLabel="Pharmacy mobile navigation"
        />
      </div>
    </ProtectedRoute>
  );
}
