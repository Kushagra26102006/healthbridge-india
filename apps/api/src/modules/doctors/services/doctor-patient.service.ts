import mongoose, { Types } from 'mongoose';
import {
  UserModel,
  PatientProfileModel,
  DoctorProfileModel,
  AppointmentModel,
  EncounterModel,
  PrescriptionModel,
  LaboratoryReportModel,
  MedicalRecordModel,
  ConsentRequestModel,
  ConsentArtifactModel,
  AuditLogModel,
} from '../../../database/models';
import { HttpStatus } from '../../../shared/constants/http-status';
import { ErrorCode } from '../../../shared/errors/error-codes';
import { AppError } from '../../../shared/errors/app-error';
import type {
  DoctorPatientItemDto,
  DoctorPatientFilterQueryDto,
  DoctorPatientProfileOverviewDto,
  DoctorPatientTimelineItemDto,
  PatientTimelineQueryDto,
  PatientRecordItemDto,
  PatientRecordFilterQueryDto,
  PatientEncounterHistoryItemDto,
  PatientPrescriptionHistoryItemDto,
  PatientLabReportHistoryItemDto,
  CreateDoctorConsentRequestDto,
  PatientAccessStatus,
  PaginationMeta,
} from '@healthbridge/shared-types';

export class DoctorPatientService {
  /**
   * Resolve Doctor ObjectIds (Auth User ID + Doctor Profile ID)
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
          requestId: params.requestId || 'req-trace',
          outcome: params.outcome || 'SUCCESS',
          metadata: params.metadata || {},
          timestamp: new Date(),
        });
      }
    } catch {
      // Non-blocking for audit logging
    }
  }

  /**
   * Evaluate patient clinical access status (Fails Closed)
   */
  async validatePatientAccess(
    doctorIds: Types.ObjectId[],
    patientId: string
  ): Promise<{
    status: PatientAccessStatus;
    details?: {
      consentId?: string;
      grantedAt?: string;
      expiresAt?: string;
      permittedDataTypes?: string[];
      purpose?: string;
      isEncounterBound?: boolean;
      reason?: string;
    };
  }> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw AppError.badRequest('Invalid patient ID format');
    }

    const patientObjectId = new Types.ObjectId(patientId);

    // 1. Verify patient user exists
    const patientUser = await UserModel.findOne({
      _id: patientObjectId,
      role: 'PATIENT',
    }).lean();

    if (!patientUser) {
      throw AppError.notFound('Patient record not found');
    }

    const now = new Date();

    // 2. Check for active Electronic Consent Artifact
    const activeArtifact = await ConsentArtifactModel.findOne({
      patientId: patientObjectId,
      requesterId: { $in: doctorIds },
      consentStatus: 'ACTIVE',
      'validityPeriod.to': { $gt: now },
    }).lean();

    if (activeArtifact) {
      return {
        status: 'GRANTED',
        details: {
          consentId: activeArtifact._id.toString(),
          grantedAt: activeArtifact.approvedAt ? new Date(activeArtifact.approvedAt).toISOString() : undefined,
          expiresAt: activeArtifact.validityPeriod?.to ? new Date(activeArtifact.validityPeriod.to).toISOString() : undefined,
          permittedDataTypes: activeArtifact.permittedDataTypes,
          purpose: activeArtifact.purpose,
          isEncounterBound: false,
        },
      };
    }

    // 3. Check for approved Consent Request
    const approvedRequest = await ConsentRequestModel.findOne({
      patientId: patientObjectId,
      requesterId: { $in: doctorIds },
      status: { $in: ['APPROVED', 'GRANTED'] },
      expiresAt: { $gt: now },
    }).lean();

    if (approvedRequest) {
      return {
        status: 'GRANTED',
        details: {
          consentId: approvedRequest._id.toString(),
          grantedAt: approvedRequest.approvedAt ? new Date(approvedRequest.approvedAt).toISOString() : undefined,
          expiresAt: approvedRequest.expiresAt ? new Date(approvedRequest.expiresAt).toISOString() : undefined,
          permittedDataTypes: approvedRequest.requestedDataTypes,
          purpose: approvedRequest.purpose,
          isEncounterBound: false,
        },
      };
    }

    // 4. Check for existing consultation encounter
    const hasEncounter = await EncounterModel.exists({
      practitionerId: { $in: doctorIds },
      patientId: patientObjectId,
    });

    if (hasEncounter) {
      return {
        status: 'ENCOUNTER_BOUND',
        details: {
          isEncounterBound: true,
          reason: 'Care relationship established through previous clinical encounter',
        },
      };
    }

    // 5. Check for active or past appointment
    const hasAppointment = await AppointmentModel.exists({
      doctorId: { $in: doctorIds },
      patientId: patientObjectId,
    });

    if (hasAppointment) {
      return {
        status: 'ENCOUNTER_BOUND',
        details: {
          isEncounterBound: true,
          reason: 'Care relationship established through appointment booking',
        },
      };
    }

    // 6. Check if consent was explicitly revoked
    const revokedConsent = await ConsentArtifactModel.findOne({
      patientId: patientObjectId,
      requesterId: { $in: doctorIds },
      consentStatus: 'REVOKED',
    }).lean();

    if (revokedConsent) {
      return {
        status: 'ACCESS_REVOKED',
        details: {
          consentId: revokedConsent._id.toString(),
          reason: revokedConsent.revocationReason || 'Patient explicitly revoked electronic consent artifact',
        },
      };
    }

    // 7. Check if consent expired
    const expiredConsent = await ConsentArtifactModel.findOne({
      patientId: patientObjectId,
      requesterId: { $in: doctorIds },
      'validityPeriod.to': { $lte: now },
    }).sort({ 'validityPeriod.to': -1 }).lean();

    if (expiredConsent) {
      return {
        status: 'ACCESS_EXPIRED',
        details: {
          consentId: expiredConsent._id.toString(),
          expiresAt: expiredConsent.validityPeriod?.to ? new Date(expiredConsent.validityPeriod.to).toISOString() : undefined,
          reason: 'Patient electronic consent artifact has reached expiry date',
        },
      };
    }

    // 8. Fail closed: consent required
    return {
      status: 'CONSENT_REQUIRED',
      details: {
        reason: 'No active consent or prior clinical care relationship found',
      },
    };
  }

  /**
   * Helper to strictly assert clinical access rights
   */
  async assertPatientAccess(doctorIds: Types.ObjectId[], patientId: string): Promise<void> {
    const access = await this.validatePatientAccess(doctorIds, patientId);
    if (access.status !== 'GRANTED' && access.status !== 'ENCOUNTER_BOUND' && access.status !== 'ACTIVE_CONSENT') {
      throw new AppError(
        `Access denied: Patient data cannot be accessed. Status: ${access.status}. You lack verified clinical authorization or active patient consent.`,
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }
  }

  /**
   * GET /api/v1/doctors/patients
   * Retrieve authorized patient directory with server-side search, filtering and pagination
   */
  async getPatientDirectory(
    userId: string,
    query: DoctorPatientFilterQueryDto = {}
  ): Promise<{ items: DoctorPatientItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const now = new Date();

    // 1. Gather all authorized patient IDs across appointments, encounters, and consents
    const [appointmentPatientIds, encounterPatientIds, consentArtifactPatientIds, consentRequestPatientIds] =
      await Promise.all([
        AppointmentModel.distinct('patientId', { doctorId: { $in: doctorIds } }),
        EncounterModel.distinct('patientId', { practitionerId: { $in: doctorIds } }),
        ConsentArtifactModel.distinct('patientId', {
          requesterId: { $in: doctorIds },
          consentStatus: 'ACTIVE',
          'validityPeriod.to': { $gt: now },
        }),
        ConsentRequestModel.distinct('patientId', {
          requesterId: { $in: doctorIds },
          status: { $in: ['APPROVED', 'GRANTED'] },
          expiresAt: { $gt: now },
        }),
      ]);

    const allPatientIdStrings = new Set<string>([
      ...appointmentPatientIds.map((id) => id.toString()),
      ...encounterPatientIds.map((id) => id.toString()),
      ...consentArtifactPatientIds.map((id) => id.toString()),
      ...consentRequestPatientIds.map((id) => id.toString()),
    ]);

    if (allPatientIdStrings.size === 0) {
      return {
        items: [],
        pagination: {
          page: 1,
          limit: query.limit || 10,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const candidateObjectIds = Array.from(allPatientIdStrings).map((id) => new Types.ObjectId(id));

    // 2. Filter patients via UserModel (Search by name, phone, email)
    const userFilter: Record<string, any> = {
      _id: { $in: candidateObjectIds },
      role: 'PATIENT',
    };

    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      userFilter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    let matchingUsers = await UserModel.find(userFilter).lean();

    // 3. Apply advanced status filters
    if (query.filter === 'recently-seen') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPatientIds = await AppointmentModel.distinct('patientId', {
        doctorId: { $in: doctorIds },
        scheduledAt: { $gte: thirtyDaysAgo },
        status: 'COMPLETED',
      });
      const recentIdSet = new Set(recentPatientIds.map((id) => id.toString()));
      matchingUsers = matchingUsers.filter((u) => recentIdSet.has(u._id.toString()));
    } else if (query.filter === 'upcoming-appointments') {
      const upcomingPatientIds = await AppointmentModel.distinct('patientId', {
        doctorId: { $in: doctorIds },
        scheduledAt: { $gte: now },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
      });
      const upcomingIdSet = new Set(upcomingPatientIds.map((id) => id.toString()));
      matchingUsers = matchingUsers.filter((u) => upcomingIdSet.has(u._id.toString()));
    } else if (query.filter === 'active-care') {
      const activeConsentIds = new Set([
        ...consentArtifactPatientIds.map((id) => id.toString()),
        ...consentRequestPatientIds.map((id) => id.toString()),
      ]);
      matchingUsers = matchingUsers.filter((u) => activeConsentIds.has(u._id.toString()));
    }

    // 4. Facility filter if specified
    if (query.facilityId && Types.ObjectId.isValid(query.facilityId)) {
      const facilityObjectId = new Types.ObjectId(query.facilityId);
      const facilityPatientIds = await AppointmentModel.distinct('patientId', {
        doctorId: { $in: doctorIds },
        facilityId: facilityObjectId,
      });
      const facilitySet = new Set(facilityPatientIds.map((id) => id.toString()));
      matchingUsers = matchingUsers.filter((u) => facilitySet.has(u._id.toString()));
    }

    const total = matchingUsers.length;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    // Apply pagination
    const paginatedUsers = matchingUsers.slice(skip, skip + limit);

    // 5. Enrich patient summaries
    const items: DoctorPatientItemDto[] = [];

    for (const patientUser of paginatedUsers) {
      const pId = patientUser._id.toString();
      const pObjectId = patientUser._id;

      const [patientProfile, lastApt, nextApt, totalApts, totalEncs, lastEncounter] =
        await Promise.all([
          PatientProfileModel.findOne({ userId: pObjectId }).lean(),
          AppointmentModel.findOne({
            doctorId: { $in: doctorIds },
            patientId: pObjectId,
            status: 'COMPLETED',
          })
            .sort({ scheduledAt: -1 })
            .populate('facilityId', 'name')
            .lean(),
          AppointmentModel.findOne({
            doctorId: { $in: doctorIds },
            patientId: pObjectId,
            scheduledAt: { $gte: now },
            status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
          })
            .sort({ scheduledAt: 1 })
            .lean(),
          AppointmentModel.countDocuments({
            doctorId: { $in: doctorIds },
            patientId: pObjectId,
          }),
          EncounterModel.countDocuments({
            practitionerId: { $in: doctorIds },
            patientId: pObjectId,
          }),
          EncounterModel.findOne({
            practitionerId: { $in: doctorIds },
            patientId: pObjectId,
          })
            .sort({ startTime: -1 })
            .populate('facilityId', 'name')
            .lean(),
        ]);

      let age: number | undefined;
      if (patientProfile?.dateOfBirth) {
        const diff = Date.now() - new Date(patientProfile.dateOfBirth).getTime();
        age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
      }

      // Determine most recent encounter date
      const lastEncounterDate = lastEncounter?.startTime
        ? new Date(lastEncounter.startTime).toISOString()
        : lastApt?.scheduledAt
          ? new Date(lastApt.scheduledAt).toISOString()
          : undefined;

      // Determine assigned facility
      const facilityName =
        (lastEncounter?.facilityId as any)?.name ||
        (lastApt?.facilityId as any)?.name ||
        undefined;
      const facilityId =
        (lastEncounter?.facilityId as any)?._id?.toString() ||
        (lastApt?.facilityId as any)?._id?.toString() ||
        undefined;

      const hasActiveConsent =
        consentArtifactPatientIds.some((id) => id.toString() === pId) ||
        consentRequestPatientIds.some((id) => id.toString() === pId);

      const accessStatus: PatientAccessStatus = hasActiveConsent
        ? 'GRANTED'
        : 'ENCOUNTER_BOUND';

      items.push({
        id: `patient-dir-${pId}`,
        patientId: pId,
        name: patientUser.name,
        patientReference: `PAT-${pId.slice(-6).toUpperCase()}`,
        phone: patientUser.phone,
        gender: patientProfile?.gender,
        dateOfBirth: patientProfile?.dateOfBirth
          ? new Date(patientProfile.dateOfBirth).toISOString().split('T')[0]
          : undefined,
        age,
        bloodGroup: patientProfile?.bloodGroup,
        lastEncounterDate,
        nextAppointmentDate: nextApt?.scheduledAt ? new Date(nextApt.scheduledAt).toISOString() : undefined,
        nextAppointmentDetails: nextApt
          ? {
              id: nextApt._id.toString(),
              scheduledAt: new Date(nextApt.scheduledAt).toISOString(),
              consultationType: nextApt.consultationType,
              status: nextApt.status,
            }
          : undefined,
        assignedFacility: facilityId && facilityName ? { id: facilityId, name: facilityName } : undefined,
        totalAppointments: totalApts,
        totalEncounters: totalEncs,
        accessStatus,
      });
    }

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/v1/doctors/patients/:patientId
   * Retrieve clinical patient profile & overview with explicit access evaluation
   */
  async getPatientProfileOverview(
    userId: string,
    patientId: string,
    requestId?: string
  ): Promise<DoctorPatientProfileOverviewDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    // 1. Verify access rights (fails closed)
    const access = await this.validatePatientAccess(doctorIds, patientId);

    // 2. Fetch Patient User & Profile
    const [patientUser, patientProfile] = await Promise.all([
      UserModel.findOne({ _id: patientObjectId, role: 'PATIENT' }).lean(),
      PatientProfileModel.findOne({ userId: patientObjectId }).lean(),
    ]);

    if (!patientUser) {
      throw AppError.notFound('Patient record not found');
    }

    let age: number | undefined;
    if (patientProfile?.dateOfBirth) {
      const diff = Date.now() - new Date(patientProfile.dateOfBirth).getTime();
      age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    }

    // If access is restricted or consent required, do not expose detailed clinical summary
    const isRestricted =
      access.status === 'CONSENT_REQUIRED' ||
      access.status === 'ACCESS_EXPIRED' ||
      access.status === 'ACCESS_REVOKED' ||
      access.status === 'ACCESS_RESTRICTED';

    if (isRestricted) {
      await this.recordAudit({
        actorId: userId,
        action: 'DOCTOR_PATIENT_PROFILE_ACCESS_BLOCKED',
        resourceType: 'PATIENT',
        resourceId: patientId,
        requestId,
        outcome: 'BLOCKED',
        metadata: { accessStatus: access.status },
      });

      return {
        patient: {
          id: patientUser._id.toString(),
          name: patientUser.name,
          patientReference: `PAT-${patientUser._id.toString().slice(-6).toUpperCase()}`,
          profileImage: patientProfile?.profileImage,
          gender: patientProfile?.gender,
          dateOfBirth: patientProfile?.dateOfBirth
            ? new Date(patientProfile.dateOfBirth).toISOString().split('T')[0]
            : undefined,
          age,
          bloodGroup: patientProfile?.bloodGroup,
          phone: patientUser.phone,
          email: patientUser.email,
          abhaAddress: patientProfile?.abhaAddress,
          abhaNumber: patientProfile?.abhaNumber,
        },
        accessStatus: access.status,
        accessDetails: access.details,
        clinicalSummary: {
          allergies: [],
          currentMedications: [],
          pastDiagnoses: [],
          recentEncounters: [],
          recentPrescriptions: [],
          recentLabReports: [],
          upcomingAppointments: [],
        },
      };
    }

    // 3. Concurrently retrieve clinical sections for authorized access
    const now = new Date();
    const [
      encounters,
      prescriptions,
      labReports,
      upcomingAppointments,
      latestEncounterWithVitals,
    ] = await Promise.all([
      EncounterModel.find({ patientId: patientObjectId })
        .sort({ startTime: -1 })
        .limit(5)
        .populate('practitionerId', 'name')
        .populate('facilityId', 'name')
        .lean(),
      PrescriptionModel.find({
        patientId: patientObjectId,
        status: { $in: ['ACTIVE', 'COMPLETED', 'DISPENSED'] },
      })
        .sort({ issuedAt: -1, createdAt: -1 })
        .limit(5)
        .populate('doctorId', 'name')
        .lean(),
      LaboratoryReportModel.find({ patientId: patientObjectId })
        .sort({ publishedAt: -1 })
        .limit(5)
        .populate('laboratoryId', 'name')
        .lean(),
      AppointmentModel.find({
        patientId: patientObjectId,
        scheduledAt: { $gte: now },
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
      })
        .sort({ scheduledAt: 1 })
        .limit(3)
        .populate('facilityId', 'name')
        .lean(),
      EncounterModel.findOne({
        patientId: patientObjectId,
        'vitals.recordedAt': { $exists: true },
      })
        .sort({ startTime: -1 })
        .lean(),
    ]);

    // Extract current active medications
    const currentMedications: Array<{
      id?: string;
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      prescribedBy?: string;
      issuedAt: string;
    }> = [];

    const activePrescriptions = prescriptions.filter((p: any) => p.status === 'ACTIVE');
    for (const p of activePrescriptions) {
      const docName = (p.doctorId as any)?.name ? `Dr. ${(p.doctorId as any).name}` : undefined;
      for (const med of p.medications || []) {
        currentMedications.push({
          id: (med as any)._id ? (med as any)._id.toString() : undefined,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          prescribedBy: docName,
          issuedAt: p.issuedAt ? new Date(p.issuedAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    // Extract documented diagnoses
    const pastDiagnoses: Array<{
      name: string;
      code?: string;
      type: string;
      diagnosedDate: string;
      encounterId?: string;
    }> = [];

    for (const enc of encounters) {
      for (const d of enc.diagnoses || []) {
        pastDiagnoses.push({
          name: d.name,
          code: d.code,
          type: d.type || 'PRESUMPTIVE',
          diagnosedDate: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
          encounterId: enc._id.toString(),
        });
      }
    }

    // Latest Vitals
    let vitalSigns: DoctorPatientProfileOverviewDto['clinicalSummary']['vitalSigns'] | undefined;
    if (latestEncounterWithVitals?.vitals) {
      const v = latestEncounterWithVitals.vitals;
      vitalSigns = {
        bloodPressure:
          v.bloodPressureSystolic && v.bloodPressureDiastolic
            ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg`
            : undefined,
        heartRate: v.heartRate,
        temperature: v.temperature,
        respiratoryRate: v.respiratoryRate,
        oxygenSaturation: v.oxygenSaturation,
        weight: v.weight,
        height: v.height,
        bmi: v.bmi,
        recordedAt: v.recordedAt ? new Date(v.recordedAt).toISOString() : undefined,
      };
    }

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PATIENT_PROFILE_ACCESSED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      requestId,
      metadata: { accessStatus: access.status },
    });

    return {
      patient: {
        id: patientUser._id.toString(),
        name: patientUser.name,
        patientReference: `PAT-${patientUser._id.toString().slice(-6).toUpperCase()}`,
        profileImage: patientProfile?.profileImage,
        gender: patientProfile?.gender,
        dateOfBirth: patientProfile?.dateOfBirth
          ? new Date(patientProfile.dateOfBirth).toISOString().split('T')[0]
          : undefined,
        age,
        bloodGroup: patientProfile?.bloodGroup,
        phone: patientUser.phone,
        email: patientUser.email,
        abhaAddress: patientProfile?.abhaAddress,
        abhaNumber: patientProfile?.abhaNumber,
        emergencyContact: patientProfile?.emergencyContact
          ? {
              name: patientProfile.emergencyContact.name,
              phone: patientProfile.emergencyContact.phone,
              relationship: patientProfile.emergencyContact.relationship,
            }
          : undefined,
        address: patientProfile?.address
          ? {
              line1: patientProfile.address.line1,
              city: patientProfile.address.city,
              district: patientProfile.address.district,
              state: patientProfile.address.state,
              postalCode: patientProfile.address.postalCode,
            }
          : undefined,
      },
      accessStatus: access.status,
      accessDetails: access.details,
      clinicalSummary: {
        medicalHistory: encounters[0]?.medicalHistory || encounters[0]?.chiefComplaint,
        allergies: [], // Clean state if not documented
        currentMedications,
        pastDiagnoses,
        recentEncounters: encounters.map((enc: any) => ({
          id: enc._id.toString(),
          encounterReference: `ENC-${enc._id.toString().slice(-6).toUpperCase()}`,
          date: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
          doctorName: enc.practitionerId?.name ? `Dr. ${enc.practitionerId.name}` : 'Treating Physician',
          facilityName: enc.facilityId?.name,
          chiefComplaint: enc.chiefComplaint,
          primaryDiagnosis:
            (enc.diagnoses || []).find((d: any) => d.type === 'PRIMARY')?.name ||
            enc.diagnoses?.[0]?.name,
          status: enc.status,
        })),
        recentPrescriptions: prescriptions.map((p: any) => ({
          id: p._id.toString(),
          prescriptionNumber: p.prescriptionNumber || `RX-${p._id.toString().slice(-6).toUpperCase()}`,
          date: p.issuedAt ? new Date(p.issuedAt).toISOString() : new Date(p.createdAt).toISOString(),
          doctorName: p.doctorId?.name ? `Dr. ${p.doctorId.name}` : 'Attending Doctor',
          medicationsCount: (p.medications || []).length,
          medicationNames: (p.medications || []).map((m: any) => m.name),
          status: p.status,
        })),
        recentLabReports: labReports.map((lr: any) => ({
          id: lr._id.toString(),
          reportNumber: lr.reportNumber,
          testName: lr.testName,
          date: lr.publishedAt ? new Date(lr.publishedAt).toISOString() : new Date(lr.testDate).toISOString(),
          status: lr.status,
          laboratoryName: lr.laboratoryId?.name || 'Pathology Laboratory',
          observationsCount: (lr.observations || []).length,
        })),
        upcomingAppointments: upcomingAppointments.map((apt: any) => ({
          id: apt._id.toString(),
          scheduledAt: new Date(apt.scheduledAt).toISOString(),
          consultationType: apt.consultationType,
          status: apt.status,
          facilityName: apt.facilityId?.name,
        })),
        vitalSigns,
      },
    };
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/history
   * Chronological Unified Medical Timeline Aggregator
   */
  async getPatientTimelineHistory(
    userId: string,
    patientId: string,
    query: PatientTimelineQueryDto = {},
    requestId?: string
  ): Promise<{ items: DoctorPatientTimelineItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    // Fail closed
    await this.assertPatientAccess(doctorIds, patientId);

    // Fetch clinical event categories concurrently
    const [encounters, prescriptions, labReports, medicalRecords, appointments] =
      await Promise.all([
        EncounterModel.find({ patientId: patientObjectId })
          .populate('practitionerId', 'name')
          .populate('facilityId', 'name')
          .lean(),
        PrescriptionModel.find({ patientId: patientObjectId })
          .populate('doctorId', 'name')
          .populate('facilityId', 'name')
          .lean(),
        LaboratoryReportModel.find({ patientId: patientObjectId })
          .populate('laboratoryId', 'name')
          .populate('doctorId', 'name')
          .lean(),
        MedicalRecordModel.find({ patientId: patientObjectId }).lean(),
        AppointmentModel.find({
          patientId: patientObjectId,
          doctorId: { $in: doctorIds },
        })
          .populate('facilityId', 'name')
          .lean(),
      ]);

    const timelineItems: DoctorPatientTimelineItemDto[] = [];

    // Map Encounters
    for (const enc of encounters) {
      const practitionerName = (enc.practitionerId as any)?.name
        ? `Dr. ${(enc.practitionerId as any).name}`
        : 'Attending Physician';
      const facilityName = (enc.facilityId as any)?.name || 'Consultation Suite';
      const timestamp = enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString();

      const encounterRef = `ENC-${enc._id.toString().slice(-6).toUpperCase()}`;
      const primaryDiag =
        (enc.diagnoses || []).find((d: any) => d.type === 'PRIMARY')?.name ||
        enc.diagnoses?.[0]?.name;

      timelineItems.push({
        id: `timeline-enc-${enc._id}`,
        category: 'ENCOUNTER',
        title: `${enc.encounterType === 'VIRTUAL' ? 'Virtual Consultation' : 'Clinical Consultation'}${
          enc.chiefComplaint ? ` — ${enc.chiefComplaint}` : ''
        }`,
        timestamp,
        source: facilityName,
        responsibleProvider: practitionerName,
        summary: primaryDiag || enc.assessment || 'Clinical consultation documented',
        badgeText: enc.status,
        badgeVariant: enc.status === 'COMPLETED' ? 'success' : 'default',
        actionUrl: `/doctor/encounters/${enc._id}`,
        metadata: {
          encounterReference: encounterRef,
          diagnosesCount: (enc.diagnoses || []).length,
          hasVitals: Boolean(enc.vitals?.recordedAt),
        },
      });
    }

    // Map Prescriptions
    for (const p of prescriptions) {
      const docName = (p.doctorId as any)?.name ? `Dr. ${(p.doctorId as any).name}` : 'Prescribing Doctor';
      const facilityName = (p.facilityId as any)?.name || 'HealthBridge Medical Center';
      const timestamp = p.issuedAt
        ? new Date(p.issuedAt).toISOString()
        : new Date(p.createdAt).toISOString();
      const medList = (p.medications || []).map((m: any) => m.name).join(', ');

      timelineItems.push({
        id: `timeline-rx-${p._id}`,
        category: 'PRESCRIPTION',
        title: `Prescription (${(p.medications || []).length} medication${(p.medications || []).length === 1 ? '' : 's'})`,
        timestamp,
        source: facilityName,
        responsibleProvider: docName,
        summary: medList || p.diagnosis || 'Medication order',
        badgeText: p.status,
        badgeVariant:
          p.status === 'ACTIVE' ? 'success' : p.status === 'DISCONTINUED' ? 'destructive' : 'secondary',
        actionUrl: `/doctor/prescriptions/${p._id}`,
        metadata: {
          prescriptionNumber: p.prescriptionNumber,
          isDraft: p.isDraft,
          medicationsCount: (p.medications || []).length,
        },
      });
    }

    // Map Lab Reports
    for (const lr of labReports) {
      const labName = (lr.laboratoryId as any)?.name || 'Clinical Pathology Laboratory';
      const docName = (lr.doctorId as any)?.name ? `Dr. ${(lr.doctorId as any).name}` : 'Ordering Physician';
      const timestamp = lr.publishedAt
        ? new Date(lr.publishedAt).toISOString()
        : new Date(lr.testDate).toISOString();

      timelineItems.push({
        id: `timeline-lab-${lr._id}`,
        category: 'LAB_REPORT',
        title: lr.testName || 'Diagnostic Investigation',
        timestamp,
        source: labName,
        responsibleProvider: docName,
        summary: lr.observations?.length
          ? `${lr.observations.length} diagnostic observation${lr.observations.length === 1 ? '' : 's'} reported`
          : lr.clinicalNotes || 'Diagnostic laboratory report',
        badgeText: lr.status,
        badgeVariant: lr.status === 'COMPLETED' ? 'success' : 'warning',
        actionUrl: `/doctor/patients/${patientId}/lab-reports`,
        metadata: {
          reportNumber: lr.reportNumber,
          category: lr.category,
        },
      });
    }

    // Map Medical Records
    for (const mr of medicalRecords) {
      const timestamp = mr.recordDate
        ? new Date(mr.recordDate).toISOString()
        : new Date(mr.createdAt).toISOString();

      timelineItems.push({
        id: `timeline-mr-${mr._id}`,
        category: 'RECORD',
        title: mr.title,
        timestamp,
        source: mr.facilityName || mr.source || 'Digital Health Locker',
        responsibleProvider: mr.doctorName || 'Self-Uploaded Document',
        summary: mr.description || mr.recordType,
        badgeText: mr.recordType,
        badgeVariant: 'outline',
        actionUrl: `/doctor/patients/${patientId}/records`,
        metadata: {
          recordType: mr.recordType,
          verificationStatus: mr.verificationStatus,
        },
      });
    }

    // Map Appointments
    for (const apt of appointments) {
      const facilityName = (apt.facilityId as any)?.name || 'Consultation Clinic';
      const timestamp = apt.scheduledAt ? new Date(apt.scheduledAt).toISOString() : new Date().toISOString();

      timelineItems.push({
        id: `timeline-apt-${apt._id}`,
        category: 'APPOINTMENT',
        title: `Appointment (${apt.consultationType})`,
        timestamp,
        source: facilityName,
        responsibleProvider: 'Doctor Consultation',
        summary: apt.reason || 'Scheduled patient consultation',
        badgeText: apt.status,
        badgeVariant:
          apt.status === 'CONFIRMED'
            ? 'success'
            : apt.status === 'CANCELLED'
              ? 'destructive'
              : 'outline',
        actionUrl: `/doctor/appointments/${apt._id}`,
        metadata: {
          status: apt.status,
          queueNumber: apt.queueNumber,
        },
      });
    }

    // Apply category filter
    let filtered = timelineItems;
    if (query.category && query.category !== 'ALL') {
      filtered = filtered.filter((item) => item.category === query.category);
    }

    // Apply date range filters
    if (query.startDate) {
      const start = new Date(query.startDate).getTime();
      filtered = filtered.filter((item) => new Date(item.timestamp).getTime() >= start);
    }
    if (query.endDate) {
      const end = new Date(query.endDate).getTime();
      filtered = filtered.filter((item) => new Date(item.timestamp).getTime() <= end);
    }

    // Sort (newest first by default)
    const isAsc = query.sortOrder === 'asc';
    filtered.sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return isAsc ? -diff : diff;
    });

    const total = filtered.length;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const items = filtered.slice(skip, skip + limit);

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PATIENT_TIMELINE_ACCESSED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      requestId,
      metadata: { totalEvents: total, filteredCategory: query.category },
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/records
   * Retrieve authorized medical records with secure document access
   */
  async getPatientMedicalRecords(
    userId: string,
    patientId: string,
    query: PatientRecordFilterQueryDto = {},
    requestId?: string
  ): Promise<{ items: PatientRecordItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    await this.assertPatientAccess(doctorIds, patientId);

    const filter: Record<string, any> = { patientId: patientObjectId };

    if (query.recordType && query.recordType !== 'ALL') {
      filter.recordType = query.recordType;
    }

    if (query.startDate || query.endDate) {
      filter.recordDate = {};
      if (query.startDate) filter.recordDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.recordDate.$lte = new Date(query.endDate);
    }

    if (query.search && query.search.trim().length > 0) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { doctorName: regex }, { facilityName: regex }];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      MedicalRecordModel.find(filter).sort({ recordDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      MedicalRecordModel.countDocuments(filter),
    ]);

    const items: PatientRecordItemDto[] = records.map((r: any) => ({
      id: r._id.toString(),
      title: r.title,
      recordType: r.recordType,
      recordDate: r.recordDate ? new Date(r.recordDate).toISOString() : new Date(r.createdAt).toISOString(),
      source: r.source,
      doctorName: r.doctorName,
      facilityName: r.facilityName,
      verificationStatus: r.verificationStatus || 'VERIFIED',
      fileUrl: r.fileUrl,
      fileName: r.fileName,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      description: r.description,
    }));

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PATIENT_RECORDS_ACCESSED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      requestId,
      metadata: { count: items.length },
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/encounters
   * Retrieve previous consultations with access boundary protections
   */
  async getPatientEncounters(
    userId: string,
    patientId: string,
    page = 1,
    limit = 10,
    requestId?: string
  ): Promise<{ items: PatientEncounterHistoryItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    await this.assertPatientAccess(doctorIds, patientId);

    const validatedPage = Math.max(1, Number(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (validatedPage - 1) * validatedLimit;

    const [encounters, total] = await Promise.all([
      EncounterModel.find({ patientId: patientObjectId })
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate('practitionerId', 'name')
        .populate('facilityId', 'name')
        .lean(),
      EncounterModel.countDocuments({ patientId: patientObjectId }),
    ]);

    const items: PatientEncounterHistoryItemDto[] = encounters.map((enc: any) => {
      const practitionerId = enc.practitionerId?._id?.toString() || enc.practitionerId?.toString();
      const isOwner = doctorIds.some((id) => id.toString() === practitionerId);

      return {
        id: enc._id.toString(),
        encounterReference: `ENC-${enc._id.toString().slice(-6).toUpperCase()}`,
        encounterType: enc.encounterType,
        startTime: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
        endTime: enc.endTime ? new Date(enc.endTime).toISOString() : undefined,
        treatingDoctor: {
          id: practitionerId || '',
          name: enc.practitionerId?.name ? `Dr. ${enc.practitionerId.name}` : 'Treating Physician',
          specialization: enc.practitionerId?.specialization,
        },
        facility: enc.facilityId
          ? {
              id: enc.facilityId._id ? enc.facilityId._id.toString() : enc.facilityId.toString(),
              name: enc.facilityId.name || 'Healthcare Facility',
            }
          : undefined,
        chiefComplaint: enc.chiefComplaint,
        primaryDiagnosis: enc.primaryDiagnosis,
        diagnoses: (enc.diagnoses || []).map((d: any) => ({
          name: d.name,
          code: d.code,
          type: d.type || 'PRESUMPTIVE',
        })),
        status: enc.status,
        isDraft: Boolean(enc.isDraft),
        isOwner,
        actionUrl: `/doctor/encounters/${enc._id}`,
      };
    });

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PATIENT_ENCOUNTERS_ACCESSED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      requestId,
      metadata: { count: items.length },
    });

    return {
      items,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/prescriptions
   * Retrieve prescription history with strict attribution and ownership verification
   */
  async getPatientPrescriptions(
    userId: string,
    patientId: string,
    page = 1,
    limit = 10,
    requestId?: string
  ): Promise<{ items: PatientPrescriptionHistoryItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    await this.assertPatientAccess(doctorIds, patientId);

    const validatedPage = Math.max(1, Number(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (validatedPage - 1) * validatedLimit;

    const [prescriptions, total] = await Promise.all([
      PrescriptionModel.find({ patientId: patientObjectId })
        .sort({ issuedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate('doctorId', 'name registrationNumber')
        .lean(),
      PrescriptionModel.countDocuments({ patientId: patientObjectId }),
    ]);

    const items: PatientPrescriptionHistoryItemDto[] = prescriptions.map((p: any) => {
      const docId = p.doctorId?._id?.toString() || p.doctorId?.toString();
      const isOwner = doctorIds.some((id) => id.toString() === docId);

      return {
        id: p._id.toString(),
        prescriptionNumber: p.prescriptionNumber || `RX-${p._id.toString().slice(-6).toUpperCase()}`,
        issuedAt: p.issuedAt
          ? new Date(p.issuedAt).toISOString()
          : new Date(p.createdAt).toISOString(),
        doctor: {
          id: docId || '',
          name: p.doctorId?.name ? `Dr. ${p.doctorId.name}` : 'Prescribing Doctor',
          registrationNumber: p.doctorId?.registrationNumber,
        },
        diagnosis: p.diagnosis,
        medications: (p.medications || []).map((m: any) => ({
          name: m.name,
          genericName: m.genericName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          route: m.route,
          instructions: m.instructions,
        })),
        medicationsCount: (p.medications || []).length,
        status: p.status,
        isDraft: Boolean(p.isDraft),
        isOwner,
        documentUrl: p.documentUrl,
        discontinuedAt: p.discontinuedAt ? new Date(p.discontinuedAt).toISOString() : undefined,
        discontinuationReason: p.discontinuationReason,
      };
    });

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PATIENT_PRESCRIPTIONS_ACCESSED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      requestId,
      metadata: { count: items.length },
    });

    return {
      items,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/lab-reports
   * Retrieve diagnostic laboratory reports (Displays reference ranges supplied by laboratory, zero synthetic AI diagnosis)
   */
  async getPatientLabReports(
    userId: string,
    patientId: string,
    page = 1,
    limit = 10,
    requestId?: string
  ): Promise<{ items: PatientLabReportHistoryItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    await this.assertPatientAccess(doctorIds, patientId);

    const validatedPage = Math.max(1, Number(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (validatedPage - 1) * validatedLimit;

    const [reports, total] = await Promise.all([
      LaboratoryReportModel.find({ patientId: patientObjectId })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate('laboratoryId', 'name')
        .populate('doctorId', 'name')
        .lean(),
      LaboratoryReportModel.countDocuments({ patientId: patientObjectId }),
    ]);

    const items: PatientLabReportHistoryItemDto[] = reports.map((r: any) => ({
      id: r._id.toString(),
      reportNumber: r.reportNumber,
      testName: r.testName,
      category: r.category,
      testDate: r.testDate ? new Date(r.testDate).toISOString() : new Date().toISOString(),
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : new Date().toISOString(),
      status: r.status,
      laboratory: {
        id: r.laboratoryId?._id?.toString() || r.laboratoryId?.toString() || '',
        name: r.laboratoryId?.name || 'Diagnostic Laboratory',
      },
      doctorName: r.doctorId?.name ? `Dr. ${r.doctorId.name}` : undefined,
      observations: (r.observations || []).map((obs: any) => ({
        testName: obs.testName,
        value: obs.value,
        unit: obs.unit,
        referenceRange: obs.referenceRange,
        interpretation: obs.interpretation || 'NORMAL',
      })),
      clinicalNotes: r.clinicalNotes,
      reportUrl: r.reportUrl,
    }));

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_PATIENT_LAB_REPORTS_ACCESSED',
      resourceType: 'PATIENT',
      resourceId: patientId,
      requestId,
      metadata: { count: items.length },
    });

    return {
      items,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  }

  /**
   * POST /api/v1/doctors/patients/:patientId/consent-requests
   * Create an electronic patient consent request under ABDM guidelines
   */
  async createConsentRequest(
    userId: string,
    patientId: string,
    dto: CreateDoctorConsentRequestDto,
    requestId?: string
  ): Promise<any> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw AppError.badRequest('Invalid patient ID format');
    }

    const patientObjectId = new Types.ObjectId(patientId);

    // 1. Verify patient user exists
    const patientUser = await UserModel.findOne({
      _id: patientObjectId,
      role: 'PATIENT',
    }).lean();

    if (!patientUser) {
      throw AppError.notFound('Patient record not found');
    }

    // 2. Fetch doctor professional profile
    const [doctorUser, doctorProfile] = await Promise.all([
      UserModel.findById(userId).lean(),
      DoctorProfileModel.findOne({ userId }).populate('facilityId', 'name').lean(),
    ]);

    const doctorName = doctorUser ? `Dr. ${doctorUser.name}` : 'Attending Doctor';
    const facilityName = (doctorProfile?.facilityId as any)?.name || 'HealthBridge Network Hospital';
    const facilityId = (doctorProfile?.facilityId as any)?._id || undefined;

    const durationDays = dto.durationDays || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 3. Create ConsentRequestModel document
    const consentRequest = await ConsentRequestModel.create({
      patientId: patientObjectId,
      requesterId: new Types.ObjectId(userId),
      requesterName: doctorName,
      requesterRole: 'DOCTOR',
      organization: facilityName,
      facilityId,
      purpose: dto.purpose,
      purposeDescription: dto.purposeDescription,
      requestedDataTypes: dto.requestedDataTypes,
      dateRange: {
        from: now,
        to: expiresAt,
      },
      requestedAt: now,
      status: 'REQUESTED',
      expiresAt,
    });

    await this.recordAudit({
      actorId: userId,
      action: 'DOCTOR_CONSENT_REQUEST_CREATED',
      resourceType: 'CONSENT_REQUEST',
      resourceId: consentRequest._id.toString(),
      requestId,
      metadata: {
        patientId,
        purpose: dto.purpose,
        durationDays,
      },
    });

    return {
      id: consentRequest._id.toString(),
      patientId,
      requesterId: userId,
      requesterName: doctorName,
      organization: facilityName,
      purpose: consentRequest.purpose,
      purposeDescription: consentRequest.purposeDescription,
      requestedDataTypes: consentRequest.requestedDataTypes,
      requestedAt: consentRequest.requestedAt.toISOString(),
      expiresAt: consentRequest.expiresAt.toISOString(),
      status: consentRequest.status,
    };
  }
}

export const doctorPatientService = new DoctorPatientService();
