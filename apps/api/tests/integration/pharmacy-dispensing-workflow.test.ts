import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  PharmacyProfileModel,
  PharmacyInventoryModel,
  PharmacyInventoryTransactionModel,
  PrescriptionModel,
  PatientProfileModel,
  DoctorProfileModel,
  DispensingRecordModel,
  NotificationModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Pharmacy Prescription Verification, Medicine Matching & Dispensing Integration Tests (Day 5 Task 03)', () => {
  const app = createApp();

  const pharmacyUserId = new Types.ObjectId().toString();
  const otherPharmacyUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.dispensing@healthbridge.in',
  } as any);

  const otherPharmacyToken = tokenService.generateAccessToken({
    _id: otherPharmacyUserId,
    role: 'PHARMACY',
    email: 'medplus.dispensing@healthbridge.in',
  } as any);

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.deshmukh@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.rohit@healthbridge.in',
  } as any);

  const mockPharmacyUser = {
    _id: new Types.ObjectId(pharmacyUserId),
    id: pharmacyUserId,
    name: 'Apollo Pharmacy - Koramangala',
    email: 'apollo.dispensing@healthbridge.in',
    phone: '9845012345',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockOtherPharmacyUser = {
    _id: new Types.ObjectId(otherPharmacyUserId),
    id: otherPharmacyUserId,
    name: 'MedPlus Pharmacy - Indiranagar',
    email: 'medplus.dispensing@healthbridge.in',
    phone: '9845099999',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
  };

  const mockDoctorUser = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Suresh Deshmukh',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockPatientUser = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Rohit Verma',
    phone: '9876543210',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPharmacyProfile = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(pharmacyUserId),
    pharmacyName: 'Apollo Pharmacy - Koramangala',
    pharmacyLicenseNumber: 'KA-B2-192837',
    gstin: '29ABCDE1234F1Z5',
    address: {
      line1: '80 Feet Road, 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560034',
      country: 'India',
    },
  };

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      skip: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockResolvedValue(data),
      exec: vi.fn().mockResolvedValue(data),
      then: (resolve: any) => Promise.resolve(data).then(resolve),
    };
    return q;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock user lookup
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser as any);
      if (idStr === otherPharmacyUserId) return Promise.resolve(mockOtherPharmacyUser as any);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUser as any);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser as any);
      return Promise.resolve(null);
    }) as any);

    // Mock profile lookups
    vi.spyOn(PharmacyProfileModel, 'findOne').mockResolvedValue(mockPharmacyProfile as any);
    vi.spyOn(DoctorProfileModel, 'findOne').mockReturnValue(
      createQueryMock({
        userId: new Types.ObjectId(doctorUserId),
        registrationNumber: 'MCI-1994-04921',
        specialization: ['Cardiology'],
      }) as any
    );
    vi.spyOn(PatientProfileModel, 'findOne').mockReturnValue(
      createQueryMock({
        userId: new Types.ObjectId(patientUserId),
        gender: 'MALE',
        dateOfBirth: new Date('1985-06-15'),
      }) as any
    );

    // Prevent timeouts on append-only models
    vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(PharmacyInventoryModel, 'findByIdAndUpdate').mockResolvedValue({} as any);
    vi.spyOn(PrescriptionModel, 'findByIdAndUpdate').mockResolvedValue({} as any);
  });

  /* ==========================================================================
     1. PRESCRIPTION VERIFICATION & AUTHENTICITY TESTS
     ========================================================================== */
  describe('Prescription Verification & Authenticity Checks', () => {
    const prescriptionId = new Types.ObjectId().toString();

    it('should successfully verify an active, non-expired doctor prescription', async () => {
      const mockPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-202611-0042',
        patientId: mockPatientUser,
        doctorId: mockDoctorUser,
        facilityId: { _id: new Types.ObjectId(), name: 'Apollo Hospital' },
        issuedAt: new Date(),
        validUntil: new Date(Date.now() + 15 * 86400000), // 15 days in future
        status: 'ACTIVE',
        isDraft: false,
        instructions: 'Take medicines after meals with warm water.',
        medications: [
          {
            _id: new Types.ObjectId(),
            name: 'Paracetamol 650mg',
            genericName: 'Paracetamol',
            strength: '650mg',
            dosageForm: 'Tablet',
            dosage: '1 tab',
            frequency: '1-0-1',
            duration: '5 days',
            quantity: 10,
            instructions: 'After food',
          },
        ],
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${prescriptionId}/verify`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prescriptionNumber).toBe('RX-202611-0042');
      expect(res.body.data.isEligibleForDispensing).toBe(true);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.verificationChecks.isNotDraft).toBe(true);
      expect(res.body.data.verificationChecks.notExpired).toBe(true);
      expect(res.body.data.verificationChecks.doctorExists).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].remainingQuantity).toBe(10);
    });

    it('should reject prescription in draft status as ineligible for dispensing', async () => {
      const draftPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-DRAFT-001',
        patientId: mockPatientUser,
        doctorId: mockDoctorUser,
        validUntil: new Date(Date.now() + 86400000),
        status: 'DRAFT',
        isDraft: true,
        medications: [{ name: 'Amoxicillin 500mg', quantity: 15 }],
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(draftPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${prescriptionId}/verify`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligibleForDispensing).toBe(false);
      expect(res.body.data.verificationChecks.isNotDraft).toBe(false);
      expect(res.body.data.verificationErrors).toContain(
        'Prescription is still in draft state and has not been issued.'
      );
    });

    it('should reject expired prescription as EXPIRED status', async () => {
      const expiredPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-EXPIRED-001',
        patientId: mockPatientUser,
        doctorId: mockDoctorUser,
        validUntil: new Date(Date.now() - 5 * 86400000), // 5 days ago
        status: 'ACTIVE',
        isDraft: false,
        medications: [{ name: 'Cetirizine 10mg', quantity: 10 }],
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(expiredPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${prescriptionId}/verify`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligibleForDispensing).toBe(false);
      expect(res.body.data.verificationStatus).toBe('EXPIRED');
      expect(res.body.data.verificationChecks.notExpired).toBe(false);
    });

    it('should return 404 for a non-existent prescription ID', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(createQueryMock(null) as any);

      const randomId = new Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${randomId}/verify`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. MEDICINE MATCHING ENGINE & FEFO BATCH RECOMMENDATION
     ========================================================================== */
  describe('Medicine Matching Engine & FEFO Batch Recommendation', () => {
    const prescriptionId = new Types.ObjectId().toString();
    const medId = new Types.ObjectId().toString();

    it('should match inventory with EXACT_MATCH and suggest earliest expiry batch (FEFO)', async () => {
      const mockPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-FEFO-001',
        isDraft: false,
        medications: [
          {
            _id: new Types.ObjectId(medId),
            name: 'Metformin 500mg',
            genericName: 'Metformin Hydrochloride',
            strength: '500mg',
            dosageForm: 'Tablet',
            quantity: 30,
          },
        ],
      };

      // Candidate batches: batch 1 expires in 2 months (FEFO suggested), batch 2 expires in 12 months
      const batch1 = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        medicationName: 'Metformin 500mg',
        strength: '500mg',
        dosageForm: 'Tablet',
        batchNumber: 'MET-2026-01',
        availableQuantity: 50,
        expiryDate: new Date(Date.now() + 60 * 86400000),
        sellingPrice: 4.5,
        status: 'IN_STOCK',
        isQuarantined: false,
      };

      const batch2 = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        medicationName: 'Metformin 500mg',
        strength: '500mg',
        dosageForm: 'Tablet',
        batchNumber: 'MET-2026-02',
        availableQuantity: 100,
        expiryDate: new Date(Date.now() + 365 * 86400000),
        sellingPrice: 4.5,
        status: 'IN_STOCK',
        isQuarantined: false,
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(PharmacyInventoryModel, 'find').mockReturnValue(
        createQueryMock([batch1, batch2]) as any
      );

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${prescriptionId}/match-inventory`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);

      const match = res.body.data[0];
      expect(match.matchStatus).toBe('EXACT_MATCH');
      expect(match.candidateBatches).toHaveLength(2);
      expect(match.suggestedBatch?.batchNumber).toBe('MET-2026-01');
      expect(match.candidateBatches[0].isFefoSuggested).toBe(true);
      expect(match.candidateBatches[1].isFefoSuggested).toBe(false);
    });

    it('should return INSUFFICIENT_STOCK when total available quantity is less than remaining prescribed', async () => {
      const mockPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        medications: [{ _id: new Types.ObjectId(medId), name: 'Azithromycin 500mg', quantity: 20 }],
      };

      const lowStockBatch = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        medicationName: 'Azithromycin 500mg',
        strength: '500mg',
        dosageForm: 'Tablet',
        batchNumber: 'AZI-LOW',
        availableQuantity: 5, // only 5 available, 20 needed
        expiryDate: new Date(Date.now() + 180 * 86400000),
        sellingPrice: 18,
        status: 'LOW_STOCK',
        isQuarantined: false,
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(PharmacyInventoryModel, 'find').mockReturnValue(
        createQueryMock([lowStockBatch]) as any
      );

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${prescriptionId}/match-inventory`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].matchStatus).toBe('INSUFFICIENT_STOCK');
      expect(res.body.data[0].matchMessage).toContain('only 5 units available for 20 remaining');
    });

    it('should return NO_MATCH when pharmacy has no matching medicine in inventory', async () => {
      const mockPrescription = {
        _id: new Types.ObjectId(prescriptionId),
        medications: [{ _id: new Types.ObjectId(medId), name: 'RareMed 100mg', quantity: 10 }],
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(PharmacyInventoryModel, 'find').mockReturnValue(createQueryMock([]) as any);

      const res = await request(app)
        .get(`/api/v1/pharmacy/prescriptions/${prescriptionId}/match-inventory`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].matchStatus).toBe('NO_MATCH');
    });
  });

  /* ==========================================================================
     3. PRESCRIPTION DISPENSING WORKFLOW & ATOMIC LEDGER EXECUTION
     ========================================================================== */
  describe('Prescription Dispensing Workflow & Stock Deduction', () => {
    const prescriptionId = new Types.ObjectId().toString();
    const medId = new Types.ObjectId().toString();
    const inventoryId = new Types.ObjectId().toString();

    const mockPrescription = {
      _id: new Types.ObjectId(prescriptionId),
      prescriptionNumber: 'RX-DISPENSE-001',
      patientId: mockPatientUser,
      doctorId: mockDoctorUser,
      facilityId: { _id: new Types.ObjectId(), name: 'Apollo Clinic' },
      validUntil: new Date(Date.now() + 30 * 86400000),
      status: 'ACTIVE',
      isDraft: false,
      medications: [
        {
          _id: new Types.ObjectId(medId),
          name: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin',
          strength: '500mg',
          dosageForm: 'Capsule',
          quantity: 20,
        },
      ],
    };

    const mockInventoryBatch = {
      _id: new Types.ObjectId(inventoryId),
      pharmacyId: new Types.ObjectId(pharmacyUserId),
      medicationName: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      strength: '500mg',
      dosageForm: 'Capsule',
      batchNumber: 'AMX-2026-99',
      availableQuantity: 50,
      reorderLevel: 10,
      expiryDate: new Date(Date.now() + 180 * 86400000),
      sellingPrice: 12.5,
      status: 'IN_STOCK',
      isQuarantined: false,
    };

    it('should successfully dispense prescription, deduct inventory, and emit notification', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockInventoryBatch as any);
      vi.spyOn(PharmacyInventoryModel, 'findByIdAndUpdate').mockResolvedValue({} as any);
      vi.spyOn(PrescriptionModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const mockSavedRecord = {
        _id: new Types.ObjectId(),
        dispensingNumber: 'DSP-20261114-AB12CD',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        pharmacyName: 'Apollo Pharmacy - Koramangala',
        prescriptionId: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-DISPENSE-001',
        patientId: new Types.ObjectId(patientUserId),
        patientName: 'Rohit Verma',
        doctorId: new Types.ObjectId(doctorUserId),
        doctorName: 'Dr. Suresh Deshmukh',
        dispensedBy: new Types.ObjectId(pharmacyUserId),
        dispenserName: 'Apollo Pharmacy - Koramangala',
        dispensedAt: new Date(),
        dispensingStatus: 'FULLY_DISPENSED',
        items: [
          {
            prescriptionMedicationId: medId,
            inventoryId: new Types.ObjectId(inventoryId),
            medicationName: 'Amoxicillin 500mg',
            strength: '500mg',
            dosageForm: 'Capsule',
            batchNumber: 'AMX-2026-99',
            prescribedQuantity: 20,
            quantityDispensed: 20,
            remainingQuantity: 0,
            sellingPriceSnapshot: 12.5,
            itemTotal: 250,
            batchExpiryDate: mockInventoryBatch.expiryDate,
          },
        ],
        totalItems: 1,
        totalQuantityDispensed: 20,
        totalAmount: 250,
        createdAt: new Date(),
      };

      vi.spyOn(DispensingRecordModel, 'create').mockResolvedValue(mockSavedRecord as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId,
          items: [
            {
              prescriptionMedicationId: medId,
              inventoryId,
              quantityToDispense: 20,
            },
          ],
          notes: 'Standard course prescribed for 7 days.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dispensingStatus).toBe('FULLY_DISPENSED');
      expect(res.body.data.totalQuantityDispensed).toBe(20);
      expect(res.body.data.totalAmount).toBe(250);

      // Verify atomic inventory batch deduction called
      expect(PharmacyInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockInventoryBatch._id,
        expect.objectContaining({
          $inc: { availableQuantity: -20 },
        })
      );

      // Verify append-only transaction ledger created
      expect(PharmacyInventoryTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'STOCK_DISPENSED',
          quantity: 20,
          batchNumber: 'AMX-2026-99',
        })
      );

      // Verify patient in-app notification emitted
      expect(NotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockPrescription.patientId._id,
          type: 'PRESCRIPTION',
          title: 'Prescription Dispensed',
        })
      );
    });

    it('should support partial dispensing and maintain PARTIALLY_DISPENSED status', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockInventoryBatch as any);
      vi.spyOn(PharmacyInventoryModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const mockPartialRecord = {
        _id: new Types.ObjectId(),
        dispensingNumber: 'DSP-20261114-PARTIAL',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        pharmacyName: 'Apollo Pharmacy',
        prescriptionId: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-DISPENSE-001',
        patientId: new Types.ObjectId(patientUserId),
        patientName: 'Rohit Verma',
        doctorId: new Types.ObjectId(doctorUserId),
        doctorName: 'Dr. Suresh Deshmukh',
        dispensedBy: new Types.ObjectId(pharmacyUserId),
        dispenserName: 'Pharmacist',
        dispensedAt: new Date(),
        dispensingStatus: 'PARTIALLY_DISPENSED',
        items: [
          {
            prescriptionMedicationId: medId,
            inventoryId: new Types.ObjectId(inventoryId),
            medicationName: 'Amoxicillin 500mg',
            strength: '500mg',
            dosageForm: 'Capsule',
            batchNumber: 'AMX-2026-99',
            prescribedQuantity: 20,
            quantityDispensed: 10,
            remainingQuantity: 10,
            sellingPriceSnapshot: 12.5,
            itemTotal: 125,
            batchExpiryDate: mockInventoryBatch.expiryDate,
          },
        ],
        totalItems: 1,
        totalQuantityDispensed: 10,
        totalAmount: 125,
      };

      vi.spyOn(DispensingRecordModel, 'create').mockResolvedValue(mockPartialRecord as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId,
          items: [
            {
              prescriptionMedicationId: medId,
              inventoryId,
              quantityToDispense: 10, // Dispensing 10 out of 20
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dispensingStatus).toBe('PARTIALLY_DISPENSED');
      expect(res.body.data.totalQuantityDispensed).toBe(10);
    });

    it('should reject over-dispensing exceeding remaining prescribed quantity', async () => {
      // Suppose 15 units were already dispensed previously
      const previousDispensing = {
        prescriptionId: new Types.ObjectId(prescriptionId),
        dispensingStatus: 'PARTIALLY_DISPENSED',
        items: [{ prescriptionMedicationId: medId, quantityDispensed: 15 }],
      };

      vi.spyOn(PrescriptionModel, 'findById').mockReturnValue(
        createQueryMock(mockPrescription) as any
      );
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(
        createQueryMock([previousDispensing]) as any
      );

      // Remaining is 5 (20 - 15). Attempting to dispense 10 should be rejected
      const res = await request(app)
        .post('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId,
          items: [
            {
              prescriptionMedicationId: medId,
              inventoryId,
              quantityToDispense: 10,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('remaining prescribed quantity is 5');
    });

    it('should return existing record on duplicate idempotencyKey without double deduction', async () => {
      const idempotencyKey = 'idempotent-key-12345';
      const existingRecord = {
        _id: new Types.ObjectId(),
        dispensingNumber: 'DSP-EXISTING-001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        prescriptionId: new Types.ObjectId(prescriptionId),
        prescriptionNumber: 'RX-DISPENSE-001',
        patientId: new Types.ObjectId(patientUserId),
        patientName: 'Rohit Verma',
        doctorId: new Types.ObjectId(doctorUserId),
        doctorName: 'Dr. Suresh Deshmukh',
        dispensedBy: new Types.ObjectId(pharmacyUserId),
        dispenserName: 'Pharmacist',
        dispensedAt: new Date(),
        dispensingStatus: 'FULLY_DISPENSED',
        items: [],
        totalItems: 1,
        totalQuantityDispensed: 20,
        totalAmount: 250,
        idempotencyKey,
      };

      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(existingRecord as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId,
          idempotencyKey,
          items: [
            {
              prescriptionMedicationId: medId,
              inventoryId,
              quantityToDispense: 20,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dispensingNumber).toBe('DSP-EXISTING-001');
      // Ensure inventory wasn't modified again
      expect(PharmacyInventoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  /* ==========================================================================
     4. DISPENSING HISTORY, RECEIPT & CANCELLATION TESTS
     ========================================================================== */
  describe('Dispensing History, Receipts and Cancellation', () => {
    const recordId = new Types.ObjectId().toString();

    const mockDispensingRecord = {
      _id: new Types.ObjectId(recordId),
      dispensingNumber: 'DSP-20261114-XYZ789',
      pharmacyId: new Types.ObjectId(pharmacyUserId),
      pharmacyName: 'Apollo Pharmacy - Koramangala',
      pharmacyLicenseNumber: 'KA-B2-192837',
      pharmacyGstin: '29ABCDE1234F1Z5',
      prescriptionId: new Types.ObjectId(),
      prescriptionNumber: 'RX-999',
      patientId: new Types.ObjectId(patientUserId),
      patientName: 'Rohit Verma',
      doctorId: new Types.ObjectId(doctorUserId),
      doctorName: 'Dr. Suresh Deshmukh',
      dispensedBy: new Types.ObjectId(pharmacyUserId),
      dispenserName: 'Pharmacist',
      dispensedAt: new Date(),
      dispensingStatus: 'FULLY_DISPENSED',
      items: [
        {
          prescriptionMedicationId: 'med-1',
          inventoryId: new Types.ObjectId(),
          medicationName: 'Paracetamol 650mg',
          strength: '650mg',
          dosageForm: 'Tablet',
          batchNumber: 'PCM-01',
          prescribedQuantity: 10,
          quantityDispensed: 10,
          remainingQuantity: 0,
          sellingPriceSnapshot: 2.5,
          itemTotal: 25,
          batchExpiryDate: new Date(Date.now() + 100 * 86400000),
        },
      ],
      totalItems: 1,
      totalQuantityDispensed: 10,
      totalAmount: 25,
    };

    it('should list dispensing records scoped to the authenticated pharmacy', async () => {
      vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(
        createQueryMock([mockDispensingRecord]) as any
      );
      vi.spyOn(DispensingRecordModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].dispensingNumber).toBe('DSP-20261114-XYZ789');
    });

    it('should generate official CDSCO-compliant printable receipt payload', async () => {
      vi.spyOn(DispensingRecordModel, 'findOne').mockReturnValue(
        createQueryMock(mockDispensingRecord) as any
      );

      const res = await request(app)
        .get(`/api/v1/pharmacy/dispensing/${recordId}/receipt`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receiptNumber).toBe('RCP-DSP-20261114-XYZ789');
      expect(res.body.data.disclaimer).toContain('Drugs and Cosmetics Act, 1940 and CDSCO regulations');
      expect(res.body.data.disclaimer).toContain('not a replacement prescription');
    });

    it('should cancel dispensing record and restore stock to inventory batches', async () => {
      const mockRecordToCancel: any = {
        ...mockDispensingRecord,
        save: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(mockRecordToCancel);
      vi.spyOn(PharmacyInventoryModel, 'findById').mockResolvedValue({
        _id: mockDispensingRecord.items[0].inventoryId,
        availableQuantity: 40,
        batchNumber: 'PCM-01',
        status: 'IN_STOCK',
      } as any);
      vi.spyOn(PharmacyInventoryModel, 'findByIdAndUpdate').mockResolvedValue({} as any);
      vi.spyOn(PrescriptionModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/dispensing/${recordId}/cancel`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          reason: 'Patient cancelled pickup and medicines returned.',
          restoreToInventory: true,
          quarantineRestoredStock: false,
        });

      expect(res.status).toBe(200);
      expect(mockRecordToCancel.dispensingStatus).toBe('CANCELLED');
      expect(mockRecordToCancel.cancellationReason).toBe(
        'Patient cancelled pickup and medicines returned.'
      );
      expect(PharmacyInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockDispensingRecord.items[0].inventoryId,
        expect.objectContaining({
          $inc: { availableQuantity: 10 },
        })
      );
      expect(PharmacyInventoryTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'STOCK_ADJUSTED',
          quantity: 10,
        })
      );
    });
  });

  /* ==========================================================================
     5. RBAC & CROSS-TENANT ISOLATION TESTS
     ========================================================================== */
  describe('RBAC & Multi-Tenancy Protection', () => {
    it('should reject DOCTOR user from accessing pharmacy dispensing endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject PATIENT user from dispensing medications with 403', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/dispensing')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          prescriptionId: new Types.ObjectId().toString(),
          items: [],
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 when querying dispensing record belonging to another pharmacy', async () => {
      vi.spyOn(DispensingRecordModel, 'findOne').mockReturnValue(createQueryMock(null) as any);

      const foreignRecordId = new Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/pharmacy/dispensing/${foreignRecordId}`)
        .set('Authorization', `Bearer ${otherPharmacyToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
