/**
 * HealthBridge India — Input Security, NoSQL Injection & HPP Guards (Day 9 Task 01)
 *
 * Defends every Express API endpoint against:
 *   1. NoSQL operator injection (keys starting with '$' such as $gt, $ne, $where, $regex)
 *   2. Prototype pollution (__proto__, constructor, prototype)
 *   3. HTTP Parameter Pollution (HPP) on scalar query parameters
 *   4. Mass assignment (pickAllowedFields allowlist helper)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { securityAuditMonitor } from './security-audit.monitor';

const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const SCALAR_QUERY_PARAMS = new Set([
  'page',
  'limit',
  'q',
  'search',
  'sortBy',
  'sortOrder',
  'status',
  'readStatus',
  'category',
  'from',
  'to',
  'patientId',
  'doctorId',
  'pharmacyId',
  'laboratoryId',
]);

/**
 * Recursively detects MongoDB operator keys ('$...') or prototype pollution keys.
 * Returns the first offending key path or null if clean.
 */
export function detectUnsafeObjectKeys(
  value: unknown,
  path = '',
  depth = 0
): string | null {
  if (depth > 15 || value === null || typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = detectUnsafeObjectKeys(value[i], `${path}[${i}]`, depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (key.startsWith('$') || PROTOTYPE_POLLUTION_KEYS.has(key)) {
      return keyPath;
    }
    const hit = detectUnsafeObjectKeys(record[key], keyPath, depth + 1);
    if (hit) return hit;
  }

  return null;
}

/**
 * Middleware: Rejects requests containing NoSQL operator injection keys ('$...') or
 * prototype pollution keys in req.body, req.query, or req.params with 400 BAD_REQUEST.
 */
export const nosqlSanitizerMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const targets: Array<{ location: string; payload: unknown }> = [
    { location: 'body', payload: req.body },
    { location: 'query', payload: req.query },
    { location: 'params', payload: req.params },
  ];

  for (const target of targets) {
    const unsafeKey = detectUnsafeObjectKeys(target.payload, target.location);
    if (unsafeKey) {
      void securityAuditMonitor.record({
        actorId: req.user?.userId,
        actorRole: req.user?.role || 'ANONYMOUS',
        action: 'NOSQL_INJECTION_BLOCKED',
        resourceType: 'API_INPUT',
        resourceId: req.path,
        requestId: req.requestId,
        outcome: 'BLOCKED',
        metadata: { location: target.location, method: req.method },
      });

      return next(
        AppError.badRequest(
          'Invalid request payload: prohibited operator or reserved property name detected.'
        )
      );
    }
  }

  next();
};

/**
 * Middleware: Prevents HTTP Parameter Pollution (HPP) on well-known scalar query parameters
 * by collapsing repeated scalar values (?page=1&page=2) deterministically to the first value.
 */
export const hppGuardMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      const val = req.query[key];
      if (Array.isArray(val) && SCALAR_QUERY_PARAMS.has(key)) {
        req.query[key] = val[0];
      }
    }
  }
  next();
};

/**
 * Mass-Assignment Defense: Extracts strictly allowlisted keys from untrusted input objects.
 * Never passes raw req.body directly into Mongoose update operations.
 */
export function pickAllowedFields<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  allowedKeys: ReadonlyArray<K>
): Partial<Pick<T, K>> {
  const result: Partial<Pick<T, K>> = {};
  if (!source || typeof source !== 'object') {
    return result;
  }

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  return result;
}
