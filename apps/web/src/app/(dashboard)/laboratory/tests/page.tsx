'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useLabTests,
  useToggleLabTestStatus,
} from '@/features/laboratory/hooks/use-laboratory';
import { SpecimenTypeBadge } from '@/components/laboratory';
import {
  TestTube2,
  Plus,
  Search,
  Clock,
  Eye,
} from 'lucide-react';
import type { LabTestCategory, SpecimenType } from '@healthbridge/shared-types';

const CATEGORIES: LabTestCategory[] = [
  'BIOCHEMISTRY',
  'HEMATOLOGY',
  'CLINICAL_PATHOLOGY',
  'MICROBIOLOGY',
  'SEROLOGY',
  'IMMUNOLOGY',
  'MOLECULAR_DIAGNOSTICS',
  'RADIOLOGY',
  'BLOOD_TESTS',
  'URINE_TESTS',
  'IMAGING',
  'OTHER',
];

export default function LabTestCataloguePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpecimen, setSelectedSpecimen] = useState<string>('');

  const { data: tests, isLoading } = useLabTests({
    search: search.trim() || undefined,
    category: (selectedCategory as LabTestCategory) || undefined,
    specimenType: (selectedSpecimen as SpecimenType) || undefined,
  });

  const toggleStatusMutation = useToggleLabTestStatus();

  const handleToggleActive = async (testId: string, currentStatus: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({
        testId,
        isActive: !currentStatus,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update test status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <TestTube2 className="w-6 h-6 text-teal-600" />
            Diagnostic Test Catalogue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage test profiles, pre-analytical specimen requirements, fasting rules, and turnaround times
          </p>
        </div>

        <Link
          href="/laboratory/tests/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Diagnostic Test
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test name or test code (e.g. CBC, LFT, Lipid)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-xl bg-background border border-border px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedSpecimen}
            onChange={(e) => setSelectedSpecimen(e.target.value)}
            className="text-xs rounded-xl bg-background border border-border px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Specimens</option>
            <option value="BLOOD">BLOOD</option>
            <option value="SERUM">SERUM</option>
            <option value="PLASMA">PLASMA</option>
            <option value="URINE">URINE</option>
            <option value="STOOL">STOOL</option>
            <option value="SWAB">SWAB</option>
            <option value="SPUTUM">SPUTUM</option>
            <option value="CSF">CSF</option>
            <option value="BIOPSY">BIOPSY</option>
          </select>
        </div>
      </div>

      {/* Test Catalogue Table */}
      <div className="rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Loading diagnostic test catalogue...
            </div>
          ) : !tests || tests.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <TestTube2 className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                No diagnostic tests found matching your criteria.
              </p>
              <Link
                href="/laboratory/tests/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-500/10 rounded-xl hover:bg-teal-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Test
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Test Code & Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Specimen Type</th>
                  <th className="py-3 px-4">Fasting Rule</th>
                  <th className="py-3 px-4">TAT</th>
                  <th className="py-3 px-4">Price (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-xs">
                          {test.testName}
                        </span>
                        <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                          {test.testCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                        {test.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <SpecimenTypeBadge specimenType={test.specimenType} />
                    </td>
                    <td className="py-3 px-4">
                      {test.fastingRequirement ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {test.fastingDurationHours
                            ? `${test.fastingDurationHours}h Fasting`
                            : 'Fasting Required'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">No Fasting</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {test.expectedTurnaroundTime}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      ₹{test.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(test.id, test.isActive)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          test.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                        title="Click to toggle status"
                      >
                        {test.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/laboratory/tests/${test.id}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-600 hover:bg-muted transition-colors inline-block"
                        title="View details & parameters"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
