'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Lock, Loader2, ArrowLeft, LayoutDashboard } from 'lucide-react';
import type { UserRole } from '@healthbridge/shared-types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectUnauth?: boolean;
  onRequireLogin?: () => void;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectUnauth = false,
  onRequireLogin,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !isLoading && (!isAuthenticated || !user) && redirectUnauth) {
      router.push('/login');
    }
  }, [isInitialized, isLoading, isAuthenticated, user, redirectUnauth, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400 mr-2" />
        <span className="text-sm text-muted-foreground">Verifying security context...</span>
      </div>
    );
  }

  // Unauthenticated check
  if (!isAuthenticated || !user) {
    return (
      <Card className="max-w-md mx-auto my-12 border-border shadow-card bg-card text-card-foreground">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground border border-border">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Authentication Required
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            You must be signed in to access this protected healthcare area.
          </p>
        </CardHeader>
        <CardContent className="text-center pt-2 space-y-2">
          {onRequireLogin ? (
            <Button onClick={onRequireLogin} variant="teal" className="text-xs w-full">
              Sign In to Continue
            </Button>
          ) : (
            <Link href="/login" className="block w-full">
              <Button variant="teal" className="text-xs w-full">
                Sign In to Continue
              </Button>
            </Link>
          )}
          <Link href="/" className="block w-full">
            <Button
              variant="ghost"
              className="text-xs w-full text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Return to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Role authorization check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Card className="max-w-md mx-auto my-12 border-destructive/30 bg-destructive/5 text-card-foreground shadow-card">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-2 text-destructive border border-destructive/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">Access Restricted</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Your current role (
            <span className="font-mono font-semibold text-destructive">{user.role}</span>) does not
            have sufficient clinical authorization for this resource.
          </p>
        </CardHeader>
        <CardContent className="text-center pt-2 space-y-2">
          <Link href="/dashboard" className="block w-full">
            <Button variant="outline" className="text-xs w-full gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Go to My Role Dashboard
            </Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button
              variant="ghost"
              className="text-xs w-full text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Return to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
