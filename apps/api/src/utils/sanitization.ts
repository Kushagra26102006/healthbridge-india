/**
 * Data and Query Sanitization Utilities for HealthBridge India
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitizes objects to prevent MongoDB query operator injection ($where, $ne, $regex, etc.)
 * and prototype pollution.
 */
export const sanitizeMongoQuery = <T = unknown>(target: unknown): T => {
  if (target === null || typeof target !== 'object') {
    return target as T;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeMongoQuery(item)) as unknown as T;
  }

  const cleanObject: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(target as Record<string, unknown>)) {
    // Block prototype pollution
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }

    // Strip keys starting with '$' or containing '.' (MongoDB operator injection / traversal)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    cleanObject[key] = sanitizeMongoQuery(value);
  }

  return cleanObject as T;
};

/**
 * Escapes special regex characters in search strings to prevent ReDoS or injection
 */
export const sanitizeRegexPattern = (pattern: string): string => {
  if (typeof pattern !== 'string') return '';
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};

/**
 * Strips null bytes and invisible control characters from string input
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') return '';
  // Remove null bytes and non-printable ASCII control characters (keep standard whitespace)
  return value.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
};
