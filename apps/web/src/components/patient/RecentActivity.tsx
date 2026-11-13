'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  Calendar,
  Pill,
  FlaskConical,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientEmptyState } from './PatientEmptyState';
import type { PatientRecentActivityDto } from '@healthbridge/shared-types';

export interface RecentActivityProps {
  activities?: PatientRecentActivityDto[];
  isLoading?: boolean;
}

export function RecentActivity({ activities = [], isLoading = false }: RecentActivityProps) {
  const getActivityIcon = (type: PatientRecentActivityDto['type']) => {
    switch (type) {
      case 'RECORD':
        return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
      case 'PRESCRIPTION':
        return <Pill className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'LAB_REPORT':
        return <FlaskConical className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case 'CONSENT':
        return <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return iso;
    }
  };

  return (
    <Card className="border-border/80 shadow-card bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <Activity className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold text-foreground">
            Recent Medical Activity
          </CardTitle>
        </div>

        <Link
          href="/patient/records"
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/40 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 bg-muted rounded" />
                  <div className="h-2.5 w-60 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Node indicator */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-border group-hover:border-teal-500 flex items-center justify-center transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                </div>

                <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-background border border-border shrink-0">
                        {getActivityIcon(act.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{act.title}</h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(act.timestamp)}
                      </span>
                      {act.badge && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                          {act.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PatientEmptyState
            icon={Activity}
            title="No Recent Healthcare Activity"
            description="When medical records, prescriptions, or consultations are recorded in your ABDM account, they will appear here in chronological order."
          />
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
