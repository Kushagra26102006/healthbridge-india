'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Activity, Bell, LayoutDashboard } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { NotificationBell } from '@/components/notifications';

const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/platform-overview', label: 'Platform Overview', icon: Activity },
  { href: '/admin/platform/events', label: 'Event Monitor', icon: Activity },
  { href: '/admin/integrations/abdm', label: 'ABDM Status', icon: ShieldCheck },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xs">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 overflow-x-auto">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 font-bold text-sm text-foreground shrink-0"
              >
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>HealthBridge Admin</span>
              </Link>

              <nav aria-label="Admin navigation" className="flex items-center gap-1">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-slate-900 dark:bg-teal-600 text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
