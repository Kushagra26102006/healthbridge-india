'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateLabTest } from '@/features/laboratory/hooks/use-laboratory';
import {
  TestTube2,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import type {
  LabTestCategory,
  SpecimenType,
  ParameterDataType,
  CreateTestParameterDto,
} from '@healthbridge/shared-types';

const CATEGORIES: LabTestCategory[] = [
  'BIOCHEMISTRY',
  'HEMATOLOGY',
  'CLINICAL_PATHOLOGY',
  'MICROBIOLOGY',
  'SEROLOGY',
  'IMMUNOLOGY',
  'MOLECULAR_DIAGNOSTICS',
  'RADIOLOGY',
  'BLOOD_TESTS',
  'URINE_TESTS',
  'IMAGING',
  'OTHER',
];

const SPECIMENS: SpecimenType[] = [
  'BLOOD',
  'SERUM',
  'PLASMA',
  'URINE',
  'STOOL',
  'SWAB',
  'SPUTUM',
  'CSF',
  'BIOPSY',
  'OTHER',
];

export default function NewLabTestPage() {
  const router = useRouter();
  const createTestMutation = useCreateLabTest();

  // Basic Information
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [category, setCategory] = useState<LabTestCategory>('BIOCHEMISTRY');
  const [description, setDescription] = useState('');
  const [specimenType, setSpecimenType] = useState<SpecimenType>('BLOOD');
  const [containerRequirements, setContainerRequirements] = useState('');
  const [preparationInstructions, setPreparationInstructions] = useState('');
  const [fastingRequirement, setFastingRequirement] = useState(false);
  const [fastingDurationHours, setFastingDurationHours] = useState<number>(8);
  const [expectedTurnaroundTime, setExpectedTurnaroundTime] = useState('24 hours');
  const [price, setPrice] = useState<number>(350);
  const [performingDepartment, setPerformingDepartment] = useState('Clinical Biochemistry');

  // Dynamic Parameters
  const [parameters, setParameters] = useState<CreateTestParameterDto[]>([
    {
      parameterName: '',
      parameterCode: '',
      dataType: 'NUMERIC',
      unit: '',
      isRequired: true,
      displayOrder: 1,
    },
  ]);

  const [errorMessage, setErrorMessage] = useState('');

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        parameterName: '',
        parameterCode: '',
        dataType: 'NUMERIC',
        unit: '',
        isRequired: true,
        displayOrder: parameters.length + 1,
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (
    index: number,
    field: keyof CreateTestParameterDto,
    value: any
  ) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value } as CreateTestParameterDto;
    setParameters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!testName.trim() || !testCode.trim()) {
      setErrorMessage('Please provide test name and unique test code.');
      return;
    }

    // Filter valid parameters
    const validParameters: CreateTestParameterDto[] = parameters
      .filter(
        (p) =>
          p.parameterName &&
          p.parameterName.trim() &&
          p.parameterCode &&
          p.parameterCode.trim()
      )
      .map((p, idx) => ({
        parameterName: p.parameterName.trim(),
        parameterCode: p.parameterCode.trim().toUpperCase(),
        dataType: p.dataType,
        unit: p.unit?.trim() || undefined,
        isRequired: p.isRequired ?? true,
        displayOrder: idx + 1,
      }));

    try {
      await createTestMutation.mutateAsync({
        testName: testName.trim(),
        testCode: testCode.trim().toUpperCase(),
        category,
        description: description.trim() || undefined,
        specimenType,
        containerRequirements: containerRequirements.trim() || undefined,
        preparationInstructions: preparationInstructions.trim() || undefined,
        fastingRequirement,
        fastingDurationHours: fastingRequirement ? Number(fastingDurationHours) : undefined,
        expectedTurnaroundTime: expectedTurnaroundTime.trim(),
        price: Number(price),
        performingDepartment: performingDepartment.trim() || undefined,
        parameters: validParameters.length > 0 ? validParameters : undefined,
        isActive: true,
      });

      router.push('/laboratory/tests');
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to create diagnostic test.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/laboratory/tests"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create Diagnostic Test Profile
          </h1>
          <p className="text-xs text-muted-foreground">
            Define statutory specimen parameters, pre-analytical instructions, and turnaround times
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TestTube2 className="w-4 h-4 text-teal-600" />
            General Test Attributes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Diagnostic Test Name <span className="text-teal-500">*</span>
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC)"
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Unique Test Code <span className="text-teal-500">*</span>
              </label>
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="e.g. CBC-001"
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LabTestCategory)}
                className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-teal-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Primary Specimen
              </label>
              <select
                value={specimenType}
                onChange={(e) => setSpecimenType(e.target.value as SpecimenType)}
                className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-teal-500"
              >
                {SPECIMENS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Performing Department
              </label>
              <input
                type="text"
                value={performingDepartment}
                onChange={(e) => setPerformingDepartment(e.target.value)}
                placeholder="e.g. Hematology"
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Clinical Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of diagnostic indications..."
              rows={2}
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Expected Turnaround Time (TAT) <span className="text-teal-500">*</span>
              </label>
              <input
                type="text"
                value={expectedTurnaroundTime}
                onChange={(e) => setExpectedTurnaroundTime(e.target.value)}
                placeholder="e.g. 12 hours, 24 hours"
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Standard Fee (₹ INR) <span className="text-teal-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Pre-Analytical Requirements Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Pre-Analytical Specimen & Patient Preparation Rules
          </h2>

          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={fastingRequirement}
                onChange={(e) => setFastingRequirement(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Fasting Required Prior to Specimen Collection</span>
            </label>

            {fastingRequirement && (
              <div className="pl-6">
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Required Fasting Duration (Hours)
                </label>
                <input
                  type="number"
                  value={fastingDurationHours}
                  onChange={(e) => setFastingDurationHours(Number(e.target.value))}
                  min={1}
                  max={24}
                  className="w-32 text-xs rounded-xl bg-background border border-border p-2 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Container / Tube Specification
              </label>
              <input
                type="text"
                value={containerRequirements}
                onChange={(e) => setContainerRequirements(e.target.value)}
                placeholder="e.g. 3mL EDTA Lavender Top Tube"
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Patient Preparation Instructions
              </label>
              <input
                type="text"
                value={preparationInstructions}
                onChange={(e) => setPreparationInstructions(e.target.value)}
                placeholder="e.g. Avoid high-fat meal on previous night."
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Parameter Builder */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Diagnostic Parameters & Result Fields
              </h2>
              <p className="text-xs text-muted-foreground">
                Define the measured biomarkers or qualitative outputs evaluated for this test
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddParameter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-600 text-xs font-bold hover:bg-teal-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Parameter
            </button>
          </div>

          <div className="space-y-3">
            {parameters.map((param, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-muted/20 border border-border flex flex-col md:flex-row items-center gap-3"
              >
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={param.parameterName}
                    onChange={(e) =>
                      handleParameterChange(index, 'parameterName', e.target.value)
                    }
                    placeholder="Parameter Name (e.g. Hemoglobin)"
                    className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="w-full md:w-32">
                  <input
                    type="text"
                    value={param.parameterCode}
                    onChange={(e) =>
                      handleParameterChange(index, 'parameterCode', e.target.value)
                    }
                    placeholder="Code (e.g. HB)"
                    className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:outline-none focus:border-teal-500 font-mono uppercase"
                  />
                </div>
                <div className="w-full md:w-36">
                  <select
                    value={param.dataType}
                    onChange={(e) =>
                      handleParameterChange(
                        index,
                        'dataType',
                        e.target.value as ParameterDataType
                      )
                    }
                    className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:outline-none focus:border-teal-500"
                  >
                    <option value="NUMERIC">NUMERIC</option>
                    <option value="TEXT">TEXT</option>
                    <option value="QUALITATIVE">QUALITATIVE</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </div>
                <div className="w-full md:w-28">
                  <input
                    type="text"
                    value={param.unit || ''}
                    onChange={(e) =>
                      handleParameterChange(index, 'unit', e.target.value)
                    }
                    placeholder="Unit (g/dL)"
                    className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveParameter(index)}
                  disabled={parameters.length === 1}
                  className="p-2 text-muted-foreground hover:text-rose-600 rounded-lg transition-colors disabled:opacity-30"
                  title="Remove parameter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/laboratory/tests"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createTestMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createTestMutation.isPending ? 'Saving Test...' : 'Save Diagnostic Test'}
          </button>
        </div>
      </form>
    </div>
  );
}
