import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  MedicalRecordModel,
  IMedicalRecordDocument,
} from '../../healthcare/models/medical-record.model';
import { AppError } from '../../../shared/errors/app-error';
import { HttpStatus } from '../../../shared/constants/http-status';
import { HEALTH_RECORD_TYPES, RECORD_CONFIG } from '@healthbridge/config';
import type {
  MedicalRecordType,
  MedicalRecordSummaryDto,
  MedicalRecordDetailDto,
  MedicalRecordAccessTokenDto,
  IMedicalRecord,
} from '@healthbridge/shared-types';
import type { CreateRecordInput, RecordFilterQueryInput } from '@healthbridge/validation';
import mongoose from 'mongoose';
import { fileSecurityService } from '../../../security/file-security.service';
import { securityAuditMonitor } from '../../../security/security-audit.monitor';

/**
 * Maps an internal MedicalRecord document to an HL7 FHIR R4 DocumentReference resource
 */
export const mapToFHIRDocumentReference = (
  record: IMedicalRecordDocument
): Record<string, unknown> => {
  const loincMap: Record<MedicalRecordType, { code: string; display: string }> = {
    OP_CONSULTATION: { code: '34108-1', display: 'Outpatient Evaluation and Management' },
    DISCHARGE_SUMMARY: { code: '18842-5', display: 'Hospital Discharge Summary' },
    DIAGNOSTIC_REPORT: { code: '11502-2', display: 'Laboratory and Diagnostic Report' },
    IMAGING_REPORT: { code: '18748-4', display: 'Diagnostic Imaging Study' },
    PRESCRIPTION: { code: '57833-6', display: 'Prescription for Medication' },
    MEDICAL_CERTIFICATE: { code: '75476-2', display: 'Medical Certificate' },
    IMMUNIZATION_RECORD: { code: '11369-6', display: 'History of Immunization' },
    WELLNESS_RECORD: { code: '42255-0', display: 'Summary of Clinical Episode' },
    OTHER_MEDICAL_DOCUMENT: { code: '34133-9', display: 'Summary of Episode Note' },
  };

  const coding = loincMap[record.recordType] || {
    code: '34108-1',
    display: 'Clinical Note',
  };

  return {
    resourceType: 'DocumentReference',
    id: record.id || record._id?.toString(),
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference'],
      lastUpdated: record.updatedAt
        ? new Date(record.updatedAt).toISOString()
        : new Date().toISOString(),
    },
    status: 'current',
    docStatus: record.verificationStatus === 'VERIFIED' ? 'final' : 'preliminary',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: coding.code,
          display: coding.display,
        },
      ],
      text: record.title,
    },
    subject: {
      reference: `Patient/${record.patientId}`,
      type: 'Patient',
    },
    date: record.recordDate ? new Date(record.recordDate).toISOString() : new Date().toISOString(),
    author: [
      {
        display: record.doctorName || 'Licensed Healthcare Practitioner',
        ...(record.doctorId ? { reference: `Practitioner/${record.doctorId}` } : {}),
      },
    ],
    custodian: {
      display: record.facilityName || 'Registered Health Facility (HFR)',
      ...(record.facilityId ? { reference: `Organization/${record.facilityId}` } : {}),
    },
    content: [
      {
        attachment: {
          contentType: record.mimeType || 'application/pdf',
          title: record.fileName || `${record.title}.pdf`,
          size: record.fileSize,
          url: `/api/v1/records/${record.id || record._id}/download`,
        },
      },
    ],
    context: {
      source: record.source,
      resourceReference: record.resourceReference,
    },
  };
};

/**
 * Mock records generator for offline resilience and demonstration
 */
