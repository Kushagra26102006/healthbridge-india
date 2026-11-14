import bcryptjs from 'bcryptjs';
import mongoose, { Types } from 'mongoose';
import {
  UserModel,
  DoctorProfileModel,
  AppointmentModel,
  EncounterModel,
  PrescriptionModel,
  PatientProfileModel,
  AuditLogModel,
  FacilityModel,
  RefreshTokenModel,
} from '../../../database/models';
import { AppError } from '../../../shared/errors/app-error';
import { doctorScheduleService } from './doctor-schedule.service';
import type {
  DoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorDashboardSummaryDto,
  DoctorAppointmentItemDto,
  DoctorPatientItemDto,
  DoctorClinicalActivityDto,
  DoctorScheduleDto,
  DoctorCredentialDocumentDto,
  UploadDoctorDocumentDto,
  DoctorNotificationPreferencesDto,
  UpdateDoctorNotificationPreferencesDto,
  DoctorPracticeSettingsDto,
  UpdateDoctorPracticeSettingsDto,
  UserSessionItemDto,
  ChangePasswordDto,
} from '@healthbridge/shared-types';

export const DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES: DoctorNotificationPreferencesDto = {
  newAppointmentRequests: { inApp: true, email: true, sms: false },
  appointmentChanges: { inApp: true, email: true, sms: false },
  patientCheckIns: { inApp: true, email: false, sms: false },
  consultationReminders: { inApp: true, email: true, sms: false },
  clinicalWorkflowAlerts: { inApp: true, email: false, sms: false },
  securityAlerts: { inApp: true, email: true, sms: true },
  channelAvailability: {
    emailConfigured: true,
    smsConfigured: false,
  },
};

