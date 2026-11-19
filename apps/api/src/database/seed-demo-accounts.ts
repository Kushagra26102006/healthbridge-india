/**
 * HealthBridge India — Standalone Synthetic Demo Account Seeder
 * Idempotently provisions or refreshes the 5 core synthetic demo accounts:
 * 1. PATIENT:     patient.demo@healthbridge.local (Demo Patient)
 * 2. DOCTOR:      doctor.demo@healthbridge.local (Dr. Demo Doctor)
 * 3. PHARMACY:    pharmacy.demo@healthbridge.local (Demo Pharmacy)
 * 4. LABORATORY:  lab.demo@healthbridge.local (Demo Laboratory)
 * 5. ADMIN:       admin.demo@healthbridge.local (Demo Administrator)
 */

import bcryptjs from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import {
  UserModel,
  PatientProfileModel,
  DoctorProfileModel,
  DoctorScheduleModel,
  PharmacyProfileModel,
  LaboratoryProfileModel,
  AdminProfileModel,
  FacilityModel,
} from './models';

export interface SeedDemoAccountsOptions {
  allowProduction?: boolean;
}

export interface SyntheticDemoAccountDefinition {
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';
  name: string;
  email: string;
  phone: string;
  defaultPasswordHash: string;
}

export const SYNTHETIC_DEMO_ACCOUNTS: readonly SyntheticDemoAccountDefinition[] = [
  {
    role: 'PATIENT',
    name: 'Demo Patient',
    email: 'patient.demo@healthbridge.local',
    phone: '9876543212',
    defaultPasswordHash: bcryptjs.hashSync('DemoSecure#2026', 10),
  },
  {
    role: 'DOCTOR',
    name: 'Dr. Demo Doctor',
    email: 'doctor.demo@healthbridge.local',
    phone: '9876543211',
    defaultPasswordHash: bcryptjs.hashSync('DemoSecure#2026', 10),
  },
  {
    role: 'PHARMACY',
    name: 'Demo Pharmacy',
    email: 'pharmacy.demo@healthbridge.local',
    phone: '9876543213',
    defaultPasswordHash: bcryptjs.hashSync('DemoSecure#2026', 10),
  },
  {
    role: 'LABORATORY',
    name: 'Demo Laboratory',
    email: 'lab.demo@healthbridge.local',
    phone: '9876543214',
    defaultPasswordHash: bcryptjs.hashSync('DemoSecure#2026', 10),
  },
  {
    role: 'ADMIN',
    name: 'Demo Administrator',
    email: 'admin.demo@healthbridge.local',
    phone: '9876543210',
    defaultPasswordHash: bcryptjs.hashSync('DemoSecure#2026', 10),
  },
];

