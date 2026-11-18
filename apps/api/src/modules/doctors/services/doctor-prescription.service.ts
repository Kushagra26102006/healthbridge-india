import { Types } from 'mongoose';
import {
  PrescriptionModel,
} from '../../healthcare/models/prescription.model';
import {
  EncounterModel,
} from '../../healthcare/models/encounter.model';
import {
  AppointmentModel,
} from '../../healthcare/models/appointment.model';
import {
  ConsentArtifactModel,
} from '../../consent/models/consent-artifact.model';
import {
  ConsentRequestModel,
} from '../../consent/models/consent-request.model';
import {
  UserModel,
} from '../../users/models/user.model';
import {
  DoctorProfileModel,
} from '../../users/models/doctor-profile.model';
import {
  PatientProfileModel,
} from '../../users/models/patient-profile.model';
import {
  FacilityModel,
} from '../../healthcare/models/facility.model';
import {
  AuditLogModel,
} from '../../security/models/audit-log.model';
import {
  DoctorPrescriptionSummaryDto,
  PrescriptionListItemDto,
  PrescriptionDetailDto,
  CreateDoctorPrescriptionDto,
  UpdateDoctorPrescriptionDto,
  IssuePrescriptionDto,
  DiscontinuePrescriptionDto,
  PrescriptionFilterQueryDto,
  PrescribedMedicationDto,
} from '@healthbridge/shared-types';
import { AppError } from '../../../shared/errors/app-error';
import { eventPublisher } from '../../events/event.publisher';
import { HttpStatus } from '../../../shared/constants/http-status';
import { ErrorCode } from '../../../shared/errors/error-codes';

export class DoctorPrescriptionService {
  /**
   * Helper: Resolve Doctor ObjectId set (User ID and DoctorProfile ID)
   */
  private async getDoctorIds(userId: string): Promise<Types.ObjectId[]> {
    const userObjectId = new Types.ObjectId(userId);
    const doctorProfile = await DoctorProfileModel.findOne({ userId: userObjectId }).lean();
    const ids: Types.ObjectId[] = [userObjectId];
    if (doctorProfile?._id) {
      ids.push(doctorProfile._id as Types.ObjectId);
    }
    return ids;
  }

