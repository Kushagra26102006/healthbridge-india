'use client';

import React, { Suspense } from 'react';
import { StockAdjustmentForm } from '@/components/pharmacy';

export default function StockAdjustmentPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="py-20 text-center text-slate-400 text-xs">Loading form...</div>}>
        <StockAdjustmentForm />
      </Suspense>
    </div>
  );
}
