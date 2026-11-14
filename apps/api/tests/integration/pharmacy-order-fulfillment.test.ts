import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  PharmacyProfileModel,
  PrescriptionModel,
  PharmacyOrderModel,
  DispensingRecordModel,
  NotificationModel,
  AuditLogModel,
} from '../../src/database/models';

describe('Pharmacy Order Management, Patient Tracking, Pickup & Fulfillment Integration Tests (Day 5 Task 05)', () => {
  const app = createApp();

  const pharmacyUserId = new Types.ObjectId().toString();
  const otherPharmacyUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const otherPatientUserId = new Types.ObjectId().toString();

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.orders@healthbridge.in',
  } as any);

  const otherPharmacyToken = tokenService.generateAccessToken({
    _id: otherPharmacyUserId,
    role: 'PHARMACY',
    email: 'medplus.orders@healthbridge.in',
  } as any);

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.deshmukh@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.arjun@healthbridge.in',
  } as any);

  const otherPatientToken = tokenService.generateAccessToken({
    _id: otherPatientUserId,
    role: 'PATIENT',
    email: 'patient.priya@healthbridge.in',
  } as any);

  const mockPharmacyUser = {
    _id: new Types.ObjectId(pharmacyUserId),
    id: pharmacyUserId,
    name: 'Apollo Pharmacy - Indiranagar',
    fullName: 'Apollo Pharmacy - Indiranagar',
    email: 'apollo.orders@healthbridge.in',
    phone: '9845012345',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockOtherPharmacyUser = {
    _id: new Types.ObjectId(otherPharmacyUserId),
    id: otherPharmacyUserId,
    name: 'MedPlus Pharmacy - Koramangala',
    fullName: 'MedPlus Pharmacy - Koramangala',
    email: 'medplus.orders@healthbridge.in',
    phone: '9845099999',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
  };

  const mockDoctorUser = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Suresh Deshmukh',
    fullName: 'Dr. Suresh Deshmukh',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockPatientUser = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Arjun Mehta',
    fullName: 'Arjun Mehta',
    phone: '9876543210',
    email: 'patient.arjun@healthbridge.in',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockOtherPatientUser = {
    _id: new Types.ObjectId(otherPatientUserId),
    id: otherPatientUserId,
    name: 'Priya Sharma',
    fullName: 'Priya Sharma',
    phone: '9876500000',
    email: 'patient.priya@healthbridge.in',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPharmacyProfile = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(pharmacyUserId),
    pharmacyName: 'Apollo Pharmacy - Indiranagar',
    pharmacyLicenseNumber: 'KA-B2-192837',
    gstin: '29ABCDE1234F1Z5',
    address: {
      line1: '100 Feet Road, HAL 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
    },
    contactPhone: '080-25251122',
    contactEmail: 'apollo.orders@healthbridge.in',
    operatingHours: '24/7',
    isOpen24Hours: true,
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

  const createMockOrderDoc = (overrides: Record<string, any> = {}) => {
    const orderId = overrides._id || new Types.ObjectId();
    const doc: any = {
      _id: orderId,
      id: orderId.toString(),
      orderNumber: 'ORD-20261114-0001',
      pharmacyId: new Types.ObjectId(pharmacyUserId),
      pharmacyName: 'Apollo Pharmacy - Indiranagar',
      patientId: new Types.ObjectId(patientUserId),
      patientName: 'Arjun Mehta',
      patientPhone: '9876543210',
      prescriptionId: new Types.ObjectId(),
      prescriptionNumber: 'RX-202611-1001',
      doctorId: new Types.ObjectId(doctorUserId),
      doctorName: 'Dr. Suresh Deshmukh',
      items: [
        {
          _id: new Types.ObjectId(),
          prescriptionMedicationId: new Types.ObjectId().toString(),
          medicationName: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin',
          brandName: 'Mox 500',
          strength: '500mg',
          dosageForm: 'Capsule',
          quantity: 10,
          requestedQuantity: 10,
          fulfilledQuantity: 0,
          remainingQuantity: 10,
          fulfillmentStatus: 'UNFULFILLED',
          unitPrice: 25,
          totalPrice: 250,
          instructions: '1 capsule three times daily for 5 days after food',
        },
      ],
      subtotal: 250,
      tax: 12.5,
      discount: 0,
      totalAmount: 262.5,
      fulfillmentType: 'IN_STORE_PICKUP',
      status: 'PENDING',
      notes: 'Please pack in child-resistant container',
      statusHistory: [
        {
          _id: new Types.ObjectId(),
          previousStatus: undefined,
          newStatus: 'PENDING',
          actorId: new Types.ObjectId(patientUserId),
          actorName: 'Arjun Mehta',
          actorRole: 'PATIENT',
          reason: 'Order created from doctor-issued prescription',
          timestamp: new Date(),
        },
      ],
      dispensingRecordIds: [],
      clarificationRequested: false,
      clarificationNotes: undefined,
      internalOperationalNotes: 'Cold chain storage required for amoxicillin',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };

    doc.save = vi.fn().mockImplementation(async () => doc);
    return doc;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser as any);
      if (idStr === otherPharmacyUserId) return Promise.resolve(mockOtherPharmacyUser as any);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUser as any);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser as any);
      if (idStr === otherPatientUserId) return Promise.resolve(mockOtherPatientUser as any);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(PharmacyProfileModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter?.userId?.toString();
      if (uId === pharmacyUserId) return Promise.resolve(mockPharmacyProfile as any);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  /* ==========================================================================
     1. ORDER CREATION FROM PRESCRIPTION TESTS
     ========================================================================== */
  describe('Order Creation from Prescription', () => {
    const validPrescriptionId = new Types.ObjectId().toString();

    const mockIssuedPrescription = {
      _id: new Types.ObjectId(validPrescriptionId),
      prescriptionNumber: 'RX-202611-1001',
      patientId: new Types.ObjectId(patientUserId),
      doctorId: new Types.ObjectId(doctorUserId),
      status: 'ISSUED',
      medications: [
        {
          _id: new Types.ObjectId(),
          name: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin Trihydrate',
          brandName: 'Mox 500',
          strength: '500mg',
          dosageForm: 'Capsule',
          quantity: 15,
          instructions: '1 cap TDS after food',
          frequency: '1-0-1',
          duration: '5 days',
        },
      ],
    };

    it('should successfully create an order from an issued prescription by pharmacy staff', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockResolvedValue(mockIssuedPrescription as any);
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(PharmacyOrderModel, 'countDocuments').mockResolvedValue(5);

      const createdOrderDoc = createMockOrderDoc({
        prescriptionId: mockIssuedPrescription._id,
        prescriptionNumber: mockIssuedPrescription.prescriptionNumber,
      });
      vi.spyOn(PharmacyOrderModel, 'create').mockResolvedValue(createdOrderDoc as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/orders/from-prescription')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId: validPrescriptionId,
          fulfillmentType: 'IN_STORE_PICKUP',
          notes: 'Customer requested 5pm pickup',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBe('ORD-20261114-0001');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].medicationName).toBe('Amoxicillin 500mg');
      expect(res.body.data.items[0].requestedQuantity).toBe(10);
      expect(NotificationModel.create).toHaveBeenCalled();
      expect(AuditLogModel.create).toHaveBeenCalled();
    });

    it('should successfully create an order from patient portal selecting an authorized pharmacy', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockResolvedValue(mockIssuedPrescription as any);
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(PharmacyOrderModel, 'countDocuments').mockResolvedValue(0);

      const createdDoc = createMockOrderDoc();
      vi.spyOn(PharmacyOrderModel, 'create').mockResolvedValue(createdDoc as any);

      const res = await request(app)
        .post('/api/v1/patients/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          prescriptionId: validPrescriptionId,
          pharmacyId: pharmacyUserId,
          fulfillmentType: 'IN_STORE_PICKUP',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should reject order creation if prescription does not exist', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/pharmacy/orders/from-prescription')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId: new Types.ObjectId().toString(),
          fulfillmentType: 'IN_STORE_PICKUP',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Prescription not found');
    });

    it('should reject order creation if prescription is in DRAFT status', async () => {
      const draftPrescription = {
        ...mockIssuedPrescription,
        status: 'DRAFT',
      };
      vi.spyOn(PrescriptionModel, 'findById').mockResolvedValue(draftPrescription as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/orders/from-prescription')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId: validPrescriptionId,
          fulfillmentType: 'IN_STORE_PICKUP',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot create order from prescription in status 'DRAFT'");
    });

    it('should prevent duplicate active order for same prescription and pharmacy', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockResolvedValue(mockIssuedPrescription as any);
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue({
        orderNumber: 'ORD-20261114-0099',
        status: 'ACCEPTED',
      } as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/orders/from-prescription')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId: validPrescriptionId,
          fulfillmentType: 'IN_STORE_PICKUP',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('An active order (ORD-20261114-0099) is already being processed');
    });

    it('should reject patient order creation if pharmacyId is missing', async () => {
      vi.spyOn(PrescriptionModel, 'findById').mockResolvedValue(mockIssuedPrescription as any);

      const res = await request(app)
        .post('/api/v1/patients/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          prescriptionId: validPrescriptionId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Pharmacy selection is required');
    });

    it('should reject malformed prescription ID with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/orders/from-prescription')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          prescriptionId: 'not-a-valid-mongo-id',
          fulfillmentType: 'IN_STORE_PICKUP',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. ORDER REVIEW & CLARIFICATION WORKFLOW
     ========================================================================== */
  describe('Order Review & Clarification Workflow', () => {
    const orderId = new Types.ObjectId().toString();

    it('should successfully accept order with operational notes and estimated readiness time', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'PENDING' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const readinessEta = new Date(Date.now() + 2 * 3600000).toISOString();
      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          action: 'ACCEPT',
          notes: 'Medications confirmed in stock. Packing begins shortly.',
          estimatedReadiness: readinessEta,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(orderDoc.save).toHaveBeenCalled();
      expect(orderDoc.statusHistory).toContainEqual(
        expect.objectContaining({ newStatus: 'ACCEPTED' })
      );
      expect(NotificationModel.create).toHaveBeenCalled();
    });

    it('should successfully reject order with mandatory reason code and explanation', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'PENDING' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          action: 'REJECT',
          reasonCode: 'STOCK_UNAVAILABLE',
          reason: 'Amoxicillin capsules currently out of stock from distributor',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
      expect(orderDoc.status).toBe('REJECTED');
      expect(orderDoc.save).toHaveBeenCalled();
    });

    it('should reject review when action is REJECT but reason explanation is omitted', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'PENDING' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          action: 'REJECT',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('rejection explanation is required');
    });

    it('should successfully log a clarification request and transition order to UNDER_REVIEW', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'PENDING' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/clarification`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          notes: 'Dosage instructions unclear. Awaiting confirmation from prescribing doctor.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UNDER_REVIEW');
      expect(orderDoc.clarificationRequested).toBe(true);
      expect(orderDoc.clarificationNotes).toContain('Dosage instructions unclear');
      expect(NotificationModel.create).toHaveBeenCalled();
    });

    it('should reject order review when order is not found', async () => {
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          action: 'ACCEPT',
          notes: 'Ready',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Order not found');
    });
  });

  /* ==========================================================================
     3. ORDER LIFECYCLE & STATE MACHINE STRICTNESS
     ========================================================================== */
  describe('Order Lifecycle & State Transitions', () => {
    const orderId = new Types.ObjectId().toString();

    it('should start processing when order is in ACCEPTED status', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'ACCEPTED' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/process`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PROCESSING');
      expect(orderDoc.status).toBe('PROCESSING');
      expect(orderDoc.save).toHaveBeenCalled();
    });

    it('should reject starting processing when order is still PENDING (must be ACCEPTED first)', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'PENDING' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/process`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid order status transition from 'PENDING' to 'PROCESSING'");
    });

    it('should reject transitions from terminal COMPLETED status', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'COMPLETED' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/process`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid order status transition from 'COMPLETED' to 'PROCESSING'");
    });

    it('should allow manually marking order READY_FOR_PICKUP with custom instructions', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId), status: 'PROCESSING' });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/ready-for-pickup`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pickupInstructions: 'Collect at Counter 3 with identity proof',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('READY_FOR_PICKUP');
      expect(orderDoc.pickupDetails?.pickupReference).toMatch(/^PKUP-[A-Z0-9]{6}$/);
      expect(orderDoc.pickupDetails?.pickupCodeHash).toBeDefined();
    });
  });

  /* ==========================================================================
     4. DISPENSING INTEGRATION & FULFILLMENT
     ========================================================================== */
  describe('Dispensing Integration & Fulfillment Updates', () => {
    const orderId = new Types.ObjectId().toString();
    const dispensingRecordId = new Types.ObjectId().toString();
    const prescriptionId = new Types.ObjectId();

    it('should link dispensing record and update partially fulfilled items', async () => {
      const medId = new Types.ObjectId().toString();
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        prescriptionId,
        status: 'PROCESSING',
        items: [
          {
            prescriptionMedicationId: medId,
            medicationName: 'Amoxicillin 500mg',
            requestedQuantity: 20,
            fulfilledQuantity: 0,
            remainingQuantity: 20,
            fulfillmentStatus: 'UNFULFILLED',
            unitPrice: 20,
            totalPrice: 400,
          },
        ],
      });

      const mockDispensing = {
        _id: new Types.ObjectId(dispensingRecordId),
        dispensingNumber: 'DSP-202611-0001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        prescriptionId,
        items: [
          {
            prescriptionMedicationId: medId,
            medicationName: 'Amoxicillin 500mg',
            quantityDispensed: 10,
            batchNumber: 'AMX-B101',
            inventoryId: new Types.ObjectId(),
          },
        ],
      };

      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(mockDispensing as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/fulfillment`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          dispensingRecordId,
          notes: 'First 10 tablets dispensed',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PARTIALLY_FULFILLED');
      expect(res.body.data.items[0].fulfilledQuantity).toBe(10);
      expect(res.body.data.items[0].remainingQuantity).toBe(10);
      expect(res.body.data.items[0].fulfillmentStatus).toBe('PARTIALLY_FULFILLED');
    });

    it('should transition to READY_FOR_PICKUP and generate pickup code when all items are fully dispensed', async () => {
      const medId = new Types.ObjectId().toString();
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        prescriptionId,
        status: 'PROCESSING',
        items: [
          {
            prescriptionMedicationId: medId,
            medicationName: 'Amoxicillin 500mg',
            requestedQuantity: 10,
            fulfilledQuantity: 0,
            remainingQuantity: 10,
            fulfillmentStatus: 'UNFULFILLED',
            unitPrice: 20,
            totalPrice: 200,
          },
        ],
      });

      const mockDispensing = {
        _id: new Types.ObjectId(dispensingRecordId),
        dispensingNumber: 'DSP-202611-0002',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        prescriptionId,
        items: [
          {
            prescriptionMedicationId: medId,
            medicationName: 'Amoxicillin 500mg',
            quantityDispensed: 10,
            batchNumber: 'AMX-B102',
            inventoryId: new Types.ObjectId(),
          },
        ],
      };

      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(mockDispensing as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/fulfillment`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          dispensingRecordId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('READY_FOR_PICKUP');
      expect(orderDoc.pickupDetails?.pickupReference).toBeDefined();
      expect(orderDoc.pickupDetails?.pickupCodeHash).toBeDefined();
    });

    it('should reject linking dispensing record belonging to another pharmacy', async () => {
      const orderDoc = createMockOrderDoc({ _id: new Types.ObjectId(orderId) });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/fulfillment`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          dispensingRecordId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Dispensing record not found or belongs to another pharmacy');
    });

    it('should reject linking dispensing record if prescription IDs do not match', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        prescriptionId: new Types.ObjectId(),
      });
      const mismatchDispensing = {
        _id: new Types.ObjectId(dispensingRecordId),
        prescriptionId: new Types.ObjectId(), // Different prescription
      };

      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);
      vi.spyOn(DispensingRecordModel, 'findOne').mockResolvedValue(mismatchDispensing as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/fulfillment`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          dispensingRecordId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not correspond to this order prescription');
    });
  });

  /* ==========================================================================
     5. PICKUP MANAGEMENT & ZERO-KNOWLEDGE VERIFICATION
     ========================================================================== */
  describe('Pickup Management & Zero-Knowledge Verification', () => {
    const orderId = new Types.ObjectId().toString();
    const correctPickupCode = 'PKUP-ABC123';
    const pickupHash = crypto.createHash('sha256').update(correctPickupCode).digest('hex');

    it('should successfully verify valid pickup code and complete handover', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'READY_FOR_PICKUP',
        pickupDetails: {
          pickupReference: correctPickupCode,
          pickupCodeHash: pickupHash,
          isVerified: false,
          verificationAttempts: 0,
          maxAttempts: 5,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/verify-pickup`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pickupCode: 'pkup-abc123', // Test case-insensitivity
          handoverNotes: 'Patient verified with government ID',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(orderDoc.pickupDetails.isVerified).toBe(true);
      expect(orderDoc.pickupDetails.collectedAt).toBeDefined();
      expect(orderDoc.pickupDetails.handoverNotes).toBe('Patient verified with government ID');
      expect(NotificationModel.create).toHaveBeenCalled();
    });

    it('should reject invalid pickup code and increment attempts count', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'READY_FOR_PICKUP',
        pickupDetails: {
          pickupReference: correctPickupCode,
          pickupCodeHash: pickupHash,
          isVerified: false,
          verificationAttempts: 1,
          maxAttempts: 5,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/verify-pickup`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pickupCode: 'PKUP-WRONG9',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid pickup verification code. 3 attempt(s) remaining.');
      expect(orderDoc.pickupDetails.verificationAttempts).toBe(2);
      expect(orderDoc.save).toHaveBeenCalled();
    });

    it('should lock out verification after 5 failed attempts (brute-force defense)', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'READY_FOR_PICKUP',
        pickupDetails: {
          pickupReference: correctPickupCode,
          pickupCodeHash: pickupHash,
          isVerified: false,
          verificationAttempts: 5,
          maxAttempts: 5,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/verify-pickup`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pickupCode: correctPickupCode, // Even correct code must be rejected when locked out
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Maximum pickup verification attempts exceeded');
    });

    it('should reject verification when order is not in READY_FOR_PICKUP status', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'PROCESSING',
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/verify-pickup`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pickupCode: 'PKUP-123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot perform pickup handover for order in status 'PROCESSING'");
    });

    it('should reject verification when pickup code has expired (> 7 days)', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'READY_FOR_PICKUP',
        pickupDetails: {
          pickupReference: correctPickupCode,
          pickupCodeHash: pickupHash,
          isVerified: false,
          verificationAttempts: 0,
          maxAttempts: 5,
          expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        },
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/verify-pickup`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          pickupCode: correctPickupCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Pickup verification reference has expired');
    });
  });

  /* ==========================================================================
     6. ORDER CANCELLATION RULES & STATE GUARDS
     ========================================================================== */
  describe('Order Cancellation Rules & State Guards', () => {
    const orderId = new Types.ObjectId().toString();

    it('should allow patient to cancel order in PENDING status', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'PENDING',
        patientId: new Types.ObjectId(patientUserId),
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/patients/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Ordered by mistake',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(orderDoc.save).toHaveBeenCalled();
    });

    it('should allow patient to cancel order in ACCEPTED status', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'ACCEPTED',
        patientId: new Types.ObjectId(patientUserId),
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/patients/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Traveling out of station',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should reject patient cancellation once order is in PROCESSING status', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'PROCESSING',
        patientId: new Types.ObjectId(patientUserId),
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/patients/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Changed mind',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot cancel order in status 'PROCESSING'");
    });

    it('should reject patient cancellation once order is in READY_FOR_PICKUP status', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'READY_FOR_PICKUP',
        patientId: new Types.ObjectId(patientUserId),
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/patients/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Cannot visit today',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot cancel order in status 'READY_FOR_PICKUP'");
    });

    it('should allow pharmacy to cancel order in PROCESSING status with explanation', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'PROCESSING',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          reason: 'Damaged vial during packaging and no replacement batch available',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should reject cancelling an already COMPLETED order after handover', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        status: 'COMPLETED',
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          reason: 'Patient wants return',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot cancel an order that has already been handed over and completed');
    });
  });

  /* ==========================================================================
     7. PATIENT ORDER TRACKING & PRIVACY CONTROLS
     ========================================================================== */
  describe('Patient Order Tracking & Privacy Controls', () => {
    const orderId = new Types.ObjectId().toString();

    it('should list orders belonging to the authenticated patient', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        patientId: new Types.ObjectId(patientUserId),
      });
      vi.spyOn(PharmacyOrderModel, 'find').mockReturnValue(createQueryMock([orderDoc]) as any);
      vi.spyOn(PharmacyOrderModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/patients/orders')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('should exclude internalOperationalNotes from patient order detail response (privacy protection)', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        patientId: new Types.ObjectId(patientUserId),
        internalOperationalNotes: 'Restricted pharmacist confidential comment',
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .get(`/api/v1/patients/orders/${orderId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.internalOperationalNotes).toBeUndefined();
    });

    it('should show pickupReference in patient order detail when status is READY_FOR_PICKUP', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        patientId: new Types.ObjectId(patientUserId),
        status: 'READY_FOR_PICKUP',
        pickupDetails: {
          pickupReference: 'PKUP-SEC999',
          isVerified: false,
          verificationAttempts: 0,
          maxAttempts: 5,
          expiresAt: new Date(Date.now() + 86400000),
          pickupInstructions: 'Present code at Counter 1',
        },
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .get(`/api/v1/patients/orders/${orderId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pickupDetails).toBeDefined();
      expect(res.body.data.pickupDetails.pickupReference).toBe('PKUP-SEC999');
    });

    it('should NOT disclose pickupReference to pharmacy staff before counter verification (zero knowledge)', async () => {
      const orderDoc = createMockOrderDoc({
        _id: new Types.ObjectId(orderId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        status: 'READY_FOR_PICKUP',
        pickupDetails: {
          pickupReference: 'PKUP-SECRET',
          pickupCodeHash: 'hash-value',
          isVerified: false,
          verificationAttempts: 0,
          maxAttempts: 5,
        },
      });
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(orderDoc as any);

      const res = await request(app)
        .get(`/api/v1/pharmacy/orders/${orderId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pickupDetails.pickupReference).toBeUndefined();
      expect(res.body.data.pickupDetails.isVerified).toBe(false);
    });
  });

  /* ==========================================================================
     8. MULTI-TENANCY & RBAC ACCESS GUARDS
     ========================================================================== */
  describe('Multi-Tenancy & Authorization Security', () => {
    const orderId = new Types.ObjectId().toString();

    it('should reject pharmacy attempting to view an order belonging to another pharmacy', async () => {
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/pharmacy/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherPharmacyToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Order not found');
    });

    it('should reject patient attempting to view another patient order', async () => {
      vi.spyOn(PharmacyOrderModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/patients/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Order not found');
    });

    it('should forbid doctor role from executing pharmacy order endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/pharmacy/orders/${orderId}/review`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          action: 'ACCEPT',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated requests (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/pharmacy/orders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     9. PHARMACY ORDER ANALYTICS & METRICS
     ========================================================================== */
  describe('Pharmacy Order Metrics & Analytics', () => {
    it('should compute status counts, revenue, and average turnaround time', async () => {
      const now = new Date();
      const mockCompletedOrder = {
        status: 'COMPLETED',
        totalAmount: 500,
        createdAt: new Date(now.getTime() - 3600000), // 60 mins ago
        updatedAt: now,
      };
      const mockTodayOrders = [
        mockCompletedOrder,
        {
          status: 'READY_FOR_PICKUP',
          totalAmount: 300,
          createdAt: now,
          updatedAt: now,
        },
      ];

      vi.spyOn(PharmacyOrderModel, 'countDocuments').mockImplementation(((filter: any) => {
        if (filter?.status === 'PENDING') return Promise.resolve(1);
        if (filter?.status === 'UNDER_REVIEW') return Promise.resolve(0);
        if (filter?.status === 'ACCEPTED') return Promise.resolve(0);
        if (filter?.status === 'PROCESSING') return Promise.resolve(0);
        if (filter?.status === 'PARTIALLY_FULFILLED') return Promise.resolve(0);
        if (filter?.status === 'READY_FOR_PICKUP') return Promise.resolve(1);
        if (filter?.status === 'REJECTED') return Promise.resolve(0);
        if (filter?.status === 'CANCELLED') return Promise.resolve(0);
        return Promise.resolve(3);
      }) as any);

      vi.spyOn(PharmacyOrderModel, 'find').mockImplementation(((filter: any) => {
        if (filter?.status === 'COMPLETED') {
          return createQueryMock([mockCompletedOrder]);
        }
        return createQueryMock(mockTodayOrders);
      }) as any);

      const res = await request(app)
        .get('/api/v1/pharmacy/orders/metrics')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalOrders).toBe(3);
      expect(res.body.data.completedCount).toBe(1);
      expect(res.body.data.readyForPickupCount).toBe(1);
      expect(res.body.data.pendingCount).toBe(1);
      expect(res.body.data.todayRevenue).toBe(800);
      expect(res.body.data.averageProcessingTimeHours).toBe(1);
    });
  });
});
