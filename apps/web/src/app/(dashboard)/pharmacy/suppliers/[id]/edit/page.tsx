'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupplier, useUpdateSupplier } from '@/features/pharmacy/hooks/use-pharmacy';
import { SupplierFormModal } from '@/components/pharmacy';
import type { UpdateSupplierDto } from '@healthbridge/shared-types';

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const { data: supplier, isLoading } = useSupplier(supplierId);
  const updateMutation = useUpdateSupplier();

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync({ id: supplierId, dto: data as UpdateSupplierDto });
    router.push(`/pharmacy/suppliers/${supplierId}`);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p>Loading supplier details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/pharmacy/suppliers/${supplierId}`)}
          className="gap-1 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Supplier
        </Button>
      </div>

      <SupplierFormModal
        isOpen={true}
        onClose={() => router.push(`/pharmacy/suppliers/${supplierId}`)}
        supplier={supplier || null}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
