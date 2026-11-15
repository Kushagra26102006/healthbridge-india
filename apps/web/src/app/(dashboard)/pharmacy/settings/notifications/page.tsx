'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
  Pill,
  ShoppingBag,
  Truck,
  Lock,
} from 'lucide-react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useResetNotificationPreferences,
} from '@/features/notifications/hooks/use-notifications';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { NotificationCategory } from '@healthbridge/shared-types';

interface CategoryConfig {
  key: NotificationCategory;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PHARMACY_CATEGORIES: CategoryConfig[] = [
  {
    key: 'PRESCRIPTION',
    title: 'Prescriptions & Dispensing',
    desc: 'Incoming doctor e-prescriptions, verification requests, and full/partial dispensing receipts.',
    icon: Pill,
  },
  {
    key: 'ORDER',
    title: 'Orders & Patient Pickup',
    desc: 'Patient click-and-collect orders, packaging updates, pickup ready readiness, and completion handovers.',
    icon: ShoppingBag,
  },
  {
    key: 'INVENTORY',
    title: 'Inventory & Expiry Alerts',
    desc: 'Low-stock threshold triggers, near-expiry alerts (30-day/90-day horizon), and batch quarantines.',
    icon: Package,
  },
  {
    key: 'PROCUREMENT',
    title: 'Procurement & Purchase Orders',
    desc: 'Replenishment suggestions, purchase order approvals, goods receipt notes (GRN), and vendor invoices.',
    icon: Truck,
  },
  {
    key: 'SECURITY',
    title: 'Staff & Account Security',
    desc: 'New staff invitations, credential updates, session revoking, and password modifications (Mandatory).',
    icon: Lock,
  },
];

export default function PharmacyNotificationSettingsPage() {
  const { data: prefData, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const resetMutation = useResetNotificationPreferences();

  // Global channels
  const [inAppGlobal, setInAppGlobal] = useState(true);
  const [emailGlobal, setEmailGlobal] = useState(true);
  const [smsGlobal, setSmsGlobal] = useState(false);

  // Category channels
  const [categorySettings, setCategorySettings] = useState<
    Record<string, { inApp: boolean; email: boolean; sms: boolean }>
  >({});

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (prefData) {
      setInAppGlobal(Boolean(prefData.channels?.inApp));
      setEmailGlobal(Boolean(prefData.channels?.email));
      setSmsGlobal(Boolean(prefData.channels?.sms));

      const catMap: Record<string, { inApp: boolean; email: boolean; sms: boolean }> = {};
      PHARMACY_CATEGORIES.forEach((cat) => {
        const existing = prefData.categoryPreferences?.[cat.key];
        catMap[cat.key] = {
          inApp: existing?.inApp !== undefined ? existing.inApp : true,
          email: existing?.email !== undefined ? existing.email : true,
          sms: existing?.sms !== undefined ? existing.sms : false,
        };
      });
      setCategorySettings(catMap);
    }
  }, [prefData]);

  const handleToggleCategoryChannel = (
    category: NotificationCategory,
    channel: 'inApp' | 'email' | 'sms',
    value: boolean
  ) => {
    // Security mandatory rule: Security inApp cannot be turned off
    if (category === 'SECURITY' && channel === 'inApp' && !value) {
      setFeedback({
        type: 'error',
        message: 'Security notifications cannot be disabled for dispensary compliance.',
      });
      return;
    }

    setCategorySettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category]!,
        [channel]: value,
      },
    }));
  };

  const handleSave = async () => {
    setFeedback(null);

    try {
      await updateMutation.mutateAsync({
        channels: {
          inApp: inAppGlobal,
          email: emailGlobal,
          sms: smsGlobal,
        },
        categoryPreferences: categorySettings as any,
      });

      setFeedback({
        type: 'success',
        message: 'Dispensary notification preferences saved successfully.',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update notification preferences.',
      });
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all notification preferences to standard healthcare dispensary defaults?')) {
      return;
    }
    setFeedback(null);

    try {
      await resetMutation.mutateAsync();
      setFeedback({
        type: 'success',
        message: 'Notification preferences reset to default values.',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to reset preferences.',
      });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-600 mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Communication & Alerts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Dispensary Notification Center & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure delivery channels and real-time alert filters for inventory thresholds, clinical orders, and staff events.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={resetMutation.isPending}
          className="text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset to Defaults
        </Button>
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

      {/* Global Channel Master Switches */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Master Communication Channels
          </h2>
          <p className="text-xs text-slate-500">
            Enable or mute entire delivery channels globally across the pharmacy portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">In-App Alerts</h4>
                <p className="text-[11px] text-slate-500">Real-time SSE push alerts</p>
              </div>
            </div>
            <Switch
              checked={inAppGlobal}
              onCheckedChange={setInAppGlobal}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Email Digests</h4>
                <p className="text-[11px] text-slate-500">PO summaries and reports</p>
              </div>
            </div>
            <Switch
              checked={emailGlobal}
              onCheckedChange={setEmailGlobal}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">SMS Gateways</h4>
                <p className="text-[11px] text-slate-500">Critical emergency dispatch</p>
              </div>
            </div>
            <Switch
              checked={smsGlobal}
              onCheckedChange={setSmsGlobal}
            />
          </div>
        </div>
      </div>

      {/* Category Level Matrix */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Dispensary Category Channels
            </h2>
            <p className="text-xs text-slate-500">
              Customize channel routing for clinical, inventory, and procurement events
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {PHARMACY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const currentPref = categorySettings[cat.key] || {
              inApp: true,
              email: true,
              sms: false,
            };

            return (
              <div
                key={cat.key}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 max-w-md">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end md:self-center">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <Switch
                      checked={currentPref.inApp}
                      onCheckedChange={(val: boolean) =>
                        handleToggleCategoryChannel(cat.key, 'inApp', val)
                      }
                      disabled={cat.key === 'SECURITY'} // Mandatory security
                    />
                    <span className="text-[11px] font-medium">In-App</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <Switch
                      checked={currentPref.email}
                      onCheckedChange={(val: boolean) =>
                        handleToggleCategoryChannel(cat.key, 'email', val)
                      }
                    />
                    <span className="text-[11px] font-medium">Email</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <Switch
                      checked={currentPref.sms}
                      onCheckedChange={(val: boolean) =>
                        handleToggleCategoryChannel(cat.key, 'sms', val)
                      }
                    />
                    <span className="text-[11px] font-medium">SMS</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Communication Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
