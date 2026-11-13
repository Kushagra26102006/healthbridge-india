'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { Loader2 } from 'lucide-react';

export default function GenericDashboardPage() {
  const router = useRouter();
  const { user, isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'PATIENT') {
        router.replace('/patient/dashboard');
      } else if (user.role === 'DOCTOR') {
        router.replace('/doctor/dashboard');
      } else if (user.role === 'PHARMACY') {
        router.replace('/pharmacy/dashboard');
      } else if (user.role === 'LABORATORY') {
        router.replace('/laboratory/dashboard');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      }
    }
  }, [user, isInitialized, isAuthenticated, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 p-6 rounded-2xl bg-card border border-border shadow-card">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-medium">Directing to your verified role portal...</span>
        </div>
      </div>
    </ProtectedRoute>
  );
}
