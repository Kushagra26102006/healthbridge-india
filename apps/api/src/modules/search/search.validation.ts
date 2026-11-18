/**
 * HealthBridge India — Search Query Sanitization, Escaping & Relevance Scoring (Day 8 Task 02)
 */

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

// Patterns that MUST NEVER be stored even in ephemeral session-only recent search history
const SENSITIVE_HISTORY_PATTERNS: RegExp[] = [
  /\b\d{2}-\d{4}-\d{4}-\d{4}\b/, // 14-digit ABHA number
  /\b\d{14}\b/,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // 12-digit Aadhaar number
  /\b(?:password|secret|token|bearer|otp|privatekey)\b/i,
  /\b(?:hiv|aids|cancer|depression|suicid|abortion|psychiatric|std|sti|pregnancy)\b/i,
];

/**
 * Strips control characters, collapses whitespace, and caps length at 100 chars.
 */
export function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(CONTROL_CHARS_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Escapes all RegExp metacharacters to prevent ReDoS or regex injection attacks.
 */
export function escapeRegexSpecialChars(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a bounded, case-insensitive RegExp from a sanitized search query.
 */
export function buildSafeContainsRegex(query: string): RegExp {
  const escaped = escapeRegexSpecialChars(sanitizeSearchQuery(query));
  return new RegExp(escaped, 'i');
}

/**
 * Builds a prefix-anchored RegExp (`^...`) which can leverage B-tree MongoDB indexes.
 */
export function buildSafePrefixRegex(query: string): RegExp {
  const escaped = escapeRegexSpecialChars(sanitizeSearchQuery(query));
  return new RegExp(`^${escaped}`, 'i');
}

/**
 * Detects whether a search query contains sensitive identifiers, credentials, or sensitive
 * clinical terms that must NOT be retained in recent search history.
 */
export function isSensitiveHistoryQuery(query: string): boolean {
  const clean = sanitizeSearchQuery(query);
  if (!clean) return true;
  return SENSITIVE_HISTORY_PATTERNS.some((pattern) => pattern.test(clean));
}

/**
 * Deterministic relevance score:
 *   - Exact match on reference or title -> 100
 *   - Prefix match -> 80
 *   - Partial substring match on title -> 60
 *   - Substring match on description/metadata -> 40
 */
export function computeMatchScore(
  query: string,
  primaryTitle: string,
  exactIdentifiers: Array<string | undefined> = [],
  secondaryText = ''
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  for (const ident of exactIdentifiers) {
    if (ident && ident.trim().toLowerCase() === q) {
      return 100;
    }
  }

  const titleLower = primaryTitle.trim().toLowerCase();
  if (titleLower === q) return 95;
  if (titleLower.startsWith(q)) return 80;
  if (titleLower.includes(q)) return 60;

  if (secondaryText.toLowerCase().includes(q)) return 40;
  return 20;
}
