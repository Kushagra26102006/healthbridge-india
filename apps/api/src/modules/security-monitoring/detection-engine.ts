/**
 * HealthBridge India — Configurable Evidence-Based Security Detection Rules & Engine (Day 9 Task 04)
 *
 * Uses sliding-window thresholds to distinguish genuine attack patterns from routine
 * single user typos or transient validation errors (false-positive control).
 */

import type {
  SecurityEventCategory,
  SecurityEventType,
  SecuritySeverity,
} from './security-event.types';

export interface DetectionRuleDefinition {
  ruleId: string;
  name: string;
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  enabled: boolean;
  matchEventTypes: ReadonlyArray<SecurityEventType>;
  thresholdCount: number;
  windowSeconds: number;
  groupBy: 'actorId' | 'sourceIp' | 'sourceModule' | 'global';
  safeAlertTitle: string;
  safeAlertDescription: string;
}

export interface NormalizedSecurityEvent {
  eventId: string;
  dedupeKey?: string;
  eventType: SecurityEventType;
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  actorId?: string;
  actorRole?: string;
  sourceIp?: string;
  sourceModule: string;
  requestId: string;
  correlationId?: string;
  resourceCategory?: string;
  resourceReference?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  detectionRuleId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface DetectionTriggerResult {
  rule: DetectionRuleDefinition;
  fingerprint: string;
  matchedEventIds: string[];
}

export const DEFAULT_DETECTION_RULES: DetectionRuleDefinition[] = [
  {
    ruleId: 'RULE_REPEATED_FAILED_LOGINS_ACCOUNT',
    name: 'Repeated Failed Logins on Single Account',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    enabled: true,
    matchEventTypes: ['LOGIN_FAILURE', 'ACCOUNT_LOCKOUT'],
    thresholdCount: 5,
    windowSeconds: 900, // 15 minutes
    groupBy: 'actorId',
    safeAlertTitle: 'Repeated authentication failures detected for an account',
    safeAlertDescription:
      'Threshold of repeated login failures exceeded within a 15-minute sliding window. Investigate possible credential stuffing or brute-force attempt.',
  },
  {
    ruleId: 'RULE_REPEATED_FAILED_LOGINS_IP',
    name: 'Repeated Failed Logins from Single Source IP',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    enabled: true,
    matchEventTypes: ['LOGIN_FAILURE'],
    thresholdCount: 8,
    windowSeconds: 900,
    groupBy: 'sourceIp',
    safeAlertTitle: 'High volume of authentication failures from one source IP',
    safeAlertDescription:
      'Multiple failed login attempts originated from the same source IP within 15 minutes.',
  },
  {
    ruleId: 'RULE_REFRESH_TOKEN_REUSE',
    name: 'Revoked Refresh Token Replay Detected',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    enabled: true,
    matchEventTypes: ['TOKEN_REUSE_DETECTED'],
    thresholdCount: 1,
    windowSeconds: 300,
    groupBy: 'actorId',
    safeAlertTitle: 'Critical session compromise indicator: refresh token reuse',
    safeAlertDescription:
      'A previously rotated/revoked refresh token was replayed. Automated session containment was triggered; urgent triage required.',
  },
  {
    ruleId: 'RULE_CROSS_PATIENT_ACCESS_PATTERN',
    name: 'Repeated Cross-Patient or Consent-Bypass Access Attempts',
    category: 'AUTHORIZATION',
    severity: 'CRITICAL',
    enabled: true,
    matchEventTypes: ['CROSS_PATIENT_ACCESS_ATTEMPT', 'CONSENT_VALIDATION_FAILURE'],
    thresholdCount: 3,
    windowSeconds: 600, // 10 minutes
    groupBy: 'actorId',
    safeAlertTitle: 'Repeated unauthorized cross-patient or consent-bypass attempts',
    safeAlertDescription:
      'An authenticated actor triggered multiple blocked cross-patient or consent-validation denials within 10 minutes.',
  },
  {
    ruleId: 'RULE_CROSS_TENANT_OR_ADMIN_DENIAL',
    name: 'Repeated Cross-Tenant or Privileged Endpoint Denials',
    category: 'AUTHORIZATION',
    severity: 'HIGH',
    enabled: true,
    matchEventTypes: ['CROSS_TENANT_ACCESS_ATTEMPT', 'ACCESS_DENIED'],
    thresholdCount: 4,
    windowSeconds: 600,
    groupBy: 'actorId',
    safeAlertTitle: 'Repeated unauthorized privilege or cross-tenant access denials',
    safeAlertDescription:
      'Multiple forbidden role or facility-scope denials detected for one actor within 10 minutes.',
  },
  {
    ruleId: 'RULE_API_ABUSE_PATTERN',
    name: 'API Abuse, Rate-Limit Storm or Suspicious Query Pattern',
    category: 'API_SECURITY',
    severity: 'HIGH',
    enabled: true,
    matchEventTypes: ['RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_QUERY_PATTERN', 'INVALID_REQUEST_PATTERN'],
    thresholdCount: 5,
    windowSeconds: 300, // 5 minutes
    groupBy: 'sourceIp',
    safeAlertTitle: 'Sustained API abuse or suspicious request pattern detected',
    safeAlertDescription:
      'Repeated rate-limit breaches or blocked injection/query patterns observed within 5 minutes.',
  },
  {
    ruleId: 'RULE_UNAUTHORIZED_DOCUMENT_OR_DECRYPTION',
    name: 'Repeated Unauthorized Document Downloads or Decryption Failures',
    category: 'DATA_PROTECTION',
    severity: 'CRITICAL',
    enabled: true,
    matchEventTypes: ['UNAUTHORIZED_DOCUMENT_DOWNLOAD', 'DECRYPTION_FAILURE', 'KEY_ROTATION_FAILURE'],
    thresholdCount: 3,
    windowSeconds: 900,
    groupBy: 'actorId',
    safeAlertTitle: 'Critical document protection or cryptographic failure pattern',
    safeAlertDescription:
      'Multiple unauthorized medical document download attempts or authenticated decryption failures occurred within 15 minutes.',
  },
  {
    ruleId: 'RULE_INTEGRATION_REPLAY_ABUSE',
    name: 'Integration Callback Validation or Event Replay Anomaly',
    category: 'INTEGRATION',
    severity: 'HIGH',
    enabled: true,
    matchEventTypes: [
      'EVENT_REPLAY_ATTEMPT',
      'ABDM_CALLBACK_VALIDATION_FAILURE',
      'EVENT_SIGNATURE_VALIDATION_FAILURE',
    ],
    thresholdCount: 3,
    windowSeconds: 900,
    groupBy: 'sourceModule',
    safeAlertTitle: 'Repeated external callback validation or event replay failures',
    safeAlertDescription:
      'Multiple invalid integration callbacks or event replay attempts detected within 15 minutes.',
  },
];

export class SecurityDetectionEngine {
  private readonly rules = new Map<string, DetectionRuleDefinition>();

