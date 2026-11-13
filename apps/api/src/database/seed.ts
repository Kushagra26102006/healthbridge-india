import bcryptjs from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import {
  UserModel,
  PatientProfileModel,
  DoctorProfileModel,
  PharmacyProfileModel,
  LaboratoryProfileModel,
  AdminProfileModel,
  FacilityModel,
  MedicalRecordModel,
  EncounterModel,
  PrescriptionModel,
  AppointmentModel,
  LaboratoryOrderModel,
  LaboratoryReportModel,
  ConsentRequestModel,
  ConsentArtifactModel,
  AuditLogModel,
} from './models';

/**
 * HealthBridge India — Synthetic Database Seeder
 * Populates clean, non-production test fixtures adhering to DISHA and ABDM guidelines.
 */
export const seedDatabase = async (): Promise<void> => {
  logger.info('--- Starting HealthBridge Database Seeding ---');

  const connection = await connectDatabase();
  if (!connection) {
    throw new Error('Database connection failed. Ensure MongoDB is running before seeding.');
  }

  // Idempotency: Clean up existing demo accounts
  const demoEmails = [
    'admin.demo@healthbridge.local',
    'dr.priya.sharma@healthbridge.local',
    'ramesh.patel@healthbridge.local',
    'pharmacy.demo@healthbridge.local',
    'lab.demo@healthbridge.local',
  ];

  logger.info('Purging existing synthetic demo fixtures...');
  const existingUsers = await UserModel.find({ email: { $in: demoEmails } });
  const existingUserIds = existingUsers.map((u) => u._id);

  if (existingUserIds.length > 0) {
    await Promise.all([
      PatientProfileModel.deleteMany({ userId: { $in: existingUserIds } }),
      DoctorProfileModel.deleteMany({ userId: { $in: existingUserIds } }),
      PharmacyProfileModel.deleteMany({ userId: { $in: existingUserIds } }),
      LaboratoryProfileModel.deleteMany({ userId: { $in: existingUserIds } }),
      AdminProfileModel.deleteMany({ userId: { $in: existingUserIds } }),
      MedicalRecordModel.deleteMany({ patientId: { $in: existingUserIds } }),
      EncounterModel.deleteMany({ patientId: { $in: existingUserIds } }),
      PrescriptionModel.deleteMany({ patientId: { $in: existingUserIds } }),
      AppointmentModel.deleteMany({ patientId: { $in: existingUserIds } }),
      LaboratoryOrderModel.deleteMany({ patientId: { $in: existingUserIds } }),
      LaboratoryReportModel.deleteMany({ patientId: { $in: existingUserIds } }),
      ConsentRequestModel.deleteMany({ patientId: { $in: existingUserIds } }),
      ConsentArtifactModel.deleteMany({ patientId: { $in: existingUserIds } }),
      FacilityModel.deleteMany({ hfrId: 'IN-DL-HFR-00921' }),
      UserModel.deleteMany({ _id: { $in: existingUserIds } }),
    ]);
  }

  const defaultPasswordHash = await bcryptjs.hash('DemoSecure#2026', 10);

  // 1. Create Demo Facility
  logger.info('Seeding Medical Facility...');
  const demoFacility = await FacilityModel.create({
    name: 'AIIMS New Delhi Demo Hospital',
    facilityType: 'HOSPITAL',
    hfrId: 'IN-DL-HFR-00921',
    address: {
      line1: 'Ansari Nagar East',
      city: 'New Delhi',
      district: 'South Delhi',
      state: 'Delhi',
      postalCode: '110029',
    },
    contactPhone: '9810011223',
    contactEmail: 'contact@aiims.demo.in',
    isActive: true,
  });

  // 2. Create Demo Administrator
  logger.info('Seeding Administrator...');
  const adminUser = await UserModel.create({
    name: 'Super Admin User',
    email: 'admin.demo@healthbridge.local',
    phone: '9876543210',
    passwordHash: defaultPasswordHash,
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  });

  await AdminProfileModel.create({
    userId: adminUser._id,
    administrativeLevel: 'SUPER_ADMIN',
    permissions: ['VIEW_METRICS', 'MANAGE_USERS', 'VERIFY_PROVIDERS', 'SYSTEM_AUDIT'],
  });

  // 3. Create Demo Doctor
  logger.info('Seeding Doctor...');
  const doctorUser = await UserModel.create({
    name: 'Dr. Priya Sharma',
    email: 'dr.priya.sharma@healthbridge.local',
    phone: '9876543211',
    passwordHash: defaultPasswordHash,
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  });

  await DoctorProfileModel.create({
    userId: doctorUser._id,
    registrationNumber: 'NMC/2016/MH/098124',
    specialization: ['Cardiology', 'Internal Medicine'],
    qualifications: ['MBBS', 'MD (General Medicine)', 'DM (Cardiology)'],
    experience: 9,
    verificationStatus: 'VERIFIED',
    facilityId: demoFacility._id,
  });

  // 4. Create Demo Patient
  logger.info('Seeding Patient...');
  const patientUser = await UserModel.create({
    name: 'Ramesh Kumar Patel',
    email: 'ramesh.patel@healthbridge.local',
    phone: '9876543212',
    passwordHash: defaultPasswordHash,
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  });

  await PatientProfileModel.create({
    userId: patientUser._id,
    dateOfBirth: new Date('1985-06-15'),
    gender: 'MALE',
    address: {
      line1: 'B-402, Green Park Extension',
      city: 'New Delhi',
      district: 'South Delhi',
      state: 'Delhi',
      postalCode: '110016',
    },
    emergencyContact: {
      name: 'Sunita Patel',
      relationship: 'Spouse',
      phone: '9876543219',
    },
    abhaLinkageStatus: 'LINKED',
    abhaAddress: 'ramesh.patel@abdm',
    abhaNumber: '91-1234-5678-9012',
  });

  // 5. Create Demo Pharmacy
  logger.info('Seeding Pharmacy Provider...');
  const pharmacyUser = await UserModel.create({
    name: 'Sanjivani Medicos Lead',
    email: 'pharmacy.demo@healthbridge.local',
    phone: '9876543213',
    passwordHash: defaultPasswordHash,
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  });

  await PharmacyProfileModel.create({
    userId: pharmacyUser._id,
    pharmacyLicenseNumber: 'DL-PHARM-2021-99881',
    facilityId: demoFacility._id,
    verificationStatus: 'VERIFIED',
  });

  // 6. Create Demo Laboratory
  logger.info('Seeding Diagnostic Laboratory...');
  const labUser = await UserModel.create({
    name: 'National Pathology Diagnostics Lead',
    email: 'lab.demo@healthbridge.local',
    phone: '9876543214',
    passwordHash: defaultPasswordHash,
    role: 'LABORATORY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  });

  await LaboratoryProfileModel.create({
    userId: labUser._id,
    laboratoryLicenseNumber: 'DL-LAB-2022-77441',
    facilityId: demoFacility._id,
    verificationStatus: 'VERIFIED',
  });

  // 7. Create Clinical Encounter
  logger.info('Seeding Encounter & Medical Records...');
  const encounter = await EncounterModel.create({
    patientId: patientUser._id,
    practitionerId: doctorUser._id,
    facilityId: demoFacility._id,
    encounterType: 'AMBULATORY',
    startTime: new Date(Date.now() - 86400000 * 3), // 3 days ago
    endTime: new Date(Date.now() - 86400000 * 3 + 1800000), // 30 mins later
    status: 'COMPLETED',
    notes:
      'Routine cardiovascular checkup. Patient reports mild fatigue after exercise. Vitals stable.',
  });

  // 8. Create Medical Record (OP Consultation)
  await MedicalRecordModel.create({
    patientId: patientUser._id,
    recordType: 'OP_CONSULTATION',
    title: 'Cardiology Consultation Note',
    description:
      'Patient presented with mild exertion dyspnea. Advised lipid panel and resting ECG.',
    source: 'MANUAL_ENTRY',
    resourceReference: `urn:healthbridge:encounter:${encounter._id}`,
    createdBy: doctorUser._id,
  });

  // 9. Create Prescription
  logger.info('Seeding Prescription...');
  await PrescriptionModel.create({
    patientId: patientUser._id,
    doctorId: doctorUser._id,
    encounterId: encounter._id,
    medications: [
      {
        name: 'Atorvastatin',
        dosage: '10mg',
        frequency: '0-0-1 (Nightly)',
        duration: '30 days',
        instructions: 'Take after dinner',
      },
      {
        name: 'Telmisartan',
        dosage: '40mg',
        frequency: '1-0-0 (Morning)',
        duration: '30 days',
        instructions: 'Take on empty stomach',
      },
    ],
    instructions: 'Maintain low-sodium diet and 30-minute daily brisk walking.',
    issuedAt: new Date(),
    validUntil: new Date(Date.now() + 86400000 * 30), // Valid for 30 days
    status: 'ACTIVE',
  });

  // 10. Create Appointment
  logger.info('Seeding Appointment...');
  await AppointmentModel.create({
    patientId: patientUser._id,
    doctorId: doctorUser._id,
    facilityId: demoFacility._id,
    scheduledAt: new Date(Date.now() + 86400000 * 7), // 7 days in the future
    reason: 'Follow-up Cardiology Evaluation & Lipid Profile Review',
    status: 'CONFIRMED',
  });

  // 11. Create Laboratory Order & Report
  logger.info('Seeding Laboratory Order & Report...');
  const labOrder = await LaboratoryOrderModel.create({
    patientId: patientUser._id,
    orderedBy: doctorUser._id,
    tests: [
      { testCode: 'LIPID-01', testName: 'Lipid Profile Extended' },
      { testCode: 'HBA1C-01', testName: 'Glycated Hemoglobin (HbA1c)' },
    ],
    status: 'COMPLETED',
    orderedAt: new Date(Date.now() - 86400000 * 2),
  });

  await LaboratoryReportModel.create({
    patientId: patientUser._id,
    laboratoryId: labUser._id,
    orderId: labOrder._id,
    observations: [
      {
        testName: 'Total Cholesterol',
        value: '185',
        unit: 'mg/dL',
        referenceRange: '< 200 mg/dL',
        interpretation: 'NORMAL',
      },
      {
        testName: 'HDL Cholesterol',
        value: '48',
        unit: 'mg/dL',
        referenceRange: '> 40 mg/dL',
        interpretation: 'NORMAL',
      },
      {
        testName: 'LDL Cholesterol',
        value: '112',
        unit: 'mg/dL',
        referenceRange: '< 100 mg/dL',
        interpretation: 'ABNORMAL',
      },
      {
        testName: 'HbA1c',
        value: '5.6',
        unit: '%',
        referenceRange: '< 5.7 %',
        interpretation: 'NORMAL',
      },
    ],
    reportUrl: 'https://storage.healthbridge.local/reports/synthetic-report-001.pdf',
    publishedAt: new Date(),
  });

  // 12. Create Consent Request & Artifact (ABDM Milestone 3)
  logger.info('Seeding ABDM Consent Artifact...');
  const consentRequest = await ConsentRequestModel.create({
    patientId: patientUser._id,
    requesterId: doctorUser._id,
    requesterName: 'Dr. Priya Sharma (AIIMS Cardiology)',
    purpose: 'CAREMGT',
    purposeDescription: 'Access medical history for ongoing cardiovascular care',
    requestedDataTypes: ['OP_CONSULTATION', 'DIAGNOSTIC_REPORT', 'PRESCRIPTION'],
    dateRange: {
      from: new Date(Date.now() - 86400000 * 365), // Past 1 year
      to: new Date(),
    },
    requestedAt: new Date(Date.now() - 86400000),
    status: 'GRANTED',
    expiresAt: new Date(Date.now() + 86400000 * 30),
  });

  await ConsentArtifactModel.create({
    consentRequestId: consentRequest._id,
    patientId: patientUser._id,
    requesterId: doctorUser._id,
    requesterName: 'Dr. Priya Sharma (AIIMS Cardiology)',
    purpose: 'CAREMGT',
    permittedDataTypes: ['OP_CONSULTATION', 'DIAGNOSTIC_REPORT', 'PRESCRIPTION'],
    validityPeriod: {
      from: new Date(),
      to: new Date(Date.now() + 86400000 * 30),
    },
    consentStatus: 'ACTIVE',
    approvedAt: new Date(),
    signature: 'SHA256_RSA_DEMO_SIGNATURE_HB_ABDM_TEST_2026',
  });

  // 13. Create Append-Only Audit Log
  logger.info('Seeding Audit Log...');
  await AuditLogModel.create({
    actorId: adminUser._id,
    action: 'SEED_INITIAL_SYNTHETIC_DATA',
    resourceType: 'SYSTEM',
    resourceId: 'INITIAL_SEED',
    timestamp: new Date(),
    requestId: 'req-seed-' + Date.now(),
    outcome: 'SUCCESS',
    metadata: {
      seededCollectionsCount: 12,
      environment: 'development',
    },
  });

  logger.info('✅ HealthBridge database seeded successfully with synthetic demo records.');
};

// Auto-run if executed directly via CLI
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error('Database seeding failed:', error);
      await disconnectDatabase();
      process.exit(1);
    });
}
