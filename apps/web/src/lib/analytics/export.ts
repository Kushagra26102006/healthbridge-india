/**
 * HealthBridge India — Analytics Filtering, Time-Series Bucketing & Safe Export Utilities
 *
 * Security invariants:
 * - Neutralizes CSV formula injection (`=`, `+`, `-`, `@`, `\t`, `\r`) on every exported cell.
 * - Operates strictly on already-authorized, role-scoped, zero-PII aggregate or self-owned records.
 * - Never fabricates synthetic data points when source records are empty.
 */

export type AnalyticsTimeframe = 'all' | 'weekly' | 'monthly' | 'yearly';

export interface TimeSeriesPoint {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Neutralize spreadsheet formula injection and format RFC-4180 CSV cell safely.
 */
export function sanitizeCsvCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).replace(/\r?\n/g, ' ').trim();
  if (FORMULA_PREFIX.test(str)) {
    str = `'${str}`;
  }
  if (/[",]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvContent<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const headerLine = columns.map((c) => sanitizeCsvCell(c.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((c) => sanitizeCsvCell(c.accessor(row))).join(',')
  );
  return `\uFEFF${[headerLine, ...dataLines].join('\n')}`;
}

export function downloadAnalyticsCsv<T>(options: {
  filename: string;
  columns: CsvColumn<T>[];
  rows: T[];
}): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const csv = buildCsvContent(options.columns, options.rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', safeName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function triggerPrintableReport(): boolean {
  if (typeof window === 'undefined' || typeof window.print !== 'function') return false;
  window.print();
  return true;
}

/**
 * Filter real dated records by timeframe preset or custom [fromDate, toDate] range.
 */
export function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => string | Date | undefined | null,
  timeframe: AnalyticsTimeframe,
  fromDate?: string,
  toDate?: string,
  now: Date = new Date()
): T[] {
  const fromTs = fromDate ? new Date(`${fromDate}T00:00:00.000Z`).getTime() : null;
  const toTs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : null;

  let presetCutoff: number | null = null;
  if (!fromTs && timeframe !== 'all') {
    const msPerDay = 86_400_000;
    if (timeframe === 'weekly') presetCutoff = now.getTime() - 7 * msPerDay;
    else if (timeframe === 'monthly') presetCutoff = now.getTime() - 30 * msPerDay;
    else if (timeframe === 'yearly') presetCutoff = now.getTime() - 365 * msPerDay;
  }

  return items.filter((item) => {
    const raw = getDate(item);
    if (!raw) return timeframe === 'all' && !fromTs && !toTs;
    const ts = new Date(raw).getTime();
    if (Number.isNaN(ts)) return false;
    if (presetCutoff !== null && ts < presetCutoff) return false;
    if (fromTs !== null && !Number.isNaN(fromTs) && ts < fromTs) return false;
    if (toTs !== null && !Number.isNaN(toTs) && ts > toTs) return false;
    return true;
  });
}

/**
 * Group real dated records into chronological buckets for Line / Area / Bar charts.
 * Returns empty array if no dated records exist (never invents synthetic points).
 */
export function bucketTimeSeries<T>(
  items: T[],
  getDate: (item: T) => string | Date | undefined | null,
  timeframe: AnalyticsTimeframe
): TimeSeriesPoint[] {
  if (!items.length) return [];

  const buckets = new Map<string, { label: string; count: number; sortKey: string }>();

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;

    let key: string;
    let label: string;

    if (timeframe === 'yearly' || timeframe === 'all') {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      key = `${y}-${m}`;
      label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    } else {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      key = `${y}-${m}-${day}`;
      label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }

    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { label, count: 1, sortKey: key });
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-12)
    .map((b) => ({
      key: b.sortKey,
      label: b.label,
      value: b.count,
    }));
}
