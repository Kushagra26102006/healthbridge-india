'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type {
  MedicineCatalogItemDto,
  CreateMedicineCatalogDto,
} from '@healthbridge/shared-types';

export interface MedicineFormProps {
  initialData?: Partial<MedicineCatalogItemDto>;
  isEdit?: boolean;
  onSubmit: (data: CreateMedicineCatalogDto) => Promise<void>;
  isLoading?: boolean;
}

export function MedicineForm({
  initialData,
  isEdit = false,
  onSubmit,
  isLoading = false,
}: MedicineFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateMedicineCatalogDto>({
    name: initialData?.name || '',
    genericName: initialData?.genericName || '',
    brandName: initialData?.brandName || '',
    dosageForm: initialData?.dosageForm || 'TABLET',
    strength: initialData?.strength || '',
    route: initialData?.route || 'Oral',
    manufacturer: initialData?.manufacturer || '',
    category: initialData?.category || 'General',
    composition: initialData?.composition || '',
    packSize: initialData?.packSize || '10 Tablets per Strip',
    unitOfMeasurement: initialData?.unitOfMeasurement || 'tablet',
    schedule: initialData?.schedule || 'Schedule H',
    therapeuticClass: initialData?.therapeuticClass || '',
    description: initialData?.description || '',
    requiresPrescription: initialData?.requiresPrescription ?? true,
    isActive: initialData?.isActive ?? true,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.brandName.trim()) {
      setErrorMsg('Brand name is required');
      return;
    }
    if (!formData.strength.trim()) {
      setErrorMsg('Strength is required (e.g. 500 mg)');
      return;
    }
    if (!formData.dosageForm.trim()) {
      setErrorMsg('Dosage form is required');
      return;
    }
    if (!formData.manufacturer.trim()) {
      setErrorMsg('Manufacturer is required');
      return;
    }
    if (!formData.genericName.trim()) {
      setErrorMsg('Generic composition name is required');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim() || formData.brandName.trim(),
        dosageForm: formData.dosageForm.toUpperCase(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save medicine');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to catalogue
        </button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isEdit ? 'Edit Medication Catalogue Entry' : 'Add New Medicine to Catalogue'}
              </CardTitle>
              <CardDescription className="text-xs">
                Accurate medicine details prevent duplication and streamline prescription fulfillment.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Medicine Identification &amp; Composition
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Trade Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  placeholder="e.g. Dolo, Crocin, Augmentin"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Generic Chemical Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleChange}
                  placeholder="e.g. Paracetamol, Amoxicillin + Clavulanic Acid"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Strength <span className="text-red-500">*</span>
                </label>
                <Input
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g. 500 mg, 650 mg, 250 mg / 5 ml"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dosage Form <span className="text-red-500">*</span>
                </label>
                <select
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="TABLET">Tablet</option>
                  <option value="CAPSULE">Capsule</option>
                  <option value="SYRUP">Syrup</option>
                  <option value="SUSPENSION">Suspension</option>
                  <option value="INJECTION">Injection</option>
                  <option value="OINTMENT">Ointment / Gel</option>
                  <option value="DROPS">Drops</option>
                  <option value="INHALER">Inhaler</option>
                  <option value="POWDER">Powder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer <span className="text-red-500">*</span>
                </label>
                <Input
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g. Micro Labs, Cipla, Sun Pharma"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Route of Administration
                </label>
                <select
                  name="route"
                  value={formData.route}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Oral">Oral</option>
                  <option value="Intravenous (IV)">Intravenous (IV)</option>
                  <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                  <option value="Topical">Topical</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                  <option value="Inhalation">Inhalation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Classification & Packaging */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Classification &amp; Packaging
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Therapeutic Category
                </label>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Analgesic, Antibiotic"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Drug Schedule (CDSCO)
                </label>
                <select
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Schedule H">Schedule H (Prescription)</option>
                  <option value="Schedule H1">Schedule H1 (Controlled Rx)</option>
                  <option value="Schedule X">Schedule X (Narcotic/Psychotropic)</option>
                  <option value="Schedule G">Schedule G</option>
                  <option value="OTC / Non-Scheduled">OTC / Non-Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Packaging / Pack Size
                </label>
                <Input
                  name="packSize"
                  value={formData.packSize}
                  onChange={handleChange}
                  placeholder="e.g. Strip of 15 Tablets, 100ml Bottle"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Detailed Composition / Chemical Ingredients
              </label>
              <textarea
                name="composition"
                value={formData.composition}
                onChange={handleChange}
                rows={2}
                placeholder="Each film coated tablet contains: Paracetamol IP 650mg, Excipients q.s."
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Regulatory Flags & Checkboxes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="requiresPrescription"
                checked={formData.requiresPrescription}
                onChange={handleChange}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Requires Valid Doctor Prescription (Rx Required)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Catalogue Entry is Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {isEdit ? 'Update Medicine' : 'Save to Catalogue'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
export default MedicineForm;
