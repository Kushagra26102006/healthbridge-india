import { Request, Response, NextFunction } from 'express';
import { pharmacyService } from '../services/pharmacy.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import type {
  UpdatePharmacyProfileDto,
  CreatePharmacyInventoryItemDto,
  PharmacyInventoryFilterDto,
  CreatePharmacyOrderDto,
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
