'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Pill,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Save,
  Clock,
} from 'lucide-react';
import {
  usePharmacyServices,
  useUpdatePharmacyServices,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function PharmacyServicesSettingsPage() {
  const { data: servicesData, isLoading } = usePharmacyServices();
  const updateMutation = useUpdatePharmacyServices();

  const [dispensingEnabled, setDispensingEnabled] = useState(true);
  const [inStorePickupEnabled, setInStorePickupEnabled] = useState(true);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [emergencyPrescriptionSupport, setEmergencyPrescriptionSupport] = useState(true);
  const [scheduleHDispensingEnabled, setScheduleHDispensingEnabled] = useState(true);
  const [scheduleXDispensingEnabled, setScheduleXDispensingEnabled] = useState(false);
  const [chronicRefillProgramEnabled, setChronicRefillProgramEnabled] = useState(true);
  const [compoundingAvailable, setCompoundingAvailable] = useState(false);

  const [homeDeliveryRadiusKm, setHomeDeliveryRadiusKm] = useState(5);
  const [minimumOrderValueForDelivery, setMinimumOrderValueForDelivery] = useState(200);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(500);
  const [estimatedPickupReadyMinutes, setEstimatedPickupReadyMinutes] = useState(30);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (servicesData) {
      setDispensingEnabled(Boolean(servicesData.dispensingEnabled));
      setInStorePickupEnabled(Boolean(servicesData.inStorePickupEnabled));
      setDeliveryReady(Boolean(servicesData.deliveryReady));
      setEmergencyPrescriptionSupport(Boolean(servicesData.emergencyPrescriptionSupport));
      setScheduleHDispensingEnabled(Boolean(servicesData.scheduleHDispensingEnabled));
      setScheduleXDispensingEnabled(Boolean(servicesData.scheduleXDispensingEnabled));
      setChronicRefillProgramEnabled(Boolean(servicesData.chronicRefillProgramEnabled));
      setCompoundingAvailable(Boolean(servicesData.compoundingAvailable));
      setHomeDeliveryRadiusKm(servicesData.homeDeliveryRadiusKm || 5);
      setMinimumOrderValueForDelivery(servicesData.minimumOrderValueForDelivery || 200);
      setDeliveryFee(servicesData.deliveryFee !== undefined ? servicesData.deliveryFee : 30);
      setFreeDeliveryAbove(servicesData.freeDeliveryAbove || 500);
      setEstimatedPickupReadyMinutes(servicesData.estimatedPickupReadyMinutes || 30);
    }
  }, [servicesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      await updateMutation.mutateAsync({
        dispensingEnabled,
        inStorePickupEnabled,
        deliveryReady,
        emergencyPrescriptionSupport,
        scheduleHDispensingEnabled,
        scheduleXDispensingEnabled,
        chronicRefillProgramEnabled,
        compoundingAvailable,
        homeDeliveryRadiusKm: Number(homeDeliveryRadiusKm),
        minimumOrderValueForDelivery: Number(minimumOrderValueForDelivery),
        deliveryFee: Number(deliveryFee),
        freeDeliveryAbove: Number(freeDeliveryAbove),
        estimatedPickupReadyMinutes: Number(estimatedPickupReadyMinutes),
      });

      setFeedback({ type: 'success', message: 'Pharmacy service settings updated successfully' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update services' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full" />
        <div className="h-96 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fulfillment & Service Capabilities</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Dispensary Services & Fulfillment Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure active fulfillment channels, schedule medicine dispensing rules, and local delivery boundaries.
        </p>
      </div>

      <PharmacySettingsNav />

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Clinical Dispensing Services */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Pill className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Clinical Dispensing Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Prescription Dispensing Active
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Allows processing doctor-verified e-prescriptions.
                </p>
              </div>
              <Switch
                checked={dispensingEnabled}
                onCheckedChange={setDispensingEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  In-Store Patient Pickup
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Accept click-and-collect orders from registered patients.
                </p>
              </div>
              <Switch
                checked={inStorePickupEnabled}
                onCheckedChange={setInStorePickupEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Schedule H / H1 Dispensing
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Requires mandatory doctor prescription reference check.
                </p>
              </div>
              <Switch
                checked={scheduleHDispensingEnabled}
                onCheckedChange={setScheduleHDispensingEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Schedule X (Narcotics) Dispensing
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Controlled substances with dual-copy prescription requirement.
                </p>
              </div>
              <Switch
                checked={scheduleXDispensingEnabled}
                onCheckedChange={setScheduleXDispensingEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Chronic Illness Auto-Refill Program
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automated monthly recurring refill notifications for diabetic/hypertensive patients.
                </p>
              </div>
              <Switch
                checked={chronicRefillProgramEnabled}
                onCheckedChange={setChronicRefillProgramEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Emergency Prescription Fast-Track
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Priority queuing for STAT and critical antibiotic orders.
                </p>
              </div>
              <Switch
                checked={emergencyPrescriptionSupport}
                onCheckedChange={setEmergencyPrescriptionSupport}
              />
            </div>
          </div>
        </div>

        {/* Pickup & Local Delivery Rules */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShoppingBag className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Pickup & Delivery Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimated Pickup Ready Time (Minutes)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={estimatedPickupReadyMinutes}
                  onChange={(e) => setEstimatedPickupReadyMinutes(Number(e.target.value))}
                  className="pl-9"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Communicated to patients upon order confirmation.
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Local Store Delivery Readiness
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enable dispatch for doorstep delivery within delivery radius.
                </p>
              </div>
              <Switch
                checked={deliveryReady}
                onCheckedChange={setDeliveryReady}
              />
            </div>

            {deliveryReady && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Delivery Radius (Kilometers)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={homeDeliveryRadiusKm}
                    onChange={(e) => setHomeDeliveryRadiusKm(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Minimum Order Value for Delivery (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={minimumOrderValueForDelivery}
                    onChange={(e) => setMinimumOrderValueForDelivery(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={freeDeliveryAbove}
                    onChange={(e) => setFreeDeliveryAbove(Number(e.target.value))}
                    required
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Service Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
