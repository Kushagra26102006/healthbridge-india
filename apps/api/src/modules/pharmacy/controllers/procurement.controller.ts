import { Request, Response, NextFunction } from 'express';
import { procurementService } from '../services/procurement.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import type {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierFilterDto,
  CreateSupplierProductDto,
  UpdateSupplierProductDto,
  SupplierProductFilterDto,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto,
  RequisitionFilterDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  RejectPurchaseOrderDto,
  PurchaseOrderFilterDto,
  ReceiveGoodsDto,
  GoodsReceiptFilterDto,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  InvoiceFilterDto,
  ReplenishmentFilterDto,
  ConvertSuggestionsToRequisitionDto,
  UpdateReplenishmentSettingsDto,
} from '@healthbridge/shared-types';

export class ProcurementController {
  /* ==========================================================================
     SUPPLIER HANDLERS
     ========================================================================== */

  async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const supplier = await procurementService.createSupplier(userId, req.body as CreateSupplierDto);
      sendSuccess(res, supplier, 'Supplier created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await procurementService.getSuppliers(userId, req.query as SupplierFilterDto);
      sendSuccess(res, result.data, 'Suppliers retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const supplier = await procurementService.getSupplierById(userId, req.params.id as string);
      sendSuccess(res, supplier, 'Supplier details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const supplier = await procurementService.updateSupplier(
        userId,
        req.params.id as string,
        req.body as UpdateSupplierDto
      );
      sendSuccess(res, supplier, 'Supplier updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSupplierPurchaseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orders = await procurementService.getSupplierPurchaseHistory(userId, req.params.id as string);
      sendSuccess(res, orders, 'Supplier purchase history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     SUPPLIER PRODUCT CATALOG HANDLERS
     ========================================================================== */

  async addSupplierProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const product = await procurementService.addSupplierProduct(
        userId,
        req.body as CreateSupplierProductDto
      );
      sendSuccess(res, product, 'Supplier product catalog item added successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getSupplierProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await procurementService.getSupplierProducts(
        userId,
        req.query as SupplierProductFilterDto
      );
      sendSuccess(res, result.data, 'Supplier products retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSupplierProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const product = await procurementService.updateSupplierProduct(
        userId,
        req.params.productId as string,
        req.body as UpdateSupplierProductDto
      );
      sendSuccess(res, product, 'Supplier product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSupplierProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await procurementService.deleteSupplierProduct(userId, req.params.productId as string);
      sendSuccess(res, { success: true }, 'Supplier product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     PURCHASE REQUISITION HANDLERS
     ========================================================================== */

  async createRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const requisition = await procurementService.createRequisition(
        userId,
        req.body as CreatePurchaseRequisitionDto
      );
      sendSuccess(res, requisition, 'Purchase requisition created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getRequisitions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await procurementService.getRequisitions(userId, req.query as RequisitionFilterDto);
      sendSuccess(res, result.data, 'Purchase requisitions retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequisitionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const requisition = await procurementService.getRequisitionById(userId, req.params.id as string);
      sendSuccess(res, requisition, 'Purchase requisition retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const requisition = await procurementService.updateRequisition(
        userId,
        req.params.id as string,
        req.body as UpdatePurchaseRequisitionDto
      );
      sendSuccess(res, requisition, 'Purchase requisition updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async approveRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const requisition = await procurementService.approveRequisition(
        userId,
        req.params.id as string,
        req.body?.approvalNotes
      );
      sendSuccess(res, requisition, 'Purchase requisition approved successfully');
    } catch (error) {
      next(error);
    }
  }

  async convertRequisitionToPO(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const po = await procurementService.convertRequisitionToPO(
        userId,
        req.params.id as string,
        req.body.supplierId
      );
      sendSuccess(res, po, 'Requisition converted to Purchase Order successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     PURCHASE ORDER HANDLERS
     ========================================================================== */

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.createPurchaseOrder(
        userId,
        req.body as CreatePurchaseOrderDto
      );
      sendSuccess(res, order, 'Purchase order created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await procurementService.getPurchaseOrders(userId, req.query as PurchaseOrderFilterDto);
      sendSuccess(res, result.data, 'Purchase orders retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.getPurchaseOrderById(userId, req.params.id as string);
      sendSuccess(res, order, 'Purchase order retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.updatePurchaseOrder(
        userId,
        req.params.id as string,
        req.body as UpdatePurchaseOrderDto
      );
      sendSuccess(res, order, 'Purchase order updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitPOForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.submitPOForApproval(userId, req.params.id as string);
      sendSuccess(res, order, 'Purchase order submitted for approval');
    } catch (error) {
      next(error);
    }
  }

  async approvePurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.approvePurchaseOrder(
        userId,
        req.params.id as string,
        req.body as ApprovePurchaseOrderDto
      );
      sendSuccess(res, order, 'Purchase order approved successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.rejectPurchaseOrder(
        userId,
        req.params.id as string,
        req.body as RejectPurchaseOrderDto
      );
      sendSuccess(res, order, 'Purchase order rejected');
    } catch (error) {
      next(error);
    }
  }

  async sendPOToSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.sendPurchaseOrderToSupplier(userId, req.params.id as string);
      sendSuccess(res, order, 'Purchase order dispatched to supplier');
    } catch (error) {
      next(error);
    }
  }

  async cancelPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await procurementService.cancelPurchaseOrder(
        userId,
        req.params.id as string,
        req.body?.reason || 'Cancelled by pharmacy user'
      );
      sendSuccess(res, order, 'Purchase order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     GOODS RECEIVING (GRN) HANDLERS
     ========================================================================== */

  async receiveGoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const receipt = await procurementService.receiveGoods(
        userId,
        req.params.id as string,
        req.body as ReceiveGoodsDto
      );
      sendSuccess(res, receipt, 'Goods received and stock allocated successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getGoodsReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await procurementService.getGoodsReceipts(userId, req.query as GoodsReceiptFilterDto);
      sendSuccess(res, result.data, 'Goods receipt notes retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGoodsReceiptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const receipt = await procurementService.getGoodsReceiptById(userId, req.params.id as string);
      sendSuccess(res, receipt, 'Goods receipt note retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     PURCHASE INVOICE HANDLERS
     ========================================================================== */

  async createPurchaseInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const invoice = await procurementService.createPurchaseInvoice(
        userId,
        req.body as CreatePurchaseInvoiceDto
      );
      sendSuccess(res, invoice, 'Purchase invoice recorded successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await procurementService.getPurchaseInvoices(userId, req.query as InvoiceFilterDto);
      sendSuccess(res, result.data, 'Purchase invoices retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const invoice = await procurementService.getPurchaseInvoiceById(userId, req.params.id as string);
      sendSuccess(res, invoice, 'Purchase invoice retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePurchaseInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const invoice = await procurementService.updatePurchaseInvoice(
        userId,
        req.params.id as string,
        req.body as UpdatePurchaseInvoiceDto
      );
      sendSuccess(res, invoice, 'Purchase invoice updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     STOCK REPLENISHMENT & SUGGESTIONS HANDLERS
     ========================================================================== */

  async getReplenishmentSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const suggestions = await procurementService.getReplenishmentSuggestions(
        userId,
        req.query as ReplenishmentFilterDto
      );
      sendSuccess(res, suggestions, 'Replenishment suggestions generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async convertSuggestionsToRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const requisition = await procurementService.convertSuggestionsToRequisition(
        userId,
        req.body as ConvertSuggestionsToRequisitionDto
      );
      sendSuccess(res, requisition, 'Suggestions converted to Requisition successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getReplenishmentSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const settings = await procurementService.getReplenishmentSettings(userId);
      sendSuccess(res, settings, 'Replenishment settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateReplenishmentSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const settings = await procurementService.updateReplenishmentSettings(
        userId,
        req.body as UpdateReplenishmentSettingsDto
      );
      sendSuccess(res, settings, 'Replenishment settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     PROCUREMENT METRICS HANDLER
     ========================================================================== */

  async getProcurementMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const metrics = await procurementService.getProcurementMetrics(userId);
      sendSuccess(res, metrics, 'Procurement metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const procurementController = new ProcurementController();
