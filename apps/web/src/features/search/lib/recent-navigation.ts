/**
 * HealthBridge India — Privacy-Safe Recent Navigation & Term Highlighting (Phase 15)
 *
 * Privacy Guarantees:
 * - Uses sessionStorage only (auto-cleared on tab/browser close), keyed strictly per userId.
 * - Strips query strings and hashes; never stores dynamic resource IDs (Mongo ObjectIds / UUIDs)
 *   so sensitive patient/record/report identifiers never persist in client storage.
 * - Provides an explicit user-controlled search & navigation history toggle.
 * - Provides ReDoS-safe, XSS-safe (no dangerouslySetInnerHTML) match highlighting.
 */

export interface RecentPageEntry {
  path: string;
  label: string;
  section: string;
  visitedAt: number;
}

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

const MAX_RECENT_PAGES = 6;
const RECENT_PAGES_PREFIX = 'hb_recent_pages_v1:';
const HISTORY_ENABLED_PREFIX = 'hb_search_history_enabled_v1:';

const PORTAL_PREFIXES = ['/patient', '/doctor', '/pharmacy', '/laboratory', '/admin'] as const;

const OBJECT_ID_OR_UUID_SEGMENT =
  /^([0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{6,})$/i;

const KNOWN_ROUTE_LABELS: Record<string, { label: string; section: string }> = {
  '/patient/dashboard': { label: 'Patient Overview', section: 'Patient' },
  '/patient/appointments': { label: 'My Appointments', section: 'Patient' },
  '/patient/appointments/book': { label: 'Book Appointment', section: 'Patient' },
  '/patient/records': { label: 'Health Records', section: 'Patient' },
  '/patient/prescriptions': { label: 'Prescriptions', section: 'Patient' },
  '/patient/lab-reports': { label: 'Lab Reports', section: 'Patient' },
  '/patient/lab-orders': { label: 'Lab Orders', section: 'Patient' },
  '/patient/orders': { label: 'Pharmacy Orders', section: 'Patient' },
  '/patient/consent': { label: 'Consent & Data Sharing', section: 'Patient' },
  '/patient/abha': { label: 'ABHA Health ID', section: 'Patient' },
  '/patient/analytics': { label: 'Health Analytics', section: 'Patient' },
  '/patient/notifications': { label: 'Notifications', section: 'Patient' },
  '/patient/settings': { label: 'Account Settings', section: 'Patient' },
  '/doctor/dashboard': { label: 'Doctor Overview', section: 'Doctor' },
  '/doctor/queue': { label: 'Patient Queue', section: 'Doctor' },
  '/doctor/appointments': { label: 'Appointments', section: 'Doctor' },
  '/doctor/patients': { label: 'My Patients', section: 'Doctor' },
  '/doctor/encounters': { label: 'Consultations', section: 'Doctor' },
  '/doctor/encounters/new': { label: 'New Consultation', section: 'Doctor' },
  '/doctor/prescriptions': { label: 'Prescriptions', section: 'Doctor' },
  '/doctor/prescriptions/new': { label: 'Write Prescription', section: 'Doctor' },
  '/doctor/schedule': { label: 'Clinic Schedule', section: 'Doctor' },
  '/doctor/analytics': { label: 'Clinical Analytics', section: 'Doctor' },
  '/doctor/notifications': { label: 'Notifications', section: 'Doctor' },
  '/doctor/settings': { label: 'Doctor Settings', section: 'Doctor' },
  '/pharmacy/dashboard': { label: 'Pharmacy Overview', section: 'Pharmacy' },
  '/pharmacy/prescriptions': { label: 'Prescription Queue', section: 'Pharmacy' },
  '/pharmacy/inventory': { label: 'Medicine Inventory', section: 'Pharmacy' },
  '/pharmacy/inventory/alerts': { label: 'Low Stock & Expiry Alerts', section: 'Pharmacy' },
  '/pharmacy/inventory/medicines': { label: 'Medicine Catalogue', section: 'Pharmacy' },
  '/pharmacy/dispensing': { label: 'Dispensing Desk', section: 'Pharmacy' },
  '/pharmacy/orders': { label: 'Medicine Orders', section: 'Pharmacy' },
  '/pharmacy/purchases': { label: 'Purchase Orders', section: 'Pharmacy' },
  '/pharmacy/suppliers': { label: 'Suppliers', section: 'Pharmacy' },
  '/pharmacy/analytics': { label: 'Pharmacy Analytics', section: 'Pharmacy' },
  '/pharmacy/notifications': { label: 'Notifications', section: 'Pharmacy' },
  '/pharmacy/settings': { label: 'Pharmacy Settings', section: 'Pharmacy' },
  '/laboratory/dashboard': { label: 'Laboratory Overview', section: 'Laboratory' },
  '/laboratory/orders': { label: 'Lab Test Orders', section: 'Laboratory' },
  '/laboratory/samples': { label: 'Sample Tracking', section: 'Laboratory' },
  '/laboratory/samples/scan': { label: 'Scan Sample Barcode', section: 'Laboratory' },
  '/laboratory/samples/collect': { label: 'Sample Collection', section: 'Laboratory' },
  '/laboratory/reports': { label: 'Diagnostic Reports', section: 'Laboratory' },
  '/laboratory/tests': { label: 'Test Catalogue', section: 'Laboratory' },
  '/laboratory/quality': { label: 'Quality Control', section: 'Laboratory' },
  '/laboratory/quality/analytics': { label: 'Quality & TAT Analytics', section: 'Laboratory' },
  '/laboratory/inventory/reagents': { label: 'Reagent Inventory', section: 'Laboratory' },
  '/laboratory/notifications': { label: 'Notifications', section: 'Laboratory' },
  '/laboratory/settings': { label: 'Laboratory Settings', section: 'Laboratory' },
  '/admin/dashboard': { label: 'Admin Overview', section: 'Admin' },
  '/admin/platform-overview': { label: 'Platform Overview', section: 'Admin' },
  '/admin/roles': { label: 'Role & Access Control', section: 'Admin' },
  '/admin/consent-oversight': { label: 'Consent Oversight', section: 'Admin' },
  '/admin/audit-logs': { label: 'Audit Logs', section: 'Admin' },
  '/admin/security/overview': { label: 'Security Overview', section: 'Admin' },
  '/admin/security/alerts': { label: 'Security Alerts', section: 'Admin' },
  '/admin/security/incidents': { label: 'Security Incidents', section: 'Admin' },
  '/admin/security/data-protection': { label: 'Data Protection', section: 'Admin' },
  '/admin/system-monitoring': { label: 'System Monitoring', section: 'Admin' },
  '/admin/integrations/abdm': { label: 'ABDM Integration', section: 'Admin' },
  '/admin/notifications': { label: 'Notifications', section: 'Admin' },
  '/admin/settings': { label: 'Admin Settings', section: 'Admin' },
};

function getSafeStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function sanitizeNavigationPath(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== 'string') return null;
  const withoutQuery = rawPath.split('?')[0]?.split('#')[0]?.trim() || '';
  if (!withoutQuery.startsWith('/')) return null;

  const clean = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;

  // Never track search page itself, public pages, or auth pages
  if (!PORTAL_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))) {
    return null;
  }

  // Never store routes containing dynamic resource/patient IDs in browser storage
  const segments = clean.split('/').filter(Boolean);
  if (segments.some((seg) => OBJECT_ID_OR_UUID_SEGMENT.test(seg))) {
    return null;
  }

  return clean;
}

