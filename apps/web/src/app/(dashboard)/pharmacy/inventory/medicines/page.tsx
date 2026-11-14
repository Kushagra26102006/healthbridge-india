'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, ArrowLeft } from 'lucide-react';
import { usePharmacyMedicines } from '@/features/pharmacy/hooks/use-pharmacy';
import { MedicineTable } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';

export default function PharmacyMedicinesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [dosageForm, setDosageForm] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePharmacyMedicines({
    page,
    limit: 15,
    search: search || undefined,
    category: category !== 'ALL' ? category : undefined,
    dosageForm: dosageForm !== 'ALL' ? dosageForm : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master Pharmaceutical Formulations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Medicine Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deduplicated medicine records with strength, generic composition, dosage form, and regulatory schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pharmacy/inventory">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Inventory Home
            </Button>
          </Link>
          <Link href="/pharmacy/inventory/medicines/new">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Medicine
            </Button>
          </Link>
        </div>
      </div>

      <MedicineTable
        medicines={data?.items || []}
        total={data?.total || 0}
        page={page}
        limit={15}
        isLoading={isLoading}
        search={search}
        category={category}
        dosageForm={dosageForm}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onCategoryChange={(c) => {
          setCategory(c);
          setPage(1);
        }}
        onDosageFormChange={(f) => {
          setDosageForm(f);
          setPage(1);
        }}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
