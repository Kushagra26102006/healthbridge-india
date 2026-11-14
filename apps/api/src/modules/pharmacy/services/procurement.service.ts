import { Types } from 'mongoose';
import {
  SupplierModel,
  ISupplierDocument,
  SupplierProductModel,
  ISupplierProductDocument,
  PurchaseRequisitionModel,
  IPurchaseRequisitionDocument,
  PurchaseOrderModel,
  IPurchaseOrderDocument,
  GoodsReceiptModel,
  IGoodsReceiptDocument,
  PurchaseInvoiceModel,
  IPurchaseInvoiceDocument,
  PharmacyInventoryModel,
  PharmacyInventoryTransactionModel,
  MedicationCatalogModel,
  UserModel,
} from '../../../database/models';
import { notificationService } from '../../notifications/services/notification.service';
import { AppError } from '../../../shared/errors/app-error';
import type {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierFilterDto,
  SupplierProductDto,
  CreateSupplierProductDto,
  UpdateSupplierProductDto,
  SupplierProductFilterDto,
  PurchaseRequisitionDto,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto,
  RequisitionFilterDto,
  PurchaseOrderDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  RejectPurchaseOrderDto,
  PurchaseOrderFilterDto,
  GoodsReceiptDto,
  ReceiveGoodsDto,
  GoodsReceiptFilterDto,
  PurchaseInvoiceDto,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  InvoiceFilterDto,
  ReplenishmentSuggestionDto,
  ReplenishmentFilterDto,
  ReplenishmentSettingsDto,
  UpdateReplenishmentSettingsDto,
  ConvertSuggestionsToRequisitionDto,
  ProcurementMetricsDto,
} from '@healthbridge/shared-types';

