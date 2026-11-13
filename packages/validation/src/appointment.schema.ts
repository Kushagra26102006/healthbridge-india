import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  facilityId: z.string().optional(),
  scheduledAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Appointment schedule time must be in the future',
  }),
  reason: z
    .string()
    .trim()
    .min(3, 'Reason for visit must be at least 3 characters long')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

