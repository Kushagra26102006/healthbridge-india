import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface SecurityOverviewDto {
  monitoringMode: string;
  totalSecurityEvents: number;
  openAlertCount: number;
  criticalAndHighOpenAlerts: number;
  activeIncidentCount: number;
  criticalActiveIncidents: number;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  indicators: {
    failedLoginCount: number;
    failedLoginRatePercent: number | null;
    unauthorizedAccessAttempts: number;
    rateLimitEvents: number;
    documentAndCryptoAlertEvents: number;
    backupAndKeyManagementAlerts: number;
  };
  slaMetrics: {
    meanTimeToAcknowledgeSec: number | null;
    meanTimeToResolveSec: number | null;
    acknowledgedSampleCount: number;
    resolvedSampleCount: number;
  };
  vulnerabilitySummary: {
    totalTracked: number;
    openBySeverity: Record<string, number>;
  };
  recentSuspiciousActivity: Array<{
    eventId: string;
    eventType: string;
    category: string;
    severity: string;
    sourceModule: string;
    outcome: string;
    timestamp: string;
  }>;
  detectionRulesActive: number;
}

export interface SecurityAlertDto {
  alertId: string;
  detectionRuleId: string;
  category: string;
  severity: string;
  title: string;
  safeDescription: string;
  relatedEventIds: string[];
  firstDetectedAt: string;
  lastDetectedAt: string;
  occurrenceCount: number;
  status: string;
  assignedReviewerId?: string;
  incidentId?: string;
  resolutionNotes?: string;
}

export interface SecurityIncidentDto {
  incidentId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  relatedAlertIds: string[];
  affectedModules: string[];
  affectedSystems: string[];
  assignedResponderId?: string;
  evidenceReferences: string[];
  containmentActions: Array<{ timestamp: string; actorId: string; action: string }>;
  resolution?: string;
  lessonsLearned?: string;
  timeline: Array<{
    timestamp: string;
    actorId: string;
    fromStatus: string;
    toStatus: string;
    note: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface VulnerabilityDto {
  vulnerabilityId: string;
  component: string;
  advisoryReference: string;
  severity: string;
  affectedVersion: string;
  fixedVersion?: string;
  exploitability?: string;
  remediation: string;
  owner: string;
  status: string;
  acceptedRiskJustification?: string;
  verificationResult?: string;
  createdAt: string;
}

export interface SecurityEventDto {
  eventId: string;
  eventType: string;
  category: string;
  severity: string;
  actorId?: string;
  actorRole?: string;
  sourceIp?: string;
  sourceModule: string;
  requestId?: string;
  correlationId?: string;
  resourceCategory?: string;
  resourceReference?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogItemDto {
  id: string;
  actorId?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: string;
  requestId: string;
  correlationId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata: Record<string, unknown>;
}

export interface AuditLogSummaryDto {
  totalEvents: number;
  last24hTotal: number;
  last24hBlocked: number;
  last24hFailures: number;
  byOutcome: Record<string, number>;
  immutabilityEnforced: boolean;
}

export const securityMonitoringApi = {
  async getOverview(): Promise<SecurityOverviewDto> {
    const res = await apiClient.get<{ data: SecurityOverviewDto }>(
      API_ENDPOINTS.SECURITY_OPS.OVERVIEW
    );
    return res.data.data;
  },

  async listEvents(params?: Record<string, string | number | undefined>) {
    const res = await apiClient.get<{
      data: {
        items: SecurityEventDto[];
        pagination: { page: number; limit?: number; total: number; totalPages: number };
      };
    }>(API_ENDPOINTS.SECURITY_OPS.EVENTS, { params });
    return res.data.data;
  },

  async listAlerts(params?: Record<string, string | number | undefined>) {
    const res = await apiClient.get<{
      data: { items: SecurityAlertDto[]; pagination: { page: number; total: number; totalPages: number } };
    }>(API_ENDPOINTS.SECURITY_OPS.ALERTS, { params });
    return res.data.data;
  },

  async updateAlert(
    alertId: string,
    payload: { status?: string; assignedReviewerId?: string; resolutionNotes?: string }
  ) {
    const res = await apiClient.patch<{ data: SecurityAlertDto }>(
      API_ENDPOINTS.SECURITY_OPS.ALERT_DETAIL(alertId),
      payload
    );
    return res.data.data;
  },

  async listIncidents(params?: Record<string, string | number | undefined>) {
    const res = await apiClient.get<{
      data: { items: SecurityIncidentDto[]; pagination: { page: number; total: number; totalPages: number } };
    }>(API_ENDPOINTS.SECURITY_OPS.INCIDENTS, { params });
    return res.data.data;
  },

  async getIncident(id: string): Promise<SecurityIncidentDto> {
    const res = await apiClient.get<{ data: SecurityIncidentDto }>(
      API_ENDPOINTS.SECURITY_OPS.INCIDENT_DETAIL(id)
    );
    return res.data.data;
  },

  async createIncident(payload: {
    title: string;
    category: string;
    severity: string;
    description: string;
    affectedModules?: string[];
  }) {
    const res = await apiClient.post<{ data: SecurityIncidentDto }>(
      API_ENDPOINTS.SECURITY_OPS.INCIDENTS,
      payload
    );
    return res.data.data;
  },

  async updateIncident(
    id: string,
    payload: {
      status?: string;
      containmentAction?: string;
      resolution?: string;
      lessonsLearned?: string;
      note?: string;
    }
  ) {
    const res = await apiClient.patch<{ data: SecurityIncidentDto }>(
      API_ENDPOINTS.SECURITY_OPS.INCIDENT_DETAIL(id),
      payload
    );
    return res.data.data;
  },

  async listVulnerabilities(params?: Record<string, string | number | undefined>) {
    const res = await apiClient.get<{
      data: { items: VulnerabilityDto[]; pagination: { page: number; total: number; totalPages: number } };
    }>(API_ENDPOINTS.SECURITY_OPS.VULNERABILITIES, { params });
    return res.data.data;
  },

  async createVulnerability(payload: {
    component: string;
    advisoryReference: string;
    severity: string;
    affectedVersion: string;
    fixedVersion?: string;
    remediation: string;
    owner: string;
  }) {
    const res = await apiClient.post<{ data: VulnerabilityDto }>(
      API_ENDPOINTS.SECURITY_OPS.VULNERABILITIES,
      payload
    );
    return res.data.data;
  },

  async updateVulnerability(
    id: string,
    payload: { status?: string; acceptedRiskJustification?: string; verificationResult?: string }
  ) {
    const res = await apiClient.patch<{ data: VulnerabilityDto }>(
      API_ENDPOINTS.SECURITY_OPS.VULNERABILITY_DETAIL(id),
      payload
    );
    return res.data.data;
  },

  async listAuditLogs(params?: Record<string, string | number | undefined>) {
    const res = await apiClient.get<{
      data: {
        items: AuditLogItemDto[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>('/audit/logs', { params });
    return res.data.data;
  },

  async getAuditSummary(): Promise<AuditLogSummaryDto> {
    const res = await apiClient.get<{ data: AuditLogSummaryDto }>('/audit/summary');
    return res.data.data;
  },

  async exportAuditLogsCsv(params?: Record<string, string | number | undefined>): Promise<void> {
    const res = await apiClient.get('/audit/export', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthbridge_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
