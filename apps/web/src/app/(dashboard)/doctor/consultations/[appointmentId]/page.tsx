'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { VideoConsultationRoom } from '@/components/telemedicine/VideoConsultationRoom';

export default function DoctorVideoConsultationPage() {
  const params = useParams();
  const appointmentId = Array.isArray(params.appointmentId)
    ? params.appointmentId[0] || ''
    : String(params.appointmentId || '');

  return (
    <VideoConsultationRoom
      appointmentId={appointmentId}
      portalRole="DOCTOR"
      backHref="/doctor/dashboard"
      backLabel="Back to Doctor Dashboard"
    />
  );
}
