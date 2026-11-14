import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  DoctorProfileModel,
  PatientProfileModel,
  EncounterModel,
  AppointmentModel,
  PrescriptionModel,
  MedicationCatalogModel,
  ConsentArtifactModel,
  ConsentRequestModel,
  FacilityModel,
  AuditLogModel,
} from '../../src/database/models';

describe('Doctor E-Prescription & Medication Management Integration Tests', () => {
  const app = createApp();

  const doctorUserId = new Types.ObjectId().toString();
  const doctorProfileId = new Types.ObjectId().toString();
  const otherDoctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const facilityId = new Types.ObjectId().toString();
  const encounterId = new Types.ObjectId().toString();
  const prescriptionId = new Types.ObjectId().toString();
  const medicationCatalogId = new Types.ObjectId().toString();

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.sharma@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.aarav@healthbridge.in',
  } as any);

  const mockDoctorUserDoc = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockFacilityDoc = {
    _id: new Types.ObjectId(facilityId),
    id: facilityId,
    name: 'All India Institute of Medical Sciences (AIIMS)',
    facilityType: 'HOSPITAL',
    address: 'Ansari Nagar East',
    city: 'New Delhi',
  };

  const mockDoctorProfileDoc = {
    _id: new Types.ObjectId(doctorProfileId),
    userId: new Types.ObjectId(doctorUserId),
    specialization: ['Cardiology', 'Internal Medicine'],
    registrationNumber: 'MCI-12345-DELHI',
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: mockFacilityDoc,
  };

  const mockPatientUserDoc = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9876500000',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPatientProfileDoc = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(patientUserId),
    gender: 'MALE',
    dateOfBirth: new Date('1990-01-01'),
    bloodGroup: 'O_POSITIVE',
    abhaAddress: 'aarav.patel@abdm',
  };

  const mockMedicationCatalogDoc = {
    _id: new Types.ObjectId(medicationCatalogId),
    id: medicationCatalogId,
    name: 'Paracetamol 500mg Tablet (Crocin)',
    brandName: 'Crocin',
    genericName: 'Paracetamol',
    dosageForm: 'TABLET',
    strength: '500 mg',
    route: 'Oral',
    manufacturer: 'GlaxoSmithKline',
    packageSize: 'Strip of 15 tablets',
    schedule: 'OTC',
    therapeuticClass: 'Analgesic & Antipyretic',
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take after food with water',
    isActive: true,
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

  let mockPrescriptionDoc: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1 as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

    mockPrescriptionDoc = {
      _id: new Types.ObjectId(prescriptionId),
      id: prescriptionId,
      prescriptionNumber: 'RX-202611-TEST01',
      patientId: new Types.ObjectId(patientUserId),
      doctorId: new Types.ObjectId(doctorUserId),
      encounterId: new Types.ObjectId(encounterId),
      facilityId: new Types.ObjectId(facilityId),
      diagnosis: 'Atypical chest discomfort, Essential hypertension',
      instructions: 'Take medications strictly after meals with water.',
      followUpInstructions: 'Review in OPD after 14 days with BP log.',
      validUntil: new Date(Date.now() + 30 * 86400000),
      status: 'DRAFT',
      isDraft: true,
      version: 1,
      medications: [
        {
          _id: new Types.ObjectId(),
          medicationCatalogId: new Types.ObjectId(medicationCatalogId),
          name: 'Paracetamol 500mg Tablet (Crocin)',
          genericName: 'Paracetamol',
          brandName: 'Crocin',
          strength: '500 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '1-0-1 (Twice daily after meals)',
          duration: '5 days',
          quantity: 10,
          instructions: 'Take with warm water after food',
          status: 'ACTIVE',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    // User lookup
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUserDoc);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUserDoc);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(UserModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter?._id?.toString?.() || filter?._id;
      if (uId === patientUserId) return createQueryMock(mockPatientUserDoc);
      return createQueryMock(null);
    }) as any);

    // Doctor profile lookup
    vi.spyOn(DoctorProfileModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter?.userId?.toString?.() || filter?.userId;
      if (uId === doctorUserId) return createQueryMock(mockDoctorProfileDoc);
      return createQueryMock(null);
    }) as any);

    // Patient profile lookup
    vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() =>
      createQueryMock(mockPatientProfileDoc)
    );

    // Facility lookup
    vi.spyOn(FacilityModel, 'findById').mockImplementation(() =>
      createQueryMock(mockFacilityDoc)
    );

    // Default PrescriptionModel mocks
    vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(PrescriptionModel, 'findOne').mockImplementation(() => {
      const populated = {
        ...mockPrescriptionDoc,
        patientId: mockPatientUserDoc,
        doctorId: mockDoctorUserDoc,
        facilityId: mockFacilityDoc,
      };
      const q: any = {
        populate: vi.fn().mockImplementation(() => q),
        sort: vi.fn().mockImplementation(() => q),
        skip: vi.fn().mockImplementation(() => q),
        limit: vi.fn().mockImplementation(() => q),
        select: vi.fn().mockImplementation(() => q),
        lean: vi.fn().mockImplementation(() => Promise.resolve(populated)),
        then: (resolve: any, reject: any) => Promise.resolve(mockPrescriptionDoc).then(resolve, reject),
      };
      return q;
    });
    vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(1);

    // EncounterModel mocks
    vi.spyOn(EncounterModel, 'findById').mockImplementation(() =>
      createQueryMock({
        _id: new Types.ObjectId(encounterId),
        facilityId: new Types.ObjectId(facilityId),
      })
    );
    vi.spyOn(EncounterModel, 'findOne').mockResolvedValue({
      _id: new Types.ObjectId(encounterId),
      practitionerId: new Types.ObjectId(doctorUserId),
      patientId: new Types.ObjectId(patientUserId),
      facilityId: new Types.ObjectId(facilityId),
    } as any);
    vi.spyOn(EncounterModel, 'findByIdAndUpdate').mockResolvedValue({} as any);
    vi.spyOn(EncounterModel, 'exists').mockResolvedValue(true as any);

    // AppointmentModel mocks
    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

    // Consent models
    vi.spyOn(ConsentArtifactModel, 'findOne').mockResolvedValue({
      consentStatus: 'ACTIVE',
      validityPeriod: { to: new Date(Date.now() + 86400000) },
    } as any);
    vi.spyOn(ConsentRequestModel, 'findOne').mockResolvedValue(null);

    // Medication catalog mocks
    vi.spyOn(MedicationCatalogModel, 'countDocuments').mockResolvedValue(20);
    vi.spyOn(MedicationCatalogModel, 'find').mockImplementation(() =>
      createQueryMock([mockMedicationCatalogDoc])
    );
    vi.spyOn(MedicationCatalogModel, 'findById').mockImplementation(() =>
      createQueryMock(mockMedicationCatalogDoc)
    );
  });

  /* ==========================================================================
     1. RBAC & ROUTE PROTECTION
     ========================================================================== */
  describe('RBAC & Security Protection', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const endpoints = [
        '/api/v1/doctors/prescriptions/summary',
        '/api/v1/doctors/prescriptions',
        `/api/v1/doctors/prescriptions/${prescriptionId}`,
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });

    it('rejects PATIENT users from doctor prescription endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/prescriptions/summary')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('forbidden');
    });

    it('rejects invalid ObjectId parameters with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/prescriptions/invalid-rx-id')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. GET /api/v1/doctors/prescriptions/summary
     ========================================================================== */
  describe('GET /api/v1/doctors/prescriptions/summary', () => {
    it('returns aggregated metrics: total, issued, draft, recent', async () => {
      vi.spyOn(PrescriptionModel, 'countDocuments')
        .mockResolvedValueOnce(12) // total
        .mockResolvedValueOnce(9)  // issued
        .mockResolvedValueOnce(3)  // draft
        .mockResolvedValueOnce(5); // recent

      const res = await request(app)
        .get('/api/v1/doctors/prescriptions/summary')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        total: 12,
        issued: 9,
        draft: 3,
        recent: 5,
      });
    });
  });

  /* ==========================================================================
     3. GET /api/v1/doctors/prescriptions
     ========================================================================== */
  describe('GET /api/v1/doctors/prescriptions', () => {
    it('returns paginated prescriptions with populated patient and facility data', async () => {
      vi.spyOn(PrescriptionModel, 'find').mockImplementation(() =>
        createQueryMock([
          {
            ...mockPrescriptionDoc,
            patientId: mockPatientUserDoc,
            doctorId: mockDoctorUserDoc,
            facilityId: mockFacilityDoc,
          },
        ])
      );
      vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/doctors/prescriptions?page=1&limit=10&status=DRAFT')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].prescriptionNumber).toBe('RX-202611-TEST01');
      expect(res.body.data[0].doctorName).toBe('Dr. Vikram Sharma');
      expect(res.body.data[0].medicationCount).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  /* ==========================================================================
     4. POST /api/v1/doctors/prescriptions (Create Draft or Issue)
     ========================================================================== */
  describe('POST /api/v1/doctors/prescriptions', () => {
    it('creates a new draft prescription linked to clinical encounter', async () => {
      vi.spyOn(PrescriptionModel, 'create').mockResolvedValue({
        ...mockPrescriptionDoc,
        _id: new Types.ObjectId(prescriptionId),
      } as any);

      const res = await request(app)
        .post('/api/v1/doctors/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientUserId,
          encounterId: encounterId,
          diagnosis: 'Essential hypertension',
          instructions: 'Take 1 tablet in the morning with food',
          medications: [
            {
              name: 'Amlodipine 5mg Tablet',
              genericName: 'Amlodipine',
              strength: '5 mg',
              dosage: '1 tablet',
              route: 'Oral',
              frequency: '1-0-0 (Once daily morning)',
              duration: '30 days',
              quantity: 30,
              instructions: 'Monitor BP daily',
            },
          ],
          isDraft: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(PrescriptionModel.create).toHaveBeenCalled();
      expect(EncounterModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $addToSet: { linkedPrescriptionIds: expect.anything() } })
      );
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PRESCRIPTION_DRAFT_CREATED' })
      );
    });

    it('fails closed with 403 Forbidden when doctor has no appointment or consent with the patient', async () => {
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(EncounterModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(ConsentArtifactModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(ConsentRequestModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/doctors/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientUserId,
          instructions: 'Take after meals',
          medications: [
            {
              name: 'Paracetamol 500mg',
              strength: '500 mg',
              dosage: '1 tablet',
              route: 'Oral',
              frequency: 'OD',
              duration: '3 days',
              quantity: 3,
            },
          ],
          isDraft: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('access denied');
    });

    it('returns 404 when patient record does not exist', async () => {
      const nonExistentPatientId = new Types.ObjectId().toString();
      vi.spyOn(UserModel, 'findOne').mockImplementation(() => createQueryMock(null));

      const res = await request(app)
        .post('/api/v1/doctors/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: nonExistentPatientId,
          instructions: 'Take as directed',
          medications: [
            {
              name: 'Paracetamol 500mg',
              strength: '500 mg',
              dosage: '1 tablet',
              route: 'Oral',
              frequency: 'OD',
              duration: '3 days',
              quantity: 3,
            },
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     5. GET /api/v1/doctors/prescriptions/:prescriptionId
     ========================================================================== */
  describe('GET /api/v1/doctors/prescriptions/:prescriptionId', () => {
    it('returns detailed prescription with patient, doctor, facility, and medication items', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(prescriptionId);
      expect(res.body.data.prescriptionNumber).toBe('RX-202611-TEST01');
      expect(res.body.data.patientName).toBe('Aarav Patel');
      expect(res.body.data.doctorRegistrationNumber).toBe('MCI-12345-DELHI');
      expect(res.body.data.medications.length).toBe(1);
      expect(res.body.data.medications[0].name).toBe('Paracetamol 500mg Tablet (Crocin)');
    });

    it('returns 404 when prescription does not exist or is not authorized for doctor', async () => {
      vi.spyOn(PrescriptionModel, 'findOne').mockImplementation(() => createQueryMock(null));

      const res = await request(app)
        .get(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     6. PATCH /api/v1/doctors/prescriptions/:prescriptionId (Draft update)
     ========================================================================== */
  describe('Draft Updating & Concurrency Protection', () => {
    it('updates draft prescription and increments version', async () => {
      const res = await request(app)
        .patch(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          instructions: 'Updated: Take with plenty of water',
          version: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrescriptionDoc.save).toHaveBeenCalled();
      expect(mockPrescriptionDoc.version).toBe(2);
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PRESCRIPTION_DRAFT_UPDATED' })
      );
    });

    it('rejects editing of issued/finalized prescriptions with 400 Bad Request', async () => {
      mockPrescriptionDoc.status = 'ACTIVE';
      mockPrescriptionDoc.isDraft = false;

      const res = await request(app)
        .patch(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          instructions: 'Trying to modify locked prescription',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('immutable');
    });

    it('rejects concurrent modification with lower document version with 409 Conflict', async () => {
      mockPrescriptionDoc.version = 3;

      const res = await request(app)
        .patch(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          instructions: 'Stale update',
          version: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('concurrently');
    });
  });

  /* ==========================================================================
     7. POST /api/v1/doctors/prescriptions/:prescriptionId/issue
     ========================================================================== */
  describe('POST /api/v1/doctors/prescriptions/:prescriptionId/issue', () => {
    it('finalizes and issues e-prescription, sets issuedAt and documentUrl', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/prescriptions/${prescriptionId}/issue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          confirmAttribution: true,
          notes: 'Clinician confirmed attribution for dispensing',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrescriptionDoc.status).toBe('ACTIVE');
      expect(mockPrescriptionDoc.isDraft).toBe(false);
      expect(mockPrescriptionDoc.issuedAt).toBeDefined();
      expect(mockPrescriptionDoc.documentUrl).toContain('/document');
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PRESCRIPTION_ISSUED' })
      );
    });

    it('rejects issuance when confirmAttribution is false or missing with 422', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/prescriptions/${prescriptionId}/issue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          confirmAttribution: false,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('prevents duplicate finalization of already issued prescriptions with 400', async () => {
      mockPrescriptionDoc.status = 'ACTIVE';
      mockPrescriptionDoc.isDraft = false;

      const res = await request(app)
        .post(`/api/v1/doctors/prescriptions/${prescriptionId}/issue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          confirmAttribution: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('already been finalized');
    });
  });

  /* ==========================================================================
     8. POST /api/v1/doctors/prescriptions/:prescriptionId/discontinue
     ========================================================================== */
  describe('POST /api/v1/doctors/prescriptions/:prescriptionId/discontinue', () => {
    it('discontinues active prescription and records reason and timestamp', async () => {
      mockPrescriptionDoc.status = 'ACTIVE';
      mockPrescriptionDoc.isDraft = false;

      const res = await request(app)
        .post(`/api/v1/doctors/prescriptions/${prescriptionId}/discontinue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          reason: 'Patient reported adverse mild gastric reflux; switching therapy',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrescriptionDoc.status).toBe('DISCONTINUED');
      expect(mockPrescriptionDoc.discontinuedAt).toBeDefined();
      expect(mockPrescriptionDoc.discontinuationReason).toContain('adverse mild gastric reflux');
      expect(mockPrescriptionDoc.medications[0].status).toBe('DISCONTINUED');
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PRESCRIPTION_DISCONTINUED' })
      );
    });

    it('rejects discontinuation of draft prescriptions with 400 Bad Request', async () => {
      mockPrescriptionDoc.status = 'DRAFT';
      mockPrescriptionDoc.isDraft = true;

      const res = await request(app)
        .post(`/api/v1/doctors/prescriptions/${prescriptionId}/discontinue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          reason: 'Cannot discontinue a draft',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('only active issued prescriptions');
    });
  });

  /* ==========================================================================
     9. GET /api/v1/doctors/prescriptions/:prescriptionId/document
     ========================================================================== */
  describe('GET /api/v1/doctors/prescriptions/:prescriptionId/document', () => {
    it('returns structured printable prescription document data', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/prescriptions/${prescriptionId}/document`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prescription.id).toBe(prescriptionId);
      expect(res.body.data.doctorRegistration).toBe('MCI-12345-DELHI');
      expect(res.body.data.facility.name).toContain('AIIMS');
    });
  });

  /* ==========================================================================
     10. MEDICATION CATALOG ENDPOINTS
     ========================================================================== */
  describe('Medication Catalog APIs', () => {
    it('GET /api/v1/medication-catalog returns paginated pharmaceutical catalog', async () => {
      const res = await request(app)
        .get('/api/v1/medication-catalog?search=paracetamol&dosageForm=TABLET')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].genericName).toBe('Paracetamol');
      expect(res.body.data[0].brandName).toBe('Crocin');
    });

    it('GET /api/v1/medication-catalog/:medicationId returns single pharmaceutical item', async () => {
      const res = await request(app)
        .get(`/api/v1/medication-catalog/${medicationCatalogId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(medicationCatalogId);
      expect(res.body.data.name).toContain('Paracetamol');
      expect(res.body.data.therapeuticClass).toBe('Analgesic & Antipyretic');
    });

    it('GET /api/v1/medication-catalog/:medicationId returns 404 when item not found', async () => {
      const nonExistentMedId = new Types.ObjectId().toString();
      vi.spyOn(MedicationCatalogModel, 'findById').mockImplementation(() =>
        createQueryMock(null)
      );

      const res = await request(app)
        .get(`/api/v1/medication-catalog/${nonExistentMedId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
