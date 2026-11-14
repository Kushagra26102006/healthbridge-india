'use client';

import React, { useState } from 'react';
import {
  ScheduleHeader,
  ConsultationSettings,
  ScheduleOverrideDialog,
} from '@/components/doctor/schedule';

export default function DoctorScheduleSettingsPage() {
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <ScheduleHeader
        onOpenOverrideModal={() => setShowOverrideModal(true)}
      />
      <ConsultationSettings />

      <ScheduleOverrideDialog
        open={showOverrideModal}
        onOpenChange={setShowOverrideModal}
      />
    </div>
  );
}

