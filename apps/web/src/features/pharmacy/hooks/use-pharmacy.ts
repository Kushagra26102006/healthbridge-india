import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '../api/pharmacy-api';
import type {
  UpdatePharmacyProfileDto,
  PharmacyInventoryFilterDto,
  CreatePharmacyInventoryItemDto,
  CreatePharmacyOrderDto,
  MedicineCatalogFilterDto,
  CreateMedicineCatalogDto,
  UpdateMedicineCatalogDto,
  PharmacyStockInDto,
  PharmacyStockAdjustmentDto,
  QuarantineBatchDto,
  ReleaseBatchDto,
  InventoryTransactionFilterDto,
  DispensePrescriptionDto,
  DispensingFilterDto,
  CancelDispensingDto,
  SupplierFilterDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierProductFilterDto,
  CreateSupplierProductDto,
  UpdateSupplierProductDto,
  RequisitionFilterDto,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto,
  PurchaseOrderFilterDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  RejectPurchaseOrderDto,
  GoodsReceiptFilterDto,
  ReceiveGoodsDto,
  InvoiceFilterDto,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  ReplenishmentFilterDto,
  ConvertSuggestionsToRequisitionDto,
  UpdateReplenishmentSettingsDto,
  CreateOrderFromPrescriptionDto,
  OrderReviewDto,
  OrderClarificationDto,
  OrderFulfillmentUpdateDto,
  MarkReadyForPickupDto,
  VerifyPickupDto,
  CancelOrderDto,
  OrderFilterDto,
  UploadPharmacyDocumentDto,
  UpdateOperatingHoursDto,
  UpdatePharmacyServicesDto,
  InvitePharmacyStaffDto,
  UpdatePharmacyStaffDto,
  AcceptStaffInviteDto,
  PharmacyStaffFilterDto,
  ChangePharmacyPasswordDto,
} from '@healthbridge/shared-types';

