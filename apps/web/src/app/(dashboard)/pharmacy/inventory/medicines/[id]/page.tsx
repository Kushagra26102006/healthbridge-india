'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Eye } from 'lucide-react';
import {
  usePharmacyMedicine,
  useUpdatePharmacyMedicine,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { MedicineDetails, MedicineForm } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';

export default function MedicineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isEditing, setIsEditing] = useState(false);

  const { data: medicine, isLoading } = usePharmacyMedicine(id);
  const updateMutation = useUpdatePharmacyMedicine();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading medicine details...</p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Medicine not found</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-4 text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Catalogue
        </Button>
      </div>
    );
  }

  const handleUpdate = async (dto: any) => {
    await updateMutation.mutateAsync({ id, dto });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Catalogue
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs gap-1.5"
        >
          {isEditing ? (
            <>
              <Eye className="w-3.5 h-3.5" /> View Mode
            </>
          ) : (
            <>
              <Edit2 className="w-3.5 h-3.5" /> Edit Formulations
            </>
          )}
        </Button>
      </div>

      {isEditing ? (
        <MedicineForm
          initialData={medicine}
          isEdit={true}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      ) : (
        <MedicineDetails medicine={medicine} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
}
