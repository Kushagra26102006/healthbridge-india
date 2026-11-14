'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Calendar, User, FileText, ArrowRight, Printer, Edit3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrescriptionListItemDto } from '@healthbridge/shared-types';

interface PrescriptionCardProps {
  prescription: PrescriptionListItemDto;
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const isDraft = prescription.status === 'DRAFT';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
            Draft
          </Badge>
        );
      case 'ACTIVE':
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            Issued / Active
          </Badge>
        );
      case 'DISPENSED':
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
            Dispensed
          </Badge>
        );
      case 'DISCONTINUED':
        return (
          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
            Discontinued
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="text-[10px] bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const formattedDate = new Date(prescription.issuedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="border border-border/70 hover:border-border transition-all bg-card hover:shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-foreground">
                {prescription.prescriptionNumber}
              </span>
              {getStatusBadge(prescription.status)}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                <Pill className="h-3 w-3" />
                {prescription.medicationCount} {prescription.medicationCount === 1 ? 'medication' : 'medications'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-medium text-foreground">
                  Patient ID: {prescription.patientId.slice(-6).toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>{formattedDate}</span>
              </div>

              {prescription.facilityName && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-600" />
                  <span className="truncate max-w-[180px]">{prescription.facilityName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 self-end sm:self-center">
            {isDraft ? (
              <Link href={`/doctor/prescriptions/${prescription.id}/edit`}>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Draft
                </Button>
              </Link>
            ) : (
              <Link href={`/doctor/prescriptions/${prescription.id}#document`}>
                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
              </Link>
            )}

            <Link href={`/doctor/prescriptions/${prescription.id}`}>
              <Button size="sm" variant="default" className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                View Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}