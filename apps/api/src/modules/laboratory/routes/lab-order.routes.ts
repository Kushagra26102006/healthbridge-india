import { Router, Request, Response } from 'express';
import { labReportController } from '../controllers/lab-report.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { createDoctorLabOrderSchema } from '@healthbridge/validation';
import { doctorLabOrderService } from '../../platform/services/doctor-lab-order.service';

export const labOrderRoutes = Router();

// Enforce authentication across all lab order endpoints
labOrderRoutes.use(authenticate);

// Create a new clinical laboratory order (Authorized DOCTOR only — Day 8 Task 01 bridge)
labOrderRoutes.post(
  '/',
  authorize(['DOCTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const dto = createDoctorLabOrderSchema.parse(req.body);
    const created = await doctorLabOrderService.createLabOrder({
      doctorUserId: req.user!.userId,
      doctorName: (req.user as any)?.name || req.user?.email,
      dto,
      requestId: req.headers['x-request-id'] as string | undefined,
    });
    sendSuccess(res, created, 'Laboratory order created successfully', 201);
  })
);

// Paginated query of laboratory test orders
labOrderRoutes.get('/', authorize(['PATIENT', 'DOCTOR', 'ADMIN']), labReportController.getOrders);

// Retrieve full details of single laboratory order
labOrderRoutes.get('/:orderId', authorize(['PATIENT', 'DOCTOR', 'ADMIN']), labReportController.getOrderById);

export default labOrderRoutes;

