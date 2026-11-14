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
  LaboratoryReportModel,
  MedicalRecordModel,
  ConsentArtifactModel,
  ConsentRequestModel,
  FacilityModel,
  AuditLogModel,
} from '../../src/database/models';

describe('Doctor Clinical Encounter Management & EMR Integration Tests', () => {
  const app = createApp();

  const doctorUserId = new Types.ObjectId().toString();
  const doctorProfileId = new Types.ObjectId().toString();
  const otherDoctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const facilityId = new Types.ObjectId().toString();
  const appointmentId = new Types.ObjectId().toString();
  const encounterId = new Types.ObjectId().toString();

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.sharma@healthbridge.in',
  } as any);

  const otherDoctorToken = tokenService.generateAccessToken({
    _id: otherDoctorUserId,
    role: 'DOCTOR',
    email: 'dr.patel@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.aarav@healthbridge.in',
  } as any);

  const mockDoctorUserDoc = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockFacilityDoc = {
    _id: new Types.ObjectId(facilityId),
    id: facilityId,
    name: 'AIIMS New Delhi — Cardiology Block',
    facilityType: 'HOSPITAL',
    address: {
      line1: 'Ansari Nagar East',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110029',
    },
  };

  const mockDoctorProfileDoc: any = {
    _id: new Types.ObjectId(doctorProfileId),
    id: doctorProfileId,
    userId: new Types.ObjectId(doctorUserId),
    registrationNumber: 'MCI-2015-884920',
    specialization: ['Cardiology'],
    qualifications: ['MBBS', 'MD (Cardiology)'],
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: mockFacilityDoc,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    workingHours: { start: '09:00', end: '17:00' },
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
    emergencyContact: {
      name: 'Sunita Patel',
      phone: '9876511111',
      relationship: 'Spouse',
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

  let mockEncounterDoc: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1 as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

    mockEncounterDoc = {
      _id: new Types.ObjectId(encounterId),
      id: encounterId,
      patientId: new Types.ObjectId(patientUserId),
      practitionerId: new Types.ObjectId(doctorUserId),
      facilityId: new Types.ObjectId(facilityId),
      appointmentId: new Types.ObjectId(appointmentId),
      encounterType: 'AMBULATORY',
      startTime: new Date(),
      status: 'IN_PROGRESS',
      isDraft: true,
      chiefComplaint: 'Chest heaviness and dyspnea on exertion',
      historyOfPresentIllness: 'Symptoms began 3 days ago after moderate exercise.',
      medicalHistory: 'History of borderline hypertension.',
      vitals: {
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 85,
        heartRate: 78,
        respiratoryRate: 16,
        temperature: 36.8,
        oxygenSaturation: 98,
        height: 175,
        weight: 75,
        bmi: 24.5,
        recordedAt: new Date(),
      },
      examination: {
        general: 'Alert, oriented, no pallor or cyanosis.',
        systemic: 'S1 S2 normal, chest clear to auscultation.',
      },
      diagnoses: [
        {
          _id: new Types.ObjectId(),
          name: 'Atypical chest pain',
          code: 'R07.89',
          type: 'PRIMARY',
          clinicalStatus: 'ACTIVE',
        },
      ],
      assessment: 'Likely non-cardiac chest pain vs early angina.',
      treatmentPlan: 'Recommended baseline ECG and lipid profile.',
      followUpInstructions: 'Return immediately if chest pressure intensifies.',
      followUpDate: new Date(Date.now() + 7 * 86400000),
      linkedRecordIds: [],
      linkedPrescriptionIds: [],
      version: 1,
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
      if (idStr === otherDoctorUserId) return Promise.resolve({ ...mockDoctorUserDoc, _id: new Types.ObjectId(otherDoctorUserId), name: 'Dr. Patel' });
      if (idStr === patientUserId) return Promise.resolve(mockPatientUserDoc);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(UserModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter?._id?.toString?.() || filter?._id;
      if (uId === patientUserId) return createQueryMock(mockPatientUserDoc);
      return createQueryMock(null);
    }) as any);

    vi.spyOn(UserModel, 'find').mockImplementation(() =>
      createQueryMock([mockPatientUserDoc])
    );

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
    vi.spyOn(FacilityModel, 'findById').mockResolvedValue(mockFacilityDoc as any);

    // Default EncounterModel mocks
    vi.spyOn(EncounterModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => createQueryMock(mockEncounterDoc));
    vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(EncounterModel, 'exists').mockResolvedValue(true as any);

    // AppointmentModel mocks
    vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() =>
      createQueryMock({
        _id: new Types.ObjectId(appointmentId),
        doctorId: new Types.ObjectId(doctorUserId),
        patientId: new Types.ObjectId(patientUserId),
        status: 'CONFIRMED',
      })
    );
    vi.spyOn(AppointmentModel, 'findByIdAndUpdate').mockResolvedValue({} as any);
    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

    // Consent models
    vi.spyOn(ConsentArtifactModel, 'findOne').mockResolvedValue({
      consentStatus: 'ACTIVE',
      validityPeriod: { to: new Date(Date.now() + 86400000) },
    } as any);
    vi.spyOn(ConsentRequestModel, 'findOne').mockResolvedValue(null);

    // Other clinical models
    vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(MedicalRecordModel, 'find').mockImplementation(() => createQueryMock([]));
  });

  /* ==========================================================================
     1. RBAC & ROUTE PROTECTION
     ========================================================================== */
  describe('RBAC & Security Protection', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const endpoints = [
        '/api/v1/doctors/encounters/summary',
        '/api/v1/doctors/encounters',
        `/api/v1/doctors/encounters/${encounterId}`,
        `/api/v1/doctors/patients/${patientUserId}/clinical-history`,
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });

    it('rejects PATIENT users from doctor clinical encounter endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/encounters/summary')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('forbidden');
    });

    it('rejects invalid ObjectId parameters with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/encounters/invalid-id')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. GET /api/v1/doctors/encounters/summary
     ========================================================================== */
  describe('GET /api/v1/doctors/encounters/summary', () => {
    it('returns aggregated consultation metrics: today, draft, completed, pendingDocumentation, total', async () => {
      vi.spyOn(EncounterModel, 'countDocuments')
        .mockResolvedValueOnce(3) // today
        .mockResolvedValueOnce(2) // draft
        .mockResolvedValueOnce(8) // completed
        .mockResolvedValueOnce(1) // pendingDocumentation
        .mockResolvedValueOnce(11); // total

      const res = await request(app)
        .get('/api/v1/doctors/encounters/summary')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        today: 3,
        draft: 2,
        completed: 8,
        pendingDocumentation: 1,
        total: 11,
      });
    });
  });

  /* ==========================================================================
     3. GET /api/v1/doctors/encounters
     ========================================================================== */
  describe('GET /api/v1/doctors/encounters', () => {
    it('returns paginated encounters with populated patient and facility data', async () => {
      const mockListEncounter = {
        _id: new Types.ObjectId(encounterId),
        patientId: mockPatientUserDoc,
        facilityId: mockFacilityDoc,
        practitionerId: mockDoctorUserDoc,
        encounterType: 'AMBULATORY',
        startTime: new Date(),
        status: 'IN_PROGRESS',
        isDraft: true,
        chiefComplaint: 'Post-CABG follow-up',
        diagnoses: [{ name: 'CAD post CABG', type: 'PRIMARY' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(EncounterModel, 'find').mockImplementation(() =>
        createQueryMock([mockListEncounter])
      );
      vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/doctors/encounters?filterTab=draft&page=1&limit=10')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].patientName).toBe('Aarav Patel');
      expect(res.body.data[0].encounterReference).toContain('ENC-');
      expect(res.body.data[0].primaryDiagnosis).toBe('CAD post CABG');
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  /* ==========================================================================
     4. POST /api/v1/doctors/encounters (Start Encounter)
     ========================================================================== */
  describe('POST /api/v1/doctors/encounters', () => {
    it('starts a new encounter linked to an appointment, transitions appointment to IN_PROGRESS', async () => {
      const createdEncounter = {
        ...mockEncounterDoc,
        appointmentId: new Types.ObjectId(appointmentId),
      };

      vi.spyOn(EncounterModel, 'create').mockResolvedValue(createdEncounter as any);
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() =>
        createQueryMock({
          ...createdEncounter,
          patientId: mockPatientUserDoc,
          facilityId: mockFacilityDoc,
          practitionerId: mockDoctorUserDoc,
        })
      );

      const res = await request(app)
        .post('/api/v1/doctors/encounters')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientUserId,
          appointmentId,
          encounterType: 'AMBULATORY',
          chiefComplaint: 'Follow-up for hypertension',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patientName).toBe('Aarav Patel');
      expect(AppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        appointmentId,
        expect.objectContaining({ status: 'IN_PROGRESS' })
      );
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLINICAL_ENCOUNTER_CREATED' })
      );
    });

    it('fails closed with 403 Forbidden when doctor has no appointment or consent with the patient', async () => {
      // Mock patient exists, but no appointment and no consent
      vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(ConsentArtifactModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(ConsentRequestModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/doctors/encounters')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientUserId,
          encounterType: 'AMBULATORY',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('access denied');
    });

    it('returns 404 when patient record does not exist', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const nonExistentPatientId = new Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/v1/doctors/encounters')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: nonExistentPatientId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     5. GET /api/v1/doctors/encounters/:encounterId
     ========================================================================== */
  describe('GET /api/v1/doctors/encounters/:encounterId', () => {
    it('returns detailed clinical encounter with patient demographics, vitals, and diagnoses', async () => {
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() =>
        createQueryMock({
          ...mockEncounterDoc,
          patientId: mockPatientUserDoc,
          facilityId: mockFacilityDoc,
          practitionerId: mockDoctorUserDoc,
        })
      );

      const res = await request(app)
        .get(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(encounterId);
      expect(res.body.data.patientName).toBe('Aarav Patel');
      expect(res.body.data.patientGender).toBe('MALE');
      expect(res.body.data.patientAge).toBeGreaterThan(0);
      expect(res.body.data.vitals?.bloodPressureSystolic).toBe(130);
      expect(res.body.data.diagnoses[0].name).toBe('Atypical chest pain');
    });

    it('returns 404 when encounter does not exist or is not authorized for doctor', async () => {
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => createQueryMock(null));

      const res = await request(app)
        .get(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     6. PATCH & POST /save-draft (Save Draft)
     ========================================================================== */
  describe('Draft Saving & Concurrency Protection', () => {
    it('saves draft documentation, calculates BMI from height/weight, and increments version', async () => {
      vi.spyOn(EncounterModel, 'findOne')
        .mockResolvedValueOnce(mockEncounterDoc as any)
        .mockImplementation(() =>
          createQueryMock({
            ...mockEncounterDoc,
            chiefComplaint: 'Updated chief complaint',
            vitals: {
              height: 180,
              weight: 81,
              bmi: 25.0,
            },
            version: 2,
            patientId: mockPatientUserDoc,
            facilityId: mockFacilityDoc,
            practitionerId: mockDoctorUserDoc,
          })
        );

      const res = await request(app)
        .patch(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          chiefComplaint: 'Updated chief complaint',
          vitals: {
            height: 180,
            weight: 81,
          },
          version: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockEncounterDoc.save).toHaveBeenCalled();
      expect(mockEncounterDoc.vitals?.bmi).toBe(25);
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLINICAL_ENCOUNTER_DRAFT_SAVED' })
      );
    });

    it('rejects editing of finalized encounters with 400 Bad Request', async () => {
      mockEncounterDoc.status = 'COMPLETED';
      mockEncounterDoc.isDraft = false;

      vi.spyOn(EncounterModel, 'findOne').mockResolvedValue(mockEncounterDoc as any);

      const res = await request(app)
        .patch(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ chiefComplaint: 'Trying to modify locked clinical note' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('finalized');
    });

    it('rejects concurrent modification with lower document version with 409 Conflict', async () => {
      mockEncounterDoc.version = 3;
      vi.spyOn(EncounterModel, 'findOne').mockResolvedValue(mockEncounterDoc as any);

      const res = await request(app)
        .patch(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ version: 1 }); // Stale version

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('concurrently');
    });
  });

  /* ==========================================================================
     7. POST /api/v1/doctors/encounters/:encounterId/complete (Finalization)
     ========================================================================== */
  describe('POST /api/v1/doctors/encounters/:encounterId/complete', () => {
    it('finalizes encounter, marks isDraft false, sets finalizedAt and completes linked appointment', async () => {
      vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => {
        const q: any = {
          populate: vi.fn().mockImplementation(() => q),
          sort: vi.fn().mockImplementation(() => q),
          skip: vi.fn().mockImplementation(() => q),
          limit: vi.fn().mockImplementation(() => q),
          select: vi.fn().mockImplementation(() => q),
          lean: vi.fn().mockImplementation(() =>
            Promise.resolve({
              ...mockEncounterDoc,
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
              practitionerId: mockDoctorUserDoc,
            })
          ),
          then: (resolve: any, reject: any) => Promise.resolve(mockEncounterDoc).then(resolve, reject),
        };
        return q;
      });

      const res = await request(app)
        .post(`/api/v1/doctors/encounters/${encounterId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          assessment: 'Final clinical assessment confirmed.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockEncounterDoc.status).toBe('COMPLETED');
      expect(mockEncounterDoc.isDraft).toBe(false);
      expect(mockEncounterDoc.finalizedAt).toBeDefined();
      expect(AppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEncounterDoc.appointmentId,
        expect.objectContaining({ status: 'COMPLETED' })
      );
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLINICAL_ENCOUNTER_FINALIZED' })
      );
    });

    it('prevents duplicate finalization of already completed encounters with 400', async () => {
      mockEncounterDoc.status = 'COMPLETED';
      mockEncounterDoc.isDraft = false;

      vi.spyOn(EncounterModel, 'findOne').mockResolvedValue(mockEncounterDoc as any);

      const res = await request(app)
        .post(`/api/v1/doctors/encounters/${encounterId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('already finalized');
    });
  });

  /* ==========================================================================
     8. GET /api/v1/doctors/patients/:patientId/clinical-history
     ========================================================================== */
  describe('GET /api/v1/doctors/patients/:patientId/clinical-history', () => {
    it('returns patient longitudinal health chart with encounters, medications, diagnoses, and lab results', async () => {
      const mockHistoryEncounter = {
        _id: new Types.ObjectId(encounterId),
        chiefComplaint: 'Chest heaviness',
        startTime: new Date('2024-05-10'),
        status: 'COMPLETED',
        diagnoses: [{ name: 'Hypertension', code: 'I10', type: 'PRIMARY' }],
        practitionerId: mockDoctorUserDoc,
        facilityId: mockFacilityDoc,
      };

      const mockPrescription = {
        _id: new Types.ObjectId(),
        status: 'ACTIVE',
        doctorId: mockDoctorUserDoc,
        medications: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days' }],
        issuedAt: new Date(),
      };

      const mockLabReport = {
        _id: new Types.ObjectId(),
        testName: 'Lipid Profile',
        publishedAt: new Date(),
        observations: [{ testName: 'Total Cholesterol', value: '180', unit: 'mg/dL' }],
      };

      vi.spyOn(EncounterModel, 'find').mockImplementation(() =>
        createQueryMock([mockHistoryEncounter])
      );
      vi.spyOn(PrescriptionModel, 'find').mockImplementation(() =>
        createQueryMock([mockPrescription])
      );
      vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() =>
        createQueryMock([mockLabReport])
      );
      vi.spyOn(MedicalRecordModel, 'find').mockImplementation(() =>
        createQueryMock([])
      );

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/clinical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient.name).toBe('Aarav Patel');
      expect(res.body.data.patient.bloodGroup).toBe('O_POSITIVE');
      expect(res.body.data.currentMedications.length).toBe(1);
      expect(res.body.data.currentMedications[0].name).toBe('Amlodipine');
      expect(res.body.data.pastDiagnoses.length).toBe(1);
      expect(res.body.data.pastDiagnoses[0].name).toBe('Hypertension');
      expect(res.body.data.labReports.length).toBe(1);
      expect(res.body.data.encounters.length).toBe(1);
      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PATIENT_CLINICAL_HISTORY_ACCESSED' })
      );
    });

    it('fails closed with 403 when doctor has no appointment or consent with the patient', async () => {
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(ConsentArtifactModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(ConsentRequestModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/clinical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('access denied');
    });
  });
});