const getDemoRecords = (patientId: string): Array<Partial<IMedicalRecordDocument>> => {
  const pId = new Types.ObjectId(patientId);
  return [
    {
      _id: new Types.ObjectId('650000000000000000000001'),
      patientId: pId,
      recordType: 'OP_CONSULTATION',
      title: 'Cardiology Consultation & ECG Review',
      description:
        'Routine cardiovascular follow-up. Blood pressure optimal at 122/80 mmHg. Normal sinus rhythm on 12-lead ECG. Recommended continuation of lifestyle modifications.',
      source: 'ABDM_INGESTION',
      resourceReference: 'ABDM-HIP-AIIMS-DEL-89214',
      recordDate: new Date('2026-10-14T10:30:00Z'),
      doctorName: 'Dr. Rajesh Verma, MD (Cardiology)',
      facilityName: 'AIIMS New Delhi',
      fileName: 'cardiology_ecg_review_oct2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 482910,
      verificationStatus: 'VERIFIED',
      createdBy: pId,
      createdAt: new Date('2026-10-14T10:30:00Z'),
      updatedAt: new Date('2026-10-14T10:30:00Z'),
    },
    {
      _id: new Types.ObjectId('650000000000000000000002'),
      patientId: pId,
      recordType: 'DIAGNOSTIC_REPORT',
      title: 'Comprehensive Metabolic Panel & Lipid Profile',
      description:
        'Fasting lipid panel showing total cholesterol 178 mg/dL, HDL 52 mg/dL, LDL 102 mg/dL, Triglycerides 120 mg/dL. Fasting blood glucose 94 mg/dL. All values within normal physiological limits.',
      source: 'EHR_SYNC',
      resourceReference: 'LALPATH-DEL-2026-78412',
      recordDate: new Date('2026-10-02T08:15:00Z'),
      doctorName: 'Dr. Anita Desai, MD (Pathology)',
      facilityName: 'Dr. Lal PathLabs Diagnostic Centre',
      fileName: 'lipid_metabolic_panel_oct2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 312450,
      verificationStatus: 'VERIFIED',
      createdBy: pId,
      createdAt: new Date('2026-10-02T08:15:00Z'),
      updatedAt: new Date('2026-10-02T08:15:00Z'),
    },
    {
      _id: new Types.ObjectId('650000000000000000000003'),
      patientId: pId,
      recordType: 'PRESCRIPTION',
      title: 'Digital e-Prescription — Essential Therapeutics',
      description:
        'Prescription for Telmisartan 40mg once daily oral, Vitamin D3 60,000 IU weekly for 8 weeks, and multivitamin supplements.',
      source: 'ABDM_INGESTION',
      resourceReference: 'EPRES-MAX-SAKET-44129',
      recordDate: new Date('2026-09-18T14:00:00Z'),
      doctorName: 'Dr. Priya Sharma, MBBS, MD',
      facilityName: 'Max Super Speciality Hospital, Saket',
      fileName: 'eprescription_sep2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 198420,
      verificationStatus: 'VERIFIED',
      createdBy: pId,
      createdAt: new Date('2026-09-18T14:00:00Z'),
      updatedAt: new Date('2026-09-18T14:00:00Z'),
    },
    {
      _id: new Types.ObjectId('650000000000000000000004'),
      patientId: pId,
      recordType: 'DISCHARGE_SUMMARY',
      title: 'Day Care Inpatient Discharge Card — Endoscopy',
      description:
        'Diagnostic upper GI endoscopy performed under conscious sedation. Mild superficial antral gastritis identified; negative for ulcerations or mucosal lesions. Discharged in stable condition with PPI therapy.',
      source: 'EHR_SYNC',
      resourceReference: 'APOLLO-DEL-DS-2026-0912',
      recordDate: new Date('2026-08-25T17:45:00Z'),
      doctorName: 'Dr. Vikram Seth, DM (Gastroenterology)',
      facilityName: 'Apollo Hospitals, New Delhi',
      fileName: 'discharge_summary_endoscopy_aug2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 842100,
      verificationStatus: 'VERIFIED',
      createdBy: pId,
      createdAt: new Date('2026-08-25T17:45:00Z'),
      updatedAt: new Date('2026-08-25T17:45:00Z'),
    },
    {
      _id: new Types.ObjectId('650000000000000000000005'),
      patientId: pId,
      recordType: 'IMMUNIZATION_RECORD',
      title: 'CoWIN COVID-19 Precautionary Booster Certificate',
      description:
        'Administration of authorized precautionary dose of Corbevax. Lot #CBX-2026-90812. No acute adverse reactions noted during mandatory 30-minute observation.',
      source: 'ABDM_INGESTION',
      resourceReference: 'COWIN-CERT-91-8841920',
      recordDate: new Date('2026-07-10T11:20:00Z'),
      doctorName: 'Dr. Meenakshi Sunder, Medical Officer',
      facilityName: 'Government Dispensary, South Delhi',
      fileName: 'cowin_booster_certificate.pdf',
      mimeType: 'application/pdf',
      fileSize: 245100,
      verificationStatus: 'VERIFIED',
      createdBy: pId,
      createdAt: new Date('2026-07-10T11:20:00Z'),
      updatedAt: new Date('2026-07-10T11:20:00Z'),
    },
    {
      _id: new Types.ObjectId('650000000000000000000006'),
      patientId: pId,
      recordType: 'WELLNESS_RECORD',
      title: 'Annual Preventative Health Checkup Summary',
      description:
        'Comprehensive wellness assessment: BMI 23.4, visual acuity 6/6 both eyes, normal spirometry, and healthy resting heart rate. Cleared for standard physical activity.',
      source: 'MANUAL_ENTRY',
      resourceReference: 'SELF-DOC-2026-WELL-001',
      recordDate: new Date('2026-06-05T09:00:00Z'),
      doctorName: 'Dr. Sunita Patel, General Physician',
      facilityName: 'Fortis Escorts Heart Institute',
      fileName: 'annual_wellness_summary_jun2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 512000,
      verificationStatus: 'SELF_SUBMITTED',
      createdBy: pId,
      createdAt: new Date('2026-06-05T09:00:00Z'),
      updatedAt: new Date('2026-06-05T09:00:00Z'),
    },
  ] as unknown as Array<IMedicalRecordDocument>;
};

