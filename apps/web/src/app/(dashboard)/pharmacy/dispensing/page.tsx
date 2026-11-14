'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { DispensingWorkspace } from '@/components/pharmacy/DispensingWorkspace';
import { usePharmacyPrescriptionQueue } from '@/features/pharmacy/hooks/use-pharmacy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pill,
  Search,
  History,
  ArrowRight,
  ShieldCheck,
  User,
  Stethoscope,
} from 'lucide-react';

function DispensingConsoleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prescriptionId = searchParams.get('prescriptionId');

  const [searchQuery, setSearchQuery] = useState('');
  const { data: queueData, isLoading } = usePharmacyPrescriptionQueue({
    status: 'ACTIVE',
    search: searchQuery || undefined,
  });

  if (prescriptionId) {
    return (
      <div className="space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dispensing Workspace</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Prescription Dispensing Console
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              FEFO batch matching, remaining quantity verification, and immutable stock ledger deduction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/pharmacy/dispensing')}
              className="text-xs"
            >
              Select Different Prescription
            </Button>
            <Link href="/pharmacy/dispensing/history">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                <History className="w-3.5 h-3.5" />
                Dispensing History
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Dispensing Workspace */}
        <DispensingWorkspace prescriptionId={prescriptionId} />
      </div>
    );
  }

  // If no prescriptionId is provided, show selector / active queue
  const items = queueData?.items || [];
  const filteredItems = searchQuery
    ? items.filter(
        (i) =>
          i.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.patientName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <Pill className="w-3.5 h-3.5" />
            <span>Dispensing Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Prescription Dispensing Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Select an active e-prescription to verify validity, match FEFO inventory batches, and log stock deduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pharmacy/dispensing/history">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <History className="w-3.5 h-3.5" />
              View Dispensing History
            </Button>
          </Link>
        </div>
      </div>

      {/* Prescription Picker Search Bar */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold">
            Select Active Prescription for Dispensing
          </CardTitle>
          <CardDescription className="text-xs">
            Search authorized patient prescriptions awaiting fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Rx # or patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading active prescriptions...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground border border-dashed rounded-lg">
              <Pill className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-medium text-sm">No pending prescriptions found</p>
              <p className="text-xs mt-1">
                All authorized prescriptions have either been fulfilled or expired.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((rx) => (
                <div
                  key={rx.id}
                  className="p-3.5 rounded-lg border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-foreground">
                        #{rx.prescriptionNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {rx.itemCount} item{rx.itemCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>{rx.patientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Stethoscope className="w-3 h-3 text-muted-foreground" />
                        <span>{rx.doctorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Valid until {new Date(rx.validUntil).toLocaleDateString('en-IN')}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/pharmacy/dispensing?prescriptionId=${rx.id}`)}
                      className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Dispense Stock
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PharmacyDispensingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dispensing console...</p>
        </div>
      }
    >
      <DispensingConsoleContent />
    </Suspense>
  );
}