function toIsoSafe(d: unknown, fallback = new Date().toISOString()): string {
  if (!d) return fallback;
  if (d instanceof Date) {
    return isNaN(d.getTime()) ? fallback : d.toISOString();
  }
  const parsed = new Date(d as string);
  return isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function generateSequenceCode(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random4}`;
}

export class ProcurementService {
  /**
   * ==========================================================================
   * 1. SUPPLIER MANAGEMENT
   * ==========================================================================
   */

  async createSupplier(pharmacyUserId: string, dto: CreateSupplierDto): Promise<SupplierDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const supplierCode = generateSequenceCode('SUP');

    // Check if supplier with same name or code already exists for this pharmacy
    const existing = await SupplierModel.findOne({
      pharmacyId,
      name: { $regex: new RegExp(`^${dto.name.trim()}$`, 'i') },
    });
    if (existing) {
      throw AppError.conflict(`Supplier with name '${dto.name}' already exists in your pharmacy.`);
    }

    const supplier = await SupplierModel.create({
      pharmacyId,
      supplierCode,
      name: dto.name.trim(),
      legalName: dto.legalName?.trim(),
      supplierType: dto.supplierType || 'DISTRIBUTOR',
      status: 'ACTIVE',
      verificationStatus: 'UNVERIFIED',
      taxId: dto.taxId?.trim(),
      panNumber: dto.panNumber?.trim().toUpperCase(),
      drugLicenseNumber: dto.drugLicenseNumber?.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      alternatePhone: dto.alternatePhone?.trim(),
      address: {
        line1: dto.address.line1?.trim(),
        city: dto.address.city.trim(),
        state: dto.address.state.trim(),
        postalCode: dto.address.postalCode.trim(),
        country: dto.address.country?.trim() || 'India',
      },
      contactPersons: dto.contactPersons || [],
      paymentTermsDays: dto.paymentTermsDays ?? 30,
      leadTimeDays: dto.leadTimeDays ?? 7,
      rating: 5,
      bankDetails: dto.bankDetails,
      notes: dto.notes?.trim(),
    });

    return this.mapSupplierToDto(supplier);
  }

  async getSuppliers(
    pharmacyUserId: string,
    query: SupplierFilterDto
  ): Promise<{ data: SupplierDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { pharmacyId };

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.supplierType && query.supplierType !== 'ALL') {
      filter.supplierType = query.supplierType;
    }

    if (query.verificationStatus && query.verificationStatus !== 'ALL') {
      filter.verificationStatus = query.verificationStatus;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { legalName: searchRegex },
        { supplierCode: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { taxId: searchRegex },
      ];
    }

    const [total, suppliers] = await Promise.all([
      SupplierModel.countDocuments(filter),
      SupplierModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return {
      data: suppliers.map((s) => this.mapSupplierToDto(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSupplierById(pharmacyUserId: string, supplierId: string): Promise<SupplierDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(supplierId)) {
      throw AppError.badRequest('Invalid supplier ID format');
    }

    const supplier = await SupplierModel.findOne({ _id: new Types.ObjectId(supplierId), pharmacyId });
    if (!supplier) {
      throw AppError.notFound('Supplier not found or you lack permission to view it');
    }

    return this.mapSupplierToDto(supplier);
  }

  async updateSupplier(
    pharmacyUserId: string,
    supplierId: string,
    dto: UpdateSupplierDto
  ): Promise<SupplierDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(supplierId)) {
      throw AppError.badRequest('Invalid supplier ID format');
    }

    const supplier = await SupplierModel.findOne({ _id: new Types.ObjectId(supplierId), pharmacyId });
    if (!supplier) {
      throw AppError.notFound('Supplier not found or you lack permission to modify it');
    }

    if (dto.name !== undefined) supplier.name = dto.name.trim();
    if (dto.legalName !== undefined) supplier.legalName = dto.legalName.trim();
    if (dto.supplierType !== undefined) supplier.supplierType = dto.supplierType;
    if (dto.status !== undefined) supplier.status = dto.status;
    if (dto.taxId !== undefined) supplier.taxId = dto.taxId.trim();
    if (dto.panNumber !== undefined) supplier.panNumber = dto.panNumber.trim().toUpperCase();
    if (dto.drugLicenseNumber !== undefined) supplier.drugLicenseNumber = dto.drugLicenseNumber.trim();
    if (dto.email !== undefined) supplier.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) supplier.phone = dto.phone.trim();
    if (dto.alternatePhone !== undefined) supplier.alternatePhone = dto.alternatePhone.trim();
    if (dto.address) {
      supplier.address = {
        line1: dto.address.line1 !== undefined ? dto.address.line1.trim() : supplier.address.line1,
        city: dto.address.city !== undefined ? dto.address.city.trim() : supplier.address.city,
        state: dto.address.state !== undefined ? dto.address.state.trim() : supplier.address.state,
        postalCode: dto.address.postalCode !== undefined ? dto.address.postalCode.trim() : supplier.address.postalCode,
        country: dto.address.country !== undefined ? dto.address.country.trim() : supplier.address.country,
      };
    }
    if (dto.contactPersons !== undefined) supplier.contactPersons = dto.contactPersons;
    if (dto.paymentTermsDays !== undefined) supplier.paymentTermsDays = dto.paymentTermsDays;
    if (dto.leadTimeDays !== undefined) supplier.leadTimeDays = dto.leadTimeDays;
    if (dto.rating !== undefined) supplier.rating = dto.rating;
    if (dto.bankDetails !== undefined) {
      supplier.bankDetails = {
        bankName: dto.bankDetails.bankName || supplier.bankDetails?.bankName || '',
        accountNumber: dto.bankDetails.accountNumber || supplier.bankDetails?.accountNumber || '',
        ifscCode: dto.bankDetails.ifscCode || supplier.bankDetails?.ifscCode || '',
        branchName: dto.bankDetails.branchName ?? supplier.bankDetails?.branchName,
      };
    }
    if (dto.notes !== undefined) supplier.notes = dto.notes.trim();

    await supplier.save();
    return this.mapSupplierToDto(supplier);
  }

  async getSupplierPurchaseHistory(pharmacyUserId: string, supplierId: string): Promise<PurchaseOrderDto[]> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(supplierId)) {
      throw AppError.badRequest('Invalid supplier ID format');
    }

    const orders = await PurchaseOrderModel.find({
      pharmacyId,
      supplierId: new Types.ObjectId(supplierId),
    }).sort({ orderDate: -1 });

    return orders.map((o) => this.mapPurchaseOrderToDto(o));
  }

  /**
   * ==========================================================================
   * 2. SUPPLIER PRODUCT CATALOG
   * ==========================================================================
   */

  async addSupplierProduct(
    pharmacyUserId: string,
    dto: CreateSupplierProductDto
  ): Promise<SupplierProductDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);

    const [supplier, medication] = await Promise.all([
      SupplierModel.findOne({ _id: new Types.ObjectId(dto.supplierId), pharmacyId }),
      MedicationCatalogModel.findById(new Types.ObjectId(dto.medicationCatalogId)),
    ]);

    if (!supplier) {
      throw AppError.notFound('Supplier not found or not owned by your pharmacy');
    }
    if (!medication) {
      throw AppError.notFound('Medication not found in catalog');
    }

    // Upsert supplier product
    const product = await SupplierProductModel.findOneAndUpdate(
      {
        pharmacyId,
        supplierId: supplier._id,
        medicationCatalogId: medication._id,
      },
      {
        pharmacyId,
        supplierId: supplier._id,
        supplierName: supplier.name,
        medicationCatalogId: medication._id,
        medicationName: medication.name,
        genericName: medication.genericName,
        brandName: medication.brandName,
        dosageForm: medication.dosageForm,
        strength: medication.strength,
        supplierProductCode: dto.supplierProductCode?.trim(),
        purchasePrice: dto.purchasePrice,
        mrp: dto.mrp,
        minimumOrderQuantity: dto.minimumOrderQuantity ?? 1,
        packSize: dto.packSize?.trim(),
        leadTimeDays: dto.leadTimeDays ?? supplier.leadTimeDays,
        isAvailable: dto.isAvailable ?? true,
        notes: dto.notes?.trim(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return this.mapSupplierProductToDto(product);
  }

  async getSupplierProducts(
    pharmacyUserId: string,
    query: SupplierProductFilterDto
  ): Promise<{ data: SupplierProductDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { pharmacyId };

    if (query.supplierId && Types.ObjectId.isValid(query.supplierId)) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }
    if (query.medicationCatalogId && Types.ObjectId.isValid(query.medicationCatalogId)) {
      filter.medicationCatalogId = new Types.ObjectId(query.medicationCatalogId);
    }
    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable;
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { medicationName: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { supplierName: searchRegex },
        { supplierProductCode: searchRegex },
      ];
    }

    const [total, products] = await Promise.all([
      SupplierProductModel.countDocuments(filter),
      SupplierProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return {
      data: products.map((p) => this.mapSupplierProductToDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateSupplierProduct(
    pharmacyUserId: string,
    productId: string,
    dto: UpdateSupplierProductDto
  ): Promise<SupplierProductDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(productId)) {
      throw AppError.badRequest('Invalid product ID format');
    }

    const product = await SupplierProductModel.findOne({
      _id: new Types.ObjectId(productId),
      pharmacyId,
    });
    if (!product) {
      throw AppError.notFound('Supplier product mapping not found');
    }

    if (dto.supplierProductCode !== undefined) product.supplierProductCode = dto.supplierProductCode.trim();
    if (dto.purchasePrice !== undefined) product.purchasePrice = dto.purchasePrice;
    if (dto.mrp !== undefined) product.mrp = dto.mrp;
    if (dto.minimumOrderQuantity !== undefined) product.minimumOrderQuantity = dto.minimumOrderQuantity;
    if (dto.packSize !== undefined) product.packSize = dto.packSize.trim();
    if (dto.leadTimeDays !== undefined) product.leadTimeDays = dto.leadTimeDays;
    if (dto.isAvailable !== undefined) product.isAvailable = dto.isAvailable;
    if (dto.notes !== undefined) product.notes = dto.notes.trim();

    await product.save();
    return this.mapSupplierProductToDto(product);
  }

  async deleteSupplierProduct(pharmacyUserId: string, productId: string): Promise<void> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(productId)) {
      throw AppError.badRequest('Invalid product ID format');
    }

    const res = await SupplierProductModel.deleteOne({
      _id: new Types.ObjectId(productId),
      pharmacyId,
    });
    if (res.deletedCount === 0) {
      throw AppError.notFound('Supplier product mapping not found');
    }
  }

  /**
   * ==========================================================================
   * 3. PURCHASE REQUISITIONS
   * ==========================================================================
   */

  async createRequisition(
    pharmacyUserId: string,
    dto: CreatePurchaseRequisitionDto
  ): Promise<PurchaseRequisitionDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const requisitionNumber = generateSequenceCode('REQ');

    const user = (await UserModel.findById(pharmacyId)) as any;
    const requestedByName = user?.fullName || user?.name || 'Authorized Pharmacist';

    let totalEstimatedAmount = 0;
    const items = [];

    for (const item of dto.items) {
      const med = await MedicationCatalogModel.findById(new Types.ObjectId(item.medicationCatalogId));
      if (!med) {
        throw AppError.notFound(`Medication '${item.medicationCatalogId}' not found in catalog`);
      }

      let preferredSupplierName: string | undefined;
      if (item.preferredSupplierId && Types.ObjectId.isValid(item.preferredSupplierId)) {
        const sup = await SupplierModel.findOne({
          _id: new Types.ObjectId(item.preferredSupplierId),
          pharmacyId,
        });
        if (sup) preferredSupplierName = sup.name;
      }

      const estimatedTotalPrice = item.requestedQuantity * item.estimatedUnitPrice;
      totalEstimatedAmount += estimatedTotalPrice;

      items.push({
        medicationCatalogId: med._id,
        medicationName: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        dosageForm: med.dosageForm,
        strength: med.strength,
        requestedQuantity: item.requestedQuantity,
        approvedQuantity: item.requestedQuantity,
        unitOfMeasure: item.unitOfMeasure || 'Units',
        estimatedUnitPrice: item.estimatedUnitPrice,
        estimatedTotalPrice,
        preferredSupplierId: item.preferredSupplierId
          ? new Types.ObjectId(item.preferredSupplierId)
          : undefined,
        preferredSupplierName,
        reasonForRequest: item.reasonForRequest?.trim(),
        notes: item.notes?.trim(),
      });
    }

    const requisition = await PurchaseRequisitionModel.create({
      requisitionNumber,
      pharmacyId,
      requestedBy: pharmacyId,
      requestedByName,
      status: 'SUBMITTED',
      priority: dto.priority || 'MEDIUM',
      items,
      totalEstimatedAmount,
      requiredByDate: dto.requiredByDate ? new Date(dto.requiredByDate) : undefined,
      notes: dto.notes?.trim(),
    });

    return this.mapRequisitionToDto(requisition);
  }

  async getRequisitions(
    pharmacyUserId: string,
    query: RequisitionFilterDto
  ): Promise<{ data: PurchaseRequisitionDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { pharmacyId };

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.priority && query.priority !== 'ALL') {
      filter.priority = query.priority;
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { requisitionNumber: searchRegex },
        { requestedByName: searchRegex },
        { notes: searchRegex },
        { 'items.medicationName': searchRegex },
      ];
    }

    const [total, requisitions] = await Promise.all([
      PurchaseRequisitionModel.countDocuments(filter),
      PurchaseRequisitionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return {
      data: requisitions.map((r) => this.mapRequisitionToDto(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getRequisitionById(pharmacyUserId: string, requisitionId: string): Promise<PurchaseRequisitionDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(requisitionId)) {
      throw AppError.badRequest('Invalid requisition ID format');
    }

    const req = await PurchaseRequisitionModel.findOne({
      _id: new Types.ObjectId(requisitionId),
      pharmacyId,
    });
    if (!req) {
      throw AppError.notFound('Purchase requisition not found or you lack access');
    }

    return this.mapRequisitionToDto(req);
  }

  async updateRequisition(
    pharmacyUserId: string,
    requisitionId: string,
    dto: UpdatePurchaseRequisitionDto
  ): Promise<PurchaseRequisitionDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(requisitionId)) {
      throw AppError.badRequest('Invalid requisition ID format');
    }

    const req = await PurchaseRequisitionModel.findOne({
      _id: new Types.ObjectId(requisitionId),
      pharmacyId,
    });
    if (!req) {
      throw AppError.notFound('Purchase requisition not found');
    }

    if (req.status === 'CONVERTED_TO_PURCHASE_ORDER' || req.status === 'CANCELLED') {
      throw AppError.badRequest(`Cannot modify requisition with status ${req.status}`);
    }

    if (dto.priority) req.priority = dto.priority;
    if (dto.requiredByDate) req.requiredByDate = new Date(dto.requiredByDate);
    if (dto.notes !== undefined) req.notes = dto.notes.trim();
    if (dto.status) req.status = dto.status;

    if (dto.items && dto.items.length > 0) {
      let total = 0;
      const items = [];
      for (const item of dto.items) {
        const med = await MedicationCatalogModel.findById(new Types.ObjectId(item.medicationCatalogId));
        if (!med) {
          throw AppError.notFound(`Medication '${item.medicationCatalogId}' not found in catalog`);
        }
        const itemTotal = item.requestedQuantity * item.estimatedUnitPrice;
        total += itemTotal;
        items.push({
          medicationCatalogId: med._id,
          medicationName: med.name,
          genericName: med.genericName,
          brandName: med.brandName,
          dosageForm: med.dosageForm,
          strength: med.strength,
          requestedQuantity: item.requestedQuantity,
          approvedQuantity: item.requestedQuantity,
          unitOfMeasure: item.unitOfMeasure || 'Units',
          estimatedUnitPrice: item.estimatedUnitPrice,
          estimatedTotalPrice: itemTotal,
          preferredSupplierId: item.preferredSupplierId ? new Types.ObjectId(item.preferredSupplierId) : undefined,
          reasonForRequest: item.reasonForRequest?.trim(),
          notes: item.notes?.trim(),
        });
      }
      req.items = items as any;
      req.totalEstimatedAmount = total;
    }

    await req.save();
    return this.mapRequisitionToDto(req);
  }

  async approveRequisition(
    pharmacyUserId: string,
    requisitionId: string,
    approvalNotes?: string
  ): Promise<PurchaseRequisitionDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(requisitionId)) {
      throw AppError.badRequest('Invalid requisition ID format');
    }

    const req = await PurchaseRequisitionModel.findOne({
      _id: new Types.ObjectId(requisitionId),
      pharmacyId,
    });
    if (!req) {
      throw AppError.notFound('Purchase requisition not found');
    }

    const user = (await UserModel.findById(pharmacyId)) as any;
    req.status = 'APPROVED';
    req.approvalNotes = approvalNotes?.trim();
    req.approvedBy = pharmacyId;
    req.approvedByName = user?.fullName || user?.name || 'Chief Pharmacist';
    req.approvedAt = new Date();

    await req.save();
    return this.mapRequisitionToDto(req);
  }

  async convertRequisitionToPO(
    pharmacyUserId: string,
    requisitionId: string,
    supplierId: string
  ): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(requisitionId) || !Types.ObjectId.isValid(supplierId)) {
      throw AppError.badRequest('Invalid ID format');
    }

    const [req, supplier] = await Promise.all([
      PurchaseRequisitionModel.findOne({ _id: new Types.ObjectId(requisitionId), pharmacyId }),
      SupplierModel.findOne({ _id: new Types.ObjectId(supplierId), pharmacyId }),
    ]);

    if (!req) {
      throw AppError.notFound('Purchase requisition not found');
    }
    if (req.status !== 'APPROVED') {
      throw AppError.badRequest('Only APPROVED requisitions can be converted to Purchase Orders');
    }
    if (!supplier) {
      throw AppError.notFound('Supplier not found or not owned by your pharmacy');
    }

    // Create purchase order from requisition items
    const po = await this.createPurchaseOrder(pharmacyUserId, {
      supplierId: supplier._id.toString(),
      requisitionId: req._id.toString(),
      expectedDeliveryDate: req.requiredByDate ? req.requiredByDate.toISOString() : undefined,
      notes: `Generated from Requisition ${req.requisitionNumber}. ${req.notes || ''}`.trim(),
      items: req.items.map((it) => ({
        medicationCatalogId: it.medicationCatalogId.toString(),
        orderedQuantity: it.approvedQuantity || it.requestedQuantity,
        unitPrice: it.estimatedUnitPrice,
        discountPercent: 0,
        taxPercent: 5,
        notes: it.notes,
      })),
    });

    req.status = 'CONVERTED_TO_PURCHASE_ORDER';
    req.convertedPurchaseOrderId = new Types.ObjectId(po.id);
    req.convertedPurchaseOrderNumber = po.poNumber;
    await req.save();

    return po;
  }

  /**
   * ==========================================================================
   * 4. PURCHASE ORDERS
   * ==========================================================================
   */

  async createPurchaseOrder(
    pharmacyUserId: string,
    dto: CreatePurchaseOrderDto
  ): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const poNumber = generateSequenceCode('PO');

    const [supplier, user] = await Promise.all([
      SupplierModel.findOne({ _id: new Types.ObjectId(dto.supplierId), pharmacyId }),
      UserModel.findById(pharmacyId),
    ]);

    if (!supplier) {
      throw AppError.notFound('Supplier not found or not owned by your pharmacy');
    }

    const createdByName = (user as any)?.fullName || (user as any)?.name || 'Procurement Officer';

    // Authoritative Server-Side Financial Calculation
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    const items = [];

    for (const item of dto.items) {
      const med = await MedicationCatalogModel.findById(new Types.ObjectId(item.medicationCatalogId));
      if (!med) {
        throw AppError.notFound(`Medication '${item.medicationCatalogId}' not found in catalog`);
      }

      const discountPercent = item.discountPercent ?? 0;
      const taxPercent = item.taxPercent ?? 0;

      const itemSubtotal = item.orderedQuantity * item.unitPrice;
      const discountAmount = itemSubtotal * (discountPercent / 100);
      const taxableAmount = itemSubtotal - discountAmount;
      const itemTax = taxableAmount * (taxPercent / 100);
      const itemTotal = taxableAmount + itemTax;

      subtotal += itemSubtotal;
      discountTotal += discountAmount;
      taxTotal += itemTax;

      items.push({
        medicationCatalogId: med._id,
        medicationName: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        dosageForm: med.dosageForm,
        strength: med.strength,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: 0,
        remainingQuantity: item.orderedQuantity,
        unitPrice: item.unitPrice,
        discountPercent,
        taxPercent,
        itemSubtotal,
        itemTax,
        itemTotal,
        packSize: item.packSize?.trim(),
        supplierProductCode: item.supplierProductCode?.trim(),
        notes: item.notes?.trim(),
      });
    }

    const grandTotal = subtotal - discountTotal + taxTotal;

    const po = await PurchaseOrderModel.create({
      poNumber,
      pharmacyId,
      requisitionId: dto.requisitionId ? new Types.ObjectId(dto.requisitionId) : undefined,
      supplierId: supplier._id,
      supplierName: supplier.name,
      supplierCode: supplier.supplierCode,
      supplierGstin: supplier.taxId,
      supplierDrugLicense: supplier.drugLicenseNumber,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phone,
      status: 'PENDING_APPROVAL',
      orderDate: new Date(),
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      paymentTermsDays: dto.paymentTermsDays ?? supplier.paymentTermsDays ?? 30,
      deliveryAddress: dto.deliveryAddress || {
        line1: supplier.address.line1,
        city: supplier.address.city,
        state: supplier.address.state,
        postalCode: supplier.address.postalCode,
        country: 'India',
      },
      items,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      notes: dto.notes?.trim(),
      termsAndConditions: dto.termsAndConditions?.trim(),
      createdBy: pharmacyId,
      createdByName,
    });

    return this.mapPurchaseOrderToDto(po);
  }

  async getPurchaseOrders(
    pharmacyUserId: string,
    query: PurchaseOrderFilterDto
  ): Promise<{ data: PurchaseOrderDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { pharmacyId };

    if (query.supplierId && Types.ObjectId.isValid(query.supplierId)) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.startDate || query.endDate) {
      filter.orderDate = {};
      if (query.startDate) filter.orderDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.orderDate.$lte = new Date(query.endDate);
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { poNumber: searchRegex },
        { supplierName: searchRegex },
        { supplierCode: searchRegex },
        { 'items.medicationName': searchRegex },
      ];
    }

    const [total, orders] = await Promise.all([
      PurchaseOrderModel.countDocuments(filter),
      PurchaseOrderModel.find(filter).sort({ orderDate: -1 }).skip(skip).limit(limit),
    ]);

    return {
      data: orders.map((o) => this.mapPurchaseOrderToDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getPurchaseOrderById(pharmacyUserId: string, poId: string): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found or you lack permission to view it');
    }

    return this.mapPurchaseOrderToDto(po);
  }

  async updatePurchaseOrder(
    pharmacyUserId: string,
    poId: string,
    dto: UpdatePurchaseOrderDto
  ): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    if (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL') {
      throw AppError.badRequest(`Cannot modify purchase order in status ${po.status}`);
    }

    if (dto.expectedDeliveryDate) po.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
    if (dto.paymentTermsDays !== undefined) po.paymentTermsDays = dto.paymentTermsDays;
    if (dto.deliveryAddress) po.deliveryAddress = dto.deliveryAddress as any;
    if (dto.notes !== undefined) po.notes = dto.notes.trim();
    if (dto.termsAndConditions !== undefined) po.termsAndConditions = dto.termsAndConditions.trim();

    if (dto.items && dto.items.length > 0) {
      let subtotal = 0;
      let taxTotal = 0;
      let discountTotal = 0;
      const items = [];

      for (const item of dto.items) {
        const med = await MedicationCatalogModel.findById(new Types.ObjectId(item.medicationCatalogId));
        if (!med) {
          throw AppError.notFound(`Medication '${item.medicationCatalogId}' not found`);
        }

        const discountPercent = item.discountPercent ?? 0;
        const taxPercent = item.taxPercent ?? 0;

        const itemSubtotal = item.orderedQuantity * item.unitPrice;
        const discountAmount = itemSubtotal * (discountPercent / 100);
        const taxableAmount = itemSubtotal - discountAmount;
        const itemTax = taxableAmount * (taxPercent / 100);
        const itemTotal = taxableAmount + itemTax;

        subtotal += itemSubtotal;
        discountTotal += discountAmount;
        taxTotal += itemTax;

        items.push({
          medicationCatalogId: med._id,
          medicationName: med.name,
          genericName: med.genericName,
          brandName: med.brandName,
          dosageForm: med.dosageForm,
          strength: med.strength,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: 0,
          remainingQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          discountPercent,
          taxPercent,
          itemSubtotal,
          itemTax,
          itemTotal,
          packSize: item.packSize?.trim(),
          supplierProductCode: item.supplierProductCode?.trim(),
          notes: item.notes?.trim(),
        });
      }

      po.items = items as any;
      po.subtotal = subtotal;
      po.discountTotal = discountTotal;
      po.taxTotal = taxTotal;
      po.grandTotal = subtotal - discountTotal + taxTotal;
    }

    await po.save();
    return this.mapPurchaseOrderToDto(po);
  }

  async submitPOForApproval(pharmacyUserId: string, poId: string): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw AppError.badRequest(`Only DRAFT orders can be submitted for approval (current: ${po.status})`);
    }

    po.status = 'PENDING_APPROVAL';
    await po.save();
    return this.mapPurchaseOrderToDto(po);
  }

  async approvePurchaseOrder(
    pharmacyUserId: string,
    poId: string,
    dto: ApprovePurchaseOrderDto
  ): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    if (po.status !== 'PENDING_APPROVAL') {
      throw AppError.badRequest(`Order must be in PENDING_APPROVAL status (current: ${po.status})`);
    }

    const user = (await UserModel.findById(pharmacyId)) as any;
    const approverName = user?.fullName || user?.name || 'Chief Pharmacist / Director';

    po.status = 'APPROVED';
    po.approvalDetails = {
      approvedBy: pharmacyId,
      approverName,
      approvedAt: new Date(),
      comments: dto.comments?.trim(),
    };

    await po.save();

    try {
      await notificationService.publishEvent({
        recipientId: pharmacyUserId,
        recipientRole: 'PHARMACY',
        category: 'PROCUREMENT',
        eventType: 'PURCHASE_ORDER_APPROVED',
        title: 'Purchase Order Approved',
        message: `Purchase order #${po.poNumber} has been approved by ${approverName}.`,
        priority: 'MEDIUM',
        relatedEntity: {
          entityType: 'PURCHASE_ORDER',
          entityId: po._id.toString(),
          referenceNumber: po.poNumber,
        },
        linkUrl: '/pharmacy/procurement',
      });
    } catch {
      // Non-fatal
    }

    return this.mapPurchaseOrderToDto(po);
  }

  async rejectPurchaseOrder(
    pharmacyUserId: string,
    poId: string,
    dto: RejectPurchaseOrderDto
  ): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    if (po.status !== 'PENDING_APPROVAL') {
      throw AppError.badRequest(`Order must be in PENDING_APPROVAL status (current: ${po.status})`);
    }

    const user = (await UserModel.findById(pharmacyId)) as any;
    const approverName = user?.fullName || user?.name || 'Authorized Supervisor';

    po.status = 'REJECTED';
    po.approvalDetails = {
      approvedBy: pharmacyId,
      approverName,
      approvedAt: new Date(),
      rejectedReason: dto.reason.trim(),
    };

    await po.save();

    try {
      await notificationService.publishEvent({
        recipientId: pharmacyUserId,
        recipientRole: 'PHARMACY',
        category: 'PROCUREMENT',
        eventType: 'PURCHASE_ORDER_REJECTED',
        title: 'Purchase Order Rejected',
        message: `Purchase order #${po.poNumber} was rejected: ${dto.reason.trim()}.`,
        priority: 'HIGH',
        relatedEntity: {
          entityType: 'PURCHASE_ORDER',
          entityId: po._id.toString(),
          referenceNumber: po.poNumber,
        },
        linkUrl: '/pharmacy/procurement',
      });
    } catch {
      // Non-fatal
    }

    return this.mapPurchaseOrderToDto(po);
  }

  async sendPurchaseOrderToSupplier(pharmacyUserId: string, poId: string): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    if (po.status !== 'APPROVED') {
      throw AppError.badRequest(`Order must be APPROVED before dispatching to supplier (current: ${po.status})`);
    }

    po.status = 'SENT_TO_SUPPLIER';
    po.sentToSupplierAt = new Date();
    await po.save();

    return this.mapPurchaseOrderToDto(po);
  }

  async cancelPurchaseOrder(
    pharmacyUserId: string,
    poId: string,
    reason: string
  ): Promise<PurchaseOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    if (po.status === 'FULLY_RECEIVED') {
      throw AppError.badRequest('Cannot cancel an order that has already been FULLY_RECEIVED');
    }

    const user = (await UserModel.findById(pharmacyId)) as any;
    const cancelledByName = user?.fullName || user?.name || 'Pharmacist';

    po.status = 'CANCELLED';
    po.cancellationDetails = {
      cancelledBy: pharmacyId,
      cancelledByName,
      cancelledAt: new Date(),
      reason: reason.trim(),
    };

    await po.save();
    return this.mapPurchaseOrderToDto(po);
  }

  /**
   * ==========================================================================
   * 5. GOODS RECEIVING (GRN) & INVENTORY INTEGRATION
   * ==========================================================================
   */

  async receiveGoods(
    pharmacyUserId: string,
    poId: string,
    dto: ReceiveGoodsDto
  ): Promise<GoodsReceiptDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(poId)) {
      throw AppError.badRequest('Invalid purchase order ID format');
    }

    const po = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(poId), pharmacyId });
    if (!po) {
      throw AppError.notFound('Purchase order not found or you lack permission to receive it');
    }

    const eligibleStatuses = ['APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED'];
    if (!eligibleStatuses.includes(po.status)) {
      throw AppError.badRequest(
        `Cannot receive goods against purchase order in status ${po.status}. Must be APPROVED, SENT_TO_SUPPLIER, or PARTIALLY_RECEIVED.`
      );
    }

    const user = (await UserModel.findById(pharmacyId)) as any;
    const receiverName = user?.fullName || user?.name || 'Receiving Pharmacist';

    const grnNumber = generateSequenceCode('GRN');

    let totalReceivedQuantity = 0;
    let totalAcceptedQuantity = 0;
    let totalRejectedQuantity = 0;
    let totalAmount = 0;

    const grnItems = [];

    for (const itemDto of dto.items) {
      // Find matching item in PO
      const poItem = po.items.find((it) => it._id?.toString() === itemDto.purchaseOrderItemId);
      if (!poItem) {
        throw AppError.badRequest(
          `Line item '${itemDto.purchaseOrderItemId}' does not belong to Purchase Order ${po.poNumber}`
        );
      }

      // Cumulative received check
      const newCumulativeReceived = poItem.receivedQuantity + itemDto.receivedQuantity;
      if (newCumulativeReceived > poItem.orderedQuantity) {
        throw AppError.badRequest(
          `Received quantity (${itemDto.receivedQuantity}) exceeds remaining order quantity (${poItem.remainingQuantity}) for item '${poItem.medicationName}'. Ordered: ${poItem.orderedQuantity}, Already Received: ${poItem.receivedQuantity}.`
        );
      }

      const rejectedQuantity = itemDto.rejectedQuantity ?? 0;
      const acceptedQuantity = itemDto.receivedQuantity - rejectedQuantity;
      if (acceptedQuantity < 0) {
        throw AppError.badRequest('Rejected quantity cannot exceed received quantity');
      }

      const mfgDate = new Date(itemDto.manufacturingDate);
      const expDate = new Date(itemDto.expiryDate);
      if (isNaN(mfgDate.getTime()) || isNaN(expDate.getTime())) {
        throw AppError.badRequest('Invalid manufacturing or expiry date');
      }
      if (expDate <= new Date()) {
        throw AppError.badRequest('Cannot receive expired medication batches into active inventory');
      }

      const taxPercent = itemDto.taxPercent ?? poItem.taxPercent ?? 0;
      const taxable = itemDto.receivedQuantity * itemDto.unitPurchasePrice;
      const itemTax = taxable * (taxPercent / 100);
      const itemTotal = taxable + itemTax;

      totalReceivedQuantity += itemDto.receivedQuantity;
      totalAcceptedQuantity += acceptedQuantity;
      totalRejectedQuantity += rejectedQuantity;
      totalAmount += itemTotal;

      // Update PO item
      poItem.receivedQuantity = newCumulativeReceived;
      poItem.remainingQuantity = poItem.orderedQuantity - newCumulativeReceived;

      // ========================================================================
      // INVENTORY BATCH INTEGRATION
      // ========================================================================
      let batch = await PharmacyInventoryModel.findOne({
        pharmacyId,
        medicationCatalogId: poItem.medicationCatalogId,
        batchNumber: itemDto.batchNumber.trim(),
      });

      let previousQty = 0;
      let newQty = acceptedQuantity;

      if (batch) {
        previousQty = batch.availableQuantity;
        newQty = previousQty + acceptedQuantity;
        batch.availableQuantity = newQty;
        batch.sellingPrice = itemDto.sellingPrice;
        batch.purchasePrice = itemDto.unitPurchasePrice;
        if (itemDto.mrp) batch.mrp = itemDto.mrp;
        if (batch.status === 'OUT_OF_STOCK' && newQty > 0) {
          batch.status = 'IN_STOCK';
        }
        await batch.save();
      } else {
        batch = await PharmacyInventoryModel.create({
          pharmacyId,
          medicationCatalogId: poItem.medicationCatalogId,
          medicationName: poItem.medicationName,
          genericName: poItem.genericName,
          brandName: poItem.brandName,
          dosageForm: poItem.dosageForm,
          strength: poItem.strength,
          supplier: po.supplierName,
          invoiceNumber: dto.supplierInvoiceNumber.trim(),
          batchNumber: itemDto.batchNumber.trim(),
          receivedQuantity: acceptedQuantity,
          availableQuantity: acceptedQuantity,
          reservedQuantity: 0,
          reorderLevel: 20,
          purchasePrice: itemDto.unitPurchasePrice,
          sellingPrice: itemDto.sellingPrice,
          mrp: itemDto.mrp ?? itemDto.sellingPrice,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          status: 'IN_STOCK',
          rackLocation: itemDto.storageLocation?.trim() || 'Receiving Bay A',
        });
      }

      // ========================================================================
      // IMMUTABLE LEDGER TRANSACTION
      // ========================================================================
      await PharmacyInventoryTransactionModel.create({
        pharmacyId,
        inventoryId: batch._id,
        transactionType: 'STOCK_RECEIVED',
        quantity: acceptedQuantity,
        previousQuantity: previousQty,
        newQuantity: newQty,
        referenceType: 'PURCHASE_ORDER',
        referenceId: po._id,
        batchNumber: itemDto.batchNumber.trim(),
        reason: `Goods received against PO ${po.poNumber} under GRN ${grnNumber}`,
        performedBy: pharmacyId,
        performedByName: receiverName,
      });

      grnItems.push({
        purchaseOrderItemId: poItem._id,
        medicationCatalogId: poItem.medicationCatalogId,
        medicationName: poItem.medicationName,
        dosageForm: poItem.dosageForm,
        strength: poItem.strength,
        batchNumber: itemDto.batchNumber.trim(),
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        orderedQuantity: poItem.orderedQuantity,
        receivedQuantity: itemDto.receivedQuantity,
        rejectedQuantity,
        acceptedQuantity,
        unitPurchasePrice: itemDto.unitPurchasePrice,
        sellingPrice: itemDto.sellingPrice,
        mrp: itemDto.mrp,
        taxPercent,
        itemTotal,
        storageLocation: itemDto.storageLocation?.trim(),
        remarks: itemDto.remarks?.trim(),
      });
    }

    // Determine new PO status: FULLY_RECEIVED if all items have 0 remaining
    const isFullyReceived = po.items.every((it) => it.remainingQuantity === 0);
    po.status = isFullyReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';
    await po.save();

    // Create Goods Receipt document
    const grn = await GoodsReceiptModel.create({
      grnNumber,
      pharmacyId,
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      supplierInvoiceNumber: dto.supplierInvoiceNumber.trim(),
      supplierInvoiceDate: new Date(dto.supplierInvoiceDate),
      receivedDate: new Date(),
      receivedBy: pharmacyId,
      receiverName,
      status: 'CONFIRMED',
      items: grnItems,
      totalItemsCount: grnItems.length,
      totalReceivedQuantity,
      totalAcceptedQuantity,
      totalRejectedQuantity,
      totalAmount,
      notes: dto.notes?.trim(),
    });

    try {
      await notificationService.publishEvent({
        recipientId: pharmacyUserId,
        recipientRole: 'PHARMACY',
        category: 'PROCUREMENT',
        eventType: 'GOODS_RECEIVED',
        title: 'Goods Received Note Created',
        message: `GRN #${grnNumber} generated for PO #${po.poNumber} (${grn.totalAcceptedQuantity} units accepted into inventory).`,
        priority: 'MEDIUM',
        relatedEntity: {
          entityType: 'PURCHASE_ORDER',
          entityId: po._id.toString(),
          referenceNumber: po.poNumber,
        },
        linkUrl: '/pharmacy/procurement',
      });
    } catch {
      // Non-fatal
    }

    return this.mapGoodsReceiptToDto(grn);
  }

  async getGoodsReceipts(
    pharmacyUserId: string,
    query: GoodsReceiptFilterDto
  ): Promise<{ data: GoodsReceiptDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { pharmacyId };

    if (query.purchaseOrderId && Types.ObjectId.isValid(query.purchaseOrderId)) {
      filter.purchaseOrderId = new Types.ObjectId(query.purchaseOrderId);
    }
    if (query.supplierId && Types.ObjectId.isValid(query.supplierId)) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.startDate || query.endDate) {
      filter.receivedDate = {};
      if (query.startDate) filter.receivedDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.receivedDate.$lte = new Date(query.endDate);
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { grnNumber: searchRegex },
        { poNumber: searchRegex },
        { supplierName: searchRegex },
        { supplierInvoiceNumber: searchRegex },
      ];
    }

    const [total, receipts] = await Promise.all([
      GoodsReceiptModel.countDocuments(filter),
      GoodsReceiptModel.find(filter).sort({ receivedDate: -1 }).skip(skip).limit(limit),
    ]);

    return {
      data: receipts.map((g) => this.mapGoodsReceiptToDto(g)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getGoodsReceiptById(pharmacyUserId: string, grnId: string): Promise<GoodsReceiptDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(grnId)) {
      throw AppError.badRequest('Invalid GRN ID format');
    }

    const grn = await GoodsReceiptModel.findOne({ _id: new Types.ObjectId(grnId), pharmacyId });
    if (!grn) {
      throw AppError.notFound('Goods receipt note not found');
    }

    return this.mapGoodsReceiptToDto(grn);
  }

  /**
   * ==========================================================================
   * 6. PURCHASE INVOICE RECORDS & RECONCILIATION
   * ==========================================================================
   */

  async createPurchaseInvoice(
    pharmacyUserId: string,
    dto: CreatePurchaseInvoiceDto
  ): Promise<PurchaseInvoiceDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);

    const [supplier, po] = await Promise.all([
      SupplierModel.findOne({ _id: new Types.ObjectId(dto.supplierId), pharmacyId }),
      PurchaseOrderModel.findOne({ _id: new Types.ObjectId(dto.purchaseOrderId), pharmacyId }),
    ]);

    if (!supplier) {
      throw AppError.notFound('Supplier not found');
    }
    if (!po) {
      throw AppError.notFound('Purchase order not found');
    }

    // Uniqueness check for invoiceNumber under this pharmacy and supplier
    const existing = await PurchaseInvoiceModel.findOne({
      pharmacyId,
      supplierId: supplier._id,
      invoiceNumber: dto.invoiceNumber.trim(),
    });
    if (existing) {
      throw AppError.conflict(
        `Invoice '${dto.invoiceNumber}' has already been recorded for supplier '${supplier.name}'`
      );
    }

    // Resolve GRNs if provided
    const grnNumbers: string[] = [];
    const grnObjectIds: Types.ObjectId[] = [];
    if (dto.goodsReceiptIds && dto.goodsReceiptIds.length > 0) {
      const grns = await GoodsReceiptModel.find({
        _id: { $in: dto.goodsReceiptIds.map((id) => new Types.ObjectId(id)) },
        pharmacyId,
      });
      grns.forEach((g) => {
        grnNumbers.push(g.grnNumber);
        grnObjectIds.push(g._id);
      });
    }

    const invoice = await PurchaseInvoiceModel.create({
      invoiceNumber: dto.invoiceNumber.trim(),
      pharmacyId,
      supplierId: supplier._id,
      supplierName: supplier.name,
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      goodsReceiptIds: grnObjectIds,
      grnNumbers,
      invoiceDate: new Date(dto.invoiceDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      subtotal: dto.subtotal,
      taxAmount: dto.taxAmount ?? 0,
      discountAmount: dto.discountAmount ?? 0,
      totalAmount: dto.totalAmount,
      paidAmount: dto.paidAmount ?? 0,
      status: 'PENDING',
      notes: dto.notes?.trim(),
    });

    return this.mapPurchaseInvoiceToDto(invoice);
  }

  async getPurchaseInvoices(
    pharmacyUserId: string,
    query: InvoiceFilterDto
  ): Promise<{ data: PurchaseInvoiceDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { pharmacyId };

    if (query.supplierId && Types.ObjectId.isValid(query.supplierId)) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.startDate || query.endDate) {
      filter.invoiceDate = {};
      if (query.startDate) filter.invoiceDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.invoiceDate.$lte = new Date(query.endDate);
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { invoiceNumber: searchRegex },
        { poNumber: searchRegex },
        { supplierName: searchRegex },
      ];
    }

    const [total, invoices] = await Promise.all([
      PurchaseInvoiceModel.countDocuments(filter),
      PurchaseInvoiceModel.find(filter).sort({ invoiceDate: -1 }).skip(skip).limit(limit),
    ]);

    return {
      data: invoices.map((i) => this.mapPurchaseInvoiceToDto(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getPurchaseInvoiceById(pharmacyUserId: string, invoiceId: string): Promise<PurchaseInvoiceDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw AppError.badRequest('Invalid invoice ID format');
    }

    const invoice = await PurchaseInvoiceModel.findOne({ _id: new Types.ObjectId(invoiceId), pharmacyId });
    if (!invoice) {
      throw AppError.notFound('Purchase invoice not found');
    }

    return this.mapPurchaseInvoiceToDto(invoice);
  }

  async updatePurchaseInvoice(
    pharmacyUserId: string,
    invoiceId: string,
    dto: UpdatePurchaseInvoiceDto
  ): Promise<PurchaseInvoiceDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw AppError.badRequest('Invalid invoice ID format');
    }

    const invoice = await PurchaseInvoiceModel.findOne({ _id: new Types.ObjectId(invoiceId), pharmacyId });
    if (!invoice) {
      throw AppError.notFound('Purchase invoice not found');
    }

    if (dto.status) invoice.status = dto.status;
    if (dto.paidAmount !== undefined) invoice.paidAmount = dto.paidAmount;
    if (dto.notes !== undefined) invoice.notes = dto.notes.trim();
    if (dto.reconciliationNotes !== undefined) invoice.reconciliationNotes = dto.reconciliationNotes.trim();
    if (dto.disputedReason !== undefined) invoice.disputedReason = dto.disputedReason.trim();

    await invoice.save();
    return this.mapPurchaseInvoiceToDto(invoice);
  }

  /**
   * ==========================================================================
   * 7. STOCK REPLENISHMENT & REORDER SUGGESTIONS
   * ==========================================================================
   */

  async getReplenishmentSuggestions(
    pharmacyUserId: string,
    query: ReplenishmentFilterDto
  ): Promise<ReplenishmentSuggestionDto[]> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const now = new Date();

    // 1. Fetch all inventory batches for this pharmacy that are active, non-expired, and non-quarantined
    const batches = await PharmacyInventoryModel.find({
      pharmacyId,
      status: { $nin: ['EXPIRED', 'QUARANTINED', 'DISCONTINUED'] },
      expiryDate: { $gt: now },
    });

    // 2. Fetch pending inbound quantities from active POs (APPROVED, SENT_TO_SUPPLIER, PARTIALLY_RECEIVED)
    const openPOs = await PurchaseOrderModel.find({
      pharmacyId,
      status: { $in: ['APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED'] },
    });

    const inboundByCatalogId = new Map<string, number>();
    (openPOs || []).forEach((po) => {
      (po.items || []).forEach((item) => {
        if (!item || !item.medicationCatalogId) return;
        const id = item.medicationCatalogId.toString();
        const existing = inboundByCatalogId.get(id) || 0;
        inboundByCatalogId.set(id, existing + (item.remainingQuantity || 0));
      });
    });

    // 3. Aggregate batches by medicationCatalogId (or medicationName)
    const stockMap = new Map<
      string,
      {
        medicationCatalogId: string;
        medicationName: string;
        genericName?: string;
        brandName?: string;
        dosageForm: string;
        strength: string;
        availableQuantity: number;
        reservedQuantity: number;
        reorderLevel: number;
        purchasePrice: number;
      }
    >();

    (batches || []).forEach((b) => {
      if (!b) return;
      const key = b.medicationCatalogId ? b.medicationCatalogId.toString() : b.medicationName;
      if (!key) return;
      const existing = stockMap.get(key);
      if (existing) {
        existing.availableQuantity += b.availableQuantity || 0;
        existing.reservedQuantity += b.reservedQuantity || 0;
        existing.reorderLevel = Math.max(existing.reorderLevel, b.reorderLevel || 20);
        if (b.purchasePrice) existing.purchasePrice = b.purchasePrice;
      } else {
        stockMap.set(key, {
          medicationCatalogId: b.medicationCatalogId ? b.medicationCatalogId.toString() : '',
          medicationName: b.medicationName || 'Unknown Medication',
          genericName: b.genericName,
          brandName: b.brandName,
          dosageForm: b.dosageForm || 'Tablet',
          strength: b.strength || 'Standard',
          availableQuantity: b.availableQuantity || 0,
          reservedQuantity: b.reservedQuantity || 0,
          reorderLevel: b.reorderLevel || 20,
          purchasePrice: b.purchasePrice || 10,
        });
      }
    });

    // 4. Fetch catalog medications that have zero stock
    const catalogMeds = await MedicationCatalogModel.find({ isActive: true }).limit(50);
    (catalogMeds || []).forEach((m) => {
      if (!m || !m._id) return;
      const key = m._id.toString();
      if (!stockMap.has(key)) {
        stockMap.set(key, {
          medicationCatalogId: key,
          medicationName: m.name,
          genericName: m.genericName,
          brandName: m.brandName,
          dosageForm: m.dosageForm,
          strength: m.strength,
          availableQuantity: 0,
          reservedQuantity: 0,
          reorderLevel: 30,
          purchasePrice: 15,
        });
      }
    });

    // 5. Build suggestions
    const suggestions: ReplenishmentSuggestionDto[] = [];

    for (const [key, item] of stockMap.entries()) {
      const netAvailable = item.availableQuantity - item.reservedQuantity;
      const pendingInbound = inboundByCatalogId.get(key) || 0;

      const isBelowReorder = netAvailable <= item.reorderLevel;
      if (query.onlyBelowReorderLevel && !isBelowReorder) {
        continue;
      }

      // Filter by search
      if (query.search && query.search.trim()) {
        const regex = new RegExp(query.search.trim(), 'i');
        if (
          !regex.test(item.medicationName) &&
          !regex.test(item.genericName || '') &&
          !regex.test(item.brandName || '')
        ) {
          continue;
        }
      }

      // Formula: suggestedQuantity = Math.max(0, (reorderLevel * 2) - (netAvailable + pendingInbound))
      const targetMax = item.reorderLevel * 2;
      const suggestedQuantity = Math.max(0, targetMax - (netAvailable + pendingInbound));

      // Resolve preferred supplier
      let preferredSupplierId: string | undefined;
      let preferredSupplierName: string | undefined;

      if (Types.ObjectId.isValid(item.medicationCatalogId)) {
        const sp = await SupplierProductModel.findOne({
          pharmacyId,
          medicationCatalogId: new Types.ObjectId(item.medicationCatalogId),
          isAvailable: true,
        }).sort({ purchasePrice: 1 });

        if (sp) {
          preferredSupplierId = sp.supplierId.toString();
          preferredSupplierName = sp.supplierName;
          item.purchasePrice = sp.purchasePrice;
        }
      }

      if (query.supplierId && preferredSupplierId !== query.supplierId) {
        continue;
      }

      suggestions.push({
        medicationCatalogId: item.medicationCatalogId,
        medicationName: item.medicationName,
        genericName: item.genericName,
        brandName: item.brandName,
        dosageForm: item.dosageForm,
        strength: item.strength,
        currentStock: item.availableQuantity,
        reservedStock: item.reservedQuantity,
        netAvailableStock: netAvailable,
        reorderLevel: item.reorderLevel,
        safetyStock: Math.round(item.reorderLevel * 0.5),
        maxStockLevel: targetMax,
        pendingInboundQuantity: pendingInbound,
        suggestedOrderQuantity: suggestedQuantity,
        unit: 'Units',
        preferredSupplierId,
        preferredSupplierName,
        estimatedCost: suggestedQuantity * item.purchasePrice,
      });
    }

    return suggestions.sort((a, b) => a.netAvailableStock - b.netAvailableStock);
  }

  async convertSuggestionsToRequisition(
    pharmacyUserId: string,
    dto: ConvertSuggestionsToRequisitionDto
  ): Promise<PurchaseRequisitionDto> {
    const items = [];
    for (const item of dto.items) {
      const med = await MedicationCatalogModel.findById(new Types.ObjectId(item.medicationCatalogId));
      if (!med) continue;

      let estPrice = 10;
      if (item.preferredSupplierId && Types.ObjectId.isValid(item.preferredSupplierId)) {
        const sp = await SupplierProductModel.findOne({
          pharmacyId: new Types.ObjectId(pharmacyUserId),
          supplierId: new Types.ObjectId(item.preferredSupplierId),
          medicationCatalogId: med._id,
        });
        if (sp) estPrice = sp.purchasePrice;
      }

      items.push({
        medicationCatalogId: item.medicationCatalogId,
        requestedQuantity: item.quantity,
        unitOfMeasure: 'Units',
        estimatedUnitPrice: estPrice,
        preferredSupplierId: item.preferredSupplierId,
        reasonForRequest: 'Automated stock replenishment based on reorder threshold',
      });
    }

    return this.createRequisition(pharmacyUserId, {
      priority: dto.priority || 'MEDIUM',
      items,
      notes: dto.notes || 'Replenishment order converted from low stock suggestions',
    });
  }

  private replenishmentSettingsStore = new Map<string, ReplenishmentSettingsDto>();

  async getReplenishmentSettings(pharmacyUserId: string): Promise<ReplenishmentSettingsDto> {
    const existing = this.replenishmentSettingsStore.get(pharmacyUserId);
    if (existing) return existing;
    return {
      defaultReorderMultiplier: 2,
      defaultSafetyStockDays: 7,
      autoGenerateRequisitions: false,
      notifyOnThreshold: true,
    };
  }

  async updateReplenishmentSettings(
    pharmacyUserId: string,
    dto: UpdateReplenishmentSettingsDto
  ): Promise<ReplenishmentSettingsDto> {
    const current = await this.getReplenishmentSettings(pharmacyUserId);
    const updated: ReplenishmentSettingsDto = {
      defaultReorderMultiplier: dto.defaultReorderMultiplier ?? current.defaultReorderMultiplier,
      defaultSafetyStockDays: dto.defaultSafetyStockDays ?? current.defaultSafetyStockDays,
      autoGenerateRequisitions: dto.autoGenerateRequisitions ?? current.autoGenerateRequisitions,
      notifyOnThreshold: dto.notifyOnThreshold ?? current.notifyOnThreshold,
    };
    this.replenishmentSettingsStore.set(pharmacyUserId, updated);
    return updated;
  }

  /**
   * ==========================================================================
   * 8. PROCUREMENT METRICS
   * ==========================================================================
   */

  async getProcurementMetrics(pharmacyUserId: string): Promise<ProcurementMetricsDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);

    const [
      totalSuppliers,
      activeSuppliers,
      pendingSuppliers,
      openPurchaseOrders,
      pendingApprovalOrders,
      partiallyReceivedOrders,
      completedOrders,
      pendingInvoices,
      suggestions,
    ] = await Promise.all([
      SupplierModel.countDocuments({ pharmacyId }),
      SupplierModel.countDocuments({ pharmacyId, status: 'ACTIVE' }),
      SupplierModel.countDocuments({ pharmacyId, status: 'PENDING_VERIFICATION' }),
      PurchaseOrderModel.countDocuments({
        pharmacyId,
        status: { $in: ['APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED'] },
      }),
      PurchaseOrderModel.countDocuments({ pharmacyId, status: 'PENDING_APPROVAL' }),
      PurchaseOrderModel.countDocuments({ pharmacyId, status: 'PARTIALLY_RECEIVED' }),
      PurchaseOrderModel.find({
        pharmacyId,
        status: { $in: ['PARTIALLY_RECEIVED', 'FULLY_RECEIVED'] },
      }),
      PurchaseInvoiceModel.find({ pharmacyId, status: 'PENDING' }),
      this.getReplenishmentSuggestions(pharmacyUserId, { onlyBelowReorderLevel: true }),
    ]);

    const monthlySpendTotal = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const pendingInvoicesAmount = pendingInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    return {
      totalSuppliers,
      activeSuppliers,
      pendingSuppliers,
      openPurchaseOrders,
      pendingApprovalOrders,
      partiallyReceivedOrders,
      monthlySpendTotal,
      pendingInvoicesCount: pendingInvoices.length,
      pendingInvoicesAmount,
      replenishmentSuggestionsCount: suggestions.length,
    };
  }

  /**
   * ==========================================================================
   * PRIVATE DTO MAPPERS
   * ==========================================================================
   */

  private mapSupplierToDto(doc: ISupplierDocument): SupplierDto {
    return {
      id: doc._id.toString(),
      pharmacyId: doc.pharmacyId.toString(),
      supplierCode: doc.supplierCode,
      name: doc.name,
      legalName: doc.legalName,
      supplierType: doc.supplierType,
      status: doc.status,
      verificationStatus: doc.verificationStatus,
      taxId: doc.taxId,
      panNumber: doc.panNumber,
      drugLicenseNumber: doc.drugLicenseNumber,
      email: doc.email,
      phone: doc.phone,
      alternatePhone: doc.alternatePhone,
      address: {
        line1: doc.address?.line1,
        city: doc.address?.city || '',
        state: doc.address?.state || '',
        postalCode: doc.address?.postalCode || '',
        country: doc.address?.country || 'India',
      },
      contactPersons: doc.contactPersons || [],
      paymentTermsDays: doc.paymentTermsDays || 30,
      leadTimeDays: doc.leadTimeDays || 7,
      rating: doc.rating || 5,
      bankDetails: doc.bankDetails,
      notes: doc.notes,
      verifiedAt: doc.verifiedAt ? toIsoSafe(doc.verifiedAt) : undefined,
      verifiedBy: doc.verifiedBy?.toString(),
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapSupplierProductToDto(doc: ISupplierProductDocument): SupplierProductDto {
    return {
      id: doc._id.toString(),
      pharmacyId: doc.pharmacyId.toString(),
      supplierId: doc.supplierId.toString(),
      supplierName: doc.supplierName,
      medicationCatalogId: doc.medicationCatalogId.toString(),
      medicationName: doc.medicationName,
      genericName: doc.genericName,
      brandName: doc.brandName,
      dosageForm: doc.dosageForm,
      strength: doc.strength,
      supplierProductCode: doc.supplierProductCode,
      purchasePrice: doc.purchasePrice,
      mrp: doc.mrp,
      minimumOrderQuantity: doc.minimumOrderQuantity || 1,
      packSize: doc.packSize,
      leadTimeDays: doc.leadTimeDays,
      isAvailable: doc.isAvailable,
      notes: doc.notes,
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapRequisitionToDto(doc: IPurchaseRequisitionDocument): PurchaseRequisitionDto {
    return {
      id: doc._id.toString(),
      requisitionNumber: doc.requisitionNumber,
      pharmacyId: doc.pharmacyId.toString(),
      requestedBy: doc.requestedBy.toString(),
      requestedByName: doc.requestedByName,
      status: doc.status,
      priority: doc.priority,
      items: doc.items.map((i) => ({
        id: i._id?.toString() || '',
        medicationCatalogId: i.medicationCatalogId.toString(),
        medicationName: i.medicationName,
        genericName: i.genericName,
        brandName: i.brandName,
        dosageForm: i.dosageForm,
        strength: i.strength,
        requestedQuantity: i.requestedQuantity,
        approvedQuantity: i.approvedQuantity,
        unitOfMeasure: i.unitOfMeasure,
        estimatedUnitPrice: i.estimatedUnitPrice,
        estimatedTotalPrice: i.estimatedTotalPrice,
        preferredSupplierId: i.preferredSupplierId?.toString(),
        preferredSupplierName: i.preferredSupplierName,
        reasonForRequest: i.reasonForRequest,
        notes: i.notes,
      })),
      totalEstimatedAmount: doc.totalEstimatedAmount,
      requiredByDate: doc.requiredByDate ? toIsoSafe(doc.requiredByDate) : undefined,
      notes: doc.notes,
      approvalNotes: doc.approvalNotes,
      rejectionReason: doc.rejectionReason,
      approvedBy: doc.approvedBy?.toString(),
      approvedByName: doc.approvedByName,
      approvedAt: doc.approvedAt ? toIsoSafe(doc.approvedAt) : undefined,
      convertedPurchaseOrderId: doc.convertedPurchaseOrderId?.toString(),
      convertedPurchaseOrderNumber: doc.convertedPurchaseOrderNumber,
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapPurchaseOrderToDto(doc: IPurchaseOrderDocument): PurchaseOrderDto {
    return {
      id: doc._id.toString(),
      poNumber: doc.poNumber,
      pharmacyId: doc.pharmacyId.toString(),
      requisitionId: doc.requisitionId?.toString(),
      requisitionNumber: doc.requisitionNumber,
      supplierId: doc.supplierId.toString(),
      supplierName: doc.supplierName,
      supplierCode: doc.supplierCode,
      supplierGstin: doc.supplierGstin,
      supplierDrugLicense: doc.supplierDrugLicense,
      supplierEmail: doc.supplierEmail,
      supplierPhone: doc.supplierPhone,
      status: doc.status,
      orderDate: toIsoSafe(doc.orderDate),
      expectedDeliveryDate: doc.expectedDeliveryDate ? toIsoSafe(doc.expectedDeliveryDate) : undefined,
      paymentTermsDays: doc.paymentTermsDays || 30,
      deliveryAddress: {
        line1: doc.deliveryAddress?.line1,
        city: doc.deliveryAddress?.city || '',
        state: doc.deliveryAddress?.state || '',
        postalCode: doc.deliveryAddress?.postalCode || '',
        country: doc.deliveryAddress?.country || 'India',
      },
      items: doc.items.map((i) => ({
        id: i._id?.toString() || '',
        medicationCatalogId: i.medicationCatalogId.toString(),
        medicationName: i.medicationName,
        genericName: i.genericName,
        brandName: i.brandName,
        dosageForm: i.dosageForm,
        strength: i.strength,
        orderedQuantity: i.orderedQuantity,
        receivedQuantity: i.receivedQuantity,
        remainingQuantity: i.remainingQuantity,
        unitPrice: i.unitPrice,
        discountPercent: i.discountPercent,
        taxPercent: i.taxPercent,
        itemSubtotal: i.itemSubtotal,
        itemTax: i.itemTax,
        itemTotal: i.itemTotal,
        packSize: i.packSize,
        supplierProductCode: i.supplierProductCode,
        notes: i.notes,
      })),
      subtotal: doc.subtotal,
      taxTotal: doc.taxTotal,
      discountTotal: doc.discountTotal,
      grandTotal: doc.grandTotal,
      notes: doc.notes,
      termsAndConditions: doc.termsAndConditions,
      approvalDetails: doc.approvalDetails
        ? {
            approvedBy: doc.approvalDetails.approvedBy.toString(),
            approverName: doc.approvalDetails.approverName,
            approvedAt: toIsoSafe(doc.approvalDetails.approvedAt),
            comments: doc.approvalDetails.comments,
            rejectedReason: doc.approvalDetails.rejectedReason,
          }
        : undefined,
      cancellationDetails: doc.cancellationDetails
        ? {
            cancelledBy: doc.cancellationDetails.cancelledBy.toString(),
            cancelledByName: doc.cancellationDetails.cancelledByName,
            cancelledAt: toIsoSafe(doc.cancellationDetails.cancelledAt),
            reason: doc.cancellationDetails.reason,
          }
        : undefined,
      sentToSupplierAt: doc.sentToSupplierAt ? toIsoSafe(doc.sentToSupplierAt) : undefined,
      createdBy: doc.createdBy.toString(),
      createdByName: doc.createdByName,
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapGoodsReceiptToDto(doc: IGoodsReceiptDocument): GoodsReceiptDto {
    return {
      id: doc._id.toString(),
      grnNumber: doc.grnNumber,
      pharmacyId: doc.pharmacyId.toString(),
      purchaseOrderId: doc.purchaseOrderId.toString(),
      poNumber: doc.poNumber,
      supplierId: doc.supplierId.toString(),
      supplierName: doc.supplierName,
      supplierInvoiceNumber: doc.supplierInvoiceNumber,
      supplierInvoiceDate: toIsoSafe(doc.supplierInvoiceDate),
      receivedDate: toIsoSafe(doc.receivedDate),
      receivedBy: doc.receivedBy.toString(),
      receiverName: doc.receiverName,
      status: doc.status,
      items: doc.items.map((i) => ({
        id: i._id?.toString() || '',
        purchaseOrderItemId: i.purchaseOrderItemId.toString(),
        medicationCatalogId: i.medicationCatalogId.toString(),
        medicationName: i.medicationName,
        dosageForm: i.dosageForm,
        strength: i.strength,
        batchNumber: i.batchNumber,
        manufacturingDate: toIsoSafe(i.manufacturingDate),
        expiryDate: toIsoSafe(i.expiryDate),
        orderedQuantity: i.orderedQuantity,
        receivedQuantity: i.receivedQuantity,
        rejectedQuantity: i.rejectedQuantity,
        acceptedQuantity: i.acceptedQuantity,
        unitPurchasePrice: i.unitPurchasePrice,
        sellingPrice: i.sellingPrice,
        mrp: i.mrp,
        taxPercent: i.taxPercent,
        itemTotal: i.itemTotal,
        storageLocation: i.storageLocation,
        remarks: i.remarks,
      })),
      totalItemsCount: doc.totalItemsCount,
      totalReceivedQuantity: doc.totalReceivedQuantity,
      totalAcceptedQuantity: doc.totalAcceptedQuantity,
      totalRejectedQuantity: doc.totalRejectedQuantity,
      totalAmount: doc.totalAmount,
      notes: doc.notes,
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapPurchaseInvoiceToDto(doc: IPurchaseInvoiceDocument): PurchaseInvoiceDto {
    return {
      id: doc._id?.toString() || '',
      invoiceNumber: doc.invoiceNumber,
      pharmacyId: doc.pharmacyId?.toString() || '',
      supplierId: doc.supplierId?.toString() || '',
      supplierName: doc.supplierName || '',
      purchaseOrderId: doc.purchaseOrderId?.toString() || '',
      poNumber: doc.poNumber || '',
      goodsReceiptIds: (doc.goodsReceiptIds || []).map((id) => id.toString()),
      grnNumbers: doc.grnNumbers || [],
      invoiceDate: toIsoSafe(doc.invoiceDate),
      dueDate: toIsoSafe(doc.dueDate),
      subtotal: doc.subtotal || 0,
      taxAmount: doc.taxAmount || 0,
      discountAmount: doc.discountAmount || 0,
      totalAmount: doc.totalAmount || 0,
      paidAmount: doc.paidAmount || 0,
      status: doc.status,
      notes: doc.notes,
      reconciliationNotes: doc.reconciliationNotes,
      disputedReason: doc.disputedReason,
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }
}

export const procurementService = new ProcurementService();
