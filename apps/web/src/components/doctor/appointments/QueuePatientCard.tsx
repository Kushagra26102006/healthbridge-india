'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Video,
  MapPin,
  Stethoscope,
  CheckCircle2,
  UserCheck,
  Timer,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QueueStatusBadge } from './QueueStatusBadge';
import { cn } from '@/lib/utils';
import type { DoctorQueueItemDto } from '@healthbridge/shared-types';

export interface QueuePatientCardProps {
  item: DoctorQueueItemDto;
  onCheckIn: (id: string) => Promise<void>;
  onStart: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  isBusy?: boolean;
}

export function QueuePatientCard({
  item,
  onCheckIn,
  onStart,
  onComplete,
  isBusy = false,
}: QueuePatientCardProps) {
  const isTele = item.consultationType === 'TELECONSULTATION';
  const isInConsultation = item.status === 'IN_PROGRESS';
  const isWaiting = item.status === 'CHECKED_IN';

  return (
    <Card
      className={cn(
        'border transition-all duration-200 shadow-sm',
        isInConsultation
          ? 'border-blue-500/60 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-500/40'
          : isWaiting
          ? 'border-amber-500/40 bg-amber-50/15 dark:bg-amber-950/15'
          : 'border-border/80 bg-card hover:bg-muted/20'
      )}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Queue Token & Patient Demographics */}
        <div className="flex items-start gap-4 min-w-0">
          {/* Large Token Badge */}
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-extrabold shadow-sm leading-tight',
              isInConsultation
                ? 'bg-blue-600 text-white border-blue-700 animate-pulse'
                : isWaiting
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-400/50'
                : 'bg-muted text-foreground border-border'
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider">Token</span>
            <span className="text-xl font-black">#{item.queueNumber}</span>
          </div>

          {/* Details */}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/doctor/appointments/${item.id}`}
                className="text-base font-bold text-foreground hover:underline truncate"
              >
                {item.patientName}
              </Link>

              {item.patientAge && (
                <span className="text-xs text-muted-foreground">
                  ({item.patientAge}y{item.patientGender ? ` / ${item.patientGender}` : ''})
                </span>
              )}

              <QueueStatusBadge status={item.status} />

              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 flex items-center gap-1',
                  isTele
                    ? 'border-indigo-400 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-emerald-400 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                )}
              >
                {isTele ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                {isTele ? 'Teleconsult' : 'In-Person'}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              <strong className="text-foreground/80">Chief Complaint:</strong> {item.reason}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" />
                Slot: {item.startTime} - {item.endTime}
              </span>

              {item.checkedInAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-teal-600" />
                    Arrived:{' '}
                    {new Date(item.checkedInAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}

              {isWaiting && item.waitingMinutes !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                    <Timer className="h-3 w-3" />
                    Waiting: {item.waitingMinutes} min{item.waitingMinutes === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: State Transition Action Button */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {(item.status === 'CONFIRMED' || item.status === 'SCHEDULED') && (
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => onCheckIn(item.id)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Check In Patient
            </Button>
          )}

          {item.status === 'CHECKED_IN' && (
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => onStart(item.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm font-semibold"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Call In / Start
            </Button>
          )}

          {item.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => onComplete(item.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete Consult
            </Button>
          )}

          <Button asChild size="sm" variant="outline" className="text-xs h-8 px-2">
            <Link href={`/doctor/appointments/${item.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
