/**
 * HealthBridge India — Laboratory API Client
 * Frontend HTTP client covering all Laboratory Portal endpoints
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  LaboratoryProfileDto,
  UpdateLaboratoryProfileDto,
  UploadLaboratoryDocumentDto,
  LaboratoryDocumentDto,
  LaboratoryDashboardSummaryDto,
  LaboratoryActivityDto,
  LabTestDto,
  CreateLabTestDto,
  UpdateLabTestDto,
  LabTestFilterDto,
  LaboratoryOrderDto,
  AcceptLabOrderDto,
  RejectLabOrderDto,
  ClarificationLabOrderDto,
  AssignTestDto,
  LaboratoryOrderFilterDto,
  LabSampleDto,
  RegisterSampleCollectionDto,
  SampleAccessioningDto,
  SampleRejectionDto,
  LabSampleFilterDto,
  LabSampleSummaryDto,
  PrintableSampleLabelDto,
  SampleTimelineEventDto,
  CollectionCenterDto,
} from '@healthbridge/shared-types';

export const laboratoryApi = {
  // 1. Dashboard
  getDashboardSummary: async (): Promise<LaboratoryDashboardSummaryDto> => {
    const res = await apiClient.get<ApiResponse<LaboratoryDashboardSummaryDto>>(
      API_ENDPOINTS.LABORATORY.DASHBOARD_SUMMARY
    );
    return res.data.data!;
  },

  getRecentActivity: async (): Promise<LaboratoryActivityDto[]> => {
    const res = await apiClient.get<ApiResponse<LaboratoryActivityDto[]>>(
      API_ENDPOINTS.LABORATORY.DASHBOARD_ACTIVITY
    );
    return res.data.data || [];
  },

  // 2. Profile & Licensing
  getProfile: async (): Promise<LaboratoryProfileDto> => {
    const res = await apiClient.get<ApiResponse<LaboratoryProfileDto>>(
      API_ENDPOINTS.LABORATORY.PROFILE
    );
    return res.data.data!;
  },

  updateProfile: async (
    dto: UpdateLaboratoryProfileDto
  ): Promise<LaboratoryProfileDto> => {
    const res = await apiClient.patch<ApiResponse<LaboratoryProfileDto>>(
      API_ENDPOINTS.LABORATORY.PROFILE,
      dto
    );
    return res.data.data!;
  },

  getVerificationStatus: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(
      API_ENDPOINTS.LABORATORY.VERIFICATION_STATUS
    );
    return res.data.data;
  },

  uploadDocument: async (
    dto: UploadLaboratoryDocumentDto
  ): Promise<LaboratoryDocumentDto> => {
    const res = await apiClient.post<ApiResponse<LaboratoryDocumentDto>>(
      API_ENDPOINTS.LABORATORY.DOCUMENTS,
      dto
    );
    return res.data.data!;
  },

  deleteDocument: async (documentId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.LABORATORY.DELETE_DOCUMENT(documentId)
    );
    return res.data.data!;
  },

  // 3. Diagnostic Test Catalogue
  listTests: async (
    filter?: LabTestFilterDto
  ): Promise<LabTestDto[]> => {
    const res = await apiClient.get<ApiResponse<LabTestDto[]>>(
      API_ENDPOINTS.LABORATORY.TESTS,
      { params: filter }
    );
    return res.data.data || [];
  },

  createTest: async (dto: CreateLabTestDto): Promise<LabTestDto> => {
    const res = await apiClient.post<ApiResponse<LabTestDto>>(
      API_ENDPOINTS.LABORATORY.TESTS,
      dto
    );
    return res.data.data!;
  },

  getTestById: async (testId: string): Promise<LabTestDto> => {
    const res = await apiClient.get<ApiResponse<LabTestDto>>(
      API_ENDPOINTS.LABORATORY.TEST_DETAIL(testId)
    );
    return res.data.data!;
  },

  updateTest: async (
    testId: string,
    dto: UpdateLabTestDto
  ): Promise<LabTestDto> => {
    const res = await apiClient.patch<ApiResponse<LabTestDto>>(
      API_ENDPOINTS.LABORATORY.TEST_DETAIL(testId),
      dto
    );
    return res.data.data!;
  },

  toggleTestStatus: async (
    testId: string,
    isActive?: boolean
  ): Promise<LabTestDto> => {
    const res = await apiClient.patch<ApiResponse<LabTestDto>>(
      API_ENDPOINTS.LABORATORY.TEST_STATUS(testId),
      { isActive }
    );
    return res.data.data!;
  },

  deleteTest: async (testId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.LABORATORY.TEST_DETAIL(testId)
    );
    return res.data.data!;
  },

  // 4. Orders
  listOrders: async (
    filter?: LaboratoryOrderFilterDto
  ): Promise<LaboratoryOrderDto[]> => {
    const res = await apiClient.get<ApiResponse<LaboratoryOrderDto[]>>(
      API_ENDPOINTS.LABORATORY.ORDERS,
      { params: filter }
    );
    return res.data.data || [];
  },

  getOrderById: async (orderId: string): Promise<LaboratoryOrderDto> => {
    const res = await apiClient.get<ApiResponse<LaboratoryOrderDto>>(
      API_ENDPOINTS.LABORATORY.ORDER_DETAIL(orderId)
    );
    return res.data.data!;
  },

  acceptOrder: async (
    orderId: string,
    dto?: AcceptLabOrderDto
  ): Promise<LaboratoryOrderDto> => {
    const res = await apiClient.post<ApiResponse<LaboratoryOrderDto>>(
      API_ENDPOINTS.LABORATORY.ORDER_ACCEPT(orderId),
      dto
    );
    return res.data.data!;
  },

  rejectOrder: async (
    orderId: string,
    dto: RejectLabOrderDto
  ): Promise<LaboratoryOrderDto> => {
    const res = await apiClient.post<ApiResponse<LaboratoryOrderDto>>(
      API_ENDPOINTS.LABORATORY.ORDER_REJECT(orderId),
      dto
    );
    return res.data.data!;
  },

  requestClarification: async (
    orderId: string,
    dto: ClarificationLabOrderDto
  ): Promise<LaboratoryOrderDto> => {
    const res = await apiClient.post<ApiResponse<LaboratoryOrderDto>>(
      API_ENDPOINTS.LABORATORY.ORDER_CLARIFICATION(orderId),
      dto
    );
    return res.data.data!;
  },

  assignTests: async (
    orderId: string,
    dto: AssignTestDto
  ): Promise<LaboratoryOrderDto> => {
    const res = await apiClient.post<ApiResponse<LaboratoryOrderDto>>(
      API_ENDPOINTS.LABORATORY.ORDER_ASSIGN_TESTS(orderId),
      dto
    );
    return res.data.data!;
  },

  resolveSpecimenRequirements: async (orderId: string): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>(
      API_ENDPOINTS.LABORATORY.ORDER_SPECIMEN_REQUIREMENTS(orderId)
    );
    return res.data.data || [];
  },

  // 5. Samples & Accessioning
  listSamples: async (
    filter?: LabSampleFilterDto
  ): Promise<LabSampleDto[]> => {
    const res = await apiClient.get<ApiResponse<LabSampleDto[]>>(
      API_ENDPOINTS.LABORATORY.SAMPLES,
      { params: filter }
    );
    return res.data.data || [];
  },

  registerSampleCollection: async (
    dto: RegisterSampleCollectionDto
  ): Promise<LabSampleDto> => {
    const res = await apiClient.post<ApiResponse<LabSampleDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_COLLECT,
      dto
    );
    return res.data.data!;
  },

  getSampleSummary: async (): Promise<LabSampleSummaryDto> => {
    const res = await apiClient.get<ApiResponse<LabSampleSummaryDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_SUMMARY
    );
    return res.data.data!;
  },

  resolveBarcode: async (barcode: string): Promise<LabSampleDto> => {
    const res = await apiClient.get<ApiResponse<LabSampleDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_BARCODE(barcode)
    );
    return res.data.data!;
  },

  accessionSample: async (
    dto: SampleAccessioningDto
  ): Promise<LabSampleDto> => {
    const res = await apiClient.post<ApiResponse<LabSampleDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_ACCESSION,
      dto
    );
    return res.data.data!;
  },

  rejectSample: async (
    sampleId: string,
    dto: SampleRejectionDto
  ): Promise<LabSampleDto> => {
    const res = await apiClient.post<ApiResponse<LabSampleDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_REJECT(sampleId),
      dto
    );
    return res.data.data!;
  },

  getPrintableLabelData: async (
    sampleId: string
  ): Promise<PrintableSampleLabelDto> => {
    const res = await apiClient.get<ApiResponse<PrintableSampleLabelDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_LABEL(sampleId)
    );
    return res.data.data!;
  },

  getSampleTimeline: async (
    sampleId: string
  ): Promise<SampleTimelineEventDto[]> => {
    const res = await apiClient.get<ApiResponse<SampleTimelineEventDto[]>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_TIMELINE(sampleId)
    );
    return res.data.data || [];
  },

  getSampleById: async (sampleId: string): Promise<LabSampleDto> => {
    const res = await apiClient.get<ApiResponse<LabSampleDto>>(
      API_ENDPOINTS.LABORATORY.SAMPLE_DETAIL(sampleId)
    );
    return res.data.data!;
  },

  // 6. Collection Centers
  listCollectionCenters: async (): Promise<CollectionCenterDto[]> => {
    const res = await apiClient.get<ApiResponse<CollectionCenterDto[]>>(
      API_ENDPOINTS.LABORATORY.COLLECTION_CENTERS
    );
    return res.data.data || [];
  },

  createCollectionCenter: async (
    dto: Partial<CollectionCenterDto>
  ): Promise<CollectionCenterDto> => {
    const res = await apiClient.post<ApiResponse<CollectionCenterDto>>(
      API_ENDPOINTS.LABORATORY.COLLECTION_CENTERS,
      dto
    );
    return res.data.data!;
  },

  updateCollectionCenter: async (
    centerId: string,
    dto: Partial<CollectionCenterDto>
  ): Promise<CollectionCenterDto> => {
    const res = await apiClient.patch<ApiResponse<CollectionCenterDto>>(
      API_ENDPOINTS.LABORATORY.COLLECTION_CENTER_DETAIL(centerId),
      dto
    );
    return res.data.data!;
  },
};
