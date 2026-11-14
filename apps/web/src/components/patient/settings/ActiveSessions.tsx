'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useActiveSessions,
  useRevokeSession,
  useRevokeOtherSessions,
} from '@/features/patient/hooks/use-profile';
import type { UserSessionItemDto } from '@healthbridge/shared-types';

export const ActiveSessions: React.FC = () => {
  const { sessions, isLoading } = useActiveSessions();
  const revokeMutation = useRevokeSession();
  const revokeOthersMutation = useRevokeOtherSessions();

  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const getDeviceIcon = (session: UserSessionItemDto) => {
    const os = session.os?.toLowerCase() || '';
    if (os.includes('ios') || os.includes('android')) return Smartphone;
    if (os.includes('ipad')) return Tablet;
    return Laptop;
  };

  const handleRevokeSingle = async (sessionId: string) => {
    try {
      setActionMessage(null);
      await revokeMutation.mutateAsync(sessionId);
      setActionMessage({ text: 'Session successfully revoked', type: 'success' });
    } catch {
      setActionMessage({ text: 'Failed to revoke session. Please try again.', type: 'error' });
    }
  };

  const handleRevokeOthers = async () => {
    try {
      setActionMessage(null);
      const res = await revokeOthersMutation.mutateAsync();
      setActionMessage({
        text: `Successfully signed out from ${res.count ?? 'all other'} device(s).`,
        type: 'success',
      });
    } catch {
      setActionMessage({ text: 'Failed to terminate other sessions.', type: 'error' });
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Active Sessions & Devices
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Manage all browsers and mobile devices currently signed into your account
              </p>
            </div>
          </div>

          {otherSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={revokeOthersMutation.isPending}
              className="text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{revokeOthersMutation.isPending ? 'Signing out...' : 'Sign out other devices'}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 text-xs">
        {actionMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 rounded-xl bg-muted/60" />
            <div className="h-16 rounded-xl bg-muted/60" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground space-y-1">
            <p>No active sessions detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session);
              const lastActiveDate = new Date(session.lastActive).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    session.isCurrent
                      ? 'bg-teal-500/5 border-teal-500/30 dark:bg-teal-950/10'
                      : 'bg-muted/30 border-border/60 hover:border-border'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        session.isCurrent
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <DeviceIcon className="h-5 w-5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-xs">
                          {session.deviceName || session.browser || 'Web Session'}
                        </span>
                        {session.isCurrent && (
                          <Badge className="bg-teal-600 text-white text-[9px] font-medium">
                            This Device (Current)
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Globe className="h-3 w-3" />
                          <span>{session.ipAddress}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Last active {lastActiveDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSingle(session.id)}
                      disabled={revokeMutation.isPending}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl h-8 self-end sm:self-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Revoke</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border/60">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
          <span>
            Sessions use cryptographic refresh token rotation with immediate automated breach containment.
            Raw session secrets are never stored or transmitted in plain text.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