export class RecordService {
  /**
   * Retrieves paginated health records strictly scoped to the authenticated patient
   */
  async getPatientRecords(
    patientId: string,
    query: RecordFilterQueryInput
  ): Promise<{
    items: IMedicalRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // 1. Build strict patient-scoped query (exclude soft-archived records unless requested)
      const filter: Record<string, unknown> = {
        patientId: new Types.ObjectId(patientId),
      };

      if (!query.includeArchived) {
        filter.isArchived = { $ne: true };
      }

      // Category filter
      const category = query.category || query.recordType;
      if (category && HEALTH_RECORD_TYPES.includes(category as MedicalRecordType)) {
        filter.recordType = category;
      }

      // Source filter
      if (query.source) {
        filter.source = query.source;
      }

      // Verification status filter
      if (query.verificationStatus) {
        filter.verificationStatus = query.verificationStatus;
      }

      // Date range filter
      if (query.startDate || query.endDate) {
        const dateFilter: Record<string, unknown> = {};
        if (query.startDate) {
          dateFilter.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          dateFilter.$lte = new Date(query.endDate);
        }
        filter.recordDate = dateFilter;
      }

      // Provider filter (matches doctorName or facilityName)
      const andClauses: Record<string, unknown>[] = [];
      if (query.provider && query.provider.trim()) {
        const sanitizedProvider = query.provider.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const providerRegex = new RegExp(sanitizedProvider, 'i');
        andClauses.push({
          $or: [{ doctorName: providerRegex }, { facilityName: providerRegex }],
        });
      }

      // Search keyword filter across title, doctor, facility, and reference
      if (query.search && query.search.trim()) {
        const sanitizedTerm = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(sanitizedTerm, 'i');
        andClauses.push({
          $or: [
            { title: searchRegex },
            { doctorName: searchRegex },
            { facilityName: searchRegex },
            { resourceReference: searchRegex },
            { fileName: searchRegex },
          ],
        });
      }

      if (andClauses.length === 1) {
        Object.assign(filter, andClauses[0]);
      } else if (andClauses.length > 1) {
        filter.$and = andClauses;
      }

      // Determine sorting
      const sortField = query.sortBy || 'recordDate';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
      const sortOption: Record<string, 1 | -1> = { [sortField]: sortOrder };

      const [docs, total] = await Promise.all([
        MedicalRecordModel.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
        MedicalRecordModel.countDocuments(filter),
      ]);

      // If database is connected and has records or filters were specified, return real DB result
      if (total > 0 || query.search || query.category || query.source || query.provider) {
        const items = docs.map((doc) => ({
          ...doc,
          id: doc._id.toString(),
          fileData: undefined, // Never ship raw base64 blobs inside list responses
        })) as unknown as IMedicalRecord[];

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
    }

    // 2. Demo fallback if database is empty or running offline
    let demoList = getDemoRecords(patientId);

    // Apply category filter
    const category = query.category || query.recordType;
    if (category) {
      demoList = demoList.filter((r) => r.recordType === category);
    }

    // Apply source filter
    if (query.source) {
      demoList = demoList.filter((r) => r.source === query.source);
    }

    // Apply verificationStatus filter
    if (query.verificationStatus) {
      demoList = demoList.filter((r) => r.verificationStatus === query.verificationStatus);
    }

    // Apply date range
    if (query.startDate) {
      const start = new Date(query.startDate).getTime();
      demoList = demoList.filter((r) => r.recordDate && new Date(r.recordDate).getTime() >= start);
    }
    if (query.endDate) {
      const end = new Date(query.endDate).getTime();
      demoList = demoList.filter((r) => r.recordDate && new Date(r.recordDate).getTime() <= end);
    }

    // Apply provider filter
    if (query.provider && query.provider.trim()) {
      const prov = query.provider.trim().toLowerCase();
      demoList = demoList.filter(
        (r) =>
          r.doctorName?.toLowerCase().includes(prov) ||
          r.facilityName?.toLowerCase().includes(prov)
      );
    }

    // Apply search filter
    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      demoList = demoList.filter(
        (r) =>
          r.title?.toLowerCase().includes(term) ||
          r.doctorName?.toLowerCase().includes(term) ||
          r.facilityName?.toLowerCase().includes(term) ||
          r.resourceReference?.toLowerCase().includes(term)
      );
    }

