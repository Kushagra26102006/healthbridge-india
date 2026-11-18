/**
 * HealthBridge India — Background Event Worker Processor (Day 8 Task 03)
 *
 * Features:
 *   - Durable MongoDB Outbox polling (survives API/worker restarts)
 *   - Atomic batch claiming with lease expiration recovery
 *   - Concurrent-safe dispatch (no double processing across workers)
 *   - Periodic worker heartbeat persistence
 *   - Graceful shutdown (drains in-flight work & releases remaining leases cleanly)
 */

import os from 'os';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
import { eventRepository, EventRepository } from './event.repository';
import { eventDispatcher, EventDispatcher } from './event.dispatcher';
import type { EventDispatchOutcome } from './event.types';

export interface EventWorkerOptions {
  workerId?: string;
  pollIntervalMs?: number;
  batchSize?: number;
  leaseDurationMs?: number;
  heartbeatIntervalMs?: number;
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
}

export class EventWorkerProcessor {
  readonly workerId: string;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly leaseDurationMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly baseRetryDelayMs?: number;
  private readonly maxRetryDelayMs?: number;

  private status: 'RUNNING' | 'STOPPING' | 'STOPPED' = 'STOPPED';
  private startedAt: Date = new Date();
  private lastHeartbeatAt: Date = new Date();
  private processedCount = 0;
  private failedCount = 0;
  private activeLeaseCount = 0;

  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private inFlightPromise: Promise<EventDispatchOutcome[]> | null = null;

  constructor(
    options: EventWorkerOptions = {},
    private readonly repository: EventRepository = eventRepository,
    private readonly dispatcher: EventDispatcher = eventDispatcher
  ) {
    this.workerId =
      options.workerId || `hb-worker-${os.hostname()}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
    this.pollIntervalMs = options.pollIntervalMs ?? 2_000;
    this.batchSize = options.batchSize ?? 20;
    this.leaseDurationMs = options.leaseDurationMs ?? 30_000;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 10_000;
    this.baseRetryDelayMs = options.baseRetryDelayMs;
    this.maxRetryDelayMs = options.maxRetryDelayMs;
  }

  start(): void {
    if (this.status === 'RUNNING') return;
    this.status = 'RUNNING';
    this.startedAt = new Date();
    this.lastHeartbeatAt = new Date();

    logger.info('Starting HealthBridge domain event worker', {
      workerId: this.workerId,
      pollIntervalMs: this.pollIntervalMs,
      batchSize: this.batchSize,
      leaseDurationMs: this.leaseDurationMs,
    });

    void this.emitHeartbeat();

    this.pollTimer = setInterval(() => {
      if (this.status !== 'RUNNING' || this.inFlightPromise) return;
      if (mongoose.connection.readyState !== 1) return;
      void this.processBatchOnce();
    }, this.pollIntervalMs);

    if (this.pollTimer.unref) {
      this.pollTimer.unref();
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.status === 'STOPPED') return;
      void this.emitHeartbeat();
    }, this.heartbeatIntervalMs);

    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  /**
   * Claims and processes one bounded batch of due/expired-lease outbox events.
   * Exposed publicly for deterministic testing and controlled draining.
   */
  async processBatchOnce(): Promise<EventDispatchOutcome[]> {
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    const work = (async (): Promise<EventDispatchOutcome[]> => {
      const outcomes: EventDispatchOutcome[] = [];
      try {
        const batch = await this.repository.claimNextBatch(
          this.workerId,
          this.batchSize,
          this.leaseDurationMs
        );
        this.activeLeaseCount = batch.length;

        for (const event of batch) {
          if (this.status === 'STOPPING') {
            break;
          }
          const outcome = await this.dispatcher.dispatchEvent(event, this.workerId, {
            handlerLeaseMs: this.leaseDurationMs,
            baseRetryDelayMs: this.baseRetryDelayMs,
            maxRetryDelayMs: this.maxRetryDelayMs,
          });
          outcomes.push(outcome);

          if (outcome.finalStatus === 'PROCESSED') {
            this.processedCount++;
          } else {
            this.failedCount++;
          }
          this.activeLeaseCount = Math.max(0, this.activeLeaseCount - 1);
        }
      } catch (error: any) {
        logger.error('Event worker batch cycle failed', {
          workerId: this.workerId,
          error: String(error?.message || error),
        });
      } finally {
        this.activeLeaseCount = 0;
        this.inFlightPromise = null;
      }

      return outcomes;
    })();

    this.inFlightPromise = work;
    return work;
  }

  /**
   * Graceful shutdown: stops timers, waits for any in-flight event dispatch up to
   * `timeoutMs`, releases any remaining leases held by this worker, and writes final heartbeat.
   */
  async stop(timeoutMs = 5_000): Promise<void> {
    if (this.status === 'STOPPED') return;
    this.status = 'STOPPING';

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.inFlightPromise) {
      await Promise.race([
        this.inFlightPromise.catch(() => []),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    }

    if (mongoose.connection.readyState === 1) {
      await this.repository.releaseWorkerLeases(this.workerId).catch(() => 0);
    }

    this.status = 'STOPPED';
    this.activeLeaseCount = 0;
    await this.emitHeartbeat();

    logger.info('HealthBridge domain event worker stopped gracefully', {
      workerId: this.workerId,
      processedCount: this.processedCount,
      failedCount: this.failedCount,
    });
  }

  private async emitHeartbeat(): Promise<void> {
    this.lastHeartbeatAt = new Date();
    if (mongoose.connection.readyState !== 1) return;
    await this.repository
      .upsertWorkerHeartbeat({
        workerId: this.workerId,
        status: this.status,
        hostname: os.hostname(),
        pid: process.pid,
        startedAt: this.startedAt,
        processedCount: this.processedCount,
        failedCount: this.failedCount,
        activeLeaseCount: this.activeLeaseCount,
        pollIntervalMs: this.pollIntervalMs,
        batchSize: this.batchSize,
      })
      .catch(() => undefined);
  }

  getLocalHealth() {
    return {
      workerId: this.workerId,
      status: this.status,
      startedAt: this.startedAt.toISOString(),
      lastHeartbeatAt: this.lastHeartbeatAt.toISOString(),
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      activeLeaseCount: this.activeLeaseCount,
      pollIntervalMs: this.pollIntervalMs,
      batchSize: this.batchSize,
    };
  }
}

export const defaultEventWorker = new EventWorkerProcessor();
