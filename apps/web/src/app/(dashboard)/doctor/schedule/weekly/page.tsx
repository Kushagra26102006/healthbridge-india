'use client';

import React, { useState } from 'react';
import {
  ScheduleHeader,
  WeeklyScheduleEditor,
  ScheduleOverrideDialog,
} from '@/components/doctor/schedule';

export default function DoctorWeeklySchedulePage() {
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <ScheduleHeader
        onOpenOverrideModal={() => setShowOverrideModal(true)}
      />
      <WeeklyScheduleEditor />

      <ScheduleOverrideDialog
        open={showOverrideModal}
        onOpenChange={setShowOverrideModal}
      />
    </div>
  );
}
