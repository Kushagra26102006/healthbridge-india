import { describe, it, expect } from 'vitest';
import {
  sanitizeMongoQuery,
  sanitizeRegexPattern,
  sanitizeString,
} from '../../src/utils/sanitization';

describe('Sanitization Utilities Unit Tests', () => {
  it('should strip keys starting with $ (MongoDB query operator injection)', () => {
    const maliciousInput = {
      username: 'doctor1',
      $where: 'this.password.length > 0',
      nested: {
        $ne: null,
        validKey: 'safeValue',
      },
    };

    const sanitized: any = sanitizeMongoQuery(maliciousInput);

    expect(sanitized.username).toBe('doctor1');
    expect(sanitized.$where).toBeUndefined();
    expect(sanitized.nested.$ne).toBeUndefined();
    expect(sanitized.nested.validKey).toBe('safeValue');
  });

  it('should strip keys containing dot notation to prevent traversal injection', () => {
    const input = {
      'profile.salary': 100000,
      safeKey: 'valid',
    };

    const sanitized: any = sanitizeMongoQuery(input);
    expect(sanitized['profile.salary']).toBeUndefined();
    expect(sanitized.safeKey).toBe('valid');
  });

  it('should protect against prototype pollution attack vectors', () => {
    const input = JSON.parse('{"__proto__": {"isAdmin": true}, "name": "attacker"}');
    const sanitized: any = sanitizeMongoQuery(input);

    expect(Object.prototype.hasOwnProperty.call(sanitized, '__proto__')).toBe(false);
    expect(({} as any).isAdmin).toBeUndefined();
    expect(sanitized.name).toBe('attacker');
  });

  it('should escape regex special characters', () => {
    const raw = 'apollo-hospital+clinic? (central) [tier-1]';
    const escaped = sanitizeRegexPattern(raw);
    expect(escaped).toBe('apollo-hospital\\+clinic\\? \\(central\\) \\[tier-1\\]');
  });

  it('should sanitize strings by stripping null bytes and non-printable control characters', () => {
    const raw = 'Dr. Rajesh\0\x07 Verma';
    const sanitized = sanitizeString(raw);
    expect(sanitized).toBe('Dr. Rajesh Verma');
  });
});
