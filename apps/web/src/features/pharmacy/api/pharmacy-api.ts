import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  PharmacyProfileDto,
  UpdatePharmacyProfileDto,
  PharmacyDashboardSummaryDto,
  PharmacyInventoryItemDto,
  CreatePharmacyInventoryItemDto,
  PharmacyInventoryFilterDto,
  PharmacyInventoryAlertDto,
  PharmacyPrescriptionQueueItemDto,
  PharmacyOrderDto,
  CreatePharmacyOrderDto,
  MedicineCatalogItemDto,
  CreateMedicineCatalogDto,
  UpdateMedicineCatalogDto,
  MedicineCatalogFilterDto,
  PharmacyStockInDto,
  PharmacyStockAdjustmentDto,
  QuarantineBatchDto,
  ReleaseBatchDto,
  PharmacyInventoryTransactionDto,
  InventoryTransactionFilterDto,
  PharmacyExpiryReportSummaryDto,
  PharmacyAlertsSummaryDto,
  PharmacyInventoryAnalyticsDto,
  PrescriptionVerificationDto,
  MedicineMatchResultDto,
  DispensePrescriptionDto,
  DispensingRecordDto,
  DispensingFilterDto,
  CancelDispensingDto,
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierFilterDto,
  SupplierProductDto,
  CreateSupplierProductDto,
  UpdateSupplierProductDto,
  SupplierProductFilterDto,
  PurchaseRequisitionDto,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto,
  RequisitionFilterDto,
  PurchaseOrderDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  RejectPurchaseOrderDto,
  PurchaseOrderFilterDto,
  GoodsReceiptDto,
  ReceiveGoodsDto,
  GoodsReceiptFilterDto,
  PurchaseInvoiceDto,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  InvoiceFilterDto,
  ReplenishmentSuggestionDto,
  ReplenishmentFilterDto,
  ReplenishmentSettingsDto,
  UpdateReplenishmentSettingsDto,
  ConvertSuggestionsToRequisitionDto,
  ProcurementMetricsDto,
  OrderStatusEventDto,
  CreateOrderFromPrescriptionDto,
  OrderReviewDto,
  OrderClarificationDto,
  OrderFulfillmentUpdateDto,
  MarkReadyForPickupDto,
  VerifyPickupDto,
  CancelOrderDto,
  OrderFilterDto,
  PharmacyOrderMetricsDto,
  UploadPharmacyDocumentDto,
  PharmacyDocumentDto,
  PharmacyOperatingHoursDto,
  UpdateOperatingHoursDto,
  PharmacyServicesDto,
  UpdatePharmacyServicesDto,
  PharmacyStaffDto,
  InvitePharmacyStaffDto,
  UpdatePharmacyStaffDto,
  AcceptStaffInviteDto,
  PharmacyStaffFilterDto,
  PharmacyStaffListResponseDto,
  PharmacySessionDto,
  ChangePharmacyPasswordDto,
} from '@healthbridge/shared-types';

