import {
  registerValidationSchema,
  loginValidationSchema,
  resetPasswordValidationSchema,
  createAppointmentSchema,
  cancelAppointmentSchema,
  createRecordSchema,
  HEALTH_RECORD_TYPES_LIST,
  MAX_FILE_SIZE_BYTES,
  createConsentRequestSchema,
} from '@healthbridge/validation';

describe('Shared Validation Schemas — Authentication & Registration', () => {
  it('accepts valid synthetic patient registration and normalizes email case', () => {
    const parsed = registerValidationSchema.parse({
      name: 'Aarav Synthetic',
      email: 'AARAV.TEST@SYNTHETIC.HEALTHBRIDGE.TEST',
      phone: '9876543210',
      password: 'StrongPassword#2026',
      confirmPassword: 'StrongPassword#2026',
      role: 'PATIENT',
    });

    expect(parsed.email).toBe('aarav.test@synthetic.healthbridge.test');
    expect(parsed.role).toBe('PATIENT');
  });

  it('rejects weak passwords, mismatched confirmation, and non-Indian phone numbers', () => {
    const weak = registerValidationSchema.safeParse({
      name: 'Aarav',
      email: 'aarav@synthetic.test',
      phone: '1234567890',
      password: 'weak',
      confirmPassword: 'different',
      role: 'PATIENT',
    });

    expect(weak.success).toBe(false);
    if (!weak.success) {
      const fields = weak.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('phone');
      expect(fields).toContain('password');
      expect(fields).toContain('confirmPassword');
    }
  });

  it('blocks public ADMIN registration when adminRegistrationKey is missing', () => {
    const result = registerValidationSchema.safeParse({
      name: 'Unauthorized Admin',
      email: 'unauth.admin@synthetic.test',
      phone: '9876543211',
      password: 'StrongPassword#2026',
      confirmPassword: 'StrongPassword#2026',
      role: 'ADMIN',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'adminRegistrationKey')).toBe(true);
    }
  });

  it('validates login identifiers (email or 10-digit Indian mobile) and password reset confirmation', () => {
    expect(
      loginValidationSchema.safeParse({ identifier: 'patient@synthetic.test', password: 'x' })
        .success
    ).toBe(true);
    expect(
      loginValidationSchema.safeParse({ identifier: '9876543210', password: 'x' }).success
    ).toBe(true);
    expect(
      loginValidationSchema.safeParse({ identifier: 'not-valid', password: 'x' }).success
    ).toBe(false);

    expect(
      resetPasswordValidationSchema.safeParse({
        token: 'synthetic-reset-token-123',
        password: 'NewPassword#2026',
        confirmPassword: 'NewPassword#2026',
      }).success
    ).toBe(true);
  });
});

describe('Shared Validation Schemas — Appointments, Medical Documents & Consent', () => {
  it('enforces future appointment scheduling, valid ObjectId, and HH:mm 24-hour slot format', () => {
    const futureIso = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const pastIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    expect(
      createAppointmentSchema.safeParse({
        doctorId: '650000000000000000000201',
        scheduledAt: futureIso,
        startTime: '10:30',
        consultationType: 'TELECONSULTATION',
        reason: 'Follow-up consultation for blood pressure monitoring',
      }).success
    ).toBe(true);

    expect(
      createAppointmentSchema.safeParse({
        doctorId: 'invalid-id',
        scheduledAt: pastIso,
        startTime: '25:99',
        reason: 'No',
      }).success
    ).toBe(false);

    expect(cancelAppointmentSchema.safeParse({ reason: 'Schedule conflict' }).success).toBe(true);
    expect(cancelAppointmentSchema.safeParse({ reason: 'no' }).success).toBe(false);
  });

  it('enforces all 9 canonical health record categories, allowed MIME types, and 10MB file limit', () => {
    expect(HEALTH_RECORD_TYPES_LIST).toHaveLength(9);

    const valid = createRecordSchema.safeParse({
      title: 'Synthetic ECG Report',
      recordType: 'DIAGNOSTIC_REPORT',
      recordDate: '2026-11-10',
      fileName: 'ecg.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048,
    });
    expect(valid.success).toBe(true);

    const oversizedOrBadMime = createRecordSchema.safeParse({
      title: 'Oversized Script',
      recordType: 'DIAGNOSTIC_REPORT',
      recordDate: '2026-11-10',
      mimeType: 'application/x-msdownload',
      fileSize: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(oversizedOrBadMime.success).toBe(false);
  });

  it('enforces consent dateRange ordering (to >= from) and future expiry timestamp', () => {
    const validConsent = createConsentRequestSchema.safeParse({
      patientId: '650000000000000000000101',
      requesterId: '650000000000000000000201',
      purpose: 'CAREMGT',
      requestedDataTypes: ['DIAGNOSTIC_REPORT', 'PRESCRIPTION'],
      dateRange: { from: '2026-01-01', to: '2026-11-01' },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(validConsent.success).toBe(true);

    const invertedRange = createConsentRequestSchema.safeParse({
      patientId: '650000000000000000000101',
      requesterId: '650000000000000000000201',
      purpose: 'CAREMGT',
      requestedDataTypes: ['DIAGNOSTIC_REPORT'],
      dateRange: { from: '2026-11-01', to: '2026-01-01' },
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(invertedRange.success).toBe(false);
  });
});
