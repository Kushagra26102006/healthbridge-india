/**
 * HealthBridge India — ABDM HIP / HIU Health Information Exchange API Client (Day 7 Task 04)
 * Never receives or stores private encryption keys or ABDM credentials.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AbdmDiscoveryRequestDto,
  AbdmHealthInfoType,
  AbdmHealthInformationTransferDto,
  AbdmImportedRecordDto,
  AbdmLinkedHealthRecordDto,
  AbdmTransferAcknowledgementDto,
} from '@healthbridge/shared-types';

export const abdmHieApi = {
  async listDiscoveryHistory(): Promise<AbdmDiscoveryRequestDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmDiscoveryRequestDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.DISCOVERY
    );
    return res.data.data || [];
  },

  async initiateDiscovery(payload: {
    participantId: string;
    participantName?: string;
    requestedCategories: AbdmHealthInfoType[];
  }): Promise<AbdmDiscoveryRequestDto> {
    const res = await apiClient.post<ApiResponse<AbdmDiscoveryRequestDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.DISCOVERY,
      payload
    );
    return res.data.data!;
  },

  async listLinkedRecords(): Promise<AbdmLinkedHealthRecordDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmLinkedHealthRecordDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.LINKING
    );
    return res.data.data || [];
  },

  async initiateLinking(payload: {
    discoveryId?: string;
    participantId: string;
    participantName?: string;
    careContextReference: string;
    careContextDisplay: string;
    hiTypes: AbdmHealthInfoType[];
    linkMode?: 'USER_INITIATED' | 'HIP_INITIATED';
  }): Promise<AbdmLinkedHealthRecordDto> {
    const res = await apiClient.post<ApiResponse<AbdmLinkedHealthRecordDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.LINKING,
      payload
    );
    return res.data.data!;
  },

  async confirmLinking(
    linkId: string,
    payload: { otpToken?: string; confirmed: boolean }
  ): Promise<AbdmLinkedHealthRecordDto> {
    const res = await apiClient.post<ApiResponse<AbdmLinkedHealthRecordDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.LINKING_CONFIRM(linkId),
      payload
    );
    return res.data.data!;
  },

  async unlinkRecord(linkId: string, reason: string): Promise<AbdmLinkedHealthRecordDto> {
    const res = await apiClient.post<ApiResponse<AbdmLinkedHealthRecordDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.LINKING_UNLINK(linkId),
      { reason }
    );
    return res.data.data!;
  },

  async listTransfers(role?: 'HIP' | 'HIU'): Promise<AbdmHealthInformationTransferDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmHealthInformationTransferDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.TRANSFERS,
      { params: role ? { role } : undefined }
    );
    return res.data.data || [];
  },

  async getTransferDetail(id: string): Promise<{
    transfer: AbdmHealthInformationTransferDto;
    acknowledgements: AbdmTransferAcknowledgementDto[];
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        transfer: AbdmHealthInformationTransferDto;
        acknowledgements: AbdmTransferAcknowledgementDto[];
      }>
    >(API_ENDPOINTS.ABDM_INTEGRATION.HIE.TRANSFER_BY_ID(id));
    return res.data.data!;
  },

  async listImportedRecords(patientId?: string): Promise<AbdmImportedRecordDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmImportedRecordDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.IMPORTED_RECORDS,
      { params: patientId ? { patientId } : undefined }
    );
    return res.data.data || [];
  },

  async reviewImportedRecord(
    recordId: string,
    payload: { decision: 'APPROVE' | 'REJECT'; reviewNotes: string }
  ): Promise<AbdmImportedRecordDto> {
    const res = await apiClient.post<ApiResponse<AbdmImportedRecordDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.REVIEW_IMPORTED_RECORD(recordId),
      payload
    );
    return res.data.data!;
  },
};
