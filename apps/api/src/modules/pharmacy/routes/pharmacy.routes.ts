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
  createMedicineCatalogSchema,
  updateMedicineCatalogSchema,
  medicineCatalogQuerySchema,
  medicineIdParamSchema,
  stockInSchema,
  stockAdjustmentSchema,
  quarantineBatchSchema,
  releaseBatchSchema,
  inventoryTransactionQuerySchema,
  transactionIdParamSchema,
  inventoryExpiryQuerySchema,
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
   MEDICINE CATALOGUE MANAGEMENT ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/medicines
 * @desc    Search and filter global & localized medicine catalogue
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/medicines',
  validateRequest({ query: medicineCatalogQuerySchema }),
  (req, res, next) => pharmacyController.getMedicines(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/medicines
 * @desc    Create new medicine catalogue entry with deduplication check
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/medicines',
  validateRequest({ body: createMedicineCatalogSchema }),
  (req, res, next) => pharmacyController.createMedicine(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/medicines/:id
 * @desc    Get medicine catalogue item details
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/medicines/:id',
  validateRequest({ params: medicineIdParamSchema }),
  (req, res, next) => pharmacyController.getMedicineById(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/medicines/:id
 * @desc    Update medicine catalogue item details
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.patch(
  '/medicines/:id',
  validateRequest({ params: medicineIdParamSchema, body: updateMedicineCatalogSchema }),
  (req, res, next) => pharmacyController.updateMedicine(req, res, next)
);

/* ==========================================================================
   INVENTORY OPERATIONS & REPORTING ENDPOINTS
   (Notice: Specific static routes MUST precede parameterized routes)
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/inventory/alerts
 * @desc    Retrieve urgent stock & expiry alerts (compact preview)
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get('/inventory/alerts', (req, res, next) =>
  pharmacyController.getInventoryAlerts(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory/alerts-summary
 * @desc    Comprehensive low-stock, out-of-stock, near-expiry, expired, and quarantined alerts
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get('/inventory/alerts-summary', (req, res, next) =>
  pharmacyController.getAlertsSummary(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory/analytics
 * @desc    Inventory metrics, stock valuation formula and dosage form distribution
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get('/inventory/analytics', (req, res, next) =>
  pharmacyController.getInventoryAnalytics(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory/expiry-report
 * @desc    Expiry categorization by horizon (EXPIRED, 7_DAYS, 30_DAYS, 90_DAYS, SAFE)
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/inventory/expiry-report',
  validateRequest({ query: inventoryExpiryQuerySchema }),
  (req, res, next) => pharmacyController.getExpiryReport(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/inventory/stock-in
 * @desc    Stock-in receiving operation (intake from supplier/invoice) with append-only ledger transaction
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/inventory/stock-in',
  validateRequest({ body: stockInSchema }),
  (req, res, next) => pharmacyController.receiveStock(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/inventory/stock-adjustment
 * @desc    Stock adjustment (increase, decrease, damage, expired removal, correction)
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/inventory/stock-adjustment',
  validateRequest({ body: stockAdjustmentSchema }),
  (req, res, next) => pharmacyController.adjustStock(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/inventory/batches/:inventoryId/quarantine
 * @desc    Quarantine batch (mark non-dispensable with reason and ledger entry)
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/inventory/batches/:inventoryId/quarantine',
  validateRequest({ params: inventoryIdParamSchema, body: quarantineBatchSchema }),
  (req, res, next) => pharmacyController.quarantineBatch(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/inventory/batches/:inventoryId/release
 * @desc    Release quarantined batch back into active stock
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/inventory/batches/:inventoryId/release',
  validateRequest({ params: inventoryIdParamSchema, body: releaseBatchSchema }),
  (req, res, next) => pharmacyController.releaseBatch(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory/transactions
 * @desc    Immutable append-only inventory transaction ledger
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/inventory/transactions',
  validateRequest({ query: inventoryTransactionQuerySchema }),
  (req, res, next) => pharmacyController.getTransactions(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/inventory/transactions/:transactionId
 * @desc    Get single transaction detail from immutable ledger
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/inventory/transactions/:transactionId',
  validateRequest({ params: transactionIdParamSchema }),
  (req, res, next) => pharmacyController.getTransactionById(req, res, next)
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
