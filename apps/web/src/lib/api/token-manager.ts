/**
 * HealthBridge India — In-Memory Access Token Manager
 *
 * Security Invariants:
 * 1. ONLY stores short-lived JWT access tokens (15-min lifetime) in private memory closure.
 * 2. NEVER writes refresh tokens to localStorage or sessionStorage (strictly prevents XSS token theft).
 * 3. Provides unified interface for Axios interceptors, Auth Provider, and SSE Stream.
 */

let inMemoryAccessToken: string | null = null;

export const tokenManager = {
  /**
   * Returns active access token from memory, or null if unauthenticated.
   */
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  /**
   * Sets new access token in memory upon login or refresh.
   */
  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token || null;
  },

  /**
   * Wipes in-memory token on logout or session expiration.
   */
  clearAccessToken(): void {
    inMemoryAccessToken = null;
  },

  /**
   * Check if token is currently held in memory.
   */
  hasAccessToken(): boolean {
    return Boolean(inMemoryAccessToken);
  },
};
