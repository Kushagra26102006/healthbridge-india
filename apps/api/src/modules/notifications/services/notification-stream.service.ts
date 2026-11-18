/**
 * HealthBridge India — Hardened Real-Time SSE Connection Manager (Day 8 Task 04)
 *
 * Transport Architecture:
 *   - One-way Server-Sent Events (SSE) with per-user isolation (`Map<userId, Set<SseClient>>`)
 *   - Standard SSE `id:` frame headers for `Last-Event-ID` reconnection catch-up
 *   - Per-user max concurrent connections cap (`MAX_CONNECTIONS_PER_USER = 5`) to bound memory
 *   - 25-second proxy keep-alive heartbeats (`.unref()` so tests/shutdown exit cleanly)
 *   - Graceful `disconnectUser(userId, reason)` on logout / session revocation
 *   - Strictly NEVER broadcasts one user's notifications to another user
 */

import { Response } from 'express';
import { logger } from '../../../config/logger';

const MAX_CONNECTIONS_PER_USER = 5;
const HEARTBEAT_INTERVAL_MS = 25_000;

export interface SseClientConnection {
  res: Response;
  connectedAt: number;
}

export class NotificationStreamService {
  private clients: Map<string, Set<SseClientConnection>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventSeq = 0;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Register an authenticated SSE connection scoped strictly to `userId`.
   * Enforces per-user connection cap by closing the oldest stale socket when exceeded.
   */
  addClient(userId: string, res: Response): void {
    let userClients = this.clients.get(userId);
    if (!userClients) {
      userClients = new Set();
      this.clients.set(userId, userClients);
    }

    // Evict oldest connection if user exceeds max concurrent tabs/devices
    if (userClients.size >= MAX_CONNECTIONS_PER_USER) {
      const oldest = userClients.values().next().value;
      if (oldest) {
        try {
          oldest.res.write(
            `event: displaced\ndata: ${JSON.stringify({ reason: 'MAX_CONNECTIONS_EXCEEDED' })}\n\n`
          );
          oldest.res.end();
        } catch {
          // ignore write error on stale socket
        }
        userClients.delete(oldest);
      }
    }

    const entry: SseClientConnection = {
      res,
      connectedAt: Date.now(),
    };
    userClients.add(entry);

    logger.debug(
      `[SSE] Client connected: userId=${userId}. Active connections for user: ${userClients.size}`
    );

    // Recommend browser retry delay (5s) + initial connection acknowledgment
    try {
      res.write(`retry: 5000\n`);
      res.write(
        `event: connected\ndata: ${JSON.stringify({
          status: 'connected',
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    } catch {
      this.removeClientEntry(userId, entry);
      return;
    }

    res.on('close', () => {
      this.removeClientEntry(userId, entry);
    });
  }

  /**
   * Unregister an SSE connection by Response reference (backward compatible).
   */
  removeClient(userId: string, res: Response): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    for (const entry of userClients) {
      if (entry.res === res) {
        userClients.delete(entry);
        break;
      }
    }

    if (userClients.size === 0) {
      this.clients.delete(userId);
    }
    logger.debug(`[SSE] Client disconnected: userId=${userId}`);
  }

  private removeClientEntry(userId: string, entry: SseClientConnection): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;
    userClients.delete(entry);
    if (userClients.size === 0) {
      this.clients.delete(userId);
    }
  }

  /**
   * Push a real-time SSE frame strictly to a specific authenticated user.
   * Attaches SSE `id:` when provided (or generated) to support `Last-Event-ID` recovery.
   */
  broadcastToUser(
    userId: string,
    eventName: string,
    data: unknown,
    eventId?: string
  ): number {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return 0;
    }

    const frameId = eventId || `sse-${Date.now()}-${++this.eventSeq}`;
    const payload = `id: ${frameId}\nevent: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    let deliveredSockets = 0;
    for (const entry of Array.from(userClients)) {
      try {
        entry.res.write(payload);
        deliveredSockets++;
      } catch (err) {
        logger.error(`[SSE] Error broadcasting to client for userId=${userId}:`, err);
        this.removeClientEntry(userId, entry);
      }
    }

    return deliveredSockets;
  }

  /**
   * Gracefully terminates all active SSE streams for a user (e.g., on logout or session expiration).
   */
  disconnectUser(userId: string, reason = 'SESSION_EXPIRED'): number {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return 0;
    }

    let closedCount = 0;
    for (const entry of Array.from(userClients)) {
      try {
        entry.res.write(
          `event: session_expired\ndata: ${JSON.stringify({
            reason,
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
        entry.res.end();
      } catch {
        // ignore broken socket
      }
      closedCount++;
    }

    this.clients.delete(userId);
    return closedCount;
  }

  /**
   * Close all streams cleanly during API server graceful shutdown.
   */
  closeAll(): void {
    for (const [userId] of Array.from(this.clients.entries())) {
      this.disconnectUser(userId, 'SERVER_SHUTDOWN');
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      const pingPayload = `: ping ${new Date().toISOString()}\n\n`;
      this.clients.forEach((clientSet, userId) => {
        clientSet.forEach((entry) => {
          try {
            entry.res.write(pingPayload);
          } catch {
            this.removeClientEntry(userId, entry);
          }
        });
      });
    }, HEARTBEAT_INTERVAL_MS);

    // Ensure heartbeat timer never prevents clean process/test shutdown
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  getConnectedUserCount(): number {
    return this.clients.size;
  }

  getActiveConnectionCount(): number {
    let total = 0;
    this.clients.forEach((set) => {
      total += set.size;
    });
    return total;
  }

  getMetrics() {
    return {
      connectedUsers: this.getConnectedUserCount(),
      activeConnections: this.getActiveConnectionCount(),
      maxConnectionsPerUser: MAX_CONNECTIONS_PER_USER,
      heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
    };
  }
}

export const notificationStreamService = new NotificationStreamService();