export const PHARMACY_QUERY_KEYS = {
  profile: ['pharmacy', 'profile'] as const,
  dashboardSummary: ['pharmacy', 'dashboard-summary'] as const,
  medicines: (filter?: MedicineCatalogFilterDto) => ['pharmacy', 'medicines', filter] as const,
  medicineDetail: (id: string) => ['pharmacy', 'medicine-detail', id] as const,
  inventory: (filter?: PharmacyInventoryFilterDto) => ['pharmacy', 'inventory', filter] as const,
  inventoryDetail: (id: string) => ['pharmacy', 'inventory-detail', id] as const,
  inventoryAlerts: ['pharmacy', 'inventory-alerts'] as const,
  alertsSummary: ['pharmacy', 'alerts-summary'] as const,
  inventoryAnalytics: ['pharmacy', 'inventory-analytics'] as const,
  expiryReport: (params?: Record<string, unknown>) => ['pharmacy', 'expiry-report', params] as const,
  transactions: (filter?: InventoryTransactionFilterDto) => ['pharmacy', 'transactions', filter] as const,
  transactionDetail: (id: string) => ['pharmacy', 'transaction-detail', id] as const,
  prescriptions: (params?: Record<string, unknown>) => ['pharmacy', 'prescriptions', params] as const,
  prescriptionDetail: (id: string) => ['pharmacy', 'prescription-detail', id] as const,
  prescriptionVerify: (id: string) => ['pharmacy', 'prescriptions', id, 'verify'] as const,
  prescriptionMatch: (id: string) => ['pharmacy', 'prescriptions', id, 'match'] as const,
  dispensingRecords: (filter?: DispensingFilterDto) => ['pharmacy', 'dispensing', filter] as const,
  dispensingDetail: (id: string) => ['pharmacy', 'dispensing', id] as const,
  dispensingReceipt: (id: string) => ['pharmacy', 'dispensing', id, 'receipt'] as const,
  orders: (params?: Record<string, unknown>) => ['pharmacy', 'orders', params] as const,
  orderDetail: (id: string) => ['pharmacy', 'order-detail', id] as const,
  orderTimeline: (id: string) => ['pharmacy', 'order-timeline', id] as const,
  orderMetrics: ['pharmacy', 'orders', 'metrics'] as const,
  patientOrders: (params?: Record<string, unknown>) => ['patient', 'orders', params] as const,
  patientOrderDetail: (id: string) => ['patient', 'order-detail', id] as const,
  patientOrderTracking: (id: string) => ['patient', 'order-tracking', id] as const,
  // Day 5 Task 04: Procurement Keys
  suppliers: (filter?: SupplierFilterDto) => ['pharmacy', 'suppliers', filter] as const,
  supplierDetail: (id: string) => ['pharmacy', 'suppliers', id] as const,
  supplierHistory: (id: string) => ['pharmacy', 'suppliers', id, 'history'] as const,
  supplierProducts: (filter?: SupplierProductFilterDto) => ['pharmacy', 'supplier-products', filter] as const,
  requisitions: (filter?: RequisitionFilterDto) => ['pharmacy', 'requisitions', filter] as const,
  requisitionDetail: (id: string) => ['pharmacy', 'requisitions', id] as const,
  purchases: (filter?: PurchaseOrderFilterDto) => ['pharmacy', 'purchases', filter] as const,
  purchaseDetail: (id: string) => ['pharmacy', 'purchases', id] as const,
  goodsReceipts: (filter?: GoodsReceiptFilterDto) => ['pharmacy', 'goods-receipts', filter] as const,
  goodsReceiptDetail: (id: string) => ['pharmacy', 'goods-receipts', id] as const,
  invoices: (filter?: InvoiceFilterDto) => ['pharmacy', 'invoices', filter] as const,
  invoiceDetail: (id: string) => ['pharmacy', 'invoices', id] as const,
  replenishmentSuggestions: (filter?: ReplenishmentFilterDto) => ['pharmacy', 'replenishment-suggestions', filter] as const,
  replenishmentSettings: ['pharmacy', 'replenishment-settings'] as const,
  procurementMetrics: ['pharmacy', 'procurement-metrics'] as const,
  // Day 5 Task 07: Profile, Settings, Staff & Security Keys
  operatingHours: ['pharmacy', 'operating-hours'] as const,
  services: ['pharmacy', 'services'] as const,
  staffList: (filter?: PharmacyStaffFilterDto) => ['pharmacy', 'staff', filter] as const,
  staffDetail: (id: string) => ['pharmacy', 'staff-detail', id] as const,
  sessions: ['pharmacy', 'sessions'] as const,
};

/**
 * 1. Pharmacy Profile Hooks
 */
export function usePharmacyProfile() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.profile,
    queryFn: () => pharmacyApi.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePharmacyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePharmacyProfileDto) => pharmacyApi.updateProfile(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(PHARMACY_QUERY_KEYS.profile, data);
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

/**
 * 2. Pharmacy Dashboard Summary Hook
 */
export function usePharmacyDashboardSummary() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.dashboardSummary,
    queryFn: () => pharmacyApi.getDashboardSummary(),
    staleTime: 60 * 1000,
  });
}

/**
 * 3. Medicine Catalogue Hooks
 */
export function usePharmacyMedicines(filter?: MedicineCatalogFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.medicines(filter),
    queryFn: () => pharmacyApi.getMedicines(filter),
    staleTime: 60 * 1000,
  });
}

export function usePharmacyMedicine(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.medicineDetail(id || ''),
    queryFn: () => pharmacyApi.getMedicineById(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePharmacyMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMedicineCatalogDto) => pharmacyApi.createMedicine(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
    },
  });
}

export function useUpdatePharmacyMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMedicineCatalogDto }) =>
      pharmacyApi.updateMedicine(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.medicineDetail(variables.id) });
    },
  });
}

/**
 * 4. Inventory Management Hooks
 */
export function usePharmacyInventory(filter?: PharmacyInventoryFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.inventory(filter),
    queryFn: () => pharmacyApi.getInventory(filter),
    staleTime: 60 * 1000,
  });
}

export function usePharmacyInventoryItem(inventoryId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.inventoryDetail(inventoryId || ''),
    queryFn: () => pharmacyApi.getInventoryById(inventoryId!),
    enabled: Boolean(inventoryId),
  });
}

