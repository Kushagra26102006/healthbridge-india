'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, PlusCircle, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PatientRecordsPage() {
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
              Health Records Repository
            </h2>
            <p className="text-xs text-muted-foreground">
              Consolidated medical records, OPD summaries, discharge cards, and diagnostic history
            </p>
          </div>
        </div>

        <Badge variant="abha" className="text-xs">
          ABDM Linked
        </Badge>
      </div>

      <Card className="border-border shadow-card bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Digital Health Records Navigation Shell
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                FHIR-compliant health data repository connected via Health Information Exchange
                (HIE-CM)
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Patient Dashboard Architecture Initialized</span>
            </div>
            <p>
              Your navigation framework and security context are active. Full interactive record
              filters, document upload, and FHIR resource viewers will be connected in the
              subsequent records workflow task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">OPD Consultations</span>
              <p className="text-muted-foreground text-[11px]">
                Doctor consultation notes and clinical observations.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Discharge Summaries</span>
              <p className="text-muted-foreground text-[11px]">
                Inpatient hospital summaries and treatment plans.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Immunization Cards</span>
              <p className="text-muted-foreground text-[11px]">
                Vaccination certificates and preventative logs.
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
          <Button variant="teal" size="sm" className="text-xs gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            Upload New Record
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