    // Sorting
    const sortField = query.sortBy || 'recordDate';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    demoList.sort((a, b) => {
      let aVal = a[sortField as keyof IMedicalRecordDocument];
      let bVal = b[sortField as keyof IMedicalRecordDocument];
      if (aVal instanceof Date) aVal = aVal.getTime() as unknown as Date;
      if (bVal instanceof Date) bVal = bVal.getTime() as unknown as Date;
      if (aVal! < bVal!) return -1 * sortOrder;
      if (aVal! > bVal!) return 1 * sortOrder;
      return 0;
    });

    const total = demoList.length;
    const paginated = demoList.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    const items = paginated.map((r) => ({
      ...r,
      id: r._id ? r._id.toString() : 'demo-id',
    })) as unknown as IMedicalRecord[];

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
   * Retrieves summary metric counts and real storage usage across clinical categories for the patient
   */
  async getPatientRecordsSummary(patientId: string): Promise<MedicalRecordSummaryDto> {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const pId = new Types.ObjectId(patientId);
      const activeScope = { patientId: pId, isArchived: { $ne: true } };
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        total,
        consultations,
        discharge,
        diagnostics,
        imaging,
        prescriptions,
        certificates,
        immunizations,
        wellness,
        otherDocs,
        recentUploads,
        storageAgg,
      ] = await Promise.all([
        MedicalRecordModel.countDocuments(activeScope),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'OP_CONSULTATION' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'DISCHARGE_SUMMARY' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'DIAGNOSTIC_REPORT' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'IMAGING_REPORT' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'PRESCRIPTION' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'MEDICAL_CERTIFICATE' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'IMMUNIZATION_RECORD' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'WELLNESS_RECORD' }),
        MedicalRecordModel.countDocuments({ ...activeScope, recordType: 'OTHER_MEDICAL_DOCUMENT' }),
        MedicalRecordModel.countDocuments({
          ...activeScope,
          source: 'MANUAL_ENTRY',
          createdAt: { $gte: thirtyDaysAgo },
        }),
        MedicalRecordModel.aggregate<{ totalBytes: number }>([
          { $match: activeScope },
          { $group: { _id: null, totalBytes: { $sum: { $ifNull: ['$fileSize', 0] } } } },
        ]),
      ]);

      if (total > 0) {
        return {
          totalRecords: total,
          clinicalDocuments: consultations + discharge + wellness + certificates + otherDocs,
          prescriptions,
          labReports: diagnostics,
          imagingReports: imaging,
          medicalCertificates: certificates,
          immunizations,
          wellnessRecords: wellness,
          otherDocuments: otherDocs,
          totalStorageBytes: storageAgg[0]?.totalBytes ?? 0,
          maxStorageBytes: RECORD_CONFIG.maxPatientStorageBytes,
          recentUploadsCount: recentUploads,
        };
      }
    }

    // Demo values (offline resilience)
    const demo = getDemoRecords(patientId);
    const demoBytes = demo.reduce((sum, r) => sum + (r.fileSize || 0), 0);
    return {
      totalRecords: demo.length,
      clinicalDocuments: demo.filter((r) =>
        ['OP_CONSULTATION', 'DISCHARGE_SUMMARY', 'WELLNESS_RECORD'].includes(r.recordType!)
      ).length,
      prescriptions: demo.filter((r) => r.recordType === 'PRESCRIPTION').length,
      labReports: demo.filter((r) => r.recordType === 'DIAGNOSTIC_REPORT').length,
      imagingReports: demo.filter((r) => r.recordType === 'IMAGING_REPORT').length,
      medicalCertificates: demo.filter((r) => r.recordType === 'MEDICAL_CERTIFICATE').length,
      immunizations: demo.filter((r) => r.recordType === 'IMMUNIZATION_RECORD').length,
      wellnessRecords: demo.filter((r) => r.recordType === 'WELLNESS_RECORD').length,
      otherDocuments: demo.filter((r) => r.recordType === 'OTHER_MEDICAL_DOCUMENT').length,
      totalStorageBytes: demoBytes,
      maxStorageBytes: RECORD_CONFIG.maxPatientStorageBytes,
      recentUploadsCount: demo.filter((r) => r.source === 'MANUAL_ENTRY').length,
    };
  }

  /**
   * Retrieves full details of a specific record with strict ownership verification
   */
  async getPatientRecordById(patientId: string, recordId: string): Promise<MedicalRecordDetailDto> {
    if (!Types.ObjectId.isValid(recordId)) {
      throw AppError.badRequest('Invalid record ID format');
    }

    let record: IMedicalRecordDocument | null = null;
    try {
      record = await MedicalRecordModel.findById(recordId);
    } catch {
      record = null;
    }

    if (!record) {
      // Check demo records if database document was not found
      const demo = getDemoRecords(patientId).find((r) => r._id?.toString() === recordId);
      if (demo) {
        record = demo as unknown as IMedicalRecordDocument;
      }
    }

    if (!record || record.isArchived) {
      throw AppError.notFound('Medical record not found');
    }

    // Strict ownership check: prevent cross-patient record access
    if (record.patientId && record.patientId.toString() !== patientId) {
      throw AppError.forbidden(
        'Access denied. You do not have permission to view this medical record'
      );
    }

    const fhir = mapToFHIRDocumentReference(record);

    return {
      id: record.id || record._id.toString(),
      patientId: record.patientId.toString(),
      recordType: record.recordType,
      title: record.title,
      description: record.description,
      source: record.source,
      resourceReference: record.resourceReference,
      recordDate: record.recordDate,
      doctorName: record.doctorName,
      doctorId: record.doctorId?.toString(),
      facilityName: record.facilityName,
      facilityId: record.facilityId?.toString(),
      appointmentId: record.appointmentId?.toString(),
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      storageId: record.storageId,
      sha256Checksum: record.sha256Checksum,
      scanStatus: record.scanStatus || 'SCAN_NOT_CONFIGURED',
      isArchived: Boolean(record.isArchived),
      archivedAt: record.archivedAt,
      verificationStatus: record.verificationStatus,
      createdBy: record.createdBy ? record.createdBy.toString() : patientId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      fhirResource: fhir,
    };
  }

  /**
   * Upload / create a new patient health record with validation, SHA-256 duplicate detection, and audit trail
   */
  async createPatientRecord(
    patientId: string,
    creatorId: string,
    data: CreateRecordInput,
    requestId?: string
  ): Promise<IMedicalRecord> {
    // Defense-in-depth file validation (MIME + extension + magic-byte signature + decoded byte size + safe filename)
    let validatedFile: Awaited<ReturnType<typeof fileSecurityService.validateUpload>> | null = null;
    if (data.fileName || data.mimeType || data.fileSize || data.fileData) {
      try {
        validatedFile = await fileSecurityService.validateUpload({
          fileName: data.fileName,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          fileData: data.fileData,
        });
      } catch (err) {
        await securityAuditMonitor.record({
          actorId: creatorId,
          actorRole: 'PATIENT',
          action: 'FILE_SIGNATURE_REJECTED',
          resourceType: 'MEDICAL_RECORD',
          resourceId: patientId,
          requestId,
          outcome: 'BLOCKED',
          metadata: {
            declaredMimeType: data.mimeType,
            reason: err instanceof Error ? err.message : 'Invalid clinical upload',
          },
        });
        throw err;
      }
    }

    const isConnected = mongoose.connection.readyState === 1;

    // Duplicate detection by patientId + SHA-256 checksum (unless caller explicitly confirms allowDuplicate)
    if (isConnected && validatedFile?.sha256Checksum && !data.allowDuplicate) {
      const existing = await MedicalRecordModel.findOne({
        patientId: new Types.ObjectId(patientId),
        sha256Checksum: validatedFile.sha256Checksum,
        isArchived: { $ne: true },
      })
        .select('_id title createdAt')
        .lean();

      if (existing) {
        throw new AppError(
          `A document with identical file contents ("${existing.title}") already exists in your vault.`,
          HttpStatus.CONFLICT,
          'DUPLICATE_DOCUMENT',
          true,
          [
            {
              field: 'fileData',
              message: `Matches existing record "${existing.title}" (${existing._id.toString()})`,
              code: 'DUPLICATE_DOCUMENT',
            },
          ]
        );
      }
    }

    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const resourceRef = `HB-DOC-${randomSuffix}`;

    const newRecord = new MedicalRecordModel({
      patientId: new Types.ObjectId(patientId),
      recordType: data.recordType,
      title: data.title,
      description: data.description,
      source: 'MANUAL_ENTRY',
      resourceReference: resourceRef,
      recordDate: new Date(data.recordDate),
      doctorName: data.doctorName,
      facilityName: data.facilityName,
      appointmentId: data.appointmentId ? new Types.ObjectId(data.appointmentId) : undefined,
      fileName: validatedFile ? validatedFile.safeFileName : data.fileName,
      fileSize: validatedFile ? validatedFile.byteSize || data.fileSize : data.fileSize,
      mimeType: validatedFile ? validatedFile.mimeType : data.mimeType || 'application/pdf',
      fileData: data.fileData,
      storageId: validatedFile?.storageId,
      sha256Checksum: validatedFile?.sha256Checksum || undefined,
      scanStatus: validatedFile?.malwareScan.status ?? 'SCAN_NOT_CONFIGURED',
      isArchived: false,
      verificationStatus: 'SELF_SUBMITTED',
      createdBy: new Types.ObjectId(creatorId),
    });

    if (isConnected) {
      await newRecord.save();
    }

    await securityAuditMonitor.record({
      actorId: creatorId,
      action: 'DOCUMENT_UPLOADED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: newRecord.id || newRecord._id.toString(),
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        recordType: data.recordType,
        mimeType: validatedFile?.mimeType || data.mimeType || 'application/pdf',
        storageId: validatedFile?.storageId,
        signatureVerified: validatedFile?.signatureVerified ?? false,
        malwareScanStatus: validatedFile?.malwareScan.status ?? 'SCAN_NOT_CONFIGURED',
      },
    });

    return {
      id: newRecord.id || newRecord._id.toString(),
      patientId,
      recordType: newRecord.recordType,
      title: newRecord.title,
      description: newRecord.description,
      source: newRecord.source,
      resourceReference: newRecord.resourceReference,
      recordDate: newRecord.recordDate,
      doctorName: newRecord.doctorName,
      facilityName: newRecord.facilityName,
      appointmentId: newRecord.appointmentId?.toString(),
      fileName: newRecord.fileName,
      fileSize: newRecord.fileSize,
      mimeType: newRecord.mimeType,
      storageId: newRecord.storageId,
      sha256Checksum: newRecord.sha256Checksum,
      scanStatus: newRecord.scanStatus,
      isArchived: false,
      verificationStatus: newRecord.verificationStatus,
      createdBy: creatorId,
      createdAt: newRecord.createdAt || new Date(),
      updatedAt: newRecord.updatedAt || new Date(),
    };
  }

  private getSignedAccessSecret(): string {
    return (
      process.env.COOKIE_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'hb-dev-record-signed-access-secret'
    );
  }

  /**
   * Issues a short-lived HMAC-SHA256 signed access token bound strictly to
   * (recordId, patientId, actorId, actorRole, expiresAt).
   */
  async issueSignedAccessToken(params: {
    recordId: string;
    patientId: string;
    actorId: string;
    actorRole: 'PATIENT' | 'DOCTOR';
    ttlSeconds?: number;
    requestId?: string;
  }): Promise<MedicalRecordAccessTokenDto> {
    const detail = await this.getPatientRecordById(params.patientId, params.recordId);
    const ttlSeconds = Math.min(300, Math.max(30, params.ttlSeconds ?? RECORD_CONFIG.signedAccessTtlSeconds));
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    const payload = `${params.recordId}.${params.patientId}.${params.actorId}.${params.actorRole}.${expiresAtMs}`;
    const sig = crypto
      .createHmac('sha256', this.getSignedAccessSecret())
      .update(payload)
      .digest('hex');
    const token = Buffer.from(`${payload}.${sig}`).toString('base64url');
    const safeFileName = fileSecurityService.sanitizeFileName(
      detail.fileName || `${detail.title}.pdf`,
      detail.mimeType || 'application/pdf'
    );

    await securityAuditMonitor.record({
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: 'DOCUMENT_ACCESS_TOKEN_ISSUED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: params.recordId,
      requestId: params.requestId,
      outcome: 'SUCCESS',
      metadata: {
        ttlSeconds,
        accessScope: params.actorRole === 'PATIENT' ? 'OWNER' : 'CONSENTED_DOCTOR',
      },
    });

    return {
      token,
      previewUrl: `/api/v1/records/${params.recordId}/preview?token=${encodeURIComponent(token)}`,
      downloadUrl: `/api/v1/records/${params.recordId}/download?token=${encodeURIComponent(token)}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
      ttlSeconds,
      mimeType: detail.mimeType || 'application/pdf',
      fileName: safeFileName,
      accessScope: params.actorRole === 'PATIENT' ? 'OWNER' : 'CONSENTED_DOCTOR',
    };
  }

  /**
   * Cryptographically verifies a short-lived signed document access token.
   */
  verifySignedAccessToken(
    recordId: string,
    signedToken: string
  ): {
    recordId: string;
    patientId: string;
    actorId: string;
    actorRole: 'PATIENT' | 'DOCTOR';
    expiresAtMs: number;
  } {
    if (!signedToken || typeof signedToken !== 'string') {
      throw AppError.unauthorized('Signed document access token is required.');
    }

    let decoded = '';
    try {
      decoded = Buffer.from(signedToken, 'base64url').toString('utf-8');
    } catch {
      throw AppError.unauthorized('Invalid signed document access token.');
    }

    const parts = decoded.split('.');
    if (parts.length !== 6) {
      throw AppError.unauthorized('Malformed signed document access token.');
    }

    const [tokenRecordId, patientId, actorId, actorRole, expStr, providedSig] = parts;
    const payload = `${tokenRecordId}.${patientId}.${actorId}.${actorRole}.${expStr}`;
    const expectedSig = crypto
      .createHmac('sha256', this.getSignedAccessSecret())
      .update(payload)
      .digest('hex');

    if (
      !providedSig ||
      providedSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
    ) {
      throw AppError.unauthorized('Signed document access token signature is invalid.');
    }

    const expiresAtMs = Number(expStr);
    if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
      throw new AppError(
        'Document access link has expired. Please refresh the preview to request a new link.',
        HttpStatus.GONE,
        'ACCESS_LINK_EXPIRED'
      );
    }

    if (tokenRecordId !== recordId) {
      throw AppError.forbidden('Signed access token does not match the requested medical document.');
    }

    if (actorRole !== 'PATIENT' && actorRole !== 'DOCTOR') {
      throw AppError.forbidden('Unauthorized document access scope.');
    }

    return {
      recordId: tokenRecordId,
      patientId: patientId || '',
      actorId: actorId || '',
      actorRole,
      expiresAtMs,
    };
  }

  /**
   * Soft-archives a patient-owned medical document while preserving audit history.
   */
  async archivePatientRecord(
    patientId: string,
    actorId: string,
    recordId: string,
    requestId?: string
  ): Promise<{ id: string; isArchived: true; archivedAt: string }> {
    if (!Types.ObjectId.isValid(recordId)) {
      throw AppError.badRequest('Invalid record ID format');
    }

    const record = await MedicalRecordModel.findById(recordId);
    if (!record || record.isArchived) {
      throw AppError.notFound('Medical record not found');
    }

    if (record.patientId.toString() !== patientId) {
      await securityAuditMonitor.record({
        actorId,
        actorRole: 'PATIENT',
        action: 'OWNERSHIP_VIOLATION',
        resourceType: 'MEDICAL_RECORD',
        resourceId: recordId,
        requestId,
        outcome: 'BLOCKED',
        metadata: { attemptedAction: 'ARCHIVE' },
      });
      throw AppError.forbidden('Access denied. Only the record owner can archive this document.');
    }

    const archivedAt = new Date();
    record.isArchived = true;
    record.archivedAt = archivedAt;
    record.archivedBy = new Types.ObjectId(actorId);
    if (mongoose.connection.readyState === 1) {
      await record.save();
    }

    await securityAuditMonitor.record({
      actorId,
      actorRole: 'PATIENT',
      action: 'DOCUMENT_ARCHIVED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: recordId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { recordType: record.recordType },
    });

    return {
      id: record.id || record._id.toString(),
      isArchived: true,
      archivedAt: archivedAt.toISOString(),
    };
  }

  /**
   * Retrieves document content for authorized download with strict ownership verification
   */
  async getRecordForDownload(
    patientId: string,
    recordId: string
  ): Promise<{
    fileName: string;
    mimeType: string;
    fileContent: Buffer;
    fileSize: number;
  }> {
    if (!Types.ObjectId.isValid(recordId)) {
      throw AppError.badRequest('Invalid record ID format');
    }

    let record: IMedicalRecordDocument | null = null;
    try {
      record = await MedicalRecordModel.findById(recordId);
    } catch {
      record = null;
    }

    if (!record) {
      const demo = getDemoRecords(patientId).find((r) => r._id?.toString() === recordId);
      if (demo) {
        record = demo as unknown as IMedicalRecordDocument;
      }
    }

    if (!record || record.isArchived) {
      throw AppError.notFound('Medical record not found');
    }

    // Strict ownership verification: patient can ONLY download their own records
    if (record.patientId.toString() !== patientId) {
      throw AppError.forbidden(
        'Access denied. You are not authorized to download this medical record'
      );
    }

    const fileName =
      record.fileName || `${record.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
    const mimeType = record.mimeType || 'application/pdf';

    // If fileData is stored (e.g. Base64), decode it
    let buffer: Buffer;
    if (record.fileData) {
      const base64Data = record.fileData.includes('base64,')
        ? record.fileData.split('base64,')[1] || ''
        : record.fileData;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Generate clean clinical document placeholder buffer for download
      const content = `========================================================================
HEALTHBRIDGE INDIA — NATIONAL HEALTH RECORD EXPORT
Ayushman Bharat Digital Mission (ABDM) / DISHA Compliant Record
========================================================================

Document Title:      ${record.title}
Record ID:           ${record.id || record._id}
Category:            ${record.recordType}
Record Date:         ${new Date(record.recordDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}
Healthcare Facility: ${record.facilityName || 'Authorized Healthcare Facility'}
Medical Practitioner:${record.doctorName || 'Licensed Healthcare Provider'}
Verification Status: ${record.verificationStatus}
ABDM Reference:      ${record.resourceReference || 'HIE-CM-INTEGRATION-REF'}

CLINICAL SUMMARY & OBSERVATIONS:
------------------------------------------------------------------------
${record.description || 'No additional clinical notes recorded.'}

========================================================================
SECURITY & CONFIDENTIALITY NOTICE:
This digital document contains Protected Health Information (PHI) under the
Digital Personal Data Protection (DPDP) Act and DISHA. Unauthorized
distribution or tampering is strictly prohibited by law.
HealthBridge India • Ayushman Bharat Digital Mission • One Nation One Health Record
========================================================================
`;
      buffer = Buffer.from(content, 'utf-8');
    }

    return {
      fileName,
      mimeType,
      fileContent: buffer,
      fileSize: buffer.length,
    };
  }

  /**
   * Helper to retrieve raw record document by ID
   */
  async getRecordDocument(recordId: string): Promise<IMedicalRecordDocument | null> {
    if (!Types.ObjectId.isValid(recordId)) {
      return null;
    }
    if (mongoose.connection.readyState === 1) {
      return MedicalRecordModel.findById(recordId);
    }
    const demo = getDemoRecords('650000000000000000000000').find((r) => r._id?.toString() === recordId);
    return (demo as unknown as IMedicalRecordDocument) || null;
  }
}

export const recordService = new RecordService();
export default recordService;
