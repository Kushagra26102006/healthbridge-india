'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import {
  Package,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface FulfillmentProgressProps {
  order: PharmacyOrderDto;
  onLinkDispensingRecord?: (dispensingRecordId: string) => Promise<void>;
  isLinking?: boolean;
}

export function FulfillmentProgress({
  order,
  onLinkDispensingRecord,
  isLinking = false,
}: FulfillmentProgressProps) {
  const [dispensingInputId, setDispensingInputId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const totalItemsCount = order.items?.length || 0;
  const fulfilledItemsCount =
    order.items?.filter((it) => it.fulfillmentStatus === 'FULFILLED').length || 0;
  const progressPercent =
    totalItemsCount > 0 ? Math.round((fulfilledItemsCount / totalItemsCount) * 100) : 0;

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!dispensingInputId.trim()) {
      setErrorMsg('Please enter a valid Dispensing Record ID');
      return;
    }

    try {
      if (onLinkDispensingRecord) {
        await onLinkDispensingRecord(dispensingInputId.trim());
        setSuccessMsg('Dispensing record linked successfully!');
        setDispensingInputId('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to link dispensing record');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
      {/* Header & Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Fulfillment Progress</h3>
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {fulfilledItemsCount} of {totalItemsCount} Medications Fulfilled ({progressPercent}%)
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : progressPercent > 0
                ? 'bg-sky-500'
                : 'bg-slate-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Item-by-Item Status Card */}
      <div className="space-y-2">
        {order.items?.map((it, idx) => {
          const reqQty = it.requestedQuantity || it.quantity;
          const fulQty = it.fulfilledQuantity || 0;
          const remQty = it.remainingQuantity !== undefined ? it.remainingQuantity : reqQty;
          const isComplete = it.fulfillmentStatus === 'FULFILLED';

          return (
            <div
              key={it.id || idx}
              className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                isComplete
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : fulQty > 0
                  ? 'bg-sky-50/40 border-sky-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">{it.medicationName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {it.strength} • {it.dosageForm}
                  {it.batchNumber && (
                    <span className="ml-2 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                      Batch: {it.batchNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-slate-900 font-medium">
                    {fulQty} / {reqQty} units
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {remQty > 0 ? `${remQty} remaining` : 'Complete'}
                  </div>
                </div>

                {isComplete ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Fulfilled
                  </span>
                ) : fulQty > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-100/60 px-2.5 py-1 rounded-full">
                    Partial
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200/60 px-2.5 py-1 rounded-full">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical Dispensing Link Banner */}
      <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 space-y-3 text-xs">
        <div className="flex items-start gap-2.5 text-sky-900">
          <FileCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sky-950">
              Integrated Dispensing & Inventory Allocation
            </div>
            <p className="text-sky-800 text-[11px] mt-0.5">
              Stock deductions occur strictly through the clinical dispensing workflow. Perform batch
              matching and verified stock reduction in the Dispensing Console, then link the
              resulting record below.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.prescriptionId && (
            <Link
              href={`/pharmacy/dispensing?prescriptionId=${order.prescriptionId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Dispensing Console for Prescription
            </Link>
          )}

          {order.dispensingRecordIds && order.dispensingRecordIds.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-800">Linked Dispensing Records:</span>
              {order.dispensingRecordIds.map((recId) => (
                <Link
                  key={recId}
                  href={`/pharmacy/dispensing/${recId}`}
                  className="font-mono text-sky-600 hover:underline hover:text-sky-800"
                >
                  [{recId.slice(-6)}]
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Link Dispensing Record Form */}
        {onLinkDispensingRecord && (
          <form onSubmit={handleLinkSubmit} className="pt-2 border-t border-sky-100 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Paste Dispensing Record ID (from completed dispensing)..."
              value={dispensingInputId}
              onChange={(e) => setDispensingInputId(e.target.value)}
              className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isLinking || !dispensingInputId.trim()}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{isLinking ? 'Linking...' : 'Link Dispensing'}</span>
            </button>
          </form>
        )}

        {errorMsg && (
          <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

