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
   * 8. Order Management Endpoints
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
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
};
