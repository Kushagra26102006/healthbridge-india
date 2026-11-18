import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiResponse } from '@healthbridge/shared-types';

export type VideoConsultationStatus =
  | 'SCHEDULED'
  | 'WAITING_ROOM'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type VideoConsultationMode = 'VIDEO' | 'AUDIO_ONLY';
export type VideoProviderMode = 'WEBRTC_DIRECT' | 'LIVEKIT';

export interface VideoConsultationSessionDto {
  consultationId: string;
  appointmentId: string;
  roomName: string;
  provider: VideoProviderMode;
  status: VideoConsultationStatus;
  mode: VideoConsultationMode;
  recordingEnabled: false;
  canJoin: boolean;
  participantRole: 'PATIENT' | 'DOCTOR';
  emergencyDisclaimer: string;
  appointment: {
    id: string;
    scheduledAt: string;
    startTime: string;
    endTime: string;
    status: string;
    consultationType: string;
    reason: string;
    encounterId?: string;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string[];
    qualifications: string[];
  };
  patient: {
    id: string;
    name: string;
    phone?: string;
  };
  consent: {
    granted: boolean;
    grantedAt?: string;
    consentVersion: string;
    emergencyDisclaimerAcknowledged: boolean;
  };
  presence: {
    patientInWaitingRoom: boolean;
    doctorInWaitingRoom: boolean;
    patientJoined: boolean;
    doctorJoined: boolean;
  };
  consultationNotes?: {
    chiefComplaint: string;
    clinicalObservations: string;
    summary: string;
    followUpPlan: string;
    updatedAt?: string;
  };
  startedAt?: string;
  endedAt?: string;
}

export interface VideoRoomTokenResponseDto {
  token: string;
  provider: VideoProviderMode;
  providerUrl?: string;
  roomName: string;
  expiresAt: string;
  ttlSeconds: number;
  recordingEnabled: false;
  iceServers: RTCIceServer[];
  consultationId: string;
  appointmentId: string;
  participantRole: 'PATIENT' | 'DOCTOR';
  clientSessionId: string;
  replacedExistingSession: boolean;
  status: VideoConsultationStatus;
  mode: VideoConsultationMode;
  emergencyDisclaimer: string;
}

export interface DoctorUpcomingVideoConsultationDto {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  appointmentStatus: string;
  reason: string;
  consultationStatus: VideoConsultationStatus;
  mode: VideoConsultationMode;
  patientConsentGranted: boolean;
  patientInWaitingRoom: boolean;
}

export interface VideoSignalItemDto {
  id: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  signalType: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MEDIA_STATE' | 'HANGUP';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AdminTelemedicineTelemetryDto {
  configuration: {
    activeProvider: VideoProviderMode;
    livekitConfigured: boolean;
    productionSfuReady: boolean;
    tokenTtlSeconds: number;
    recordingEnabledByDefault: false;
    patientConsentRequired: boolean;
    encryptionTransport: string;
    iceServerCount: number;
    readinessNotice: string;
  };
  usage: {
    totalTeleconsultAppointments: number;
    totalVideoSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
    audioFallbackSessions: number;
    totalReconnectEvents: number;
    totalTechnicalFailures: number;
    averageDurationSeconds: number;
    statusBreakdown: Record<string, number>;
  };
  recentTechnicalEvents: Array<{
    sessionRef: string;
    provider: VideoProviderMode;
    status: VideoConsultationStatus;
    mode: VideoConsultationMode;
    reconnectCount: number;
    failureCount: number;
    failureCode: string;
    failureCategory: string;
    audioFallbackUsed: boolean;
    updatedAt: string;
  }>;
}

