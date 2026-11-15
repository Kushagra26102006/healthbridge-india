'use client';

import React from 'react';
import { Settings, ShieldCheck, Sliders } from 'lucide-react';
import Link from 'next/link';

export default function LaboratorySettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600" />
          Laboratory Settings & Configurations
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage diagnostic laboratory preferences, integration credentials, and compliance parameters
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/laboratory/profile"
          className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 transition-colors space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Accreditation & Profile</h3>
          <p className="text-xs text-muted-foreground">
            Update facility details, physical address, and statutory accreditation documents.
          </p>
        </Link>

        <Link
          href="/laboratory/collection-centers"
          className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-teal-500/40 transition-colors space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Collection Center Network</h3>
          <p className="text-xs text-muted-foreground">
            Configure satellite phlebotomy booths, operating hours, and specimen transit roots.
          </p>
        </Link>
      </div>
    </div>
  );
}
