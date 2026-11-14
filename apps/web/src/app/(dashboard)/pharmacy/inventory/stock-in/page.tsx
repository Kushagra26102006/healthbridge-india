'use client';

import React, { Suspense } from 'react';
import { StockInForm } from '@/components/pharmacy';

export default function StockInPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="py-20 text-center text-slate-400 text-xs">Loading form...</div>}>
        <StockInForm />
      </Suspense>
    </div>
  );
}
