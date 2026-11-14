import mongoose, { Types } from 'mongoose';
import {
  UserModel,
  DoctorProfileModel,
  PatientProfileModel,
  AppointmentModel,
  EncounterModel,
  AuditLogModel,
  NotificationModel,
} from '../../../database/models';
import { AppError } from '../../../shared/errors/app-error';
import { HttpStatus } from '../../../shared/constants/http-status';
import { ErrorCode } from '../../../shared/errors/error-codes';
import type {
  DoctorAppointmentItemDto,
  DoctorAppointmentSummaryCountsDto,
  DoctorQueueItemDto,
  DoctorAppointmentDetailDto,
  DoctorScheduleDto,
  UpdateDoctorScheduleDto,
  DoctorAppointmentFilterQueryDto,
  PaginationMeta,
  AppointmentStatus,
} from '@healthbridge/shared-types';

export class DoctorAppointmentService {
  /**
   * Helper to resolve both Doctor User ID and DoctorProfile ID for matching appointments
   */
  private async getDoctorIds(userId: string): Promise<Types.ObjectId[]> {
    const userObjectId = new Types.ObjectId(userId);
    const doctorProfile = await DoctorProfileModel.findOne({ userId });
    const ids: Types.ObjectId[] = [userObjectId];
    if (doctorProfile && !doctorProfile._id.equals(userObjectId)) {
      ids.push(doctorProfile._id);
    }
    return ids;
  }