export const pharmacyApi = {
  /**
   * 1. Profile Endpoints
   */
  async getProfile(): Promise<PharmacyProfileDto> {
    const res = await apiClient.get<ApiResponse<PharmacyProfileDto>>(
      API_ENDPOINTS.PHARMACY.PROFILE
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch pharmacy profile');
    }
    return res.data.data;
  },

  async updateProfile(dto: UpdatePharmacyProfileDto): Promise<PharmacyProfileDto> {
    const res = await apiClient.patch<ApiResponse<PharmacyProfileDto>>(
      API_ENDPOINTS.PHARMACY.PROFILE,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update pharmacy profile');
    }
    return res.data.data;
  },

  /**
   * 2. Dashboard Overview Endpoints
   */
  async getDashboardSummary(): Promise<PharmacyDashboardSummaryDto> {
    const res = await apiClient.get<ApiResponse<PharmacyDashboardSummaryDto>>(
      API_ENDPOINTS.PHARMACY.DASHBOARD_SUMMARY
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch pharmacy dashboard summary');
    }
    return res.data.data;
  },

  /**
   * 3. Medicine Catalogue Management Endpoints
   */
  async getMedicines(filter?: MedicineCatalogFilterDto): Promise<{
    items: MedicineCatalogItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: MedicineCatalogItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PHARMACY.MEDICINES, { params: filter });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch medication catalogue');
    }
    return res.data.data;
  },

  async getMedicineById(id: string): Promise<MedicineCatalogItemDto> {
    const res = await apiClient.get<ApiResponse<MedicineCatalogItemDto>>(
      API_ENDPOINTS.PHARMACY.MEDICINE_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch medication details');
    }
    return res.data.data;
  },

  async createMedicine(dto: CreateMedicineCatalogDto): Promise<MedicineCatalogItemDto> {
    const res = await apiClient.post<ApiResponse<MedicineCatalogItemDto>>(
      API_ENDPOINTS.PHARMACY.MEDICINES,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create medication catalogue item');
    }
    return res.data.data;
  },

  async updateMedicine(id: string, dto: UpdateMedicineCatalogDto): Promise<MedicineCatalogItemDto> {
    const res = await apiClient.patch<ApiResponse<MedicineCatalogItemDto>>(
      API_ENDPOINTS.PHARMACY.MEDICINE_DETAIL(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update medication catalogue item');
    }
    return res.data.data;
  },

  /**
   * 4. Inventory & Batch Management Endpoints
   */
  async getInventory(filter?: PharmacyInventoryFilterDto): Promise<{
    items: PharmacyInventoryItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: PharmacyInventoryItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PHARMACY.INVENTORY, { params: filter });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory items');
    }
    return res.data.data;
  },

  async getInventoryById(inventoryId: string): Promise<PharmacyInventoryItemDto> {
    const res = await apiClient.get<ApiResponse<PharmacyInventoryItemDto>>(
      API_ENDPOINTS.PHARMACY.INVENTORY_DETAIL(inventoryId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory batch');
    }
    return res.data.data;
  },

  async createInventoryItem(dto: CreatePharmacyInventoryItemDto): Promise<PharmacyInventoryItemDto> {
    const res = await apiClient.post<ApiResponse<PharmacyInventoryItemDto>>(
      API_ENDPOINTS.PHARMACY.INVENTORY,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create inventory item');
    }
    return res.data.data;
  },

  async receiveStock(dto: PharmacyStockInDto): Promise<PharmacyInventoryItemDto> {
    const res = await apiClient.post<ApiResponse<PharmacyInventoryItemDto>>(
      API_ENDPOINTS.PHARMACY.STOCK_IN,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to record stock intake');
    }
    return res.data.data;
  },

  async adjustStock(dto: PharmacyStockAdjustmentDto): Promise<PharmacyInventoryItemDto> {
    const res = await apiClient.post<ApiResponse<PharmacyInventoryItemDto>>(
      API_ENDPOINTS.PHARMACY.STOCK_ADJUSTMENT,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to adjust stock');
    }
    return res.data.data;
  },

  async quarantineBatch(inventoryId: string, dto: QuarantineBatchDto): Promise<PharmacyInventoryItemDto> {
    const res = await apiClient.post<ApiResponse<PharmacyInventoryItemDto>>(
      API_ENDPOINTS.PHARMACY.QUARANTINE_BATCH(inventoryId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to quarantine batch');
    }
    return res.data.data;
  },

  async releaseBatch(inventoryId: string, dto: ReleaseBatchDto): Promise<PharmacyInventoryItemDto> {
    const res = await apiClient.post<ApiResponse<PharmacyInventoryItemDto>>(
      API_ENDPOINTS.PHARMACY.RELEASE_BATCH(inventoryId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to release batch from quarantine');
    }
    return res.data.data;
  },

  /**
   * 5. Inventory Transaction Ledger (Append-Only)
   */
  async getTransactions(filter?: InventoryTransactionFilterDto): Promise<{
    items: PharmacyInventoryTransactionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: PharmacyInventoryTransactionDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PHARMACY.TRANSACTIONS, { params: filter });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory transactions');
    }
    return res.data.data;
  },

  async getTransactionById(transactionId: string): Promise<PharmacyInventoryTransactionDto> {
    const res = await apiClient.get<ApiResponse<PharmacyInventoryTransactionDto>>(
      API_ENDPOINTS.PHARMACY.TRANSACTION_DETAIL(transactionId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch transaction detail');
    }
    return res.data.data;
  },

  /**
   * 6. Analytics, Alerts & Expiry Monitoring
   */
  async getInventoryAlerts(): Promise<PharmacyInventoryAlertDto[]> {
    const res = await apiClient.get<ApiResponse<PharmacyInventoryAlertDto[]>>(
      API_ENDPOINTS.PHARMACY.INVENTORY_ALERTS
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory alerts');
    }
    return res.data.data;
  },

  async getAlertsSummary(): Promise<PharmacyAlertsSummaryDto> {
    const res = await apiClient.get<ApiResponse<PharmacyAlertsSummaryDto>>(
      API_ENDPOINTS.PHARMACY.ALERTS_SUMMARY
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch alerts summary');
    }
    return res.data.data;
  },

  async getInventoryAnalytics(): Promise<PharmacyInventoryAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<PharmacyInventoryAnalyticsDto>>(
      API_ENDPOINTS.PHARMACY.ANALYTICS
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory analytics');
    }
    return res.data.data;
  },

  async getExpiryReport(params?: {
    horizon?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PharmacyExpiryReportSummaryDto> {
    const res = await apiClient.get<ApiResponse<PharmacyExpiryReportSummaryDto>>(
      API_ENDPOINTS.PHARMACY.EXPIRY_REPORT,
      { params }
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory expiry report');
    }
    return res.data.data;
  },

  /**
   * 7. Prescription Queue Endpoints
   */
  async getPrescriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    items: PharmacyPrescriptionQueueItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: PharmacyPrescriptionQueueItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS, { params });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch prescriptions');
    }
    return res.data.data;
  },

  async getPrescriptionById(prescriptionId: string): Promise<PharmacyPrescriptionQueueItemDto> {
    const res = await apiClient.get<ApiResponse<PharmacyPrescriptionQueueItemDto>>(
      API_ENDPOINTS.PHARMACY.PRESCRIPTION_DETAIL(prescriptionId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch prescription details');
    }
    return res.data.data;
  },

  /**
   * 8. Order Management & Fulfillment Endpoints (Day 5 Task 05)
   */
  async getOrders(params?: OrderFilterDto): Promise<{
    items: PharmacyOrderDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: PharmacyOrderDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PHARMACY.ORDERS, { params });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch orders');
    }
    return res.data.data;
  },

  async getOrderById(orderId: string): Promise<PharmacyOrderDto> {
    const res = await apiClient.get<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_DETAIL(orderId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch order details');
    }
    return res.data.data;
  },

  async createOrder(dto: CreatePharmacyOrderDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDERS,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create order');
    }
    return res.data.data;
  },

  async createOrderFromPrescription(dto: CreateOrderFromPrescriptionDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_FROM_PRESCRIPTION,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create order from prescription');
    }
    return res.data.data;
  },

  async reviewOrder(orderId: string, dto: OrderReviewDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_REVIEW(orderId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to submit order review');
    }
    return res.data.data;
  },

  async requestOrderClarification(orderId: string, dto: OrderClarificationDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_CLARIFICATION(orderId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to request clarification');
    }
    return res.data.data;
  },

  async startProcessingOrder(orderId: string): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_PROCESS(orderId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to start processing order');
    }
    return res.data.data;
  },

  async updateOrderFulfillment(orderId: string, dto: OrderFulfillmentUpdateDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_FULFILLMENT(orderId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update order fulfillment');
    }
    return res.data.data;
  },

  async markReadyForPickup(orderId: string, dto?: MarkReadyForPickupDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_READY_FOR_PICKUP(orderId),
      dto || {}
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to mark ready for pickup');
    }
    return res.data.data;
  },

  async verifyPickup(orderId: string, dto: VerifyPickupDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_VERIFY_PICKUP(orderId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to verify pickup');
    }
    return res.data.data;
  },

  async cancelOrder(orderId: string, dto: CancelOrderDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_CANCEL(orderId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to cancel order');
    }
    return res.data.data;
  },

  async getOrderTimeline(orderId: string): Promise<OrderStatusEventDto[]> {
    const res = await apiClient.get<ApiResponse<OrderStatusEventDto[]>>(
      API_ENDPOINTS.PHARMACY.ORDER_TIMELINE(orderId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch order timeline');
    }
    return res.data.data;
  },

  async getOrderMetrics(): Promise<PharmacyOrderMetricsDto> {
    const res = await apiClient.get<ApiResponse<PharmacyOrderMetricsDto>>(
      API_ENDPOINTS.PHARMACY.ORDER_METRICS
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch order fulfillment metrics');
    }
    return res.data.data;
  },

  /**
   * Patient-Facing Order Endpoints
   */
  async getPatientOrders(params?: OrderFilterDto): Promise<{
    items: PharmacyOrderDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: PharmacyOrderDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PATIENTS.ORDERS, { params });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch patient orders');
    }
    return res.data.data;
  },

  async getPatientOrderById(orderId: string): Promise<PharmacyOrderDto> {
    const res = await apiClient.get<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PATIENTS.ORDER_DETAIL(orderId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch patient order details');
    }
    return res.data.data;
  },

  async getPatientOrderTracking(orderId: string): Promise<OrderStatusEventDto[]> {
    const res = await apiClient.get<ApiResponse<OrderStatusEventDto[]>>(
      API_ENDPOINTS.PATIENTS.ORDER_TRACKING(orderId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch order tracking timeline');
    }
    return res.data.data;
  },

  async cancelPatientOrder(orderId: string, dto: CancelOrderDto): Promise<PharmacyOrderDto> {
    const res = await apiClient.post<ApiResponse<PharmacyOrderDto>>(
      API_ENDPOINTS.PATIENTS.CANCEL_ORDER(orderId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to cancel patient order');
    }
    return res.data.data;
  },

  /**
   * 8. Prescription Verification, Matching & Dispensing Workflow (Day 5 Task 03)
   */
  async verifyPrescription(prescriptionId: string): Promise<PrescriptionVerificationDto> {
    const res = await apiClient.get<ApiResponse<PrescriptionVerificationDto>>(
      API_ENDPOINTS.PHARMACY.VERIFY_PRESCRIPTION(prescriptionId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to verify prescription');
    }
    return res.data.data;
  },

  async matchPrescriptionInventory(
    prescriptionId: string
  ): Promise<MedicineMatchResultDto[]> {
    const res = await apiClient.get<ApiResponse<MedicineMatchResultDto[]>>(
      API_ENDPOINTS.PHARMACY.MATCH_PRESCRIPTION_INVENTORY(prescriptionId)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to match prescription inventory');
    }
    return res.data.data;
  },

  async dispensePrescription(dto: DispensePrescriptionDto): Promise<DispensingRecordDto> {
    const res = await apiClient.post<ApiResponse<DispensingRecordDto>>(
      API_ENDPOINTS.PHARMACY.DISPENSING,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to dispense prescription');
    }
    return res.data.data;
  },

  async getDispensingRecords(params?: DispensingFilterDto): Promise<{
    items: DispensingRecordDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        items: DispensingRecordDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.PHARMACY.DISPENSING, { params });
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch dispensing records');
    }
    return res.data.data;
  },

  async getDispensingRecordById(id: string): Promise<DispensingRecordDto> {
    const res = await apiClient.get<ApiResponse<DispensingRecordDto>>(
      API_ENDPOINTS.PHARMACY.DISPENSING_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch dispensing record');
    }
    return res.data.data;
  },

  async getDispensingReceipt(id: string): Promise<{
    receiptNumber: string;
    dispensingRecord: DispensingRecordDto;
    disclaimer: string;
    generatedAt: string;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        receiptNumber: string;
        dispensingRecord: DispensingRecordDto;
        disclaimer: string;
        generatedAt: string;
      }>
    >(API_ENDPOINTS.PHARMACY.DISPENSING_RECEIPT(id));
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch dispensing receipt');
    }
    return res.data.data;
  },

  async cancelDispensingRecord(
    id: string,
    dto: CancelDispensingDto
  ): Promise<DispensingRecordDto> {
    const res = await apiClient.post<ApiResponse<DispensingRecordDto>>(
      API_ENDPOINTS.PHARMACY.CANCEL_DISPENSING(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to cancel dispensing record');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * DAY 5 TASK 04: SUPPLIER MANAGEMENT ENDPOINTS
   * ============================================================================
   */

  async getSuppliers(params?: SupplierFilterDto): Promise<{
    data: SupplierDto[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<SupplierDto[]>>(
      API_ENDPOINTS.PHARMACY.SUPPLIERS,
      { params }
    );
    return {
      data: res.data.data || [],
      meta: (res.data as any).meta,
    };
  },

  async createSupplier(dto: CreateSupplierDto): Promise<SupplierDto> {
    const res = await apiClient.post<ApiResponse<SupplierDto>>(
      API_ENDPOINTS.PHARMACY.SUPPLIERS,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create supplier');
    }
    return res.data.data;
  },

  async getSupplierById(id: string): Promise<SupplierDto> {
    const res = await apiClient.get<ApiResponse<SupplierDto>>(
      API_ENDPOINTS.PHARMACY.SUPPLIER_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch supplier');
    }
    return res.data.data;
  },

  async updateSupplier(id: string, dto: UpdateSupplierDto): Promise<SupplierDto> {
    const res = await apiClient.patch<ApiResponse<SupplierDto>>(
      API_ENDPOINTS.PHARMACY.SUPPLIER_DETAIL(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update supplier');
    }
    return res.data.data;
  },

  async getSupplierPurchaseHistory(id: string): Promise<PurchaseOrderDto[]> {
    const res = await apiClient.get<ApiResponse<PurchaseOrderDto[]>>(
      API_ENDPOINTS.PHARMACY.SUPPLIER_HISTORY(id)
    );
    return res.data.data || [];
  },

  async getSupplierProducts(params?: SupplierProductFilterDto): Promise<{
    data: SupplierProductDto[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<SupplierProductDto[]>>(
      API_ENDPOINTS.PHARMACY.SUPPLIER_PRODUCTS,
      { params }
    );
    return {
      data: res.data.data || [],
      meta: (res.data as any).meta,
    };
  },

  async addSupplierProduct(dto: CreateSupplierProductDto): Promise<SupplierProductDto> {
    const res = await apiClient.post<ApiResponse<SupplierProductDto>>(
      API_ENDPOINTS.PHARMACY.SUPPLIER_PRODUCTS,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to add supplier product');
    }
    return res.data.data;
  },

  async updateSupplierProduct(
    productId: string,
    dto: UpdateSupplierProductDto
  ): Promise<SupplierProductDto> {
    const res = await apiClient.patch<ApiResponse<SupplierProductDto>>(
      API_ENDPOINTS.PHARMACY.SUPPLIER_PRODUCT_DETAIL(productId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update supplier product');
    }
    return res.data.data;
  },

  async deleteSupplierProduct(productId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PHARMACY.SUPPLIER_PRODUCT_DETAIL(productId));
  },

  /**
   * ============================================================================
   * PURCHASE REQUISITIONS
   * ============================================================================
   */

  async getRequisitions(params?: RequisitionFilterDto): Promise<{
    data: PurchaseRequisitionDto[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<PurchaseRequisitionDto[]>>(
      API_ENDPOINTS.PHARMACY.REQUISITIONS,
      { params }
    );
    return {
      data: res.data.data || [],
      meta: (res.data as any).meta,
    };
  },

  async createRequisition(dto: CreatePurchaseRequisitionDto): Promise<PurchaseRequisitionDto> {
    const res = await apiClient.post<ApiResponse<PurchaseRequisitionDto>>(
      API_ENDPOINTS.PHARMACY.REQUISITIONS,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create requisition');
    }
    return res.data.data;
  },

  async getRequisitionById(id: string): Promise<PurchaseRequisitionDto> {
    const res = await apiClient.get<ApiResponse<PurchaseRequisitionDto>>(
      API_ENDPOINTS.PHARMACY.REQUISITION_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch requisition');
    }
    return res.data.data;
  },

  async updateRequisition(
    id: string,
    dto: UpdatePurchaseRequisitionDto
  ): Promise<PurchaseRequisitionDto> {
    const res = await apiClient.patch<ApiResponse<PurchaseRequisitionDto>>(
      API_ENDPOINTS.PHARMACY.REQUISITION_DETAIL(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update requisition');
    }
    return res.data.data;
  },

  async approveRequisition(id: string, approvalNotes?: string): Promise<PurchaseRequisitionDto> {
    const res = await apiClient.post<ApiResponse<PurchaseRequisitionDto>>(
      API_ENDPOINTS.PHARMACY.APPROVE_REQUISITION(id),
      { approvalNotes }
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to approve requisition');
    }
    return res.data.data;
  },

  async convertRequisitionToPO(id: string, supplierId: string): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.CONVERT_REQUISITION_TO_PO(id),
      { supplierId }
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to convert requisition to purchase order');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * PURCHASE ORDERS
   * ============================================================================
   */

  async getPurchaseOrders(params?: PurchaseOrderFilterDto): Promise<{
    data: PurchaseOrderDto[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<PurchaseOrderDto[]>>(
      API_ENDPOINTS.PHARMACY.PURCHASES,
      { params }
    );
    return {
      data: res.data.data || [],
      meta: (res.data as any).meta,
    };
  },

  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.PURCHASES,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to create purchase order');
    }
    return res.data.data;
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderDto> {
    const res = await apiClient.get<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.PURCHASE_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch purchase order');
    }
    return res.data.data;
  },

  async updatePurchaseOrder(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    const res = await apiClient.patch<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.PURCHASE_DETAIL(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update purchase order');
    }
    return res.data.data;
  },

  async submitPOForApproval(id: string): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.SUBMIT_PURCHASE(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to submit purchase order');
    }
    return res.data.data;
  },

  async approvePurchaseOrder(id: string, dto?: ApprovePurchaseOrderDto): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.APPROVE_PURCHASE(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to approve purchase order');
    }
    return res.data.data;
  },

  async rejectPurchaseOrder(id: string, dto: RejectPurchaseOrderDto): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.REJECT_PURCHASE(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to reject purchase order');
    }
    return res.data.data;
  },

  async sendPurchaseOrderToSupplier(id: string): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.SEND_PURCHASE(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to dispatch purchase order');
    }
    return res.data.data;
  },

  async cancelPurchaseOrder(id: string, reason: string): Promise<PurchaseOrderDto> {
    const res = await apiClient.post<ApiResponse<PurchaseOrderDto>>(
      API_ENDPOINTS.PHARMACY.CANCEL_PURCHASE(id),
      { reason }
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to cancel purchase order');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * GOODS RECEIVING (GRN)
   * ============================================================================
   */

  async receiveGoods(poId: string, dto: ReceiveGoodsDto): Promise<GoodsReceiptDto> {
    const res = await apiClient.post<ApiResponse<GoodsReceiptDto>>(
      API_ENDPOINTS.PHARMACY.RECEIVE_GOODS(poId),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to receive goods');
    }
    return res.data.data;
  },

  async getGoodsReceipts(params?: GoodsReceiptFilterDto): Promise<{
    data: GoodsReceiptDto[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<GoodsReceiptDto[]>>(
      API_ENDPOINTS.PHARMACY.GOODS_RECEIPTS,
      { params }
    );
    return {
      data: res.data.data || [],
      meta: (res.data as any).meta,
    };
  },

  async getGoodsReceiptById(id: string): Promise<GoodsReceiptDto> {
    const res = await apiClient.get<ApiResponse<GoodsReceiptDto>>(
      API_ENDPOINTS.PHARMACY.GOODS_RECEIPT_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch goods receipt note');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * PURCHASE INVOICES
   * ============================================================================
   */

  async getPurchaseInvoices(params?: InvoiceFilterDto): Promise<{
    data: PurchaseInvoiceDto[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<PurchaseInvoiceDto[]>>(
      API_ENDPOINTS.PHARMACY.INVOICES,
      { params }
    );
    return {
      data: res.data.data || [],
      meta: (res.data as any).meta,
    };
  },

  async createPurchaseInvoice(dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoiceDto> {
    const res = await apiClient.post<ApiResponse<PurchaseInvoiceDto>>(
      API_ENDPOINTS.PHARMACY.INVOICES,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to record purchase invoice');
    }
    return res.data.data;
  },

  async getPurchaseInvoiceById(id: string): Promise<PurchaseInvoiceDto> {
    const res = await apiClient.get<ApiResponse<PurchaseInvoiceDto>>(
      API_ENDPOINTS.PHARMACY.INVOICE_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch purchase invoice');
    }
    return res.data.data;
  },

  async updatePurchaseInvoice(
    id: string,
    dto: UpdatePurchaseInvoiceDto
  ): Promise<PurchaseInvoiceDto> {
    const res = await apiClient.patch<ApiResponse<PurchaseInvoiceDto>>(
      API_ENDPOINTS.PHARMACY.INVOICE_DETAIL(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update purchase invoice');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * STOCK REPLENISHMENT & SETTINGS
   * ============================================================================
   */

  async getReplenishmentSuggestions(
    params?: ReplenishmentFilterDto
  ): Promise<ReplenishmentSuggestionDto[]> {
    const res = await apiClient.get<ApiResponse<ReplenishmentSuggestionDto[]>>(
      API_ENDPOINTS.PHARMACY.REPLENISHMENT_SUGGESTIONS,
      { params }
    );
    return res.data.data || [];
  },

  async convertSuggestionsToRequisition(
    dto: ConvertSuggestionsToRequisitionDto
  ): Promise<PurchaseRequisitionDto> {
    const res = await apiClient.post<ApiResponse<PurchaseRequisitionDto>>(
      API_ENDPOINTS.PHARMACY.CONVERT_SUGGESTIONS_TO_REQUISITION,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to convert suggestions to requisition');
    }
    return res.data.data;
  },

  async getReplenishmentSettings(): Promise<ReplenishmentSettingsDto> {
    const res = await apiClient.get<ApiResponse<ReplenishmentSettingsDto>>(
      API_ENDPOINTS.PHARMACY.REPLENISHMENT_SETTINGS
    );
    return (
      res.data.data || {
        defaultReorderMultiplier: 2,
        defaultSafetyStockDays: 7,
        autoGenerateRequisitions: false,
        notifyOnThreshold: true,
      }
    );
  },

  async updateReplenishmentSettings(
    dto: UpdateReplenishmentSettingsDto
  ): Promise<ReplenishmentSettingsDto> {
    const res = await apiClient.patch<ApiResponse<ReplenishmentSettingsDto>>(
      API_ENDPOINTS.PHARMACY.REPLENISHMENT_SETTINGS,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update replenishment settings');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * PROCUREMENT METRICS
   * ============================================================================
   */

  async getProcurementMetrics(): Promise<ProcurementMetricsDto> {
    const res = await apiClient.get<ApiResponse<ProcurementMetricsDto>>(
      API_ENDPOINTS.PHARMACY.PROCUREMENT_METRICS
    );
    return (
      res.data.data || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        pendingSuppliers: 0,
        openPurchaseOrders: 0,
        pendingApprovalOrders: 0,
        partiallyReceivedOrders: 0,
        monthlySpendTotal: 0,
        pendingInvoicesCount: 0,
        pendingInvoicesAmount: 0,
        replenishmentSuggestionsCount: 0,
      }
    );
  },

  /**
   * ============================================================================
   * DAY 5 TASK 07: PROFILE DOCUMENTS
   * ============================================================================
   */

  async uploadDocument(dto: UploadPharmacyDocumentDto): Promise<PharmacyDocumentDto> {
    const res = await apiClient.post<ApiResponse<PharmacyDocumentDto>>(
      API_ENDPOINTS.PHARMACY.UPLOAD_DOCUMENT,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to upload document');
    }
    return res.data.data;
  },

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.PHARMACY.DELETE_DOCUMENT(documentId)
    );
    return res.data.data || { message: 'Document removed successfully' };
  },

  /**
   * ============================================================================
   * DAY 5 TASK 07: OPERATING HOURS & TIMEZONE
   * ============================================================================
   */

  async getOperatingHours(): Promise<PharmacyOperatingHoursDto> {
    const res = await apiClient.get<ApiResponse<PharmacyOperatingHoursDto>>(
      API_ENDPOINTS.PHARMACY.OPERATING_HOURS
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch operating hours');
    }
    return res.data.data;
  },

  async updateOperatingHours(
    dto: UpdateOperatingHoursDto
  ): Promise<PharmacyOperatingHoursDto> {
    const res = await apiClient.put<ApiResponse<PharmacyOperatingHoursDto>>(
      API_ENDPOINTS.PHARMACY.OPERATING_HOURS,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update operating hours');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * DAY 5 TASK 07: PHARMACY SERVICES
   * ============================================================================
   */

  async getServices(): Promise<PharmacyServicesDto> {
    const res = await apiClient.get<ApiResponse<PharmacyServicesDto>>(
      API_ENDPOINTS.PHARMACY.SERVICES
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch pharmacy services');
    }
    return res.data.data;
  },

  async updateServices(
    dto: UpdatePharmacyServicesDto
  ): Promise<PharmacyServicesDto> {
    const res = await apiClient.put<ApiResponse<PharmacyServicesDto>>(
      API_ENDPOINTS.PHARMACY.SERVICES,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update pharmacy services');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * DAY 5 TASK 07: PHARMACY STAFF MANAGEMENT
   * ============================================================================
   */

  async getStaffList(
    params?: PharmacyStaffFilterDto
  ): Promise<PharmacyStaffListResponseDto> {
    const res = await apiClient.get<ApiResponse<PharmacyStaffListResponseDto>>(
      API_ENDPOINTS.PHARMACY.STAFF,
      { params }
    );
    return (
      res.data.data || {
        staff: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }
    );
  },

  async inviteStaff(dto: InvitePharmacyStaffDto): Promise<PharmacyStaffDto> {
    const res = await apiClient.post<ApiResponse<PharmacyStaffDto>>(
      API_ENDPOINTS.PHARMACY.STAFF_INVITE,
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to invite staff member');
    }
    return res.data.data;
  },

  async getStaffMember(id: string): Promise<PharmacyStaffDto> {
    const res = await apiClient.get<ApiResponse<PharmacyStaffDto>>(
      API_ENDPOINTS.PHARMACY.STAFF_DETAIL(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch staff details');
    }
    return res.data.data;
  },

  async updateStaffMember(
    id: string,
    dto: UpdatePharmacyStaffDto
  ): Promise<PharmacyStaffDto> {
    const res = await apiClient.patch<ApiResponse<PharmacyStaffDto>>(
      API_ENDPOINTS.PHARMACY.STAFF_DETAIL(id),
      dto
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to update staff member');
    }
    return res.data.data;
  },

  async suspendStaff(id: string, reason?: string): Promise<PharmacyStaffDto> {
    const res = await apiClient.post<ApiResponse<PharmacyStaffDto>>(
      API_ENDPOINTS.PHARMACY.STAFF_SUSPEND(id),
      { reason }
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to suspend staff member');
    }
    return res.data.data;
  },

  async reactivateStaff(id: string): Promise<PharmacyStaffDto> {
    const res = await apiClient.post<ApiResponse<PharmacyStaffDto>>(
      API_ENDPOINTS.PHARMACY.STAFF_REACTIVATE(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to reactivate staff member');
    }
    return res.data.data;
  },

  async revokeStaff(id: string): Promise<PharmacyStaffDto> {
    const res = await apiClient.post<ApiResponse<PharmacyStaffDto>>(
      API_ENDPOINTS.PHARMACY.STAFF_REVOKE(id)
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to revoke staff access');
    }
    return res.data.data;
  },

  async acceptStaffInvite(
    dto: AcceptStaffInviteDto
  ): Promise<{ message: string; staffId: string }> {
    const res = await apiClient.post<
      ApiResponse<{ message: string; staffId: string }>
    >(API_ENDPOINTS.PHARMACY.STAFF_ACCEPT_INVITE, dto);
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to accept staff invite');
    }
    return res.data.data;
  },

  /**
   * ============================================================================
   * DAY 5 TASK 07: SESSIONS & ACCOUNT SECURITY
   * ============================================================================
   */

  async getSessions(): Promise<PharmacySessionDto[]> {
    const res = await apiClient.get<ApiResponse<PharmacySessionDto[]>>(
      API_ENDPOINTS.PHARMACY.SESSIONS
    );
    return res.data.data || [];
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.PHARMACY.SESSION_DETAIL(sessionId)
    );
    return res.data.data || { message: 'Session revoked successfully' };
  },

  async revokeOtherSessions(): Promise<{ revokedCount: number }> {
    const res = await apiClient.post<ApiResponse<{ revokedCount: number }>>(
      API_ENDPOINTS.PHARMACY.REVOKE_OTHER_SESSIONS
    );
    return res.data.data || { revokedCount: 0 };
  },

  async changePassword(
    dto: ChangePharmacyPasswordDto
  ): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.PHARMACY.CHANGE_PASSWORD,
      dto
    );
    return res.data.data || { message: 'Password changed successfully' };
  },
};
