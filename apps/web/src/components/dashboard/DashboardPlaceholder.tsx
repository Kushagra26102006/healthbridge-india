'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  LogOut,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Store,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';
import type { UserRole } from '@healthbridge/shared-types';

export interface DashboardPlaceholderProps {
  role: UserRole;
  title: string;
  description: string;
}

export function DashboardPlaceholder({ role, title, description }: DashboardPlaceholderProps) {
  const { user, logout, isLoading } = useAuth();

  const getRoleIcon = () => {
    switch (role) {
      case 'DOCTOR':
        return <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'PHARMACY':
        return <Store className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      case 'LABORATORY':
        return <FlaskConical className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />;
      case 'ADMIN':
        return <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400" />;
      default:
        return <UserCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={[role]}>
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        {/* Top Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
                HB
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground">
                Health<span className="text-teal-600 dark:text-teal-400">Bridge</span> India
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                disabled={isLoading}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Placeholder Body */}
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center border border-border">
                    {getRoleIcon()}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
                <Badge variant={user?.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>
                  {user?.accountStatus || 'PENDING'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2 border-t border-border/60">
              {/* Authenticated User Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/50 border border-border/80 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Authenticated User
                  </span>
                  <span className="font-bold text-foreground text-sm">{user?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Registered Email</span>
                  <span className="font-medium text-foreground">{user?.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Verified Role</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                    {user?.role}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account ID</span>
                  <span className="font-mono text-muted-foreground">
                    {user?.id?.slice(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Day 2 Task 04/05 Notice */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified Role Session Initialized</span>
                </div>
                <p>
                  Your authentication credentials and role authorization have been verified against
                  the HealthBridge India backend. Dedicated clinical dashboards, appointment
                  calendars, and record exchange workflows are scheduled for the subsequent
                  implementation task.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-4 border-t border-border">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Return to Homepage
                </Button>
              </Link>
              <Button
                variant="teal"
                size="sm"
                onClick={() => logout()}
                disabled={isLoading}
                className="text-xs"
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HealthBridge India • Verified Role Portal
        </footer>
      </div>
    </ProtectedRoute>
  );
}

export default DashboardPlaceholder;
