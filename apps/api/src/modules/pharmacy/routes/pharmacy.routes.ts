import { Router } from 'express';
import { pharmacyController } from '../controllers/pharmacy.controller';
import { procurementController } from '../controllers/procurement.controller';
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
  verifyPrescriptionParamSchema,
  dispensePrescriptionSchema,
  dispensingQuerySchema,
  dispensingIdParamSchema,
  cancelDispensingSchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierQuerySchema,
  supplierIdParamSchema,
  createSupplierProductSchema,
  updateSupplierProductSchema,
  supplierProductQuerySchema,
  supplierProductIdParamSchema,
  createPurchaseRequisitionSchema,
  updatePurchaseRequisitionSchema,
  requisitionQuerySchema,
  requisitionIdParamSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderQuerySchema,
  purchaseOrderIdParamSchema,
  approvePurchaseOrderSchema,
  rejectPurchaseOrderSchema,
  receiveGoodsSchema,
  goodsReceiptQuerySchema,
  goodsReceiptIdParamSchema,
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
  invoiceQuerySchema,
  invoiceIdParamSchema,
  replenishmentQuerySchema,
  updateReplenishmentSettingsSchema,
  convertSuggestionsToRequisitionSchema,
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

/**
 * @route   GET /api/v1/pharmacy/prescriptions/:prescriptionId/verify
 * @desc    Verify prescription authenticity, validity window and dispensing eligibility
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/prescriptions/:prescriptionId/verify',
  validateRequest({ params: verifyPrescriptionParamSchema }),
  (req, res, next) => pharmacyController.verifyPrescription(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/prescriptions/:prescriptionId/match-inventory
 * @desc    Match prescribed items against active inventory batches with FEFO sorting
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/prescriptions/:prescriptionId/match-inventory',
  validateRequest({ params: verifyPrescriptionParamSchema }),
  (req, res, next) => pharmacyController.matchPrescriptionInventory(req, res, next)
);

/* ==========================================================================
   PRESCRIPTION DISPENSING WORKFLOW ENDPOINTS (DAY 5 TASK 03)
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/dispensing
 * @desc    List past dispensing records with date/status filters and search
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/dispensing',
  validateRequest({ query: dispensingQuerySchema }),
  (req, res, next) => pharmacyController.getDispensingRecords(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/dispensing
 * @desc    Execute atomic prescription dispensing and generate audit record
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/dispensing',
  validateRequest({ body: dispensePrescriptionSchema }),
  (req, res, next) => pharmacyController.dispensePrescription(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/dispensing/:id
 * @desc    Get detailed dispensing record by ID
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/dispensing/:id',
  validateRequest({ params: dispensingIdParamSchema }),
  (req, res, next) => pharmacyController.getDispensingRecordById(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/dispensing/:id/receipt
 * @desc    Generate printable CDSCO-compliant pharmacy dispensing receipt
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.get(
  '/dispensing/:id/receipt',
  validateRequest({ params: dispensingIdParamSchema }),
  (req, res, next) => pharmacyController.getDispensingReceipt(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/dispensing/:id/cancel
 * @desc    Cancel dispensing record with auditable reason and optional stock restitution
 * @access  Private (PHARMACY role only)
 */
