'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Users,
  Stethoscope,
  Clock,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDoctorNotificationPreferences } from '@/features/doctor/hooks/use-doctor';
import type { ChannelPreferences } from '@healthbridge/shared-types';

export function DoctorNotificationPreferencesForm() {
  const { preferences, isLoading, isError, error, updatePreferences, isUpdating } =
    useDoctorNotificationPreferences();

  const [newAppointmentRequests, setNewAppointmentRequests] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [appointmentChanges, setAppointmentChanges] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [patientCheckIns, setPatientCheckIns] = useState<ChannelPreferences>({
    inApp: true,
    email: false,
    sms: false,
  });
  const [consultationReminders, setConsultationReminders] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
  });
  const [clinicalWorkflowAlerts, setClinicalWorkflowAlerts] = useState<ChannelPreferences>({
    inApp: true,
    email: false,
    sms: false,
  });
  const [securityAlerts, setSecurityAlerts] = useState<ChannelPreferences>({
    inApp: true,
    email: true,
    sms: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      if (preferences.newAppointmentRequests) setNewAppointmentRequests(preferences.newAppointmentRequests);
      if (preferences.appointmentChanges) setAppointmentChanges(preferences.appointmentChanges);
      if (preferences.patientCheckIns) setPatientCheckIns(preferences.patientCheckIns);
      if (preferences.consultationReminders) setConsultationReminders(preferences.consultationReminders);
      if (preferences.clinicalWorkflowAlerts) setClinicalWorkflowAlerts(preferences.clinicalWorkflowAlerts);
      if (preferences.securityAlerts) setSecurityAlerts(preferences.securityAlerts);
    }
  }, [preferences]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        <div className="h-40 rounded-xl bg-muted/60" />
        <div className="h-40 rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (isError || !preferences) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80 max-w-4xl">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm font-semibold text-destructive">Failed to load notification preferences</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error'}</p>
      </Card>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updatePreferences({
        newAppointmentRequests,
        appointmentChanges,
        patientCheckIns,
        consultationReminders,
        clinicalWorkflowAlerts,
        securityAlerts: {
          inApp: true, // Mandatory
          email: true, // Mandatory
          sms: securityAlerts.sms,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update notification preferences');
    }
  };

  const notificationCategories = [
    {
      title: 'New Appointment Bookings',
      description: 'Receive real-time alerts when a patient schedules an appointment slot',
      icon: Calendar,
      state: newAppointmentRequests,
      setter: setNewAppointmentRequests,
      isMandatory: false,
    },
    {
      title: 'Appointment Cancellations & Rescheduling',
      description: 'Immediate notification when patient appointments are rescheduled or cancelled',
      icon: Clock,
      state: appointmentChanges,
      setter: setAppointmentChanges,
      isMandatory: false,
    },
    {
      title: 'Patient Clinic Check-ins & Queue Arrival',
      description: 'Alert when a scheduled patient checks into the clinic and joins the active queue',
      icon: Users,
      state: patientCheckIns,
      setter: setPatientCheckIns,
      isMandatory: false,
    },
    {
      title: 'Upcoming Consultation Reminders',
      description: 'Daily briefing and 15-minute reminders before upcoming consultations start',
      icon: Bell,
      state: consultationReminders,
      setter: setConsultationReminders,
      isMandatory: false,
    },
    {
      title: 'Clinical Workflow Alerts',
      description: 'Updates when lab diagnostic results are released or e-prescriptions are dispensed',
      icon: Stethoscope,
      state: clinicalWorkflowAlerts,
      setter: setClinicalWorkflowAlerts,
      isMandatory: false,
    },
    {
      title: 'Security & Account Safeguards',
      description: 'New device logins, session revocations, password changes, and access alerts',
      icon: ShieldAlert,
      state: securityAlerts,
      setter: setSecurityAlerts,
      isMandatory: true,
    },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl">
      {saveSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">Notification preferences updated successfully!</div>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="font-semibold">{saveError}</div>
        </div>
      )}

      {/* Channel Availability Notice */}
      <Card className="border border-border/80 bg-muted/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-foreground">Configured Delivery Channels:</span>
            <p className="text-muted-foreground text-[11px]">
              HealthBridge India sends clinical notifications via in-app dashboard badges and verified SMTP email.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
              In-App Active
            </Badge>
            <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px]">
              Email Active
            </Badge>
            <Badge variant="outline" className="text-muted-foreground text-[10px]">
              SMS (Disabled by Policy)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories Grid */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Notification Routing Preferences
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Customize which delivery channels trigger alerts for specific clinical events
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 divide-y divide-border/40">
          {notificationCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{cat.title}</span>
                      {cat.isMandatory && (
                        <Badge variant="outline" className="text-[9px] gap-1 text-amber-600 border-amber-500/40">
                          <Lock className="h-2.5 w-2.5" /> Mandatory
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                  </div>
                </div>

                {/* Channel Toggles */}
                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                  {/* In-App Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={cat.state.inApp}
                      disabled={cat.isMandatory}
                      onChange={(e) =>
                        cat.setter({ ...cat.state, inApp: e.target.checked })
                      }
                      className="h-3.5 w-3.5 rounded border-border text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-muted-foreground">In-App</span>
                  </label>

                  {/* Email Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={cat.state.email}
                      disabled={cat.isMandatory}
                      onChange={(e) =>
                        cat.setter({ ...cat.state, email: e.target.checked })
                      }
                      className="h-3.5 w-3.5 rounded border-border text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                    />
                    <span className="text-muted-foreground">Email</span>
                  </label>

                  {/* SMS Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={cat.state.sms}
                      onChange={(e) =>
                        cat.setter({ ...cat.state, sms: e.target.checked })
                      }
                      className="h-3.5 w-3.5 rounded border-border text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-muted-foreground">SMS</span>
                  </label>
                </div>
              </div>
            );
          })}
        </CardContent>

        <CardFooter className="border-t border-border/60 py-3.5 px-6 flex justify-end bg-muted/10">
          <Button
            type="submit"
            size="sm"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isUpdating ? 'Saving Preferences...' : 'Save Notification Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default DoctorNotificationPreferencesForm;
