import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '../api/pharmacy-api';
import type {
  UpdatePharmacyProfileDto,
  PharmacyInventoryFilterDto,
  CreatePharmacyInventoryItemDto,
  CreatePharmacyOrderDto,
} from '@healthbridge/shared-types';

export const PHARMACY_QUERY_KEYS = {
  profile: ['pharmacy', 'profile'] as const,
  dashboardSummary: ['pharmacy', 'dashboard-summary'] as const,
  inventory: (filter?: PharmacyInventoryFilterDto) => ['pharmacy', 'inventory', filter] as const,
  inventoryDetail: (id: string) => ['pharmacy', 'inventory-detail', id] as const,
  inventoryAlerts: ['pharmacy', 'inventory-alerts'] as const,
  prescriptions: (params?: Record<string, unknown>) => ['pharmacy', 'prescriptions', params] as const,
  prescriptionDetail: (id: string) => ['pharmacy', 'prescription-detail', id] as const,
  orders: (params?: Record<string, unknown>) => ['pharmacy', 'orders', params] as const,
  orderDetail: (id: string) => ['pharmacy', 'order-detail', id] as const,
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
 * 3. Inventory Management Hooks
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
    },
  });
}

export function usePharmacyInventoryAlerts() {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.inventoryAlerts,
    queryFn: () => pharmacyApi.getInventoryAlerts(),
    staleTime: 60 * 1000,
  });
}

/**
 * 4. Prescription Queue Hooks
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
 * 5. Orders Hooks
 */
export function usePharmacyOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: PHARMACY_QUERY_KEYS.orders(params),
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

