import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  PharmacyProfileModel,
  PharmacyInventoryModel,
  PharmacyInventoryTransactionModel,
  MedicationCatalogModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Complete Pharmacy Inventory Management System Integration Tests (Day 5 Task 02)', () => {
  const app = createApp();

  const pharmacyUserId = new Types.ObjectId().toString();
  const otherPharmacyUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'medplus.hyderabad@healthbridge.in',
  } as any);

  const otherPharmacyToken = tokenService.generateAccessToken({
    _id: otherPharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.mumbai@healthbridge.in',
  } as any);

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.deshmukh@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.priya@healthbridge.in',
  } as any);

  const mockPharmacyUser = {
    _id: new Types.ObjectId(pharmacyUserId),
    id: pharmacyUserId,
    name: 'MedPlus Pharmacy - Banjara Hills',
    email: 'medplus.hyderabad@healthbridge.in',
    phone: '9848011223',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockOtherPharmacyUser = {
    _id: new Types.ObjectId(otherPharmacyUserId),
    id: otherPharmacyUserId,
    name: 'Apollo Pharmacy - Bandra',
    email: 'apollo.mumbai@healthbridge.in',
    phone: '9820011223',
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
    name: 'Priya Sharma',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
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

    // 1. Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser);
      if (idStr === otherPharmacyUserId) return Promise.resolve(mockOtherPharmacyUser);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUser);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser);
      return Promise.resolve(null);
    }) as any);

    // 2. Mock AuditLogModel
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  // =========================================================================
  // 1. RBAC & TENANCY BOUNDARY TESTS
  // =========================================================================
  describe('1. RBAC & Multi-Tenancy Boundary Enforcement', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/pharmacy/inventory');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject DOCTOR role from pharmacy inventory with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should reject PATIENT role from pharmacy inventory with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/inventory')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 2. MEDICINE CATALOGUE MANAGEMENT
  // =========================================================================
  describe('2. Medicine Catalogue Management & Deduplication', () => {
    const validMedicine = {
      name: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      brandName: 'Augmentin',
      dosageForm: 'TABLET',
      strength: '625 mg',
      route: 'Oral',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals',
      category: 'Antibiotic',
      composition: 'Amoxicillin Trihydrate IP 500mg, Potassium Clavulanate IP 125mg',
      packSize: '10 Tablets per Strip',
      unitOfMeasurement: 'tablet',
      schedule: 'Schedule H1',
      therapeuticClass: 'Antibiotic',
      requiresPrescription: true,
      isActive: true,
    };

    it('should list medicine catalogue with search and filter capabilities', async () => {
      vi.spyOn(MedicationCatalogModel, 'find').mockImplementation(() =>
        createQueryMock([
          {
            _id: new Types.ObjectId(),
            ...validMedicine,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      );
      vi.spyOn(MedicationCatalogModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/pharmacy/medicines?search=Augmentin&category=Antibiotic')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].brandName).toBe('Augmentin');
      expect(res.body.data.items[0].dosageForm).toBe('TABLET');
    });

    it('should successfully create a new medicine catalogue item', async () => {
      vi.spyOn(MedicationCatalogModel, 'findOne').mockResolvedValue(null);
      const createdMed = {
        _id: new Types.ObjectId(),
        ...validMedicine,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(MedicationCatalogModel, 'create').mockResolvedValue(createdMed as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/medicines')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send(validMedicine);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.brandName).toBe('Augmentin');
      expect(res.body.data.strength).toBe('625 mg');
    });

    it('should reject duplicate medicine entry on { brandName, strength, dosageForm, manufacturer } with 409 Conflict', async () => {
      vi.spyOn(MedicationCatalogModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        ...validMedicine,
      } as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/medicines')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send(validMedicine);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CONFLICT');
      expect(res.body.message).toContain('already exists in catalog');
    });

    it('should retrieve a single medicine by its ID', async () => {
      const medId = new Types.ObjectId().toString();
      vi.spyOn(MedicationCatalogModel, 'findById').mockImplementation(() =>
        createQueryMock({
          _id: new Types.ObjectId(medId),
          ...validMedicine,
          createdAt: new Date(),
        })
      );

      const res = await request(app)
        .get(`/api/v1/pharmacy/medicines/${medId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(medId);
    });

    it('should update an existing medicine catalogue entry', async () => {
      const medId = new Types.ObjectId().toString();
      const mockDoc: any = {
        _id: new Types.ObjectId(medId),
        ...validMedicine,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(MedicationCatalogModel, 'findById').mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/v1/pharmacy/medicines/${medId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({ packSize: 'Strip of 15 Tablets' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoc.packSize).toBe('Strip of 15 Tablets');
    });
  });

  // =========================================================================
  // 3. STOCK-IN OPERATIONS (SUPPLIER INVOICE INTAKE)
  // =========================================================================
  describe('3. Stock-In Operations & Ledger Registration', () => {
    const validStockIn = {
      medicationName: 'Dolo 650',
      genericName: 'Paracetamol',
      brandName: 'Dolo',
      dosageForm: 'TABLET',
      strength: '650 mg',
      manufacturer: 'Micro Labs Ltd',
      supplier: 'MedPlus Central Distribution Hub',
      batchNumber: 'DL2026-X01',
      receivedQuantity: 500,
      reorderLevel: 50,
      purchasePrice: 18.5,
      sellingPrice: 32.0,
      mrp: 35.0,
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      rackLocation: 'Rack B-04',
      invoiceReference: 'INV-2026-9021',
      notes: 'Cold storage verified; intact seals',
    };

    it('should receive new stock, create batch, and append transaction to ledger', async () => {
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(null);

      const createdBatch: any = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        ...validStockIn,
        availableQuantity: 500,
        reservedQuantity: 0,
        status: 'IN_STOCK',
        expiryDate: new Date(validStockIn.expiryDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(PharmacyInventoryModel, 'create').mockResolvedValue(createdBatch);

      const txnSpy = vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-in')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send(validStockIn);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.batchNumber).toBe('DL2026-X01');
      expect(res.body.data.availableQuantity).toBe(500);

      // Verify immutable transaction ledger record was created
      expect(txnSpy).toHaveBeenCalledTimes(1);
      const txnPayload = txnSpy.mock.calls[0][0] as any;
      expect(txnPayload.transactionType).toBe('STOCK_RECEIVED');
      expect(txnPayload.quantityChange).toBe(500);
      expect(txnPayload.previousQuantity).toBe(0);
      expect(txnPayload.newQuantity).toBe(500);
      expect(txnPayload.batchNumber).toBe('DL2026-X01');
      expect(txnPayload.referenceEntity).toBe('SUPPLIER_INVOICE');
      expect(txnPayload.transactionReference).toMatch(/^TXN-\d{8}-\d{6}$/);
    });

    it('should increment existing batch if received again with same batch number', async () => {
      const existingDoc: any = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        batchNumber: 'DL2026-X01',
        medicationName: 'Dolo 650',
        availableQuantity: 200,
        receivedQuantity: 200,
        reorderLevel: 50,
        expiryDate: new Date(Date.now() + 365 * 86400000),
        status: 'IN_STOCK',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(existingDoc);
      const txnSpy = vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-in')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          ...validStockIn,
          receivedQuantity: 300,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(existingDoc.availableQuantity).toBe(500);
      expect(existingDoc.receivedQuantity).toBe(500);

      // Verify ledger delta
      const txnPayload = txnSpy.mock.calls[0][0] as any;
      expect(txnPayload.quantityChange).toBe(300);
      expect(txnPayload.previousQuantity).toBe(200);
      expect(txnPayload.newQuantity).toBe(500);
    });

    it('should reject stock-in with negative or zero receivedQuantity (422 Unprocessable Entity)', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-in')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          ...validStockIn,
          receivedQuantity: 0,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject stock-in with negative purchase price (422 Unprocessable Entity)', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-in')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          ...validStockIn,
          purchasePrice: -10,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 4. STOCK ADJUSTMENTS & REASON VALIDATION
  // =========================================================================
  describe('4. Stock Adjustment Operations & Negative Stock Prevention', () => {
    const inventoryId = new Types.ObjectId().toString();

    it('should increase stock during inventory count variance correction', async () => {
      const mockBatch: any = {
        _id: new Types.ObjectId(inventoryId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        medicationName: 'Metformin 500 mg',
        batchNumber: 'MET-2026-B1',
        availableQuantity: 100,
        reorderLevel: 20,
        expiryDate: new Date(Date.now() + 200 * 86400000),
        status: 'IN_STOCK',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockBatch);
      const txnSpy = vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-adjustment')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          inventoryId,
          adjustmentType: 'INCREASE',
          quantity: 25,
          reason: 'Surplus found during annual cycle audit',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBatch.availableQuantity).toBe(125);

      const txnPayload = txnSpy.mock.calls[0][0] as any;
      expect(txnPayload.transactionType).toBe('STOCK_ADJUSTED');
      expect(txnPayload.quantityChange).toBe(25);
      expect(txnPayload.previousQuantity).toBe(100);
      expect(txnPayload.newQuantity).toBe(125);
    });

    it('should decrease stock and log damage write-off', async () => {
      const mockBatch: any = {
        _id: new Types.ObjectId(inventoryId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        medicationName: 'Cough Syrup 100ml',
        batchNumber: 'CS-2026-09',
        availableQuantity: 50,
        reorderLevel: 10,
        expiryDate: new Date(Date.now() + 200 * 86400000),
        status: 'IN_STOCK',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockBatch);
      const txnSpy = vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-adjustment')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          inventoryId,
          adjustmentType: 'DAMAGE',
          quantity: 5,
          reason: 'Broken glass bottles during shelf reorganization',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBatch.availableQuantity).toBe(45);

      const txnPayload = txnSpy.mock.calls[0][0] as any;
      expect(txnPayload.transactionType).toBe('STOCK_DAMAGED');
      expect(txnPayload.quantityChange).toBe(-5);
      expect(txnPayload.previousQuantity).toBe(50);
      expect(txnPayload.newQuantity).toBe(45);
    });

    it('should PREVENT negative stock reduction beyond available quantity (400 Bad Request)', async () => {
      const mockBatch: any = {
        _id: new Types.ObjectId(inventoryId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        batchNumber: 'CS-2026-09',
        availableQuantity: 10,
        reorderLevel: 5,
        expiryDate: new Date(Date.now() + 200 * 86400000),
        status: 'IN_STOCK',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockBatch);

      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-adjustment')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          inventoryId,
          adjustmentType: 'DECREASE',
          quantity: 25, // Only 10 available!
          reason: 'Inventory shrinkage',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot decrease 25 units; only 10 available');
    });

    it('should reject adjustments without mandatory reason (422 Unprocessable Entity)', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/inventory/stock-adjustment')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          inventoryId,
          adjustmentType: 'CORRECTION',
          quantity: 5,
          reason: 'ok', // Less than 3 chars!
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 5. BATCH QUARANTINE & RELEASE
  // =========================================================================
  describe('5. Batch Quarantine & Release Lifecycle', () => {
    const inventoryId = new Types.ObjectId().toString();

    it('should place a batch under quarantine and flag as non-dispensable', async () => {
      const mockBatch: any = {
        _id: new Types.ObjectId(inventoryId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        batchNumber: 'AZI-2026-Q1',
        medicationName: 'Azithromycin 500 mg',
        availableQuantity: 100,
        reorderLevel: 20,
        expiryDate: new Date(Date.now() + 300 * 86400000),
        status: 'IN_STOCK',
        isQuarantined: false,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockBatch);
      const txnSpy = vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/inventory/batches/${inventoryId}/quarantine`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          reason: 'Regulatory recall notification from state drug controller',
          notes: 'Batch sample sent for chemical testing',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBatch.isQuarantined).toBe(true);
      expect(mockBatch.status).toBe('QUARANTINED');
      expect(mockBatch.quarantineReason).toContain('Regulatory recall');

      const txnPayload = txnSpy.mock.calls[0][0] as any;
      expect(txnPayload.transactionType).toBe('STOCK_QUARANTINED');
    });

    it('should release a quarantined batch back to active in-stock status', async () => {
      const mockBatch: any = {
        _id: new Types.ObjectId(inventoryId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        batchNumber: 'AZI-2026-Q1',
        medicationName: 'Azithromycin 500 mg',
        availableQuantity: 100,
        reorderLevel: 20,
        expiryDate: new Date(Date.now() + 300 * 86400000),
        status: 'QUARANTINED',
        isQuarantined: true,
        quarantineReason: 'Recall audit',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(mockBatch);
      const txnSpy = vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/inventory/batches/${inventoryId}/release`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          reason: 'Drug controller clearance report received. Quality verified.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBatch.isQuarantined).toBe(false);
      expect(mockBatch.status).toBe('IN_STOCK');

      const txnPayload = txnSpy.mock.calls[0][0] as any;
      expect(txnPayload.transactionType).toBe('STOCK_RELEASED');
    });
  });

  // =========================================================================
  // 6. APPEND-ONLY TRANSACTION LEDGER
  // =========================================================================
  describe('6. Append-Only Transaction Ledger Inspection', () => {
    it('should query transaction ledger history with filter and pagination', async () => {
      const mockTxn = {
        _id: new Types.ObjectId(),
        transactionReference: 'TXN-20261114-123456',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        inventoryId: new Types.ObjectId(),
        medicationName: 'Paracetamol 500 mg',
        batchNumber: 'PCM-101',
        transactionType: 'STOCK_RECEIVED',
        quantityChange: 100,
        previousQuantity: 0,
        newQuantity: 100,
        reason: 'Initial goods intake',
        referenceEntity: 'SUPPLIER_INVOICE',
        referenceId: 'INV-100',
        performedBy: {
          _id: new Types.ObjectId(pharmacyUserId),
          name: 'MedPlus Pharmacist',
          email: 'medplus.hyderabad@healthbridge.in',
        },
        createdAt: new Date(),
      };

      vi.spyOn(PharmacyInventoryTransactionModel, 'find').mockImplementation(() =>
        createQueryMock([mockTxn])
      );
      vi.spyOn(PharmacyInventoryTransactionModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/pharmacy/inventory/transactions?transactionType=STOCK_RECEIVED')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].transactionReference).toBe('TXN-20261114-123456');
      expect(res.body.data.items[0].quantityChange).toBe(100);
      expect(res.body.data.items[0].performedByName).toBe('MedPlus Pharmacist');
    });
  });

  // =========================================================================
  // 7. EXPIRY MONITORING & HORIZONS
  // =========================================================================
  describe('7. Expiry Monitoring & Dynamic Classification', () => {
    it('should classify batches into EXPIRED, 7-day, 30-day, and SAFE horizons', async () => {
      const now = new Date();
      const expiredBatch = {
        _id: new Types.ObjectId(),
        medicationName: 'Expired Syrup',
        batchNumber: 'EXP-001',
        availableQuantity: 15,
        expiryDate: new Date(now.getTime() - 5 * 86400000), // 5 days ago
        status: 'EXPIRED',
        purchasePrice: 40,
        sellingPrice: 70,
      };

      const near7Batch = {
        _id: new Types.ObjectId(),
        medicationName: 'Critical Antibiotic',
        batchNumber: '7D-002',
        availableQuantity: 20,
        expiryDate: new Date(now.getTime() + 4 * 86400000), // 4 days remaining
        status: 'LOW_STOCK',
        purchasePrice: 100,
        sellingPrice: 150,
      };

      const safeBatch = {
        _id: new Types.ObjectId(),
        medicationName: 'Safe Tablet',
        batchNumber: 'SAFE-003',
        availableQuantity: 500,
        expiryDate: new Date(now.getTime() + 180 * 86400000), // 180 days remaining
        status: 'IN_STOCK',
        purchasePrice: 10,
        sellingPrice: 18,
      };

      vi.spyOn(PharmacyInventoryModel, 'find').mockImplementation(() =>
        createQueryMock([expiredBatch, near7Batch, safeBatch])
      );

      const res = await request(app)
        .get('/api/v1/pharmacy/inventory/expiry-report')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expiredCount).toBe(1);
      expect(res.body.data.expiredUnits).toBe(15);
      expect(res.body.data.expiring7DaysCount).toBe(1);
      expect(res.body.data.safeCount).toBe(1);
    });
  });

  // =========================================================================
  // 8. INVENTORY ANALYTICS & STOCK VALUATION FORMULA
  // =========================================================================
  describe('8. Inventory Analytics & Financial Valuation Segregation', () => {
    it('should calculate eligible stock valuation and segregate quarantined and expired values', async () => {
      const now = new Date();
      const batches = [
        // Eligible Batch 1: 100 units * 20 = ₹2,000
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationName: 'Dolo 650',
          dosageForm: 'TABLET',
          availableQuantity: 100,
          purchasePrice: 20,
          status: 'IN_STOCK',
          expiryDate: new Date(now.getTime() + 200 * 86400000),
          isQuarantined: false,
        },
        // Eligible Batch 2: 50 units * 30 = ₹1,500
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationName: 'Augmentin 625',
          dosageForm: 'TABLET',
          availableQuantity: 50,
          purchasePrice: 30,
          status: 'LOW_STOCK',
          reorderLevel: 60,
          expiryDate: new Date(now.getTime() + 100 * 86400000),
          isQuarantined: false,
        },
        // Quarantined Batch: 40 units * 25 = ₹1,000 (MUST BE SEGREGATED)
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationName: 'Recalled Vials',
          dosageForm: 'INJECTION',
          availableQuantity: 40,
          purchasePrice: 25,
          status: 'QUARANTINED',
          expiryDate: new Date(now.getTime() + 150 * 86400000),
          isQuarantined: true,
        },
        // Expired Batch: 10 units * 50 = ₹500 (MUST BE SEGREGATED)
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationName: 'Expired Drops',
          dosageForm: 'DROPS',
          availableQuantity: 10,
          purchasePrice: 50,
          status: 'EXPIRED',
          expiryDate: new Date(now.getTime() - 10 * 86400000),
          isQuarantined: false,
        },
      ];

      vi.spyOn(PharmacyInventoryModel, 'find').mockImplementation(() => createQueryMock(batches));
      vi.spyOn(PharmacyInventoryTransactionModel, 'find').mockImplementation(() => createQueryMock([]));

      const res = await request(app)
        .get('/api/v1/pharmacy/inventory/analytics')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const analytics = res.body.data;
      // Eligible valuation = 2,000 + 1,500 = ₹3,500
      expect(analytics.estimatedValuation).toBe(3500);

      // Quarantined valuation = 40 * 25 = ₹1,000
      expect(analytics.quarantinedValuation).toBe(1000);

      // Expired valuation = 10 * 50 = ₹500
      expect(analytics.expiredValuation).toBe(500);

      // Total available eligible units = 100 + 50 = 150 (Quarantined and expired are excluded from dispensable units)
      expect(analytics.totalAvailableUnits).toBe(150);
      expect(analytics.lowStockBatchesCount).toBe(1);
      expect(analytics.quarantinedBatchesCount).toBe(1);
      expect(analytics.expiredBatchesCount).toBe(1);
    });
  });
});
