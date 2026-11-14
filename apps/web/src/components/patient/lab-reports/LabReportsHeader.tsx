'use client';

import React from 'react';
import Link from 'next/link';
import { FlaskConical, ArrowLeft, ShieldCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface LabReportsHeaderProps {
  title?: string;
  description?: string;
  showBackToDashboard?: boolean;
}

export const LabReportsHeader: React.FC<LabReportsHeaderProps> = ({
  title = 'My Laboratory Reports',
  description = 'Access your available diagnostic reports and laboratory test history.',
  showBackToDashboard = true,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        {showBackToDashboard && (
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-0.5 sm:mt-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>{title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs flex items-center gap-1 font-medium py-1 px-2.5 rounded-lg"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>NABL Accredited</span>
        </Badge>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800"
        >
          <Link href="/patient/lab-orders">
            <ClipboardList className="h-3.5 w-3.5 mr-1 text-teal-600" />
            Diagnostic Orders
          </Link>
        </Button>
      </div>
    </div>
  );
};