  /**
   * Safe audit logging helper
   */
  private async recordAudit(params: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    requestId?: string;
    outcome?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          actorId: params.actorId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          timestamp: new Date(),
          requestId: params.requestId || `req-apt-${Date.now()}`,
          outcome: params.outcome || 'SUCCESS',
          metadata: params.metadata,
        });
      }
    } catch {
      // Non-blocking audit logger
    }
  }

  /**
   * Safe patient notification dispatcher
   */
  private async notifyPatient(params: {
    patientId: Types.ObjectId | string;
    title: string;
    message: string;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await NotificationModel.create({
          userId: new Types.ObjectId(params.patientId),
          title: params.title,
          message: params.message,
          type: 'APPOINTMENT',
        });
      }
    } catch {
      // Non-blocking notification dispatcher
    }
  }

  /**
   * Get appointment summary counts for dashboard and navigation
   */
  async getSummaryCounts(userId: string): Promise<DoctorAppointmentSummaryCountsDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayCount, upcomingCount, pendingCount, completedCount, cancelledCount, totalCount] =
      await Promise.all([
        AppointmentModel.countDocuments({
          doctorId: { $in: doctorIds },
          scheduledAt: { $gte: todayStart, $lte: todayEnd },
          status: { $nin: ['CANCELLED'] },
        }),
        AppointmentModel.countDocuments({
          doctorId: { $in: doctorIds },
          scheduledAt: { $gt: todayEnd },
          status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
        }),
        AppointmentModel.countDocuments({
          doctorId: { $in: doctorIds },
          status: 'REQUESTED',
        }),
        AppointmentModel.countDocuments({
          doctorId: { $in: doctorIds },
          status: 'COMPLETED',
        }),
        AppointmentModel.countDocuments({
          doctorId: { $in: doctorIds },
          status: 'CANCELLED',
        }),
        AppointmentModel.countDocuments({
          doctorId: { $in: doctorIds },
        }),
      ]);

    return {
      today: todayCount,
      upcoming: upcomingCount,
      pending: pendingCount,
      completed: completedCount,
      cancelled: cancelledCount,
      total: totalCount,
    };
  }

  /**
   * List appointments with pagination, search, and multidimensional filters
   */
  async getAppointments(
    userId: string,
    filters: DoctorAppointmentFilterQueryDto
  ): Promise<{ items: DoctorAppointmentItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      doctorId: { $in: doctorIds },
    };

    // Filter by Tab
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (filters.filterTab === 'today') {
      query.scheduledAt = { $gte: todayStart, $lte: todayEnd };
    } else if (filters.filterTab === 'upcoming') {
      query.scheduledAt = { $gt: todayEnd };
      query.status = { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] };
    } else if (filters.filterTab === 'pending') {
      query.status = 'REQUESTED';
    } else if (filters.filterTab === 'history') {
      query.status = { $in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] };
    }

    // Direct status filter
    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    // Consultation type
    if (filters.consultationType) {
      query.consultationType = filters.consultationType;
    }

    // Date range
    if (filters.startDate || filters.endDate) {
      const dateRange: Record<string, Date> = {};
      if (filters.startDate) dateRange.$gte = new Date(filters.startDate);
      if (filters.endDate) dateRange.$lte = new Date(filters.endDate);
      query.scheduledAt = dateRange;
    }

    // Patient search
    if (filters.search) {
      const matchingPatients = await UserModel.find({
        role: 'PATIENT',
        name: { $regex: filters.search, $options: 'i' },
      }).select('_id');
      const patientIds = matchingPatients.map((p) => p._id);

      if (patientIds.length > 0) {
        query.$or = [
          { patientId: { $in: patientIds } },
          { reason: { $regex: filters.search, $options: 'i' } },
        ];
      } else {
        query.reason = { $regex: filters.search, $options: 'i' };
      }
    }

    const [appointments, total] = await Promise.all([
      AppointmentModel.find(query)
        .sort({ scheduledAt: filters.filterTab === 'history' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'name phone')
        .populate('facilityId', 'name')
        .lean(),
      AppointmentModel.countDocuments(query),
    ]);

    const items: DoctorAppointmentItemDto[] = appointments.map((apt: any) => {
      const patient = apt.patientId as any;
      const facility = apt.facilityId as any;

      return {
        id: apt._id?.toString() || apt.id,
        patientId: patient?._id?.toString() || apt.patientId?.toString() || 'unknown',
        patientName: patient?.name || 'Authorized Patient',
        patientPhone: patient?.phone,
        scheduledAt: apt.scheduledAt ? new Date(apt.scheduledAt).toISOString() : new Date().toISOString(),
        startTime: apt.startTime || '09:00',
        endTime: apt.endTime || '09:30',
        consultationType: apt.consultationType || 'IN_PERSON',
        reason: apt.reason || 'General clinical consultation',
        facilityName: facility?.name || 'Main Healthcare Facility',
        status: apt.status || 'CONFIRMED',
        queueNumber: apt.queueNumber,
        checkedInAt: apt.checkedInAt ? new Date(apt.checkedInAt).toISOString() : undefined,
        consultationStartedAt: apt.consultationStartedAt ? new Date(apt.consultationStartedAt).toISOString() : undefined,
        completedAt: apt.completedAt ? new Date(apt.completedAt).toISOString() : undefined,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single appointment detailed view with patient demographics & authorization checks
   */
  async getAppointmentById(userId: string, appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    })
      .populate('patientId', 'name email phone')
      .populate('facilityId', 'name facilityType address')
      .lean();

    if (!appointment) {
      throw AppError.notFound('Appointment not found or you lack clinical authorization to view it');
    }

    const patient = appointment.patientId as any;
    const facility = appointment.facilityId as any;

    // Fetch patient profile for gender/DOB
    let patientGender: string | undefined;
    let patientAge: number | undefined;

    if (patient?._id) {
      const profile = await PatientProfileModel.findOne({ userId: patient._id }).lean();
      if (profile) {
        patientGender = profile.gender;
        if (profile.dateOfBirth) {
          const diff = Date.now() - new Date(profile.dateOfBirth).getTime();
          patientAge = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
    }

    // Previous encounter reference
    let previousEncounterId: string | undefined;
    if (patient?._id) {
      const prevEncounter = await EncounterModel.findOne({
        patientId: patient._id,
        practitionerId: { $in: doctorIds },
        status: 'COMPLETED',
      })
        .sort({ startTime: -1 })
        .select('_id')
        .lean();
      if (prevEncounter) {
        previousEncounterId = prevEncounter._id.toString();
      }
    }

    return {
      id: appointment._id.toString(),
      patientId: patient?._id?.toString() || appointment.patientId.toString(),
      patientName: patient?.name || 'Authorized Patient',
      patientPhone: patient?.phone,
      patientEmail: patient?.email,
      patientGender,
      patientAge,
      scheduledAt: appointment.scheduledAt.toISOString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      consultationType: appointment.consultationType,
      facility: facility
        ? {
            id: facility._id?.toString() || facility.id,
            name: facility.name,
            type: facility.facilityType,
            address: facility.address,
          }
        : undefined,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      queueNumber: appointment.queueNumber,
      checkedInAt: appointment.checkedInAt ? appointment.checkedInAt.toISOString() : undefined,
      consultationStartedAt: appointment.consultationStartedAt ? appointment.consultationStartedAt.toISOString() : undefined,
      completedAt: appointment.completedAt ? appointment.completedAt.toISOString() : undefined,
      cancelledAt: appointment.cancelledAt ? appointment.cancelledAt.toISOString() : undefined,
      cancellationReason: appointment.cancellationReason,
      rejectionReason: appointment.rejectionReason,
      encounterId: appointment.encounterId?.toString(),
      previousEncounterId,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  /**
   * Confirm appointment (REQUESTED / SCHEDULED -> CONFIRMED)
   */
  async confirmAppointment(userId: string, appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    });

    if (!appointment) {
      throw AppError.notFound('Appointment not found or not owned by you');
    }

    if (appointment.status !== 'REQUESTED' && appointment.status !== 'SCHEDULED') {
      throw new AppError(
        `Cannot confirm appointment in '${appointment.status}' state. Only REQUESTED or SCHEDULED appointments can be confirmed.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    appointment.status = 'CONFIRMED';
    appointment.confirmedBy = new Types.ObjectId(userId);
    await appointment.save();

    await this.recordAudit({
      actorId: userId,
      action: 'APPOINTMENT_CONFIRMED',
      resourceType: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: { previousStatus: 'REQUESTED', newStatus: 'CONFIRMED' },
    });

    await this.notifyPatient({
      patientId: appointment.patientId,
      title: 'Appointment Confirmed',
      message: `Your appointment for ${new Date(appointment.scheduledAt).toLocaleDateString('en-IN')} at ${appointment.startTime} has been confirmed.`,
    });

    return this.getAppointmentById(userId, appointmentId);
  }

  /**
   * Reject appointment (REQUESTED / SCHEDULED -> CANCELLED)
   */
  async rejectAppointment(
    userId: string,
    appointmentId: string,
    reason?: string
  ): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    });

    if (!appointment) {
      throw AppError.notFound('Appointment not found or not owned by you');
    }

    if (appointment.status !== 'REQUESTED' && appointment.status !== 'SCHEDULED') {
      throw new AppError(
        `Cannot reject appointment in '${appointment.status}' state.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    const rejectionMsg = reason || 'Declined by doctor due to schedule unavailability';
    appointment.status = 'CANCELLED';
    appointment.cancelledBy = new Types.ObjectId(userId);
    appointment.cancelledAt = new Date();
    appointment.rejectionReason = rejectionMsg;
    appointment.cancellationReason = rejectionMsg;
    await appointment.save();

    await this.recordAudit({
      actorId: userId,
      action: 'APPOINTMENT_REJECTED',
      resourceType: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: { reason: rejectionMsg },
    });

    await this.notifyPatient({
      patientId: appointment.patientId,
      title: 'Appointment Request Declined',
      message: `Your appointment request could not be accepted. Reason: ${rejectionMsg}`,
    });

    return this.getAppointmentById(userId, appointmentId);
  }

  /**
   * Check in patient (CONFIRMED / SCHEDULED -> CHECKED_IN)
   */
  async checkInPatient(userId: string, appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    });

    if (!appointment) {
      throw AppError.notFound('Appointment not found or not owned by you');
    }

    if (appointment.status !== 'CONFIRMED' && appointment.status !== 'SCHEDULED') {
      throw new AppError(
        `Cannot check in patient with appointment status '${appointment.status}'. Must be CONFIRMED or SCHEDULED.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    // Allocate queue number for today if not present
    if (!appointment.queueNumber) {
      const todayStart = new Date(appointment.scheduledAt);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(appointment.scheduledAt);
      todayEnd.setHours(23, 59, 59, 999);

      const maxQueueApt = await AppointmentModel.findOne({
        doctorId: { $in: doctorIds },
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        queueNumber: { $exists: true, $ne: null },
      })
        .sort({ queueNumber: -1 })
        .select('queueNumber')
        .lean();

      appointment.queueNumber = (maxQueueApt?.queueNumber || 0) + 1;
    }

    appointment.status = 'CHECKED_IN';
    appointment.checkedInAt = new Date();
    await appointment.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PATIENT_CHECKED_IN',
      resourceType: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: { queueNumber: appointment.queueNumber },
    });

    return this.getAppointmentById(userId, appointmentId);
  }

  /**
   * Start consultation (CHECKED_IN / CONFIRMED / SCHEDULED -> IN_PROGRESS)
   * Also creates or links an Encounter document
   */
  async startConsultation(userId: string, appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    });

    if (!appointment) {
      throw AppError.notFound('Appointment not found or not owned by you');
    }

    if (
      appointment.status !== 'CHECKED_IN' &&
      appointment.status !== 'CONFIRMED' &&
      appointment.status !== 'SCHEDULED'
    ) {
      throw new AppError(
        `Cannot start consultation for appointment in '${appointment.status}' state.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    // Create or link Encounter
    let encounter = appointment.encounterId
      ? await EncounterModel.findById(appointment.encounterId)
      : null;

    if (!encounter) {
      encounter = await EncounterModel.create({
        patientId: appointment.patientId,
        practitionerId: new Types.ObjectId(userId),
        facilityId: appointment.facilityId,
        appointmentId: appointment._id,
        encounterType: appointment.consultationType === 'TELECONSULTATION' ? 'VIRTUAL' : 'AMBULATORY',
        startTime: new Date(),
        status: 'IN_PROGRESS',
        notes: appointment.reason,
      });
      appointment.encounterId = encounter._id;
    } else {
      encounter.status = 'IN_PROGRESS';
      await encounter.save();
    }

    appointment.status = 'IN_PROGRESS';
    appointment.consultationStartedAt = new Date();
    await appointment.save();

    await this.recordAudit({
      actorId: userId,
      action: 'CONSULTATION_STARTED',
      resourceType: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: { encounterId: encounter._id.toString() },
    });

    return this.getAppointmentById(userId, appointmentId);
  }

  /**
   * Complete consultation (IN_PROGRESS -> COMPLETED)
   */
  async completeConsultation(userId: string, appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    });

    if (!appointment) {
      throw AppError.notFound('Appointment not found or not owned by you');
    }

    if (appointment.status !== 'IN_PROGRESS' && appointment.status !== 'CHECKED_IN' && appointment.status !== 'CONFIRMED') {
      throw new AppError(
        `Cannot complete appointment in '${appointment.status}' state. Consultation must be active.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    appointment.status = 'COMPLETED';
    appointment.completedAt = new Date();
    appointment.completedBy = new Types.ObjectId(userId);
    await appointment.save();

    // Complete linked encounter if present
    if (appointment.encounterId) {
      await EncounterModel.findByIdAndUpdate(appointment.encounterId, {
        status: 'COMPLETED',
        endTime: new Date(),
      });
    }

    await this.recordAudit({
      actorId: userId,
      action: 'CONSULTATION_COMPLETED',
      resourceType: 'APPOINTMENT',
      resourceId: appointmentId,
    });

    await this.notifyPatient({
      patientId: appointment.patientId,
      title: 'Consultation Completed',
      message: `Your consultation on ${new Date(appointment.scheduledAt).toLocaleDateString('en-IN')} has been completed. Check your dashboard for records & prescriptions.`,
    });

    return this.getAppointmentById(userId, appointmentId);
  }

  /**
   * Cancel appointment with reason
   */
  async cancelAppointment(
    userId: string,
    appointmentId: string,
    reason: string
  ): Promise<DoctorAppointmentDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const appointment = await AppointmentModel.findOne({
      _id: new Types.ObjectId(appointmentId),
      doctorId: { $in: doctorIds },
    });

    if (!appointment) {
      throw AppError.notFound('Appointment not found or not owned by you');
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw new AppError(
        `Cannot cancel an appointment that is already ${appointment.status}.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = new Types.ObjectId(userId);
    appointment.cancellationReason = reason;
    await appointment.save();

    // Cancel linked encounter if was active
    if (appointment.encounterId) {
      await EncounterModel.findByIdAndUpdate(appointment.encounterId, {
        status: 'CANCELLED',
        endTime: new Date(),
      });
    }

    await this.recordAudit({
      actorId: userId,
      action: 'APPOINTMENT_CANCELLED',
      resourceType: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: { reason },
    });

    await this.notifyPatient({
      patientId: appointment.patientId,
      title: 'Appointment Cancelled',
      message: `Your appointment scheduled for ${new Date(appointment.scheduledAt).toLocaleDateString('en-IN')} has been cancelled. Reason: ${reason}`,
    });

    return this.getAppointmentById(userId, appointmentId);
  }

  /**
   * Daily patient queue with priority ordering and waiting duration calculation
   */
  async getDailyQueue(userId: string, filter?: string): Promise<DoctorQueueItemDto[]> {
    const doctorIds = await this.getDoctorIds(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const query: Record<string, unknown> = {
      doctorId: { $in: doctorIds },
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'] },
    };

    if (filter === 'WAITING') {
      query.status = 'CHECKED_IN';
    } else if (filter === 'IN_CONSULTATION') {
      query.status = 'IN_PROGRESS';
    } else if (filter === 'COMPLETED') {
      query.status = 'COMPLETED';
    }

    const appointments = await AppointmentModel.find(query)
      .populate('patientId', 'name phone')
      .lean();

    const now = Date.now();

    const queueItems: DoctorQueueItemDto[] = appointments.map((apt: any, idx) => {
      const patient = apt.patientId as any;
      const checkedInTime = apt.checkedInAt ? new Date(apt.checkedInAt).getTime() : undefined;
      const waitingMinutes = checkedInTime && apt.status === 'CHECKED_IN'
        ? Math.max(0, Math.floor((now - checkedInTime) / 60000))
        : undefined;

      return {
        id: apt._id.toString(),
        queueNumber: apt.queueNumber || idx + 1,
        patientId: patient?._id?.toString() || apt.patientId?.toString() || 'unknown',
        patientName: patient?.name || 'Authorized Patient',
        patientPhone: patient?.phone,
        scheduledAt: apt.scheduledAt.toISOString(),
        startTime: apt.startTime || '09:00',
        endTime: apt.endTime || '09:30',
        consultationType: apt.consultationType || 'IN_PERSON',
        status: apt.status,
        checkedInAt: apt.checkedInAt ? apt.checkedInAt.toISOString() : undefined,
        consultationStartedAt: apt.consultationStartedAt ? apt.consultationStartedAt.toISOString() : undefined,
        completedAt: apt.completedAt ? apt.completedAt.toISOString() : undefined,
        waitingMinutes,
        reason: apt.reason || 'General clinical consultation',
        encounterId: apt.encounterId?.toString(),
      };
    });

    // Sort queue: IN_PROGRESS first, then CHECKED_IN (longest wait first), then CONFIRMED/SCHEDULED by time, then COMPLETED
    return queueItems.sort((a, b) => {
      const getPriority = (status: AppointmentStatus) => {
        if (status === 'IN_PROGRESS') return 1;
        if (status === 'CHECKED_IN') return 2;
        if (status === 'CONFIRMED' || status === 'SCHEDULED') return 3;
        return 4; // COMPLETED
      };

      const pA = getPriority(a.status);
      const pB = getPriority(b.status);
      if (pA !== pB) return pA - pB;

      if (a.status === 'CHECKED_IN' && b.status === 'CHECKED_IN') {
        return (b.waitingMinutes || 0) - (a.waitingMinutes || 0);
      }

      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * Update doctor schedule availability and blocked slots
   */
  async updateDoctorSchedule(userId: string, data: UpdateDoctorScheduleDto): Promise<DoctorScheduleDto> {
    const profile = await DoctorProfileModel.findOne({ userId });

    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    if (data.workingDays) profile.workingDays = data.workingDays;
    if (data.workingHours) profile.workingHours = data.workingHours;
    if (data.slotDurationMinutes) profile.slotDurationMinutes = data.slotDurationMinutes;
    if (data.consultationModes) profile.consultationModes = data.consultationModes;
    if (data.blockedSlots) profile.blockedSlots = data.blockedSlots;

    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_SCHEDULE_UPDATED',
      resourceType: 'DOCTOR_SCHEDULE',
      resourceId: profile._id.toString(),
      metadata: { workingDays: data.workingDays, workingHours: data.workingHours },
    });

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const appointments = await AppointmentModel.find({
      doctorId: profile.userId,
      scheduledAt: { $gte: now, $lte: nextWeek },
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    }).lean();

    const existingBlocks = (profile.blockedSlots || []).concat(
      appointments.map((apt) => ({
        date: (apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0] : 'today') as string,
        startTime: apt.startTime || '09:00',
        endTime: apt.endTime || '09:30',
        reason: 'Booked Patient Appointment',
      }))
    );

    return {
      doctorId: userId,
      workingDays: profile.workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      workingHours: profile.workingHours || { start: '09:00', end: '17:00' },
      slotDurationMinutes: profile.slotDurationMinutes || 30,
      consultationModes: profile.consultationModes || ['IN_PERSON', 'TELECONSULTATION'],
      existingBlocks,
    };
  }
}

export const doctorAppointmentService = new DoctorAppointmentService();
