import { Router } from 'express';
import { pharmacyController } from '../controllers/pharmacy.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  updatePharmacyProfileSchema,
  createPharmacyInventorySchema,
  pharmacyInventoryQuerySchema,
  inventoryIdParamSchema,
  pharmacyPrescriptionQuerySchema,
  pharmacyPrescriptionIdParamSchema,
  createPharmacyOrderSchema,
  pharmacyOrderQuerySchema,
  orderIdParamSchema,
} from '@healthbridge/validation';

export const pharmacyRoutes = Router();

// All pharmacy routes require active authentication & PHARMACY role isolation
pharmacyRoutes.use(authenticate);
pharmacyRoutes.use(authorize(['PHARMACY']));

/* ==========================================================================
   PHARMACY PROFILE ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/profile
 * @desc    Get authenticated pharmacy profile, verified license and location
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get('/profile', (req, res, next) =>
  pharmacyController.getProfile(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/profile
 * @desc    Update permitted pharmacy profile fields
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.patch(
  '/profile',
  validateRequest({ body: updatePharmacyProfileSchema }),
  (req, res, next) => pharmacyController.updateProfile(req, res, next)
);

/* ==========================================================================
   PHARMACY DASHBOARD OVERVIEW ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/dashboard/summary
 * @desc    Get pharmacy aggregated metrics, queue preview, alerts and recent activity
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get('/dashboard/summary', (req, res, next) =>
  pharmacyController.getDashboardSummary(req, res, next)
);

/* ==========================================================================
   PHARMACY INVENTORY FOUNDATION ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/inventory/alerts
 * @desc    Retrieve urgent stock & expiry alerts
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get('/inventory/alerts', (req, res, next) =>
  pharmacyController.getInventoryAlerts(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory
 * @desc    List pharmacy inventory batches with search, filters and pagination
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/inventory',
  validateRequest({ query: pharmacyInventoryQuerySchema }),
  (req, res, next) => pharmacyController.getInventory(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/inventory
 * @desc    Add new inventory batch item
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/inventory',
  validateRequest({ body: createPharmacyInventorySchema }),
  (req, res, next) => pharmacyController.createInventoryItem(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory/:inventoryId
 * @desc    Get detailed batch item (strictly scoped to authenticated pharmacy)
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/inventory/:inventoryId',
  validateRequest({ params: inventoryIdParamSchema }),
  (req, res, next) => pharmacyController.getInventoryById(req, res, next)
);

/* ==========================================================================
   PRESCRIPTION QUEUE FOUNDATION ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/prescriptions
 * @desc    List incoming active doctor prescriptions queue
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/prescriptions',
  validateRequest({ query: pharmacyPrescriptionQuerySchema }),
  (req, res, next) => pharmacyController.getPrescriptions(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/prescriptions/:prescriptionId
 * @desc    Get authorized digital prescription details with minimum necessary demographics
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/prescriptions/:prescriptionId',
  validateRequest({ params: pharmacyPrescriptionIdParamSchema }),
  (req, res, next) => pharmacyController.getPrescriptionById(req, res, next)
);

/* ==========================================================================
   PHARMACY ORDER FOUNDATION ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/orders
 * @desc    List pharmacy orders with status filters and search
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/orders',
  validateRequest({ query: pharmacyOrderQuerySchema }),
  (req, res, next) => pharmacyController.getOrders(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/orders
 * @desc    Create new fulfillment order
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/orders',
  validateRequest({ body: createPharmacyOrderSchema }),
  (req, res, next) => pharmacyController.createOrder(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/orders/:orderId
 * @desc    Get detailed pharmacy order by ID
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/orders/:orderId',
  validateRequest({ params: orderIdParamSchema }),
  (req, res, next) => pharmacyController.getOrderById(req, res, next)
);

export default pharmacyRoutes;
