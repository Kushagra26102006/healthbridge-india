'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TestTube2,
  ClipboardList,
  FlaskConical,
  Building2,
  FileText,
  Bell,
  Settings,
  UserCheck,
  ChevronLeft,
  LogOut,
  X,
  Scan,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Gauge,
  Boxes,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface LabNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const LAB_NAV_SECTIONS: { title: string; items: LabNavItem[] }[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Overview', href: '/laboratory/dashboard', icon: LayoutDashboard },
      { label: 'Lab Orders', href: '/laboratory/orders', icon: ClipboardList },
      { label: 'Samples', href: '/laboratory/samples', icon: FlaskConical },
      { label: 'Barcode Scan', href: '/laboratory/samples/scan', icon: Scan },
    ],
  },
  {
    title: 'Catalogue & Network',
    items: [
      { label: 'Test Catalogue', href: '/laboratory/tests', icon: TestTube2 },
      { label: 'Add New Test', href: '/laboratory/tests/new', icon: PlusCircle },
      { label: 'Collection Centers', href: '/laboratory/collection-centers', icon: Building2 },
    ],
  },
  {
    title: 'Diagnostics & Reports',
    items: [
      { label: 'Diagnostic Reports', href: '/laboratory/reports', icon: FileText },
      { label: 'Notifications', href: '/laboratory/notifications', icon: Bell },
    ],
  },
  {
    title: 'Quality & QMS',
    items: [
      { label: 'Quality Dashboard', href: '/laboratory/quality', icon: ShieldCheck },
      { label: 'Quality Control', href: '/laboratory/quality/control', icon: Gauge },
      { label: 'Incidents', href: '/laboratory/quality/incidents', icon: AlertTriangle },
      { label: 'CAPA Actions', href: '/laboratory/quality/capa', icon: ShieldCheck },
      { label: 'Instruments', href: '/laboratory/quality/instruments', icon: Cpu },
      { label: 'Calibration', href: '/laboratory/quality/calibration', icon: Gauge },
      { label: 'Maintenance', href: '/laboratory/quality/maintenance', icon: Wrench },
      { label: 'Reagent Stock', href: '/laboratory/inventory/reagents', icon: Boxes },
      { label: 'Quality Analytics', href: '/laboratory/quality/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Laboratory Profile', href: '/laboratory/profile', icon: UserCheck },
      { label: 'Settings', href: '/laboratory/settings', icon: Settings },
    ],
  },
];

export interface LaboratorySidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function LaboratorySidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  className,
}: LaboratorySidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sidebarContent = (
    <aside
      className={cn(
        'h-full flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 select-none shadow-xl',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <Link
          href="/laboratory/dashboard"
          className={cn(
            'flex items-center gap-3 overflow-hidden group focus:outline-none',
            collapsed && 'justify-center w-full'
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                HealthBridge
                <span className="text-[10px] font-bold tracking-wider text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/40">
                  LIMS
                </span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                Diagnostic Lab Portal
              </span>
            </div>
          )}
        </Link>

        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:block"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {LAB_NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/laboratory/dashboard' &&
                  pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-teal-600/20 text-teal-300 font-semibold border-l-2 border-teal-400'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60',
                    collapsed && 'justify-center px-0'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-teal-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300 border-none"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg bg-slate-800/40',
            collapsed && 'justify-center p-1'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-700/50 flex items-center justify-center text-teal-300 text-xs font-bold shrink-0">
            {user?.name ? user.name[0]?.toUpperCase() : 'L'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.name || 'Laboratory Staff'}
              </p>
              <p className="text-[10px] text-teal-400 font-medium truncate">
                NABL Accredited
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 flex flex-col">
            <button
              onClick={onCloseMobile}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default LaboratorySidebar;
