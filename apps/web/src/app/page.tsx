'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Shield,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SystemStatus } from '@/components/system-status';
import type { ApiResponse, HealthCheckData } from '@healthbridge/shared-types';

export default function HomePage() {
  const { user, isAuthenticated, logout, logoutAll, isLoading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<'NONE' | 'LOGIN' | 'REGISTER'>('NONE');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<
    ApiResponse<HealthCheckData>
  >({
    queryKey: ['backend-health'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<HealthCheckData>>('/health');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const healthData = data?.data;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header / National Branding */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6 border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                Ayushman Bharat Digital Mission (ABDM) Compatible
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Health<span className="text-teal-600">Bridge</span> India
            </h1>
            <p className="text-slate-600 mt-1">
              One Nation One Health Record — Complete Authentication & RBAC Platform
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-teal-600 text-teal-700 bg-teal-50">
              Day 1: Tasks 01–05
            </Badge>
            <Badge variant="success">Architecture & Integration Verified</Badge>
          </div>
        </header>

        {/* Real-time System Status Component */}
        <SystemStatus />

        {/* User Session Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              {isAuthenticated && user ? (
                user.name[0]?.toUpperCase()
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {isAuthenticated && user ? user.name : 'Guest Session'}
                </span>
                {isAuthenticated && user && (
                  <Badge variant="secondary" className="text-xs">
                    {user.role}
                  </Badge>
                )}
                {isAuthenticated && user && (
                  <Badge
                    variant={user.accountStatus === 'ACTIVE' ? 'success' : 'warning'}
                    className="text-xs"
                  >
                    {user.accountStatus}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAuthenticated && user
                  ? `${user.email} • ID: ${user.id.slice(0, 8)}...`
                  : 'Sign in to access your ABHA records or doctor clinical workflows.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  disabled={authLoading}
                  className="gap-1.5 text-xs text-slate-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutAll()}
                  disabled={authLoading}
                  className="gap-1.5 text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Revoke All
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthView(authView === 'LOGIN' ? 'NONE' : 'LOGIN')}
                  className="text-xs"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAuthView(authView === 'REGISTER' ? 'NONE' : 'REGISTER')}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Collapsible Auth Dialog / Forms */}
        {!isAuthenticated && authView !== 'NONE' && (
          <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200">
            {authView === 'LOGIN' && (
              <LoginForm
                onSuccess={() => setAuthView('NONE')}
                onSwitchToRegister={() => setAuthView('REGISTER')}
              />
            )}
            {authView === 'REGISTER' && (
              <RegisterForm
                onSuccess={() => setAuthView('NONE')}
                onSwitchToLogin={() => setAuthView('LOGIN')}
              />
            )}
          </div>
        )}

        {/* System Status Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backend Status Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                API Gateway Status
              </CardTitle>
              <Server className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
                  Checking API health...
                </div>
              ) : isError ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Offline / Connecting
                  </div>
                  <p className="text-xs text-slate-500">
                    {error instanceof Error ? error.message : 'API server unreachable on port 5001'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Operational ({healthData?.status})
                  </div>
                  <p className="text-xs text-slate-500">
                    Uptime: {healthData?.uptime}s | Env: {healthData?.environment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Connection Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">MongoDB Atlas</CardTitle>
              <Database className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  {healthData?.services.database.status === 'connected' ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Badge variant="warning">
                      {healthData?.services.database.status || 'Standby / Local'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Mongoose Architecture Ready (18 Collections)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Security Architecture
              </CardTitle>
              <Layers className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    JWT Rotation
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    HTTP-Only
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    RBAC
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Append-only audit & DISHA controls</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Protected Clinical Route Demonstration */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-600" />
                Protected Clinical Zone (RBAC Demonstration)
              </h2>
              <p className="text-sm text-slate-500">
                Demonstrates client-side & server-side authorization: accessible exclusively to
                DOCTOR and ADMIN roles
              </p>
            </div>
          </div>

          <ProtectedRoute
            allowedRoles={['DOCTOR', 'ADMIN']}
            onRequireLogin={() => setAuthView('LOGIN')}
          >
            <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Access Authorized: Clinical Records Gateway Unlocked
              </div>
              <p className="text-xs text-slate-600">
                Welcome, {user?.name}. You are operating in doctor mode. All queries to electronic
                health records (EHR) and prescriptions require active patient consent artifacts.
              </p>
            </div>
          </ProtectedRoute>
        </section>

        {/* Deliverables Checklist */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Task 03 Auth Deliverables Checklist
              </h2>
              <p className="text-sm text-slate-500">Verified security and identity capabilities</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Re-check Health
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">5 User Roles & Registration Workflows</p>
                <p className="text-xs text-slate-500">
                  PATIENT, DOCTOR, PHARMACY, LABORATORY, ADMIN. Auto-profile initialization & status
                  assignment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">JWT & Refresh Token Rotation</p>
                <p className="text-xs text-slate-500">
                  Short-lived JWT (15m), SHA-256 hashed refresh tokens, reuse breach detection &
                  token family revocation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">Password Reset & Session Revocation</p>
                <p className="text-xs text-slate-500">
                  One-time cryptographic tokens, zero user enumeration, automatic logout from all
                  active devices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">Rate Limiting & Correlation Tracing</p>
                <p className="text-xs text-slate-500">
                  Sliding-window brute-force limiter (5 attempts / 15m), X-Request-Id request
                  tracing, secure HTTP-only cookies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
          <p>HealthBridge India — One Nation One Health Record Platform</p>
          <p className="mt-1 text-slate-400">
            Strictly following DISHA, HIPAA, and ABDM security guidelines.
          </p>
        </footer>
      </div>
    </main>
  );
}
