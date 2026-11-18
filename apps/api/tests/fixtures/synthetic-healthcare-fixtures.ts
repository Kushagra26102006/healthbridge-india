/**
 * HealthBridge India — Reusable Synthetic Healthcare Test Fixtures (Phase 19)
 *
 * SECURITY & PRIVACY GUARANTEES:
 * - Strictly synthetic identities, emails (@synthetic.healthbridge.test), phone numbers,
 *   and clinical documents — ZERO real patient data or production credentials.
 * - Enforces a hard runtime guard (`assertTestEnvironment`) so synthetic fixtures
 *   can never be imported or seeded into production environments.
 */

import { Types } from 'mongoose';
import { tokenService } from '../../src/modules/auth/services/token.service';

export type SyntheticRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

export interface SyntheticUserFixture {
  id: string;
  objectId: Types.ObjectId;
  role: SyntheticRole;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountStatus: 'ACTIVE';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  token: string;
}

/**
 * Prevents synthetic test fixtures from ever executing in production.
 */
export function assertTestEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const nodeEnv = (env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    throw new Error(
      'SECURITY_BLOCK: Synthetic healthcare test fixtures cannot be loaded when NODE_ENV is production.'
    );
  }
  if (nodeEnv !== 'test') {
    throw new Error(
      `SECURITY_BLOCK: Synthetic healthcare test fixtures require NODE_ENV="test" (received "${nodeEnv || 'undefined'}").`
    );
  }
}

export function createSyntheticUser(
  role: SyntheticRole,
  label: string,
  overrides: Partial<Omit<SyntheticUserFixture, 'objectId' | 'token'>> = {}
): SyntheticUserFixture {
  assertTestEnvironment();

  const objectId = overrides.id ? new Types.ObjectId(overrides.id) : new Types.ObjectId();
  const id = objectId.toString();
  const slug = `${role.toLowerCase()}.${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const email = overrides.email ?? `${slug}@synthetic.healthbridge.test`;
  const phone = overrides.phone ?? `90000${String(Math.floor(10000 + Math.random() * 89999))}`;
  const fullName = overrides.fullName ?? `Synthetic ${role} ${label}`;
  const password = overrides.password ?? 'SyntheticTest#2026!';

  const token = tokenService.generateAccessToken({
    _id: id,
    role,
    email,
  } as unknown as Parameters<typeof tokenService.generateAccessToken>[0]);

  return {
    id,
    objectId,
    role,
    fullName,
    email,
    phone,
    password,
    accountStatus: 'ACTIVE',
    isEmailVerified: overrides.isEmailVerified ?? true,
    isPhoneVerified: overrides.isPhoneVerified ?? true,
    token,
  };
}

/**
 * Generates a full synthetic actor roster covering all 5 platform roles plus
 * cross-tenant isolation pairs (Patient B, Doctor B, Lab B).
 */
export function createSyntheticActorRoster() {
  assertTestEnvironment();
  return {
    patientA: createSyntheticUser('PATIENT', 'A', {
      fullName: 'Aarav Synthetic',
      phone: '9000010001',
    }),
    patientB: createSyntheticUser('PATIENT', 'B', {
      fullName: 'Meera Synthetic',
      phone: '9000010002',
    }),
    doctorA: createSyntheticUser('DOCTOR', 'A', {
      fullName: 'Dr. Kavita Synthetic',
      phone: '9000020001',
    }),
    doctorB: createSyntheticUser('DOCTOR', 'B', {
      fullName: 'Dr. Vikram Synthetic',
      phone: '9000020002',
    }),
    pharmacyA: createSyntheticUser('PHARMACY', 'A', {
      fullName: 'Arogya Synthetic Pharmacy',
      phone: '9000030001',
    }),
    laboratoryA: createSyntheticUser('LABORATORY', 'A', {
      fullName: 'Swasthya Synthetic Diagnostics',
      phone: '9000040001',
    }),
    laboratoryB: createSyntheticUser('LABORATORY', 'B', {
      fullName: 'Metro Synthetic Pathology',
      phone: '9000040002',
    }),
    adminA: createSyntheticUser('ADMIN', 'A', {
      fullName: 'Compliance Synthetic Admin',
      phone: '9000050001',
    }),
  };
}

/**
 * Minimal valid magic-byte binary payloads for secure upload & preview testing.
 */
export const SYNTHETIC_FILES = {
  // Valid PDF header (%PDF-1.4\n...%%EOF)
  validPdfBase64: Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n',
    'utf8'
  ).toString('base64'),
  // Valid 1x1 PNG binary signature (\x89PNG\r\n\x1a\n)
  validPngBase64: Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00,
  ]).toString('base64'),
  // Spoofed executable disguised with .pdf / application/pdf metadata (MZ header)
  spoofedExecutableBase64: Buffer.from('MZ\x90\x00\x03\x00\x00\x00FAKE_EXE_PAYLOAD', 'binary').toString(
    'base64'
  ),
} as const;

export function createSyntheticMedicalRecordPayload(overrides: Record<string, unknown> = {}) {
  assertTestEnvironment();
  return {
    recordType: 'DIAGNOSTIC_REPORT' as const,
    title: 'Synthetic Complete Blood Count Report',
    description: 'Synthetic diagnostic record for automated QA verification',
    recordDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    facilityName: 'Synthetic General Hospital',
    doctorName: 'Dr. Kavita Synthetic',
    fileName: 'synthetic-cbc-report.pdf',
    mimeType: 'application/pdf' as const,
    fileSize: Buffer.from(SYNTHETIC_FILES.validPdfBase64, 'base64').byteLength,
    fileData: `data:application/pdf;base64,${SYNTHETIC_FILES.validPdfBase64}`,
    ...overrides,
  };
}

export function createSyntheticAppointmentPayload(doctorId: string, daysAhead = 7) {
  assertTestEnvironment();
  const slot = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  slot.setUTCHours(10, 30, 0, 0);
  return {
    doctorId,
    scheduledAt: slot.toISOString(),
    startTime: '10:30',
    endTime: '11:00',
    consultationType: 'IN_PERSON' as const,
    reason: 'Synthetic routine preventive checkup',
    notes: 'Synthetic test appointment fixture',
  };
}

export function createSyntheticPrescriptionPayload(patientId: string, encounterId?: string) {
  assertTestEnvironment();
  return {
    patientId,
    ...(encounterId ? { encounterId } : {}),
    diagnosis: 'Synthetic Mild Seasonal Rhinitis',
    medications: [
      {
        medicineName: 'Cetirizine 10mg Tablet',
        dosage: '10mg',
        frequency: 'Once daily at bedtime',
        durationDays: 5,
        quantity: 5,
        instructions: 'Take after dinner (synthetic test fixture)',
      },
    ],
    notes: 'Synthetic prescription generated exclusively for automated testing.',
  };
}

export function createSyntheticAuditLogDocument(overrides: Record<string, unknown> = {}) {
  assertTestEnvironment();
  return {
    _id: new Types.ObjectId(),
    action: 'RECORD_ACCESSED',
    actorId: new Types.ObjectId().toString(),
    actorRole: 'PATIENT',
    resourceType: 'MEDICAL_RECORD',
    resourceId: new Types.ObjectId().toString(),
    ipAddress: '127.0.0.1',
    userAgent: 'HealthBridge-Synthetic-QA/1.0',
    requestId: 'req-synthetic-audit-001',
    outcome: 'SUCCESS',
    metadata: {
      viewMode: 'preview',
      token: '[REDACTED]',
    },
    createdAt: new Date(),
    ...overrides,
  };
}
