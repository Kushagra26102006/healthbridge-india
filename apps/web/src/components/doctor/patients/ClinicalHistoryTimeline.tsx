'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Building2,
  User,
  History,
  Pill,
  TestTube,
  FileText,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientEmptyState } from './PatientEmptyState';
import { useDoctorPatientTimeline } from '@/features/doctor/hooks/use-doctor';
import { cn } from '@/lib/utils';
import type { TimelineEventCategory, PatientTimelineQueryDto } from '@healthbridge/shared-types';

interface ClinicalHistoryTimelineProps {
  patientId: string;
}

export const ClinicalHistoryTimeline: React.FC<ClinicalHistoryTimelineProps> = ({ patientId }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | TimelineEventCategory>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const query: PatientTimelineQueryDto = {
    category: selectedCategory,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
    sortOrder: 'desc',
  };

  const { events, pagination, isLoading, isError, error, refetch } =
    useDoctorPatientTimeline(patientId, query);

  const categories: Array<{ id: 'ALL' | TimelineEventCategory; label: string; icon: any }> = [
    { id: 'ALL', label: 'All Events', icon: History },
    { id: 'ENCOUNTER', label: 'Consultations', icon: User },
    { id: 'PRESCRIPTION', label: 'Prescriptions', icon: Pill },
    { id: 'LAB_REPORT', label: 'Laboratory Reports', icon: TestTube },
    { id: 'RECORD', label: 'Medical Records', icon: FileText },
    { id: 'APPOINTMENT', label: 'Appointments', icon: Calendar },
  ];

  const getCategoryIcon = (category: TimelineEventCategory) => {
    switch (category) {
      case 'ENCOUNTER':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'PRESCRIPTION':
        return <Pill className="h-4 w-4 text-teal-600" />;
      case 'LAB_REPORT':
        return <TestTube className="h-4 w-4 text-emerald-600" />;
      case 'RECORD':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-amber-600" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Tabs & Date Controls */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-muted/40 rounded-xl border border-border/60">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">Date Filter:</span>
          </div>
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-muted/30 text-xs rounded-lg px-2.5 py-1 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-muted/30 text-xs rounded-lg px-2.5 py-1 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {(startDate || endDate || selectedCategory !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedCategory('ALL');
                setPage(1);
              }}
              className="text-teal-600 dark:text-teal-400 hover:underline font-semibold ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <PatientEmptyState
          title="Timeline Unavailable"
          description={error?.message || 'Failed to load chronological clinical history.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : events.length === 0 ? (
        <PatientEmptyState
          icon={History}
          title="No Medical Timeline Events"
          description={
            selectedCategory !== 'ALL' || startDate || endDate
              ? 'No clinical records found for the selected filter and date range.'
              : 'Chronological clinical encounters, laboratory reports, and prescriptions will appear here as they are recorded.'
          }
        />
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
          {events.map((event) => (
            <div key={event.id} className="relative group">
              {/* Event Category Dot */}
              <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full bg-background border-2 border-teal-500 flex items-center justify-center text-foreground shadow-xs shrink-0 group-hover:scale-110 transition-transform">
                {getCategoryIcon(event.category)}
              </div>

              {/* Event Content Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-teal-500/40 transition-all shadow-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {event.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                      {event.badgeText}
                    </Badge>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDate(event.timestamp)}
                  </span>
                </div>

                {event.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {event.summary}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {event.source}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {event.responsibleProvider}
                    </span>
                  </div>

                  {event.actionUrl && (
                    <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs text-teal-600 gap-1 self-start sm:self-center">
                      <Link href={event.actionUrl}>
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} events)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
