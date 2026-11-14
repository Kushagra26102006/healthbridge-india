'use client';

import React from 'react';
import Link from 'next/link';
import {
  Pill,
  Building2,
  ShieldAlert,
  ArrowDownToLine,
  Edit2,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MedicineCatalogItemDto } from '@healthbridge/shared-types';

export interface MedicineDetailsProps {
  medicine: MedicineCatalogItemDto;
  onEdit?: () => void;
}

export function MedicineDetails({ medicine, onEdit }: MedicineDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {medicine.brandName || medicine.name}
                </h1>
                <Badge variant="outline" className="text-xs font-mono bg-slate-50 dark:bg-slate-800">
                  {medicine.strength}
                </Badge>
                <Badge className="bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-xs">
                  {medicine.dosageForm}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {medicine.genericName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/pharmacy/inventory/stock-in?medicationId=${medicine.id}`}>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5 h-9">
                <ArrowDownToLine className="w-3.5 h-3.5" /> Stock-In Batch
              </Button>
            </Link>
            {onEdit ? (
              <Button variant="outline" size="sm" onClick={onEdit} className="text-xs h-9 gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clinical Specs */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-500" />
              Clinical Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Brand Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.brandName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Generic Composition</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.genericName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Strength / Potency</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.strength}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Route of Administration</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.route || 'Oral'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Therapeutic Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.category || 'General'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Prescription Requirement</span>
              {medicine.requiresPrescription ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-3 h-3" /> Schedule Prescription (Rx)
                </span>
              ) : (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Over-the-Counter (OTC)</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing & Commercial Specs */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-500" />
              Manufacturing &amp; Packaging
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Manufacturer</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.manufacturer}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Standard Pack Size</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.packSize || 'Standard Pack'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Unit of Measurement</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{medicine.unitOfMeasurement || 'Unit'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Drug Schedule</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{medicine.schedule || 'Schedule H'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Catalogue Status</span>
              {medicine.isActive !== false ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Active for Dispensing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                  <XCircle className="w-3 h-3" /> Inactive
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {medicine.composition && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold">Active Composition &amp; Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
            {medicine.composition}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default MedicineDetails;
