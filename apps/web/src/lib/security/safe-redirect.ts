/**
 * HealthBridge India — Frontend Safe Redirect Validator (Day 9 Task 01)
 *
 * Prevents Open Redirect vulnerabilities (CWE-601) by strictly permitting only
 * same-origin relative application paths starting with a single '/'.
 */

const DEFAULT_FALLBACK_PATH = '/dashboard';

export function sanitizeRedirectPath(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK_PATH
): string {
  if (!candidate || typeof candidate !== 'string') {
    return fallback;
  }

  const trimmed = candidate.trim();

  // Reject empty, protocol-relative (//evil.com), absolute URLs (https://...), backslashes,
  // javascript:/data: schemes, or control characters
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    /[\u0000-\u001F\u007F]/.test(trimmed) ||
    /^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}