export function useCreatePharmacyInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePharmacyInventoryItemDto) => pharmacyApi.createInventoryItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAlerts });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.alertsSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics });
    },
  });
}

export function usePharmacyStockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: PharmacyStockInDto) => pharmacyApi.receiveStock(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAlerts });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.alertsSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'expiry-report'] });
    },
  });
}

export function usePharmacyStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: PharmacyStockAdjustmentDto) => pharmacyApi.adjustStock(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAlerts });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.alertsSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'expiry-report'] });
    },
  });
}

export function useQuarantineBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, dto }: { inventoryId: string; dto: QuarantineBatchDto }) =>
      pharmacyApi.quarantineBatch(inventoryId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.alertsSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics });
    },
  });
}

export function useReleaseBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, dto }: { inventoryId: string; dto: ReleaseBatchDto }) =>
      pharmacyApi.releaseBatch(inventoryId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.alertsSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics });
    },
  });
}

/**
 * 5. Inventory Transaction Ledger Hooks
 */
export function usePharmacyTransactions(filter?: InventoryTransactionFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.transactions(filter),
    queryFn: () => pharmacyApi.getTransactions(filter),
    staleTime: 30 * 1000,
  });
}

export function usePharmacyTransaction(transactionId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.transactionDetail(transactionId || ''),
    queryFn: () => pharmacyApi.getTransactionById(transactionId!),
    enabled: Boolean(transactionId),
  });
}

/**
 * 6. Analytics, Alerts & Expiry Hooks
 */
export function usePharmacyInventoryAlerts() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.inventoryAlerts,
    queryFn: () => pharmacyApi.getInventoryAlerts(),
    staleTime: 60 * 1000,
  });
}

export function usePharmacyAlertsSummary() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.alertsSummary,
    queryFn: () => pharmacyApi.getAlertsSummary(),
    staleTime: 60 * 1000,
  });
}

export function usePharmacyInventoryAnalytics() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics,
    queryFn: () => pharmacyApi.getInventoryAnalytics(),
    staleTime: 60 * 1000,
  });
}

export function usePharmacyExpiryReport(params?: {
  horizon?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.expiryReport(params as Record<string, unknown>),
    queryFn: () => pharmacyApi.getExpiryReport(params),
    staleTime: 60 * 1000,
  });
}

/**
 * 7. Prescription Queue Hooks
 */
export function usePharmacyPrescriptionQueue(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.prescriptions(params),
    queryFn: () => pharmacyApi.getPrescriptions(params),
    staleTime: 30 * 1000,
  });
}

export function usePharmacyPrescriptionDetail(prescriptionId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.prescriptionDetail(prescriptionId || ''),
    queryFn: () => pharmacyApi.getPrescriptionById(prescriptionId!),
    enabled: Boolean(prescriptionId),
  });
}

/**
 * 8. Orders Hooks (Day 5 Task 05)
 */
export function usePharmacyOrders(params?: OrderFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.orders(params as any),
    queryFn: () => pharmacyApi.getOrders(params),
    staleTime: 30 * 1000,
  });
}

export function usePharmacyOrder(orderId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.orderDetail(orderId || ''),
    queryFn: () => pharmacyApi.getOrderById(orderId!),
    enabled: Boolean(orderId),
  });
}

export function usePharmacyOrderTimeline(orderId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.orderTimeline(orderId || ''),
    queryFn: () => pharmacyApi.getOrderTimeline(orderId!),
    enabled: Boolean(orderId),
  });
}

export function usePharmacyOrderMetrics() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.orderMetrics,
    queryFn: () => pharmacyApi.getOrderMetrics(),
    staleTime: 30 * 1000,
  });
}

export function useCreatePharmacyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePharmacyOrderDto) => pharmacyApi.createOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

export function useCreateOrderFromPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrderFromPrescriptionDto) =>
      pharmacyApi.createOrderFromPrescription(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

export function useReviewPharmacyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: OrderReviewDto }) =>
      pharmacyApi.reviewOrder(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

export function useRequestOrderClarification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: OrderClarificationDto }) =>
      pharmacyApi.requestOrderClarification(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(variables.orderId) });
    },
  });
}

export function useStartProcessingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => pharmacyApi.startProcessingOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(orderId) });
    },
  });
}

