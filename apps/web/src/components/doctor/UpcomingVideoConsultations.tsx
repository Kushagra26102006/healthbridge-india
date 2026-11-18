'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  telemedicineApi,
  type DoctorUpcomingVideoConsultationDto,
} from '@/features/telemedicine/api/telemedicine-api';

export function UpcomingVideoConsultations() {
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: consultations = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', 'telemedicine', 'upcoming'],
    queryFn: () => telemedicineApi.getDoctorUpcoming(),
    staleTime: 30_000,
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      appointmentId,
      decision,
      reason,
    }: {
      appointmentId: string;
      decision: 'ACCEPT' | 'REJECT';
      reason?: string;
    }) => telemedicineApi.decideConsultation(appointmentId, { decision, reason }),
    onMutate: ({ appointmentId }) => {
      setActionId(appointmentId);
      setFeedback(null);
    },
    onSuccess: (_res, vars) => {
      setFeedback(
        vars.decision === 'ACCEPT'
          ? 'Video consultation accepted and confirmed.'
          : 'Video consultation declined and patient notified.'
      );
      queryClient.invalidateQueries({ queryKey: ['doctor', 'telemedicine', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
    },
    onError: (err: unknown) => {
      setFeedback(
        (err as any)?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Unable to update consultation status')
      );
    },
    onSettled: () => {
      setActionId(null);
    },
  });

  const handleReject = (item: DoctorUpcomingVideoConsultationDto) => {
    const reason =
      typeof window !== 'undefined'
        ? window.prompt('Optional reason for declining this video consultation:', 'Schedule conflict')
        : 'Schedule conflict';
    if (reason === null) return;
    decisionMutation.mutate({
      appointmentId: item.appointmentId,
      decision: 'REJECT',
      reason: reason || 'Declined by consulting physician',
    });
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4 border-border/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-card-heading flex items-center gap-2">
            <Video className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span>Upcoming Video Consultations</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Accept or decline teleconsultation requests and launch encrypted WebRTC sessions
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="h-8 text-xs text-muted-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {feedback && (
        <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 px-3 py-2 text-xs text-teal-800 dark:text-teal-300">
          {feedback}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-20 rounded-xl bg-muted/60" />
          <div className="h-20 rounded-xl bg-muted/60" />
        </div>
      ) : isError ? (
        <div className="text-xs text-rose-600 dark:text-rose-400 py-4 text-center">
          Unable to load upcoming video consultations right now.
        </div>
      ) : consultations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1.5">
          <Video className="h-6 w-6 text-muted-foreground/60 mx-auto" />
          <p className="text-xs font-medium text-foreground">No upcoming video consultations</p>
          <p className="text-[11px] text-muted-foreground">
            Confirmed and requested teleconsultations will appear here for one-click room access.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((item) => {
            const isBusy = actionId === item.appointmentId;
            const canJoin = ['CONFIRMED', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'].includes(
              item.appointmentStatus
            );
            const canDecide = item.appointmentStatus === 'REQUESTED' || item.appointmentStatus === 'SCHEDULED';

            return (
              <div
                key={item.appointmentId}
                className="rounded-xl border border-border/80 bg-muted/25 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground truncate">
                      {item.patientName}
                    </span>
                    <Badge
                      variant={item.appointmentStatus === 'REQUESTED' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {item.appointmentStatus}
                    </Badge>
                    {item.patientInWaitingRoom && (
                      <Badge variant="info" size="sm" className="animate-pulse">
                        Patient in Waiting Room
                      </Badge>
                    )}
                    {item.patientConsentGranted && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        Consent Granted
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">{item.reason}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {new Date(item.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {item.startTime}–{item.endTime} IST
                    </span>
                    {item.patientPhone && <span className="font-mono">{item.patientPhone}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canDecide && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() =>
                          decisionMutation.mutate({
                            appointmentId: item.appointmentId,
                            decision: 'ACCEPT',
                          })
                        }
                        className="h-8 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        Accept
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => handleReject(item)}
                        className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {canJoin && (
                    <Button variant="teal" size="sm" asChild className="h-8 text-xs font-semibold">
                      <Link href={`/doctor/consultations/${item.appointmentId}`}>
                        <Video className="h-3.5 w-3.5 mr-1.5" />
                        Join Consultation
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default UpcomingVideoConsultations;
