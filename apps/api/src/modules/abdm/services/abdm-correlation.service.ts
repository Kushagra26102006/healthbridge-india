/**
 * HealthBridge India — ABDM Correlation ID & Asynchronous Request Tracking Service (Day 7 Task 01)
 *
 * Aligns with ABDM V3 asynchronous `REQUEST-ID` + `TIMESTAMP` correlation patterns
 * so outbound requests can be deterministically matched to inbound `on-*` callbacks.
 */

import crypto from 'crypto';

export interface AbdmCorrelationRecord {
  requestId: string;
  operation: string;
  createdAt: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED';
  callbackReceivedAt?: string;
}

export class AbdmCorrelationService {
  private readonly records = new Map<string, AbdmCorrelationRecord>();
  private readonly maxInMemoryRecords = 1000;

  /**
   * Generates a compliant RFC 4122 v4 UUID for ABDM `REQUEST-ID` header.
   */
  generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generates an ISO-8601 UTC timestamp for ABDM `TIMESTAMP` header.
   */
  generateTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Registers an outbound correlation entry.
   */
  registerOutboundRequest(operation: string, requestId?: string): AbdmCorrelationRecord {
    const id = requestId || this.generateRequestId();
    const record: AbdmCorrelationRecord = {
      requestId: id,
      operation,
      createdAt: this.generateTimestamp(),
      status: 'PENDING',
    };

    if (this.records.size >= this.maxInMemoryRecords) {
      const oldestKey = this.records.keys().next().value;
      if (oldestKey) this.records.delete(oldestKey);
    }
    this.records.set(id, record);
    return record;
  }

  /**
   * Resolves a correlation entry by `requestId` or `resp.requestId`.
   */
  getCorrelation(requestId: string): AbdmCorrelationRecord | undefined {
    return this.records.get(requestId);
  }

  /**
   * Marks a correlated request as completed or failed upon inbound callback arrival.
   */
  markCallbackReceived(
    requestId: string,
    status: 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED' = 'COMPLETED'
  ): AbdmCorrelationRecord | undefined {
    const existing = this.records.get(requestId);
    if (!existing) return undefined;
    existing.status = status;
    existing.callbackReceivedAt = this.generateTimestamp();
    return existing;
  }

  clearAll(): void {
    this.records.clear();
  }
}

export const abdmCorrelationService = new AbdmCorrelationService();
