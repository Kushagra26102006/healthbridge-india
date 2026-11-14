'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateSupplier } from '@/features/pharmacy/hooks/use-pharmacy';
import { SupplierFormModal } from '@/components/pharmacy';
import type { CreateSupplierDto } from '@healthbridge/shared-types';

export default function NewSupplierPage() {
  const router = useRouter();
  const createMutation = useCreateSupplier();

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data as CreateSupplierDto);
    router.push('/pharmacy/suppliers');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pharmacy/suppliers')}
          className="gap-1 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </Button>
      </div>

      <SupplierFormModal
        isOpen={true}
        onClose={() => router.push('/pharmacy/suppliers')}
        supplier={null}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
