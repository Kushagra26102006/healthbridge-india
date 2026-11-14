import { Request, Response, NextFunction } from 'express';
import { orderFulfillmentService } from '../services/order-fulfillment.service';
import { sendSuccess } from '../../../utils/api-response';
import type {
  CreateOrderFromPrescriptionDto,
  OrderReviewDto,
  OrderClarificationDto,
  OrderFulfillmentUpdateDto,
  MarkReadyForPickupDto,
  VerifyPickupDto,
  CancelOrderDto,
  OrderFilterDto,
} from '@healthbridge/shared-types';

export class OrderFulfillmentController {
  /**
   * POST /api/v1/pharmacy/orders/from-prescription
   * POST /api/v1/patients/orders
   */
  async createOrderFromPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const order = await orderFulfillmentService.createOrderFromPrescription(
        {
          userId: user.userId,
          role: user.role,
          name: (user as any).name || (user.role === 'PHARMACY' ? 'Pharmacy Staff' : 'Patient'),
        },
        req.body as CreateOrderFromPrescriptionDto
      );
      sendSuccess(res, order, 'Pharmacy order created from prescription successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders
   */
  async getPharmacyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orders = await orderFulfillmentService.getPharmacyOrders(userId, req.query as OrderFilterDto);
      sendSuccess(res, orders, 'Pharmacy orders queue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders/:orderId
   */
  async getPharmacyOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await orderFulfillmentService.getPharmacyOrderById(userId, req.params.orderId as string);
      sendSuccess(res, order, 'Order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/review
   */
  async reviewOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const staffName = (user as any).name || 'Authorized Pharmacist';
      const order = await orderFulfillmentService.reviewOrder(
        user.userId,
        req.params.orderId as string,
        staffName,
        req.body as OrderReviewDto
      );
      sendSuccess(res, order, `Order successfully ${req.body.action.toLowerCase()}ed`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/clarification
   */
  async requestClarification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const staffName = (user as any).name || 'Pharmacist';
      const dto = req.body as OrderClarificationDto;
      const order = await orderFulfillmentService.requestClarification(
        user.userId,
        req.params.orderId as string,
        dto.notes,
        staffName
      );
      sendSuccess(res, order, 'Clarification request logged successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/process
   */
  async startProcessing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const staffName = (user as any).name || 'Pharmacy Staff';
      const order = await orderFulfillmentService.startProcessing(
        user.userId,
        req.params.orderId as string,
        staffName
      );
      sendSuccess(res, order, 'Order processing started');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/fulfillment
   */
  async updateOrderFulfillment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const staffName = (user as any).name || 'Pharmacist';
      const order = await orderFulfillmentService.updateOrderFulfillment(
        user.userId,
        req.params.orderId as string,
        staffName,
        req.body as OrderFulfillmentUpdateDto
      );
      sendSuccess(res, order, 'Order fulfillment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/ready-for-pickup
   */
  async markReadyForPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const staffName = (user as any).name || 'Pharmacy Staff';
      const dto = req.body as MarkReadyForPickupDto;
      const order = await orderFulfillmentService.markReadyForPickup(
        user.userId,
        req.params.orderId as string,
        staffName,
        dto.pickupInstructions
      );
      sendSuccess(res, order, 'Order marked ready for pickup and code generated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/verify-pickup
   */
  async verifyAndCompletePickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const staffName = (user as any).name || 'Authorized Staff';
      const order = await orderFulfillmentService.verifyAndCompletePickup(
        user.userId,
        req.params.orderId as string,
        user.userId,
        staffName,
        req.body as VerifyPickupDto
      );
      sendSuccess(res, order, 'Pickup verification succeeded. Order handover completed.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders/:orderId/cancel
   * POST /api/v1/patients/orders/:orderId/cancel
   */
  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const actorName = (user as any).name || (user.role === 'PHARMACY' ? 'Pharmacy Staff' : 'Patient');
      const order = await orderFulfillmentService.cancelOrder(
        { userId: user.userId, role: user.role, name: actorName },
        req.params.orderId as string,
        req.body as CancelOrderDto
      );
      sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders/:orderId/timeline
   */
  async getOrderTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const timeline = await orderFulfillmentService.getOrderTimeline(
        user.userId,
        user.role,
        req.params.orderId as string
      );
      sendSuccess(res, timeline, 'Order timeline retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders/metrics
   */
  async getOrderAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const metrics = await orderFulfillmentService.getOrderAnalytics(userId);
      sendSuccess(res, metrics, 'Order fulfillment analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATIENT-FACING HANDLERS
   */
  async getPatientOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orders = await orderFulfillmentService.getPatientOrders(userId, req.query as OrderFilterDto);
      sendSuccess(res, orders, 'Patient orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPatientOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await orderFulfillmentService.getPatientOrderById(userId, req.params.orderId as string);
      sendSuccess(res, order, 'Order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const orderFulfillmentController = new OrderFulfillmentController();

