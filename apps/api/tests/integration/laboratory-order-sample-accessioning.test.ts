import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  LaboratoryProfileModel,
  LabTestModel,
  LaboratoryOrderModel,
  LabSampleModel,
  CollectionCenterModel,
  AuditLogModel,
} from '../../src/database/models';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { Types } from 'mongoose';

describe('Laboratory Order Management, Test Assignment, Sample Collection, Barcodes & Accessioning Tests (Day 6 Tasks 01 & 02)', () => {
  const app = createApp();

  const labAUserId = new Types.ObjectId().toString();
  const labBUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const pharmacyUserId = new Types.ObjectId().toString();

  const labAToken = tokenService.generateAccessToken({
    _id: labAUserId,
    role: 'LABORATORY',
    email: 'pathology@healthbridge-labs.in',
  } as any);

  const labBToken = tokenService.generateAccessToken({
    _id: labBUserId,
    role: 'LABORATORY',
    email: 'metropolis@diagnostic-labs.in',
  } as any);

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

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.cp@healthbridge.in',
  } as any);

  const mockLabAUser: any = {
    _id: new Types.ObjectId(labAUserId),
    id: labAUserId,
    name: 'HealthBridge Central Diagnostic Laboratory',
    email: 'pathology@healthbridge-labs.in',
    phone: '9811223344',
    role: 'LABORATORY',
    accountStatus: 'ACTIVE',
  };

  const mockLabBUser: any = {
    _id: new Types.ObjectId(labBUserId),
    id: labBUserId,
    name: 'Metropolis Diagnostics Center',
    email: 'metropolis@diagnostic-labs.in',
    phone: '9811225566',
    role: 'LABORATORY',
    accountStatus: 'ACTIVE',
  };

  const mockDoctorUser: any = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9811001122',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockPatientUser: any = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9811998877',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    gender: 'MALE',
    dateOfBirth: '1990-05-15',
    abhaAddress: 'aarav.patel@abdm',
  };

  const mockPharmacyUser: any = {
    _id: new Types.ObjectId(pharmacyUserId),
    id: pharmacyUserId,
    name: 'Apollo Pharmacy',
    email: 'apollo.cp@healthbridge.in',
    phone: '9811334455',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
  };

  const mockLabAProfileId = new Types.ObjectId();
  const mockLabBProfileId = new Types.ObjectId();

  const mockLabAProfile: any = {
    _id: mockLabAProfileId,
    id: mockLabAProfileId.toString(),
    userId: new Types.ObjectId(labAUserId),
    laboratoryName: 'HealthBridge Central Diagnostic Laboratory',
    laboratoryLicenseNumber: 'LAB-DEL-2024-99881',
    registrationNumber: 'REG-LAB-2024-77',
    contactEmail: 'pathology@healthbridge-labs.in',
    contactPhone: '9811223344',
    websiteUrl: 'https://labs.healthbridge.in',
    address: {
      street: '12 Medical Enclave',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      coordinates: { latitude: 28.6139, longitude: 77.209 },
    },
    accreditationInfo: {
      nablAccredited: true,
      nablCertificateNumber: 'NABL-MC-5544',
      nablExpiryDate: new Date('2028-12-31'),
      capAccredited: false,
      icmrApproved: true,
      isoCertified: true,
    },
    facilityName: 'HealthBridge Diagnostic Hub',
    facilityType: 'CLINICAL_LAB',
    supportedDiagnosticServices: ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY'],
    verificationStatus: 'VERIFIED',
    documentSubmissionStatus: 'VERIFIED',
    documents: [],
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    toJSON: vi.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  const mockTestId = new Types.ObjectId().toString();
  const mockLabTestDoc: any = {
    _id: new Types.ObjectId(mockTestId),
    id: mockTestId,
    laboratoryId: mockLabAProfileId,
    testName: 'Complete Blood Count (CBC)',
    testCode: 'CBC-001',
    category: 'HEMATOLOGY',
    description: 'Comprehensive evaluation of RBC, WBC, and platelets',
    specimenType: 'BLOOD',
    collectionMethod: 'Venipuncture into EDTA lavender top tube',
    preparationInstructions: 'Fasting not required',
    containerRequirements: 'EDTA Vacutainer 3ml',
    fastingRequirement: false,
    expectedTurnaroundTime: '6 hours',
    price: 350,
    isActive: true,
    performingDepartment: 'Hematology Dept',
    parameters: [
      {
        parameterName: 'Hemoglobin',
        parameterCode: 'HGB',
        dataType: 'NUMERIC',
        unit: 'g/dL',
        decimalPrecision: 1,
        referenceRanges: [
          {
            gender: 'MALE',
            normalMin: 13.5,
            normalMax: 17.5,
            criticalLow: 7.0,
            criticalHigh: 20.0,
            unit: 'g/dL',
            version: 1,
            isActive: true,
          },
        ],
        isRequired: true,
        displayOrder: 1,
        isActive: true,
      },
    ],
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    toJSON: vi.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  const mockOrderId = new Types.ObjectId().toString();
  const mockLabOrderDoc: any = {
    _id: new Types.ObjectId(mockOrderId),
    id: mockOrderId,
    orderNumber: 'ORD-2026-9901',
    patientId: new Types.ObjectId(patientUserId),
    orderedBy: new Types.ObjectId(doctorUserId),
    laboratoryId: new Types.ObjectId(labAUserId),
    tests: [
      {
        testCode: 'CBC-001',
        testName: 'Complete Blood Count (CBC)',
        category: 'HEMATOLOGY',
        specimenType: 'BLOOD',
        instructions: 'Routine health screening',
      },
    ],
    testAssignments: [],
    status: 'ORDERED',
    priority: 'ROUTINE',
    collectionStatus: 'PENDING',
    orderedAt: new Date(),
    statusHistory: [],
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    toJSON: vi.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  const mockSampleId = new Types.ObjectId().toString();
  const mockBarcode = 'BC128-SMP-2026-9901-XYZ';
  const mockLabSampleDoc: any = {
    _id: new Types.ObjectId(mockSampleId),
    id: mockSampleId,
    sampleNumber: 'SMP-2026-0001',
    barcode: mockBarcode,
    orderId: new Types.ObjectId(mockOrderId),
    orderNumber: 'ORD-2026-9901',
    laboratoryId: mockLabAProfileId,
    patientId: new Types.ObjectId(patientUserId),
    testCodes: ['CBC-001'],
    specimenType: 'BLOOD',
    collectionMethod: 'Venipuncture',
    containerType: 'EDTA tube',
    status: 'COLLECTED',
    collectedAt: new Date(),
    collectedById: new Types.ObjectId(labAUserId),
    collectedByName: 'HealthBridge Central Diagnostic Laboratory',
    events: [
      {
        eventType: 'REGISTERED',
        newStatus: 'COLLECTION_PENDING',
        actorId: new Types.ObjectId(labAUserId),
        actorName: 'HealthBridge Central Diagnostic Laboratory',
        timestamp: new Date(),
      },
      {
        eventType: 'COLLECTED',
        previousStatus: 'COLLECTION_PENDING',
        newStatus: 'COLLECTED',
        actorId: new Types.ObjectId(labAUserId),
        actorName: 'HealthBridge Central Diagnostic Laboratory',
        timestamp: new Date(),
      },
    ],
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    toJSON: vi.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  const mockCenterId = new Types.ObjectId().toString();
  const mockCenterDoc: any = {
    _id: new Types.ObjectId(mockCenterId),
    id: mockCenterId,
    laboratoryId: mockLabAProfileId,
    name: 'South Extension Collection Center',
    address: {
      street: '45 Ring Road',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110049',
      country: 'India',
    },
    contactPhone: '9811445566',
    contactEmail: 'southex@healthbridge-labs.in',
    isActive: true,
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    toJSON: vi.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  function createQueryMock(result: any) {
    const q: any = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(result),
      exec: vi.fn().mockResolvedValue(result),
      then: (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject),
      catch: (reject: any) => Promise.resolve(result).catch(reject),
    };
    if (result && typeof result === 'object') {
      Object.assign(q, result);
    }
    return q;
  }

  beforeEach(() => {
    vi.restoreAllMocks();

    mockLabOrderDoc.status = 'ORDERED';
    mockLabOrderDoc.collectionStatus = 'PENDING';
    mockLabOrderDoc.testAssignments = [];
    mockLabOrderDoc.rejectionReasonCode = undefined;
    mockLabOrderDoc.rejectionReason = undefined;
    mockLabOrderDoc.clarificationNotes = undefined;

    mockLabSampleDoc.status = 'COLLECTED';
    mockLabSampleDoc.recollectionRequested = false;

    // Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === labAUserId) return Promise.resolve(mockLabAUser);
      if (idStr === labBUserId) return Promise.resolve(mockLabBUser);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUser);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser);
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser);
      return Promise.resolve(null);
    }) as any);

    // Mock LaboratoryProfileModel
    vi.spyOn(LaboratoryProfileModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter.userId?.toString();
      if (uId === labAUserId) return Promise.resolve(mockLabAProfile);
      if (uId === labBUserId) {
        return Promise.resolve({
          ...mockLabAProfile,
          _id: mockLabBProfileId,
          userId: new Types.ObjectId(labBUserId),
          laboratoryName: 'Metropolis Diagnostics Center',
          laboratoryLicenseNumber: 'LAB-DEL-2024-55443',
          save: vi.fn().mockImplementation(function (this: any) {
            return Promise.resolve(this);
          }),
        });
      }
      return Promise.resolve(null);
    }) as any);

    // Mock AuditLogModel
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, 'find').mockImplementation((() => createQueryMock([])) as any);

    // Mock notificationService
    vi.spyOn(notificationService, 'publishEvent').mockResolvedValue(true as any);

    // Default LabTestModel mocks
    vi.spyOn(LabTestModel, 'find').mockImplementation((() => createQueryMock([mockLabTestDoc])) as any);
    vi.spyOn(LabTestModel, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(LabTestModel, 'aggregate').mockResolvedValue([{ _id: 'HEMATOLOGY', count: 1 }]);
    vi.spyOn(LabTestModel, 'findOne').mockImplementation(((filter: any) => {
      if (filter.testCode === 'CBC-DUPLICATE') return Promise.resolve(mockLabTestDoc);
      if (filter._id?.toString() === mockTestId) {
        if (filter.laboratoryId && filter.laboratoryId.toString() !== mockLabAProfileId.toString()) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockLabTestDoc);
      }
      return Promise.resolve(null);
    }) as any);
    vi.spyOn(LabTestModel, 'create').mockImplementation(((data: any) =>
      Promise.resolve({
        ...mockLabTestDoc,
        ...data,
        _id: new Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
        toJSON: function () {
          return { ...this };
        },
      })
    ) as any);
    vi.spyOn(LabTestModel, 'deleteOne').mockResolvedValue({ acknowledged: true, deletedCount: 1 } as any);

    // Default LaboratoryOrderModel mocks
    vi.spyOn(LaboratoryOrderModel, 'find').mockImplementation((() =>
      createQueryMock([
        {
          ...mockLabOrderDoc,
          patientId: mockPatientUser,
          orderedBy: mockDoctorUser,
        },
      ])
    ) as any);
    vi.spyOn(LaboratoryOrderModel, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(LaboratoryOrderModel, 'findById').mockImplementation(((id: any) => {
      if (id?.toString() === mockOrderId) {
        mockLabOrderDoc.patientId = mockPatientUser;
        mockLabOrderDoc.orderedBy = mockDoctorUser;
        return createQueryMock(mockLabOrderDoc);
      }
      return createQueryMock(null);
    }) as any);
    vi.spyOn(LaboratoryOrderModel, 'findByIdAndUpdate').mockResolvedValue(mockLabOrderDoc as any);

    // Default LabSampleModel mocks
    vi.spyOn(LabSampleModel, 'find').mockImplementation((() =>
      createQueryMock([{ ...mockLabSampleDoc, patientId: mockPatientUser }])
    ) as any);
    vi.spyOn(LabSampleModel, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(LabSampleModel, 'aggregate').mockResolvedValue([
      { _id: 'COLLECTED', count: 1 },
      { _id: 'ACCESSIONED', count: 1 },
    ]);
    vi.spyOn(LabSampleModel, 'findOne').mockImplementation(((filter: any) => {
      if (filter.barcode === mockBarcode) {
        if (filter.laboratoryId && filter.laboratoryId.toString() !== mockLabAProfileId.toString()) {
          return createQueryMock(null);
        }
        mockLabSampleDoc.patientId = mockPatientUser;
        return createQueryMock(mockLabSampleDoc);
      }
      if (filter._id?.toString() === mockSampleId) {
        if (filter.laboratoryId && filter.laboratoryId.toString() !== mockLabAProfileId.toString()) {
          return createQueryMock(null);
        }
        mockLabSampleDoc.patientId = mockPatientUser;
        return createQueryMock(mockLabSampleDoc);
      }
      return createQueryMock(null);
    }) as any);
    vi.spyOn(LabSampleModel, 'create').mockImplementation(((data: any) =>
      Promise.resolve({
        ...mockLabSampleDoc,
        ...data,
        _id: new Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
        toJSON: function () {
          return { ...this };
        },
      })
    ) as any);

    // Default CollectionCenterModel mocks
    vi.spyOn(CollectionCenterModel, 'find').mockImplementation((() => createQueryMock([mockCenterDoc])) as any);
    vi.spyOn(CollectionCenterModel, 'findOne').mockImplementation(((filter: any) => {
      if (filter.name === 'Duplicate Center') return Promise.resolve(mockCenterDoc);
      if (filter._id?.toString() === mockCenterId) return Promise.resolve(mockCenterDoc);
      return Promise.resolve(null);
    }) as any);
    vi.spyOn(CollectionCenterModel, 'create').mockImplementation(((data: any) =>
      Promise.resolve({
        ...mockCenterDoc,
        ...data,
        _id: new Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
        toJSON: function () {
          return { ...this };
        },
      })
    ) as any);
  });

  /* ==========================================================================
     1. RBAC & SECURITY BOUNDARY ENFORCEMENT
     ========================================================================== */
  describe('1. RBAC & Security Boundary Enforcement', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/laboratory/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject PATIENT role from laboratory endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/dashboard/summary')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject DOCTOR role from laboratory endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject PHARMACY role from laboratory endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/samples')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow LABORATORY role to access portal endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/dashboard/summary')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalActiveTests).toBe(1);
    });
  });

  /* ==========================================================================
     2. LABORATORY PROFILE & ZERO SELF-APPROVAL INVARIANT
     ========================================================================== */
  describe('2. Laboratory Profile & Zero Self-Approval Invariant', () => {
    it('should retrieve laboratory profile with accreditation details', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/profile')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.laboratoryLicenseNumber).toBe('LAB-DEL-2024-99881');
      expect(res.body.data.accreditationInfo.nablAccredited).toBe(true);
    });

    it('should update permitted profile fields (name, phone, website)', async () => {
      const res = await request(app)
        .patch('/api/v1/laboratory/profile')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          laboratoryName: 'HealthBridge Advanced Diagnostics',
          contactPhone: '9811889900',
          websiteUrl: 'https://advanced-labs.healthbridge.in',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should STRICTLY REJECT self-approval of verificationStatus (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/v1/laboratory/profile')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          verificationStatus: 'VERIFIED',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Self-approval');
    });

    it('should upload statutory licensing verification document', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/profile/documents')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          documentType: 'NABL_ACCREDITATION',
          documentNumber: 'NABL-MC-5544',
          documentUrl: 'https://storage.healthbridge.in/docs/nabl-cert.pdf',
          fileName: 'NABL_Accreditation_Certificate.pdf',
          fileSize: 1024 * 500,
          mimeType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documentType).toBe('NABL_ACCREDITATION');
    });
  });

  /* ==========================================================================
     3. DIAGNOSTIC TEST CATALOGUE MANAGEMENT
     ========================================================================== */
  describe('3. Diagnostic Test Catalogue Management', () => {
    it('should create a diagnostic test in the laboratory catalogue', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/tests')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          testName: 'Lipid Profile Screen',
          testCode: 'LIPID-001',
          category: 'BIOCHEMISTRY',
          description: 'Measures cholesterol, triglycerides, HDL, and LDL',
          specimenType: 'SERUM',
          collectionMethod: 'Venipuncture into SST gold top tube',
          fastingRequirement: true,
          fastingDurationHours: 12,
          expectedTurnaroundTime: '12 hours',
          price: 650,
          isActive: true,
          performingDepartment: 'Clinical Biochemistry',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testCode).toBe('LIPID-001');
    });

    it('should reject duplicate testCode within the laboratory scope with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/tests')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          testName: 'Duplicate Test',
          testCode: 'CBC-DUPLICATE',
          category: 'HEMATOLOGY',
          specimenType: 'BLOOD',
          expectedTurnaroundTime: '6 hours',
          price: 300,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should list diagnostic tests with category and search filters', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/tests?category=HEMATOLOGY&page=1&limit=10')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should retrieve a single diagnostic test by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/tests/${mockTestId}`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testCode).toBe('CBC-001');
    });

    it('should toggle active availability of a test', async () => {
      const res = await request(app)
        .patch(`/api/v1/laboratory/tests/${mockTestId}/status`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  /* ==========================================================================
     4. LABORATORY ORDER REVIEW & TEST ASSIGNMENT
     ========================================================================== */
  describe('4. Laboratory Order Review & Test Assignment', () => {
    it('should list accessible laboratory orders with status filters', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/orders?status=ORDERED&page=1&limit=10')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].orderNumber).toBe('ORD-2026-9901');
    });

    it('should retrieve single order details with restricted patient identifier and requested tests', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/orders/${mockOrderId}`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tests[0].testCode).toBe('CBC-001');
      expect(res.body.data.patient.name).toBe('Aarav Patel');
    });

    it('should accept a valid laboratory order and transition status to ACCEPTED', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/orders/${mockOrderId}/accept`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ notes: 'Order verified and accepted by Hematology Lab' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLabOrderDoc.status).toBe('ACCEPTED');
      expect(mockLabOrderDoc.testAssignments.length).toBeGreaterThan(0);
      expect(notificationService.publishEvent).toHaveBeenCalled();
    });

    it('should reject a laboratory order with mandatory reason code & explanation', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/orders/${mockOrderId}/reject`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          reasonCode: 'SPECIMEN_REQUIREMENT_UNSUPPORTED',
          reason: 'Facility does not currently have refrigerated centrifuge for specialized separation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLabOrderDoc.status).toBe('REJECTED');
      expect(mockLabOrderDoc.rejectionReasonCode).toBe('SPECIMEN_REQUIREMENT_UNSUPPORTED');
    });

    it('should request clarification from ordering physician without altering clinical instructions', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/orders/${mockOrderId}/clarification`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          notes: 'Please clarify whether patient is on anticoagulant therapy before performing coagulation screen',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLabOrderDoc.status).toBe('CLARIFICATION_REQUESTED');
      expect(mockLabOrderDoc.clarificationNotes).toContain('anticoagulant therapy');
    });

    it('should assign a test to an internal department and technician', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/orders/${mockOrderId}/assign-tests`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          testCode: 'CBC-001',
          department: 'Hematology Department',
          priority: 'URGENT',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLabOrderDoc.testAssignments[0].department).toBe('Hematology Department');
    });

    it('should reject assigning an unrequested test code to the order', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/orders/${mockOrderId}/assign-tests`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          testCode: 'UNREQUESTED-TEST-999',
          department: 'Microbiology',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('unrequested test code');
    });

    it('should resolve specimen and preparation requirements from test catalogue', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/orders/${mockOrderId}/specimen-requirements`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].testCode).toBe('CBC-001');
      expect(res.body.data[0].specimenType).toBe('BLOOD');
    });
  });

  /* ==========================================================================
     5. SAMPLE COLLECTION & BARCODE GENERATION
     ========================================================================== */
  describe('5. Sample Collection & Barcode Generation', () => {
    it('should register sample collection and generate unique opaque barcode', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/samples/collect')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          orderId: mockOrderId,
          specimenType: 'BLOOD',
          testCodes: ['CBC-001'],
          collectionMethod: 'Venipuncture',
          containerType: 'EDTA Vacutainer',
          notes: 'Drawn from left antecubital vein without complications',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sampleNumber).toContain('SMP-');
      expect(res.body.data.barcode).toContain('BC128-SMP-');
      expect(mockLabOrderDoc.collectionStatus).toBe('COLLECTED');
    });

    it('should retrieve printable sample label containing only minimal operational data', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/samples/${mockSampleId}/label`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.barcode).toBe(mockBarcode);
      expect(res.body.data.specimenType).toBe('BLOOD');
      // Must not contain clinical diagnosis or doctor prescription text
      expect(res.body.data.diagnosis).toBeUndefined();
      expect(res.body.data.clinicalNotes).toBeUndefined();
    });
  });

  /* ==========================================================================
     6. BARCODE RESOLUTION, SAMPLE ACCESSIONING & REJECTION
     ========================================================================== */
  describe('6. Barcode Resolution, Accessioning & Rejection', () => {
    it('should resolve sample by scanning unique barcode', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/samples/barcode/${mockBarcode}`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sampleNumber).toBe('SMP-2026-0001');
    });

    it('should reject invalid or non-existent barcode with 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/samples/barcode/INVALID-BARCODE-999')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should accession received sample into laboratory workflow', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/samples/${mockSampleId}/receive`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          barcode: mockBarcode,
          notes: 'Sample integrity verified. Specimen accessioned for automated cell counting.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLabSampleDoc.status).toBe('ACCESSIONED');
      expect(mockLabSampleDoc.events.some((e: any) => e.eventType === 'ACCESSIONED')).toBe(true);
    });

    it('should perform controlled sample rejection with reason code & recollection request', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/samples/${mockSampleId}/reject`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          reasonCode: 'INSUFFICIENT_QUANTITY',
          explanation: 'Specimen volume below minimum 2ml required for complete automated analysis',
          requestRecollection: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLabSampleDoc.status).toBe('REJECTED');
      expect(mockLabSampleDoc.recollectionRequested).toBe(true);
      expect(notificationService.publishEvent).toHaveBeenCalled();
    });

    it('should retrieve complete immutable sample timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/samples/${mockSampleId}/timeline`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should retrieve sample summary metrics across statuses', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/samples/summary')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collected).toBe(1);
      expect(res.body.data.accessioned).toBe(1);
    });
  });

  /* ==========================================================================
     7. COLLECTION CENTER FOUNDATION
     ========================================================================== */
  describe('7. Collection Center Management Foundation', () => {
    it('should register a new collection center for the laboratory', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/collection-centers')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          name: 'Connaught Place Phlebotomy Center',
          address: {
            street: '18 Barakhamba Road',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            country: 'India',
          },
          contactPhone: '9811332211',
          contactEmail: 'cp.center@healthbridge-labs.in',
          operatingHours: '07:00 - 19:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Connaught Place Phlebotomy Center');
    });

    it('should list collection centers belonging to the laboratory', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/collection-centers')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].name).toBe('South Extension Collection Center');
    });
  });

  /* ==========================================================================
     8. CROSS-LABORATORY TENANT ISOLATION
     ========================================================================== */
  describe('8. Cross-Laboratory Tenant Isolation', () => {
    it('should prevent Laboratory B from accepting or modifying Laboratory A orders', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/orders/${mockOrderId}/accept`)
        .set('Authorization', `Bearer ${labBToken}`)
        .send({ notes: 'Tampering attempt by Lab B' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access forbidden');
    });

    it('should prevent Laboratory B from accessing Laboratory A samples by barcode', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/samples/barcode/${mockBarcode}`)
        .set('Authorization', `Bearer ${labBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should prevent Laboratory B from reading Laboratory A test catalogue entries', async () => {
      const res = await request(app)
        .get(`/api/v1/laboratory/tests/${mockTestId}`)
        .set('Authorization', `Bearer ${labBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