export const telemedicineApi = {
  async getSession(appointmentId: string): Promise<VideoConsultationSessionDto> {
    const res = await apiClient.get<ApiResponse<VideoConsultationSessionDto>>(
      API_ENDPOINTS.TELEMEDICINE.SESSION(appointmentId)
    );
    if (!res.data.data) throw new Error(res.data.message || 'Failed to load consultation session');
    return res.data.data;
  },

  async grantConsent(
    appointmentId: string,
    payload: { consentAccepted: boolean; emergencyDisclaimerAcknowledged: boolean }
  ) {
    const res = await apiClient.post<ApiResponse<{ consultationId: string; granted: boolean }>>(
      API_ENDPOINTS.TELEMEDICINE.CONSENT(appointmentId),
      payload
    );
    return res.data.data!;
  },

  async issueJoinToken(
    appointmentId: string,
    payload?: { mode?: VideoConsultationMode; clientSessionId?: string }
  ): Promise<VideoRoomTokenResponseDto> {
    const res = await apiClient.post<ApiResponse<VideoRoomTokenResponseDto>>(
      API_ENDPOINTS.TELEMEDICINE.TOKEN(appointmentId),
      payload || {}
    );
    if (!res.data.data) throw new Error(res.data.message || 'Failed to obtain video room token');
    return res.data.data;
  },

  async updateState(
    appointmentId: string,
    payload: {
      status?: VideoConsultationStatus;
      mode?: VideoConsultationMode;
      failureCode?: string;
      failureCategory?: string;
    }
  ) {
    const res = await apiClient.patch<ApiResponse<{ status: VideoConsultationStatus }>>(
      API_ENDPOINTS.TELEMEDICINE.STATE(appointmentId),
      payload
    );
    return res.data.data!;
  },

  async saveNotes(
    appointmentId: string,
    notes: {
      chiefComplaint?: string;
      clinicalObservations?: string;
      summary?: string;
      followUpPlan?: string;
    }
  ) {
    const res = await apiClient.put<ApiResponse<{ consultationId: string }>>(
      API_ENDPOINTS.TELEMEDICINE.NOTES(appointmentId),
      notes
    );
    return res.data.data!;
  },

  async getDoctorUpcoming(): Promise<DoctorUpcomingVideoConsultationDto[]> {
    const res = await apiClient.get<ApiResponse<DoctorUpcomingVideoConsultationDto[]>>(
      API_ENDPOINTS.TELEMEDICINE.DOCTOR_UPCOMING
    );
    return res.data.data || [];
  },

  async decideConsultation(
    appointmentId: string,
    payload: { decision: 'ACCEPT' | 'REJECT'; reason?: string }
  ) {
    const res = await apiClient.post<ApiResponse<{ appointmentStatus: string }>>(
      API_ENDPOINTS.TELEMEDICINE.DOCTOR_DECISION(appointmentId),
      payload
    );
    return res.data.data!;
  },

  async postSignal(
    consultationId: string,
    payload: {
      roomToken: string;
      signalType: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MEDIA_STATE' | 'HANGUP';
      payload: Record<string, unknown>;
    }
  ) {
    const res = await apiClient.post<ApiResponse<{ signalId: string; createdAt: string }>>(
      API_ENDPOINTS.TELEMEDICINE.SIGNALS(consultationId),
      payload
    );
    return res.data.data!;
  },

  async pollSignals(
    consultationId: string,
    roomToken: string,
    since?: string
  ): Promise<{
    status: VideoConsultationStatus;
    presence: { patientJoined: boolean; doctorJoined: boolean };
    signals: VideoSignalItemDto[];
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        status: VideoConsultationStatus;
        presence: { patientJoined: boolean; doctorJoined: boolean };
        signals: VideoSignalItemDto[];
      }>
    >(API_ENDPOINTS.TELEMEDICINE.SIGNALS(consultationId), {
      params: since ? { since } : undefined,
      headers: { 'X-Video-Room-Token': roomToken },
    });
    return res.data.data!;
  },

  async getAdminTelemetry(): Promise<AdminTelemedicineTelemetryDto> {
    const res = await apiClient.get<ApiResponse<AdminTelemedicineTelemetryDto>>(
      API_ENDPOINTS.TELEMEDICINE.ADMIN_TELEMETRY
    );
    if (!res.data.data) throw new Error(res.data.message || 'Failed to load telemedicine telemetry');
    return res.data.data;
  },
};
