import mongoose, { Types } from 'mongoose';
import {
  UserModel,
  DoctorProfileModel,
  PatientProfileModel,
  EncounterModel,
  AppointmentModel,
  PrescriptionModel,
  MedicalRecordModel,
  LaboratoryReportModel,
  ConsentArtifactModel,
  ConsentRequestModel,
  AuditLogModel,
} from '../../../database/models';
import { AppError } from '../../../shared/errors/app-error';
import { HttpStatus } from '../../../shared/constants/http-status';
import { ErrorCode } from '../../../shared/errors/error-codes';
import type {
  EncounterItemDto,
  EncounterDetailDto,
  EncounterSummaryCountsDto,
  PatientClinicalHistoryDto,
  CreateEncounterDto,
  UpdateEncounterDto,
  EncounterFilterQueryDto,
  PaginationMeta,
} from '@healthbridge/shared-types';

export class DoctorEncounterService {
  /**
   * Resolve doctor IDs across User._id and DoctorProfile._id
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
          requestId: params.requestId || `req-enc-${Date.now()}`,
          outcome: params.outcome || 'SUCCESS',
          metadata: params.metadata,
        });
      }
    } catch {
      // Non-blocking audit logger
    }
  }

  /**
   * Validates doctor's legal authorization to access a patient's chart.
   * Fails closed: Requires either a confirmed appointment, an existing clinical care encounter,
   * or active electronic consent.
   */
  private async validatePatientAccess(
    doctorIds: Types.ObjectId[],
    patientId: string,
    appointmentId?: string
  ): Promise<'GRANTED' | 'ENCOUNTER_BOUND'> {
    const patientObjectId = new Types.ObjectId(patientId);

    // 1. If explicit appointment is referenced, verify doctor owns it
    if (appointmentId) {
      const apt = await AppointmentModel.findOne({
        _id: new Types.ObjectId(appointmentId),
        doctorId: { $in: doctorIds },
        patientId: patientObjectId,
      });

      if (!apt) {
        throw new AppError(
          'Access denied: You do not hold ownership of the referenced appointment for this patient',
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN
        );
      }
      return 'ENCOUNTER_BOUND';
    }

    // 2. Check if doctor has any active or past appointment with patient
    const hasAppointment = await AppointmentModel.exists({
      doctorId: { $in: doctorIds },
      patientId: patientObjectId,
    });

    if (hasAppointment) {
      return 'ENCOUNTER_BOUND';
    }

    // 3. Check if doctor has an existing encounter with patient
    const hasEncounter = await EncounterModel.exists({
      practitionerId: { $in: doctorIds },
      patientId: patientObjectId,
    });

    if (hasEncounter) {
      return 'ENCOUNTER_BOUND';
    }

    // 4. Check for active Electronic Consent Artifact
    const now = new Date();
    const consentArtifact = await ConsentArtifactModel.findOne({
      patientId: patientObjectId,
      requesterId: { $in: doctorIds },
      consentStatus: 'ACTIVE',
      'validityPeriod.to': { $gt: now },
    });

    if (consentArtifact) {
      return 'GRANTED';
    }

    // 5. Check for approved Consent Request
    const approvedRequest = await ConsentRequestModel.findOne({
      patientId: patientObjectId,
      requesterId: { $in: doctorIds },
      status: { $in: ['APPROVED', 'GRANTED'] },
      expiresAt: { $gt: now },
    });

    if (approvedRequest) {
      return 'GRANTED';
    }

    // Fail closed
    throw new AppError(
      'Access denied: You lack verified clinical authorization, active appointment, or patient consent to access this health record.',
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  /**
   * Aggregate encounter metrics for dashboard
   */
  async getSummaryCounts(userId: string): Promise<EncounterSummaryCountsDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayCount, draftCount, completedCount, pendingDocCount, totalCount] =
      await Promise.all([
        EncounterModel.countDocuments({
          practitionerId: { $in: doctorIds },
          startTime: { $gte: todayStart, $lte: todayEnd },
        }),
        EncounterModel.countDocuments({
          practitionerId: { $in: doctorIds },
          isDraft: true,
          status: { $ne: 'CANCELLED' },
        }),
        EncounterModel.countDocuments({
          practitionerId: { $in: doctorIds },
          status: 'COMPLETED',
        }),
        EncounterModel.countDocuments({
          practitionerId: { $in: doctorIds },
          status: 'IN_PROGRESS',
          isDraft: true,
        }),
        EncounterModel.countDocuments({
          practitionerId: { $in: doctorIds },
        }),
      ]);

    return {
      today: todayCount,
      draft: draftCount,
      completed: completedCount,
      pendingDocumentation: pendingDocCount,
      total: totalCount,
    };
  }

