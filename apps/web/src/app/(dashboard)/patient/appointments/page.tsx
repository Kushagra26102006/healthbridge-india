'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft, Plus, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PatientAppointmentsPage() {
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
              Clinical Appointments
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage doctor consultations, physical hospital visits, and teleconsultation slots
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="text-xs">
          Real-Time Scheduling
        </Badge>
      </div>

      <Card className="border-border shadow-card bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Appointments Management Shell
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Verified healthcare practitioner calendar and slot booking
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Appointments Architecture Active</span>
            </div>
            <p>
              Your authenticated session is established. Interactive doctor search, live clinic slot
              selection, and video teleconsultation features will be fully bound in the dedicated
              appointment workflow task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>OPD Doctor Visits</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Pre-book consultation tokens at registered clinics and community health centers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Virtual Teleconsultations</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Connect with specialists from the comfort of your home using e-Sanjeevani
                guidelines.
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
            <Plus className="h-3.5 w-3.5" />
            Book Consultation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
