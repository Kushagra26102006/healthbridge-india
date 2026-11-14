'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  ChevronRight,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsentPermissionList } from './ConsentPermissionList';
import { ConsentEmptyState } from './ConsentEmptyState';
import { CONSENT_PURPOSE_LABELS } from '@healthbridge/config';
import type { ConsentListItemDto } from '@healthbridge/shared-types';

export interface ActiveConsentListProps {
  activeConsents: ConsentListItemDto[];
  onRevokeClick: (consent: ConsentListItemDto) => void;
  isLoading?: boolean;
}

export const ActiveConsentList: React.FC<ActiveConsentListProps> = ({
  activeConsents,
  onRevokeClick,
}) => {
  if (activeConsents.length === 0) {
    return (
      <ConsentEmptyState
        title="No active permissions"
        description="You have not granted active data access permissions to any healthcare provider."
        actionText="Review Pending Requests"
        actionHref="/patient/consent/requests"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeConsents.map((consent) => {
          const expiresDate = new Date(consent.expiresAt);
          const daysLeft = Math.ceil(
            (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

          const formattedExpiry = expiresDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <Card
              key={consent.id}
              className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {consent.organization}
                      </h4>
                      {consent.doctorName && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{consent.doctorName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs shrink-0"
                  >
                    Active
                  </Badge>
                </div>

                {/* Purpose */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Purpose:
                  </span>
                  <p className="text-[11px] mt-0.5 line-clamp-2">
                    {consent.purposeDescription ||
                      CONSENT_PURPOSE_LABELS[consent.purpose] ||
                      consent.purpose}
                  </p>
                </div>

                {/* Granted categories */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Granted Categories:
                  </span>
                  <ConsentPermissionList categories={consent.requestedDataTypes} />
                </div>
              </div>

              {/* Expiry & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Expires: {formattedExpiry}</span>
                  </div>

                  {isExpiringSoon && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-[10px] flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>{daysLeft} days left</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link href={`/patient/consent/${consent.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 px-2 text-slate-600 dark:text-slate-400 gap-1 hover:text-slate-900"
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevokeClick(consent)}
                    className="text-xs h-8 px-3 rounded-lg border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400"
                  >
                    Revoke Access
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
