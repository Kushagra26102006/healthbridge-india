'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  Building2,
  Calendar,
  Clock,
  User,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLabOrderDetails } from '@/features/lab-reports/hooks/use-lab-reports';
import { getOrderStatusBadge } from '@/components/patient/lab-reports/LabOrderCard';
import { getCategoryBadge } from '@/components/patient/lab-reports/LabReportCard';

export default function PatientLabOrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const { order, isLoading, isError, refetch } = useLabOrderDetails(orderId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
          <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </Card>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Diagnostic Order Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The requested test order could not be located or you do not have permission to view it.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/patient/lab-orders">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Orders
            </Button>
          </Link>
          <Button variant="default" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const statusBadge = getOrderStatusBadge(order.status);
  const StatusIcon = statusBadge.icon;

  const formattedOrderDate = new Date(order.orderedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back Link */}
      <div>
        <Link href="/patient/lab-orders">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Diagnostic Orders</span>
          </Button>
        </Link>
      </div>

      {/* Main Order Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {order.orderNumber}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs flex items-center gap-1 font-medium ${statusBadge.bg}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{statusBadge.label}</span>
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 pt-1">
              <ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Diagnostic Requisition</span>
            </h1>
          </div>

          {order.reportId && (
            <Link href={`/patient/lab-reports/${order.reportId}`}>
              <Button size="sm" className="gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs">
                <FlaskConical className="h-4 w-4" />
                <span>View Generated Report</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Requisition Date</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{formattedOrderDate}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Sample Collection</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{order.collectionStatus || 'Pending Collection'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Ordering Doctor</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{order.doctorName || 'Attending Physician'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Fulfilling Facility</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{order.laboratoryName || 'Diagnostic Lab'}</span>
            </div>
          </div>
        </div>

        {/* Ordered Tests Section */}
        <div className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Requested Diagnostic Tests ({order.tests.length})</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {order.tests.map((test, idx) => {
              const categoryLabel = test.category ? getCategoryBadge(test.category) : null;
              return (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {test.testName}
                      </span>
                      {test.testCode && (
                        <span className="font-mono text-[10px] text-slate-400">({test.testCode})</span>
                      )}
                    </div>
                    {test.instructions && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" />
                        <span>{test.instructions}</span>
                      </p>
                    )}
                  </div>

                  {categoryLabel && (
                    <Badge variant="outline" className="text-[10px] w-fit font-medium border-slate-200 dark:border-slate-800">
                      {categoryLabel}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Clinical Notes */}
          {order.clinicalNotes && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Doctor Instructions / Clinical Indication:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {order.clinicalNotes}
              </p>
            </div>
          )}

          {/* Report Link CTA Banner */}
          {order.reportId && (
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Report Published and Verified</span>
                </div>
                <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80">
                  Quantitative observations and signed laboratory findings are ready for review.
                </p>
              </div>

              <Link href={`/patient/lab-reports/${order.reportId}`}>
                <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-teal-600 hover:bg-teal-700">
                  <span>Open Report</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
