import React from 'react';
import Link from 'next/link';
import { Pill, ArrowRight, User, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PharmacyPrescriptionQueueItemDto } from '@healthbridge/shared-types';

export interface PrescriptionQueuePreviewProps {
  prescriptions: PharmacyPrescriptionQueueItemDto[];
  onSelectPrescription?: (rx: PharmacyPrescriptionQueueItemDto) => void;
  className?: string;
}

export function PrescriptionQueuePreview({
  prescriptions,
  onSelectPrescription,
  className,
}: PrescriptionQueuePreviewProps) {
  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/80 bg-card/30">
        <Pill className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
        <h4 className="text-sm font-semibold text-foreground">No Pending Prescriptions</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Incoming doctor-issued prescriptions ready for verification and dispensing will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="pb-3 font-semibold">Prescription Ref</th>
              <th className="pb-3 font-semibold">Patient</th>
              <th className="pb-3 font-semibold">Prescriber</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Items</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {prescriptions.map((rx) => (
              <tr key={rx.id} className="hover:bg-muted/40 transition-colors group">
                <td className="py-3 font-mono font-medium text-foreground">
                  {rx.prescriptionNumber}
                </td>
                <td className="py-3 text-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{rx.patientName}</span>
                  </div>
                  {rx.patientPhone && (
                    <span className="text-[11px] text-muted-foreground block pl-5">
                      {rx.patientPhone}
                    </span>
                  )}
                </td>
                <td className="py-3 text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{rx.doctorName}</span>
                  </div>
                  {rx.doctorSpecialization && (
                    <span className="text-[11px] text-muted-foreground block pl-5">
                      {rx.doctorSpecialization}
                    </span>
                  )}
                </td>
                <td className="py-3 text-muted-foreground font-mono">
                  {new Date(rx.issueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {rx.itemCount} Meds
                  </Badge>
                </td>
                <td className="py-3">
                  <Badge
                    variant="secondary"
                    className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium text-[10px]"
                  >
                    {rx.status}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  {onSelectPrescription ? (
                    <button
                      onClick={() => onSelectPrescription(rx)}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <Link
                      href="/pharmacy/prescriptions"
                      className="px-2.5 py-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default PrescriptionQueuePreview;