export class DoctorDashboardService {
  /**
   * Safe audit logging helper
   */
  private async recordAudit(params: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
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
          requestId: params.requestId || `req-doc-${Date.now()}`,
          outcome: params.outcome || 'SUCCESS',
          metadata: params.metadata,
        });
      }
    } catch {
      // Non-blocking audit logger
    }
  }

  /**
   * Format masked registration number (e.g. MCI-DEL-XXXX-8492)
   */
  private maskRegistration(reg?: string): string {
    if (!reg) return 'REG-XXXX';
    if (reg.length <= 6) return reg;
    const parts = reg.split('-');
    if (parts.length >= 3) {
      parts[parts.length - 2] = 'XXXX';
      return parts.join('-');
    }
    return `${reg.slice(0, 4)}-XXXX-${reg.slice(-4)}`;
  }

  /**
   * Retrieve doctor's own professional profile
   */
  async getDoctorProfile(userId: string): Promise<DoctorProfileDto> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('Doctor account not found');
    }

    let profile = await DoctorProfileModel.findOne({ userId }).populate('facilityId');

    if (!profile) {
      // Fallback profile creation if not initialized
      profile = await DoctorProfileModel.create({
        userId: new Types.ObjectId(userId),
        registrationNumber: `MCI-DEL-2020-${user._id.toString().slice(-4).toUpperCase()}`,
        specialization: ['General Medicine'],
        qualifications: ['MBBS'],
        experience: 5,
        verificationStatus: 'VERIFIED',
        consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        languages: ['English', 'Hindi'],
        consultationFee: 500,
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        workingHours: { start: '09:00', end: '17:00' },
      });
    }

    const facilityData = profile.facilityId as any;

    const documentsDto: DoctorCredentialDocumentDto[] = (profile.documents || []).map((doc) => ({
      id: doc._id?.toString() || doc.id || '',
      documentType: doc.documentType,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      verificationStatus: doc.verificationStatus,
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : new Date().toISOString(),
      verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt).toISOString() : undefined,
      rejectionReason: doc.rejectionReason,
    }));

    const notificationPrefs: DoctorNotificationPreferencesDto = profile.notificationPreferences
      ? {
          newAppointmentRequests: profile.notificationPreferences.newAppointmentRequests || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.newAppointmentRequests,
          appointmentChanges: profile.notificationPreferences.appointmentChanges || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.appointmentChanges,
          patientCheckIns: profile.notificationPreferences.patientCheckIns || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.patientCheckIns,
          consultationReminders: profile.notificationPreferences.consultationReminders || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.consultationReminders,
          clinicalWorkflowAlerts: profile.notificationPreferences.clinicalWorkflowAlerts || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.clinicalWorkflowAlerts,
          securityAlerts: { inApp: true, email: true, sms: profile.notificationPreferences.securityAlerts?.sms ?? true },
          channelAvailability: DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.channelAvailability,
        }
      : DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES;

    const practiceSettingsDto: DoctorPracticeSettingsDto = {
      facilityId: profile.facilityId ? (facilityData?._id?.toString() || facilityData?.id || profile.facilityId.toString()) : undefined,
      facilityName: facilityData?.name || 'Main Hospital',
      facilityAddress: facilityData?.address,
      consultationModes: profile.consultationModes || ['IN_PERSON', 'TELECONSULTATION'],
      consultationFee: profile.consultationFee ?? 500,
      slotDurationMinutes: profile.slotDurationMinutes || 30,
      bufferMinutes: 5,
      autoConfirmAppointments: profile.practiceSettings?.autoConfirmAppointments ?? false,
      maxDailyPatients: profile.practiceSettings?.maxDailyPatients ?? 30,
      teleconsultationLink: profile.practiceSettings?.teleconsultationLink || '',
    };

    return {
      id: profile.id || profile._id.toString(),
      userId: user.id || user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.accountStatus,
      registrationNumber: this.maskRegistration(profile.registrationNumber),
      specialization: profile.specialization,
      qualifications: profile.qualifications,
      experience: profile.experience,
      verificationStatus: profile.verificationStatus,
      facility: facilityData
        ? {
            id: facilityData._id?.toString() || facilityData.id,
            name: facilityData.name || 'Main Hospital',
            type: facilityData.facilityType || 'HOSPITAL',
            address: facilityData.address,
          }
        : undefined,
      consultationModes: profile.consultationModes,
      bio: profile.bio || 'Clinical specialist dedicated to patient wellness and evidence-based medicine.',
      languages: profile.languages || ['English', 'Hindi'],
      consultationFee: profile.consultationFee ?? 500,
      profileImage: profile.profileImage,
      workingDays: profile.workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      workingHours: profile.workingHours || { start: '09:00', end: '17:00' },
      professionalInterests: profile.professionalInterests || [],
      documents: documentsDto,
      notificationPreferences: notificationPrefs,
      practiceSettings: practiceSettingsDto,
      createdAt: profile.createdAt ? profile.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Update permitted fields on doctor's professional profile
   */
  async updateDoctorProfile(
    userId: string,
    input: UpdateDoctorProfileDto,
    requestId?: string
  ): Promise<DoctorProfileDto> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile document not found');
    }

    // Security guard: Ensure doctor cannot modify role, verificationStatus or registrationNumber
    // Any sensitive modifications are ignored and strictly omitted from persistence.
    if (input.bio !== undefined) profile.bio = input.bio;
    if (input.languages !== undefined) profile.languages = input.languages;
    if (input.consultationFee !== undefined) profile.consultationFee = input.consultationFee;
    if (input.consultationModes !== undefined) profile.consultationModes = input.consultationModes;
    if (input.workingDays !== undefined) profile.workingDays = input.workingDays;
    if (input.workingHours !== undefined) profile.workingHours = input.workingHours;
    if (input.profileImage !== undefined) profile.profileImage = input.profileImage;
    if (input.professionalInterests !== undefined) profile.professionalInterests = input.professionalInterests;

    await profile.save();

    if (input.phone) {
      await UserModel.updateOne({ _id: userId }, { phone: input.phone });
    }

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PROFILE_UPDATED',
      resourceType: 'DOCTOR_PROFILE',
      resourceId: profile.id || profile._id.toString(),
      requestId,
      outcome: 'SUCCESS',
      metadata: { updatedFields: Object.keys(input) },
    });

    return this.getDoctorProfile(userId);
  }

  /**
   * Aggregate doctor clinical overview & KPIs
   */
  async getDashboardSummary(userId: string): Promise<DoctorDashboardSummaryDto> {
    const profile = await this.getDoctorProfile(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const userObjectId = new Types.ObjectId(userId);

    const [
      todayAppointmentsCount,
      upcomingAppointmentsCount,
      assignedPatientIds,
      pendingEncountersCount,
      pendingPrescriptionsCount,
      todayAppointmentsData,
      upcomingAppointmentsData,
    ] = await Promise.all([
      AppointmentModel.countDocuments({
        doctorId: userObjectId,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
      }),
      AppointmentModel.countDocuments({
        doctorId: userObjectId,
        scheduledAt: { $gt: todayEnd },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
      }),
      AppointmentModel.distinct('patientId', { doctorId: userObjectId }),
      EncounterModel.countDocuments({
        practitionerId: userObjectId,
        status: { $in: ['PLANNED', 'IN_PROGRESS'] },
      }),
      PrescriptionModel.countDocuments({
        doctorId: userObjectId,
        status: 'DRAFT',
      }),
      AppointmentModel.find({
        doctorId: userObjectId,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
      })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .populate('patientId', 'name phone')
        .populate('facilityId', 'name')
        .lean(),
      AppointmentModel.find({
        doctorId: userObjectId,
        scheduledAt: { $gt: todayEnd },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
      })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .populate('patientId', 'name phone')
        .populate('facilityId', 'name')
        .lean(),
    ]);

    const formatAppointment = (apt: any): DoctorAppointmentItemDto => {
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
      };
    };

    const todayAppointments = todayAppointmentsData.map(formatAppointment);
    const upcomingAppointments = upcomingAppointmentsData.map(formatAppointment);

    // Build real clinical activity stream
    const recentActivities: DoctorClinicalActivityDto[] = [];

    todayAppointments.slice(0, 3).forEach((apt) => {
      recentActivities.push({
        id: `act-apt-${apt.id}`,
        type: 'APPOINTMENT',
        title: `Consultation with ${apt.patientName}`,
        description: `Scheduled at ${apt.startTime} (${apt.consultationType})`,
        timestamp: apt.scheduledAt,
        status: apt.status,
        patientName: apt.patientName,
        actionUrl: '/doctor/appointments',
      });
    });

    upcomingAppointments.slice(0, 2).forEach((apt) => {
      recentActivities.push({
        id: `act-up-${apt.id}`,
        type: 'APPOINTMENT',
        title: `Upcoming appointment: ${apt.patientName}`,
        description: `${apt.reason}`,
        timestamp: apt.scheduledAt,
        status: apt.status,
        patientName: apt.patientName,
        actionUrl: '/doctor/appointments',
      });
    });

    return {
      profile,
      stats: {
        todayAppointments: todayAppointmentsCount,
        upcomingAppointments: upcomingAppointmentsCount,
        totalAssignedPatients: assignedPatientIds.length,
        pendingEncounters: pendingEncountersCount,
        pendingPrescriptions: pendingPrescriptionsCount,
      },
      todayAppointments,
      upcomingAppointments,
      recentActivities,
    };
  }

  /**
   * Get today's appointments for doctor with optional status filter
   */
  async getTodayAppointments(userId: string, filter?: string): Promise<DoctorAppointmentItemDto[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const query: Record<string, unknown> = {
      doctorId: new Types.ObjectId(userId),
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
    };

    if (filter === 'UPCOMING') {
      query.status = { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] };
    } else if (filter === 'COMPLETED') {
      query.status = 'COMPLETED';
    } else if (filter === 'CANCELLED') {
      query.status = 'CANCELLED';
    }

    const appointments = await AppointmentModel.find(query)
      .sort({ scheduledAt: 1 })
      .populate('patientId', 'name phone')
      .populate('facilityId', 'name')
      .lean();

    return appointments.map((apt: any) => {
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
      };
    });
  }

  /**
   * Get upcoming appointments for doctor
   */
  async getUpcomingAppointments(userId: string, limit = 20): Promise<DoctorAppointmentItemDto[]> {
    const now = new Date();

    const appointments = await AppointmentModel.find({
      doctorId: new Types.ObjectId(userId),
      scheduledAt: { $gte: now },
      status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
    })
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .populate('patientId', 'name phone')
      .populate('facilityId', 'name')
      .lean();

    return appointments.map((apt: any) => {
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
        reason: apt.reason || 'General consultation',
        facilityName: facility?.name || 'Main Healthcare Facility',
        status: apt.status || 'CONFIRMED',
      };
    });
  }

  /**
   * Get assigned patients for this doctor based on appointments and encounters
   * Respects patient privacy and authorized clinical relationships
   */
  async getAssignedPatients(userId: string, search?: string): Promise<DoctorPatientItemDto[]> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Get distinct patients with clinical relationship
    const patientIds = await AppointmentModel.distinct('patientId', { doctorId: userObjectId });

    if (patientIds.length === 0) {
      return [];
    }

    // 2. Fetch patient user and profile data
    const patientsData = await UserModel.find({
      _id: { $in: patientIds },
      ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
    }).lean();

    const results: DoctorPatientItemDto[] = [];

    for (const patientUser of patientsData) {
      const patientId = patientUser._id.toString();

      // Find profile & appointments concurrently
      const [patientProfile, lastApt, nextApt, totalApts] = await Promise.all([
        PatientProfileModel.findOne({ userId: patientUser._id }).lean(),
        AppointmentModel.findOne({
          doctorId: userObjectId,
          patientId: patientUser._id,
          status: 'COMPLETED',
        })
          .sort({ scheduledAt: -1 })
          .lean(),
        AppointmentModel.findOne({
          doctorId: userObjectId,
          patientId: patientUser._id,
          scheduledAt: { $gte: new Date() },
          status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
        })
          .sort({ scheduledAt: 1 })
          .lean(),
        AppointmentModel.countDocuments({
          doctorId: userObjectId,
          patientId: patientUser._id,
        }),
      ]);

      results.push({
        id: `assigned-${patientId}`,
        patientId,
        name: patientUser.name,
        phone: patientUser.phone,
        gender: patientProfile?.gender,
        dateOfBirth: patientProfile?.dateOfBirth ? new Date(patientProfile.dateOfBirth).toISOString().split('T')[0] : undefined,
        lastEncounterDate: lastApt?.scheduledAt ? new Date(lastApt.scheduledAt).toISOString() : undefined,
        nextAppointmentDate: nextApt?.scheduledAt ? new Date(nextApt.scheduledAt).toISOString() : undefined,
        totalAppointments: totalApts,
        accessStatus: 'ACTIVE_CONSENT',
      });
    }

    return results;
  }

  /**
   * Get doctor schedule & availability foundation
   */
  async getDoctorSchedule(userId: string): Promise<DoctorScheduleDto> {
    return doctorScheduleService.getSchedule(userId);
  }

  /**
   * Parse user agent string for readable device/browser info
   */
  private parseUserAgent(ua?: string): { deviceName: string; browser: string; os: string } {
    if (!ua) {
      return { deviceName: 'Web Browser', browser: 'Chrome', os: 'Desktop' };
    }
    let browser = 'Web Browser';
    let os = 'Unknown OS';

    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge';

    if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';

    return {
      deviceName: `${browser} on ${os}`,
      browser,
      os,
    };
  }

  /**
   * Retrieve doctor practice settings
   */
  async getPracticeSettings(userId: string): Promise<DoctorPracticeSettingsDto> {
    const profile = await DoctorProfileModel.findOne({ userId }).populate('facilityId');
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    const facilityData = profile.facilityId as any;

    return {
      facilityId: profile.facilityId ? (facilityData?._id?.toString() || facilityData?.id || profile.facilityId.toString()) : undefined,
      facilityName: facilityData?.name || 'Main Hospital',
      facilityAddress: facilityData?.address,
      consultationModes: profile.consultationModes || ['IN_PERSON', 'TELECONSULTATION'],
      consultationFee: profile.consultationFee ?? 500,
      slotDurationMinutes: profile.slotDurationMinutes || 30,
      bufferMinutes: 5,
      autoConfirmAppointments: profile.practiceSettings?.autoConfirmAppointments ?? false,
      maxDailyPatients: profile.practiceSettings?.maxDailyPatients ?? 30,
      teleconsultationLink: profile.practiceSettings?.teleconsultationLink || '',
    };
  }

  /**
   * Update practice and consultation preferences
   */
  async updatePracticeSettings(
    userId: string,
    input: UpdateDoctorPracticeSettingsDto,
    requestId?: string
  ): Promise<DoctorPracticeSettingsDto> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    if (input.facilityId) {
      const facility = await FacilityModel.findById(input.facilityId);
      if (!facility) {
        throw AppError.badRequest('Specified healthcare facility does not exist or is not authorized');
      }
      profile.facilityId = facility._id as any;
    }

    if (input.consultationModes) {
      profile.consultationModes = input.consultationModes;
    }
    if (input.consultationFee !== undefined) {
      profile.consultationFee = input.consultationFee;
    }
    if (input.slotDurationMinutes !== undefined) {
      profile.slotDurationMinutes = input.slotDurationMinutes;
    }

    if (!profile.practiceSettings) {
      profile.practiceSettings = {
        autoConfirmAppointments: false,
        maxDailyPatients: 30,
        teleconsultationLink: '',
      };
    }

    if (input.autoConfirmAppointments !== undefined) {
      profile.practiceSettings.autoConfirmAppointments = input.autoConfirmAppointments;
    }
    if (input.maxDailyPatients !== undefined) {
      profile.practiceSettings.maxDailyPatients = input.maxDailyPatients;
    }
    if (input.teleconsultationLink !== undefined) {
      profile.practiceSettings.teleconsultationLink = input.teleconsultationLink;
    }

    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PRACTICE_SETTINGS_UPDATED',
      resourceType: 'DOCTOR_PROFILE',
      resourceId: profile.id || profile._id.toString(),
      requestId,
      outcome: 'SUCCESS',
      metadata: { updatedFields: Object.keys(input) },
    });

    return this.getPracticeSettings(userId);
  }

  /**
   * Retrieve notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<DoctorNotificationPreferencesDto> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    const current = profile.notificationPreferences;
    return {
      newAppointmentRequests: current?.newAppointmentRequests || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.newAppointmentRequests,
      appointmentChanges: current?.appointmentChanges || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.appointmentChanges,
      patientCheckIns: current?.patientCheckIns || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.patientCheckIns,
      consultationReminders: current?.consultationReminders || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.consultationReminders,
      clinicalWorkflowAlerts: current?.clinicalWorkflowAlerts || DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.clinicalWorkflowAlerts,
      securityAlerts: { inApp: true, email: true, sms: current?.securityAlerts?.sms ?? true }, // Mandatory security alerts
      channelAvailability: DEFAULT_DOCTOR_NOTIFICATION_PREFERENCES.channelAvailability,
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    input: UpdateDoctorNotificationPreferencesDto,
    requestId?: string
  ): Promise<DoctorNotificationPreferencesDto> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    const current = await this.getNotificationPreferences(userId);

    // Enforce mandatory security policy: inApp and email cannot be disabled
    const mergedSecurity = {
      inApp: true,
      email: true,
      sms: input.securityAlerts?.sms !== undefined ? input.securityAlerts.sms : current.securityAlerts.sms,
    };

    profile.notificationPreferences = {
      newAppointmentRequests: { ...current.newAppointmentRequests, ...(input.newAppointmentRequests || {}) },
      appointmentChanges: { ...current.appointmentChanges, ...(input.appointmentChanges || {}) },
      patientCheckIns: { ...current.patientCheckIns, ...(input.patientCheckIns || {}) },
      consultationReminders: { ...current.consultationReminders, ...(input.consultationReminders || {}) },
      clinicalWorkflowAlerts: { ...current.clinicalWorkflowAlerts, ...(input.clinicalWorkflowAlerts || {}) },
      securityAlerts: mergedSecurity,
    };

    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_NOTIFICATION_PREFERENCES_UPDATED',
      resourceType: 'DOCTOR_PROFILE',
      resourceId: profile.id || profile._id.toString(),
      requestId,
      outcome: 'SUCCESS',
    });

    return this.getNotificationPreferences(userId);
  }

  /**
   * Retrieve uploaded credential documents
   */
  async getDocuments(userId: string): Promise<DoctorCredentialDocumentDto[]> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    return (profile.documents || []).map((doc) => ({
      id: doc._id?.toString() || doc.id || '',
      documentType: doc.documentType,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      verificationStatus: doc.verificationStatus,
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : new Date().toISOString(),
      verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt).toISOString() : undefined,
      rejectionReason: doc.rejectionReason,
    }));
  }

  /**
   * Upload professional credential document
   */
  async uploadDocument(
    userId: string,
    input: UploadDoctorDocumentDto,
    requestId?: string
  ): Promise<DoctorCredentialDocumentDto> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    if (input.fileSize > 10 * 1024 * 1024) {
      throw AppError.badRequest('Document size exceeds 10MB limit');
    }

    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMime.includes(input.mimeType)) {
      throw AppError.badRequest('Unsupported file type. Only PDF, JPEG, and PNG files are allowed.');
    }

    const docId = new Types.ObjectId();
    const secureStoragePath = `/secure-credentials/doctors/${userId}/${docId.toString()}-${input.fileName}`;

    const newDoc = {
      _id: docId,
      documentType: input.documentType,
      title: input.title,
      fileName: input.fileName,
      fileUrl: secureStoragePath,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      verificationStatus: 'PENDING' as const,
      uploadedAt: new Date(),
    };

    if (!profile.documents) {
      profile.documents = [];
    }
    profile.documents.push(newDoc as any);
    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_CREDENTIAL_UPLOADED',
      resourceType: 'DOCTOR_CREDENTIAL',
      resourceId: docId.toString(),
      requestId,
      outcome: 'SUCCESS',
      metadata: { documentType: input.documentType, fileName: input.fileName },
    });

    return {
      id: docId.toString(),
      documentType: input.documentType,
      title: input.title,
      fileName: input.fileName,
      fileUrl: secureStoragePath,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      verificationStatus: 'PENDING',
      uploadedAt: newDoc.uploadedAt.toISOString(),
    };
  }

  /**
   * Delete pending credential document
   */
  async deleteDocument(
    userId: string,
    docId: string,
    requestId?: string
  ): Promise<{ message: string }> {
    const profile = await DoctorProfileModel.findOne({ userId });
    if (!profile) {
      throw AppError.notFound('Doctor profile not found');
    }

    const doc = (profile.documents || []).find((d) => (d._id?.toString() || d.id) === docId);
    if (!doc) {
      throw AppError.notFound('Credential document not found');
    }

    if (doc.verificationStatus === 'VERIFIED') {
      throw AppError.badRequest('Cannot delete a verified credential document without administrative authorization');
    }

    profile.documents = (profile.documents || []).filter((d) => (d._id?.toString() || d.id) !== docId);
    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_CREDENTIAL_DELETED',
      resourceType: 'DOCTOR_CREDENTIAL',
      resourceId: docId,
      requestId,
      outcome: 'SUCCESS',
    });

    return { message: 'Credential document deleted successfully' };
  }

  /**
   * List active sessions for doctor
   */
  async getSessions(userId: string, currentTokenHash?: string): Promise<UserSessionItemDto[]> {
    const sessions = await RefreshTokenModel.find({
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return sessions.map((session, index) => {
      const uaInfo = this.parseUserAgent(session.deviceInfo?.userAgent);
      const isCurrent = currentTokenHash
        ? session.tokenHash === currentTokenHash
        : index === 0;

      return {
        id: session._id.toString(),
        deviceName: session.deviceInfo?.deviceName || uaInfo.deviceName,
        ipAddress: session.deviceInfo?.ipAddress || '127.0.0.1',
        userAgent: session.deviceInfo?.userAgent,
        browser: uaInfo.browser,
        os: uaInfo.os,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString(),
        lastActive: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
        isCurrent,
        expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  /**
   * Revoke individual session
   */
  async revokeSession(userId: string, sessionId: string, requestId?: string): Promise<{ message: string }> {
    const session = await RefreshTokenModel.findOne({
      _id: sessionId,
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
    });

    if (!session) {
      throw AppError.notFound('Session not found or already terminated');
    }

    session.revokedAt = new Date();
    await session.save();

    await this.recordAudit({
      actorId: userId,
      action: 'SESSION_REVOKED',
      resourceType: 'SESSION',
      resourceId: sessionId,
      requestId,
      outcome: 'SUCCESS',
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeOtherSessions(userId: string, currentTokenHash?: string, requestId?: string): Promise<{ revokedCount: number }> {
    const query: any = {
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
    };

    if (currentTokenHash) {
      query.tokenHash = { $ne: currentTokenHash };
    }

    const result = await RefreshTokenModel.updateMany(query, {
      revokedAt: new Date(),
    });

    await this.recordAudit({
      actorId: userId,
      action: 'OTHER_SESSIONS_REVOKED',
      resourceType: 'SESSION',
      requestId,
      outcome: 'SUCCESS',
      metadata: { revokedCount: result.modifiedCount },
    });

    return { revokedCount: result.modifiedCount };
  }

  /**
   * Change password for doctor
   */
  async changePassword(
    userId: string,
    input: ChangePasswordDto,
    requestId?: string
  ): Promise<{ message: string }> {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) {
      throw AppError.notFound('Doctor account not found');
    }

    const isCurrentValid = await bcryptjs.compare(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      await this.recordAudit({
        actorId: userId,
        action: 'PASSWORD_CHANGE_FAILED',
        resourceType: 'USER',
        resourceId: userId,
        requestId,
        outcome: 'FAILURE',
        metadata: { reason: 'INVALID_CURRENT_PASSWORD' },
      });
      throw AppError.badRequest('Current password is incorrect');
    }

    const isSamePassword = await bcryptjs.compare(input.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw AppError.badRequest('New password cannot be identical to your current password');
    }

    const newHash = await bcryptjs.hash(input.newPassword, 10);
    user.passwordHash = newHash;
    await user.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PASSWORD_CHANGED',
      resourceType: 'USER',
      resourceId: userId,
      requestId,
      outcome: 'SUCCESS',
    });

    return { message: 'Password changed successfully' };
  }
}

export const doctorDashboardService = new DoctorDashboardService();
export default doctorDashboardService;
