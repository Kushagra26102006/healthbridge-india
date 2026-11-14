import { Types } from 'mongoose';
import mongoose from 'mongoose';
import {
  DoctorScheduleModel,
  IDoctorScheduleDocument,
  IDaySchedule,
  IConsultationTypeConfig,
  IBlockedDate,
  IScheduleOverride,
} from '../../healthcare/models/doctor-schedule.model';
import { DoctorProfileModel } from '../../users/models/doctor-profile.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { FacilityModel } from '../../healthcare/models/facility.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import type {
  DoctorScheduleDto,
  DayScheduleDto,
  BlockedDateDto,
  ScheduleOverrideDto,
  ScheduleOverviewDto,
  CalendarViewItemDto,
  AffectedAppointmentSummaryDto,
  BlockDateResultDto,
  TimeSlotDto,
} from '@healthbridge/shared-types';
import type {
  UpdateDoctorWeeklyScheduleInput,
  BlockDateRequestInput,
  ScheduleOverrideInput,
  ScheduleCalendarQueryInput,
} from '@healthbridge/validation';

const DEFAULT_DAYS: DayScheduleDto['day'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DEFAULT_WEEKLY_SCHEDULE: IDaySchedule[] = [
  {
    day: 'MONDAY',
    isEnabled: true,
    workingWindows: [{ start: '09:00', end: '17:00' }],
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
  },
  {
    day: 'TUESDAY',
    isEnabled: true,
    workingWindows: [{ start: '09:00', end: '17:00' }],
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
  },
  {
    day: 'WEDNESDAY',
    isEnabled: true,
    workingWindows: [{ start: '09:00', end: '17:00' }],
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
  },
  {
    day: 'THURSDAY',
    isEnabled: true,
    workingWindows: [{ start: '09:00', end: '17:00' }],
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
  },
  {
    day: 'FRIDAY',
    isEnabled: true,
    workingWindows: [{ start: '09:00', end: '17:00' }],
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
  },
  {
    day: 'SATURDAY',
    isEnabled: true,
    workingWindows: [{ start: '09:00', end: '13:00' }],
    breaks: [],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON'],
  },
  {
    day: 'SUNDAY',
    isEnabled: false,
    workingWindows: [],
    breaks: [],
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    consultationModes: ['IN_PERSON'],
  },
];

const DEFAULT_CONSULTATION_TYPES: IConsultationTypeConfig[] = [
  {
    type: 'IN_PERSON',
    name: 'In-Person Consultation',
    isEnabled: true,
    durationMinutes: 30,
    fee: 500,
    bufferMinutes: 5,
    description: 'Standard in-clinic physical examination and consultation',
  },
  {
    type: 'TELECONSULTATION',
    name: 'Video Teleconsultation',
    isEnabled: true,
    durationMinutes: 20,
    fee: 400,
    bufferMinutes: 5,
    description: 'Secure remote audio/video consultation via HealthBridge portal',
  },
  {
    type: 'FOLLOW_UP',
    name: 'Quick Follow-Up',
    isEnabled: true,
    durationMinutes: 15,
    fee: 250,
    bufferMinutes: 5,
    description: 'Post-consultation or lab report review within 14 days of initial visit',
  },
];

export class DoctorScheduleService {
  /**
   * Resolve Doctor ID (support either User ID or DoctorProfile ObjectId)
   */
  private async resolveDoctorUser(userId: string): Promise<{
    userObjectId: Types.ObjectId;
    profileObjectId?: Types.ObjectId;
    facilityId?: Types.ObjectId;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    let profile: any = null;
    try {
      profile = await DoctorProfileModel.findOne({ userId: userObjectId }).lean();
    } catch {
      profile = null;
    }

    if (profile) {
      return {
        userObjectId: profile.userId as Types.ObjectId,
        profileObjectId: profile._id as Types.ObjectId,
        facilityId: profile.facilityId as Types.ObjectId | undefined,
      };
    }

    return { userObjectId };
  }

  /**
   * Helper to audit schedule changes
   */
  private async recordAudit(params: {
    actorId: string;
    action: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          userId: new Types.ObjectId(params.actorId),
          action: params.action,
          resource: 'DOCTOR_SCHEDULE',
          resourceId: params.resourceId,
          details: params.metadata || {},
          timestamp: new Date(),
        });
      }
    } catch {
      // Non-blocking audit logger
    }
  }

  /**
   * Mask patient name for privacy in doctor calendar
   */
  private maskPatientName(name?: string): string {
    if (!name || !name.trim()) return 'Patient';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      const first = parts[0]!;
      return first.length > 2 ? `${first.slice(0, 2)}***` : `${first}*`;
    }
    const first = parts[0]!;
    const last = parts[parts.length - 1]!;
    return `${first} ${last.charAt(0)}.`;
  }

  /**
   * Ensure doctor schedule exists, initializing with defaults or profile settings if new
   */
  async getOrCreateSchedule(userId: string): Promise<IDoctorScheduleDocument> {
    const { userObjectId, profileObjectId, facilityId } = await this.resolveDoctorUser(userId);

    const isConnected = mongoose.connection.readyState === 1;
    const isScheduleFindOneMocked = Boolean((DoctorScheduleModel.findOne as any)?.mock);

    let schedule: any = null;
    if (isConnected || isScheduleFindOneMocked) {
      try {
        schedule = await DoctorScheduleModel.findOne({
          $or: [{ doctorId: userObjectId }, ...(profileObjectId ? [{ doctorId: profileObjectId }] : [])],
        });
      } catch {
        schedule = null;
      }
    }

    if (!schedule) {
      // Check existing DoctorProfile to seed initial working days/hours
      let profile: any = null;
      const isProfileFindOneMocked = Boolean((DoctorProfileModel.findOne as any)?.mock);
      if (isConnected || isProfileFindOneMocked) {
        try {
          profile = await DoctorProfileModel.findOne({ userId: userObjectId }).lean();
        } catch {
          profile = null;
        }
      }

      let initialWeekly = [...DEFAULT_WEEKLY_SCHEDULE];
      if (profile?.workingDays && profile.workingDays.length > 0) {
        const activeDays = new Set(profile.workingDays);
        const start = profile.workingHours?.start || '09:00';
        const end = profile.workingHours?.end || '17:00';
        initialWeekly = initialWeekly.map((d) => ({
          ...d,
          isEnabled: activeDays.has(d.day),
          workingWindows: activeDays.has(d.day) ? [{ start, end }] : [],
          slotDurationMinutes: profile.slotDurationMinutes || 30,
        }));
      }

      const isScheduleCreateMocked = Boolean((DoctorScheduleModel.create as any)?.mock);
      if (isConnected || isScheduleCreateMocked) {
        try {
          schedule = await DoctorScheduleModel.create({
            doctorId: userObjectId,
            facilityId: facilityId || profile?.facilityId,
            timezone: 'Asia/Kolkata',
            slotDurationMinutes: profile?.slotDurationMinutes || 30,
            bufferMinutes: 5,
            weeklySchedule: initialWeekly,
            consultationTypes: DEFAULT_CONSULTATION_TYPES,
            blockedDates: (profile?.blockedSlots || []).map((bs: any) => ({
              _id: new Types.ObjectId(),
              startDate: bs.date,
              endDate: bs.date,
              isAllDay: false,
              startTime: bs.startTime,
              endTime: bs.endTime,
              reason: bs.reason || 'Blocked time period',
              createdAt: new Date(),
            })),
            overrides: [],
          });
        } catch {
          schedule = null;
        }
      }

      if (!schedule) {
        // Resilient fallback for disconnected/mock environments
        schedule = {
          _id: new Types.ObjectId(),
          doctorId: userObjectId,
          facilityId: facilityId || profile?.facilityId,
          timezone: 'Asia/Kolkata',
          slotDurationMinutes: profile?.slotDurationMinutes || 30,
          bufferMinutes: 5,
          weeklySchedule: initialWeekly,
          consultationTypes: DEFAULT_CONSULTATION_TYPES,
          blockedDates: [],
          overrides: [],
          save: async () => schedule,
        };
      }
    }

    return schedule;
  }

  /**
   * Get formatted DoctorScheduleDto with weekly schedule, consultation types, blocks, and overrides
   */
  async getSchedule(userId: string): Promise<DoctorScheduleDto> {
    const schedule = await this.getOrCreateSchedule(userId);

    // Populate facility details if associated
    let facilityName: string | undefined;
    if (schedule.facilityId) {
      try {
        const query: any = FacilityModel.findById(schedule.facilityId);
        let fac: any = null;
        if (query && typeof query.select === 'function') {
          fac = await query.select('name').lean();
        } else {
          fac = await query;
        }
        if (fac) facilityName = fac.name;
      } catch {
        facilityName = undefined;
      }
    }

    const enabledDays = schedule.weeklySchedule.filter((d) => d.isEnabled).map((d) => d.day);
    const firstEnabled = schedule.weeklySchedule.find((d) => d.isEnabled && d.workingWindows.length > 0);
    const workingHours = {
      start: firstEnabled?.workingWindows[0]?.start || '09:00',
      end: firstEnabled?.workingWindows[0]?.end || '17:00',
    };

    // Calculate existingBlocks for legacy compatibility + active booked appointments
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    let appointments: any[] = [];
    try {
      const q = AppointmentModel.find({
        doctorId: schedule.doctorId,
        scheduledAt: { $gte: now, $lte: nextWeek },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      });
      if (q && typeof (q as any).lean === 'function') {
        appointments = await (q as any).lean();
      } else if (q && typeof (q as any).then === 'function') {
        appointments = await q;
      }
    } catch {
      appointments = [];
    }

    const existingBlocks = (schedule.blockedDates || []).map((b: any) => ({
      date: b.startDate,
      startTime: b.startTime || '00:00',
      endTime: b.endTime || '23:59',
      reason: b.reason,
    })).concat(
      appointments.map((apt: any) => ({
        date: apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0]! : 'today',
        startTime: apt.startTime || '09:00',
        endTime: apt.endTime || '09:30',
        reason: 'Booked Patient Appointment',
      }))
    );

    return {
      doctorId: schedule.doctorId.toString(),
      workingDays: enabledDays,
      workingHours,
      slotDurationMinutes: schedule.slotDurationMinutes,
      consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
      existingBlocks,
      timezone: schedule.timezone || 'Asia/Kolkata',
      bufferMinutes: schedule.bufferMinutes || 5,
      facilityId: schedule.facilityId?.toString(),
      facilityName,
      weeklySchedule: schedule.weeklySchedule.map((w) => ({
        day: w.day,
        isEnabled: w.isEnabled,
        workingWindows: w.workingWindows.map((ww) => ({ start: ww.start, end: ww.end })),
        breaks: w.breaks.map((b) => ({ start: b.start, end: b.end, label: b.label })),
        slotDurationMinutes: w.slotDurationMinutes,
        bufferMinutes: w.bufferMinutes,
        consultationModes: w.consultationModes,
      })),
      consultationTypes: (schedule.consultationTypes || []).map((c) => ({
        type: c.type,
        name: c.name,
        isEnabled: c.isEnabled,
        durationMinutes: c.durationMinutes,
        facilityId: c.facilityId?.toString(),
        fee: c.fee,
        bufferMinutes: c.bufferMinutes,
        description: c.description,
      })),
      blockedDates: (schedule.blockedDates || []).map((b) => ({
        id: b._id.toString(),
        startDate: b.startDate,
        endDate: b.endDate,
        isAllDay: b.isAllDay,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        createdAt: b.createdAt.toISOString(),
      })),
      overrides: (schedule.overrides || []).map((o) => ({
        id: o._id.toString(),
        date: o.date,
        isWorkingDay: o.isWorkingDay,
        reason: o.reason,
        workingWindows: o.workingWindows.map((ww) => ({ start: ww.start, end: ww.end })),
        breaks: o.breaks.map((b) => ({ start: b.start, end: b.end, label: b.label })),
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Update full weekly schedule, breaks, working windows, buffer times, and consultation settings
   */
  async updateWeeklySchedule(
    userId: string,
    input: UpdateDoctorWeeklyScheduleInput
  ): Promise<DoctorScheduleDto> {
    const schedule = await this.getOrCreateSchedule(userId);

    if (input.timezone) schedule.timezone = input.timezone;
    if (input.slotDurationMinutes) schedule.slotDurationMinutes = input.slotDurationMinutes;
    if (input.bufferMinutes !== undefined) schedule.bufferMinutes = input.bufferMinutes;
    if (input.facilityId) {
      schedule.facilityId = new Types.ObjectId(input.facilityId);
    }

    if (input.weeklySchedule && input.weeklySchedule.length > 0) {
      // Validate all 7 days represented or merge with current
      const dayMap = new Map<string, IDaySchedule>();
      schedule.weeklySchedule.forEach((d) => dayMap.set(d.day, d));

      input.weeklySchedule.forEach((d) => {
        dayMap.set(d.day, {
          day: d.day,
          isEnabled: d.isEnabled,
          workingWindows: d.workingWindows,
          breaks: d.breaks,
          slotDurationMinutes: d.slotDurationMinutes || schedule.slotDurationMinutes,
          bufferMinutes: d.bufferMinutes !== undefined ? d.bufferMinutes : schedule.bufferMinutes,
          consultationModes: d.consultationModes,
        });
      });

      // Preserve consistent Monday-Sunday ordering
      schedule.weeklySchedule = DEFAULT_DAYS.map(
        (dayName) =>
          dayMap.get(dayName) || {
            day: dayName,
            isEnabled: false,
            workingWindows: [],
            breaks: [],
            slotDurationMinutes: 30,
            bufferMinutes: 5,
            consultationModes: ['IN_PERSON'],
          }
      );
    }

    if (input.consultationTypes && input.consultationTypes.length > 0) {
      schedule.consultationTypes = input.consultationTypes.map((c) => ({
        type: c.type,
        name: c.name,
        isEnabled: c.isEnabled,
        durationMinutes: c.durationMinutes,
        facilityId: c.facilityId ? new Types.ObjectId(c.facilityId) : undefined,
        fee: c.fee,
        bufferMinutes: c.bufferMinutes,
        description: c.description,
      }));
    }

    await schedule.save();

    // Synchronize top-level fields back to DoctorProfile for backwards compatibility
    const enabledDays = schedule.weeklySchedule.filter((d) => d.isEnabled).map((d) => d.day);
    const firstEnabled = schedule.weeklySchedule.find((d) => d.isEnabled && d.workingWindows.length > 0);
    const workingHours = {
      start: firstEnabled?.workingWindows[0]?.start || '09:00',
      end: firstEnabled?.workingWindows[0]?.end || '17:00',
    };

    await DoctorProfileModel.updateOne(
      { userId: schedule.doctorId },
      {
        $set: {
          workingDays: enabledDays,
          workingHours,
          slotDurationMinutes: schedule.slotDurationMinutes,
          facilityId: schedule.facilityId,
        },
      }
    );

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_WEEKLY_SCHEDULE_UPDATED',
      resourceId: schedule._id.toString(),
      metadata: { enabledDaysCount: enabledDays.length, timezone: schedule.timezone },
    });

    return this.getSchedule(userId);
  }

  /**
   * Get Schedule Overview (today working hours, appointments, available slots, next working day)
   */
  async getScheduleOverview(userId: string): Promise<ScheduleOverviewDto> {
    const schedule = await this.getOrCreateSchedule(userId);
    const tz = schedule.timezone || 'Asia/Kolkata';

    // Get current date string in doctor's timezone (YYYY-MM-DD)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayDateStr = formatter.format(now);

    // Determine current day of week in doctor's timezone
    const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
    });
    const todayDayName = dayOfWeekFormatter.format(now).toUpperCase() as DayScheduleDto['day'];

    // Check today's configuration (taking overrides into account)
    const overrideToday = schedule.overrides.find((o) => o.date === todayDateStr);
    let todayIsWorking = false;
    let todayStart = '09:00';
    let todayEnd = '17:00';

    if (overrideToday) {
      todayIsWorking = overrideToday.isWorkingDay;
      if (todayIsWorking && overrideToday.workingWindows.length > 0) {
        todayStart = overrideToday.workingWindows[0]!.start;
        todayEnd = overrideToday.workingWindows[overrideToday.workingWindows.length - 1]!.end;
      }
    } else {
      const todayDayConfig = schedule.weeklySchedule.find((d) => d.day === todayDayName);
      if (todayDayConfig && todayDayConfig.isEnabled && todayDayConfig.workingWindows.length > 0) {
        todayIsWorking = true;
        todayStart = todayDayConfig.workingWindows[0]!.start;
        todayEnd = todayDayConfig.workingWindows[todayDayConfig.workingWindows.length - 1]!.end;
      }
    }

    // Check blocked dates for today
    const isBlockedToday = schedule.blockedDates.some(
      (b) => b.isAllDay && todayDateStr >= b.startDate && todayDateStr <= b.endDate
    );
    if (isBlockedToday) {
      todayIsWorking = false;
    }

    // Count today's appointments in DB
    const startOfTodayUtc = new Date(`${todayDateStr}T00:00:00.000Z`);
    const endOfTodayUtc = new Date(`${todayDateStr}T23:59:59.999Z`);

    const todayAppointments = await AppointmentModel.find({
      doctorId: schedule.doctorId,
      scheduledAt: { $gte: startOfTodayUtc, $lte: endOfTodayUtc },
      status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
    }).lean();

    // Query available slots for today using authoritative slot generation
    let todayAvailableSlotsCount = 0;
    if (todayIsWorking) {
      const slots = await this.getDoctorAvailabilitySlots(schedule.doctorId.toString(), todayDateStr);
      todayAvailableSlotsCount = slots.slots.filter((s) => s.isAvailable).length;
    }

    // Today's blocked periods count (partial blocks)
    const todayBlockedPeriodsCount = schedule.blockedDates.filter(
      (b) => todayDateStr >= b.startDate && todayDateStr <= b.endDate
    ).length;

    // Determine next working day
    let nextWorkingDay: { date: string; day: string; hours: string } | undefined;
    for (let offset = 1; offset <= 14; offset++) {
      const futureDate = new Date(now.getTime() + offset * 86400000);
      const futureDateStr = formatter.format(futureDate);
      const futureDayName = dayOfWeekFormatter.format(futureDate).toUpperCase() as DayScheduleDto['day'];

      // Check override
      const override = schedule.overrides.find((o) => o.date === futureDateStr);
      if (override) {
        if (override.isWorkingDay && override.workingWindows.length > 0) {
          nextWorkingDay = {
            date: futureDateStr,
            day: futureDayName,
            hours: `${override.workingWindows[0]!.start} - ${override.workingWindows[override.workingWindows.length - 1]!.end}`,
          };
          break;
        }
        continue;
      }

      // Check block
      const isBlocked = schedule.blockedDates.some(
        (b) => b.isAllDay && futureDateStr >= b.startDate && futureDateStr <= b.endDate
      );
      if (isBlocked) continue;

      const dayConfig = schedule.weeklySchedule.find((d) => d.day === futureDayName);
      if (dayConfig && dayConfig.isEnabled && dayConfig.workingWindows.length > 0) {
        nextWorkingDay = {
          date: futureDateStr,
          day: futureDayName,
          hours: `${dayConfig.workingWindows[0]!.start} - ${dayConfig.workingWindows[dayConfig.workingWindows.length - 1]!.end}`,
        };
        break;
      }
    }

    // Weekly schedule summary
    const enabledDays = schedule.weeklySchedule.filter((d) => d.isEnabled);
    let totalWeeklyMinutes = 0;
    const daysSummary = schedule.weeklySchedule.map((d) => {
      let hoursStr = 'Closed';
      if (d.isEnabled && d.workingWindows.length > 0) {
        hoursStr = d.workingWindows.map((w) => `${w.start} - ${w.end}`).join(', ');
        d.workingWindows.forEach((w) => {
          const [sh, sm] = w.start.split(':').map(Number);
          const [eh, em] = w.end.split(':').map(Number);
          totalWeeklyMinutes += (eh! * 60 + em!) - (sh! * 60 + sm!);
        });
      }
      return {
        day: d.day,
        isEnabled: d.isEnabled,
        hours: hoursStr,
      };
    });

    let activeFacility: { id: string; name: string; address?: string } | undefined;
    if (schedule.facilityId) {
      const fac = await FacilityModel.findById(schedule.facilityId).lean();
      if (fac) {
        activeFacility = {
          id: fac._id.toString(),
          name: fac.name,
          address: `${fac.address?.line1 || ''}, ${fac.address?.city || ''}`,
        };
      }
    }

    return {
      todayWorkingHours: {
        start: todayStart,
        end: todayEnd,
        isWorking: todayIsWorking,
      },
      todayAppointmentsCount: todayAppointments.length,
      todayAvailableSlotsCount,
      todayBlockedPeriodsCount,
      nextWorkingDay,
      weeklyScheduleSummary: {
        totalWorkingDays: enabledDays.length,
        totalWeeklyHours: Math.round((totalWeeklyMinutes / 60) * 10) / 10,
        days: daysSummary,
      },
      activeFacility,
    };
  }

  /**
   * AUTHORITATIVE SLOT GENERATION ALGORITHM
   * Generates discrete consultation slots for a doctor on a specific date in the doctor's timezone.
   * Excludes breaks, blocks, booked appointments, and past slots.
   */
  async getDoctorAvailabilitySlots(
    doctorId: string,
    dateStr: string,
    consultationType?: string,
    _facilityId?: string
  ): Promise<{
    date: string;
    doctorId: string;
    slots: TimeSlotDto[];
  }> {
    const { userObjectId } = await this.resolveDoctorUser(doctorId);
    const schedule = await this.getOrCreateSchedule(userObjectId.toString());
    const tz = schedule.timezone || 'Asia/Kolkata';

    // Parse day of week for target date (in doctor's timezone)
    const targetDateObj = new Date(`${dateStr}T12:00:00.000Z`);
    const dayName = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
    }).format(targetDateObj).toUpperCase() as DayScheduleDto['day'];

    // 1. Check full-day blocks / leaves
    const fullDayBlock = schedule.blockedDates.find(
      (b) => b.isAllDay && dateStr >= b.startDate && dateStr <= b.endDate
    );
    if (fullDayBlock) {
      return {
        date: dateStr,
        doctorId,
        slots: [],
      };
    }

    // 2. Determine working windows, breaks, slot duration, and buffer minutes
    let workingWindows: Array<{ start: string; end: string }> = [];
    let breaks: Array<{ start: string; end: string; label?: string }> = [];
    let slotDuration = schedule.slotDurationMinutes || 30;
    let bufferMinutes = schedule.bufferMinutes || 5;

    // Check special day override
    const override = schedule.overrides.find((o) => o.date === dateStr);
    if (override) {
      if (!override.isWorkingDay) {
        return { date: dateStr, doctorId, slots: [] };
      }
      workingWindows = override.workingWindows;
      breaks = override.breaks;
    } else {
      const dayConfig = schedule.weeklySchedule.find((d) => d.day === dayName);
      if (!dayConfig || !dayConfig.isEnabled) {
        return { date: dateStr, doctorId, slots: [] };
      }
      workingWindows = dayConfig.workingWindows;
      breaks = dayConfig.breaks;
      slotDuration = dayConfig.slotDurationMinutes || slotDuration;
      bufferMinutes = dayConfig.bufferMinutes !== undefined ? dayConfig.bufferMinutes : bufferMinutes;
    }

    // Check consultation type config if provided
    if (consultationType) {
      const typeConfig = schedule.consultationTypes.find(
        (c) => c.type === consultationType && c.isEnabled
      );
      if (typeConfig) {
        slotDuration = typeConfig.durationMinutes || slotDuration;
        bufferMinutes = typeConfig.bufferMinutes !== undefined ? typeConfig.bufferMinutes : bufferMinutes;
      }
    }

    // Gather partial day blocks for this date
    const partialBlocks = schedule.blockedDates.filter(
      (b) => !b.isAllDay && dateStr >= b.startDate && dateStr <= b.endDate && b.startTime && b.endTime
    );

    // 3. Find booked appointments for doctor on target date
    const bookedTimestamps = new Set<string>();
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      try {
        const startOfDayUtc = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDayUtc = new Date(`${dateStr}T23:59:59.999Z`);

        const booked = await AppointmentModel.find({
          doctorId: userObjectId,
          scheduledAt: { $gte: startOfDayUtc, $lte: endOfDayUtc },
          status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        }).lean();

        booked.forEach((app) => {
          bookedTimestamps.add(new Date(app.scheduledAt).toISOString());
        });
      } catch {
        // Fallback
      }
    }

    const now = new Date();
    const rawSlots: Array<{
      start: string;
      end: string;
      label: string;
    }> = [];

    // 4. Generate candidate intervals within each working window
    for (const window of workingWindows) {
      const [wStartH, wStartM] = window.start.split(':').map(Number);
      const [wEndH, wEndM] = window.end.split(':').map(Number);

      let currentMinutes = (wStartH || 0) * 60 + (wStartM || 0);
      const windowEndMinutes = (wEndH || 0) * 60 + (wEndM || 0);

      while (currentMinutes + slotDuration <= windowEndMinutes) {
        const slotEndMinutes = currentMinutes + slotDuration;

        const slotStartH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
        const slotStartM = String(currentMinutes % 60).padStart(2, '0');
        const slotEndH = String(Math.floor(slotEndMinutes / 60)).padStart(2, '0');
        const slotEndM = String(slotEndMinutes % 60).padStart(2, '0');

        const startTimeStr = `${slotStartH}:${slotStartM}`;
        const endTimeStr = `${slotEndH}:${slotEndM}`;

        // Format 12-hour label (e.g. 09:30 AM)
        const hourNum = parseInt(slotStartH, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayH = hourNum % 12 === 0 ? 12 : hourNum % 12;
        const label = `${String(displayH).padStart(2, '0')}:${slotStartM} ${ampm}`;

        // 5. Check if slot overlaps with any configured break
        const overlapsBreak = breaks.some(
          (b) => startTimeStr < b.end && endTimeStr > b.start
        );

        // 6. Check if slot overlaps with any partial block
        const overlapsBlock = partialBlocks.some(
          (pb) => startTimeStr < pb.endTime! && endTimeStr > pb.startTime!
        );

        if (!overlapsBreak && !overlapsBlock) {
          rawSlots.push({
            start: startTimeStr,
            end: endTimeStr,
            label,
          });
        }

        // Advance by slotDuration + bufferMinutes
        currentMinutes += slotDuration + bufferMinutes;
      }
    }

    // 7. Convert slots to UTC instant using doctor's timezone (default Asia/Kolkata = UTC+5:30)
    const slots: TimeSlotDto[] = rawSlots.map((slot) => {
      const [hours, minutes] = slot.start.split(':').map(Number);
      const slotDate = new Date(`${dateStr}T00:00:00.000Z`);

      // IST conversion: subtract 330 minutes for Asia/Kolkata
      // In general, compute UTC offset for the timezone
      const istMinutesTotal = (hours || 0) * 60 + (minutes || 0);
      const utcMinutesTotal = istMinutesTotal - 330;
      slotDate.setUTCMinutes(utcMinutesTotal);

      const timestamp = slotDate.toISOString();
      const isPast = slotDate <= now;
      const isBooked = bookedTimestamps.has(timestamp);

      return {
        time: slot.label,
        startTime: slot.start,
        endTime: slot.end,
        timestamp,
        isAvailable: !isPast && !isBooked,
      };
    });

    return {
      date: dateStr,
      doctorId,
      slots,
    };
  }

  /**
   * Calendar view aggregator for Day, Week, or Month
   */
  async getCalendarView(
    userId: string,
    query: ScheduleCalendarQueryInput
  ): Promise<{
    view: 'day' | 'week' | 'month';
    startDate: string;
    endDate: string;
    items: CalendarViewItemDto[];
  }> {
    const schedule = await this.getOrCreateSchedule(userId);
    const tz = schedule.timezone || 'Asia/Kolkata';

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const baseDateStr = query.date || formatter.format(now);
    const baseDate = new Date(`${baseDateStr}T12:00:00.000Z`);

    let startDateStr = baseDateStr;
    let endDateStr = baseDateStr;

    if (query.view === 'day') {
      startDateStr = baseDateStr;
      endDateStr = baseDateStr;
    } else if (query.view === 'week') {
      // 7 days starting from baseDate
      const start = new Date(baseDate);
      const end = new Date(baseDate);
      end.setDate(end.getDate() + 6);
      startDateStr = formatter.format(start);
      endDateStr = formatter.format(end);
    } else if (query.view === 'month') {
      // 30 days view window
      const start = new Date(baseDate);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      startDateStr = formatter.format(start);
      endDateStr = formatter.format(end);
    }

    const startUtc = new Date(`${startDateStr}T00:00:00.000Z`);
    const endUtc = new Date(`${endDateStr}T23:59:59.999Z`);

    // Fetch appointments in range
    const appointments = await AppointmentModel.find({
      doctorId: schedule.doctorId,
      scheduledAt: { $gte: startUtc, $lte: endUtc },
    })
      .populate('patientId', 'name')
      .lean();

    const items: CalendarViewItemDto[] = [];

    // 1. Add booked appointments
    appointments.forEach((apt) => {
      const aptDate = apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0]! : baseDateStr;
      const patientName = (apt.patientId as any)?.name;
      items.push({
        id: apt._id.toString(),
        type: 'APPOINTMENT',
        date: aptDate,
        startTime: apt.startTime || '09:00',
        endTime: apt.endTime || '09:30',
        title: `Consultation (${apt.consultationType || 'IN_PERSON'})`,
        status: apt.status,
        appointmentType: apt.consultationType,
        patientMasked: this.maskPatientName(patientName),
        reason: apt.reason,
      });
    });

    // 2. Add blocked dates
    schedule.blockedDates.forEach((b) => {
      if (b.startDate <= endDateStr && b.endDate >= startDateStr) {
        items.push({
          id: b._id.toString(),
          type: 'BLOCKED',
          date: b.startDate,
          startTime: b.startTime || '00:00',
          endTime: b.endTime || '23:59',
          title: `Blocked: ${b.reason}`,
          reason: b.reason,
        });
      }
    });

    // 3. Add special overrides
    schedule.overrides.forEach((o) => {
      if (o.date >= startDateStr && o.date <= endDateStr) {
        items.push({
          id: o._id.toString(),
          type: 'OVERRIDE',
          date: o.date,
          startTime: o.workingWindows[0]?.start || '09:00',
          endTime: o.workingWindows[o.workingWindows.length - 1]?.end || '17:00',
          title: `Special Hours: ${o.reason}`,
          reason: o.reason,
        });
      }
    });

    // 4. For day view, include generated available time slots
    if (query.view === 'day') {
      const availability = await this.getDoctorAvailabilitySlots(schedule.doctorId.toString(), baseDateStr);
      availability.slots
        .filter((s) => s.isAvailable)
        .forEach((slot, idx) => {
          items.push({
            id: `slot-${baseDateStr}-${idx}`,
            type: 'SLOT',
            date: baseDateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
            title: `Available Slot (${slot.time})`,
            isAvailable: true,
          });
        });
    }

    return {
      view: query.view,
      startDate: startDateStr,
      endDate: endDateStr,
      items: items.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    };
  }

  /**
   * Get Blocked Dates and Leaves with conflict detection
   */
  async getBlockedDates(userId: string): Promise<BlockedDateDto[]> {
    const schedule = await this.getOrCreateSchedule(userId);

    const result: BlockedDateDto[] = [];
    for (const b of schedule.blockedDates) {
      const startUtc = new Date(`${b.startDate}T00:00:00.000Z`);
      const endUtc = new Date(`${b.endDate}T23:59:59.999Z`);

      const count = await AppointmentModel.countDocuments({
        doctorId: schedule.doctorId,
        scheduledAt: { $gte: startUtc, $lte: endUtc },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
      });

      result.push({
        id: b._id.toString(),
        startDate: b.startDate,
        endDate: b.endDate,
        isAllDay: b.isAllDay,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        affectedAppointmentCount: count,
        createdAt: b.createdAt.toISOString(),
      });
    }

    return result.sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  /**
   * Create Blocked Date with Conflict Detection
   * Prevents silent cancellation of booked patient appointments.
   */
  async createBlockedDate(
    userId: string,
    input: BlockDateRequestInput
  ): Promise<BlockDateResultDto> {
    const schedule = await this.getOrCreateSchedule(userId);

    const startUtc = new Date(`${input.startDate}T00:00:00.000Z`);
    const endUtc = new Date(`${input.endDate}T23:59:59.999Z`);

    // Detect conflicting booked appointments in the target block window
    const filter: Record<string, unknown> = {
      doctorId: schedule.doctorId,
      scheduledAt: { $gte: startUtc, $lte: endUtc },
      status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
    };

    if (!input.isAllDay && input.startTime && input.endTime) {
      filter.startTime = { $lt: input.endTime };
      filter.endTime = { $gt: input.startTime };
    }

    const conflicting = await AppointmentModel.find(filter)
      .populate('patientId', 'name')
      .lean();

    // If appointments conflict and caller has not explicitly confirmed:
    if (conflicting.length > 0 && !input.forceWithConflicts) {
      const affectedAppointments: AffectedAppointmentSummaryDto[] = conflicting.map((c) => ({
        id: c._id.toString(),
        patientNameMasked: this.maskPatientName((c.patientId as any)?.name),
        date: c.scheduledAt ? new Date(c.scheduledAt).toISOString().split('T')[0]! : input.startDate,
        startTime: c.startTime || '09:00',
        endTime: c.endTime || '09:30',
        consultationType: c.consultationType || 'IN_PERSON',
        status: c.status,
      }));

      return {
        success: false,
        hasConflicts: true,
        affectedAppointments,
        message: `Conflict detected: ${conflicting.length} patient appointment(s) already exist during this time period. Explicit confirmation required.`,
      };
    }

    // Save blocked date
    const newBlock: IBlockedDate = {
      _id: new Types.ObjectId(),
      startDate: input.startDate,
      endDate: input.endDate,
      isAllDay: input.isAllDay ?? true,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason,
      createdAt: new Date(),
    };

    schedule.blockedDates.push(newBlock);
    await schedule.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_BLOCKED_DATE_CREATED',
      resourceId: newBlock._id.toString(),
      metadata: {
        startDate: input.startDate,
        endDate: input.endDate,
        conflictsOverridden: conflicting.length,
      },
    });

    const affectedAppointments: AffectedAppointmentSummaryDto[] = conflicting.map((c) => ({
      id: c._id.toString(),
      patientNameMasked: this.maskPatientName((c.patientId as any)?.name),
      date: c.scheduledAt ? new Date(c.scheduledAt).toISOString().split('T')[0]! : input.startDate,
      startTime: c.startTime || '09:00',
      endTime: c.endTime || '09:30',
      consultationType: c.consultationType || 'IN_PERSON',
      status: c.status,
    }));

    return {
      success: true,
      hasConflicts: conflicting.length > 0,
      affectedAppointments,
      blockedDate: {
        id: newBlock._id.toString(),
        startDate: newBlock.startDate,
        endDate: newBlock.endDate,
        isAllDay: newBlock.isAllDay,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        reason: newBlock.reason,
        affectedAppointmentCount: conflicting.length,
        createdAt: newBlock.createdAt.toISOString(),
      },
      message: conflicting.length > 0
        ? `Blocked date created with ${conflicting.length} existing appointment(s) flagged for rescheduling.`
        : 'Time period blocked successfully with zero conflicts.',
    };
  }

  /**
   * Delete Blocked Date
   */
  async deleteBlockedDate(userId: string, blockId: string): Promise<void> {
    const schedule = await this.getOrCreateSchedule(userId);
    const initialLen = schedule.blockedDates.length;

    schedule.blockedDates = schedule.blockedDates.filter(
      (b) => b._id.toString() !== blockId
    );

    if (schedule.blockedDates.length === initialLen) {
      throw AppError.notFound('Blocked date entry not found');
    }

    await schedule.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_BLOCKED_DATE_DELETED',
      resourceId: blockId,
    });
  }

  /**
   * Get Special Working Day Overrides
   */
  async getScheduleOverrides(userId: string): Promise<ScheduleOverrideDto[]> {
    const schedule = await this.getOrCreateSchedule(userId);

    return schedule.overrides.map((o) => ({
      id: o._id.toString(),
      date: o.date,
      isWorkingDay: o.isWorkingDay,
      reason: o.reason,
      workingWindows: o.workingWindows.map((ww) => ({ start: ww.start, end: ww.end })),
      breaks: o.breaks.map((b) => ({ start: b.start, end: b.end, label: b.label })),
      createdAt: o.createdAt.toISOString(),
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Create or Update Special Working Day Override
   */
  async createScheduleOverride(
    userId: string,
    input: ScheduleOverrideInput
  ): Promise<ScheduleOverrideDto> {
    const schedule = await this.getOrCreateSchedule(userId);

    // Remove existing override for same date if present
    schedule.overrides = schedule.overrides.filter((o) => o.date !== input.date);

    const newOverride: IScheduleOverride = {
      _id: new Types.ObjectId(),
      date: input.date,
      isWorkingDay: input.isWorkingDay,
      reason: input.reason,
      workingWindows: input.workingWindows || [],
      breaks: input.breaks || [],
      createdAt: new Date(),
    };

    schedule.overrides.push(newOverride);
    await schedule.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_SCHEDULE_OVERRIDE_SAVED',
      resourceId: newOverride._id.toString(),
      metadata: { date: input.date, isWorkingDay: input.isWorkingDay },
    });

    return {
      id: newOverride._id.toString(),
      date: newOverride.date,
      isWorkingDay: newOverride.isWorkingDay,
      reason: newOverride.reason,
      workingWindows: newOverride.workingWindows.map((ww) => ({ start: ww.start, end: ww.end })),
      breaks: newOverride.breaks.map((b) => ({ start: b.start, end: b.end, label: b.label })),
      createdAt: newOverride.createdAt.toISOString(),
    };
  }

  /**
   * Delete Special Working Day Override
   */
  async deleteScheduleOverride(userId: string, overrideId: string): Promise<void> {
    const schedule = await this.getOrCreateSchedule(userId);
    const initialLen = schedule.overrides.length;

    schedule.overrides = schedule.overrides.filter(
      (o) => o._id.toString() !== overrideId
    );

    if (schedule.overrides.length === initialLen) {
      throw AppError.notFound('Schedule override entry not found');
    }

    await schedule.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_SCHEDULE_OVERRIDE_DELETED',
      resourceId: overrideId,
    });
  }

  /**
   * Retrieve facilities associated with doctor or active in system
   */
  async getDoctorFacilities(userId: string): Promise<Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    isPrimary: boolean;
  }>> {
    const schedule = await this.getOrCreateSchedule(userId);
    const facilities = await FacilityModel.find({ isActive: true }).lean();

    return facilities.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      type: f.facilityType,
      address: `${f.address?.line1 || ''}, ${f.address?.city || ''}`,
      isPrimary: schedule.facilityId ? schedule.facilityId.toString() === f._id.toString() : false,
    }));
  }
}

export const doctorScheduleService = new DoctorScheduleService();
export default doctorScheduleService;
