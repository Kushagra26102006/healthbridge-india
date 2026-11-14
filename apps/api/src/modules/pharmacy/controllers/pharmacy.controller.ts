import { Request, Response, NextFunction } from 'express';
import { pharmacyService } from '../services/pharmacy.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import type {
  UpdatePharmacyProfileDto,
  CreatePharmacyInventoryItemDto,
  PharmacyInventoryFilterDto,
  CreatePharmacyOrderDto,
  CreateMedicineCatalogDto,
  UpdateMedicineCatalogDto,
  MedicineCatalogFilterDto,
  PharmacyStockInDto,
  PharmacyStockAdjustmentDto,
  QuarantineBatchDto,
  ReleaseBatchDto,
  InventoryTransactionFilterDto,
} from '@healthbridge/shared-types';

export class PharmacyController {
  /**
   * GET /api/v1/pharmacy/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await pharmacyService.getProfile(userId);
      sendSuccess(res, profile, 'Pharmacy profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await pharmacyService.updateProfile(
        userId,
        req.body as UpdatePharmacyProfileDto
      );
      sendSuccess(res, profile, 'Pharmacy profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/dashboard/summary
   */
  async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await pharmacyService.getDashboardSummary(userId);
      sendSuccess(res, summary, 'Pharmacy dashboard summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     MEDICINE CATALOGUE MANAGEMENT
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/medicines
   */
  async getMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pharmacyService.getMedicines(
        req.query as unknown as MedicineCatalogFilterDto
      );
      sendSuccess(res, result, 'Medication catalogue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/medicines/:id
   */
  async getMedicineById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await pharmacyService.getMedicineById(req.params.id as string);
      sendSuccess(res, item, 'Medication catalogue item retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/medicines
   */
  async createMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await pharmacyService.createMedicine(
        req.body as CreateMedicineCatalogDto
      );
      sendSuccess(res, item, 'Medication catalogue item created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/medicines/:id
   */
  async updateMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await pharmacyService.updateMedicine(
        req.params.id as string,
        req.body as UpdateMedicineCatalogDto
      );
      sendSuccess(res, item, 'Medication catalogue item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     INVENTORY & BATCH MANAGEMENT
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/inventory
   */
  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const inventory = await pharmacyService.getInventory(
        userId,
        req.query as unknown as PharmacyInventoryFilterDto
      );
      sendSuccess(res, inventory, 'Pharmacy inventory retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/alerts
   */
  async getInventoryAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await pharmacyService.getDashboardSummary(userId);
      sendSuccess(res, summary.inventoryAlerts, 'Inventory alerts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/alerts-summary
   */
  async getAlertsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await pharmacyService.getAlertsSummary(userId);
      sendSuccess(res, summary, 'Detailed inventory alerts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/analytics
   */
  async getInventoryAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const analytics = await pharmacyService.getInventoryAnalytics(userId);
      sendSuccess(res, analytics, 'Inventory analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/expiry-report
   */
  async getExpiryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const report = await pharmacyService.getExpiryReport(
        userId,
        req.query as any
      );
      sendSuccess(res, report, 'Inventory expiry report retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/:inventoryId
   */
  async getInventoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.getInventoryById(
        userId,
        req.params.inventoryId as string
      );
      sendSuccess(res, item, 'Inventory batch details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory
   */
  async createInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.createInventoryItem(
        userId,
        req.body as CreatePharmacyInventoryItemDto
      );
      sendSuccess(res, item, 'Inventory batch created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/stock-in
   */
  async receiveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.receiveStock(
        userId,
        req.body as PharmacyStockInDto
      );
      sendSuccess(res, item, 'Stock received and inventory updated successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/stock-adjustment
   */
  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.adjustStock(
        userId,
        req.body as PharmacyStockAdjustmentDto
      );
      sendSuccess(res, item, 'Inventory stock adjusted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/batches/:inventoryId/quarantine
   */
  async quarantineBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.quarantineBatch(
        userId,
        req.params.inventoryId as string,
        req.body as QuarantineBatchDto
      );
      sendSuccess(res, item, 'Batch quarantined successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/batches/:inventoryId/release
   */
  async releaseBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.releaseQuarantinedBatch(
        userId,
        req.params.inventoryId as string,
        req.body as ReleaseBatchDto
      );
      sendSuccess(res, item, 'Batch released from quarantine successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     INVENTORY TRANSACTION LEDGER
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/inventory/transactions
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const transactions = await pharmacyService.getTransactions(
        userId,
        req.query as unknown as InventoryTransactionFilterDto
      );
      sendSuccess(res, transactions, 'Inventory transaction ledger retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/transactions/:transactionId
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const transaction = await pharmacyService.getTransactionById(
        userId,
        req.params.transactionId as string
      );
      sendSuccess(res, transaction, 'Transaction detail retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     PRESCRIPTIONS & ORDERS
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/prescriptions
   */
  async getPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const prescriptions = await pharmacyService.getPrescriptionQueue(
        userId,
        req.query as any
      );
      sendSuccess(res, prescriptions, 'Prescription queue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/prescriptions/:prescriptionId
   */
  async getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const prescription = await pharmacyService.getPrescriptionDetail(
        userId,
        req.params.prescriptionId as string
      );
      sendSuccess(res, prescription, 'Prescription details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders
   */
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orders = await pharmacyService.getOrders(userId, req.query as any);
      sendSuccess(res, orders, 'Pharmacy orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders/:orderId
   */
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await pharmacyService.getOrderById(userId, req.params.orderId as string);
      sendSuccess(res, order, 'Pharmacy order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await pharmacyService.createOrder(
        userId,
        req.body as CreatePharmacyOrderDto
      );
      sendSuccess(res, order, 'Pharmacy order created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }
}

export const pharmacyController = new PharmacyController();
export default pharmacyController;
