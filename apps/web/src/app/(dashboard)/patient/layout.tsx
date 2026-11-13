'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { PatientSidebar } from '@/components/patient/PatientSidebar';
import { PatientTopbar } from '@/components/patient/PatientTopbar';

export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['PATIENT']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-row transition-colors duration-200">
        {/* Left Responsive Navigation Sidebar */}
        <PatientSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Top Navigation Bar */}
          <PatientTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          {/* Page View Container */}
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
            {children}
          </main>

          {/* Patient Portal Footer */}
          <footer className="border-t border-border/80 py-4 px-6 text-center text-xs text-muted-foreground bg-card/40">
            © {new Date().getFullYear()} HealthBridge India • National Health Authority & ABDM
            Connected
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
}
