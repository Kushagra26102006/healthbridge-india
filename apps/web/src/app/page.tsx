'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Layers, CheckCircle2, AlertCircle, RefreshCw, Server } from 'lucide-react';
import type { ApiResponse, HealthCheckData } from '@healthbridge/shared-types';

export default function HomePage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<ApiResponse<HealthCheckData>>({
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
        {/* Header / National Emblem Aesthetic */}
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
              One Nation One Health Record — Scalable Healthcare Monorepo Foundation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-teal-600 text-teal-700 bg-teal-50">
              Day 1: Monorepo Foundation
            </Badge>
            <Badge variant="success">pnpm Workspaces</Badge>
          </div>
        </header>

        {/* System Status Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backend Status Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">API Gateway Status</CardTitle>
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
                <p className="text-xs text-slate-500">Mongoose Connection Architecture Ready</p>
              </div>
            </CardContent>
          </Card>

          {/* Monorepo Architecture Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Architecture</CardTitle>
              <Layers className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs">Next.js 14</Badge>
                  <Badge variant="secondary" className="text-xs">Express</Badge>
                  <Badge variant="secondary" className="text-xs">TypeScript</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Shared Types & Zod Validation</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Foundation Checklist */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Task 01 Deliverables & Architecture Checklist</h2>
              <p className="text-sm text-slate-500">Verified components of HealthBridge India monorepo</p>
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
                <p className="font-medium text-slate-800">apps/web (Next.js 14 App Router)</p>
                <p className="text-xs text-slate-500">
                  Turbopack, Tailwind CSS, shadcn/ui, Redux Toolkit, TanStack Query, Axios
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">apps/api (Express.js TypeScript Service)</p>
                <p className="text-xs text-slate-500">
                  Helmet, CORS, Cookie-parser, Mongoose, Centralized Error Handling, Health Endpoint
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">packages/shared-types & packages/validation</p>
                <p className="text-xs text-slate-500">
                  Shared ABHA contracts, User roles, API contracts, Zod runtime validation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">MongoDB Atlas Connection Architecture</p>
                <p className="text-xs text-slate-500">
                  Connection pooling, retry hooks, graceful shutdown, environment-driven URI
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
          <p>HealthBridge India — One Nation One Health Record Platform</p>
          <p className="mt-1 text-slate-400">Strictly following DISHA, HIPAA, and ABDM security guidelines.</p>
        </footer>
      </div>
    </main>
  );
}

