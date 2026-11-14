'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsNav, DoctorSecuritySettings } from '@/components/doctor/settings';

export default function DoctorSecuritySettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
          <Link href="/doctor/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Security & Password Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update account credentials and review National Health Authority authentication safeguards
          </p>
        </div>
      </div>

      <SettingsNav />

      <DoctorSecuritySettings />
    </div>
  );
}

