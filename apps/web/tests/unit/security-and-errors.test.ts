import { sanitizeRedirectPath } from '@/lib/security/safe-redirect';
import { mapApiErrorToUserError } from '@/lib/errors/user-error-mapper';
import {
  sanitizeCsvCell,
  buildCsvContent,
  filterByDateRange,
} from '@/lib/analytics/export';

describe('Frontend Security Utilities — sanitizeRedirectPath (CWE-601)', () => {
  it('permits valid same-origin relative application routes', () => {
    expect(sanitizeRedirectPath('/patient/dashboard')).toBe('/patient/dashboard');
    expect(sanitizeRedirectPath('/doctor/appointments?status=CONFIRMED')).toBe(
      '/doctor/appointments?status=CONFIRMED'
    );
    expect(sanitizeRedirectPath('  /admin/audit-logs  ')).toBe('/admin/audit-logs');
  });

  it('rejects open redirects, protocol-relative URLs, backslash bypasses, and script schemes', () => {
    const attacks = [
      'https://evil.example.com/phish',
      'http://evil.example.com',
      '//evil.example.com/login',
      '/\\evil.example.com',
      '/javascript:alert(1)',
      '/data:text/html,<script>alert(1)</script>',
      '/dashboard\r\nSet-Cookie: hacked=1',
      '',
      null,
      undefined,
    ];

    for (const candidate of attacks) {
      expect(sanitizeRedirectPath(candidate)).toBe('/dashboard');
    }
  });

  it('respects custom safe fallback path when input is unsafe', () => {
    expect(sanitizeRedirectPath('//malicious.test', '/login')).toBe('/login');
  });
});

describe('Frontend Error Normalization — mapApiErrorToUserError', () => {
  it('maps network failures to recoverable NETWORK error without leaking internals', () => {
    const normalized = mapApiErrorToUserError({ code: 'ERR_NETWORK', message: 'Network Error' });
    expect(normalized.category).toBe('NETWORK');
    expect(normalized.canRetry).toBe(true);
    expect(normalized.requiresReauth).toBe(false);
  });

  it('maps 401 responses to SESSION_EXPIRED requiring re-authentication', () => {
    const normalized = mapApiErrorToUserError({ response: { status: 401 } });
    expect(normalized.category).toBe('SESSION_EXPIRED');
    expect(normalized.requiresReauth).toBe(true);
    expect(normalized.canRetry).toBe(false);
  });

  it('maps 403 responses to FORBIDDEN and strips unsafe internal stack/DB errors', () => {
    const safeForbidden = mapApiErrorToUserError({
      response: { status: 403, data: { message: 'Active patient consent required.' } },
    });
    expect(safeForbidden.category).toBe('FORBIDDEN');
    expect(safeForbidden.message).toBe('Active patient consent required.');

    const unsafeDbLeak = mapApiErrorToUserError({
      response: {
        status: 403,
        data: { message: 'MongoServerError: Cast to ObjectId failed at stack line 42' },
      },
    });
    expect(unsafeDbLeak.message).not.toContain('MongoServerError');
    expect(unsafeDbLeak.message).not.toContain('ObjectId');
  });

  it('maps 404, 409, 422, 429, and 500 statuses appropriately', () => {
    expect(mapApiErrorToUserError({ response: { status: 404 } }).category).toBe('NOT_FOUND');
    expect(mapApiErrorToUserError({ response: { status: 409 } }).category).toBe('CONFLICT');
    expect(mapApiErrorToUserError({ response: { status: 422 } }).category).toBe('VALIDATION');
    expect(mapApiErrorToUserError({ response: { status: 429 } }).category).toBe('RATE_LIMITED');
    const serverErr = mapApiErrorToUserError({ response: { status: 500 } });
    expect(serverErr.category).toBe('SERVER_ERROR');
    expect(serverErr.canRetry).toBe(true);
  });
});

describe('Frontend Analytics Export — CSV Formula Injection Neutralization & Date Filtering', () => {
  it('prefixes dangerous spreadsheet formula cells (=, +, -, @, tab) with a single quote', () => {
    expect(sanitizeCsvCell('=CMD("calc")')).toBe(`"'=CMD(""calc"")"`);
    expect(sanitizeCsvCell('+1+1')).toBe(`'+1+1`);
    expect(sanitizeCsvCell('-SUM(A1:A2)')).toBe(`'-SUM(A1:A2)`);
    expect(sanitizeCsvCell('@HYPERLINK("http://evil")')).toBe(`"'@HYPERLINK(""http://evil"")"`);
    expect(sanitizeCsvCell('Safe Label')).toBe('Safe Label');
    expect(sanitizeCsvCell(null)).toBe('');
  });

  it('builds UTF-8 BOM RFC-4180 CSV with safe escaped columns', () => {
    const csv = buildCsvContent(
      [
        { header: 'Metric', accessor: (r: { name: string; count: number }) => r.name },
        { header: 'Count', accessor: (r: { name: string; count: number }) => r.count },
      ],
      [
        { name: 'Appointments, Completed', count: 14 },
        { name: '=2+2', count: 4 },
      ]
    );

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Appointments, Completed",14');
    expect(csv).toContain("'=2+2,4");
  });

  it('filters records accurately by custom [fromDate, toDate] range', () => {
    const rows = [
      { id: '1', date: '2026-01-10T10:00:00.000Z' },
      { id: '2', date: '2026-02-15T10:00:00.000Z' },
      { id: '3', date: '2026-03-20T10:00:00.000Z' },
    ];

    const filtered = filterByDateRange(
      rows,
      (item) => item.date,
      'all',
      '2026-02-01',
      '2026-02-28'
    );
    expect(filtered.map((r) => r.id)).toEqual(['2']);
  });
});
