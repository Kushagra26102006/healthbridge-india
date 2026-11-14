'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/patient/hooks/use-profile';
import type { ChannelPreferences } from '@healthbridge/shared-types';

export const NotificationPreferences: React.FC = () => {
  const { preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [appointmentPrefs, setAppointmentPrefs] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [prescriptionPrefs, setPrescriptionPrefs] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [labReportPrefs, setLabReportPrefs] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [consentPrefs, setConsentPrefs] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [securityPrefs, setSecurityPrefs] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    if (preferences) {
      if (preferences.appointmentUpdates) setAppointmentPrefs(preferences.appointmentUpdates);
      if (preferences.prescriptionUpdates) setPrescriptionPrefs(preferences.prescriptionUpdates);
      if (preferences.labReportAlerts) setLabReportPrefs(preferences.labReportAlerts);
      if (preferences.consentRequests) setConsentPrefs(preferences.consentRequests);
      if (preferences.securityAlerts) setSecurityPrefs(preferences.securityAlerts);
    }
  }, [preferences]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      await updateMutation.mutateAsync({
        appointmentUpdates: appointmentPrefs,
        prescriptionUpdates: prescriptionPrefs,
        labReportAlerts: labReportPrefs,
        consentRequests: consentPrefs,
        securityAlerts: securityPrefs,
      });

      setStatusMessage({ text: 'Notification preferences updated successfully.', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Failed to update preferences. Please try again.', type: 'error' });
    }
  };

  const categories = [
    {
      id: 'appointments',
      title: 'Consultations & Appointments',
      description: 'Reminders for booked doctor consultations, slot confirmations and reschedule alerts',
      state: appointmentPrefs,
      setter: setAppointmentPrefs,
      isMandatory: false,
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions & Medication Cycles',
      description: 'Notifications when clinical prescriptions are issued or refill reminders trigger',
      state: prescriptionPrefs,
      setter: setPrescriptionPrefs,
      isMandatory: false,
    },
    {
      id: 'labReports',
      title: 'Diagnostic & Laboratory Reports',
      description: 'Alerts when test results are uploaded, verified and available for review or download',
      state: labReportPrefs,
      setter: setLabReportPrefs,
      isMandatory: false,
    },
    {
      id: 'consent',
      title: 'Electronic Consent & Access Requests',
      description: 'Immediate notices when healthcare providers request permission to view your records',
      state: consentPrefs,
      setter: setConsentPrefs,
      isMandatory: false,
    },
    {
      id: 'security',
      title: 'Security & Account Integrity Alerts',
      description: 'New device logins, password modifications, and session revocation confirmations',
      state: securityPrefs,
      setter: setSecurityPrefs,
      isMandatory: true,
    },
  ];

  return (
    <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Notification & Alert Channels
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Customize how HealthBridge India reaches you across in-app banners, email, and SMS
            </p>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="p-5 space-y-5 text-xs">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Delivery Channels Capability Notice */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4 text-teal-600" />
              <span>Channel Delivery Status</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>In-App Notifications: <strong>Operational</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Email Gateway: <strong>Operational (Verified)</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>SMS Gateway: <strong>Sandbox Preview</strong></span>
              </span>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground">{cat.title}</h4>
                      {cat.isMandatory && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/10">
                          Mandatory Security
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cat.description}</p>
                  </div>
                </div>

                {/* Delivery Channel Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/40">
                  {/* In-App Toggle */}
                  <label
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] select-none ${
                      cat.isMandatory
                        ? 'bg-muted/50 border-border/40 cursor-not-allowed opacity-80'
                        : 'bg-card border-border/60 cursor-pointer hover:border-border'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                      <span>In-App Banner</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={cat.state.inApp}
                      disabled={cat.isMandatory}
                      onChange={(e) =>
                        cat.setter({ ...cat.state, inApp: e.target.checked })
                      }
                      className="rounded border-border text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                  </label>

                  {/* Email Toggle */}
                  <label
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] select-none ${
                      cat.isMandatory
                        ? 'bg-muted/50 border-border/40 cursor-not-allowed opacity-80'
                        : 'bg-card border-border/60 cursor-pointer hover:border-border'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                      <span>Email Delivery</span>
                    </span>
                    {cat.isMandatory ? (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Required</span>
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={cat.state.email}
                        onChange={(e) =>
                          cat.setter({ ...cat.state, email: e.target.checked })
                        }
                        className="rounded border-border text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                      />
                    )}
                  </label>

                  {/* SMS Toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg border bg-card border-border/60 cursor-pointer hover:border-border text-[11px] select-none">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                      <span>SMS Messages</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={cat.state.sms}
                      onChange={(e) =>
                        cat.setter({ ...cat.state, sms: e.target.checked })
                      }
                      className="rounded border-border text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2.5 p-4 border-t border-border/60 bg-muted/10">
          <Button
            type="submit"
            size="sm"
            disabled={updateMutation.isPending || isLoading}
            className="text-xs gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateMutation.isPending ? 'Saving...' : 'Save Preferences'}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
