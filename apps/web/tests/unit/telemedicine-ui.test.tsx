import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...rest }, children),
}));

import { AppointmentDetails } from '@/components/patient/appointments/AppointmentDetails';
import { VideoConsultationRoom } from '@/components/telemedicine/VideoConsultationRoom';

describe('Telemedicine Patient & Doctor UI Components', () => {
  const baseAppointment = {
    id: '650000000000000000000901',
    patientId: '650000000000000000000101',
    doctorId: '650000000000000000000201',
    doctorName: 'Dr. Priya Sharma',
    doctorSpecialization: ['Cardiology'],
    doctorQualifications: ['MBBS', 'DM'],
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
    startTime: '17:00',
    endTime: '17:20',
    consultationType: 'TELECONSULTATION' as const,
    status: 'CONFIRMED' as const,
    reason: 'Routine video follow-up for blood pressure',
    createdAt: new Date().toISOString(),
  };

  it('shows Join Video Consultation CTA on confirmed TELECONSULTATION appointment details', () => {
    const html = renderToStaticMarkup(
      <AppointmentDetails
        appointment={baseAppointment as any}
        onCancelClick={() => {}}
        onRescheduleClick={() => {}}
      />
    );

    expect(html).toContain('Join Video Consultation');
    expect(html).toContain('/patient/appointments/650000000000000000000901/consultation');
    expect(html).toContain('Dr. Priya Sharma');
    expect(html).toContain('17:00');
  });

  it('hides Join Video Consultation button for IN_PERSON or CANCELLED appointments', () => {
    const inPersonHtml = renderToStaticMarkup(
      <AppointmentDetails
        appointment={{ ...baseAppointment, consultationType: 'IN_PERSON' } as any}
        onCancelClick={() => {}}
        onRescheduleClick={() => {}}
      />
    );
    expect(inPersonHtml).not.toContain('Join Video Consultation');

    const cancelledHtml = renderToStaticMarkup(
      <AppointmentDetails
        appointment={{ ...baseAppointment, status: 'CANCELLED' } as any}
        onCancelClick={() => {}}
        onRescheduleClick={() => {}}
      />
    );
    expect(cancelledHtml).not.toContain('Join Video Consultation');
  });

  it('renders VideoConsultationRoom with emergency disclaimer and DTLS-SRTP non-recording badges', () => {
    const html = renderToStaticMarkup(
      <VideoConsultationRoom
        appointmentId="650000000000000000000901"
        portalRole="PATIENT"
        backHref="/patient/appointments"
      />
    );

    expect(html).toContain('Not an Emergency Service');
    expect(html).toContain('112');
    expect(html).toContain('DTLS-SRTP Encrypted');
    expect(html).toContain('Not Recorded');
  });
});
