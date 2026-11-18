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
import type {
  NotificationCategory,
  NotificationChannelPreferences,
} from '@healthbridge/shared-types';

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

  const emailConfigured = Boolean(preferences?.availableChannels?.email);
  const smsConfigured = Boolean(preferences?.availableChannels?.sms);

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
    // Prevent disabling mandatory security notifications
    if (category === 'SECURITY' && (channel === 'inApp' || channel === 'email')) {
      setErrorMsg(
        'Security and account notifications are mandatory for patient safety and cannot be disabled.'
      );
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
      description: 'Login alerts, password resets, active session changes, and mandatory safety warnings.',
    },
    {
      category: 'APPOINTMENT',
      title: 'Appointment Reminders & Changes',
      description: 'Consultation bookings, confirmations, rescheduling, and cancellation updates.',
    },
    {
      category: 'PRESCRIPTION',
      title: 'Prescription Updates',
      description: 'Prescription issuance, pharmacy verification, and dispensing status updates.',
    },
    {
      category: 'LAB',
      title: 'Laboratory & Diagnostic Updates',
      description: 'Laboratory order status, sample updates, report availability, and QC alerts.',
    },
    {
      category: 'CONSENT',
      title: 'Consent & ABDM Health Record Requests',
      description: 'Health information access requests, approvals, revocations, and ABHA updates.',
    },
    {
      category: 'ORDER',
      title: 'Pharmacy Order & Fulfillment Alerts',
      description: 'Order status changes, fulfillment progress, and counter pickup readiness.',
    },
    {
      category: 'INVENTORY',
      title: 'Inventory & Expiry Warnings',
      description: 'Low-stock alerts, out-of-stock notices, and near-expiry batch warnings.',
    },
    {
      category: 'PROCUREMENT',
      title: 'Procurement & Supplier Deliveries',
      description: 'Purchase order approvals and supplier goods receiving confirmations.',
    },
    {
      category: 'SYSTEM',
      title: 'Operational & Platform Maintenance',
      description: 'Scheduled maintenance notices and authorized operational health alerts.',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-3 py-6" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{roleTitle}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure how you receive clinical, operational, and security alerts. Mandatory security notifications remain active by policy.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Honest Channel Availability Cards — only configured providers show as active */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
            <Bell className="w-4 h-4 text-teal-600" />
            <span>In-App Notifications</span>
          </div>
          <p className="text-teal-700 dark:text-teal-300 text-[11px]">
            Real-time SSE stream with automatic authenticated polling fallback.
          </p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full">
            Active &amp; Configured
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Email Delivery</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            {emailConfigured
              ? 'External SMTP/SES provider configured for privacy-safe email alerts.'
              : 'External SMTP/SES provider is not configured in this environment. In-app alerts remain active.'}
          </p>
          <span
            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
              emailConfigured
                ? 'bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}
          >
            {emailConfigured ? 'Configured' : 'Not Configured'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>SMS Alerts</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            {smsConfigured
              ? 'External SMS gateway configured for urgent neutral alerts.'
              : 'External SMS gateway is not configured in this environment. In-app alerts remain active.'}
          </p>
          <span
            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
              smsConfigured
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}
          >
            {smsConfigured ? 'Configured' : 'Not Configured'}
          </span>
        </div>
      </div>

      {/* Category Preferences Table — only displays toggles for configured channels */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Notification Category
          </span>
          <div className="flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300 mr-2">
            <span className="w-16 text-center">In-App</span>
            {emailConfigured && <span className="w-16 text-center">Email</span>}
            {smsConfigured && <span className="w-16 text-center">SMS</span>}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {categoryList.map((item) => {
            const isMandatory = item.category === 'SECURITY';
            const catPref = categorySettings[item.category] || {
              inApp: true,
              email: true,
              sms: false,
            };

            return (
              <div
                key={item.category}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                    {isMandatory && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        <Lock className="w-2.5 h-2.5" />
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-8 self-end sm:self-center mr-2">
                  {/* In-App Toggle */}
                  <label className="w-16 flex justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label={`${item.title} in-app notifications`}
                      checked={catPref.inApp}
                      disabled={isMandatory}
                      onChange={() => handleToggle(item.category, 'inApp', catPref.inApp)}
                      className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 disabled:opacity-50"
                    />
                  </label>

                  {/* Email Toggle (only rendered when external email provider is configured) */}
                  {emailConfigured && (
                    <label className="w-16 flex justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={`${item.title} email notifications`}
                        checked={catPref.email}
                        disabled={isMandatory}
                        onChange={() => handleToggle(item.category, 'email', catPref.email)}
                        className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 disabled:opacity-50"
                      />
                    </label>
                  )}

                  {/* SMS Toggle (only rendered when external SMS provider is configured) */}
                  {smsConfigured && (
                    <label className="w-16 flex justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={`${item.title} SMS notifications`}
                        checked={catPref.sms}
                        onChange={() => handleToggle(item.category, 'sms', catPref.sms)}
                        className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                      />
                    </label>
                  )}
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
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
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