export function useUpdateOrderFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: OrderFulfillmentUpdateDto }) =>
      pharmacyApi.updateOrderFulfillment(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

export function useMarkReadyForPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto?: MarkReadyForPickupDto }) =>
      pharmacyApi.markReadyForPickup(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

export function useVerifyPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: VerifyPickupDto }) =>
      pharmacyApi.verifyPickup(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

export function useCancelPharmacyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: CancelOrderDto }) =>
      pharmacyApi.cancelOrder(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.orderTimeline(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

/**
 * Patient Order Hooks
 */
export function usePatientOrders(params?: OrderFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.patientOrders(params as any),
    queryFn: () => pharmacyApi.getPatientOrders(params),
    staleTime: 30 * 1000,
  });
}

export function usePatientOrderDetail(orderId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.patientOrderDetail(orderId || ''),
    queryFn: () => pharmacyApi.getPatientOrderById(orderId!),
    enabled: Boolean(orderId),
  });
}

export function usePatientOrderTracking(orderId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.patientOrderTracking(orderId || ''),
    queryFn: () => pharmacyApi.getPatientOrderTracking(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useCancelPatientOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: CancelOrderDto }) =>
      pharmacyApi.cancelPatientOrder(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'orders'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.patientOrderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.patientOrderTracking(variables.orderId) });
    },
  });
}

/**
 * 9. Prescription Verification, Medicine Matching & Dispensing Hooks (Day 5 Task 03)
 */
export function useVerifyPrescription(prescriptionId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.prescriptionVerify(prescriptionId || ''),
    queryFn: () => pharmacyApi.verifyPrescription(prescriptionId!),
    enabled: Boolean(prescriptionId),
  });
}

export function useMatchPrescriptionInventory(prescriptionId?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.prescriptionMatch(prescriptionId || ''),
    queryFn: () => pharmacyApi.matchPrescriptionInventory(prescriptionId!),
    enabled: Boolean(prescriptionId),
  });
}

export function useDispensePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: DispensePrescriptionDto) => pharmacyApi.dispensePrescription(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'dispensing'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAnalytics });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.inventoryAlerts });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.alertsSummary });
    },
  });
}

export function usePharmacyDispensingRecords(params?: DispensingFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.dispensingRecords(params),
    queryFn: () => pharmacyApi.getDispensingRecords(params),
    staleTime: 30 * 1000,
  });
}

export function usePharmacyDispensingRecord(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.dispensingDetail(id || ''),
    queryFn: () => pharmacyApi.getDispensingRecordById(id!),
    enabled: Boolean(id),
  });
}

export function usePharmacyDispensingReceipt(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.dispensingReceipt(id || ''),
    queryFn: () => pharmacyApi.getDispensingReceipt(id!),
    enabled: Boolean(id),
  });
}

export function useCancelPharmacyDispensing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CancelDispensingDto }) =>
      pharmacyApi.cancelDispensingRecord(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'dispensing'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dispensingDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
    },
  });
}

/**
 * ============================================================================
 * DAY 5 TASK 04: SUPPLIER MANAGEMENT HOOKS
 * ============================================================================
 */

export function useSuppliers(params?: SupplierFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.suppliers(params),
    queryFn: () => pharmacyApi.getSuppliers(params),
    staleTime: 30 * 1000,
  });
}

export function useSupplier(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.supplierDetail(id || ''),
    queryFn: () => pharmacyApi.getSupplierById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierDto) => pharmacyApi.createSupplier(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSupplierDto }) =>
      pharmacyApi.updateSupplier(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.supplierDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useSupplierPurchaseHistory(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.supplierHistory(id || ''),
    queryFn: () => pharmacyApi.getSupplierPurchaseHistory(id!),
    enabled: Boolean(id),
  });
}

export function useSupplierProducts(params?: SupplierProductFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.supplierProducts(params),
    queryFn: () => pharmacyApi.getSupplierProducts(params),
    staleTime: 30 * 1000,
  });
}

export function useAddSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierProductDto) => pharmacyApi.addSupplierProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'supplier-products'] });
    },
  });
}

