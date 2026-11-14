'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Printer,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePharmacyDispensingRecords } from '@/features/pharmacy/hooks/use-pharmacy';
import type { DispensingFilterDto } from '@healthbridge/shared-types';

export function DispensingHistoryTable() {
  const [filter, setFilter] = useState<DispensingFilterDto>({
    page: 1,
    limit: 15,
    status: 'ALL',
    search: '',
  });

  const { data, isLoading, error } = usePharmacyDispensingRecords(filter);

  const handleSearchChange = (val: string) => {
    setFilter((prev) => ({ ...prev, search: val, page: 1 }));
  };

  const handleStatusChange = (status: any) => {
    setFilter((prev) => ({ ...prev, status, page: 1 }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULLY_DISPENSED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Fully Dispensed
          </Badge>
        );
      case 'PARTIALLY_DISPENSED':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Partially Dispensed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-medium text-xs gap-1">
            <Ban className="w-3 h-3 text-slate-500" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Dispensing #, Rx #, patient..."
            value={filter.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {(['ALL', 'FULLY_DISPENSED', 'PARTIALLY_DISPENSED', 'CANCELLED'] as const).map(
            (st) => (
              <Button
                key={st}
                variant={filter.status === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(st)}
                className="h-8 text-xs font-normal"
              >
                {st === 'ALL'
                  ? 'All Records'
                  : st === 'FULLY_DISPENSED'
                  ? 'Fully Dispensed'
                  : st === 'PARTIALLY_DISPENSED'
                  ? 'Partially Dispensed'
                  : 'Cancelled'}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3 px-3 text-left">Dispensing #</th>
                <th className="py-3 px-3 text-left">Dispensed At</th>
                <th className="py-3 px-3 text-left">Prescription #</th>
                <th className="py-3 px-3 text-left">Patient</th>
                <th className="py-3 px-3 text-center">Items (Units)</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p>Loading dispensing history...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-destructive">
                    Failed to load dispensing records: {error.message}
                  </td>
                </tr>
              ) : !data?.items || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-medium text-sm">No dispensing records found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Completed prescription dispensations will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-foreground">
                      {record.dispensingNumber}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(record.dispensedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {record.prescriptionNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-foreground">{record.patientName}</div>
                      {record.patientPhone && (
                        <div className="text-[11px] text-muted-foreground">{record.patientPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-foreground">
                        {record.totalItems} items
                      </span>
                      <span className="text-muted-foreground ml-1">
                        ({record.totalQuantityDispensed} units)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-foreground">
                      ₹{record.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(record.dispensingStatus)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/pharmacy/dispensing/${record.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            title="View Record Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Button>
                        </Link>
                        <Link href={`/pharmacy/dispensing/${record.id}/receipt`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/5"
                            title="Print Dispensing Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t bg-muted/20 text-xs">
            <span className="text-muted-foreground">
              Showing Page {data.page} of {data.totalPages} ({data.total} total records)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={data.page <= 1}
                onClick={() => setFilter((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={data.page >= data.totalPages}
                onClick={() => setFilter((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DispensingHistoryTable;
