/**
 * HealthBridge India — Laboratory TanStack Query Hooks
 * React Query hooks for Laboratory Portal state management & mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { laboratoryApi } from '../api/laboratory-api';
import type {
  UpdateLaboratoryProfileDto,
  UploadLaboratoryDocumentDto,
  CreateLabTestDto,
  UpdateLabTestDto,
  LabTestFilterDto,
  AcceptLabOrderDto,
  RejectLabOrderDto,
  ClarificationLabOrderDto,
  AssignTestDto,
  LaboratoryOrderFilterDto,
  RegisterSampleCollectionDto,
  SampleAccessioningDto,
  SampleRejectionDto,
  LabSampleFilterDto,
  CollectionCenterDto,
} from '@healthbridge/shared-types';

export const LAB_QUERY_KEYS = {
  DASHBOARD_SUMMARY: ['laboratory', 'dashboard', 'summary'] as const,
  DASHBOARD_ACTIVITY: ['laboratory', 'dashboard', 'activity'] as const,
  PROFILE: ['laboratory', 'profile'] as const,
  VERIFICATION_STATUS: ['laboratory', 'verification-status'] as const,
  TESTS: (filter?: LabTestFilterDto) => ['laboratory', 'tests', filter] as const,
  TEST_DETAIL: (id: string) => ['laboratory', 'tests', 'detail', id] as const,
  ORDERS: (filter?: LaboratoryOrderFilterDto) => ['laboratory', 'orders', filter] as const,
  ORDER_DETAIL: (id: string) => ['laboratory', 'orders', 'detail', id] as const,
  ORDER_SPECIMEN_REQUIREMENTS: (id: string) =>
    ['laboratory', 'orders', 'specimens', id] as const,
  SAMPLES: (filter?: LabSampleFilterDto) => ['laboratory', 'samples', filter] as const,
  SAMPLE_SUMMARY: ['laboratory', 'samples', 'summary'] as const,
  SAMPLE_DETAIL: (id: string) => ['laboratory', 'samples', 'detail', id] as const,
  SAMPLE_LABEL: (id: string) => ['laboratory', 'samples', 'label', id] as const,
  SAMPLE_TIMELINE: (id: string) => ['laboratory', 'samples', 'timeline', id] as const,
  COLLECTION_CENTERS: ['laboratory', 'collection-centers'] as const,
};

// 1. Dashboard
export function useLaboratoryDashboardSummary() {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY,
    queryFn: () => laboratoryApi.getDashboardSummary(),
  });
}

export function useLaboratoryActivity() {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.DASHBOARD_ACTIVITY,
    queryFn: () => laboratoryApi.getRecentActivity(),
  });
}

// 2. Profile & Licensing
export function useLaboratoryProfile() {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.PROFILE,
    queryFn: () => laboratoryApi.getProfile(),
  });
}

export function useUpdateLaboratoryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateLaboratoryProfileDto) => laboratoryApi.updateProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.PROFILE });
    },
  });
}

export function useLaboratoryVerificationStatus() {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.VERIFICATION_STATUS,
    queryFn: () => laboratoryApi.getVerificationStatus(),
  });
}

export function useUploadLaboratoryDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UploadLaboratoryDocumentDto) => laboratoryApi.uploadDocument(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.VERIFICATION_STATUS });
    },
  });
}

export function useDeleteLaboratoryDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => laboratoryApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.VERIFICATION_STATUS });
    },
  });
}

// 3. Diagnostic Test Catalogue
export function useLabTests(filter?: LabTestFilterDto) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.TESTS(filter),
    queryFn: () => laboratoryApi.listTests(filter),
  });
}

export function useLabTestDetail(testId: string) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.TEST_DETAIL(testId),
    queryFn: () => laboratoryApi.getTestById(testId),
    enabled: Boolean(testId),
  });
}

export function useCreateLabTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLabTestDto) => laboratoryApi.createTest(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'tests'] });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY });
    },
  });
}

export function useUpdateLabTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, dto }: { testId: string; dto: UpdateLabTestDto }) =>
      laboratoryApi.updateTest(testId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'tests'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.TEST_DETAIL(variables.testId),
      });
    },
  });
}

export function useToggleLabTestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, isActive }: { testId: string; isActive?: boolean }) =>
      laboratoryApi.toggleTestStatus(testId, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'tests'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.TEST_DETAIL(variables.testId),
      });
    },
  });
}

export function useDeleteLabTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => laboratoryApi.deleteTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'tests'] });
    },
  });
}

// 4. Orders
export function useLaboratoryOrders(filter?: LaboratoryOrderFilterDto) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.ORDERS(filter),
    queryFn: () => laboratoryApi.listOrders(filter),
  });
}

export function useLaboratoryOrderDetail(orderId: string) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.ORDER_DETAIL(orderId),
    queryFn: () => laboratoryApi.getOrderById(orderId),
    enabled: Boolean(orderId),
  });
}

export function useAcceptLabOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto?: AcceptLabOrderDto }) =>
      laboratoryApi.acceptOrder(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.ORDER_DETAIL(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY });
    },
  });
}

export function useRejectLabOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: RejectLabOrderDto }) =>
      laboratoryApi.rejectOrder(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.ORDER_DETAIL(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY });
    },
  });
}

export function useClarificationLabOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: ClarificationLabOrderDto }) =>
      laboratoryApi.requestClarification(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.ORDER_DETAIL(variables.orderId),
      });
    },
  });
}

export function useAssignTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: AssignTestDto }) =>
      laboratoryApi.assignTests(orderId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.ORDER_DETAIL(variables.orderId),
      });
    },
  });
}

export function useSpecimenRequirements(orderId: string) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.ORDER_SPECIMEN_REQUIREMENTS(orderId),
    queryFn: () => laboratoryApi.resolveSpecimenRequirements(orderId),
    enabled: Boolean(orderId),
  });
}

// 5. Samples & Accessioning
export function useLabSamples(filter?: LabSampleFilterDto) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.SAMPLES(filter),
    queryFn: () => laboratoryApi.listSamples(filter),
  });
}

export function useLabSampleSummary() {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.SAMPLE_SUMMARY,
    queryFn: () => laboratoryApi.getSampleSummary(),
  });
}

export function useLabSampleDetail(sampleId: string) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.SAMPLE_DETAIL(sampleId),
    queryFn: () => laboratoryApi.getSampleById(sampleId),
    enabled: Boolean(sampleId),
  });
}

export function useRegisterSampleCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterSampleCollectionDto) =>
      laboratoryApi.registerSampleCollection(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'samples'] });
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'orders'] });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY });
    },
  });
}

export function useAccessionSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SampleAccessioningDto) => laboratoryApi.accessionSample(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'samples'] });
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'orders'] });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY });
    },
  });
}

export function useRejectSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sampleId, dto }: { sampleId: string; dto: SampleRejectionDto }) =>
      laboratoryApi.rejectSample(sampleId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laboratory', 'samples'] });
      queryClient.invalidateQueries({
        queryKey: LAB_QUERY_KEYS.SAMPLE_DETAIL(variables.sampleId),
      });
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.DASHBOARD_SUMMARY });
    },
  });
}

export function usePrintableSampleLabel(sampleId: string) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.SAMPLE_LABEL(sampleId),
    queryFn: () => laboratoryApi.getPrintableLabelData(sampleId),
    enabled: Boolean(sampleId),
  });
}

export function useSampleTimeline(sampleId: string) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.SAMPLE_TIMELINE(sampleId),
    queryFn: () => laboratoryApi.getSampleTimeline(sampleId),
    enabled: Boolean(sampleId),
  });
}

// 6. Collection Centers
export function useCollectionCenters() {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.COLLECTION_CENTERS,
    queryFn: () => laboratoryApi.listCollectionCenters(),
  });
}

export function useCreateCollectionCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CollectionCenterDto>) =>
      laboratoryApi.createCollectionCenter(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.COLLECTION_CENTERS });
    },
  });
}

export function useUpdateCollectionCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      centerId,
      dto,
    }: {
      centerId: string;
      dto: Partial<CollectionCenterDto>;
    }) => laboratoryApi.updateCollectionCenter(centerId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAB_QUERY_KEYS.COLLECTION_CENTERS });
    },
  });
}
