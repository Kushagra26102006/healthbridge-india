/**
 * HealthBridge India — Secure Fetch-Based SSE Stream Connection
 *
 * Provides a standards-compliant EventTarget stream client powered by the Fetch API.
 * Overcomes native browser EventSource limitations:
 * 1. Securely transmits `Authorization: Bearer <token>` in HTTP headers without URL parameter leakage.
 * 2. Supports `credentials: 'include'` for cross-origin HttpOnly cookies.
 * 3. Handles 401 Unauthorized cleanly by triggering token refresh or gracefully degrading to polling,
 *    preventing endless unauthenticated reconnect storms.
 */

import { tokenManager } from '@/lib/api-client';

export type SseEventHandler = (event: MessageEvent) => void;

export interface SseClientOptions {
  url: string;
  onConnected?: () => void;
  onError?: (error?: unknown) => void;
  onUnauthorized?: () => void;
}

export class FetchSseClient {
  private url: string;
  private abortController: AbortController | null = null;
  private listeners = new Map<string, Set<SseEventHandler>>();
  private isClosed = false;
  private retryCount = 0;
  private maxRetries = 3;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventId: string | null = null;
  public readyState: number = 0; // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED

  constructor(options: SseClientOptions) {
    this.url = options.url;
    if (options.onConnected) this.addEventListener('connected', options.onConnected);
    if (options.onError) this.addEventListener('error', options.onError);
    if (options.onUnauthorized) this.addEventListener('session_expired', options.onUnauthorized);
  }

  public addEventListener(type: string, handler: SseEventHandler): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  public removeEventListener(type: string, handler: SseEventHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  private dispatchEvent(type: string, data = '', eventId?: string): void {
    const handlers = this.listeners.get(type);
    if (!handlers || handlers.size === 0) return;

    const event = new MessageEvent(type, {
      data,
      lastEventId: eventId || this.lastEventId || '',
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    });

    handlers.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // Suppress listener error from breaking event loop
      }
    });
  }

  public start(): void {
    if (this.isClosed) return;
    this.connect();
  }

  private async connect(): Promise<void> {
    if (this.isClosed) return;

    this.readyState = 0; // CONNECTING
    this.abortController = new AbortController();

    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    };

    const token = tokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.lastEventId) {
      headers['Last-Event-ID'] = this.lastEventId;
    }

    try {
      const response = await fetch(this.url, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: this.abortController.signal,
      });

      if (response.status === 401 || response.status === 403) {
        this.readyState = 2; // CLOSED
        this.dispatchEvent('session_expired');
        this.dispatchEvent('error', JSON.stringify({ status: response.status, message: 'Unauthorized' }));
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(`SSE stream failed with status ${response.status}`);
      }

      this.readyState = 1; // OPEN
      this.retryCount = 0;
      this.dispatchEvent('connected');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (!this.isClosed) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const block of parts) {
          this.parseBlock(block);
        }
      }
    } catch (err: unknown) {
      if (this.isClosed) return;

      this.readyState = 2; // CLOSED
      this.dispatchEvent('error', err instanceof Error ? err.message : 'Connection failed');

      // Controlled exponential backoff reconnect if not exceeded
      if (this.retryCount < this.maxRetries) {
        this.retryCount += 1;
        const delay = Math.min(2000 * Math.pow(2, this.retryCount - 1), 15000);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }
    }
  }

  private parseBlock(block: string): void {
    const lines = block.split('\n');
    let eventType = 'message';
    let data = '';
    let id: string | undefined;

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data += (data ? '\n' : '') + line.slice(5).trim();
      } else if (line.startsWith('id:')) {
        id = line.slice(3).trim();
        this.lastEventId = id;
      }
    }

    if (data || eventType !== 'message') {
      this.dispatchEvent(eventType, data, id);
    }
  }

  public close(): void {
    this.isClosed = true;
    this.readyState = 2; // CLOSED
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.listeners.clear();
  }
}
