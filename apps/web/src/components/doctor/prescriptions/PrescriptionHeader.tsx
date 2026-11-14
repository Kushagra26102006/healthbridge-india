'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Plus, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrescriptionHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PrescriptionHeader({
  onRefresh,
  isRefreshing = false,
}: PrescriptionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Pill className="h-4 w-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            My Prescriptions
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Create, review and manage your digital prescriptions.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/doctor/medications/catalog">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/80">
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Medication Catalog</span>
          </Button>
        </Link>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs border-border/80"
            title="Refresh prescriptions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}

        <Link href="/doctor/prescriptions/new">
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Plus className="h-3.5 w-3.5" />
            New Prescription
          </Button>
        </Link>
      </div>
    </div>
  );
}