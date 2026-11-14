import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  SupplierModel,
  SupplierProductModel,
  PurchaseRequisitionModel,
  PurchaseOrderModel,
  GoodsReceiptModel,
  PurchaseInvoiceModel,
  PharmacyInventoryModel,
  PharmacyInventoryTransactionModel,
  MedicationCatalogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Pharmacy Supplier Management, Purchase Orders & Stock Replenishment Integration Tests (Day 5 Task 04)', () => {
  const app = createApp();

  const pharmacyUserId = new Types.ObjectId().toString();
  const otherPharmacyUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.procurement@healthbridge.in',
  } as any);

  const otherPharmacyToken = tokenService.generateAccessToken({
    _id: otherPharmacyUserId,
    role: 'PHARMACY',
    email: 'medplus.procurement@healthbridge.in',
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
    fullName: 'Apollo Pharmacy Procurement',
    name: 'Apollo Pharmacy Procurement',
    email: 'apollo.procurement@healthbridge.in',
    phone: '9845012345',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockOtherPharmacyUser = {
    _id: new Types.ObjectId(otherPharmacyUserId),
    id: otherPharmacyUserId,
    fullName: 'MedPlus Procurement',
    name: 'MedPlus Procurement',
    email: 'medplus.procurement@healthbridge.in',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockDoctorUser = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    fullName: 'Dr. Test Doctor',
    name: 'Dr. Test Doctor',
    email: 'doctor@healthbridge.in',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockPatientUser = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    fullName: 'Test Patient',
    name: 'Test Patient',
    email: 'patient@healthbridge.in',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const medicationId1 = new Types.ObjectId().toString();
  const medicationId2 = new Types.ObjectId().toString();

  const mockMedication1 = {
    _id: new Types.ObjectId(medicationId1),
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    brandName: 'Mox 500',
    dosageForm: 'Capsule',
    strength: '500mg',
    manufacturer: 'Sun Pharma',
    isActive: true,
  };

  const mockMedication2 = {
    _id: new Types.ObjectId(medicationId2),
    name: 'Paracetamol 650mg',
    genericName: 'Paracetamol',
    brandName: 'Dolo 650',
    dosageForm: 'Tablet',
    strength: '650mg',
    manufacturer: 'Micro Labs',
    isActive: true,
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

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser as any);
      if (idStr === otherPharmacyUserId) return Promise.resolve(mockOtherPharmacyUser as any);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUser as any);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser as any);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(MedicationCatalogModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === medicationId1) return Promise.resolve(mockMedication1 as any);
      if (idStr === medicationId2) return Promise.resolve(mockMedication2 as any);
      return Promise.resolve(null);
    }) as any);
  });

  /* ==========================================================================
     1. SUPPLIER MANAGEMENT TESTS
     ========================================================================== */

  describe('1. Supplier Management', () => {
    it('should create a new supplier with generated code and active status', async () => {
      vi.spyOn(SupplierModel, 'findOne').mockResolvedValue(null);

      const createdSupplier = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierCode: 'SUP-20261114-1001',
        name: 'Cipla Healthcare Distributors',
        legalName: 'Cipla Healthcare India Ltd.',
        supplierType: 'DISTRIBUTOR',
        status: 'ACTIVE',
        verificationStatus: 'UNVERIFIED',
        taxId: '27AABC1234F1Z5',
        email: 'orders@cipladist.in',
        phone: '9876543210',
        address: {
          line1: 'B-102 Logistics Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
        contactPersons: [],
        paymentTermsDays: 30,
        leadTimeDays: 7,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(SupplierModel, 'create').mockResolvedValue(createdSupplier as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/suppliers')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          name: 'Cipla Healthcare Distributors',
          legalName: 'Cipla Healthcare India Ltd.',
          supplierType: 'DISTRIBUTOR',
          taxId: '27AABC1234F1Z5',
          email: 'orders@cipladist.in',
          phone: '9876543210',
          address: {
            line1: 'B-102 Logistics Park',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
          },
          paymentTermsDays: 30,
          leadTimeDays: 7,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Cipla Healthcare Distributors');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.supplierCode).toBe('SUP-20261114-1001');
    });

    it('should reject creating duplicate supplier under same pharmacy', async () => {
      vi.spyOn(SupplierModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        name: 'Cipla Healthcare Distributors',
      } as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/suppliers')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          name: 'Cipla Healthcare Distributors',
          email: 'orders@cipladist.in',
          phone: '9876543210',
          address: {
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
          },
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should list suppliers with search and status filtering', async () => {
      const mockSuppliers = [
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          supplierCode: 'SUP-20261114-1001',
          name: 'Cipla Healthcare Distributors',
          supplierType: 'DISTRIBUTOR',
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          email: 'orders@cipla.in',
          phone: '9876543210',
          address: { city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' },
          contactPersons: [],
          paymentTermsDays: 30,
          leadTimeDays: 7,
          rating: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(SupplierModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(SupplierModel, 'find').mockReturnValue(createQueryMock(mockSuppliers) as any);

      const res = await request(app)
        .get('/api/v1/pharmacy/suppliers?status=ACTIVE&search=Cipla')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Cipla Healthcare Distributors');
    });

    it('should enforce tenant isolation when fetching supplier by ID', async () => {
      const supplierId = new Types.ObjectId().toString();

      // When queried with otherPharmacyUserId, findOne returns null
      vi.spyOn(SupplierModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/pharmacy/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${otherPharmacyToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. SUPPLIER PRODUCT CATALOG TESTS
     ========================================================================== */

  describe('2. Supplier Product Catalogue', () => {
    it('should add medication mapping to supplier with contracted purchase price', async () => {
      const supplierId = new Types.ObjectId().toString();

      vi.spyOn(SupplierModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(supplierId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        name: 'Sun Pharma Logistics',
        leadTimeDays: 5,
      } as any);

      const mockProduct = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(supplierId),
        supplierName: 'Sun Pharma Logistics',
        medicationCatalogId: new Types.ObjectId(medicationId1),
        medicationName: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        brandName: 'Mox 500',
        dosageForm: 'Capsule',
        strength: '500mg',
        supplierProductCode: 'SUN-AMX-500',
        purchasePrice: 4500,
        minimumOrderQuantity: 10,
        packSize: '10 Capsules / Strip',
        leadTimeDays: 5,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(SupplierProductModel, 'findOneAndUpdate').mockResolvedValue(mockProduct as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/suppliers/products')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          supplierId,
          medicationCatalogId: medicationId1,
          purchasePrice: 4500,
          supplierProductCode: 'SUN-AMX-500',
          minimumOrderQuantity: 10,
          packSize: '10 Capsules / Strip',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.medicationName).toBe('Amoxicillin 500mg');
      expect(res.body.data.purchasePrice).toBe(4500);
      expect(res.body.data.supplierProductCode).toBe('SUN-AMX-500');
    });

    it('should list supplier products with availability filter', async () => {
      const mockProducts = [
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          supplierId: new Types.ObjectId(),
          supplierName: 'Sun Pharma Logistics',
          medicationCatalogId: new Types.ObjectId(medicationId1),
          medicationName: 'Amoxicillin 500mg',
          dosageForm: 'Capsule',
          strength: '500mg',
          purchasePrice: 4500,
          minimumOrderQuantity: 10,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(SupplierProductModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(SupplierProductModel, 'find').mockReturnValue(createQueryMock(mockProducts) as any);

      const res = await request(app)
        .get('/api/v1/pharmacy/suppliers/products?isAvailable=true')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  /* ==========================================================================
     3. PURCHASE REQUISITIONS TESTS
     ========================================================================== */

  describe('3. Purchase Requisitions', () => {
    it('should draft and submit purchase requisition with estimated pricing', async () => {
      const mockRequisition = {
        _id: new Types.ObjectId(),
        requisitionNumber: 'REQ-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        requestedBy: new Types.ObjectId(pharmacyUserId),
        requestedByName: 'Apollo Pharmacy Procurement',
        status: 'SUBMITTED',
        priority: 'HIGH',
        items: [
          {
            _id: new Types.ObjectId(),
            medicationCatalogId: new Types.ObjectId(medicationId1),
            medicationName: 'Amoxicillin 500mg',
            dosageForm: 'Capsule',
            strength: '500mg',
            requestedQuantity: 50,
            approvedQuantity: 50,
            unitOfMeasure: 'Units',
            estimatedUnitPrice: 45,
            estimatedTotalPrice: 2250,
          },
        ],
        totalEstimatedAmount: 2250,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(PurchaseRequisitionModel, 'create').mockResolvedValue(mockRequisition as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/requisitions')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          priority: 'HIGH',
          items: [
            {
              medicationCatalogId: medicationId1,
              requestedQuantity: 50,
              estimatedUnitPrice: 45,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requisitionNumber).toBe('REQ-20261114-1001');
      expect(res.body.data.totalEstimatedAmount).toBe(2250);
      expect(res.body.data.status).toBe('SUBMITTED');
    });

    it('should approve a purchase requisition', async () => {
      const requisitionId = new Types.ObjectId().toString();

      const mockReq = {
        _id: new Types.ObjectId(requisitionId),
        requisitionNumber: 'REQ-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        requestedBy: new Types.ObjectId(pharmacyUserId),
        requestedByName: 'Pharmacist',
        status: 'SUBMITTED',
        priority: 'MEDIUM',
        items: [],
        totalEstimatedAmount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PurchaseRequisitionModel, 'findOne').mockResolvedValue(mockReq as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/requisitions/${requisitionId}/approve`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({ approvalNotes: 'Authorized for monthly restock' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(mockReq.save).toHaveBeenCalled();
    });
  });

  /* ==========================================================================
     4. PURCHASE ORDER CREATION & APPROVAL TESTS
     ========================================================================== */

  describe('4. Purchase Orders & Server-Authoritative Financials', () => {
    it('should create Purchase Order with server-authoritative calculated totals', async () => {
      const supplierId = new Types.ObjectId().toString();

      vi.spyOn(SupplierModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(supplierId),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        name: 'Cipla Distributors',
        supplierCode: 'SUP-CIPLA-01',
        taxId: '27AABC1234F1Z5',
        paymentTermsDays: 30,
        email: 'cipla@dist.com',
        phone: '9876543210',
        address: { line1: 'G-10', city: 'Mumbai', state: 'MH', postalCode: '400001', country: 'India' },
      } as any);

      // Calculation check:
      // Item 1: 100 qty * ₹50 = 5000. 10% disc = 500. Taxable = 4500. 5% tax = 225. Total = 4725.
      // Item 2: 50 qty * ₹20 = 1000. 0% disc = 0. Taxable = 1000. 12% tax = 120. Total = 1120.
      // Subtotal = 6000. Discount = 500. Tax = 345. Grand total = 5845.
      const mockCreatedPO = {
        _id: new Types.ObjectId(),
        poNumber: 'PO-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(supplierId),
        supplierName: 'Cipla Distributors',
        supplierCode: 'SUP-CIPLA-01',
        status: 'PENDING_APPROVAL',
        orderDate: new Date(),
        paymentTermsDays: 30,
        deliveryAddress: { city: 'Mumbai', state: 'MH', postalCode: '400001', country: 'India' },
        items: [
          {
            _id: new Types.ObjectId(),
            medicationCatalogId: new Types.ObjectId(medicationId1),
            medicationName: 'Amoxicillin 500mg',
            dosageForm: 'Capsule',
            strength: '500mg',
            orderedQuantity: 100,
            receivedQuantity: 0,
            remainingQuantity: 100,
            unitPrice: 50,
            discountPercent: 10,
            taxPercent: 5,
            itemSubtotal: 5000,
            itemTax: 225,
            itemTotal: 4725,
          },
          {
            _id: new Types.ObjectId(),
            medicationCatalogId: new Types.ObjectId(medicationId2),
            medicationName: 'Paracetamol 650mg',
            dosageForm: 'Tablet',
            strength: '650mg',
            orderedQuantity: 50,
            receivedQuantity: 0,
            remainingQuantity: 50,
            unitPrice: 20,
            discountPercent: 0,
            taxPercent: 12,
            itemSubtotal: 1000,
            itemTax: 120,
            itemTotal: 1120,
          },
        ],
        subtotal: 6000,
        taxTotal: 345,
        discountTotal: 500,
        grandTotal: 5845,
        createdBy: new Types.ObjectId(pharmacyUserId),
        createdByName: 'Apollo Pharmacy Procurement',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(PurchaseOrderModel, 'create').mockResolvedValue(mockCreatedPO as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/purchases')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          supplierId,
          items: [
            {
              medicationCatalogId: medicationId1,
              orderedQuantity: 100,
              unitPrice: 50,
              discountPercent: 10,
              taxPercent: 5,
            },
            {
              medicationCatalogId: medicationId2,
              orderedQuantity: 50,
              unitPrice: 20,
              discountPercent: 0,
              taxPercent: 12,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBe(6000);
      expect(res.body.data.discountTotal).toBe(500);
      expect(res.body.data.taxTotal).toBe(345);
      expect(res.body.data.grandTotal).toBe(5845);
      expect(res.body.data.status).toBe('PENDING_APPROVAL');
    });

    it('should approve a purchase order and allow sending to supplier', async () => {
      const poId = new Types.ObjectId().toString();

      const mockPO = {
        _id: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(),
        supplierName: 'Cipla Distributors',
        supplierCode: 'SUP-01',
        status: 'PENDING_APPROVAL',
        orderDate: new Date(),
        paymentTermsDays: 30,
        deliveryAddress: { city: 'Mumbai', state: 'MH', postalCode: '400001' },
        items: [],
        subtotal: 5000,
        taxTotal: 250,
        discountTotal: 0,
        grandTotal: 5250,
        createdBy: new Types.ObjectId(pharmacyUserId),
        createdByName: 'Procurement Officer',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PurchaseOrderModel, 'findOne').mockResolvedValue(mockPO as any);

      // 1. Approve
      const approveRes = await request(app)
        .post(`/api/v1/pharmacy/purchases/${poId}/approve`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({ comments: 'Approved by Director' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');
      expect(approveRes.body.data.approvalDetails.approverName).toBeDefined();

      // 2. Dispatch to supplier
      mockPO.status = 'APPROVED';
      const sendRes = await request(app)
        .post(`/api/v1/pharmacy/purchases/${poId}/send`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.data.status).toBe('SENT_TO_SUPPLIER');
    });

    it('should reject a purchase order with reason', async () => {
      const poId = new Types.ObjectId().toString();

      const mockPO = {
        _id: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(),
        supplierName: 'Cipla Distributors',
        supplierCode: 'SUP-01',
        status: 'PENDING_APPROVAL',
        orderDate: new Date(),
        paymentTermsDays: 30,
        deliveryAddress: { city: 'Mumbai', state: 'MH', postalCode: '400001' },
        items: [],
        subtotal: 5000,
        taxTotal: 250,
        discountTotal: 0,
        grandTotal: 5250,
        createdBy: new Types.ObjectId(pharmacyUserId),
        createdByName: 'Procurement Officer',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PurchaseOrderModel, 'findOne').mockResolvedValue(mockPO as any);

      const res = await request(app)
        .post(`/api/v1/pharmacy/purchases/${poId}/reject`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({ reason: 'Quoted rate exceeds framework contract' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });
  });

  /* ==========================================================================
     5. GOODS RECEIVING (GRN) & INVENTORY ALLOCATION TESTS
     ========================================================================== */

  describe('5. Goods Receiving (GRN) & Inventory Allocation', () => {
    it('should process partial goods receipt, create inventory batch and log transaction ledger', async () => {
      const poId = new Types.ObjectId().toString();
      const poItemId = new Types.ObjectId().toString();

      const mockPO = {
        _id: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(),
        supplierName: 'Sun Pharma Logistics',
        supplierCode: 'SUP-SUN-01',
        status: 'SENT_TO_SUPPLIER',
        items: [
          {
            _id: new Types.ObjectId(poItemId),
            medicationCatalogId: new Types.ObjectId(medicationId1),
            medicationName: 'Amoxicillin 500mg',
            dosageForm: 'Capsule',
            strength: '500mg',
            orderedQuantity: 100,
            receivedQuantity: 0,
            remainingQuantity: 100,
            unitPrice: 50,
            taxPercent: 5,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PurchaseOrderModel, 'findOne').mockResolvedValue(mockPO as any);
      vi.spyOn(PharmacyInventoryModel, 'findOne').mockResolvedValue(null);

      const createdBatch = {
        _id: new Types.ObjectId(),
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        batchNumber: 'BATCH-2026-X1',
        availableQuantity: 40,
        sellingPrice: 65,
      };
      vi.spyOn(PharmacyInventoryModel, 'create').mockResolvedValue(createdBatch as any);
      vi.spyOn(PharmacyInventoryTransactionModel, 'create').mockResolvedValue({ _id: new Types.ObjectId() } as any);

      const createdGRN = {
        _id: new Types.ObjectId(),
        grnNumber: 'GRN-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        purchaseOrderId: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        supplierId: mockPO.supplierId,
        supplierName: mockPO.supplierName,
        supplierInvoiceNumber: 'INV-SUN-9988',
        supplierInvoiceDate: new Date(),
        receivedDate: new Date(),
        receivedBy: new Types.ObjectId(pharmacyUserId),
        receiverName: 'Receiving Pharmacist',
        status: 'CONFIRMED',
        items: [
          {
            _id: new Types.ObjectId(),
            purchaseOrderItemId: new Types.ObjectId(poItemId),
            medicationCatalogId: new Types.ObjectId(medicationId1),
            medicationName: 'Amoxicillin 500mg',
            dosageForm: 'Capsule',
            strength: '500mg',
            batchNumber: 'BATCH-2026-X1',
            manufacturingDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            orderedQuantity: 100,
            receivedQuantity: 40,
            acceptedQuantity: 40,
            rejectedQuantity: 0,
            unitPurchasePrice: 50,
            sellingPrice: 65,
            itemTotal: 2100,
          },
        ],
        totalItemsCount: 1,
        totalReceivedQuantity: 40,
        totalAcceptedQuantity: 40,
        totalRejectedQuantity: 0,
        totalAmount: 2100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(GoodsReceiptModel, 'create').mockResolvedValue(createdGRN as any);

      const futureExp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const mfgDate = new Date().toISOString();

      const res = await request(app)
        .post(`/api/v1/pharmacy/purchases/${poId}/receive`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          supplierInvoiceNumber: 'INV-SUN-9988',
          supplierInvoiceDate: new Date().toISOString(),
          items: [
            {
              purchaseOrderItemId: poItemId,
              batchNumber: 'BATCH-2026-X1',
              manufacturingDate: mfgDate,
              expiryDate: futureExp,
              receivedQuantity: 40,
              rejectedQuantity: 0,
              unitPurchasePrice: 50,
              sellingPrice: 65,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grnNumber).toBe('GRN-20261114-1001');
      expect(res.body.data.totalAcceptedQuantity).toBe(40);

      // Verify PO status was updated to PARTIALLY_RECEIVED
      expect(mockPO.status).toBe('PARTIALLY_RECEIVED');
      expect(mockPO.items[0].remainingQuantity).toBe(60);
      expect(PharmacyInventoryModel.create).toHaveBeenCalled();
      expect(PharmacyInventoryTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'STOCK_RECEIVED',
          quantity: 40,
        })
      );
    });

    it('should reject goods receipt if received quantity exceeds ordered quantity', async () => {
      const poId = new Types.ObjectId().toString();
      const poItemId = new Types.ObjectId().toString();

      const mockPO = {
        _id: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(),
        supplierName: 'Sun Pharma Logistics',
        status: 'PARTIALLY_RECEIVED',
        items: [
          {
            _id: new Types.ObjectId(poItemId),
            medicationCatalogId: new Types.ObjectId(medicationId1),
            medicationName: 'Amoxicillin 500mg',
            orderedQuantity: 100,
            receivedQuantity: 80,
            remainingQuantity: 20,
            unitPrice: 50,
          },
        ],
      };

      vi.spyOn(PurchaseOrderModel, 'findOne').mockResolvedValue(mockPO as any);

      const futureExp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/api/v1/pharmacy/purchases/${poId}/receive`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          supplierInvoiceNumber: 'INV-SUN-9999',
          supplierInvoiceDate: new Date().toISOString(),
          items: [
            {
              purchaseOrderItemId: poItemId,
              batchNumber: 'BATCH-2026-OVER',
              manufacturingDate: new Date().toISOString(),
              expiryDate: futureExp,
              receivedQuantity: 30, // Exceeds remaining 20
              unitPurchasePrice: 50,
              sellingPrice: 65,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('exceeds');
    });

    it('should reject receiving expired medication batches', async () => {
      const poId = new Types.ObjectId().toString();
      const poItemId = new Types.ObjectId().toString();

      const mockPO = {
        _id: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        status: 'APPROVED',
        items: [
          {
            _id: new Types.ObjectId(poItemId),
            medicationCatalogId: new Types.ObjectId(medicationId1),
            medicationName: 'Amoxicillin 500mg',
            orderedQuantity: 100,
            receivedQuantity: 0,
            remainingQuantity: 100,
            unitPrice: 50,
          },
        ],
      };

      vi.spyOn(PurchaseOrderModel, 'findOne').mockResolvedValue(mockPO as any);

      const pastExpiry = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/api/v1/pharmacy/purchases/${poId}/receive`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          supplierInvoiceNumber: 'INV-EXPIRED-01',
          supplierInvoiceDate: new Date().toISOString(),
          items: [
            {
              purchaseOrderItemId: poItemId,
              batchNumber: 'BATCH-EXP',
              manufacturingDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
              expiryDate: pastExpiry,
              receivedQuantity: 20,
              unitPurchasePrice: 50,
              sellingPrice: 65,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  /* ==========================================================================
     6. PURCHASE INVOICE & RECONCILIATION TESTS
     ========================================================================== */

  describe('6. Purchase Invoices & Reconciliation', () => {
    it('should record supplier purchase invoice and reconcile', async () => {
      const supplierId = new Types.ObjectId().toString();
      const poId = new Types.ObjectId().toString();
      const invoiceId = new Types.ObjectId().toString();

      vi.spyOn(SupplierModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(supplierId),
        name: 'Cipla Distributors',
      } as any);

      vi.spyOn(PurchaseOrderModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
      } as any);

      vi.spyOn(PurchaseInvoiceModel, 'findOne').mockImplementation(((query: any) => {
        if (query._id) {
          return Promise.resolve({
            _id: new Types.ObjectId(invoiceId),
            invoiceNumber: 'INV-CIPLA-888',
            pharmacyId: new Types.ObjectId(pharmacyUserId),
            supplierId: new Types.ObjectId(supplierId),
            supplierName: 'Cipla Distributors',
            purchaseOrderId: new Types.ObjectId(poId),
            poNumber: 'PO-20261114-1001',
            status: 'PENDING',
            invoiceDate: new Date(),
            subtotal: 5000,
            taxAmount: 250,
            discountAmount: 0,
            totalAmount: 5250,
            paidAmount: 0,
            goodsReceiptIds: [],
            grnNumbers: [],
            save: vi.fn().mockResolvedValue(true),
          } as any);
        }
        return Promise.resolve(null);
      }) as any);

      const createdInvoice = {
        _id: new Types.ObjectId(invoiceId),
        invoiceNumber: 'INV-CIPLA-888',
        pharmacyId: new Types.ObjectId(pharmacyUserId),
        supplierId: new Types.ObjectId(supplierId),
        supplierName: 'Cipla Distributors',
        purchaseOrderId: new Types.ObjectId(poId),
        poNumber: 'PO-20261114-1001',
        goodsReceiptIds: [],
        grnNumbers: [],
        invoiceDate: new Date(),
        subtotal: 5000,
        taxAmount: 250,
        totalAmount: 5250,
        paidAmount: 0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(PurchaseInvoiceModel, 'create').mockResolvedValue(createdInvoice as any);

      // 1. Record invoice
      const createRes = await request(app)
        .post('/api/v1/pharmacy/invoices')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          invoiceNumber: 'INV-CIPLA-888',
          supplierId,
          purchaseOrderId: poId,
          invoiceDate: new Date().toISOString(),
          subtotal: 5000,
          taxAmount: 250,
          totalAmount: 5250,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.invoiceNumber).toBe('INV-CIPLA-888');

      // 2. Reconcile invoice
      const patchRes = await request(app)
        .patch(`/api/v1/pharmacy/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          status: 'RECONCILED',
          reconciliationNotes: 'Verified against GRN-20261114-1001 and bank settlement',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('RECONCILED');
    });
  });

  /* ==========================================================================
     7. STOCK REPLENISHMENT & REORDER SUGGESTIONS TESTS
     ========================================================================== */

  describe('7. Stock Replenishment Suggestions', () => {
    it('should generate automated reorder suggestions based on net available stock vs threshold', async () => {
      // Inventory: Available = 5, Reserved = 2 -> Net = 3. Reorder level = 20.
      // Open PO: None.
      // Suggested = (20 * 2) - (3 + 0) = 37.
      const mockBatches = [
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationCatalogId: new Types.ObjectId(medicationId1),
          medicationName: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin Trihydrate',
          brandName: 'Mox 500',
          dosageForm: 'Capsule',
          strength: '500mg',
          availableQuantity: 5,
          reservedQuantity: 2,
          reorderLevel: 20,
          purchasePrice: 45,
          status: 'LOW_STOCK',
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      ];

      vi.spyOn(PharmacyInventoryModel, 'find').mockResolvedValue(mockBatches as any);
      vi.spyOn(PurchaseOrderModel, 'find').mockResolvedValue([]);
      vi.spyOn(MedicationCatalogModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(SupplierProductModel, 'findOne').mockReturnValue(
        createQueryMock({
          supplierId: new Types.ObjectId(),
          supplierName: 'Cipla Distributors',
          purchasePrice: 4500,
        }) as any
      );

      const res = await request(app)
        .get('/api/v1/pharmacy/replenishment/suggestions?onlyBelowReorderLevel=true')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const suggestion = res.body.data.find(
        (s: any) => s.medicationCatalogId === medicationId1
      );
      expect(suggestion).toBeDefined();
      expect(suggestion.netAvailableStock).toBe(3);
      expect(suggestion.suggestedOrderQuantity).toBe(37); // (20 * 2) - 3 = 37
    });

    it('should account for pending inbound stock on open purchase orders', async () => {
      // Net stock = 5. Reorder level = 20.
      // Open PO has remainingQuantity = 20.
      // Suggested = (20 * 2) - (5 + 20) = 15.
      const mockBatches = [
        {
          _id: new Types.ObjectId(),
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          medicationCatalogId: new Types.ObjectId(medicationId1),
          medicationName: 'Amoxicillin 500mg',
          availableQuantity: 5,
          reservedQuantity: 0,
          reorderLevel: 20,
          purchasePrice: 45,
          status: 'LOW_STOCK',
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      ];

      const mockOpenPOs = [
        {
          _id: new Types.ObjectId(),
          items: [
            {
              medicationCatalogId: new Types.ObjectId(medicationId1),
              remainingQuantity: 20,
            },
          ],
        },
      ];

      vi.spyOn(PharmacyInventoryModel, 'find').mockResolvedValue(mockBatches as any);
      vi.spyOn(PurchaseOrderModel, 'find').mockResolvedValue(mockOpenPOs as any);
      vi.spyOn(MedicationCatalogModel, 'find').mockReturnValue(createQueryMock([]) as any);
      vi.spyOn(SupplierProductModel, 'findOne').mockReturnValue(createQueryMock(null) as any);

      const res = await request(app)
        .get('/api/v1/pharmacy/replenishment/suggestions?onlyBelowReorderLevel=true')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      const suggestion = res.body.data.find(
        (s: any) => s.medicationCatalogId === medicationId1
      );
      expect(suggestion).toBeDefined();
      expect(suggestion.pendingInboundQuantity).toBe(20);
      expect(suggestion.suggestedOrderQuantity).toBe(15);
    });
  });

  /* ==========================================================================
     8. PROCUREMENT METRICS & RBAC MATRIX TESTS
     ========================================================================== */

  describe('8. Procurement Analytics & RBAC Security Matrix', () => {
    it('should return aggregated procurement metrics for authenticated pharmacy', async () => {
      vi.spyOn(SupplierModel, 'countDocuments').mockResolvedValue(12);
      vi.spyOn(PurchaseOrderModel, 'countDocuments').mockResolvedValue(5);
      vi.spyOn(PurchaseOrderModel, 'find').mockResolvedValue([
        { grandTotal: 25000, items: [] },
        { grandTotal: 15000, items: [] },
      ] as any);
      vi.spyOn(PurchaseInvoiceModel, 'find').mockResolvedValue([
        { totalAmount: 12000 },
      ] as any);
      vi.spyOn(PharmacyInventoryModel, 'find').mockResolvedValue([]);
      vi.spyOn(MedicationCatalogModel, 'find').mockReturnValue(createQueryMock([]) as any);

      const res = await request(app)
        .get('/api/v1/pharmacy/procurement/metrics')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSuppliers).toBe(12);
      expect(res.body.data.monthlySpendTotal).toBe(40000);
    });

    it('should forbid DOCTOR role from accessing pharmacy procurement routes', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/suppliers')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid PATIENT role from accessing pharmacy procurement routes', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/purchases')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated requests without bearer token', async () => {
      const res = await request(app).get('/api/v1/pharmacy/purchases');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
