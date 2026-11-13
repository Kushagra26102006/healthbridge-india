'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface RecordsHeaderProps {
  totalCount: number;
  onUploadClick: () => void;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
}

export function RecordsHeader({
  totalCount,
  onUploadClick,
  onRefreshClick,
  isRefreshing = false,
}: RecordsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3">
        <Link href="/patient/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            title="Return to Patient Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              My Health Records
            </h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
              {totalCount} {totalCount === 1 ? 'Record' : 'Records'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            View and manage your available digital health information.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Badge variant="abha" className="hidden lg:flex text-xs py-1 gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>ABDM Verified</span>
        </Badge>

        {onRefreshClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshClick}
            disabled={isRefreshing}
            className="text-xs h-9 px-3 gap-1.5"
            title="Refresh Health Records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}

        <Button
          variant="teal"
          size="sm"
          onClick={onUploadClick}
          className="text-xs h-9 px-3.5 gap-1.5 shadow-sm"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Upload Record
        </Button>
      </div>
    </div>
  );
}

export default RecordsHeader;