export function useUpdateSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, dto }: { productId: string; dto: UpdateSupplierProductDto }) =>
      pharmacyApi.updateSupplierProduct(productId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'supplier-products'] });
    },
  });
}

export function useDeleteSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => pharmacyApi.deleteSupplierProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'supplier-products'] });
    },
  });
}

/**
 * ============================================================================
 * PURCHASE REQUISITIONS HOOKS
 * ============================================================================
 */

export function useRequisitions(params?: RequisitionFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.requisitions(params),
    queryFn: () => pharmacyApi.getRequisitions(params),
    staleTime: 30 * 1000,
  });
}

export function useRequisition(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.requisitionDetail(id || ''),
    queryFn: () => pharmacyApi.getRequisitionById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseRequisitionDto) => pharmacyApi.createRequisition(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'requisitions'] });
    },
  });
}

export function useUpdateRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePurchaseRequisitionDto }) =>
      pharmacyApi.updateRequisition(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'requisitions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.requisitionDetail(variables.id) });
    },
  });
}

export function useApproveRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvalNotes }: { id: string; approvalNotes?: string }) =>
      pharmacyApi.approveRequisition(id, approvalNotes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'requisitions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.requisitionDetail(variables.id) });
    },
  });
}

export function useConvertRequisitionToPO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, supplierId }: { id: string; supplierId: string }) =>
      pharmacyApi.convertRequisitionToPO(id, supplierId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'requisitions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.requisitionDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

/**
 * ============================================================================
 * PURCHASE ORDER HOOKS
 * ============================================================================
 */

export function usePurchaseOrders(params?: PurchaseOrderFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.purchases(params),
    queryFn: () => pharmacyApi.getPurchaseOrders(params),
    staleTime: 30 * 1000,
  });
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(id || ''),
    queryFn: () => pharmacyApi.getPurchaseOrderById(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderDto) => pharmacyApi.createPurchaseOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePurchaseOrderDto }) =>
      pharmacyApi.updatePurchaseOrder(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(variables.id) });
    },
  });
}

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyApi.submitPOForApproval(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: ApprovePurchaseOrderDto }) =>
      pharmacyApi.approvePurchaseOrder(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RejectPurchaseOrderDto }) =>
      pharmacyApi.rejectPurchaseOrder(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useSendPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyApi.sendPurchaseOrderToSupplier(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pharmacyApi.cancelPurchaseOrder(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

/**
 * ============================================================================
 * GOODS RECEIVING (GRN) HOOKS
 * ============================================================================
 */

export function useGoodsReceipts(params?: GoodsReceiptFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.goodsReceipts(params),
    queryFn: () => pharmacyApi.getGoodsReceipts(params),
    staleTime: 30 * 1000,
  });
}

export function useGoodsReceipt(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.goodsReceiptDetail(id || ''),
    queryFn: () => pharmacyApi.getGoodsReceiptById(id!),
    enabled: Boolean(id),
  });
}

export function useReceiveGoods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, dto }: { poId: string; dto: ReceiveGoodsDto }) =>
      pharmacyApi.receiveGoods(poId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.purchaseDetail(variables.poId) });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

/**
 * ============================================================================
 * PURCHASE INVOICE HOOKS
 * ============================================================================
 */

export function usePurchaseInvoices(params?: InvoiceFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.invoices(params),
    queryFn: () => pharmacyApi.getPurchaseInvoices(params),
    staleTime: 30 * 1000,
  });
}

export function usePurchaseInvoice(id?: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.invoiceDetail(id || ''),
    queryFn: () => pharmacyApi.getPurchaseInvoiceById(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseInvoiceDto) => pharmacyApi.createPurchaseInvoice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

export function useUpdatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePurchaseInvoiceDto }) =>
      pharmacyApi.updatePurchaseInvoice(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.invoiceDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.procurementMetrics });
    },
  });
}

/**
 * ============================================================================
 * STOCK REPLENISHMENT & SETTINGS HOOKS
 * ============================================================================
 */

export function useReplenishmentSuggestions(params?: ReplenishmentFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.replenishmentSuggestions(params),
    queryFn: () => pharmacyApi.getReplenishmentSuggestions(params),
    staleTime: 30 * 1000,
  });
}

