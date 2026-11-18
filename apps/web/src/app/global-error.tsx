'use client';

import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Root-level Next.js Global Error Boundary.
 * Displays calm, stack-trace-free recovery UI if the root layout itself encounters a fatal error.
 */
export default function GlobalRootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6 font-sans antialiased">
        <main className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg space-y-4">
          <div
            className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto"
            aria-hidden="true"
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">Application Recovery Required</h1>
            <p className="text-sm text-slate-600">
              HealthBridge India encountered an unexpected display error. Your health records remain safely protected on the server.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <RotateCw className="w-4 h-4" aria-hidden="true" />
              <span>Reload Application</span>
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