pharmacyRoutes.post(
  '/dispensing/:id/cancel',
  validateRequest({ params: dispensingIdParamSchema, body: cancelDispensingSchema }),
  (req, res, next) => pharmacyController.cancelDispensingRecord(req, res, next)
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

/* ==========================================================================
   DAY 5 TASK 04: SUPPLIER MANAGEMENT ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/suppliers
 * @desc    List suppliers with search, status and type filtering
 */
pharmacyRoutes.get(
  '/suppliers',
  validateRequest({ query: supplierQuerySchema }),
  (req, res, next) => procurementController.getSuppliers(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/suppliers
 * @desc    Create new supplier
 */
pharmacyRoutes.post(
  '/suppliers',
  validateRequest({ body: createSupplierSchema }),
  (req, res, next) => procurementController.createSupplier(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/suppliers/products
 * @desc    List supplier product catalog items
 */
pharmacyRoutes.get(
  '/suppliers/products',
  validateRequest({ query: supplierProductQuerySchema }),
  (req, res, next) => procurementController.getSupplierProducts(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/suppliers/products
 * @desc    Add supplier product mapping
 */
pharmacyRoutes.post(
  '/suppliers/products',
  validateRequest({ body: createSupplierProductSchema }),
  (req, res, next) => procurementController.addSupplierProduct(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/suppliers/products/:productId
 * @desc    Update supplier product pricing or details
 */
pharmacyRoutes.patch(
  '/suppliers/products/:productId',
  validateRequest({ params: supplierProductIdParamSchema, body: updateSupplierProductSchema }),
  (req, res, next) => procurementController.updateSupplierProduct(req, res, next)
);

/**
 * @route   DELETE /api/v1/pharmacy/suppliers/products/:productId
 * @desc    Delete supplier product mapping
 */
pharmacyRoutes.delete(
  '/suppliers/products/:productId',
  validateRequest({ params: supplierProductIdParamSchema }),
  (req, res, next) => procurementController.deleteSupplierProduct(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/suppliers/:id
 * @desc    Get detailed supplier info
 */
pharmacyRoutes.get(
  '/suppliers/:id',
  validateRequest({ params: supplierIdParamSchema }),
  (req, res, next) => procurementController.getSupplierById(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/suppliers/:id
 * @desc    Update supplier details
 */
pharmacyRoutes.patch(
  '/suppliers/:id',
  validateRequest({ params: supplierIdParamSchema, body: updateSupplierSchema }),
  (req, res, next) => procurementController.updateSupplier(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/suppliers/:id/history
 * @desc    Get purchase history with supplier
 */
pharmacyRoutes.get(
  '/suppliers/:id/history',
  validateRequest({ params: supplierIdParamSchema }),
  (req, res, next) => procurementController.getSupplierPurchaseHistory(req, res, next)
);

/* ==========================================================================
   DAY 5 TASK 04: PURCHASE REQUISITION ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/requisitions
 * @desc    List purchase requisitions
 */
pharmacyRoutes.get(
  '/requisitions',
  validateRequest({ query: requisitionQuerySchema }),
  (req, res, next) => procurementController.getRequisitions(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/requisitions
 * @desc    Create purchase requisition
 */
pharmacyRoutes.post(
  '/requisitions',
  validateRequest({ body: createPurchaseRequisitionSchema }),
  (req, res, next) => procurementController.createRequisition(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/requisitions/:id
 * @desc    Get purchase requisition by ID
 */
pharmacyRoutes.get(
  '/requisitions/:id',
  validateRequest({ params: requisitionIdParamSchema }),
  (req, res, next) => procurementController.getRequisitionById(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/requisitions/:id
 * @desc    Update purchase requisition
 */
pharmacyRoutes.patch(
  '/requisitions/:id',
  validateRequest({ params: requisitionIdParamSchema, body: updatePurchaseRequisitionSchema }),
  (req, res, next) => procurementController.updateRequisition(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/requisitions/:id/approve
 * @desc    Approve purchase requisition
 */
pharmacyRoutes.post(
  '/requisitions/:id/approve',
  validateRequest({ params: requisitionIdParamSchema }),
  (req, res, next) => procurementController.approveRequisition(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/requisitions/:id/convert-to-po
 * @desc    Convert approved requisition to purchase order
 */
pharmacyRoutes.post(
  '/requisitions/:id/convert-to-po',
  validateRequest({ params: requisitionIdParamSchema }),
  (req, res, next) => procurementController.convertRequisitionToPO(req, res, next)
);

/* ==========================================================================
   DAY 5 TASK 04: PURCHASE ORDER ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/purchases
 * @desc    List purchase orders
 */
pharmacyRoutes.get(
  '/purchases',
  validateRequest({ query: purchaseOrderQuerySchema }),
  (req, res, next) => procurementController.getPurchaseOrders(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/purchases
 * @desc    Create purchase order
 */
pharmacyRoutes.post(
  '/purchases',
  validateRequest({ body: createPurchaseOrderSchema }),
  (req, res, next) => procurementController.createPurchaseOrder(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/purchases/:id
 * @desc    Get purchase order details
 */
pharmacyRoutes.get(
  '/purchases/:id',
  validateRequest({ params: purchaseOrderIdParamSchema }),
  (req, res, next) => procurementController.getPurchaseOrderById(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/purchases/:id
 * @desc    Update draft/pending purchase order
 */
pharmacyRoutes.patch(
  '/purchases/:id',
  validateRequest({ params: purchaseOrderIdParamSchema, body: updatePurchaseOrderSchema }),
  (req, res, next) => procurementController.updatePurchaseOrder(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/purchases/:id/submit
 * @desc    Submit draft purchase order for approval
 */
pharmacyRoutes.post(
  '/purchases/:id/submit',
  validateRequest({ params: purchaseOrderIdParamSchema }),
  (req, res, next) => procurementController.submitPOForApproval(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/purchases/:id/approve
 * @desc    Approve purchase order
 */
pharmacyRoutes.post(
  '/purchases/:id/approve',
  validateRequest({ params: purchaseOrderIdParamSchema, body: approvePurchaseOrderSchema }),
  (req, res, next) => procurementController.approvePurchaseOrder(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/purchases/:id/reject
 * @desc    Reject purchase order
 */
pharmacyRoutes.post(
  '/purchases/:id/reject',
  validateRequest({ params: purchaseOrderIdParamSchema, body: rejectPurchaseOrderSchema }),
  (req, res, next) => procurementController.rejectPurchaseOrder(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/purchases/:id/send
 * @desc    Send approved purchase order to supplier
 */
pharmacyRoutes.post(
  '/purchases/:id/send',
  validateRequest({ params: purchaseOrderIdParamSchema }),
  (req, res, next) => procurementController.sendPOToSupplier(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/purchases/:id/cancel
 * @desc    Cancel purchase order
 */
pharmacyRoutes.post(
  '/purchases/:id/cancel',
  validateRequest({ params: purchaseOrderIdParamSchema }),
  (req, res, next) => procurementController.cancelPurchaseOrder(req, res, next)
);

/* ==========================================================================
   DAY 5 TASK 04: GOODS RECEIVING (GRN) ENDPOINTS
   ========================================================================== */

/**
 * @route   POST /api/v1/pharmacy/purchases/:id/receive
 * @desc    Receive goods against purchase order (GRN + Stock allocation + Ledger)
 */
pharmacyRoutes.post(
  '/purchases/:id/receive',
  validateRequest({ params: purchaseOrderIdParamSchema, body: receiveGoodsSchema }),
  (req, res, next) => procurementController.receiveGoods(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/goods-receipts
 * @desc    List goods receipt notes
 */
pharmacyRoutes.get(
  '/goods-receipts',
  validateRequest({ query: goodsReceiptQuerySchema }),
  (req, res, next) => procurementController.getGoodsReceipts(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/goods-receipts/:id
 * @desc    Get goods receipt note by ID
 */
pharmacyRoutes.get(
  '/goods-receipts/:id',
  validateRequest({ params: goodsReceiptIdParamSchema }),
  (req, res, next) => procurementController.getGoodsReceiptById(req, res, next)
);

/* ==========================================================================
   DAY 5 TASK 04: PURCHASE INVOICE & RECONCILIATION ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/invoices
 * @desc    List purchase invoices
 */
pharmacyRoutes.get(
  '/invoices',
  validateRequest({ query: invoiceQuerySchema }),
  (req, res, next) => procurementController.getPurchaseInvoices(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/invoices
 * @desc    Record purchase invoice
 */
pharmacyRoutes.post(
  '/invoices',
  validateRequest({ body: createPurchaseInvoiceSchema }),
  (req, res, next) => procurementController.createPurchaseInvoice(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/invoices/:id
 * @desc    Get purchase invoice by ID
 */
pharmacyRoutes.get(
  '/invoices/:id',
  validateRequest({ params: invoiceIdParamSchema }),
  (req, res, next) => procurementController.getPurchaseInvoiceById(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/invoices/:id
 * @desc    Update invoice reconciliation status
 */
pharmacyRoutes.patch(
  '/invoices/:id',
  validateRequest({ params: invoiceIdParamSchema, body: updatePurchaseInvoiceSchema }),
  (req, res, next) => procurementController.updatePurchaseInvoice(req, res, next)
);

/* ==========================================================================
   DAY 5 TASK 04: STOCK REPLENISHMENT ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/replenishment/suggestions
 * @desc    Get automated reorder suggestions based on net stock and reorder thresholds
 */
pharmacyRoutes.get(
  '/replenishment/suggestions',
  validateRequest({ query: replenishmentQuerySchema }),
  (req, res, next) => procurementController.getReplenishmentSuggestions(req, res, next)
);

/**
 * @route   POST /api/v1/pharmacy/replenishment/convert-to-requisition
 * @desc    Convert reorder suggestions to a purchase requisition
 */
pharmacyRoutes.post(
  '/replenishment/convert-to-requisition',
  validateRequest({ body: convertSuggestionsToRequisitionSchema }),
  (req, res, next) => procurementController.convertSuggestionsToRequisition(req, res, next)
);

/**
 * @route   GET /api/v1/pharmacy/replenishment/settings
 * @desc    Get replenishment settings
 */
pharmacyRoutes.get('/replenishment/settings', (req, res, next) =>
  procurementController.getReplenishmentSettings(req, res, next)
);

/**
 * @route   PATCH /api/v1/pharmacy/replenishment/settings
 * @desc    Update replenishment thresholds and policies
 */
pharmacyRoutes.patch(
  '/replenishment/settings',
  validateRequest({ body: updateReplenishmentSettingsSchema }),
  (req, res, next) => procurementController.updateReplenishmentSettings(req, res, next)
);

/* ==========================================================================
   DAY 5 TASK 04: PROCUREMENT METRICS ENDPOINT
   ========================================================================== */

/**
 * @route   GET /api/v1/pharmacy/procurement/metrics
 * @desc    Aggregated procurement summary statistics
 */
pharmacyRoutes.get('/procurement/metrics', (req, res, next) =>
  procurementController.getProcurementMetrics(req, res, next)
);

export default pharmacyRoutes;
