import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  DoctorProfileModel,
  PatientProfileModel,
  AppointmentModel,
  EncounterModel,
  PrescriptionModel,
  LaboratoryReportModel,
  MedicalRecordModel,
  ConsentRequestModel,
  ConsentArtifactModel,
  FacilityModel,
  AuditLogModel,
} from '../../src/database/models';

describe('Doctor Patient Management & Clinical History Integration Tests', () => {
  const app = createApp();

  const doctorUserId = new Types.ObjectId().toString();
  const doctorProfileId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const unauthorizedPatientId = new Types.ObjectId().toString();
  const facilityId = new Types.ObjectId().toString();
  const encounterId = new Types.ObjectId().toString();
  const prescriptionId = new Types.ObjectId().toString();
  const labReportId = new Types.ObjectId().toString();
  const medicalRecordId = new Types.ObjectId().toString();
  const appointmentId = new Types.ObjectId().toString();

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.mehta@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.priya@healthbridge.in',
  } as any);

  const mockDoctorUserDoc = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Sunita Mehta',
    email: 'dr.mehta@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockFacilityDoc = {
    _id: new Types.ObjectId(facilityId),
    id: facilityId,
    name: 'Apollo Indraprastha Hospital',
    facilityType: 'HOSPITAL',
    city: 'New Delhi',
  };

  const mockDoctorProfileDoc = {
    _id: new Types.ObjectId(doctorProfileId),
    userId: new Types.ObjectId(doctorUserId),
    specialization: ['Endocrinology', 'Internal Medicine'],
    registrationNumber: 'DMC-45678',
    verificationStatus: 'VERIFIED',
    facilityId: mockFacilityDoc,
  };

  const mockPatientUserDoc = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Priya Sharma',
    email: 'patient.priya@healthbridge.in',
    phone: '9876512345',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPatientProfileDoc = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(patientUserId),
    dateOfBirth: new Date('1992-05-15'),
    gender: 'FEMALE',
    bloodGroup: 'B+',
    abhaAddress: 'priya.sharma@abdm',
    abhaNumber: '91-1234-5678-9012',
    address: {
      line1: 'B-42 Defence Colony',
      city: 'New Delhi',
      district: 'South Delhi',
      state: 'Delhi',
      postalCode: '110024',
    },
    emergencyContact: {
      name: 'Rohan Sharma',
      relationship: 'Spouse',
      phone: '9876599999',
    },
  };

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      skip: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      select: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    };
    return q;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1 as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

    // Default Doctor User and Profile mocks
    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) => {
      if (id?.toString() === doctorUserId) return createQueryMock(mockDoctorUserDoc);
      if (id?.toString() === patientUserId) return createQueryMock(mockPatientUserDoc);
      return createQueryMock(null);
    });

    vi.spyOn(UserModel, 'findOne').mockImplementation((query: any) => {
      if (query?._id?.toString() === patientUserId || query?._id?.equals?.(new Types.ObjectId(patientUserId))) {
        return createQueryMock(mockPatientUserDoc);
      }
      return createQueryMock(null);
    });

    vi.spyOn(DoctorProfileModel, 'findOne').mockImplementation(() => createQueryMock(mockDoctorProfileDoc));
    vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(ConsentRequestModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);
    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);
  });

  describe('RBAC & Fail-Closed Endpoint Security', () => {
    it('rejects unauthenticated requests to patient directory with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/doctors/patients');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects PATIENT role from accessing doctor patient management endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/patients')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects malformed patient ObjectId parameters with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/patients/not-a-valid-objectid')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/doctors/patients (Patient Directory)', () => {
    it('returns authorized patients roster with pagination and summary counts', async () => {
      // Mock authorized distinct patient IDs
      vi.spyOn(AppointmentModel, 'distinct').mockImplementation((field: string) => {
        if (field === 'patientId') return Promise.resolve([new Types.ObjectId(patientUserId)]) as any;
        return Promise.resolve([]) as any;
      });
      vi.spyOn(EncounterModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(ConsentArtifactModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(ConsentRequestModel, 'distinct').mockResolvedValue([]);

      vi.spyOn(UserModel, 'find').mockImplementation(() => createQueryMock([mockPatientUserDoc]));
      vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientProfileDoc));
      vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(2);
      vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => createQueryMock(null));

      const res = await request(app)
        .get('/api/v1/doctors/patients?page=1&limit=10')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].patientId).toBe(patientUserId);
      expect(res.body.data[0].name).toBe('Priya Sharma');
      expect(res.body.data[0].patientReference).toContain('PAT-');
      expect(res.body.meta.total).toBe(1);
    });

    it('returns empty directory when doctor has no assigned patients', async () => {
      vi.spyOn(AppointmentModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(EncounterModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(ConsentArtifactModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(ConsentRequestModel, 'distinct').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/doctors/patients')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('filters patient directory by search term matching name or contact', async () => {
      vi.spyOn(AppointmentModel, 'distinct').mockResolvedValue([new Types.ObjectId(patientUserId)] as any);
      vi.spyOn(EncounterModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(ConsentArtifactModel, 'distinct').mockResolvedValue([]);
      vi.spyOn(ConsentRequestModel, 'distinct').mockResolvedValue([]);

      vi.spyOn(UserModel, 'find').mockImplementation(() => createQueryMock([mockPatientUserDoc]));
      vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientProfileDoc));
      vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => createQueryMock(null));

      const res = await request(app)
        .get('/api/v1/doctors/patients?search=Priya')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Priya Sharma');
    });
  });

  describe('GET /api/v1/doctors/patients/:patientId (Patient Profile Overview)', () => {
    it('returns 404 when patient record does not exist in the database', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(null));

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${nonExistentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('fails closed: returns CONSENT_REQUIRED with masked clinical summary when doctor lacks prior care relationship or consent', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientProfileDoc));

      // No active consents, no encounters, no appointments
      vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(ConsentRequestModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${unauthorizedPatientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessStatus).toBe('CONSENT_REQUIRED');
      // Clinical summary must be empty / masked
      expect(res.body.data.clinicalSummary.currentMedications).toEqual([]);
      expect(res.body.data.clinicalSummary.recentEncounters).toEqual([]);
      expect(res.body.data.patient.name).toBe('Priya Sharma');
    });

    it('returns full authorized clinical summary, vitals, active medications, diagnoses when access is authorized', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientProfileDoc));

      // Active consent artifact granted
      vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() =>
        createQueryMock({
          _id: new Types.ObjectId(),
          approvedAt: new Date(),
          validityPeriod: { to: new Date(Date.now() + 86400000) },
          permittedDataTypes: ['PRESCRIPTIONS', 'DISCHARGE_SUMMARY'],
          purpose: 'CAREMGT',
        })
      );

      // Clinical history collections
      const mockEncounter = {
        _id: new Types.ObjectId(encounterId),
        encounterReference: 'ENC-TEST01',
        encounterType: 'AMBULATORY',
        startTime: new Date(),
        status: 'COMPLETED',
        chiefComplaint: 'Type 2 Diabetes follow up',
        diagnoses: [{ name: 'Type 2 Diabetes Mellitus', code: 'E11.9', type: 'PRIMARY' }],
        vitals: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          heartRate: 72,
          bmi: 22.5,
          recordedAt: new Date(),
        },
        practitionerId: { name: 'Sunita Mehta' },
        facilityId: { name: 'Apollo Hospital' },
      };

      const mockPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-202611-001',
        status: 'ACTIVE',
        issuedAt: new Date(),
        doctorId: { name: 'Sunita Mehta' },
        medications: [
          { name: 'Metformin 500mg', dosage: '500mg', frequency: 'BID', duration: '30 days' },
        ],
      };

      const mockLabReport = {
        _id: new Types.ObjectId(labReportId),
        reportNumber: 'LAB-202611-001',
        testName: 'HbA1c Glycated Hemoglobin',
        publishedAt: new Date(),
        status: 'COMPLETED',
        laboratoryId: { name: 'Apollo Diagnostics' },
        observations: [{ testName: 'HbA1c', value: '6.4', unit: '%' }],
      };

      vi.spyOn(EncounterModel, 'find').mockImplementation(() => createQueryMock([mockEncounter]));
      vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([mockPrescription]));
      vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() => createQueryMock([mockLabReport]));
      vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => createQueryMock(mockEncounter));

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessStatus).toBe('GRANTED');
      expect(res.body.data.clinicalSummary.currentMedications.length).toBe(1);
      expect(res.body.data.clinicalSummary.currentMedications[0].name).toBe('Metformin 500mg');
      expect(res.body.data.clinicalSummary.pastDiagnoses.length).toBe(1);
      expect(res.body.data.clinicalSummary.pastDiagnoses[0].name).toBe('Type 2 Diabetes Mellitus');
      expect(res.body.data.clinicalSummary.vitalSigns?.bloodPressure).toBe('120/80 mmHg');
      expect(res.body.data.clinicalSummary.recentLabReports.length).toBe(1);
    });
  });

  describe('GET /api/v1/doctors/patients/:patientId/history (Timeline History)', () => {
    it('rejects access to chronological timeline if clinical authorization is missing with 403 Forbidden', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(ConsentRequestModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${unauthorizedPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('aggregates encounters, prescriptions, lab reports, medical records and appointments into chronological timeline', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

      const now = new Date();
      const mockEnc = {
        _id: new Types.ObjectId(encounterId),
        startTime: new Date(now.getTime() - 10000),
        encounterType: 'AMBULATORY',
        chiefComplaint: 'Regular checkup',
        status: 'COMPLETED',
        practitionerId: { name: 'Sunita Mehta' },
        facilityId: { name: 'Apollo Clinic' },
      };

      const mockRx = {
        _id: new Types.ObjectId(prescriptionId),
        issuedAt: new Date(now.getTime() - 5000),
        status: 'ACTIVE',
        doctorId: { name: 'Sunita Mehta' },
        facilityId: { name: 'Apollo Clinic' },
        medications: [{ name: 'Paracetamol 650mg' }],
      };

      vi.spyOn(EncounterModel, 'find').mockImplementation(() => createQueryMock([mockEnc]));
      vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([mockRx]));
      vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() => createQueryMock([]));
      vi.spyOn(MedicalRecordModel, 'find').mockImplementation(() => createQueryMock([]));
      vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      // Newest first
      expect(res.body.data[0].category).toBe('PRESCRIPTION');
      expect(res.body.data[1].category).toBe('ENCOUNTER');
      expect(res.body.meta.total).toBe(2);
    });

    it('filters timeline history by category (e.g. category=ENCOUNTER)', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

      const mockEnc = {
        _id: new Types.ObjectId(encounterId),
        startTime: new Date(),
        encounterType: 'AMBULATORY',
        chiefComplaint: 'Follow up',
        status: 'COMPLETED',
        practitionerId: { name: 'Sunita Mehta' },
      };

      const mockRx = {
        _id: new Types.ObjectId(prescriptionId),
        issuedAt: new Date(),
        status: 'ACTIVE',
        doctorId: { name: 'Sunita Mehta' },
        medications: [{ name: 'Amlodipine 5mg' }],
      };

      vi.spyOn(EncounterModel, 'find').mockImplementation(() => createQueryMock([mockEnc]));
      vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([mockRx]));
      vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() => createQueryMock([]));
      vi.spyOn(MedicalRecordModel, 'find').mockImplementation(() => createQueryMock([]));
      vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/history?category=ENCOUNTER`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('ENCOUNTER');
    });
  });

  describe('GET /api/v1/doctors/patients/:patientId/records (Medical Records)', () => {
    it('returns authorized medical records for the patient with pagination', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

      const mockRecord = {
        _id: new Types.ObjectId(medicalRecordId),
        title: 'Discharge Summary - Cardiac Care',
        recordType: 'DISCHARGE_SUMMARY',
        recordDate: new Date(),
        source: 'CLINIC_UPLOAD',
        doctorName: 'Dr. Sunita Mehta',
        verificationStatus: 'VERIFIED',
      };

      vi.spyOn(MedicalRecordModel, 'find').mockImplementation(() => createQueryMock([mockRecord]));
      vi.spyOn(MedicalRecordModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/records`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Discharge Summary - Cardiac Care');
      expect(res.body.data[0].recordType).toBe('DISCHARGE_SUMMARY');
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('GET /api/v1/doctors/patients/:patientId/encounters (Consultation History)', () => {
    it('returns consultation encounters and flags treating doctor ownership', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

      const mockEnc = {
        _id: new Types.ObjectId(encounterId),
        encounterReference: 'ENC-TEST01',
        encounterType: 'AMBULATORY',
        startTime: new Date(),
        status: 'COMPLETED',
        isDraft: false,
        practitionerId: { _id: new Types.ObjectId(doctorUserId), name: 'Sunita Mehta' },
        chiefComplaint: 'Quarterly review',
        diagnoses: [{ name: 'Hypertension', code: 'I10', type: 'PRIMARY' }],
      };

      vi.spyOn(EncounterModel, 'find').mockImplementation(() => createQueryMock([mockEnc]));
      vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/encounters`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].encounterReference).toContain('ENC-');
      expect(res.body.data[0].isOwner).toBe(true);
      expect(res.body.data[0].treatingDoctor.name).toContain('Sunita Mehta');
    });
  });

  describe('GET /api/v1/doctors/patients/:patientId/prescriptions (Prescription History)', () => {
    it('returns prescriptions for patient with medications details and ownership flag', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

      const mockRx = {
        _id: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-202611-TEST',
        status: 'ACTIVE',
        isDraft: false,
        issuedAt: new Date(),
        doctorId: { _id: new Types.ObjectId(doctorUserId), name: 'Sunita Mehta' },
        diagnosis: 'Essential Hypertension',
        medications: [{ name: 'Telmisartan 40mg', dosage: '40mg', frequency: 'QD', duration: '30 days' }],
      };

      vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([mockRx]));
      vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/prescriptions`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].prescriptionNumber).toBe('RX-202611-TEST');
      expect(res.body.data[0].isOwner).toBe(true);
      expect(res.body.data[0].medications[0].name).toBe('Telmisartan 40mg');
    });
  });

  describe('GET /api/v1/doctors/patients/:patientId/lab-reports (Laboratory Reports)', () => {
    it('returns diagnostic laboratory reports with observations and reference ranges', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

      const mockLab = {
        _id: new Types.ObjectId(labReportId),
        reportNumber: 'LAB-202611-002',
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        testDate: new Date(),
        publishedAt: new Date(),
        status: 'COMPLETED',
        laboratoryId: { _id: new Types.ObjectId(), name: 'Apollo Clinical Lab' },
        observations: [
          { testName: 'Total Cholesterol', value: '185', unit: 'mg/dL', referenceRange: '< 200 mg/dL', interpretation: 'NORMAL' },
          { testName: 'Triglycerides', value: '140', unit: 'mg/dL', referenceRange: '< 150 mg/dL', interpretation: 'NORMAL' },
        ],
      };

      vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() => createQueryMock([mockLab]));
      vi.spyOn(LaboratoryReportModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/lab-reports`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reportNumber).toBe('LAB-202611-002');
      expect(res.body.data[0].observations.length).toBe(2);
      expect(res.body.data[0].observations[0].referenceRange).toBe('< 200 mg/dL');
    });
  });

  describe('POST /api/v1/doctors/patients/:patientId/consent-requests (ABDM Consent Request)', () => {
    it('creates a pending electronic consent request and dispatches to patient', async () => {
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(mockPatientUserDoc));

      const mockCreatedConsent = {
        _id: new Types.ObjectId(),
        patientId: new Types.ObjectId(patientUserId),
        requesterId: new Types.ObjectId(doctorUserId),
        purpose: 'CAREMGT',
        purposeDescription: 'Consultation and medication review',
        requestedDataTypes: ['OP_CONSULTATION', 'PRESCRIPTION', 'LAB_REPORT'],
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86400000),
        status: 'REQUESTED',
      };

      vi.spyOn(ConsentRequestModel, 'create').mockResolvedValue(mockCreatedConsent as any);

      const res = await request(app)
        .post(`/api/v1/doctors/patients/${patientUserId}/consent-requests`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          purpose: 'CAREMGT',
          purposeDescription: 'Consultation and medication review',
          requestedDataTypes: ['OP_CONSULTATION', 'PRESCRIPTION', 'LAB_REPORT'],
          durationDays: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REQUESTED');
      expect(res.body.data.purpose).toBe('CAREMGT');
      expect(res.body.data.requestedDataTypes).toEqual(['OP_CONSULTATION', 'PRESCRIPTION', 'LAB_REPORT']);
    });

    it('rejects consent request creation when required fields are missing with 422', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/patients/${patientUserId}/consent-requests`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          // missing purpose and requestedDataTypes
          durationDays: 30,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });
});
