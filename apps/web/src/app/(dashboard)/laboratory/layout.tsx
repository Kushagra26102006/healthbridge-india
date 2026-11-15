'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { LaboratorySidebar } from '@/components/laboratory/LaboratorySidebar';
import { LaboratoryTopbar } from '@/components/laboratory/LaboratoryTopbar';

export default function LaboratoryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['LABORATORY']} redirectUnauth>
      <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-row transition-colors duration-200">
        {/* Responsive Navigation Sidebar */}
        <LaboratorySidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Top Navigation Bar */}
          <LaboratoryTopbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

          {/* Page View Container */}
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
            {children}
          </main>

          {/* Laboratory Portal Footer */}
          <footer className="border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 bg-white">
            © {new Date().getFullYear()} HealthBridge India • Diagnostic Laboratory Portal • NABL & ABDM Diagnostic Standards
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
}
