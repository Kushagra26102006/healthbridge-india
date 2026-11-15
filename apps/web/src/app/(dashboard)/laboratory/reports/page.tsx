'use client';

import React from 'react';
import { FileText, Clock } from 'lucide-react';

export default function LaboratoryReportsPage() {
  return (
    <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-xs max-w-xl mx-auto my-12 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center mx-auto">
        <FileText className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-base font-bold text-foreground">
          Diagnostic Reports & Result Publishing
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Result entry worklists, reference range evaluation, pathologist signature verification, and ABDM FHIR report publication will activate once specimens complete pre-analytical accessioning.
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300">
        <Clock className="w-3.5 h-3.5" />
        Pre-Analytical Accessioning in Progress
      </div>
    </div>
  );
}
