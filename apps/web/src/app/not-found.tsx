import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-lg space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
          <p className="text-xs text-muted-foreground">
            The requested healthcare portal page does not exist or has moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-teal-600 hover:opacity-90 text-white text-xs font-semibold transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