  /**
   * List encounters with pagination, multidimensional filters & search
   */
  async getEncounters(
    userId: string,
    filters: EncounterFilterQueryDto
  ): Promise<{ items: EncounterItemDto[]; pagination: PaginationMeta }> {
    const doctorIds = await this.getDoctorIds(userId);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      practitionerId: { $in: doctorIds },
    };

    // Filter by Tab
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (filters.filterTab === 'today') {
      query.startTime = { $gte: todayStart, $lte: todayEnd };
    } else if (filters.filterTab === 'draft') {
      query.isDraft = true;
      query.status = { $ne: 'CANCELLED' };
    } else if (filters.filterTab === 'completed') {
      query.status = 'COMPLETED';
    } else if (filters.filterTab === 'pending') {
      query.status = 'IN_PROGRESS';
      query.isDraft = true;
    }

    // Direct Status
    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'DRAFT') {
        query.isDraft = true;
      } else {
        query.status = filters.status;
      }
    }

    // Consultation Type
    if (filters.encounterType) {
      query.encounterType = filters.encounterType;
    }

    // Patient direct filter
    if (filters.patientId) {
      query.patientId = new Types.ObjectId(filters.patientId);
    }

    // Facility filter
    if (filters.facilityId) {
      query.facilityId = new Types.ObjectId(filters.facilityId);
    }

    // Date range
    if (filters.startDate || filters.endDate) {
      const dateRange: Record<string, Date> = {};
      if (filters.startDate) dateRange.$gte = new Date(filters.startDate);
      if (filters.endDate) dateRange.$lte = new Date(filters.endDate);
      query.startTime = dateRange;
    }

    // Search patient name or complaint
    if (filters.search) {
      const matchingPatients = await UserModel.find({
        role: 'PATIENT',
        name: { $regex: filters.search, $options: 'i' },
      }).select('_id');
      const patientIds = matchingPatients.map((p) => p._id);

      if (patientIds.length > 0) {
        query.$or = [
          { patientId: { $in: patientIds } },
          { chiefComplaint: { $regex: filters.search, $options: 'i' } },
          { 'diagnoses.name': { $regex: filters.search, $options: 'i' } },
        ];
      } else {
        query.$or = [
          { chiefComplaint: { $regex: filters.search, $options: 'i' } },
          { 'diagnoses.name': { $regex: filters.search, $options: 'i' } },
        ];
      }
    }

    const [encounters, total] = await Promise.all([
      EncounterModel.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'name phone')
        .populate('facilityId', 'name')
        .populate('practitionerId', 'name')
        .lean(),
      EncounterModel.countDocuments(query),
    ]);

    const items: EncounterItemDto[] = encounters.map((enc: any) => {
      const patient = enc.patientId as any;
      const facility = enc.facilityId as any;
      const doctor = enc.practitionerId as any;

      const primaryDiag = (enc.diagnoses || []).find((d: any) => d.type === 'PRIMARY')?.name ||
        enc.diagnoses?.[0]?.name;

      return {
        id: enc._id.toString(),
        encounterReference: `ENC-${enc._id.toString().slice(-6).toUpperCase()}`,
        patientId: patient?._id?.toString() || enc.patientId?.toString() || 'unknown',
        patientName: patient?.name || 'Authorized Patient',
        patientPhone: patient?.phone,
        practitionerId: doctor?._id?.toString() || enc.practitionerId?.toString() || userId,
        doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Doctor',
        appointmentId: enc.appointmentId?.toString(),
        facilityId: facility?._id?.toString(),
        facilityName: facility?.name || 'Healthcare Facility',
        encounterType: enc.encounterType || 'AMBULATORY',
        status: enc.status || 'IN_PROGRESS',
        isDraft: enc.isDraft ?? true,
        chiefComplaint: enc.chiefComplaint,
        primaryDiagnosis: primaryDiag,
        startTime: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
        endTime: enc.endTime ? new Date(enc.endTime).toISOString() : undefined,
        finalizedAt: enc.finalizedAt ? new Date(enc.finalizedAt).toISOString() : undefined,
        createdAt: enc.createdAt ? new Date(enc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: enc.updatedAt ? new Date(enc.updatedAt).toISOString() : new Date().toISOString(),
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
   * Get single encounter detailed workspace view
   */
  async getEncounterById(userId: string, encounterId: string): Promise<EncounterDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const encounter = await EncounterModel.findOne({
      _id: new Types.ObjectId(encounterId),
      practitionerId: { $in: doctorIds },
    })
      .populate('patientId', 'name email phone')
      .populate('facilityId', 'name address facilityType')
      .populate('practitionerId', 'name')
      .lean();

    if (!encounter) {
      throw AppError.notFound('Encounter not found or you lack clinical authorization to view it');
    }

    const patient = encounter.patientId as any;
    const facility = encounter.facilityId as any;
    const doctor = encounter.practitionerId as any;

    // Fetch demographics (gender/age)
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

    // Fetch linked prescriptions
    let prescriptionsData: any[] = [];
    if (encounter.linkedPrescriptionIds?.length || encounter._id) {
      prescriptionsData = await PrescriptionModel.find({
        $or: [
          { _id: { $in: encounter.linkedPrescriptionIds || [] } },
          { encounterId: encounter._id },
        ],
      }).lean();
    }

    const primaryDiag = (encounter.diagnoses || []).find((d: any) => d.type === 'PRIMARY')?.name ||
      encounter.diagnoses?.[0]?.name;

    return {
      id: encounter._id.toString(),
      encounterReference: `ENC-${encounter._id.toString().slice(-6).toUpperCase()}`,
      patientId: patient?._id?.toString() || encounter.patientId.toString(),
      patientName: patient?.name || 'Authorized Patient',
      patientPhone: patient?.phone,
      patientAge,
      patientGender,
      practitionerId: doctor?._id?.toString() || encounter.practitionerId.toString(),
      doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Doctor',
      appointmentId: encounter.appointmentId?.toString(),
      facilityId: facility?._id?.toString(),
      facilityName: facility?.name,
      encounterType: encounter.encounterType,
      status: encounter.status,
      isDraft: encounter.isDraft ?? true,
      chiefComplaint: encounter.chiefComplaint,
      primaryDiagnosis: primaryDiag,
      historyOfPresentIllness: encounter.historyOfPresentIllness,
      medicalHistory: encounter.medicalHistory,
      vitals: encounter.vitals
        ? {
            ...encounter.vitals,
            recordedAt: encounter.vitals.recordedAt ? new Date(encounter.vitals.recordedAt).toISOString() : undefined,
          }
        : undefined,
      examination: encounter.examination,
      diagnoses: (encounter.diagnoses || []).map((d: any) => ({
        id: d._id?.toString(),
        name: d.name,
        code: d.code,
        type: d.type || 'PRIMARY',
        clinicalStatus: d.clinicalStatus || 'ACTIVE',
        notes: d.notes,
      })),
      assessment: encounter.assessment,
      treatmentPlan: encounter.treatmentPlan,
      followUpInstructions: encounter.followUpInstructions,
      followUpDate: encounter.followUpDate ? new Date(encounter.followUpDate).toISOString() : undefined,
      linkedRecordIds: (encounter.linkedRecordIds || []).map((id: any) => id.toString()),
      linkedPrescriptionIds: (encounter.linkedPrescriptionIds || []).map((id: any) => id.toString()),
      prescriptions: prescriptionsData.map((p: any) => ({
        id: p._id.toString(),
        medications: p.medications || [],
        instructions: p.instructions || '',
        issuedAt: p.issuedAt ? new Date(p.issuedAt).toISOString() : new Date().toISOString(),
        status: p.status || 'ACTIVE',
      })),
      version: encounter.version || 1,
      startTime: encounter.startTime.toISOString(),
      endTime: encounter.endTime ? encounter.endTime.toISOString() : undefined,
      finalizedAt: encounter.finalizedAt ? encounter.finalizedAt.toISOString() : undefined,
      finalizedBy: encounter.finalizedBy?.toString(),
      createdAt: encounter.createdAt.toISOString(),
      updatedAt: encounter.updatedAt.toISOString(),
    };
  }

  /**
   * Start and initialize a new clinical encounter
   */
  async createEncounter(
    userId: string,
    dto: CreateEncounterDto,
    requestId?: string
  ): Promise<EncounterDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    // 1. Validate Patient existence
    const patientUser = await UserModel.findOne({
      _id: new Types.ObjectId(dto.patientId),
      role: 'PATIENT',
    });

    if (!patientUser) {
      throw AppError.notFound('Patient record not found');
    }

    // 2. Authorize clinical relationship (fails closed)
    await this.validatePatientAccess(doctorIds, dto.patientId, dto.appointmentId);

    // 3. Resolve facility if not specified
    let facilityId = dto.facilityId ? new Types.ObjectId(dto.facilityId) : undefined;
    if (!facilityId) {
      const doctorProfile = await DoctorProfileModel.findOne({ userId });
      if (doctorProfile?.facilityId) {
        facilityId = doctorProfile.facilityId as any;
      }
    }

    // 4. Create Encounter
    const encounter = await EncounterModel.create({
      patientId: new Types.ObjectId(dto.patientId),
      practitionerId: new Types.ObjectId(userId),
      facilityId,
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
      encounterType: dto.encounterType || 'AMBULATORY',
      startTime: new Date(),
      status: 'IN_PROGRESS',
      isDraft: true,
      chiefComplaint: dto.chiefComplaint,
      version: 1,
      diagnoses: [],
      linkedRecordIds: [],
      linkedPrescriptionIds: [],
    });

    // 5. If appointment-based, update appointment state to IN_PROGRESS and link encounter
    if (dto.appointmentId) {
      await AppointmentModel.findByIdAndUpdate(dto.appointmentId, {
        encounterId: encounter._id,
        status: 'IN_PROGRESS',
        consultationStartedAt: new Date(),
      });
    }

    await this.recordAudit({
      actorId: userId,
      action: 'CLINICAL_ENCOUNTER_CREATED',
      resourceType: 'ENCOUNTER',
      resourceId: encounter._id.toString(),
      requestId,
      metadata: {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        encounterType: dto.encounterType || 'AMBULATORY',
      },
    });

    return this.getEncounterById(userId, encounter._id.toString());
  }

  /**
   * Save draft documentation with optimistic concurrency protection
   */
  async updateEncounterDraft(
    userId: string,
    encounterId: string,
    dto: UpdateEncounterDto,
    requestId?: string
  ): Promise<EncounterDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const encounter = await EncounterModel.findOne({
      _id: new Types.ObjectId(encounterId),
      practitionerId: { $in: doctorIds },
    });

    if (!encounter) {
      throw AppError.notFound('Encounter not found or not owned by you');
    }

    // Finalization lock check
    if (encounter.status === 'COMPLETED' && !encounter.isDraft) {
      throw new AppError(
        'Cannot modify a finalized clinical encounter. Clinical records are immutable once completed.',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    // Optimistic concurrency protection
    if (dto.version !== undefined && dto.version < encounter.version) {
      throw new AppError(
        'Encounter document was modified concurrently. Please refresh the workspace to merge the latest notes.',
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT
      );
    }

    // Update clinical sections
    if (dto.chiefComplaint !== undefined) encounter.chiefComplaint = dto.chiefComplaint;
    if (dto.historyOfPresentIllness !== undefined) encounter.historyOfPresentIllness = dto.historyOfPresentIllness;
    if (dto.medicalHistory !== undefined) encounter.medicalHistory = dto.medicalHistory;

    // Vitals with auto-BMI calculation
    if (dto.vitals) {
      const v = { ...dto.vitals };
      if (v.height && v.weight && v.height > 0 && v.weight > 0) {
        const heightMeters = v.height / 100;
        v.bmi = Number((v.weight / (heightMeters * heightMeters)).toFixed(1));
      }
      encounter.vitals = {
        ...v,
        recordedAt: v.recordedAt ? new Date(v.recordedAt) : new Date(),
      };
    }

    if (dto.examination) {
      encounter.examination = dto.examination;
    }

    if (dto.diagnoses) {
      encounter.diagnoses = dto.diagnoses as any;
    }

    if (dto.assessment !== undefined) encounter.assessment = dto.assessment;
    if (dto.treatmentPlan !== undefined) encounter.treatmentPlan = dto.treatmentPlan;
    if (dto.followUpInstructions !== undefined) encounter.followUpInstructions = dto.followUpInstructions;
    if (dto.followUpDate !== undefined) {
      encounter.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : undefined;
    }

    if (dto.linkedRecordIds) {
      encounter.linkedRecordIds = dto.linkedRecordIds.map((id) => new Types.ObjectId(id));
    }

    if (dto.linkedPrescriptionIds) {
      encounter.linkedPrescriptionIds = dto.linkedPrescriptionIds.map((id) => new Types.ObjectId(id));
    }

    encounter.version = (encounter.version || 1) + 1;
    await encounter.save();

    await this.recordAudit({
      actorId: userId,
      action: 'CLINICAL_ENCOUNTER_DRAFT_SAVED',
      resourceType: 'ENCOUNTER',
      resourceId: encounterId,
      requestId,
      metadata: { version: encounter.version },
    });

    return this.getEncounterById(userId, encounterId);
  }

  /**
   * Finalize clinical encounter (locks document against silent editing)
   */
  async completeEncounter(
    userId: string,
    encounterId: string,
    dto?: UpdateEncounterDto,
    requestId?: string
  ): Promise<EncounterDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const encounter = await EncounterModel.findOne({
      _id: new Types.ObjectId(encounterId),
      practitionerId: { $in: doctorIds },
    });

    if (!encounter) {
      throw AppError.notFound('Encounter not found or not owned by you');
    }

    if (encounter.status === 'COMPLETED' && !encounter.isDraft) {
      throw new AppError(
        'Encounter is already finalized and completed. Duplicate finalization is prevented.',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    // Apply any final edits if passed
    if (dto) {
      await this.updateEncounterDraft(userId, encounterId, dto, requestId);
    }

    const now = new Date();
    encounter.status = 'COMPLETED';
    encounter.isDraft = false;
    encounter.endTime = now;
    encounter.finalizedAt = now;
    encounter.finalizedBy = new Types.ObjectId(userId);
    encounter.version = (encounter.version || 1) + 1;
    await encounter.save();

    // If linked to an appointment, complete the appointment
    if (encounter.appointmentId) {
      await AppointmentModel.findByIdAndUpdate(encounter.appointmentId, {
        status: 'COMPLETED',
        completedAt: now,
        completedBy: new Types.ObjectId(userId),
      });
    }

    await this.recordAudit({
      actorId: userId,
      action: 'CLINICAL_ENCOUNTER_FINALIZED',
      resourceType: 'ENCOUNTER',
      resourceId: encounterId,
      requestId,
      metadata: { finalizedAt: now.toISOString() },
    });

    return this.getEncounterById(userId, encounterId);
  }

  /**
   * Get patient longitudinal clinical history with strict consent and authorization checks
   */
  async getPatientClinicalHistory(
    userId: string,
    patientId: string,
    requestId?: string
  ): Promise<PatientClinicalHistoryDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    // 1. Verify patient exists
    const patientUser = await UserModel.findOne({
      _id: patientObjectId,
      role: 'PATIENT',
    }).lean();

    if (!patientUser) {
      throw AppError.notFound('Patient record not found');
    }

    // 2. Validate access rights (fails closed)
    const consentStatus = await this.validatePatientAccess(doctorIds, patientId);

    // 3. Concurrently retrieve clinical documents
    const [patientProfile, pastEncounters, prescriptions, labReports, medicalRecords] =
      await Promise.all([
        PatientProfileModel.findOne({ userId: patientObjectId }).lean(),
        EncounterModel.find({ patientId: patientObjectId })
          .sort({ startTime: -1 })
          .populate('facilityId', 'name')
          .populate('practitionerId', 'name')
          .lean(),
        PrescriptionModel.find({
          patientId: patientObjectId,
          status: { $in: ['ACTIVE', 'COMPLETED', 'DISPENSED'] },
        })
          .sort({ issuedAt: -1 })
          .populate('doctorId', 'name')
          .lean(),
        LaboratoryReportModel.find({ patientId: patientObjectId })
          .sort({ publishedAt: -1 })
          .lean(),
        MedicalRecordModel.find({ patientId: patientObjectId })
          .sort({ recordDate: -1 })
          .lean(),
      ]);

    // Calculate age
    let age: number | undefined;
    if (patientProfile?.dateOfBirth) {
      const diff = Date.now() - new Date(patientProfile.dateOfBirth).getTime();
      age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Aggregate Current Medications
    const currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      prescribedBy?: string;
      issuedAt: string;
    }> = [];

    const activePrescriptions = prescriptions.filter((p: any) => p.status === 'ACTIVE');
    for (const p of activePrescriptions) {
      const doctorName = (p.doctorId as any)?.name ? `Dr. ${(p.doctorId as any).name}` : undefined;
      for (const med of p.medications || []) {
        currentMedications.push({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          prescribedBy: doctorName,
          issuedAt: p.issuedAt ? new Date(p.issuedAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    // Aggregate Diagnoses across encounters
    const pastDiagnoses: Array<{
      name: string;
      code?: string;
      type: string;
      diagnosedDate: string;
      encounterId?: string;
    }> = [];

    for (const enc of pastEncounters) {
      for (const d of enc.diagnoses || []) {
        pastDiagnoses.push({
          name: d.name,
          code: d.code,
          type: d.type || 'PRIMARY',
          diagnosedDate: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
          encounterId: enc._id.toString(),
        });
      }
    }

    // Map encounters
    const mappedEncounters: EncounterItemDto[] = pastEncounters.map((enc: any) => {
      const doctor = enc.practitionerId as any;
      const facility = enc.facilityId as any;
      const primaryDiag = (enc.diagnoses || []).find((d: any) => d.type === 'PRIMARY')?.name ||
        enc.diagnoses?.[0]?.name;

      return {
        id: enc._id.toString(),
        encounterReference: `ENC-${enc._id.toString().slice(-6).toUpperCase()}`,
        patientId,
        patientName: patientUser.name,
        practitionerId: doctor?._id?.toString() || enc.practitionerId?.toString() || userId,
        doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Doctor',
        appointmentId: enc.appointmentId?.toString(),
        facilityId: facility?._id?.toString(),
        facilityName: facility?.name,
        encounterType: enc.encounterType || 'AMBULATORY',
        status: enc.status || 'IN_PROGRESS',
        isDraft: enc.isDraft ?? true,
        chiefComplaint: enc.chiefComplaint,
        primaryDiagnosis: primaryDiag,
        startTime: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
        endTime: enc.endTime ? new Date(enc.endTime).toISOString() : undefined,
        finalizedAt: enc.finalizedAt ? new Date(enc.finalizedAt).toISOString() : undefined,
        createdAt: enc.createdAt ? new Date(enc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: enc.updatedAt ? new Date(enc.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    await this.recordAudit({
      actorId: userId,
      action: 'PATIENT_CLINICAL_HISTORY_ACCESSED',
      resourceType: 'PATIENT_RECORD',
      resourceId: patientId,
      requestId,
      metadata: { consentStatus },
    });

    return {
      patient: {
        id: patientUser._id.toString(),
        name: patientUser.name,
        phone: patientUser.phone,
        email: patientUser.email,
        gender: patientProfile?.gender,
        dateOfBirth: patientProfile?.dateOfBirth ? new Date(patientProfile.dateOfBirth).toISOString().split('T')[0] : undefined,
        age,
        bloodGroup: patientProfile?.bloodGroup,
        abhaAddress: patientProfile?.abhaAddress,
        abhaNumber: patientProfile?.abhaNumber,
        emergencyContact: patientProfile?.emergencyContact
          ? {
              name: patientProfile.emergencyContact.name,
              phone: patientProfile.emergencyContact.phone,
              relationship: patientProfile.emergencyContact.relationship,
            }
          : undefined,
      },
      allergies: [], // Clean empty state if not documented
      currentMedications,
      pastDiagnoses,
      encounters: mappedEncounters,
      labReports: labReports.map((lr: any) => ({
        id: lr._id.toString(),
        testName: lr.observations?.[0]?.testName || 'Diagnostic Lab Investigation',
        date: lr.publishedAt ? new Date(lr.publishedAt).toISOString() : new Date().toISOString(),
        status: 'COMPLETED',
        summary: lr.observations?.length ? `${lr.observations.length} observations reported` : undefined,
        reportUrl: lr.reportUrl,
      })),
      medicalRecords: medicalRecords.map((mr: any) => ({
        id: mr._id.toString(),
        title: mr.title,
        recordType: mr.recordType,
        recordDate: mr.recordDate ? new Date(mr.recordDate).toISOString() : new Date().toISOString(),
        source: mr.source,
      })),
      consentStatus,
    };
  }
}

export const doctorEncounterService = new DoctorEncounterService();
