'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useResetNotificationPreferences,
} from '@/features/notifications/hooks/use-notifications';
import type { NotificationCategory, NotificationChannelPreferences } from '@healthbridge/shared-types';

interface NotificationPreferencesFormProps {
  roleTitle?: string;
  backUrl?: string;
}

export function NotificationPreferencesForm({
  roleTitle = 'Notification Preferences',
}: NotificationPreferencesFormProps) {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const { mutate: updatePreferences, isPending: isUpdating } = useUpdateNotificationPreferences();
  const { mutate: resetPreferences, isPending: isResetting } = useResetNotificationPreferences();

  const [categorySettings, setCategorySettings] = useState<
    Record<NotificationCategory, NotificationChannelPreferences>
  >({} as any);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (preferences?.categoryPreferences) {
      setCategorySettings(preferences.categoryPreferences);
    }
  }, [preferences]);

  const handleToggle = (
    category: NotificationCategory,
    channel: 'inApp' | 'email' | 'sms',
    currentVal: boolean
  ) => {
    // Prevent disabling mandatory in-app security notifications
    if (category === 'SECURITY' && channel === 'inApp') {
      setErrorMsg('Security and authentication alerts are mandatory for account safety and cannot be disabled.');
      return;
    }

    setErrorMsg('');
    setCategorySettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !currentVal,
      },
    }));
  };

  const handleSave = () => {
    setErrorMsg('');
    setSuccessMsg('');
    updatePreferences(
      { categoryPreferences: categorySettings },
      {
        onSuccess: () => {
          setSuccessMsg('Notification preferences updated successfully.');
          setTimeout(() => setSuccessMsg(''), 4000);
        },
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to update preferences');
        },
      }
    );
  };

  const handleReset = () => {
    setErrorMsg('');
    setSuccessMsg('');
    resetPreferences(undefined, {
      onSuccess: () => {
        setSuccessMsg('Preferences reset to default configuration.');
        setTimeout(() => setSuccessMsg(''), 4000);
      },
    });
  };

  const categoryList: { category: NotificationCategory; title: string; description: string }[] = [
    {
      category: 'SECURITY',
      title: 'Security & Account Alerts',
      description: 'Login alerts, password resets, active session changes, and authentication warnings.',
    },
    {
      category: 'PRESCRIPTION',
      title: 'Prescription Updates',
      description: 'Doctor prescription issuance, pharmacy verification, and dispensing readiness.',
    },
    {
      category: 'ORDER',
      title: 'Order & Fulfillment Alerts',
      description: 'Order status updates, review notices, packing progress, and counter collection codes.',
    },
    {
      category: 'INVENTORY',
      title: 'Inventory & Expiry Warnings',
      description: 'Urgent low-stock alerts, out-of-stock items, and batches approaching expiration.',
    },
    {
      category: 'PROCUREMENT',
      title: 'Procurement & Purchase Orders',
      description: 'Purchase requisitions, supplier PO approvals, and goods receiving confirmations.',
    },
    {
      category: 'APPOINTMENT',
      title: 'Consultation & Appointments',
      description: 'Doctor consultation confirmations, reminder notifications, and schedule adjustments.',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-xs text-slate-400">
        Loading communication preferences...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{roleTitle}</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure how you receive clinical, operational, and security notifications across channels.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Channel Availability Notice */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-teal-900">
            <Bell className="w-4 h-4 text-teal-600" />
            <span>In-App Notifications</span>
          </div>
          <p className="text-teal-700 text-[11px]">Real-time dashboard notifications and topbar bell badge.</p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
            Active & Real-Time (SSE)
          </span>
        </div>

        <div className="p-3.5 bg-sky-50/50 border border-sky-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sky-900">
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Email Delivery</span>
          </div>
          <p className="text-sky-700 text-[11px]">Transactional emails for invoices, order confirmations and security.</p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full">
            Configured
          </span>
        </div>

        <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-indigo-900">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>SMS Alerts</span>
          </div>
          <p className="text-indigo-700 text-[11px]">Urgent OTPs and counter pickup reference codes.</p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
            Configured
          </span>
        </div>
      </div>

      {/* Category Preferences Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Notification Category</span>
          <div className="flex items-center gap-8 text-xs font-semibold text-slate-600 mr-2">
            <span className="w-16 text-center">In-App</span>
            <span className="w-16 text-center">Email</span>
            <span className="w-16 text-center">SMS</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {categoryList.map((item) => {
            const isMandatory = item.category === 'SECURITY';
            const catPref = categorySettings[item.category] || { inApp: true, email: true, sms: false };

            return (
              <div
                key={item.category}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    {isMandatory && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        <Lock className="w-2.5 h-2.5" />
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                </div>

                <div className="flex items-center gap-8 self-end sm:self-center mr-2">
                  {/* In-App Toggle */}
                  <label className="w-16 flex justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catPref.inApp}
                      disabled={isMandatory}
                      onChange={() => handleToggle(item.category, 'inApp', catPref.inApp)}
                      className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 disabled:opacity-50"
                    />
                  </label>

                  {/* Email Toggle */}
                  <label className="w-16 flex justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catPref.email}
                      onChange={() => handleToggle(item.category, 'email', catPref.email)}
                      className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                    />
                  </label>

                  {/* SMS Toggle */}
                  <label className="w-16 flex justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catPref.sms}
                      onChange={() => handleToggle(item.category, 'sms', catPref.sms)}
                      className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isResetting ? 'Restoring...' : 'Restore Defaults'}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdating}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isUpdating ? 'Saving Preferences...' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
}
