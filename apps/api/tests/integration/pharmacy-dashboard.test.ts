import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  PharmacyProfileModel,
  PharmacyInventoryModel,
  PharmacyOrderModel,
  PrescriptionModel,
  PatientProfileModel,
  PharmacyInventoryTransactionModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Pharmacy Dashboard, Profile, Inventory & Prescription Queue Tests (Day 5 Task 01)', () => {
  const app = createApp();

  const pharmacyUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.delhi@healthbridge.in',
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

  const mockPharmacyUser = {
    _id: new Types.ObjectId(pharmacyUserId),
    id: pharmacyUserId,
    name: 'Apollo Pharmacy — Connaught Place',
    email: 'apollo.delhi@healthbridge.in',
    phone: '9811223344',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockDoctorUser = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockPatientUser = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9876500000',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPharmacyProfile: any = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(pharmacyUserId),
    pharmacyName: 'Apollo Pharmacy CP',
    pharmacyLicenseNumber: 'DL-DEL-2024-99881',
    gstin: '07AAAAA0000A1Z5',
    issuingAuthority: 'Drugs Control Department, Govt of NCT of Delhi',
    verificationStatus: 'VERIFIED',
    contactEmail: 'apollo.delhi@healthbridge.in',
    contactPhone: '9811223344',
    description: 'Premier retail and clinical pharmacy dispensary',
    address: {
      line1: 'B-12, Inner Circle, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
    },
    openingTime: '08:00',
    closingTime: '23:00',
    is24Hours: false,
    weeklyAvailability: [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ],
    supportedServices: ['IN_STORE_PICKUP', 'HOME_DELIVERY', 'PRESCRIPTION_REFILL'],
    documentSubmissionStatus: 'VERIFIED',
    documents: [],
    save: vi.fn().mockResolvedValue(true),
    toObject: vi.fn().mockImplementation(() => mockPharmacyProfile),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
  };

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      skip: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    };
    return q;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Reset profile fields
    mockPharmacyProfile.pharmacyLicenseNumber = 'DL-DEL-2024-99881';
    mockPharmacyProfile.verificationStatus = 'VERIFIED';
    mockPharmacyProfile.is24Hours = false;

    // 1. Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUser);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(UserModel, 'updateOne').mockResolvedValue({} as any);

    // 2. Mock PharmacyProfileModel
    vi.spyOn(PharmacyProfileModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter?.userId?.toString?.() || filter?.userId;
      if (uId === pharmacyUserId) {
        return createQueryMock(mockPharmacyProfile);
      }
      return createQueryMock(null);
    }) as any);

    // 3. Mock PharmacyInventoryModel
    vi.spyOn(PharmacyInventoryModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(PharmacyInventoryModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(PharmacyInventoryModel, 'countDocuments').mockResolvedValue(0);

    // 4. Mock PharmacyOrderModel
    vi.spyOn(PharmacyOrderModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(PharmacyOrderModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(PharmacyOrderModel, 'countDocuments').mockResolvedValue(0);

    // 5. Mock PrescriptionModel
    vi.spyOn(PrescriptionModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(PrescriptionModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(0);

    // 6. Mock PatientProfileModel
    vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() =>
      createQueryMock({
        gender: 'MALE',
        dateOfBirth: new Date('1995-05-15'),
      })
    );

    // 7. Mock AuditLogModel & TransactionModel
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);
  });

  // =========================================================================
  // 1. ROLE-BASED ACCESS CONTROL & BOUNDARY TESTS
  // =========================================================================
  describe('1. Role-Based Access Control (RBAC) & Boundary Enforcement', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/pharmacy/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject PATIENT role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/dashboard/summary')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should reject DOCTOR role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow authenticated PHARMACY role with 200 OK', async () => {
      vi.spyOn(PharmacyInventoryModel, 'countDocuments').mockResolvedValue(15);
      vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(3);
      vi.spyOn(PharmacyOrderModel, 'countDocuments').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/pharmacy/dashboard/summary')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalActiveMedicines).toBe(15);
    });
  });

  // =========================================================================
  // 2. PHARMACY PROFILE & IMMUTABILITY SECURITY
  // =========================================================================
  describe('2. Pharmacy Profile & Statutory Immutability', () => {
    it('should retrieve the authenticated pharmacy profile with user info', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/profile')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pharmacyName).toBe('Apollo Pharmacy CP');
      expect(res.body.data.pharmacyLicenseNumber).toBe('DL-DEL-2024-99881');
      expect(res.body.data.gstin).toBe('07AAAAA0000A1Z5');
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
    });

    it('should update permitted operational fields (hours, phone, services)', async () => {
      const res = await request(app)
        .patch('/api/v1/pharmacy/profile')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pharmacyName: 'Apollo Pharmacy — Flagship CP',
          phone: '9811223399',
          is24Hours: true,
          supportedServices: ['IN_STORE_PICKUP', 'HOME_DELIVERY', 'EMERGENCY_MEDICINE'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPharmacyProfile.save).toHaveBeenCalled();
      expect(mockPharmacyProfile.is24Hours).toBe(true);
    });

    it('should NOT allow self-modification of verificationStatus or drug license number', async () => {
      const res = await request(app)
        .patch('/api/v1/pharmacy/profile')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pharmacyName: 'Apollo Pharmacy Updated',
          verificationStatus: 'VERIFIED',
          pharmacyLicenseNumber: 'FORGED-LICENSE-1234',
        });

      expect(res.status).toBe(200);
      // License number and verificationStatus must remain unchanged
      expect(mockPharmacyProfile.pharmacyLicenseNumber).toBe('DL-DEL-2024-99881');
      expect(mockPharmacyProfile.verificationStatus).toBe('VERIFIED');
    });
  });

  // =========================================================================
  // 3. INVENTORY MANAGEMENT & SCOPING INTEGRITY
  // =========================================================================
  describe('3. Pharmacy Inventory Management & Scoping Integrity', () => {
    it('should strictly scope inventory items to the authenticated pharmacy', async () => {
      const mockItems = [
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationName: 'Amoxicillin Trihydrate',
          dosageForm: 'Capsule',
          strength: '500 mg',
          batchNumber: 'AMX-2026-A1',
          availableQuantity: 250,
          sellingPrice: 120,
          expiryDate: new Date('2027-01-01'),
          status: 'IN_STOCK',
        },
      ];

      const findSpy = vi.spyOn(PharmacyInventoryModel, 'find').mockImplementation(((filter: any) => {
        expect(filter.pharmacyId.toString()).toBe(pharmacyUserId);
        return createQueryMock(mockItems);
      }) as any);

      vi.spyOn(PharmacyInventoryModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(findSpy).toHaveBeenCalled();
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].medicationName).toBe('Amoxicillin Trihydrate');
    });

    it('should reject creating an inventory batch with a negative quantity', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          medicationName: 'Paracetamol',
          dosageForm: 'Tablet',
          strength: '650 mg',
          batchNumber: 'PCM-2026-001',
          availableQuantity: -10, // Invalid negative quantity
          sellingPrice: 35.5,
          expiryDate: '2026-12-31',
        });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject creating an inventory batch with a duplicate batch number (409 Conflict)', async () => {
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        batchNumber: 'DUP-2026-B1',
      } as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          medicationName: 'Azithromycin',
          dosageForm: 'Tablet',
          strength: '500 mg',
          batchNumber: 'DUP-2026-B1',
          availableQuantity: 50,
          sellingPrice: 110,
          expiryDate: '2026-12-31',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('should successfully create a new verified inventory batch', async () => {
      const newBatchId = new Types.ObjectId();
      const createdItem = {
        _id: newBatchId,
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        medicationName: 'Metformin Hydrochloride',
        dosageForm: 'Tablet',
        strength: '500 mg',
        batchNumber: 'MET-2026-M1',
        availableQuantity: 300,
        sellingPrice: 45.0,
        expiryDate: new Date('2027-06-30'),
        status: 'IN_STOCK',
      };

      vi.spyOn(PharmacyInventoryModel, 'create').mockResolvedValue(createdItem as any);
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockImplementation(((filter: any) => {
        if (filter?._id) {
          return createQueryMock(createdItem);
        }
        return createQueryMock(null);
      }) as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          medicationName: 'Metformin Hydrochloride',
          dosageForm: 'Tablet',
          strength: '500 mg',
          batchNumber: 'MET-2026-M1',
          availableQuantity: 300,
          sellingPrice: 45.0,
          expiryDate: '2027-06-30',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.batchNumber).toBe('MET-2026-M1');
    });
  });

  // =========================================================================
  // 4. PRESCRIPTION QUEUE & CLINICAL DATA INTEGRITY
  // =========================================================================
  describe('4. Prescription Queue & Clinical Data Integrity', () => {
    it('should list only active, finalized prescriptions (isDraft: false)', async () => {
      const mockPrescriptions = [
        {
          _id: new Types.ObjectId(),
          prescriptionNumber: 'RX-2026-0001',
          patientId: {
            _id: new Types.ObjectId(patientUserId),
            name: 'Aarav Patel',
            phone: '9876500000',
          },
          doctorId: {
            _id: new Types.ObjectId(doctorUserId),
            name: 'Dr. Vikram Sharma',
          },
          status: 'ACTIVE',
          isDraft: false,
          medications: [
            {
              medicationName: 'Amoxicillin',
              strength: '500 mg',
              dosageForm: 'Capsule',
              quantity: 15,
            },
          ],
          instructions: 'Take one capsule thrice daily after meals.',
          createdAt: new Date('2026-11-10'),
          validUntil: new Date('2026-12-10'),
        },
      ];

      const findSpy = vi.spyOn(PrescriptionModel, 'find').mockImplementation(((filter: any) => {
        expect(filter.isDraft).toBe(false);
        expect(filter.status).toBeDefined();
        return createQueryMock(mockPrescriptions);
      }) as any);

      vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/pharmacy/prescriptions')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(findSpy).toHaveBeenCalled();
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].prescriptionNumber).toBe('RX-2026-0001');
      expect(res.body.data.items[0].patientName).toBe('Aarav Patel');
    });

    it('should return read-only clinical instructions in prescription details', async () => {
      const rxId = new Types.ObjectId().toString();
      const mockRxDetail = {
        _id: new Types.ObjectId(rxId),
        prescriptionNumber: 'RX-2026-0001',
        patientId: {
          _id: new Types.ObjectId(patientUserId),
          name: 'Aarav Patel',
          phone: '9876500000',
        },
        doctorId: {
          _id: new Types.ObjectId(doctorUserId),
          name: 'Dr. Vikram Sharma',
        },
        status: 'ACTIVE',
        isDraft: false,
        medications: [
          {
            medicationName: 'Amoxicillin',
            strength: '500 mg',
            dosageForm: 'Capsule',
            dosage: '500 mg',
            frequency: 'TDS',
            duration: '5 days',
            quantity: 15,
            instructions: 'Take with warm water',
          },
        ],
        instructions: 'Do not consume dairy products within 2 hours of dosage.',
        createdAt: new Date('2026-11-10'),
        validUntil: new Date('2026-12-10'),
      };

      vi.spyOn(PrescriptionModel, 'findOne').mockImplementation(() =>
        createQueryMock(mockRxDetail)
      );

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${rxId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.instructions).toBe(
        'Do not consume dairy products within 2 hours of dosage.'
      );
      expect(res.body.data.medications[0].medicationName).toBe('Amoxicillin');
    });
  });

  // =========================================================================
  // 5. PHARMACY ORDERS FOUNDATION
  // =========================================================================
  describe('5. Pharmacy Orders Foundation & Financial Accuracy', () => {
    it('should create an order with accurate subtotal, tax and total amount', async () => {
      const orderId = new Types.ObjectId();
      const createdOrder = {
        _id: orderId,
        orderNumber: 'ORD-20261114-0001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        patientId: {
          _id: new Types.ObjectId(patientUserId),
          name: 'Aarav Patel',
          phone: '9876500000',
        },
        items: [
          {
            medicationName: 'Paracetamol',
            strength: '650 mg',
            dosageForm: 'Tablet',
            quantity: 10,
            unitPrice: 5.0,
            totalPrice: 50.0,
          },
        ],
        subtotal: 50.0,
        tax: 2.5, // 5% GST
        discount: 0,
        totalAmount: 52.5,
        fulfillmentType: 'IN_STORE_PICKUP',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(PharmacyOrderModel, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(PharmacyOrderModel, 'create').mockResolvedValue(createdOrder as any);
      vi.spyOn(PharmacyOrderModel, 'findOne').mockImplementation(() =>
        createQueryMock(createdOrder)
      );

      const res = await request(app)
        .post('/api/v1/pharmacy/orders')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          patientId: patientUserId,
          items: [
            {
              medicationName: 'Paracetamol',
              strength: '650 mg',
              dosageForm: 'Tablet',
              quantity: 10,
              unitPrice: 5.0,
            },
          ],
          fulfillmentType: 'IN_STORE_PICKUP',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAmount).toBe(52.5);
      expect(res.body.data.fulfillmentType).toBe('IN_STORE_PICKUP');
    });

    it('should reject invalid order status values', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/orders?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});
