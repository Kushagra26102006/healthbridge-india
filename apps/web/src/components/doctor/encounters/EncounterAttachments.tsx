'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Plus, ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface EncounterAttachmentsProps {
  encounterId: string;
  patientId: string;
  prescriptions?: Array<{
    id: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    instructions: string;
    issuedAt: string;
    status: string;
  }>;
  disabled?: boolean;
}

export function EncounterAttachments({
  encounterId,
  patientId,
  prescriptions = [],
  disabled = false,
}: EncounterAttachmentsProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Prescriptions & Orders
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Link digital prescriptions and diagnostic requisitions issued during this consultation
          </CardDescription>
        </div>

        {!disabled && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 h-8 border-dashed border-emerald-500/40 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50"
          >
            <Link
              href={`/doctor/prescriptions/new?encounterId=${encounterId}&patientId=${patientId}`}
              target="_blank"
            >
              <Plus className="h-3.5 w-3.5" />
              Write Prescription
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </Link>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {prescriptions.length === 0 ? (
          <div className="py-6 text-center space-y-2 border border-dashed border-border/70 rounded-xl bg-muted/10">
            <p className="text-xs text-muted-foreground">
              No digital prescriptions linked to this clinical encounter.
            </p>
            {!disabled && (
              <Button asChild size="sm" variant="outline" className="text-xs h-7 gap-1">
                <Link
                  href={`/doctor/prescriptions/new?encounterId=${encounterId}&patientId=${patientId}`}
                  target="_blank"
                >
                  <Plus className="h-3 w-3" />
                  Prescribe Medications
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-3 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Prescription #{rx.id.slice(-6).toUpperCase()}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600">
                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {rx.medications?.map((m) => `${m.name} (${m.dosage})`).join(', ') || 'Medication orders'}
                  </p>
                </div>

                <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-700">
                  <Link href={`/doctor/prescriptions/${rx.id}`} target="_blank">
                    <FileText className="h-3 w-3 mr-1" />
                    View Rx
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