export function useConvertSuggestionsToRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ConvertSuggestionsToRequisitionDto) =>
      pharmacyApi.convertSuggestionsToRequisition(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'replenishment-suggestions'] });
    },
  });
}

export function useReplenishmentSettings() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.replenishmentSettings,
    queryFn: () => pharmacyApi.getReplenishmentSettings(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateReplenishmentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateReplenishmentSettingsDto) => pharmacyApi.updateReplenishmentSettings(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.replenishmentSettings });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'replenishment-suggestions'] });
    },
  });
}

/**
 * ============================================================================
 * PROCUREMENT METRICS HOOK
 * ============================================================================
 */

export function useProcurementMetrics() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.procurementMetrics,
    queryFn: () => pharmacyApi.getProcurementMetrics(),
    staleTime: 30 * 1000,
  });
}

/**
 * ============================================================================
 * DAY 5 TASK 07: PROFILE DOCUMENTS HOOKS
 * ============================================================================
 */

export function useUploadPharmacyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UploadPharmacyDocumentDto) => pharmacyApi.uploadDocument(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.profile });
    },
  });
}

export function useDeletePharmacyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => pharmacyApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.profile });
    },
  });
}

/**
 * ============================================================================
 * DAY 5 TASK 07: OPERATING HOURS HOOKS
 * ============================================================================
 */

export function usePharmacyOperatingHours() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.operatingHours,
    queryFn: () => pharmacyApi.getOperatingHours(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateOperatingHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateOperatingHoursDto) => pharmacyApi.updateOperatingHours(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.operatingHours });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.profile });
    },
  });
}

/**
 * ============================================================================
 * DAY 5 TASK 07: SERVICES HOOKS
 * ============================================================================
 */

export function usePharmacyServices() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.services,
    queryFn: () => pharmacyApi.getServices(),
    staleTime: 60 * 1000,
  });
}

export function useUpdatePharmacyServices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePharmacyServicesDto) => pharmacyApi.updateServices(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.services });
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.profile });
    },
  });
}

/**
 * ============================================================================
 * DAY 5 TASK 07: PHARMACY STAFF MANAGEMENT HOOKS
 * ============================================================================
 */

export function usePharmacyStaffList(filter?: PharmacyStaffFilterDto) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.staffList(filter),
    queryFn: () => pharmacyApi.getStaffList(filter),
    staleTime: 30 * 1000,
  });
}

export function usePharmacyStaffMember(id: string) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.staffDetail(id),
    queryFn: () => pharmacyApi.getStaffMember(id),
    enabled: Boolean(id),
  });
}

export function useInvitePharmacyStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: InvitePharmacyStaffDto) => pharmacyApi.inviteStaff(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'staff'] });
    },
  });
}

export function useUpdatePharmacyStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePharmacyStaffDto }) =>
      pharmacyApi.updateStaffMember(id, dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.staffDetail(vars.id) });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'staff'] });
    },
  });
}

export function useSuspendPharmacyStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      pharmacyApi.suspendStaff(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'staff'] });
    },
  });
}

export function useReactivatePharmacyStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyApi.reactivateStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'staff'] });
    },
  });
}

export function useRevokePharmacyStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyApi.revokeStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'staff'] });
    },
  });
}

export function useAcceptPharmacyStaffInvite() {
  return useMutation({
    mutationFn: (dto: AcceptStaffInviteDto) => pharmacyApi.acceptStaffInvite(dto),
  });
}

/**
 * ============================================================================
 * DAY 5 TASK 07: SESSIONS & ACCOUNT SECURITY HOOKS
 * ============================================================================
 */

export function usePharmacySessions() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.sessions,
    queryFn: () => pharmacyApi.getSessions(),
    staleTime: 15 * 1000,
  });
}

export function useRevokePharmacySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => pharmacyApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.sessions });
    },
  });
}

export function useRevokeOtherPharmacySessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pharmacyApi.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.sessions });
    },
  });
}

export function useChangePharmacyPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ChangePharmacyPasswordDto) => pharmacyApi.changePassword(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_QUERY_KEYS.sessions });
    },
  });
}
