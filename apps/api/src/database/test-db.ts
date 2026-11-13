import { connectDatabase, disconnectDatabase, getDatabaseStatus } from '../config/database';
import { logger } from '../utils/logger';
import {
  UserModel,
  PatientProfileModel,
  DoctorProfileModel,
  PrescriptionModel,
  ConsentArtifactModel,
  AuditLogModel,
} from './models';
import {
  userRegistrationSchema,
  patientProfileSchema,
  doctorProfileSchema,
  createAppointmentSchema,
  createPrescriptionSchema,
  createConsentRequestSchema,
} from '@healthbridge/validation';
import { seedDatabase } from './seed';

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  error?: string;
}

const results: TestResult[] = [];

const record = async (name: string, fn: () => void | Promise<void>): Promise<void> => {
  try {
    await fn();
    results.push({ name, status: 'PASSED' });
    logger.info(`  ✔ [PASS] ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, status: 'FAILED', error: errorMsg });
    logger.error(`  ✘ [FAIL] ${name}: ${errorMsg}`);
  }
};

export const runDatabaseTestSuite = async (): Promise<void> => {
  logger.info('====================================================');
  logger.info('HEALTHBRIDGE INDIA — TASK 02 DATABASE TEST SUITE');
  logger.info('====================================================\n');

  // --- SECTION 1: MONGOOSE MODEL VALIDATION & SCHEMA CHECKS ---
  logger.info('Running Section 1: Schema & Model Validation Tests...');

  await record('User model rejects missing required fields (name, email, phone, role)', () => {
    const user = new UserModel({});
    const validationError = user.validateSync();
    if (!validationError || !validationError.errors.name || !validationError.errors.email) {
      throw new Error('User model should have failed validation for missing fields');
    }
  });

  await record('User model rejects invalid role assignments', () => {
    const user = new UserModel({
      name: 'Test User',
      email: 'test@domain.com',
      phone: '9876543210',
      passwordHash: 'dummy_hash',
      role: 'INVALID_HACKER_ROLE' as unknown as 'PATIENT',
    });
    const validationError = user.validateSync();
    if (!validationError || !validationError.errors.role) {
      throw new Error('User model should have rejected invalid role "INVALID_HACKER_ROLE"');
    }
  });

  await record('User model rejects invalid email and phone formats', () => {
    const user = new UserModel({
      name: 'Test User',
      email: 'not-an-email',
      phone: '12345', // Must be 10 digits starting with 6-9
      passwordHash: 'dummy_hash',
      role: 'PATIENT',
    });
    const validationError = user.validateSync();
    if (!validationError || !validationError.errors.email || !validationError.errors.phone) {
      throw new Error('User model should have rejected invalid email and phone formats');
    }
  });

  await record('User model toJSON strips passwordHash from public object serialization', () => {
    const user = new UserModel({
      name: 'Privacy Safe User',
      email: 'safe@healthbridge.local',
      phone: '9876543210',
      passwordHash: 'super_secret_argon_hash_123',
      role: 'PATIENT',
    });
    const json = user.toJSON() as Record<string, unknown>;
    if ('passwordHash' in json || json.passwordHash) {
      throw new Error('CRITICAL SECURITY FLAW: passwordHash was exposed in toJSON() output!');
    }
    if (json.id !== user._id.toString()) {
      throw new Error('toJSON should have mapped _id to virtual id');
    }
  });

  await record('DoctorProfile rejects negative years of experience', () => {
    const doctor = new DoctorProfileModel({
      userId: '60d0fe4f5311236168a109ca',
      registrationNumber: 'NMC/123/2020',
      specialization: ['Pediatrics'],
      qualifications: ['MBBS'],
      experience: -3,
    });
    const validationError = doctor.validateSync();
    if (!validationError || !validationError.errors.experience) {
      throw new Error('DoctorProfile should have rejected negative experience');
    }
  });

  await record('Prescription model rejects empty medications array', () => {
    const prescription = new PrescriptionModel({
      patientId: '60d0fe4f5311236168a109ca',
      doctorId: '60d0fe4f5311236168a109cb',
      medications: [],
      instructions: 'Take as directed',
      validUntil: new Date(Date.now() + 86400000),
    });
    const validationError = prescription.validateSync();
    if (!validationError || !validationError.errors.medications) {
      throw new Error('Prescription model should have rejected empty medications list');
    }
  });

  // --- SECTION 2: CONSENT ARCHITECTURE LOGIC CHECKS ---
  logger.info('\nRunning Section 2: ABDM Consent Logic Tests...');

  await record('ConsentArtifact isValidConsent() returns TRUE for active unexpired consent', () => {
    const activeArtifact = new ConsentArtifactModel({
      patientId: '60d0fe4f5311236168a109ca',
      requesterId: '60d0fe4f5311236168a109cb',
      purpose: 'CAREMGT',
      permittedDataTypes: ['OP_CONSULTATION'],
      validityPeriod: {
        from: new Date(Date.now() - 3600000), // 1 hour ago
        to: new Date(Date.now() + 86400000), // 24 hours in future
      },
      consentStatus: 'ACTIVE',
      approvedAt: new Date(),
    });
    if (!activeArtifact.isValidConsent()) {
      throw new Error('Active unexpired consent should be valid');
    }
  });

  await record('ConsentArtifact isValidConsent() returns FALSE for EXPIRED consent', () => {
    const expiredArtifact = new ConsentArtifactModel({
      patientId: '60d0fe4f5311236168a109ca',
      requesterId: '60d0fe4f5311236168a109cb',
      purpose: 'CAREMGT',
      permittedDataTypes: ['OP_CONSULTATION'],
      validityPeriod: {
        from: new Date(Date.now() - 86400000 * 10), // 10 days ago
        to: new Date(Date.now() - 86400000 * 2), // Expired 2 days ago
      },
      consentStatus: 'ACTIVE',
      approvedAt: new Date(Date.now() - 86400000 * 10),
    });
    if (expiredArtifact.isValidConsent()) {
      throw new Error('SECURITY VIOLATION: Expired consent was evaluated as valid!');
    }
  });

  await record('ConsentArtifact isValidConsent() returns FALSE for REVOKED consent', () => {
    const revokedArtifact = new ConsentArtifactModel({
      patientId: '60d0fe4f5311236168a109ca',
      requesterId: '60d0fe4f5311236168a109cb',
      purpose: 'CAREMGT',
      permittedDataTypes: ['OP_CONSULTATION'],
      validityPeriod: {
        from: new Date(Date.now() - 3600000),
        to: new Date(Date.now() + 86400000),
      },
      consentStatus: 'REVOKED',
      approvedAt: new Date(),
      revokedAt: new Date(),
    });
    if (revokedArtifact.isValidConsent()) {
      throw new Error('SECURITY VIOLATION: Revoked consent was evaluated as valid!');
    }
  });

  await record('AuditLog rejects credentials or tokens in metadata payload', () => {
    const auditWithPassword = new AuditLogModel({
      action: 'USER_LOGIN_ATTEMPT',
      resourceType: 'AUTH',
      requestId: 'req-test-1',
      outcome: 'FAILURE',
      metadata: {
        ip: '127.0.0.1',
        password: 'AttemptedPlainPassword123', // Forbidden!
      },
    });
    const validationError = auditWithPassword.validateSync();
    if (!validationError || !validationError.errors.metadata) {
      throw new Error('AuditLog should reject metadata containing password or token fields');
    }
  });

  // --- SECTION 3: SHARED ZOD VALIDATION SUITE ---
  logger.info('\nRunning Section 3: Shared Zod Schema Tests...');

  await record('Zod userRegistrationSchema validates valid input', () => {
    const parsed = userRegistrationSchema.safeParse({
      name: 'Aarav Mehta',
      email: 'aarav.mehta@example.com',
      phone: '9820112233',
      password: 'StrongPassword#2026',
      role: 'PATIENT',
    });
    if (!parsed.success) {
      throw new Error(`Valid registration input failed: ${JSON.stringify(parsed.error.errors)}`);
    }
  });

  await record('Zod userRegistrationSchema rejects weak password', () => {
    const parsed = userRegistrationSchema.safeParse({
      name: 'Aarav Mehta',
      email: 'aarav.mehta@example.com',
      phone: '9820112233',
      password: 'weak',
      role: 'PATIENT',
    });
    if (parsed.success) {
      throw new Error('Zod should have rejected weak password');
    }
  });

  await record('Zod patientProfileSchema validates address and emergency contact', () => {
    const parsed = patientProfileSchema.safeParse({
      userId: '60d0fe4f5311236168a109ca',
      dateOfBirth: '1990-05-20',
      gender: 'MALE',
      address: {
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        postalCode: '400001',
      },
      emergencyContact: {
        name: 'Anita Mehta',
        relationship: 'Mother',
        phone: '9820112244',
      },
      abhaLinkageStatus: 'LINKED',
    });
    if (!parsed.success) {
      throw new Error(`Valid patient profile input failed: ${JSON.stringify(parsed.error.errors)}`);
    }
  });

  await record('Zod doctorProfileSchema validates doctor inputs', () => {
    const parsed = doctorProfileSchema.safeParse({
      userId: '60d0fe4f5311236168a109cb',
      registrationNumber: 'NMC/2018/MH/112233',
      specialization: ['Cardiology'],
      qualifications: ['MBBS', 'MD'],
      experience: 6,
    });
    if (!parsed.success) {
      throw new Error(`Valid doctor profile input failed: ${JSON.stringify(parsed.error.errors)}`);
    }
  });

  await record('Zod createAppointmentSchema enforces future date', () => {
    const pastDate = new Date(Date.now() - 3600000);
    const parsed = createAppointmentSchema.safeParse({
      patientId: '60d0fe4f5311236168a109ca',
      doctorId: '60d0fe4f5311236168a109cb',
      scheduledAt: pastDate,
      reason: 'General checkup',
    });
    if (parsed.success) {
      throw new Error('createAppointmentSchema should reject past dates');
    }
  });

  await record('Zod createPrescriptionSchema validates medication list', () => {
    const parsed = createPrescriptionSchema.safeParse({
      patientId: '60d0fe4f5311236168a109ca',
      doctorId: '60d0fe4f5311236168a109cb',
      medications: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: '1-0-1',
          duration: '3 days',
        },
      ],
      instructions: 'Take after meals',
      validUntil: new Date(Date.now() + 86400000 * 7),
    });
    if (!parsed.success) {
      throw new Error(`Valid prescription input failed: ${JSON.stringify(parsed.error.errors)}`);
    }
  });

  await record('Zod createConsentRequestSchema validates date range and purpose', () => {
    const parsed = createConsentRequestSchema.safeParse({
      patientId: '60d0fe4f5311236168a109ca',
      requesterId: '60d0fe4f5311236168a109cb',
      purpose: 'CAREMGT',
      requestedDataTypes: ['OP_CONSULTATION', 'DIAGNOSTIC_REPORT'],
      dateRange: {
        from: new Date(Date.now() - 86400000 * 30),
        to: new Date(),
      },
      expiresAt: new Date(Date.now() + 86400000 * 14),
    });
    if (!parsed.success) {
      throw new Error(`Valid consent request failed: ${JSON.stringify(parsed.error.errors)}`);
    }
  });

  // --- SECTION 4: LIVE DATABASE INTEGRATION (IF REACHABLE) ---
  logger.info('\nRunning Section 4: Live MongoDB Atlas Connectivity & Seeding Checks...');

  const dbConnection = await connectDatabase();
  const dbHealth = await getDatabaseStatus();

  if (dbConnection && dbHealth.status === 'connected') {
    logger.info('  MongoDB Atlas connection active. Executing live operational tests...');

    await record('Live unique email constraint verification', async () => {
      const uniqueSuffix = Date.now();
      const user1 = await UserModel.create({
        name: 'Unique Test 1',
        email: `unique.${uniqueSuffix}@healthbridge.test`,
        phone: `98${String(uniqueSuffix).slice(-8)}`,
        passwordHash: 'dummy_hash',
        role: 'PATIENT',
      });

      let duplicateFailed = false;
      try {
        await UserModel.create({
          name: 'Unique Test 2 (Duplicate Email)',
          email: `unique.${uniqueSuffix}@healthbridge.test`, // Duplicate email!
          phone: `97${String(uniqueSuffix).slice(-8)}`,
          passwordHash: 'dummy_hash',
          role: 'PATIENT',
        });
      } catch (err: unknown) {
        const mongoErr = err as { code?: number; name?: string };
        if (mongoErr.code === 11000 || mongoErr.name === 'MongoServerError') {
          duplicateFailed = true;
        }
      } finally {
        await UserModel.deleteOne({ _id: user1._id });
      }

      if (!duplicateFailed) {
        throw new Error('Database failed to enforce unique email index constraint!');
      }
    });

    await record('Live profile relationship population (User -> PatientProfile)', async () => {
      const user = await UserModel.create({
        name: 'Relation Test Patient',
        email: `relation.${Date.now()}@healthbridge.test`,
        phone: `96${String(Date.now()).slice(-8)}`,
        passwordHash: 'dummy_hash',
        role: 'PATIENT',
      });

      const profile = await PatientProfileModel.create({
        userId: user._id,
        dateOfBirth: new Date('1992-01-01'),
        gender: 'FEMALE',
        address: {
          city: 'Pune',
          district: 'Pune',
          state: 'Maharashtra',
          postalCode: '411001',
        },
        emergencyContact: {
          name: 'Relation Contact',
          relationship: 'Sibling',
          phone: '9822001122',
        },
        abhaLinkageStatus: 'NOT_LINKED',
      });

      const populated = await PatientProfileModel.findById(profile._id).populate('userId');
      const populatedUser = populated?.userId as unknown as { name?: string };

      await PatientProfileModel.deleteOne({ _id: profile._id });
      await UserModel.deleteOne({ _id: user._id });

      if (!populatedUser || populatedUser.name !== 'Relation Test Patient') {
        throw new Error('Failed to resolve populated foreign reference to User model');
      }
    });

    await record('Live synthetic seed script execution', async () => {
      await seedDatabase();
      const patientCount = await PatientProfileModel.countDocuments();
      const doctorCount = await DoctorProfileModel.countDocuments();
      if (patientCount === 0 || doctorCount === 0) {
        throw new Error(
          'Seeding verification failed: Expected patient and doctor profiles in database'
        );
      }
    });
  } else {
    logger.warn('  ℹ️ MongoDB Atlas/local daemon is currently offline in this test run.');
    logger.warn(
      '     Offline schema validation, constraint checks, and consent logic tests completed.'
    );
  }

  // --- SUMMARY ---
  logger.info('\n====================================================');
  logger.info('DATABASE TEST SUITE SUMMARY');
  logger.info('====================================================');
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  logger.info(`Total Tests: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    logger.error('Test suite failed with errors:');
    results
      .filter((r) => r.status === 'FAILED')
      .forEach((r) => logger.error(` - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    logger.info('🎉 ALL DATABASE TESTS PASSED WITH 100% SUCCESS RATE!\n');
  }
};

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.endsWith('test-db.ts')) {
  runDatabaseTestSuite()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error('Unexpected test runner error:', error);
      await disconnectDatabase();
      process.exit(1);
    });
}
