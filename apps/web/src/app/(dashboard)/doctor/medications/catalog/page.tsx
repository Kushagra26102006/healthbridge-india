'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Pill,
  Plus,
  Building2,
  ShieldAlert,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicationCatalogSearch } from '@/components/doctor/prescriptions';
import { useMedicationCatalog } from '@/features/doctor/hooks/use-doctor';

export default function DoctorMedicationCatalogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dosageForm, setDosageForm] = useState('ALL');

  const { catalog, meta, isLoading } = useMedicationCatalog({
    page,
    limit: 12,
    search: search.trim() || undefined,
    dosageForm: dosageForm !== 'ALL' ? dosageForm : undefined,
  });

  const currentPage = meta?.page || 1;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total || catalog.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Pharmaceutical Catalog
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Reference database of approved Indian pharmaceuticals, generic compositions, strengths, and dosage forms
          </p>
        </div>

        <Link href="/doctor/prescriptions/new">
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Plus className="h-3.5 w-3.5" />
            New Prescription
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-xs">
        <MedicationCatalogSearch
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          dosageForm={dosageForm}
          onDosageFormChange={(val) => {
            setDosageForm(val);
            setPage(1);
          }}
          placeholder="Search by generic name, brand name, or therapeutic class (e.g. Paracetamol, Augmentin, Metformin)..."
        />
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-border/60 bg-card animate-pulse p-4 space-y-3">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted/60 rounded" />
              <div className="h-10 bg-muted/40 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : catalog.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-3">
          <Pill className="h-6 w-6 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No pharmaceuticals found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No medication catalog entries match your query. Try searching by generic name (e.g. Paracetamol, Telmisartan).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((item) => (
            <Card
              key={item.id}
              className="border border-border/70 hover:border-border transition-all bg-card hover:shadow-xs flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-xs text-foreground line-clamp-1">
                      {item.name}
                    </h3>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {item.dosageForm}
                    </Badge>
                  </div>

                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {item.genericName}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                      {item.strength}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Route: {item.route}
                    </Badge>
                    {item.schedule.includes('H1') ? (
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300">
                        <ShieldAlert className="h-2.5 w-2.5 mr-0.5 inline" />
                        Schedule H1
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {item.schedule}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 shrink-0 text-zinc-500" />
                    <span className="truncate">{item.manufacturer}</span>
                  </div>
                  <div>
                    <span className="text-foreground/80 font-medium">Packaging: </span>
                    <span>{item.packageSize}</span>
                  </div>
                  {item.therapeuticClass && (
                    <div>
                      <span className="text-foreground/80 font-medium">Therapeutic Class: </span>
                      <span>{item.therapeuticClass}</span>
                    </div>
                  )}
                  {item.instructionsHint && (
                    <div className="italic text-[10px] text-zinc-500 bg-muted/20 p-2 rounded-lg">
                      &bull; {item.instructionsHint}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link href={`/doctor/prescriptions/new?medId=${item.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <Plus className="h-3 w-3" />
                      Prescribe Medication
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * (meta?.limit || 12) + 1} to{' '}
            {Math.min(currentPage * (meta?.limit || 12), totalItems)} of {totalItems} items
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="h-8 text-xs gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}