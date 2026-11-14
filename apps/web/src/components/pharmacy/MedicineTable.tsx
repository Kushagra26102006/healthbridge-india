'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Pill,
  Building2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MedicineCatalogItemDto } from '@healthbridge/shared-types';

export interface MedicineTableProps {
  medicines: MedicineCatalogItemDto[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  search: string;
  category: string;
  dosageForm: string;
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onDosageFormChange: (val: string) => void;
  onPageChange: (newPage: number) => void;
  onViewDetails?: (med: MedicineCatalogItemDto) => void;
}

export function MedicineTable({
  medicines,
  total,
  page,
  limit,
  isLoading = false,
  search,
  category,
  dosageForm,
  onSearchChange,
  onCategoryChange,
  onDosageFormChange,
  onPageChange,
  onViewDetails,
}: MedicineTableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  const categories = ['ALL', 'Analgesic', 'Antibiotic', 'Antidiabetic', 'Cardiovascular', 'Respiratory', 'Gastrointestinal', 'General'];
  const dosageForms = ['ALL', 'TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER'];

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 flex flex-wrap gap-2.5 items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, generic, brand, or manufacturer..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Categories</option>
              {categories.filter((c) => c !== 'ALL').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={dosageForm}
              onChange={(e) => onDosageFormChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Forms</option>
              {dosageForms.filter((f) => f !== 'ALL').map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Link href="/pharmacy/inventory/medicines/new">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium gap-2 text-xs h-9">
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Medicine &amp; Strength</th>
                <th className="py-3 px-4">Generic Name</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Dosage Form</th>
                <th className="py-3 px-4">Category / Schedule</th>
                <th className="py-3 px-4 text-center">Rx Required</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading medicine catalogue...</p>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Pill className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No medicines found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try adjusting your search or filters' : 'Add your first medicine to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                medicines.map((med) => (
                  <tr
                    key={med.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {med.brandName || med.name}
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {med.strength}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {med.name !== med.brandName ? med.name : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {med.genericName}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {med.manufacturer}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {med.dosageForm}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {med.category || med.therapeuticClass || 'General'}
                      </div>
                      <div className="text-[10px] text-slate-400">{med.schedule || 'Schedule H'}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {med.requiresPrescription ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                          <ShieldAlert className="w-3 h-3" /> Rx
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                          OTC
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {med.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onViewDetails ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(med)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600"
                            title="Quick View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        ) : null}
                        <Link href={`/pharmacy/inventory/medicines/${med.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600"
                            title="Edit Medicine"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <span className="font-medium text-slate-800 dark:text-slate-200">{medicines.length}</span> of{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">{total}</span> medicines
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-7 text-xs px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-7 text-xs px-2.5"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MedicineTable;
