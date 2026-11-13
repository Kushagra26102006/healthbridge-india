'use client';

import React from 'react';
import { useSystemHealth } from '@/features/system/hooks/use-system-health';
import { Activity, RefreshCw, XCircle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function SystemStatus() {
  const { health, isLoading, isError, error, refetch, isFetching } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="space-y-1">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-red-900">API Connection Offline</span>
              <Badge variant="destructive" className="text-xs">
                Disconnected
              </Badge>
            </div>
            <p className="text-xs text-red-700 mt-0.5">
              {error?.message || 'Unable to connect to backend service.'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-red-300 text-red-700 hover:bg-red-100 h-8 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Retry Connection
        </Button>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';
  const dbConnected = health?.services?.database?.status === 'connected';

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm transition-all hover:border-teal-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Application & Status */}
        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-600'
                : isDegraded
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-600'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-sm text-slate-800">
                {health?.application || 'HealthBridge India API'}
              </h4>
              <Badge
                variant={isHealthy ? 'secondary' : 'destructive'}
                className={`text-[11px] font-medium ${
                  isHealthy
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isHealthy ? 'Operational' : isDegraded ? 'Degraded' : 'Offline'}
              </Badge>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
              <span>
                Environment:{' '}
                <strong className="text-slate-700 uppercase text-[10px] tracking-wider">
                  {health?.environment || 'development'}
                </strong>
              </span>
              <span>•</span>
              <span>v{health?.version || '1.0.0'}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>
                  DB: <strong>{dbConnected ? 'Online' : 'Standby'}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Last Check & Refresh */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Checked:{' '}
            {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Just now'}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs text-slate-600 hover:text-teal-700 hover:bg-slate-100"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1 ${isFetching ? 'animate-spin text-teal-600' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
