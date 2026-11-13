'use client';

import React from 'react';
import Link from 'next/link';
import { FlaskConical, ArrowLeft, ShieldCheck, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PatientLabReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Laboratory & Diagnostic Reports
            </h2>
            <p className="text-xs text-muted-foreground">
              Blood tests, imaging reports, pathology results, and diagnostic observations
            </p>
          </div>
        </div>

        <Badge variant="abha" className="text-xs">
          NABL Accredited
        </Badge>
      </div>

      <Card className="border-border shadow-card bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Diagnostic Reports Shell
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Standardized lab observations with reference ranges and abnormal flags
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Laboratory Architecture Connected</span>
            </div>
            <p>
              Your security and role tokens have been authenticated. Trend graphs, reference range
              comparisons, and PDF export workflows will be unlocked in the diagnostic laboratory
              integration task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Pathology Tests</span>
              <p className="text-muted-foreground text-[11px]">
                CBC, lipid profiles, HbA1c, and metabolic panels.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Diagnostic Imaging</span>
              <p className="text-muted-foreground text-[11px]">
                X-ray, MRI, CT scans, and sonography reports.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Microbiology</span>
              <p className="text-muted-foreground text-[11px]">
                Cultures, viral panels, and antibiotic sensitivities.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-border pt-4">
          <Link href="/patient/dashboard">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <FileCheck className="h-3.5 w-3.5" />
            Check Pending Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
