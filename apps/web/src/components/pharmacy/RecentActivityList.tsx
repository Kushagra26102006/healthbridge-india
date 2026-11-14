import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PharmacyRecentActivityDto } from '@healthbridge/shared-types';

export interface RecentActivityListProps {
  activities: PharmacyRecentActivityDto[];
  className?: string;
}

export function RecentActivityList({ activities, className }: RecentActivityListProps) {
  return (
    <Card className={cn('border border-border/80 bg-card/60 rounded-2xl shadow-sm', className)}>
      <CardHeader className="p-5 pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          Recent Pharmacy Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No recent operational transactions recorded.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 text-xs p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-xs leading-snug">{act.description}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                  {new Date(act.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} • {new Date(act.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
export default RecentActivityList;

