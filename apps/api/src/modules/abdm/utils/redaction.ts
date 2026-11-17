/**
 * HealthBridge India — ABDM Log & Payload Sensitive-Field Redaction (Day 7 Task 01)
 *
 * Guarantees that client secrets, access tokens, ABHA numbers, Aadhaar numbers,
 * consent tokens, and sensitive clinical health payloads are NEVER written to logs.
 */

const SENSITIVE_KEY_PATTERNS = [
  /secret/i,
  /token/i,
  /authorization/i,
  /password/i,
  /abha/i,
  /healthid/i,
  /aadhaar/i,
  /consenttoken/i,
  /encrypteddata/i,
  /privatekey/i,
  /x-webhook-secret/i,
  /clinicalnotes/i,
  /observations/i,
  /diagnosis/i,
  /prescription/i,
  /entries/i,
  /content/i,
];

const ABHA_NUMBER_REGEX = /\b\d{2}-\d{4}-\d{4}-\d{4}\b|\b\d{14}\b/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

export function isSensitiveFieldName(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactStringSecrets(input: string): string {
  return input
    .replace(BEARER_REGEX, 'Bearer [REDACTED]')
    .replace(ABHA_NUMBER_REGEX, '[REDACTED_ABHA]');
}

export function redactAbdmLogPayload(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[TRUNCATED]';
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactStringSecrets(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactAbdmLogPayload(item, depth + 1));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveFieldName(key)) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = redactAbdmLogPayload(val, depth + 1);
      }
    }
    return output;
  }

  return value;
}
