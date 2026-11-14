import { Router } from 'express';
import { labReportController } from '../controllers/lab-report.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';

export const labOrderRoutes = Router();

// Enforce authentication across all lab order endpoints
labOrderRoutes.use(authenticate);

// Paginated query of laboratory test orders
labOrderRoutes.get('/', authorize(['PATIENT', 'DOCTOR', 'ADMIN']), labReportController.getOrders);

// Retrieve full details of single laboratory order
labOrderRoutes.get('/:orderId', authorize(['PATIENT', 'DOCTOR', 'ADMIN']), labReportController.getOrderById);

export default labOrderRoutes;
