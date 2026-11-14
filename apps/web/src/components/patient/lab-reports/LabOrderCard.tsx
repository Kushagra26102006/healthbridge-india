'use client';

import React from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FlaskConical,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LabOrderListItemDto, LabOrderStatus } from '@healthbridge/shared-types';

export interface LabOrderCardProps {
  order: LabOrderListItemDto;
}

export const getOrderStatusBadge = (status: LabOrderStatus) => {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Completed & Report Ready',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'IN_ANALYSIS':
      return {
        label: 'Processing / In Analysis',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: Clock,
      };
    case 'SAMPLE_COLLECTED':
      return {
        label: 'Sample Collected',
        bg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
        icon: FlaskConical,
      };
    case 'ORDERED':
      return {
        label: 'Order Placed',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Clock,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: AlertCircle,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: ClipboardList,
      };
  }
};

export const LabOrderCard: React.FC<LabOrderCardProps> = ({ order }) => {
  const statusInfo = getOrderStatusBadge(order.status);
  const StatusIcon = statusInfo.icon;

  const formattedDate = new Date(order.orderedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            <span>{statusInfo.label}</span>
          </Badge>

          <span className="font-mono text-xs text-slate-400">{order.orderNumber}</span>
        </div>

        {/* Requested Tests */}
        <div className="space-y-1.5">
          <Link
            href={`/patient/lab-orders/${order.id}`}
            className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors line-clamp-1 block"
          >
            {order.tests.map((t) => t.testName).join(', ')}
          </Link>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400">
            <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">Ordered by {order.doctorName}</span>
          </div>

          {order.laboratoryName && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{order.laboratoryName}</span>
            </div>
          )}
        </div>

        {/* Status Highlights */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>Ordered on {formattedDate}</span>
          </div>

          <div className="text-[11px] font-medium text-slate-500">
            Collection: <span className="text-slate-800 dark:text-slate-200">{order.collectionStatus || 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <Link href={`/patient/lab-orders/${order.id}`}>
            <span>View Order Details</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>

        {order.reportAvailable && order.reportId && (
          <Button
            size="sm"
            asChild
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3 rounded-lg font-medium shadow-sm flex items-center space-x-1"
          >
            <Link href={`/patient/lab-reports/${order.reportId}`}>
              <span>View Report</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
};
