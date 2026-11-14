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
   * 3. Inventory Endpoints
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

  async getInventoryAlerts(): Promise<PharmacyInventoryAlertDto[]> {
    const res = await apiClient.get<ApiResponse<PharmacyInventoryAlertDto[]>>(
      API_ENDPOINTS.PHARMACY.INVENTORY_ALERTS
    );
    if (!res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch inventory alerts');
    }
    return res.data.data;
  },

  /**
   * 4. Prescription Queue Endpoints
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
   * 5. Order Management Endpoints
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
};
