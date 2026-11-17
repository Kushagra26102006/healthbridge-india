import mongoose, { Types } from 'mongoose';
import {
  ReagentDto,
  CreateReagentDto,
  UpdateReagentDto,
  ReagentLotDto,
  CreateReagentLotDto,
  ReagentInventoryTransactionDto,
  RecordReagentStockTransactionDto,
} from '@healthbridge/shared-types';
import {
  ReagentModel,
  IReagentDocument,
  ReagentLotModel,
  IReagentLotDocument,
} from '../models/reagent.model';
import {
  ReagentInventoryTransactionModel,
} from '../models/reagent-transaction.model';
import { qualityIncidentCapaService } from './quality-incident-capa.service';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import crypto from 'crypto';

export class ReagentInventoryService {
  /**
   * Register a new Reagent.
   */
  async createReagent(
    laboratoryId: string,
    createdBy: { id: string; name: string },
    dto: CreateReagentDto
  ): Promise<ReagentDto> {
    const labObjId = new Types.ObjectId(laboratoryId);

    const existing = await ReagentModel.findOne({
      laboratoryId: labObjId,
      reagentCode: dto.reagentCode.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(`Reagent with code ${dto.reagentCode} already exists in this laboratory.`);
    }

    const doc = await ReagentModel.create({
      laboratoryId: labObjId,
      reagentCode: dto.reagentCode.toUpperCase(),
      name: dto.name,
      manufacturer: dto.manufacturer,
      catalogNumber: dto.catalogNumber,
      category: dto.category,
      storageConditions: dto.storageConditions,
      unit: dto.unit,
      minimumStockLevel: dto.minimumStockLevel,
      currentStock: 0,
      associatedTestCodes: (dto.associatedTestCodes || []).map((t) => t.toUpperCase()),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    await this.logAudit({
      actorId: createdBy.id,
      action: 'REAGENT_CATALOG_CREATED',
      resourceType: 'REAGENT',
      resourceId: doc._id.toString(),
      metadata: { reagentCode: dto.reagentCode, name: dto.name },
    });

    return this.mapReagent(doc);
  }

  /**
   * Update Reagent catalog item.
   */
  async updateReagent(
    laboratoryId: string,
    id: string,
    updatedBy: { id: string; name: string },
    dto: UpdateReagentDto
  ): Promise<ReagentDto> {
    const doc = await ReagentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Reagent not found or access denied');

    if (dto.name) doc.name = dto.name;
    if (dto.manufacturer) doc.manufacturer = dto.manufacturer;
    if (dto.catalogNumber) doc.catalogNumber = dto.catalogNumber;
    if (dto.category) doc.category = dto.category;
    if (dto.storageConditions) doc.storageConditions = dto.storageConditions;
    if (dto.minimumStockLevel !== undefined) doc.minimumStockLevel = dto.minimumStockLevel;
    if (dto.associatedTestCodes)
      doc.associatedTestCodes = dto.associatedTestCodes.map((t) => t.toUpperCase());
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;

    await doc.save();

    await this.logAudit({
      actorId: updatedBy.id,
      action: 'REAGENT_CATALOG_UPDATED',
      resourceType: 'REAGENT',
      resourceId: doc._id.toString(),
      metadata: { reagentCode: doc.reagentCode },
    });

    return this.mapReagent(doc);
  }

  /**
   * List Reagents.
   */
  async listReagents(
    laboratoryId: string,
    query: { category?: string; testCode?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ items: ReagentDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.category) filter.category = query.category;
    if (query.testCode) filter.associatedTestCodes = query.testCode.toUpperCase();
    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { reagentCode: { $regex: escapedSearch, $options: 'i' } },
        { name: { $regex: escapedSearch, $options: 'i' } },
        { manufacturer: { $regex: escapedSearch, $options: 'i' } },
        { catalogNumber: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ReagentModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      ReagentModel.countDocuments(filter),
    ]);

    return {
      items: items.map((r) => this.mapReagent(r)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get Reagent by ID.
   */
  async getReagentById(laboratoryId: string, id: string): Promise<ReagentDto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ReagentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapReagent(doc) : null;
  }

  /**
   * Add Reagent Lot & Record Stock Receipt.
   */
  async createReagentLot(
    laboratoryId: string,
    createdBy: { id: string; name: string },
    dto: CreateReagentLotDto
  ): Promise<ReagentLotDto> {
    const labObjId = new Types.ObjectId(laboratoryId);
    const reagent = await ReagentModel.findOne({
      _id: new Types.ObjectId(dto.reagentId),
      laboratoryId: labObjId,
    });
    if (!reagent) throw AppError.notFound('Reagent not found or access denied');

    const existingLot = await ReagentLotModel.findOne({
      laboratoryId: labObjId,
      reagentId: reagent._id,
      lotNumber: dto.lotNumber,
    });
    if (existingLot) {
      throw AppError.conflict(`Lot ${dto.lotNumber} already registered for reagent ${reagent.name}`);
    }

    const lotDoc = await ReagentLotModel.create({
      reagentId: reagent._id,
      reagentName: reagent.name,
      laboratoryId: labObjId,
      lotNumber: dto.lotNumber,
      manufacturer: dto.manufacturer,
      receivedDate: new Date(dto.receivedDate),
      expiryDate: new Date(dto.expiryDate),
      openedDate: dto.openedDate ? new Date(dto.openedDate) : undefined,
      initialQuantity: dto.initialQuantity,
      availableQuantity: dto.initialQuantity,
      unit: reagent.unit,
      storageLocation: dto.storageLocation,
      status: 'ACTIVE',
      supplierName: dto.supplierName,
    });

    // Update Reagent total stock
    reagent.currentStock += dto.initialQuantity;
    await reagent.save();

    // Create Initial RECEIPT Ledger Entry
    const transactionReference = `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    await ReagentInventoryTransactionModel.create({
      transactionReference,
      reagentId: reagent._id,
      reagentName: reagent.name,
      lotId: lotDoc._id,
      lotNumber: lotDoc.lotNumber,
      laboratoryId: labObjId,
      transactionType: 'RECEIPT',
      quantity: dto.initialQuantity,
      balanceAfter: dto.initialQuantity,
      unit: reagent.unit,
      performedById: new Types.ObjectId(createdBy.id),
      performedByName: createdBy.name,
      reason: `Initial stock receipt of Lot ${dto.lotNumber}`,
    });

    await this.logAudit({
      actorId: createdBy.id,
      action: 'REAGENT_LOT_REGISTERED',
      resourceType: 'REAGENT_LOT',
      resourceId: lotDoc._id.toString(),
      metadata: {
        lotNumber: dto.lotNumber,
        reagentName: reagent.name,
        quantity: dto.initialQuantity,
      },
    });

    return this.mapLot(lotDoc);
  }

  /**
   * List Reagent Lots.
   */
  async listReagentLots(
    laboratoryId: string,
    query: { reagentId?: string; status?: string; expiringWithinDays?: number; page?: number; limit?: number }
  ): Promise<{ items: ReagentLotDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.reagentId && Types.ObjectId.isValid(query.reagentId)) {
      filter.reagentId = new Types.ObjectId(query.reagentId);
    }
    if (query.status) filter.status = query.status;

    if (query.expiringWithinDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Number(query.expiringWithinDays));
      filter.expiryDate = { $lte: targetDate, $gte: new Date() };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ReagentLotModel.find(filter).sort({ expiryDate: 1 }).skip(skip).limit(limit),
      ReagentLotModel.countDocuments(filter),
    ]);

    return {
      items: items.map((l) => this.mapLot(l)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get Reagent Lot by ID.
   */
  async getReagentLotById(laboratoryId: string, id: string): Promise<ReagentLotDto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ReagentLotModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapLot(doc) : null;
  }

  /**
   * Record Stock Transaction (Atomic Balance & Immutable Ledger).
   */
  async recordStockTransaction(
    laboratoryId: string,
    performedBy: { id: string; name: string },
    dto: RecordReagentStockTransactionDto
  ): Promise<ReagentInventoryTransactionDto> {
    const labObjId = new Types.ObjectId(laboratoryId);

    const lot = await ReagentLotModel.findOne({
      _id: new Types.ObjectId(dto.lotId),
      laboratoryId: labObjId,
    });
    if (!lot) throw AppError.notFound('Reagent Lot not found or access denied');

    const reagent = await ReagentModel.findOne({
      _id: new Types.ObjectId(dto.reagentId),
      laboratoryId: labObjId,
    });
    if (!reagent) throw AppError.notFound('Reagent not found or access denied');

    const requestedQty = Number(dto.quantity);
    if (isNaN(requestedQty) || requestedQty === 0) {
      throw AppError.badRequest('Transaction quantity must be a non-zero number');
    }

    let updatedLot: IReagentLotDocument | null = null;
    let actualDelta = 0;

    if (dto.transactionType === 'CONSUMPTION' || dto.transactionType === 'DISPOSAL') {
      // Clinical CONSUMPTION must reject QUARANTINED, RECALLED, or EXPIRED lots
      if (dto.transactionType === 'CONSUMPTION') {
        if (lot.status === 'QUARANTINED') {
          throw AppError.badRequest(
            `Cannot consume stock from QUARANTINED lot ${lot.lotNumber} (${lot.quarantineReason || 'quality hold'}).`
          );
        }
        if (lot.status === 'RECALLED') {
          throw AppError.badRequest(
            `Cannot consume stock from RECALLED lot ${lot.lotNumber} (${lot.recalledReason || 'recalled'}).`
          );
        }
        if (lot.status === 'EXPIRED' || (lot.expiryDate && new Date(lot.expiryDate) < new Date())) {
          throw AppError.badRequest(
            `Cannot consume stock from EXPIRED lot ${lot.lotNumber}.`
          );
        }
      }

      const deductionQty = Math.abs(requestedQty);
      actualDelta = -deductionQty;

      // Atomic deduction with non-negative guarantee (concurrent-safe)
      updatedLot = await ReagentLotModel.findOneAndUpdate(
        {
          _id: lot._id,
          laboratoryId: labObjId,
          availableQuantity: { $gte: deductionQty },
        },
        {
          $inc: { availableQuantity: -deductionQty },
        },
        { new: true }
      );

      if (!updatedLot) {
        throw AppError.badRequest(
          `Insufficient available stock in lot ${lot.lotNumber}. Available: ${lot.availableQuantity}, requested: ${deductionQty}.`
        );
      }

      // If depleted, mark status
      if (updatedLot.availableQuantity === 0) {
        updatedLot.status = 'DEPLETED';
        await updatedLot.save();
      }

      // Decrement total reagent stock
      await ReagentModel.updateOne(
        { _id: reagent._id },
        { $inc: { currentStock: -deductionQty } }
      );
    } else if (dto.transactionType === 'RECEIPT') {
      const receiptQty = Math.abs(requestedQty);
      actualDelta = receiptQty;

      updatedLot = await ReagentLotModel.findOneAndUpdate(
        { _id: lot._id, laboratoryId: labObjId },
        { $inc: { availableQuantity: receiptQty } },
        { new: true }
      );

      if (updatedLot && updatedLot.availableQuantity > 0 && updatedLot.status === 'DEPLETED') {
        updatedLot.status = 'ACTIVE';
        await updatedLot.save();
      }

      await ReagentModel.updateOne(
        { _id: reagent._id },
        { $inc: { currentStock: receiptQty } }
      );
    } else if (dto.transactionType === 'ADJUSTMENT' || dto.transactionType === 'REVERSAL') {
      actualDelta = requestedQty;
      if (lot.availableQuantity + requestedQty < 0) {
        throw AppError.badRequest(`Stock adjustment cannot result in negative inventory balance.`);
      }

      // Atomic non-negative guard under concurrent negative adjustments
      const atomicFilter: Record<string, unknown> = {
        _id: lot._id,
        laboratoryId: labObjId,
      };
      if (requestedQty < 0) {
        atomicFilter.availableQuantity = { $gte: Math.abs(requestedQty) };
      }

      updatedLot = await ReagentLotModel.findOneAndUpdate(
        atomicFilter,
        { $inc: { availableQuantity: requestedQty } },
        { new: true }
      );

      if (!updatedLot) {
        throw AppError.badRequest(`Stock adjustment cannot result in negative inventory balance.`);
      }

      await ReagentModel.updateOne(
        { _id: reagent._id },
        { $inc: { currentStock: requestedQty } }
      );
    }

    if (!updatedLot) {
      throw AppError.badRequest('Failed to update reagent lot stock');
    }

    // Write immutable transaction ledger entry
    const transactionReference = `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const txnDoc = await ReagentInventoryTransactionModel.create({
      transactionReference,
      reagentId: reagent._id,
      reagentName: reagent.name,
      lotId: updatedLot._id,
      lotNumber: updatedLot.lotNumber,
      laboratoryId: labObjId,
      transactionType: dto.transactionType,
      quantity: actualDelta,
      balanceAfter: updatedLot.availableQuantity,
      unit: reagent.unit,
      performedById: new Types.ObjectId(performedBy.id),
      performedByName: performedBy.name,
      reason: dto.reason,
      batchTestRunId: dto.batchTestRunId,
      orderId: dto.orderId && Types.ObjectId.isValid(dto.orderId) ? new Types.ObjectId(dto.orderId) : undefined,
    });

    await this.logAudit({
      actorId: performedBy.id,
      action: 'REAGENT_TRANSACTION_RECORDED',
      resourceType: 'REAGENT_TRANSACTION',
      resourceId: txnDoc._id.toString(),
      metadata: {
        transactionType: dto.transactionType,
        quantity: actualDelta,
        balanceAfter: updatedLot.availableQuantity,
      },
    });

    return {
      id: txnDoc._id.toString(),
      transactionReference: txnDoc.transactionReference,
      reagentId: txnDoc.reagentId.toString(),
      reagentName: txnDoc.reagentName,
      lotId: txnDoc.lotId.toString(),
      lotNumber: txnDoc.lotNumber,
      laboratoryId: txnDoc.laboratoryId.toString(),
      transactionType: txnDoc.transactionType,
      quantity: txnDoc.quantity,
      balanceAfter: txnDoc.balanceAfter,
      unit: txnDoc.unit,
      performedById: txnDoc.performedById.toString(),
      performedByName: txnDoc.performedByName,
      reason: txnDoc.reason,
      batchTestRunId: txnDoc.batchTestRunId,
      orderId: txnDoc.orderId?.toString(),
      createdAt: txnDoc.createdAt.toISOString(),
    };
  }

  /**
   * Quarantine a Reagent Lot.
   */
  async quarantineLot(
    laboratoryId: string,
    lotId: string,
    performedBy: { id: string; name: string },
    quarantineReason: string,
    createIncident = true
  ): Promise<ReagentLotDto> {
    const doc = await ReagentLotModel.findOne({
      _id: new Types.ObjectId(lotId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Reagent lot not found or access denied');

    doc.status = 'QUARANTINED';
    doc.quarantineReason = quarantineReason;
    await doc.save();

    if (createIncident) {
      await qualityIncidentCapaService.createIncident(laboratoryId, performedBy, {
        category: 'REAGENT_ISSUE',
        severity: 'HIGH',
        title: `Reagent Lot Quarantined: ${doc.reagentName} (Lot ${doc.lotNumber})`,
        description: `Lot ${doc.lotNumber} was quarantined. Reason: ${quarantineReason}. Further clinical usage blocked.`,
        relatedReagentLotId: doc._id.toString(),
      });
    }

    await this.logAudit({
      actorId: performedBy.id,
      action: 'REAGENT_LOT_QUARANTINED',
      resourceType: 'REAGENT_LOT',
      resourceId: doc._id.toString(),
      metadata: { quarantineReason },
    });

    return this.mapLot(doc);
  }

  /**
   * Recall a Reagent Lot.
   */
  async recallLot(
    laboratoryId: string,
    lotId: string,
    performedBy: { id: string; name: string },
    recalledReason: string,
    createIncident = true
  ): Promise<ReagentLotDto> {
    const doc = await ReagentLotModel.findOne({
      _id: new Types.ObjectId(lotId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Reagent lot not found or access denied');

    doc.status = 'RECALLED';
    doc.recalledAt = new Date();
    doc.recalledReason = recalledReason;
    await doc.save();

    if (createIncident) {
      await qualityIncidentCapaService.createIncident(laboratoryId, performedBy, {
        category: 'REAGENT_ISSUE',
        severity: 'CRITICAL',
        title: `Reagent Recall: ${doc.reagentName} (Lot ${doc.lotNumber})`,
        description: `Manufacturer or internal recall issued for Lot ${doc.lotNumber}. Reason: ${recalledReason}. Lot removed from active circulation.`,
        relatedReagentLotId: doc._id.toString(),
      });
    }

    await this.logAudit({
      actorId: performedBy.id,
      action: 'REAGENT_LOT_RECALLED',
      resourceType: 'REAGENT_LOT',
      resourceId: doc._id.toString(),
      metadata: { recalledReason },
    });

    return this.mapLot(doc);
  }

  /**
   * Validate Lot for test processing (Section 14).
   */
  async validateLotForProcessing(
    laboratoryId: string,
    lotId: string,
    testCode?: string,
    requiredQuantity = 1
  ): Promise<{ valid: boolean; reason?: string; lot?: ReagentLotDto }> {
    if (!Types.ObjectId.isValid(lotId)) {
      return { valid: false, reason: 'Invalid Reagent Lot ID.' };
    }

    const lot = await ReagentLotModel.findOne({
      _id: new Types.ObjectId(lotId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });

    if (!lot) {
      return { valid: false, reason: 'Reagent lot not found in this laboratory.' };
    }

    if (lot.status === 'EXPIRED' || lot.expiryDate < new Date()) {
      return { valid: false, reason: `Reagent lot ${lot.lotNumber} is EXPIRED (${lot.expiryDate.toISOString().split('T')[0]}).` };
    }

    if (lot.status === 'QUARANTINED') {
      return { valid: false, reason: `Reagent lot ${lot.lotNumber} is QUARANTINED: ${lot.quarantineReason || 'Under investigation'}.` };
    }

    if (lot.status === 'RECALLED') {
      return { valid: false, reason: `Reagent lot ${lot.lotNumber} has been RECALLED.` };
    }

    if (lot.status === 'DEPLETED' || lot.availableQuantity < requiredQuantity) {
      return {
        valid: false,
        reason: `Insufficient quantity in lot ${lot.lotNumber}. Available: ${lot.availableQuantity}, required: ${requiredQuantity}.`,
      };
    }

    if (testCode) {
      const reagent = await ReagentModel.findById(lot.reagentId);
      if (
        reagent &&
        reagent.associatedTestCodes &&
        reagent.associatedTestCodes.length > 0 &&
        !reagent.associatedTestCodes.includes(testCode.toUpperCase())
      ) {
        return {
          valid: false,
          reason: `Reagent ${reagent.name} is not mapped to test ${testCode.toUpperCase()}.`,
        };
      }
    }

    return { valid: true, lot: this.mapLot(lot) };
  }

  /**
   * First-Expired, First-Out (FEFO) recommendation helper.
   */
  async getRecommendedLotFEFO(
    laboratoryId: string,
    reagentId: string,
    requiredQuantity = 1
  ): Promise<ReagentLotDto | null> {
    const lot = await ReagentLotModel.findOne({
      laboratoryId: new Types.ObjectId(laboratoryId),
      reagentId: new Types.ObjectId(reagentId),
      status: 'ACTIVE',
      expiryDate: { $gt: new Date() },
      availableQuantity: { $gte: requiredQuantity },
    }).sort({ expiryDate: 1 });

    return lot ? this.mapLot(lot) : null;
  }

  /**
   * List Transaction Ledger records.
   */
  async listTransactions(
    laboratoryId: string,
    query: { reagentId?: string; lotId?: string; page?: number; limit?: number }
  ): Promise<{ items: ReagentInventoryTransactionDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.reagentId && Types.ObjectId.isValid(query.reagentId)) {
      filter.reagentId = new Types.ObjectId(query.reagentId);
    }
    if (query.lotId && Types.ObjectId.isValid(query.lotId)) {
      filter.lotId = new Types.ObjectId(query.lotId);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ReagentInventoryTransactionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReagentInventoryTransactionModel.countDocuments(filter),
    ]);

    return {
      items: items.map((t) => ({
        id: t._id.toString(),
        transactionReference: t.transactionReference,
        reagentId: t.reagentId.toString(),
        reagentName: t.reagentName,
        lotId: t.lotId.toString(),
        lotNumber: t.lotNumber,
        laboratoryId: t.laboratoryId.toString(),
        transactionType: t.transactionType,
        quantity: t.quantity,
        balanceAfter: t.balanceAfter,
        unit: t.unit,
        performedById: t.performedById.toString(),
        performedByName: t.performedByName,
        reason: t.reason,
        batchTestRunId: t.batchTestRunId,
        orderId: t.orderId?.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  private mapReagent(doc: IReagentDocument): ReagentDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      reagentCode: doc.reagentCode,
      name: doc.name,
      manufacturer: doc.manufacturer,
      catalogNumber: doc.catalogNumber,
      category: doc.category,
      storageConditions: doc.storageConditions,
      unit: doc.unit,
      minimumStockLevel: doc.minimumStockLevel,
      currentStock: doc.currentStock,
      associatedTestCodes: doc.associatedTestCodes || [],
      isActive: doc.isActive,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapLot(doc: IReagentLotDocument): ReagentLotDto {
    const now = new Date();
    const expiry = new Date(doc.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = daysToExpiry <= 0;

    return {
      id: doc._id.toString(),
      reagentId: doc.reagentId.toString(),
      reagentName: doc.reagentName,
      laboratoryId: doc.laboratoryId.toString(),
      lotNumber: doc.lotNumber,
      manufacturer: doc.manufacturer,
      receivedDate: (doc.receivedDate.toISOString().split('T')[0] as string),
      expiryDate: (doc.expiryDate.toISOString().split('T')[0] as string),
      openedDate: doc.openedDate?.toISOString().split('T')[0],
      initialQuantity: doc.initialQuantity,
      availableQuantity: doc.availableQuantity,
      unit: doc.unit,
      storageLocation: doc.storageLocation,
      status: doc.status,
      supplierName: doc.supplierName,
      quarantineReason: doc.quarantineReason,
      recalledAt: doc.recalledAt?.toISOString(),
      recalledReason: doc.recalledReason,
      daysToExpiry,
      isExpired,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private async logAudit(params: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          actorId:
            params.actorId && Types.ObjectId.isValid(params.actorId)
              ? new Types.ObjectId(params.actorId)
              : undefined,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          timestamp: new Date(),
          requestId: crypto.randomUUID(),
          outcome: 'SUCCESS',
          metadata: params.metadata || {},
        });
      }
    } catch {
      // Safe catch
    }
  }
}

export const reagentInventoryService = new ReagentInventoryService();
