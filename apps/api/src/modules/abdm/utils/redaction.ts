/**
 * HealthBridge India — ABDM Log & Payload Sensitive-Field Redaction (Day 7 Tasks 01 & 02)
 *
 * Guarantees that client secrets, access tokens, X-Tokens, OTP values, Aadhaar numbers,
 * full ABHA numbers, consent tokens, and sensitive clinical health payloads are NEVER written to logs.
 */

const SENSITIVE_KEY_PATTERNS = [
  /secret/i,
  /token/i,
  /authorization/i,
  /password/i,
  /abha/i,
  /healthid/i,
  /aadhaar/i,
  /otp/i,
  /loginid/i,
  /x-token/i,
  /consenttoken/i,
  /encrypteddata/i,
  /encryptedfhirbundle/i,
  /encryptedpayload/i,
  /encryptedsensitivepayload/i,
  /ciphertext/i,
  /privatekey/i,
  /dhprivatekey/i,
  /sharedsecret/i,
  /symmetrickey/i,
  /rawbundle/i,
  /x-webhook-secret/i,
  /clinicalnotes/i,
  /observations/i,
  /diagnosis/i,
  /prescription/i,
  /entries/i,
  /content/i,
];

const ABHA_NUMBER_REGEX = /(?<![0-9a-fA-F-])(?:\d{2}-\d{4}-\d{4}-\d{4}|\d{14})(?![0-9a-fA-F-])/g;
const AADHAAR_NUMBER_REGEX = /(?<![0-9a-fA-F-])(?:\d{4}[\s-]\d{4}[\s-]\d{4}|\d{12})(?![0-9a-fA-F-])/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const OTP_PHRASE_REGEX = /\b(otp|otpValue)\s*[:=]\s*["']?\d{4,8}["']?/gi;

export function isSensitiveFieldName(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function normalizeAbhaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 14) {
    return raw.trim();
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
}

export function maskAbhaNumber(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 14) {
    return 'XX-XXXX-XXXX-XXXX';
  }
  return `${digits.slice(0, 2)}-XXXX-XXXX-${digits.slice(10, 14)}`;
}

export function maskAbhaAddress(address?: string | null): string | undefined {
  if (!address) return undefined;
  const trimmed = address.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!local) return '***';
  const maskedLocal =
    local.length <= 3 ? `${local[0]}***` : `${local.slice(0, 2)}***${local.slice(-1)}`;
  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

export function redactStringSecrets(input: string): string {
  return input
    .replace(BEARER_REGEX, 'Bearer [REDACTED]')
    .replace(OTP_PHRASE_REGEX, '$1=[REDACTED_OTP]')
    .replace(ABHA_NUMBER_REGEX, '[REDACTED_ABHA]')
    .replace(AADHAAR_NUMBER_REGEX, '[REDACTED_AADHAAR]');
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
