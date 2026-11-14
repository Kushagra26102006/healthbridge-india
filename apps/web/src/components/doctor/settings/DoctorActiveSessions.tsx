'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDoctorSessions } from '@/features/doctor/hooks/use-doctor';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function DoctorActiveSessions() {
  const {
    sessions,
    isLoading,
    isError,
    error,
    revokeSession,
    isRevoking,
    revokeOtherSessions,
    isRevokingOthers,
  } = useDoctorSessions();

  const { logout } = useAuth();

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        <div className="h-16 rounded-xl bg-muted/60" />
        <div className="h-40 rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80 max-w-4xl">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm font-semibold text-destructive">Failed to load active sessions</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error'}</p>
      </Card>
    );
  }

  const handleRevokeSingle = async (sessionId: string) => {
    setActionError(null);
    try {
      await revokeSession(sessionId);
      setActionSuccess('Session terminated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeOthers = async () => {
    if (confirm('Are you sure you want to sign out from all other devices and browsers?')) {
      setActionError(null);
      try {
        const result = await revokeOtherSessions();
        setActionSuccess(`Signed out from ${result.revokedCount} other device(s) successfully.`);
        setTimeout(() => setActionSuccess(null), 4000);
      } catch (err: any) {
        setActionError(err?.message || 'Failed to revoke other sessions');
      }
    }
  };

  const handleLogoutAll = async () => {
    if (confirm('Are you sure you want to sign out from ALL active sessions including this one?')) {
      await logout();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {actionSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">{actionSuccess}</div>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="font-semibold">{actionError}</div>
        </div>
      )}

      {/* Header Card with Bulk Actions */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Active Practitioner Sessions
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Review browsers and clinical workstations currently authenticated with your account
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRevokeOthers}
              disabled={isRevokingOthers || sessions.length <= 1}
              className="text-xs h-8 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out Other Devices
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleLogoutAll}
              className="text-xs h-8 gap-1.5"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Sign Out All
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No active sessions found.</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                  session.isCurrent
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : 'border-border/80 bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      session.os?.toLowerCase().includes('ios') || session.os?.toLowerCase().includes('android')
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {session.os?.toLowerCase().includes('ios') || session.os?.toLowerCase().includes('android') ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {session.deviceName || session.browser || 'Web Browser'}
                      </span>
                      {session.isCurrent && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                          Current Session
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {session.ipAddress || '127.0.0.1'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Active: {new Date(session.lastActive).toLocaleString('en-IN')}
                      </span>
                      <span>•</span>
                      <span>Signed in: {new Date(session.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <div className="self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeSingle(session.id)}
                      disabled={isRevoking}
                      className="text-xs h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Terminate
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DoctorActiveSessions;
