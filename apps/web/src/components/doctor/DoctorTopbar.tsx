'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  Stethoscope,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DoctorTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

export function DoctorTopbar({ onOpenMobileSidebar, className }: DoctorTopbarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname.includes('/appointments')) return 'Appointments & Consultations';
    if (pathname.includes('/patients')) return 'Assigned Patients';
    if (pathname.includes('/schedule')) return 'Schedule & Availability';
    if (pathname.includes('/encounters')) return 'Clinical Encounters';
    if (pathname.includes('/prescriptions')) return 'Prescription Management';
    if (pathname.includes('/profile')) return 'Professional Profile';
    if (pathname.includes('/settings')) return 'Practice Settings';
    return 'Clinical Overview';
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 md:h-20 w-full bg-background/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors',
        className
      )}
    >
      {/* Left: Mobile Drawer Trigger + Breadcrumb Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation drawer"
            className="lg:hidden p-2 rounded-xl border border-input bg-card text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-semibold text-muted-foreground">
              Doctor Portal /
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {getPageTitle()}
            </h1>
          </div>
          <span className="text-[11px] text-muted-foreground hidden md:flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-teal-500" />
            ABDM Healthcare Professionals Registry (HPR) Verified
          </span>
        </div>
      </div>

      {/* Middle: Quick Patient Search Placeholder */}
      <div className="hidden md:flex items-center flex-1 max-w-xs xl:max-w-md mx-4">
        <div className="relative w-full">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search scheduled patients, IDs or visits..."
            className="w-full bg-muted/60 hover:bg-muted focus:bg-background text-sm rounded-xl pl-9 pr-4 py-2 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
        </div>
      </div>

      {/* Right Action Icons & Profile Trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Verification Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-700 dark:text-blue-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Active Clinician</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell with Menu */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            aria-label="View clinical notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-background animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <span className="font-semibold text-sm">Clinical Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  2 New
                </Badge>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">Upcoming Consultation</p>
                    <p className="text-muted-foreground">
                      Teleconsultation with Rahul Sharma starts in 15 minutes.
                    </p>
                    <span className="text-[10px] text-muted-foreground">Just now</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">Consent Approved</p>
                    <p className="text-muted-foreground">
                      Ananya Patel granted consent to review prior lab records.
                    </p>
                    <span className="text-[10px] text-muted-foreground">1 hour ago</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/80 text-center">
                <Link
                  href="/doctor/appointments"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all appointments & notices
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Doctor Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-border/80 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            aria-label="Doctor account menu"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                Dr. {user?.name || 'Physician'}
              </span>
              <span className="text-[10px] text-muted-foreground">Doctor</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-0.5 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-border/80">
                <p className="text-xs font-semibold text-foreground truncate">
                  Dr. {user?.name || 'Physician'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 border-blue-500/40 text-blue-600 dark:text-blue-400">
                  DOCTOR
                </Badge>
              </div>

              <div className="py-1">
                <Link
                  href="/doctor/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Professional Profile
                </Link>
                <Link
                  href="/doctor/schedule"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Schedule & Availability
                </Link>
                <Link
                  href="/doctor/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Practice Settings
                </Link>
              </div>

              <div className="pt-1 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
