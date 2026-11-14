import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const weekdayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const consultationModeEnum = z.enum(['IN_PERSON', 'TELECONSULTATION']);

export const consultationTypeConfigEnum = z.enum([
  'IN_PERSON',
  'TELECONSULTATION',
  'FOLLOW_UP',
]);

export const workingWindowSchema = z
  .object({
    start: z.string().regex(timeRegex, 'Start time must be in HH:mm format (e.g. 09:00)'),
    end: z.string().regex(timeRegex, 'End time must be in HH:mm format (e.g. 17:00)'),
  })
  .refine((val) => val.start < val.end, {
    message: 'Working window start time must be strictly before end time',
  });

export const breakIntervalSchema = z
  .object({
    start: z.string().regex(timeRegex, 'Break start time must be in HH:mm format'),
    end: z.string().regex(timeRegex, 'Break end time must be in HH:mm format'),
    label: z.string().trim().max(100).optional(),
  })
  .refine((val) => val.start < val.end, {
    message: 'Break start time must be strictly before end time',
  });

export const dayScheduleSchema = z
  .object({
    day: weekdayEnum,
    isEnabled: z.boolean(),
    workingWindows: z.array(workingWindowSchema).default([]),
    breaks: z.array(breakIntervalSchema).default([]),
    slotDurationMinutes: z.number().int().min(10).max(120).default(30),
    bufferMinutes: z.number().int().min(0).max(60).default(5),
    consultationModes: z.array(consultationModeEnum).default(['IN_PERSON', 'TELECONSULTATION']),
  })
  .refine(
    (day) => {
      if (!day.isEnabled) return true;
      if (day.workingWindows.length === 0) return false;
      // Check that working windows don't overlap
      const sorted = [...day.workingWindows].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i]!.end > sorted[i + 1]!.start) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Active working day must have at least one valid, non-overlapping working window',
    }
  )
  .refine(
    (day) => {
      if (!day.isEnabled || day.breaks.length === 0) return true;
      // Breaks must be inside at least one working window
      for (const brk of day.breaks) {
        const fitsInWindow = day.workingWindows.some(
          (w) => brk.start >= w.start && brk.end <= w.end
        );
        if (!fitsInWindow) return false;
      }
      return true;
    },
    {
      message: 'Break intervals must be positioned entirely within configured working hours',
    }
  );

export const consultationTypeConfigSchema = z.object({
  type: consultationTypeConfigEnum,
  name: z.string().trim().min(2).max(100),
  isEnabled: z.boolean(),
  durationMinutes: z.number().int().min(10).max(120),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  facilityName: z.string().trim().max(100).optional(),
  fee: z.number().min(0).optional(),
  bufferMinutes: z.number().int().min(0).max(60).default(5),
  description: z.string().trim().max(500).optional(),
});

export const updateDoctorWeeklyScheduleSchema = z.object({
  timezone: z.string().default('Asia/Kolkata'),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
  bufferMinutes: z.number().int().min(0).max(60).optional(),
  weeklySchedule: z.array(dayScheduleSchema).min(1, 'Weekly schedule must contain at least one day configuration'),
  consultationTypes: z.array(consultationTypeConfigSchema).optional(),
});

export const blockDateRequestSchema = z
  .object({
    startDate: z.string().regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(dateRegex, 'End date must be in YYYY-MM-DD format'),
    isAllDay: z.boolean().default(true),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format').optional(),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
    reason: z
      .string({ required_error: 'Block reason is required' })
      .trim()
      .min(3, 'Reason must be at least 3 characters long')
      .max(200, 'Reason cannot exceed 200 characters'),
    forceWithConflicts: z.boolean().default(false),
  })
  .refine((val) => val.startDate <= val.endDate, {
    message: 'Start date cannot be after end date',
  })
  .refine(
    (val) => {
      if (val.isAllDay) return true;
      if (!val.startTime || !val.endTime) return false;
      return val.startTime < val.endTime;
    },
    {
      message: 'Partial-day blocks require valid start and end times where start precedes end',
    }
  );

export const scheduleOverrideSchema = z
  .object({
    date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
    isWorkingDay: z.boolean(),
    reason: z
      .string({ required_error: 'Override reason is required' })
      .trim()
      .min(3, 'Reason must be at least 3 characters long')
      .max(200, 'Reason cannot exceed 200 characters'),
    workingWindows: z.array(workingWindowSchema).optional().default([]),
    breaks: z.array(breakIntervalSchema).optional().default([]),
  })
  .refine(
    (val) => {
      if (!val.isWorkingDay) return true;
      return val.workingWindows.length > 0;
    },
    {
      message: 'A working override day must define at least one working time window',
    }
  );

export const scheduleCalendarQuerySchema = z.object({
  view: z.enum(['day', 'week', 'month']).default('week'),
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
});

export const scheduleAvailabilityQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  consultationType: consultationTypeConfigEnum.optional(),
});

export const blockedDateIdParamSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
});

export const overrideIdParamSchema = z.object({
  overrideId: z.string().min(1, 'Override ID is required'),
});

export type WorkingWindowInput = z.infer<typeof workingWindowSchema>;
export type BreakIntervalInput = z.infer<typeof breakIntervalSchema>;
export type DayScheduleInput = z.infer<typeof dayScheduleSchema>;
export type ConsultationTypeConfigInput = z.infer<typeof consultationTypeConfigSchema>;
export type UpdateDoctorWeeklyScheduleInput = z.infer<typeof updateDoctorWeeklyScheduleSchema>;
export type BlockDateRequestInput = z.infer<typeof blockDateRequestSchema>;
export type ScheduleOverrideInput = z.infer<typeof scheduleOverrideSchema>;
export type ScheduleCalendarQueryInput = z.infer<typeof scheduleCalendarQuerySchema>;
export type ScheduleAvailabilityQueryInput = z.infer<typeof scheduleAvailabilityQuerySchema>;
export type BlockedDateIdParamInput = z.infer<typeof blockedDateIdParamSchema>;
export type OverrideIdParamInput = z.infer<typeof overrideIdParamSchema>;

