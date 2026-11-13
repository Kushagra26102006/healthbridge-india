import { z } from 'zod';

export const appointmentStatusEnum = z.enum([
  'REQUESTED',
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const consultationTypeEnum = z.enum(['IN_PERSON', 'TELECONSULTATION']);

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required' })
    .regex(objectIdRegex, 'Invalid doctor ID format'),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  scheduledAt: z.string({ required_error: 'Appointment schedule date/time is required' }).refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d > new Date();
    },
    { message: 'Appointment schedule time must be in the future' }
  ),
  startTime: z
    .string({ required_error: 'Start time slot is required' })
    .regex(timeRegex, 'Start time must be in HH:mm 24-hour format (e.g. 09:30)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
  consultationType: consultationTypeEnum.default('IN_PERSON'),
  reason: z
    .string({ required_error: 'Reason for consultation is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters long')
    .max(500, 'Reason cannot exceed 500 characters'),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z
    .string({ required_error: 'Cancellation reason is required' })
    .trim()
    .min(3, 'Cancellation reason must be at least 3 characters long')
    .max(500, 'Cancellation reason cannot exceed 500 characters'),
});

export const rescheduleAppointmentSchema = z.object({
  newScheduledAt: z.string({ required_error: 'New appointment date/time is required' }).refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d > new Date();
    },
    { message: 'Rescheduled appointment time must be in the future' }
  ),
  newStartTime: z
    .string({ required_error: 'New start time is required' })
    .regex(timeRegex, 'Time must be in HH:mm 24-hour format'),
  newEndTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum,
});

export const appointmentFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['scheduledAt', 'createdAt']).default('scheduledAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const appointmentIdParamSchema = z.object({
  appointmentId: z
    .string({ required_error: 'Appointment ID is required' })
    .regex(objectIdRegex, 'Invalid appointment ID format'),
});

export const doctorFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  specialization: z.string().trim().optional(),
  facilityId: z.string().optional(),
  city: z.string().trim().optional(),
  consultationType: consultationTypeEnum.optional(),
});

export const doctorIdParamSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required' })
    .regex(objectIdRegex, 'Invalid doctor ID format'),
});

export const doctorAvailabilityQuerySchema = z.object({
  date: z
    .string({ required_error: 'Date is required for availability schedule' })
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format (e.g. 2026-11-20)'),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentFilterQueryInput = z.infer<typeof appointmentFilterQuerySchema>;
export type AppointmentIdParamInput = z.infer<typeof appointmentIdParamSchema>;
export type DoctorFilterQueryInput = z.infer<typeof doctorFilterQuerySchema>;
export type DoctorIdParamInput = z.infer<typeof doctorIdParamSchema>;
export type DoctorAvailabilityQueryInput = z.infer<typeof doctorAvailabilityQuerySchema>;
