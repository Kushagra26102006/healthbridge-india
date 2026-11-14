'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  usePharmacyDispensingRecord,
  useCancelPharmacyDispensing,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Printer,
  Ban,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  Building2,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

export default function DispensingRecordDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: record, isLoading, error } = usePharmacyDispensingRecord(id);
  const cancelMutation = useCancelPharmacyDispensing();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [restoreStock, setRestoreStock] = useState(true);
  const [quarantineStock, setQuarantineStock] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading dispensing record details...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <Card className="max-w-xl mx-auto my-8 border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h3 className="text-base font-semibold text-destructive">Dispensing Record Not Found</h3>
          <p className="text-xs text-muted-foreground">
            {error?.message || 'Unable to retrieve dispensing record.'}
          </p>
          <Link href="/pharmacy/dispensing/history">
            <Button variant="outline" size="sm">
              Back to History
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleCancelRecord = async () => {
    if (!cancellationReason.trim()) {
      setCancelError('Please specify a valid reason for cancellation.');
      return;
    }
    setCancelError(null);

    try {
      await cancelMutation.mutateAsync({
        id: record.id,
        dto: {
          reason: cancellationReason.trim(),
          restoreToInventory: restoreStock,
          quarantineRestoredStock: quarantineStock,
        },
      });
      setCancelModalOpen(false);
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || err?.message || 'Failed to cancel record');
    }
  };

  const isCancelled = record.dispensingStatus === 'CANCELLED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/pharmacy/dispensing/history">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              History
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                Dispensing #{record.dispensingNumber}
              </h1>
              {isCancelled ? (
                <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-medium text-xs gap-1">
                  <Ban className="w-3 h-3 text-slate-500" />
                  Cancelled
                </Badge>
              ) : record.dispensingStatus === 'FULLY_DISPENSED' ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Fully Dispensed
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Partially Dispensed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Dispensed on {new Date(record.dispensedAt).toLocaleString('en-IN')} by{' '}
              {record.dispenserName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel Dispensation
            </Button>
          )}
          <Link href={`/pharmacy/dispensing/${record.id}/receipt`}>
            <Button size="sm" className="text-xs gap-1.5 font-semibold">
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </Button>
          </Link>
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3 text-xs text-destructive">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Dispensation Cancelled</p>
              <p className="mt-0.5">
                Reason: {record.cancellationReason || 'Cancelled by authorized pharmacist'}
              </p>
              {record.cancelledAt && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Cancelled on {new Date(record.cancelledAt).toLocaleString('en-IN')} by{' '}
                  {record.cancelledByName || 'Pharmacist'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Patient Information</span>
          </div>
          <p className="font-bold text-sm text-foreground">{record.patientName}</p>
          <p className="text-muted-foreground">
            {record.patientAge ? `${record.patientAge} Years` : 'Age N/A'} •{' '}
            {record.patientGender || 'Gender N/A'}
          </p>
          {record.patientPhone && (
            <p className="text-muted-foreground">Phone: {record.patientPhone}</p>
          )}
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-primary" />
            <span>Prescribing Doctor</span>
          </div>
          <p className="font-bold text-sm text-foreground">{record.doctorName}</p>
          <p className="text-muted-foreground">
            {record.doctorSpecialization || 'Treating Physician'}
          </p>
          <p className="text-muted-foreground font-mono">
            Rx #: {record.prescriptionNumber}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Dispensing Pharmacy & License</span>
          </div>
          <p className="font-bold text-sm text-foreground">{record.pharmacyName}</p>
          <p className="text-muted-foreground">
            Lic #: {record.pharmacyLicenseNumber || 'DL-PENDING'}
          </p>
          <p className="text-muted-foreground">Pharmacist: {record.dispenserName}</p>
        </Card>
      </div>

      {/* Dispensed Items Table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Dispensed Items ({record.items.length})</span>
            <Badge variant="secondary" className="font-bold text-xs">
              Total Units: {record.totalQuantityDispensed}
            </Badge>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3 text-left">Medicine</th>
                <th className="py-2.5 px-3 text-left">Batch No.</th>
                <th className="py-2.5 px-3 text-left">Expiry</th>
                <th className="py-2.5 px-3 text-right">Prescribed</th>
                <th className="py-2.5 px-3 text-right">Dispensed</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {record.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-muted/10">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground block">{it.medicationName}</span>
                    {it.genericName && it.genericName !== it.medicationName && (
                      <span className="text-[11px] text-muted-foreground block">
                        ({it.genericName})
                      </span>
                    )}
                    <span className="text-muted-foreground text-[11px]">
                      {it.dosageForm} • {it.strength}
                    </span>
                    {it.dosageInstructions && (
                      <span className="text-emerald-700 italic text-[11px] block mt-0.5">
                        Sig: {it.dosageInstructions}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-foreground">
                    {it.batchNumber}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {new Date(it.batchExpiryDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-3 text-right text-muted-foreground">
                    {it.prescribedQuantity}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">
                    {it.quantityDispensed}
                  </td>
                  <td className="py-3 px-3 text-right text-muted-foreground">
                    ₹{it.sellingPriceSnapshot.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">
                    ₹{it.itemTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t font-semibold">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 text-left">
                  Grand Total
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-primary">
                  {record.totalQuantityDispensed}
                </td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-right font-bold text-sm text-foreground">
                  ₹{record.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Pharmacist Remarks */}
      {record.notes && (
        <Card className="p-4 bg-muted/20 border-border">
          <span className="font-semibold text-xs text-foreground block mb-1">
            Pharmacist Notes:
          </span>
          <p className="text-xs text-muted-foreground">{record.notes}</p>
        </Card>
      )}

      {/* Cancel Modal Overlay */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-destructive font-bold text-base">
                <Ban className="w-4 h-4" />
                <span>Cancel Dispensing Record</span>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelMutation.isPending}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500">
                Cancelling is an auditable action. Provide a valid reason and select restitution options.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                  Reason for Cancellation <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Dispensing error, incorrect batch, patient refusal..."
                  value={cancellationReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCancellationReason(e.target.value)
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="restore-stock"
                    checked={restoreStock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRestoreStock(e.target.checked)
                    }
                    className="w-4 h-4 rounded text-primary border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="restore-stock" className="text-xs font-medium cursor-pointer">
                    Restore dispensed quantities back to inventory batches
                  </label>
                </div>

                {restoreStock && (
                  <div className="flex items-center gap-2 pl-6">
                    <input
                      type="checkbox"
                      id="quarantine-stock"
                      checked={quarantineStock}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQuarantineStock(e.target.checked)
                      }
                      className="w-4 h-4 rounded text-primary border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="quarantine-stock" className="text-xs text-muted-foreground cursor-pointer">
                      Quarantine restored stock pending pharmacist QA inspection
                    </label>
                  </div>
                )}
              </div>

              {cancelError && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                  {cancelError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelMutation.isPending}
              >
                Keep Record
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleCancelRecord}
                disabled={cancelMutation.isPending}
                className="gap-1.5"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    Confirm Cancellation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
