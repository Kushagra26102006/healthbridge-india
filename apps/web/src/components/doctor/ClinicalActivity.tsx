'use client';

import React from 'react';
import {
  Activity,
  Calendar,
  Stethoscope,
  Pill,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DoctorClinicalActivityDto } from '@healthbridge/shared-types';

export interface ClinicalActivityProps {
  activities: DoctorClinicalActivityDto[];
  isLoading?: boolean;
  className?: string;
}

export function ClinicalActivity({
  activities,
  isLoading = false,
  className,
}: ClinicalActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'ENCOUNTER':
        return <Stethoscope className="h-4 w-4 text-indigo-500" />;
      case 'PRESCRIPTION':
        return <Pill className="h-4 w-4 text-teal-500" />;
      case 'CONSENT':
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <Card className={cn('border border-border/80 bg-card shadow-sm', className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Clinical Activity Feed
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of consultations, encounters and prescriptions
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted/50 animate-pulse rounded-xl border border-border/40"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Activity className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs text-muted-foreground">
              No recent clinical activity recorded today.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-background border-2 border-border group-hover:border-blue-500 flex items-center justify-center transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(act.type)}
                      <span className="text-xs font-bold text-foreground">
                        {act.title}
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(act.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {act.description}
                  </p>

                  {act.patientName && (
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Patient: <strong className="text-foreground">{act.patientName}</strong></span>
                      {act.status && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {act.status}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