  constructor(initialRules: DetectionRuleDefinition[] = DEFAULT_DETECTION_RULES) {
    for (const rule of initialRules) {
      this.rules.set(rule.ruleId, { ...rule });
    }
  }

  listRules(): DetectionRuleDefinition[] {
    return Array.from(this.rules.values());
  }

  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  evaluate(
    currentEvent: NormalizedSecurityEvent,
    recentEvents: NormalizedSecurityEvent[]
  ): DetectionTriggerResult[] {
    const triggers: DetectionTriggerResult[] = [];
    const nowMs = currentEvent.timestamp.getTime();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!rule.matchEventTypes.includes(currentEvent.eventType)) continue;

      const groupKeyVal = this.resolveGroupKey(rule.groupBy, currentEvent);
      if (!groupKeyVal) continue;

      const windowStartMs = nowMs - rule.windowSeconds * 1000;
      const matching = recentEvents.filter((ev) => {
        if (!rule.matchEventTypes.includes(ev.eventType)) return false;
        if (ev.timestamp.getTime() < windowStartMs) return false;
        return this.resolveGroupKey(rule.groupBy, ev) === groupKeyVal;
      });

      if (matching.length >= rule.thresholdCount) {
        const fingerprint = `${rule.ruleId}:${rule.groupBy}:${groupKeyVal}`;
        triggers.push({
          rule,
          fingerprint,
          matchedEventIds: matching.slice(-10).map((e) => e.eventId),
        });
      }
    }

    return triggers;
  }

  private resolveGroupKey(
    groupBy: DetectionRuleDefinition['groupBy'],
    ev: NormalizedSecurityEvent
  ): string | null {
    switch (groupBy) {
      case 'actorId':
        return ev.actorId || ev.sourceIp || 'anonymous';
      case 'sourceIp':
        return ev.sourceIp || ev.actorId || 'unknown-ip';
      case 'sourceModule':
        return ev.sourceModule;
      case 'global':
        return 'global';
    }
  }
}

export const securityDetectionEngine = new SecurityDetectionEngine();
export default securityDetectionEngine;