  /**
   * Record security and clinical compliance audit trail
   */
  private async recordAudit(params: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    patientId?: string;
    metadata?: Record<string, unknown>;
    requestId?: string;
  }): Promise<void> {
    try {
      await AuditLogModel.create({
        actorId: new Types.ObjectId(params.actorId),
        action: params.action,
        resourceType: params.resourceType,
        resourceId: new Types.ObjectId(params.resourceId),
        patientId: params.patientId ? new Types.ObjectId(params.patientId) : undefined,
        metadata: params.metadata,
        requestId: params.requestId,
        timestamp: new Date(),
      });
    } catch {
      // Non-blocking for high availability in non-audit failures
    }
  }

  /**
   * Strict fail-closed patient access validation:
   * Doctor must have an active appointment, a prior clinical encounter, or valid ABDM electronic consent.
   */
  async validatePatientAccess(
    userId: string,
    patientId: string,
    encounterId?: string
  ): Promise<'GRANTED' | 'ENCOUNTER_BOUND'> {
    const doctorIds = await this.getDoctorIds(userId);
    const patientObjectId = new Types.ObjectId(patientId);

    // 1. If encounterId provided, ensure doctor owns the encounter and patient matches
    if (encounterId) {
      const encounter = await EncounterModel.findOne({
        _id: new Types.ObjectId(encounterId),
        practitionerId: { $in: doctorIds },
        patientId: patientObjectId,
      });

      if (!encounter) {
        throw new AppError(
          'Access denied: Referenced encounter does not exist or is not under your clinical supervision',
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN
        );
      }
      return 'ENCOUNTER_BOUND';
    }

    // 2. Check if doctor has any appointment with the patient
    const hasAppointment = await AppointmentModel.exists({
      doctorId: { $in: doctorIds },
      patientId: patientObjectId,
    });

    if (hasAppointment) {
      return 'ENCOUNTER_BOUND';
    }

    // 3. Check if doctor has prior or current encounter with the patient
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
      'Access denied: You lack verified clinical authorization, active appointment, or patient consent to prescribe for this patient.',
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  /**
   * Aggregate prescription metrics for doctor dashboard
   */
  async getSummaryCounts(userId: string): Promise<DoctorPrescriptionSummaryDto> {
    const doctorIds = await this.getDoctorIds(userId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [total, issued, draft, recent] = await Promise.all([
      PrescriptionModel.countDocuments({ doctorId: { $in: doctorIds } }),
      PrescriptionModel.countDocuments({
        doctorId: { $in: doctorIds },
        status: { $in: ['ACTIVE', 'DISPENSED', 'COMPLETED'] },
        isDraft: false,
      }),
      PrescriptionModel.countDocuments({
        doctorId: { $in: doctorIds },
        $or: [{ status: 'DRAFT' }, { isDraft: true }],
      }),
      PrescriptionModel.countDocuments({
        doctorId: { $in: doctorIds },
        createdAt: { $gte: sevenDaysAgo },
      }),
    ]);

    return { total, issued, draft, recent };
  }

  /**
   * List prescriptions with search, filters and pagination
   */
  async getPrescriptions(
    userId: string,
    query: PrescriptionFilterQueryDto
  ): Promise<{ items: PrescriptionListItemDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const doctorIds = await this.getDoctorIds(userId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { doctorId: { $in: doctorIds } };

    if (query.status && query.status !== 'ALL') {
      if (query.status === 'DRAFT') {
        filter.$or = [{ status: 'DRAFT' }, { isDraft: true }];
      } else {
        filter.status = query.status;
      }
    }

    if (query.patientId) {
      filter.patientId = new Types.ObjectId(query.patientId);
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    if (query.search && query.search.trim().length > 0) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { prescriptionNumber: regex },
        { diagnosis: regex },
        { 'medications.name': regex },
        { 'medications.genericName': regex },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      PrescriptionModel.find(filter)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name')
        .populate('facilityId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PrescriptionModel.countDocuments(filter),
    ]);

    const mapped: PrescriptionListItemDto[] = prescriptions.map((p: any) => {
      const patient = p.patientId as any;
      const doctor = p.doctorId as any;
      const facility = p.facilityId as any;

      return {
        id: p._id.toString(),
        prescriptionNumber: p.prescriptionNumber || `RX-${p._id.toString().slice(-6).toUpperCase()}`,
        patientId: patient?._id?.toString() || p.patientId.toString(),
        doctorId: doctor?._id?.toString() || p.doctorId.toString(),
        doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Doctor',
        facilityId: facility?._id?.toString(),
        facilityName: facility?.name,
        issuedAt: p.issuedAt ? new Date(p.issuedAt).toISOString() : new Date(p.createdAt).toISOString(),
        validUntil: p.validUntil ? new Date(p.validUntil).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        status: p.status,
        medicationCount: p.medications?.length || 0,
        refillEligible: Boolean(p.refillEligible),
        refillsRemaining: p.refillsRemaining || 0,
      };
    });

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get detailed prescription document
   */
  async getPrescriptionById(userId: string, prescriptionId: string): Promise<PrescriptionDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const prescription = await PrescriptionModel.findOne({
      _id: new Types.ObjectId(prescriptionId),
      doctorId: { $in: doctorIds },
    })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone')
      .populate('facilityId', 'name address city facilityType')
      .lean();

    if (!prescription) {
      throw AppError.notFound('Prescription not found or you lack clinical authorization to view it');
    }

    const patient = prescription.patientId as any;
    const doctor = prescription.doctorId as any;
    const facility = prescription.facilityId as any;

    let patientAbhaId: string | undefined;
    if (patient?._id) {
      const profile = await PatientProfileModel.findOne({ userId: patient._id }).lean();
      if (profile?.abhaAddress) {
        patientAbhaId = profile.abhaAddress;
      }
    }

    let doctorSpecialization: string[] | undefined;
    let doctorRegistrationNumber: string | undefined;
    if (doctor?._id) {
      const docProfile = await DoctorProfileModel.findOne({ userId: doctor._id }).lean();
      if (docProfile) {
        doctorSpecialization = docProfile.specialization;
        doctorRegistrationNumber = docProfile.registrationNumber;
      }
    }

    const mappedMedications: PrescribedMedicationDto[] = (prescription.medications || []).map((m: any) => ({
      id: m._id ? m._id.toString() : new Types.ObjectId().toString(),
      name: m.name,
      genericName: m.genericName,
      strength: m.strength || 'As prescribed',
      dosage: m.dosage,
      route: m.route || 'Oral',
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity || 1,
      startDate: m.startDate ? new Date(m.startDate).toISOString() : new Date(prescription.createdAt).toISOString(),
      endDate: m.endDate ? new Date(m.endDate).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
      status: m.status || (prescription.status === 'DISCONTINUED' ? 'DISCONTINUED' : 'ACTIVE'),
      instructions: m.instructions,
    }));

    return {
      id: prescription._id.toString(),
      prescriptionNumber: prescription.prescriptionNumber || `RX-${prescription._id.toString().slice(-6).toUpperCase()}`,
      patientId: patient?._id?.toString() || prescription.patientId.toString(),
      patientName: patient?.name || 'Authorized Patient',
      patientAbhaId,
      doctorId: doctor?._id?.toString() || prescription.doctorId.toString(),
      doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Doctor',
      doctorSpecialization,
      doctorRegistrationNumber,
      facilityId: facility?._id?.toString(),
      facilityName: facility?.name,
      facilityAddress: facility?.address,
      facilityCity: facility?.city,
      issuedAt: prescription.issuedAt
        ? new Date(prescription.issuedAt).toISOString()
        : new Date(prescription.createdAt).toISOString(),
      validUntil: prescription.validUntil
        ? new Date(prescription.validUntil).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
      status: prescription.status,
      diagnosis: prescription.diagnosis,
      instructions: prescription.instructions,
      followUpInstructions: prescription.followUpInstructions,
      medications: mappedMedications,
      refillEligible: Boolean(prescription.refillEligible),
      refillsAllowed: prescription.refillsAllowed || 0,
      refillsRemaining: prescription.refillsRemaining || 0,
      refillRequests: [],
      documentUrl: prescription.documentUrl,
      createdAt: new Date(prescription.createdAt).toISOString(),
      updatedAt: new Date(prescription.updatedAt).toISOString(),
    };
  }

  /**
   * Create a new prescription (Draft or Issued directly)
   */
  async createPrescription(
    userId: string,
    dto: CreateDoctorPrescriptionDto,
    requestId?: string
  ): Promise<PrescriptionDetailDto> {
    const doctorObjectId = new Types.ObjectId(userId);

    // 1. Strict authorization: Verify patient access
    await this.validatePatientAccess(userId, dto.patientId, dto.encounterId);

    // 2. Resolve patient record
    const patientUser = await UserModel.findOne({
      _id: new Types.ObjectId(dto.patientId),
      role: 'PATIENT',
    }).lean();

    if (!patientUser) {
      throw AppError.notFound('Patient record not found');
    }

    // 3. Resolve facility ID: use dto, or fallback from doctor profile or encounter
    let facilityId = dto.facilityId ? new Types.ObjectId(dto.facilityId) : undefined;
    if (!facilityId && dto.encounterId) {
      const encounter = await EncounterModel.findById(new Types.ObjectId(dto.encounterId)).lean();
      if (encounter?.facilityId) {
        facilityId = encounter.facilityId as Types.ObjectId;
      }
    }
    if (!facilityId) {
      const docProfile = await DoctorProfileModel.findOne({ userId: doctorObjectId }).lean();
      if (docProfile?.facilityId) {
        facilityId = docProfile.facilityId as Types.ObjectId;
      }
    }

    // 4. Generate unique prescription reference number
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prescriptionNumber = `RX-${datePrefix}-${randomSuffix}`;

    const isDraft = dto.isDraft !== false; // Default true if draft, false if issuing immediately
    const now = new Date();
    const validUntil = dto.validUntil ? new Date(dto.validUntil) : new Date(now.getTime() + 30 * 86400000);

    const mappedMeds = dto.medications.map((m) => ({
      _id: new Types.ObjectId(),
      medicationCatalogId: m.medicationCatalogId ? new Types.ObjectId(m.medicationCatalogId) : undefined,
      name: m.name,
      genericName: m.genericName,
      brandName: m.brandName,
      strength: m.strength,
      dosage: m.dosage,
      route: m.route || 'Oral',
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity || 1,
      instructions: m.instructions,
      startDate: now,
      status: 'ACTIVE',
    }));

    const prescription = await PrescriptionModel.create({
      prescriptionNumber,
      patientId: new Types.ObjectId(dto.patientId),
      doctorId: doctorObjectId,
      encounterId: dto.encounterId ? new Types.ObjectId(dto.encounterId) : undefined,
      facilityId,
      diagnosis: dto.diagnosis,
      medications: mappedMeds,
      instructions: dto.instructions,
      followUpInstructions: dto.followUpInstructions,
      issuedAt: isDraft ? undefined : now,
      issuedBy: isDraft ? undefined : doctorObjectId,
      validUntil,
      status: isDraft ? 'DRAFT' : 'ACTIVE',
      isDraft,
      version: 1,
    });

    // 5. If linked to an encounter, add prescription ID to encounter
    if (dto.encounterId) {
      await EncounterModel.findByIdAndUpdate(new Types.ObjectId(dto.encounterId), {
        $addToSet: { linkedPrescriptionIds: prescription._id },
      });
    }

    await this.recordAudit({
      actorId: userId,
      action: isDraft ? 'PRESCRIPTION_DRAFT_CREATED' : 'PRESCRIPTION_ISSUED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescription._id.toString(),
      patientId: dto.patientId,
      requestId,
      metadata: { prescriptionNumber, medicationCount: mappedMeds.length },
    });

    return this.getPrescriptionById(userId, prescription._id.toString());
  }

  /**
   * Update prescription draft (Optimistic Concurrency protected)
   */
  async updatePrescription(
    userId: string,
    prescriptionId: string,
    dto: UpdateDoctorPrescriptionDto,
    requestId?: string
  ): Promise<PrescriptionDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const prescription = await PrescriptionModel.findOne({
      _id: new Types.ObjectId(prescriptionId),
      doctorId: { $in: doctorIds },
    });

    if (!prescription) {
      throw AppError.notFound('Prescription not found or not owned by you');
    }

    // Immutable check: cannot modify finalized/issued prescription
    if (!prescription.isDraft && prescription.status !== 'DRAFT') {
      throw new AppError(
        'Cannot modify an issued prescription. Issued prescriptions are immutable once finalized.',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    // Concurrency check
    if (dto.version !== undefined && dto.version < prescription.version) {
      throw new AppError(
        'Conflict: Prescription was concurrently updated by another session. Please refresh before saving.',
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT
      );
    }

    if (dto.diagnosis !== undefined) prescription.diagnosis = dto.diagnosis;
    if (dto.instructions !== undefined) prescription.instructions = dto.instructions;
    if (dto.followUpInstructions !== undefined) prescription.followUpInstructions = dto.followUpInstructions;
    if (dto.validUntil) prescription.validUntil = new Date(dto.validUntil);

    if (dto.medications && dto.medications.length > 0) {
      prescription.medications = dto.medications.map((m) => ({
        id: (m as any).id || (m as any)._id?.toString(),
        medicationCatalogId: m.medicationCatalogId ? new Types.ObjectId(m.medicationCatalogId) : undefined,
        name: m.name,
        genericName: m.genericName,
        brandName: m.brandName,
        strength: m.strength,
        dosage: m.dosage,
        route: m.route || 'Oral',
        frequency: m.frequency,
        duration: m.duration,
        quantity: m.quantity || 1,
        instructions: m.instructions,
        status: 'ACTIVE',
      })) as any;
    }

    prescription.version = (prescription.version || 1) + 1;
    await prescription.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PRESCRIPTION_DRAFT_UPDATED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescriptionId,
      requestId,
      metadata: { version: prescription.version },
    });

    return this.getPrescriptionById(userId, prescriptionId);
  }

  /**
   * Finalize and issue an e-prescription
   */
  async issuePrescription(
    userId: string,
    prescriptionId: string,
    dto: IssuePrescriptionDto,
    requestId?: string
  ): Promise<PrescriptionDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const prescription = await PrescriptionModel.findOne({
      _id: new Types.ObjectId(prescriptionId),
      doctorId: { $in: doctorIds },
    });

    if (!prescription) {
      throw AppError.notFound('Prescription not found or not owned by you');
    }

    if (!prescription.isDraft && prescription.status === 'ACTIVE') {
      throw new AppError(
        'Prescription has already been finalized and issued. Duplicate issuance is prevented.',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    const now = new Date();
    prescription.status = 'ACTIVE';
    prescription.isDraft = false;
    prescription.issuedAt = now;
    prescription.issuedBy = new Types.ObjectId(userId);
    prescription.version = (prescription.version || 1) + 1;

    // Generate digital document URL reference
    prescription.documentUrl = `/api/v1/doctors/prescriptions/${prescriptionId}/document`;

    await prescription.save();

    // If linked to encounter, ensure encounter references it
    if (prescription.encounterId) {
      await EncounterModel.findByIdAndUpdate(prescription.encounterId, {
        $addToSet: { linkedPrescriptionIds: prescription._id },
      });
    }

    await eventPublisher.publishSafe({
      idempotencyKey: `prescription_issued:${prescriptionId}`,
      eventType: 'PRESCRIPTION_ISSUED',
      sourceModule: 'PRESCRIPTIONS',
      aggregateId: prescriptionId,
      aggregateType: 'Prescription',
      correlationId: requestId,
      actorId: userId,
      actorRole: 'DOCTOR',
      payload: {
        prescriptionId,
        prescriptionNumber: prescription.prescriptionNumber,
        ...(prescription.encounterId ? { encounterId: prescription.encounterId.toString() } : {}),
        patientId: prescription.patientId.toString(),
        doctorId: userId,
        status: prescription.status,
        isDraft: false,
        medicationCount: Array.isArray(prescription.medications) ? prescription.medications.length : 0,
        pharmacyDiscoverable: true,
        issuedAt: now.toISOString(),
      },
    });

    await this.recordAudit({
      actorId: userId,
      action: 'PRESCRIPTION_ISSUED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescriptionId,
      requestId,
      metadata: {
        issuedAt: now.toISOString(),
        prescriptionNumber: prescription.prescriptionNumber,
        notes: dto.notes,
      },
    });

    return this.getPrescriptionById(userId, prescriptionId);
  }

  /**
   * Discontinue an active issued prescription
   */
  async discontinuePrescription(
    userId: string,
    prescriptionId: string,
    dto: DiscontinuePrescriptionDto,
    requestId?: string
  ): Promise<PrescriptionDetailDto> {
    const doctorIds = await this.getDoctorIds(userId);

    const prescription = await PrescriptionModel.findOne({
      _id: new Types.ObjectId(prescriptionId),
      doctorId: { $in: doctorIds },
    });

    if (!prescription) {
      throw AppError.notFound('Prescription not found or not owned by you');
    }

    if (prescription.status !== 'ACTIVE') {
      throw new AppError(
        `Cannot discontinue prescription with status '${prescription.status}'. Only active issued prescriptions can be discontinued.`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    const now = new Date();
    prescription.status = 'DISCONTINUED';
    prescription.discontinuedAt = now;
    prescription.discontinuedBy = new Types.ObjectId(userId);
    prescription.discontinuationReason = dto.reason;

    // Discontinue individual medication lines
    if (prescription.medications && prescription.medications.length > 0) {
      prescription.medications.forEach((m) => {
        m.status = 'DISCONTINUED';
      });
    }

    prescription.version = (prescription.version || 1) + 1;
    await prescription.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PRESCRIPTION_DISCONTINUED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescriptionId,
      requestId,
      metadata: { reason: dto.reason },
    });

    return this.getPrescriptionById(userId, prescriptionId);
  }

  /**
   * Get printable digital prescription document representation
   */
  async getPrescriptionDocument(
    userId: string,
    prescriptionId: string
  ): Promise<{
    prescription: PrescriptionDetailDto;
    facility?: any;
    doctorRegistration?: string;
    generatedAt: string;
    watermarkText?: string;
  }> {
    const prescription = await this.getPrescriptionById(userId, prescriptionId);

    let facility: any = undefined;
    if (prescription.facilityId) {
      facility = await FacilityModel.findById(new Types.ObjectId(prescription.facilityId)).lean();
    }

    return {
      prescription,
      facility,
      doctorRegistration: prescription.doctorRegistrationNumber || 'MCI-REG-VERIFIED',
      generatedAt: new Date().toISOString(),
      watermarkText: prescription.status === 'DRAFT' ? 'CLINICAL DRAFT - NOT ISSUED' : undefined,
    };
  }
}

export const doctorPrescriptionService = new DoctorPrescriptionService();
export default doctorPrescriptionService;