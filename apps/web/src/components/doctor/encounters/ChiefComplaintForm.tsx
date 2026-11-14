'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface ChiefComplaintFormProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function ChiefComplaintForm({
  value,
  onChange,
  disabled = false,
}: ChiefComplaintFormProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground">
            Chief Complaint & Presenting Symptoms
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {value.length}/2000 characters
          </span>
        </div>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Document the patient&apos;s primary reason for consultation in their own words or clinical summary
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-1">
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Acute chest discomfort for 2 days, radiating to left shoulder, exacerbated on exertion..."
          className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
          maxLength={2000}
        />
      </CardContent>
    </Card>
  );
}
