'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MedicineForm } from '@/components/pharmacy';
import { useCreatePharmacyMedicine } from '@/features/pharmacy/hooks/use-pharmacy';
import type { CreateMedicineCatalogDto } from '@healthbridge/shared-types';

export default function NewMedicinePage() {
  const router = useRouter();
  const createMutation = useCreatePharmacyMedicine();

  const handleSubmit = async (dto: CreateMedicineCatalogDto) => {
    await createMutation.mutateAsync(dto);
    router.push('/pharmacy/inventory/medicines');
  };

  return (
    <div className="py-2">
      <MedicineForm
        isEdit={false}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
