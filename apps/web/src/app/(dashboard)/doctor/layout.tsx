'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';
import { DoctorTopbar } from '@/components/doctor/DoctorTopbar';

export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-row transition-colors duration-200">
        {/* Left Responsive Navigation Sidebar */}
        <DoctorSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Top Navigation Bar */}
          <DoctorTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          {/* Page View Container */}
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
            {children}
          </main>

          {/* Doctor Portal Footer */}
          <footer className="border-t border-border/80 py-4 px-6 text-center text-xs text-muted-foreground bg-card/40">
            © {new Date().getFullYear()} HealthBridge India • ABDM Unified Health Interface (UHI) & Doctor Registry (HPR) Compliant
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
}

