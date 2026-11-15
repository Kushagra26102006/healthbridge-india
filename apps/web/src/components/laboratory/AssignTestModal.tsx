'use client';

import React, { useState } from 'react';
import { useAssignTest } from '@/features/laboratory/hooks/use-laboratory';
import { UserCheck, X, AlertCircle } from 'lucide-react';
import type { LabOrderPriority } from '@healthbridge/shared-types';

export interface AssignTestModalProps {
  orderId: string;
  orderNumber: string;
  testCode: string;
  testName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEPARTMENTS = [
  'Clinical Biochemistry',
  'Hematology & Hemostasis',
  'Microbiology & Serology',
  'Histopathology',
  'Cytopathology',
  'Molecular Diagnostics',
  'Immunology',
  'Radiology & Imaging',
  'Urinalysis & Clinical Microscopy',
];

export function AssignTestModal({
  orderId,
  orderNumber,
  testCode,
  testName,
  isOpen,
  onClose,
  onSuccess,
}: AssignTestModalProps) {
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [technicianId, setTechnicianId] = useState('');
  const [priority, setPriority] = useState<LabOrderPriority>('ROUTINE');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const assignMutation = useAssignTest();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await assignMutation.mutateAsync({
        orderId,
        dto: {
          testCode,
          department,
          technicianId: technicianId.trim() || undefined,
          priority,
          notes: notes.trim() || undefined,
        },
      });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to assign test');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Assign Test to Processing Unit
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                Order #{orderNumber} • {testName} ({testCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Diagnostic Department <span className="text-teal-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-teal-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Technician Identifier (Optional)
              </label>
              <input
                type="text"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder="e.g. TECH-402 or Staff ID"
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Processing Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LabOrderPriority)}
                className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-teal-500"
              >
                <option value="ROUTINE">ROUTINE</option>
                <option value="URGENT">URGENT</option>
                <option value="STAT">STAT / EMERGENCY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Internal Handling Instructions (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Protect from light; centrifuge within 30 minutes of accessioning."
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-3 focus:outline-none focus:border-teal-500 min-h-[70px]"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignTestModal;