export const seedDemoAccounts = async (options?: SeedDemoAccountsOptions): Promise<void> => {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const allowProd =
    options?.allowProduction ?? (process.env.ALLOW_PRODUCTION_DEMO_SEED === 'true');

  if (isProd && !allowProd) {
    throw new Error(
      'SECURITY_BLOCK: Demo account seeding is strictly forbidden in production unless explicitly authorized via ALLOW_PRODUCTION_DEMO_SEED=true.'
    );
  }

  logger.info('--- Provisioning HealthBridge 5 Synthetic Demo Accounts ---');

  const connection = await connectDatabase();
  if (!connection) {
    throw new Error('Database connection failed. Ensure MongoDB is reachable.');
  }

  // 1. Ensure a default reference medical facility exists
  let defaultFacility = await FacilityModel.findOne({ hfrId: 'IN-DL-HFR-00921' });
  if (!defaultFacility) {
    defaultFacility = await FacilityModel.create({
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
    logger.info('Created reference facility: AIIMS New Delhi Demo Hospital');
  }

  // 2. Hash passwords safely using bcryptjs (defaults to DemoSecure#2026 if unset)
  const passwords = {
    patient: process.env.DEMO_PATIENT_PASSWORD || 'DemoSecure#2026',
    doctor: process.env.DEMO_DOCTOR_PASSWORD || 'DemoSecure#2026',
    pharmacy: process.env.DEMO_PHARMACY_PASSWORD || 'DemoSecure#2026',
    lab: process.env.DEMO_LAB_PASSWORD || 'DemoSecure#2026',
    admin: process.env.DEMO_ADMIN_PASSWORD || 'DemoSecure#2026',
  };

  const [
    patientPasswordHash,
    doctorPasswordHash,
    pharmacyPasswordHash,
    labPasswordHash,
    adminPasswordHash,
  ] = await Promise.all([
    bcryptjs.hash(passwords.patient, 10),
    bcryptjs.hash(passwords.doctor, 10),
    bcryptjs.hash(passwords.pharmacy, 10),
    bcryptjs.hash(passwords.lab, 10),
    bcryptjs.hash(passwords.admin, 10),
  ]);

  // 3. Idempotently upsert the 5 demo accounts
  // A. Patient
  const patientUser = await UserModel.findOneAndUpdate(
    { email: 'patient.demo@healthbridge.local' },
    {
      $set: {
        name: 'Demo Patient',
        email: 'patient.demo@healthbridge.local',
        phone: '9876543212',
        passwordHash: patientPasswordHash,
        role: 'PATIENT',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await PatientProfileModel.findOneAndUpdate(
    { userId: patientUser._id },
    {
      $set: {
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
        abhaAddress: 'patient.demo@abdm',
        abhaNumber: '91-1234-5678-9012',
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // B. Doctor
  const doctorUser = await UserModel.findOneAndUpdate(
    { email: 'doctor.demo@healthbridge.local' },
    {
      $set: {
        name: 'Dr. Demo Doctor',
        email: 'doctor.demo@healthbridge.local',
        phone: '9876543211',
        passwordHash: doctorPasswordHash,
        role: 'DOCTOR',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await DoctorProfileModel.findOneAndUpdate(
    { userId: doctorUser._id },
    {
      $set: {
        userId: doctorUser._id,
        registrationNumber: 'NMC/2016/DL/098124',
        specialization: ['Cardiology', 'Internal Medicine'],
        qualifications: ['MBBS', 'MD (General Medicine)', 'DM (Cardiology)'],
        experience: 10,
        verificationStatus: 'VERIFIED',
        facilityId: defaultFacility._id,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // Weekly Schedule for Doctor
  await DoctorScheduleModel.findOneAndUpdate(
    { doctorId: doctorUser._id },
    {
      $set: {
        doctorId: doctorUser._id,
        facilityId: defaultFacility._id,
        consultationFee: 800,
        followUpFee: 400,
        slotDurationMinutes: 15,
        isActive: true,
        slots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', maxPatients: 16, consultationType: 'IN_PERSON', isActive: true },
          { dayOfWeek: 1, startTime: '15:00', endTime: '18:00', maxPatients: 12, consultationType: 'TELECONSULT', isActive: true },
          { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', maxPatients: 16, consultationType: 'IN_PERSON', isActive: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', maxPatients: 16, consultationType: 'IN_PERSON', isActive: true },
          { dayOfWeek: 3, startTime: '15:00', endTime: '18:00', maxPatients: 12, consultationType: 'TELECONSULT', isActive: true },
          { dayOfWeek: 4, startTime: '09:00', endTime: '13:00', maxPatients: 16, consultationType: 'IN_PERSON', isActive: true },
          { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', maxPatients: 16, consultationType: 'IN_PERSON', isActive: true },
          { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', maxPatients: 10, consultationType: 'IN_PERSON', isActive: true },
        ],
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // C. Pharmacy
  const pharmacyUser = await UserModel.findOneAndUpdate(
    { email: 'pharmacy.demo@healthbridge.local' },
    {
      $set: {
        name: 'Demo Pharmacy',
        email: 'pharmacy.demo@healthbridge.local',
        phone: '9876543213',
        passwordHash: pharmacyPasswordHash,
        role: 'PHARMACY',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await PharmacyProfileModel.findOneAndUpdate(
    { userId: pharmacyUser._id },
    {
      $set: {
        userId: pharmacyUser._id,
        pharmacyLicenseNumber: 'DL-PHARM-2021-99881',
        facilityId: defaultFacility._id,
        verificationStatus: 'VERIFIED',
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // D. Laboratory
  const labUser = await UserModel.findOneAndUpdate(
    { email: 'lab.demo@healthbridge.local' },
    {
      $set: {
        name: 'Demo Laboratory',
        email: 'lab.demo@healthbridge.local',
        phone: '9876543214',
        passwordHash: labPasswordHash,
        role: 'LABORATORY',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await LaboratoryProfileModel.findOneAndUpdate(
    { userId: labUser._id },
    {
      $set: {
        userId: labUser._id,
        tradingName: 'Demo Laboratory',
        laboratoryLicenseNumber: 'DL-LAB-2022-77441',
        facilityId: defaultFacility._id,
        contactPhone: '9876543214',
        facilityName: 'Delhi Demo Diagnostic Center',
        verificationStatus: 'VERIFIED',
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // E. Administrator
  const adminUser = await UserModel.findOneAndUpdate(
    { email: 'admin.demo@healthbridge.local' },
    {
      $set: {
        name: 'Demo Administrator',
        email: 'admin.demo@healthbridge.local',
        phone: '9876543210',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await AdminProfileModel.findOneAndUpdate(
    { userId: adminUser._id },
    {
      $set: {
        userId: adminUser._id,
        administrativeLevel: 'SUPER_ADMIN',
        permissions: ['VIEW_METRICS', 'MANAGE_USERS', 'VERIFY_PROVIDERS', 'SYSTEM_AUDIT'],
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  logger.info('✅ Successfully seeded all 5 synthetic demo accounts idempotently:');
  logger.info('  1. PATIENT:    patient.demo@healthbridge.local  (Phone: 9876543212)');
  logger.info('  2. DOCTOR:     doctor.demo@healthbridge.local   (Phone: 9876543211)');
  logger.info('  3. PHARMACY:   pharmacy.demo@healthbridge.local (Phone: 9876543213)');
  logger.info('  4. LABORATORY: lab.demo@healthbridge.local      (Phone: 9876543214)');
  logger.info('  5. ADMIN:      admin.demo@healthbridge.local     (Phone: 9876543210)');
};

// Auto-run if executed directly via CLI
if (require.main === module || process.argv[1]?.endsWith('seed-demo-accounts.ts')) {
  seedDemoAccounts()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error('Demo account seeding failed:', error);
      await disconnectDatabase();
      process.exit(1);
    });
}
