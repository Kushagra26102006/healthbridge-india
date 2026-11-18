/**
 * HealthBridge India — Medical Document Helpers & Validation Utilities (Phase 16)
 *
 * Uses the single canonical HEALTH_RECORD_TYPES and RECORD_CONFIG from @healthbridge/config.
 * Client-side validation is strictly UX pre-validation; the server always re-validates
 * MIME type, extension, binary magic bytes, and decoded byte size.
 */

import { RECORD_CONFIG } from '@healthbridge/config';
import type { IMedicalRecord, MedicalRecordType } from '@healthbridge/shared-types';

export interface DocumentCategoryMeta {
  value: MedicalRecordType;
  label: string;
  shortLabel: string;
  description: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategoryMeta[] = [
  {
    value: 'PRESCRIPTION',
    label: 'Prescriptions',
    shortLabel: 'Prescription',
    description: 'Digital or scanned doctor prescriptions and medication plans',
  },
  {
    value: 'DIAGNOSTIC_REPORT',
    label: 'Laboratory Reports',
    shortLabel: 'Lab Report',
    description: 'Blood panels, pathology, microbiology, and diagnostic lab reports',
  },
  {
    value: 'IMAGING_REPORT',
    label: 'Imaging Reports',
    shortLabel: 'Imaging',
    description: 'X-Ray, MRI, CT scan, ultrasound, and radiology findings',
  },
  {
    value: 'OP_CONSULTATION',
    label: 'Consultation Records',
    shortLabel: 'Consultation',
    description: 'Outpatient visits, specialist notes, and clinical assessments',
  },
  {
    value: 'DISCHARGE_SUMMARY',
    label: 'Discharge Summaries',
    shortLabel: 'Discharge',
    description: 'Inpatient hospital discharge cards and procedural summaries',
  },
  {
    value: 'MEDICAL_CERTIFICATE',
    label: 'Medical Certificates',
    shortLabel: 'Certificate',
    description: 'Fitness, sick leave, and authorized medical certificates',
  },
  {
    value: 'IMMUNIZATION_RECORD',
    label: 'Immunization Records',
    shortLabel: 'Immunization',
    description: 'Vaccination certificates and immunization histories',
  },
  {
    value: 'WELLNESS_RECORD',
    label: 'Wellness Records',
    shortLabel: 'Wellness',
    description: 'Preventive checkups, vitals summaries, and wellness screenings',
  },
  {
    value: 'OTHER_MEDICAL_DOCUMENT',
    label: 'Other Medical Documents',
    shortLabel: 'Other Document',
    description: 'Referrals, medical bills, insurance forms, and other health files',
  },
];

const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.app',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.html',
  '.htm',
  '.svg',
  '.php',
  '.py',
  '.rb',
  '.jar',
]);

export interface ClientFileValidationResult {
  valid: boolean;
  error?: string;
  normalizedMime?: string;
}

export function validateClientUploadFile(file: {
  name: string;
  size: number;
  type: string;
}): ClientFileValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Please select a valid document file.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Selected file is empty (0 bytes) and cannot be uploaded.' };
  }

  if (file.size > RECORD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File exceeds the maximum permitted size of ${formatFileSize(RECORD_CONFIG.maxFileSize)}.`,
    };
  }

  const lowerName = file.name.toLowerCase();
  const dotIdx = lowerName.lastIndexOf('.');
  const ext = dotIdx > 0 ? lowerName.slice(dotIdx) : '';

  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Executable or script file types (${ext || 'unknown'}) are blocked for clinical security.`,
    };
  }

  const allowedExtensions = RECORD_CONFIG.allowedFileExtensions as readonly string[];
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension "${ext}". Allowed formats: PDF, JPG, JPEG, PNG, WebP.`,
    };
  }

  const normalizedMime = file.type === 'image/jpg' ? 'image/jpeg' : file.type.toLowerCase();
  const allowedMimes = RECORD_CONFIG.allowedMimeTypes as readonly string[];
  if (!normalizedMime || !allowedMimes.includes(normalizedMime)) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Allowed formats: PDF, JPG, JPEG, PNG, WebP.`,
    };
  }

  return { valid: true, normalizedMime };
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || !Number.isFinite(bytes) || bytes < 0) {
    return 'Size unavailable';
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function computeStorageUsagePercent(usedBytes?: number, maxBytes?: number): number {
  if (!usedBytes || !maxBytes || maxBytes <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((usedBytes / maxBytes) * 100)));
}

export interface TimelineMonthGroup {
  monthKey: string;
  monthLabel: string;
  records: IMedicalRecord[];
}

/**
 * Groups records chronologically (newest first) by month/year without fabricating missing dates.
 */
export function groupRecordsByMonth(records: IMedicalRecord[]): TimelineMonthGroup[] {
  const sorted = [...records].sort((a, b) => {
    const aTime = new Date(a.recordDate || a.createdAt).getTime() || 0;
    const bTime = new Date(b.recordDate || b.createdAt).getTime() || 0;
    return bTime - aTime;
  });

  const groups = new Map<string, TimelineMonthGroup>();

  for (const record of sorted) {
    const rawDate = record.recordDate || record.createdAt;
    const parsed = rawDate ? new Date(rawDate) : null;
    const isValidDate = parsed !== null && !Number.isNaN(parsed.getTime());

    const monthKey = isValidDate
      ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
      : 'undated';
    const monthLabel = isValidDate
      ? parsed.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : 'Date Not Recorded';

    const existing = groups.get(monthKey);
    if (existing) {
      existing.records.push(record);
    } else {
      groups.set(monthKey, { monthKey, monthLabel, records: [record] });
    }
  }

  return Array.from(groups.values());
}

export function getRecordCategoryLabel(type?: MedicalRecordType | string): string {
  const found = DOCUMENT_CATEGORIES.find((c) => c.value === type);
  return found ? found.shortLabel : type ? type.replace(/_/g, ' ') : 'Medical Document';
}
