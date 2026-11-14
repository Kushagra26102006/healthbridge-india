import { Response } from 'express';
import { logger } from '../../../config/logger';

export class NotificationStreamService {
  // Map of userId -> Set of active SSE HTTP response connections
  private clients: Map<string, Set<Response>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Register a new SSE connection for an authenticated user
   */
  addClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);

    logger.debug(`[SSE] Client connected: userId=${userId}. Active connections for user: ${this.clients.get(userId)!.size}`);

    // Initial connection acknowledgment
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // Remove client on connection termination
    res.on('close', () => {
      this.removeClient(userId, res);
    });
  }

  /**
   * Unregister an SSE connection
   */
  removeClient(userId: string, res: Response): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
    logger.debug(`[SSE] Client disconnected: userId=${userId}`);
  }

  /**
   * Push a real-time event to a specific authenticated user
   */
  broadcastToUser(userId: string, eventName: string, data: unknown): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return;
    }

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    userClients.forEach((client) => {
      try {
        client.write(payload);
      } catch (err) {
        logger.error(`[SSE] Error broadcasting to client for userId=${userId}:`, err);
        userClients.delete(client);
      }
    });
  }

  /**
   * Heartbeat to prevent proxies and NAT gateways from closing idle connections
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      const pingPayload = `: ping ${new Date().toISOString()}\n\n`;
      this.clients.forEach((clientSet) => {
        clientSet.forEach((client) => {
          try {
            client.write(pingPayload);
          } catch {
            // Broken connection will trigger 'close' event
          }
        });
      });
    }, 25000); // 25-second interval standard for HTTP streaming
  }

  /**
   * Return number of active connected users
   */
  getConnectedUserCount(): number {
    return this.clients.size;
  }
}

export const notificationStreamService = new NotificationStreamService();
