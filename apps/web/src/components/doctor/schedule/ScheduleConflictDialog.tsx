'use client';

import React from 'react';
import { AlertTriangle, Clock, Calendar, User, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AffectedAppointmentSummaryDto } from '@healthbridge/shared-types';

interface ScheduleConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectedAppointments: AffectedAppointmentSummaryDto[];
  onConfirmOverride: () => void;
  isSubmitting?: boolean;
}

export function ScheduleConflictDialog({
  open,
  onOpenChange,
  affectedAppointments,
  onConfirmOverride,
  isSubmitting = false,
}: ScheduleConflictDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Appointment Conflicts Detected
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {affectedAppointments.length} existing patient consultation(s) are scheduled within this blocked window.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 py-1">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldAlert className="h-3.5 w-3.5" /> Clinical Safety Rule
            </span>
            HealthBridge India does not silently cancel confirmed patient appointments. Blocking this time period requires you to review affected patients for rescheduling.
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-border/60 border border-border/80 rounded-lg p-2">
            {affectedAppointments.map((apt) => (
              <div key={apt.id} className="py-2 px-1 text-xs flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {apt.patientNameMasked}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {apt.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {apt.startTime} - {apt.endTime}
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px]">
                  {apt.consultationType}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel & Keep Slots Open
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirmOverride}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
          >
            {isSubmitting ? 'Confirming Block...' : 'Confirm Block & Flag Rescheduling'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleConflictDialog;
