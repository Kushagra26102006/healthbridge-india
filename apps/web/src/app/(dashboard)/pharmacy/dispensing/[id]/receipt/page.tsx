'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { DispensingReceiptPreview } from '@/components/pharmacy/DispensingReceiptPreview';

export default function DispensingReceiptPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="py-4">
      <DispensingReceiptPreview receiptId={id} />
    </div>
  );
}

