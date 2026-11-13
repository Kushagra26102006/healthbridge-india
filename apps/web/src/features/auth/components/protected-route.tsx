'use client';

import React from 'react';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Lock, Loader2 } from 'lucide-react';
import type { UserRole } from '@healthbridge/shared-types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  onRequireLogin?: () => void;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  onRequireLogin,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600 mr-2" />
        <span className="text-sm text-slate-600">Verifying security context...</span>
      </div>
    );
  }

  // Unauthenticated check
  if (!isAuthenticated || !user) {
    return (
      <Card className="max-w-md mx-auto my-8 border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-600">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold">Authentication Required</CardTitle>
          <p className="text-xs text-slate-500">
            You must be signed in to access this protected healthcare area.
          </p>
        </CardHeader>
        <CardContent className="text-center pt-2">
          {onRequireLogin && (
            <Button
              onClick={onRequireLogin}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs w-full"
            >
              Sign In to Continue
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Role authorization check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Card className="max-w-md mx-auto my-8 border-rose-200 bg-rose-50/30">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-rose-900">Access Restricted</CardTitle>
          <p className="text-xs text-rose-700">
            Your current role (<span className="font-semibold">{user.role}</span>) does not have
            sufficient clinical authorization for this resource.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return <>{children}</>;
}
