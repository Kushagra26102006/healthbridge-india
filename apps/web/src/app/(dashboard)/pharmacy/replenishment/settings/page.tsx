'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, SlidersHorizontal, Save, CheckCircle } from 'lucide-react';
import {
  useReplenishmentSettings,
  useUpdateReplenishmentSettings,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ReplenishmentSettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading } = useReplenishmentSettings();
  const updateMutation = useUpdateReplenishmentSettings();

  const [multiplier, setMultiplier] = useState(2);
  const [safetyDays, setSafetyDays] = useState(7);
  const [autoGen, setAutoGen] = useState(false);
  const [notify, setNotify] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setMultiplier(settings.defaultReorderMultiplier);
      setSafetyDays(settings.defaultSafetyStockDays);
      setAutoGen(settings.autoGenerateRequisitions);
      setNotify(settings.notifyOnThreshold);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    await updateMutation.mutateAsync({
      defaultReorderMultiplier: Number(multiplier),
      defaultSafetyStockDays: Number(safetyDays),
      autoGenerateRequisitions: autoGen,
      notifyOnThreshold: notify,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pharmacy/replenishment')}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Replenishment
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Automated Replenishment Policy & Thresholds
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure how target reorder levels, safety buffer days, and replenishment triggers are calculated.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Replenishment parameters saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Reorder Multiplier
            </label>
            <Input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="h-10"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target maximum order point = Reorder Level × Multiplier (Default: 2x)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Safety Stock Buffer (Days)
            </label>
            <Input
              type="number"
              min="0"
              max="30"
              value={safetyDays}
              onChange={(e) => setSafetyDays(Number(e.target.value))}
              className="h-10"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum days of consumption to keep in stock to avoid stock-outs.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Notify On Reorder Threshold
                </p>
                <p className="text-[11px] text-slate-400">
                  Send alert notifications when net stock falls below critical threshold.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Auto-Generate Draft Requisitions
                </p>
                <p className="text-[11px] text-slate-400">
                  Automatically create purchase requisitions when stock reaches zero.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoGen}
                onChange={(e) => setAutoGen(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              disabled={updateMutation.isPending || isLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Replenishment Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
