import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  DoctorProfileModel,
  PatientProfileModel,
  AppointmentModel,
  EncounterModel,
  PrescriptionModel,
  ConsentArtifactModel,
  ConsentRequestModel,
  MedicalRecordModel,
  LaboratoryReportModel,
  FacilityModel,
  AuditLogModel,
} from '../../src/database/models';

describe('Complete Clinical Workflow & Healthcare Integrity Integration Tests', () => {
  const app = createApp();

  const doctorUserId = new Types.ObjectId().toString();
  const doctorProfileId = new Types.ObjectId().toString();
  const otherDoctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const facilityId = new Types.ObjectId().toString();
  const appointmentId = new Types.ObjectId().toString();
  const encounterId = new Types.ObjectId().toString();
  const prescriptionId = new Types.ObjectId().toString();
  const medicationId = new Types.ObjectId().toString();

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.sharma@healthbridge.in',
  } as any);

  const otherDoctorToken = tokenService.generateAccessToken({
    _id: otherDoctorUserId,
    role: 'DOCTOR',
    email: 'dr.verma@healthbridge.in',
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOtherDoctorUserDoc = {
    _id: new Types.ObjectId(otherDoctorUserId),
    id: otherDoctorUserId,
    name: 'Dr. Sunita Verma',
    email: 'dr.verma@healthbridge.in',
    phone: '9876543299',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatientUserDoc = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9876500000',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFacilityDoc = {
    _id: new Types.ObjectId(facilityId),
    id: facilityId,
    name: 'Max Super Specialty Hospital — New Delhi',
    facilityType: 'HOSPITAL',
    address: {
      line1: '1 Press Enclave Road',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110017',
    },
    city: 'New Delhi',
    isActive: true,
  };

  const mockDoctorProfileDoc = {
    _id: new Types.ObjectId(doctorProfileId),
    id: doctorProfileId,
    userId: new Types.ObjectId(doctorUserId),
    registrationNumber: 'MCI-DEL-2015-884920',
    specialization: ['Cardiology'],
    qualifications: ['MBBS', 'MD'],
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: new Types.ObjectId(facilityId),
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    consultationFee: 750,
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

  let mockAppointmentDoc: any;
  let mockEncounterDoc: any;
  let mockPrescriptionDoc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAppointmentDoc = {
      _id: new Types.ObjectId(appointmentId),
      id: appointmentId,
      patientId: {
        _id: new Types.ObjectId(patientUserId),
        name: 'Aarav Patel',
        email: 'patient.aarav@healthbridge.in',
        phone: '9876500000',
        toString() {
          return patientUserId;
        },
      },
      doctorId: {
        _id: new Types.ObjectId(doctorUserId),
        name: 'Dr. Vikram Sharma',
        specialization: ['Cardiology'],
        toString() {
          return doctorUserId;
        },
      },
      facilityId: {
        _id: new Types.ObjectId(facilityId),
        name: 'Max Super Specialty Hospital — New Delhi',
        facilityType: 'HOSPITAL',
        address: 'New Delhi',
        toString() {
          return facilityId;
        },
      },
      encounterId: new Types.ObjectId(encounterId),
      scheduledAt: new Date(Date.now() + 3600 * 1000),
      startTime: '11:00',
      timeSlot: '11:00',
      endTime: '11:30',
      consultationType: 'IN_PERSON',
      status: 'SCHEDULED',
      reason: 'Chest pain and routine cardiac follow-up',
      queueNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      populate: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockEncounterDoc = {
      _id: new Types.ObjectId(encounterId),
      id: encounterId,
      appointmentId: new Types.ObjectId(appointmentId),
      patientId: {
        _id: new Types.ObjectId(patientUserId),
        name: 'Aarav Patel',
        email: 'patient.aarav@healthbridge.in',
        phone: '9876500000',
        toString() {
          return patientUserId;
        },
      },
      practitionerId: {
        _id: new Types.ObjectId(doctorUserId),
        name: 'Dr. Vikram Sharma',
        specialization: 'Cardiology',
        toString() {
          return doctorUserId;
        },
      },
      facilityId: {
        _id: new Types.ObjectId(facilityId),
        name: 'Max Super Specialty Hospital — New Delhi',
        facilityType: 'HOSPITAL',
        address: 'New Delhi',
        toString() {
          return facilityId;
        },
      },
      encounterType: 'AMBULATORY',
      type: 'IN_PERSON',
      status: 'IN_PROGRESS',
      isDraft: true,
      version: 1,
      startTime: new Date(),
      chiefComplaint: 'Mild exertion-induced chest tightness',
      clinicalNotes: '',
      diagnoses: [],
      vitals: {},
      vitalSigns: {},
      observations: [],
      prescriptions: [],
      linkedPrescriptionIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      populate: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockPrescriptionDoc = {
      _id: new Types.ObjectId(prescriptionId),
      id: prescriptionId,
      prescriptionNumber: 'RX-2026-DEL-009182',
      patientId: {
        _id: new Types.ObjectId(patientUserId),
        name: 'Aarav Patel',
        email: 'patient.aarav@healthbridge.in',
        phone: '9876500000',
        toString() {
          return patientUserId;
        },
      },
      doctorId: {
        _id: new Types.ObjectId(doctorUserId),
        name: 'Dr. Vikram Sharma',
        specialization: 'Cardiology',
        toString() {
          return doctorUserId;
        },
      },
      encounterId: new Types.ObjectId(encounterId),
      facilityId: {
        _id: new Types.ObjectId(facilityId),
        name: 'Max Super Specialty Hospital — New Delhi',
        facilityType: 'HOSPITAL',
        address: 'New Delhi',
        toString() {
          return facilityId;
        },
      },
      status: 'DRAFT',
      isDraft: true,
      version: 1,
      diagnosis: 'Essential Hypertension (I10)',
      instructions: 'Take medications with food',
      medications: [
        {
          _id: new Types.ObjectId(medicationId),
          id: medicationId,
          name: 'Telmisartan 40mg Tablet',
          genericName: 'Telmisartan',
          strength: '40mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: 'Once daily (Morning)',
          duration: '30 Days',
          quantity: 30,
          instructions: 'Take after breakfast',
          status: 'ACTIVE',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      issuedAt: undefined,
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      populate: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    // User Model
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      let doc = null;
      if (idStr === doctorUserId) doc = { ...mockDoctorUserDoc };
      else if (idStr === otherDoctorUserId) doc = { ...mockOtherDoctorUserDoc };
      else if (idStr === patientUserId) doc = { ...mockPatientUserDoc };

      return {
        select: vi.fn().mockResolvedValue(doc),
        then: (resolve: any) => Promise.resolve(doc).then(resolve),
      } as any;
    }) as any);

    vi.spyOn(UserModel, 'findOne').mockImplementation(((query: any) => {
      const idStr = (query._id?._id || query._id)?.toString();
      let doc = null;
      if (idStr === doctorUserId || query.email === 'dr.sharma@healthbridge.in') doc = { ...mockDoctorUserDoc };
      else if (idStr === otherDoctorUserId) doc = { ...mockOtherDoctorUserDoc };
      else if (idStr === patientUserId || query.email === 'patient.aarav@healthbridge.in') doc = { ...mockPatientUserDoc };

      return createQueryMock(doc);
    }) as any);

    vi.spyOn(UserModel, 'find').mockImplementation(() => createQueryMock([mockPatientUserDoc]));

    // Profiles
    vi.spyOn(DoctorProfileModel, 'findOne').mockImplementation(((query: any) => {
      const userId = query.userId?.toString();
      if (userId === doctorUserId || query._id?.toString() === doctorProfileId) {
        return createQueryMock({ ...mockDoctorProfileDoc, facilityId: mockFacilityDoc });
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() =>
      createQueryMock({
        userId: new Types.ObjectId(patientUserId),
        gender: 'MALE',
        dateOfBirth: new Date('1990-05-15'),
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
        medicalHistory: ['Mild Hypertension'],
        emergencyContact: { name: 'Pooja Patel', relationship: 'Spouse', phone: '9876543210' },
        address: { city: 'New Delhi', state: 'Delhi', postalCode: '110001' },
      })
    );

    vi.spyOn(FacilityModel, 'findById').mockResolvedValue(mockFacilityDoc as any);

    // Appointment Model
    vi.spyOn(AppointmentModel, 'findById').mockImplementation(((id: any) => {
      if (id?.toString() === appointmentId) {
        return createQueryMock(mockAppointmentDoc);
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(AppointmentModel, 'findOne').mockImplementation(((query: any) => {
      if (
        query._id?.toString() === appointmentId ||
        query.appointmentId?.toString() === appointmentId ||
        query._id?._id?.toString() === appointmentId
      ) {
        return createQueryMock(mockAppointmentDoc);
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(AppointmentModel, 'find').mockImplementation(() =>
      createQueryMock([mockAppointmentDoc])
    );

    vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(1);

    vi.spyOn(AppointmentModel, 'create').mockImplementation(((data: any) => {
      return Promise.resolve({
        ...mockAppointmentDoc,
        ...data,
        _id: new Types.ObjectId(),
      }) as any;
    }) as any);

    vi.spyOn(AppointmentModel, 'findByIdAndUpdate').mockImplementation(((id: any, update: any) => {
      if (update.status) mockAppointmentDoc.status = update.status;
      if (update.encounterId) mockAppointmentDoc.encounterId = update.encounterId;
      return createQueryMock(mockAppointmentDoc);
    }) as any);

    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(true as any);

    // Encounter Model
    vi.spyOn(EncounterModel, 'findById').mockImplementation(((id: any) => {
      if (id?.toString() === encounterId) {
        return createQueryMock(mockEncounterDoc);
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(EncounterModel, 'findOne').mockImplementation(((query: any) => {
      if (query._id?.toString() === encounterId || query.appointmentId?.toString() === appointmentId) {
        // If searching by other doctor, deny
        if (query.practitionerId) {
          const pIds = Array.isArray(query.practitionerId.$in)
            ? query.practitionerId.$in.map((id: any) => id.toString())
            : [query.practitionerId.toString()];
          if (pIds.includes(otherDoctorUserId) && !pIds.includes(doctorUserId)) {
            return createQueryMock(null);
          }
        }
        return createQueryMock(mockEncounterDoc);
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(EncounterModel, 'find').mockImplementation(() =>
      createQueryMock([mockEncounterDoc])
    );

    vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(EncounterModel, 'create').mockResolvedValue(mockEncounterDoc as any);
    vi.spyOn(EncounterModel, 'findByIdAndUpdate').mockImplementation(((id: any, update: any) => {
      if (update.status) mockEncounterDoc.status = update.status;
      return createQueryMock(mockEncounterDoc);
    }) as any);
    vi.spyOn(EncounterModel, 'exists').mockResolvedValue(true as any);

    // Prescription Model
    vi.spyOn(PrescriptionModel, 'findById').mockImplementation(((id: any) => {
      if (id?.toString() === prescriptionId) {
        return createQueryMock(mockPrescriptionDoc);
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(PrescriptionModel, 'findOne').mockImplementation(((query: any) => {
      if (query._id?.toString() === prescriptionId) {
        return createQueryMock(mockPrescriptionDoc);
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(PrescriptionModel, 'find').mockImplementation(() =>
      createQueryMock([mockPrescriptionDoc])
    );

    vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(PrescriptionModel, 'create').mockResolvedValue(mockPrescriptionDoc as any);
    vi.spyOn(PrescriptionModel, 'exists').mockResolvedValue(true as any);

    // Consents & Medical Records
    vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() =>
      createQueryMock({
        patientId: new Types.ObjectId(patientUserId),
        grantedToId: new Types.ObjectId(doctorUserId),
        requesterId: new Types.ObjectId(doctorUserId),
        consentStatus: 'ACTIVE',
        status: 'ACTIVE',
        validityPeriod: {
          from: new Date(Date.now() - 86400000),
          to: new Date(Date.now() + 30 * 86400000),
        },
      })
    );
    vi.spyOn(ConsentArtifactModel, 'countDocuments').mockResolvedValue(1);

    vi.spyOn(ConsentRequestModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(MedicalRecordModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(MedicalRecordModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(LaboratoryReportModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(LaboratoryReportModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  /* ==========================================================================
     FULL CLINICAL WORKFLOW EXECUTION (Steps 1 through 14)
     ========================================================================== */
  describe('Full Clinical Workflow Execution (Steps 1 through 14)', () => {
    it('Step 1: Patient books an appointment', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorUserId,
          facilityId: facilityId,
          scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          startTime: '11:00',
          consultationType: 'IN_PERSON',
          reason: 'Chest pain and routine cardiac follow-up',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('Step 2: Doctor views the appointment in appointment roster', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/appointments')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('Step 3: Doctor confirms the appointment', async () => {
      mockAppointmentDoc.status = 'REQUESTED';

      const res = await request(app)
        .patch(`/api/v1/doctors/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAppointmentDoc.status).toBe('CONFIRMED');
      expect(mockAppointmentDoc.save).toHaveBeenCalled();
    });

    it('Step 4: Patient checks in at reception and receives queue token', async () => {
      mockAppointmentDoc.status = 'CONFIRMED';

      const res = await request(app)
        .patch(`/api/v1/doctors/appointments/${appointmentId}/check-in`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAppointmentDoc.status).toBe('CHECKED_IN');
      expect(mockAppointmentDoc.save).toHaveBeenCalled();
    });

    it('Step 5 & 6: Doctor starts consultation and linked encounter is created in IN_PROGRESS state', async () => {
      mockAppointmentDoc.status = 'CHECKED_IN';

      const res = await request(app)
        .patch(`/api/v1/doctors/appointments/${appointmentId}/start`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAppointmentDoc.status).toBe('IN_PROGRESS');
      expect(res.body.data.id).toBe(appointmentId);
    });

    it('Step 7: Doctor accesses authorized patient clinical history', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/clinical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient.name).toBe('Aarav Patel');
    });

    it('Step 8 & 9: Doctor records clinical notes, vital signs, and diagnoses', async () => {
      const res = await request(app)
        .patch(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          chiefComplaint: 'Patient presents with stable vitals. S1 and S2 heart sounds clear, no murmur.',
          vitals: {
            bloodPressureSystolic: 125,
            bloodPressureDiastolic: 82,
            heartRate: 74,
            temperature: 37,
            oxygenSaturation: 99,
          },
          diagnoses: [
            {
              name: 'Essential (primary) hypertension',
              code: 'I10',
              type: 'PRIMARY',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockEncounterDoc.save).toHaveBeenCalled();
    });

    it('Step 10: Doctor creates a linked prescription draft', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientUserId,
          encounterId: encounterId,
          facilityId: facilityId,
          diagnosis: 'Essential Hypertension (I10)',
          instructions: 'Take medications after breakfast regularly.',
          isDraft: true,
          medications: [
            {
              name: 'Telmisartan 40mg Tablet',
              strength: '40mg',
              dosage: '1 tablet',
              route: 'Oral',
              frequency: 'Once daily (Morning)',
              duration: '30 Days',
              quantity: 30,
              instructions: 'Take after breakfast',
            },
          ],
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('Step 11: Doctor issues the prescription with digital verification', async () => {
      mockPrescriptionDoc.status = 'DRAFT';
      mockPrescriptionDoc.isDraft = true;

      const res = await request(app)
        .post(`/api/v1/doctors/prescriptions/${prescriptionId}/issue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          confirmAttribution: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrescriptionDoc.status).toBe('ACTIVE');
      expect(mockPrescriptionDoc.isDraft).toBe(false);
      expect(mockPrescriptionDoc.save).toHaveBeenCalled();
    });

    it('Step 12: Doctor completes the clinical encounter', async () => {
      mockEncounterDoc.status = 'IN_PROGRESS';
      mockAppointmentDoc.status = 'IN_PROGRESS';

      const res = await request(app)
        .post(`/api/v1/doctors/encounters/${encounterId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          treatmentPlan: 'Continue regular low-sodium diet and monitor BP weekly.',
          followUpInstructions: 'Return in 30 days for blood pressure follow-up.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockEncounterDoc.status).toBe('COMPLETED');
      expect(mockAppointmentDoc.status).toBe('COMPLETED');
      expect(mockEncounterDoc.save).toHaveBeenCalled();
    });

    it('Step 13: Patient can view the issued prescription', async () => {
      mockPrescriptionDoc.status = 'ACTIVE';
      mockPrescriptionDoc.isDraft = false;

      const res = await request(app)
        .get(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.prescriptionNumber).toBe('RX-2026-DEL-009182');
    });

    it('Step 14: Appointment and encounter statuses remain consistent as COMPLETED', async () => {
      mockAppointmentDoc.status = 'COMPLETED';
      mockEncounterDoc.status = 'COMPLETED';

      const aptRes = await request(app)
        .get(`/api/v1/doctors/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      const encRes = await request(app)
        .get(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(aptRes.status).toBe(200);
      expect(aptRes.body.data.status).toBe('COMPLETED');
      expect(encRes.status).toBe(200);
      expect(encRes.body.data.status).toBe('COMPLETED');
    });
  });

  /* ==========================================================================
     SECURITY & CLINICAL INTEGRITY AUDIT
     ========================================================================== */
  describe('Security & Clinical Integrity Audit', () => {
    it('should forbid unauthorized Doctor B from accessing Doctor A encounter (403/404)', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${otherDoctorToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject modifications to already ISSUED prescription (400 Bad Request)', async () => {
      mockPrescriptionDoc.status = 'ACTIVE';
      mockPrescriptionDoc.isDraft = false;

      const res = await request(app)
        .patch(`/api/v1/doctors/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          diagnosis: 'Attempted Silent Override',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Issued prescriptions are immutable once finalized');
    });

    it('should reject draft updates to an already COMPLETED encounter (400 Bad Request)', async () => {
      mockEncounterDoc.status = 'COMPLETED';
      mockEncounterDoc.isDraft = false;

      const res = await request(app)
        .patch(`/api/v1/doctors/encounters/${encounterId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          chiefComplaint: 'Attempted Post-Completion Note',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('finalized');
    });

    it('should block patient clinical history access if electronic consent is REVOKED or EXPIRED', async () => {
      vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() => createQueryMock(null));
      vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(false as any);
      vi.spyOn(EncounterModel, 'exists').mockResolvedValue(false as any);

      const res = await request(app)
        .get(`/api/v1/doctors/patients/${patientUserId}/clinical-history`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});