export function resolvePageLabel(path: string): { label: string; section: string } {
  const known = KNOWN_ROUTE_LABELS[path];
  if (known) return known;

  const segments = path.split('/').filter(Boolean);
  const root = segments[0] || 'Dashboard';
  const section = root.charAt(0).toUpperCase() + root.slice(1);
  const tail = segments[segments.length - 1] || 'Overview';
  const label = tail
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return { label, section };
}

export function isSearchHistoryEnabled(
  userId: string | null | undefined,
  storage?: Storage | null
): boolean {
  if (!userId) return false;
  const store = getSafeStorage(storage);
  if (!store) return true;
  try {
    const val = store.getItem(`${HISTORY_ENABLED_PREFIX}${userId}`);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setSearchHistoryEnabled(
  userId: string | null | undefined,
  enabled: boolean,
  storage?: Storage | null
): void {
  if (!userId) return;
  const store = getSafeStorage(storage);
  if (!store) return;
  try {
    store.setItem(`${HISTORY_ENABLED_PREFIX}${userId}`, enabled ? 'true' : 'false');
    if (!enabled) {
      store.removeItem(`${RECENT_PAGES_PREFIX}${userId}`);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function getRecentPages(
  userId: string | null | undefined,
  storage?: Storage | null
): RecentPageEntry[] {
  if (!userId || !isSearchHistoryEnabled(userId, storage)) return [];
  const store = getSafeStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(`${RECENT_PAGES_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RecentPageEntry =>
          Boolean(entry) &&
          typeof entry.path === 'string' &&
          typeof entry.label === 'string' &&
          typeof entry.section === 'string' &&
          typeof entry.visitedAt === 'number' &&
          sanitizeNavigationPath(entry.path) !== null
      )
      .slice(0, MAX_RECENT_PAGES);
  } catch {
    return [];
  }
}

export function recordRecentPage(
  userId: string | null | undefined,
  rawPath: string,
  storage?: Storage | null
): RecentPageEntry[] {
  if (!userId || !isSearchHistoryEnabled(userId, storage)) return [];
  const cleanPath = sanitizeNavigationPath(rawPath);
  if (!cleanPath) return getRecentPages(userId, storage);

  const store = getSafeStorage(storage);
  if (!store) return [];

  const { label, section } = resolvePageLabel(cleanPath);
  const existing = getRecentPages(userId, store).filter((entry) => entry.path !== cleanPath);
  const updated: RecentPageEntry[] = [
    { path: cleanPath, label, section, visitedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_RECENT_PAGES);

  try {
    store.setItem(`${RECENT_PAGES_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

export function clearRecentPages(
  userId: string | null | undefined,
  storage?: Storage | null
): void {
  if (!userId) return;
  const store = getSafeStorage(storage);
  if (!store) return;
  try {
    store.removeItem(`${RECENT_PAGES_PREFIX}${userId}`);
  } catch {
    // Ignore
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits `text` into matched and unmatched segments safely without using HTML strings.
 * Escapes all regex metacharacters and caps token count to prevent ReDoS.
 */
export function splitHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const trimmed = query.trim().slice(0, 100);
  if (trimmed.length < 2) {
    return [{ text, matched: false }];
  }

  const tokens = Array.from(
    new Set(
      trimmed
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
    )
  )
    .sort((a, b) => b.length - a.length)
    .slice(0, 6);

  if (tokens.length === 0) {
    return [{ text, matched: false }];
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);

  const segments: HighlightSegment[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;
    // Odd capture-group indices correspond strictly to regex matches
    segments.push({ text: part, matched: i % 2 === 1 });
  }
  return segments;
}
