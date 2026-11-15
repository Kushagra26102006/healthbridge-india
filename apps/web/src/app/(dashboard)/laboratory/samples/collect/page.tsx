'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useRegisterSampleCollection,
  useLaboratoryOrderDetail,
  useCollectionCenters,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  FlaskConical,
  ArrowLeft,
  Barcode,
  AlertCircle,
} from 'lucide-react';
import type { SpecimenType } from '@healthbridge/shared-types';

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

const CONTAINERS = [
  'EDTA Tube (Lavender Top)',
  'Serum Separator Tube / Gel (Gold Top)',
  'Sodium Fluoride / Potassium Oxalate (Grey Top)',
  'Sodium Heparin (Green Top)',
  'Plain Clot Activator (Red Top)',
  'Sodium Citrate 3.2% (Light Blue Top)',
  'Sterile Wide-Mouth Urine Container',
  'Sterile Swab with Amies Transport Medium',
  'Sterile Universal Container',
  'Formalin Biopsy Container',
];

export default function RegisterSampleCollectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [specimenType, setSpecimenType] = useState<SpecimenType>('BLOOD');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [containerType, setContainerType] = useState(CONTAINERS[0]);
  const [collectionMethod, setCollectionMethod] = useState('Standard Venipuncture');
  const [collectionCenterId, setCollectionCenterId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const registerMutation = useRegisterSampleCollection();
  const { data: order } = useLaboratoryOrderDetail(orderId);
  const { data: collectionCenters } = useCollectionCenters();

  // If order loads and has tests, pre-populate test codes
  useEffect(() => {
    if (order?.tests) {
      setSelectedTests(order.tests.map((t) => t.testCode));
    }
  }, [order]);

  const toggleTest = (code: string) => {
    if (selectedTests.includes(code)) {
      setSelectedTests(selectedTests.filter((c) => c !== code));
    } else {
      setSelectedTests([...selectedTests, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!orderId.trim()) {
      setErrorMessage('Please provide an authorized Laboratory Order ID.');
      return;
    }

    if (selectedTests.length === 0) {
      setErrorMessage('Please select at least one diagnostic test for this specimen container.');
      return;
    }

    try {
      const sample = await registerMutation.mutateAsync({
        orderId: orderId.trim(),
        specimenType,
        testCodes: selectedTests,
        containerType,
        collectionMethod: collectionMethod.trim() || undefined,
        collectionCenterId: collectionCenterId || undefined,
        collectedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      router.push(`/laboratory/samples/${sample.id}`);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Sample collection registration failed'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/laboratory/samples"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            Register Specimen Collection
          </h1>
          <p className="text-xs text-muted-foreground">
            Generate unique barcode and record pre-analytical specimen collection details
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
        {/* Order Association Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            1. Authorized Order Association
          </h2>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Laboratory Order ID <span className="text-teal-500">*</span>
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Laboratory Order ID..."
              required
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          {order && (
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1">
              <span className="font-bold block">
                Found Order #{order.orderNumber} • Patient: {order.patient?.name || 'N/A'}
              </span>
              <p className="text-[11px] text-teal-700 dark:text-teal-400 font-mono">
                Doctor: {order.doctor?.name || 'Practitioner'} • Priority: {order.priority}
              </p>
            </div>
          )}
        </div>

        {/* Specimen Specifications Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            2. Specimen Specifications & Container
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Specimen Type <span className="text-teal-500">*</span>
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
                Container / Tube Type
              </label>
              <select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-teal-500"
              >
                {CONTAINERS.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Collection Technique / Method
              </label>
              <input
                type="text"
                value={collectionMethod}
                onChange={(e) => setCollectionMethod(e.target.value)}
                placeholder="e.g. Venipuncture, Clean-catch midstream"
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Collection Center / Phlebotomy Station
              </label>
              <select
                value={collectionCenterId}
                onChange={(e) => setCollectionCenterId(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-teal-500"
              >
                <option value="">Main Diagnostic Center</option>
                {collectionCenters?.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name} ({cc.address.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Associated Diagnostic Tests Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              3. Tests Assigned to this Specimen Tube
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {selectedTests.length} selected
            </span>
          </div>

          {order?.tests ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {order.tests.map((t) => (
                <label
                  key={t.testCode}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedTests.includes(t.testCode)
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-900 dark:text-teal-200'
                      : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(t.testCode)}
                      onChange={() => toggleTest(t.testCode)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold">{t.testName}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {t.testCode}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Test Codes (Comma-separated)
              </label>
              <input
                type="text"
                value={selectedTests.join(', ')}
                onChange={(e) =>
                  setSelectedTests(
                    e.target.value
                      .split(',')
                      .map((s) => s.trim().toUpperCase())
                      .filter(Boolean)
                  )
                }
                placeholder="e.g. CBC-001, LFT-002"
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Phlebotomist Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Specimen drawn from left cubital fossa without complications; placed on ice."
              rows={2}
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/laboratory/samples"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Barcode className="w-4 h-4" />
            {registerMutation.isPending ? 'Generating Barcode...' : 'Register & Generate Barcode'}
          </button>
        </div>
      </form>
    </div>
  );
}
