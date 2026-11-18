import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
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
  DoctorScheduleModel,
  MedicalRecordModel,
  EncounterModel,
  PrescriptionModel,
  MedicationCatalogModel,
  INITIAL_MEDICATION_CATALOG,
  AppointmentModel,
  LaboratoryOrderModel,
  LaboratoryReportModel,
  LabTestModel,
  SupplierModel,
  PharmacyInventoryModel,
  PharmacyOrderModel,
  ConsentRequestModel,
  ConsentArtifactModel,
  NotificationModel,
  AuditLogModel,
} from './models';

const DAY_MS = 86_400_000;

/**
 * Generates a valid minimal synthetic PDF buffer encoded as a data URI
 * so in-app document preview works cleanly without external storage.
 */
function buildSyntheticPdfBase64(title: string, summaryLine: string): {
  base64: string;
  size: number;
  sha256: string;
} {
  const safeTitle = title.replace(/[()\\]/g, '');
  const safeSummary = summaryLine.replace(/[()\\]/g, '').slice(0, 90);
  const contentStream = `BT /F1 14 Tf 50 740 Td (${safeTitle}) Tj /F1 10 Tf 0 -24 Td (${safeSummary}) Tj 0 -18 Td (HealthBridge India - Synthetic Demo Clinical Record - Not Real PHI) Tj ET`;
  const pdf = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000241 00000 n ',
    '0000000460 00000 n ',
    'trailer << /Size 6 /Root 1 0 R >>',
    'startxref',
    '530',
    '%%EOF',
  ].join('\n');

  const buf = Buffer.from(pdf, 'utf-8');
  return {
    base64: `data:application/pdf;base64,${buf.toString('base64')}`,
    size: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  };
}

/**
 * Additional essential Indian clinical medicines complementing INITIAL_MEDICATION_CATALOG
 */
const EXTRA_MEDICATION_CATALOG = [
  {
    name: 'Ecosprin 75 Tablet',
    brandName: 'Ecosprin 75',
    genericName: 'Aspirin (Acetylsalicylic Acid)',
    dosageForm: 'TABLET',
    strength: '75 mg',
    route: 'Oral',
    manufacturer: 'USV Ltd',
    packageSize: 'Strip of 14 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'Antiplatelet Agent (Cardiovascular)',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take once daily after lunch with water. Do not chew gastro-resistant tablet.',
    isActive: true,
  },
  {
    name: 'Thyronorm 50mcg Tablet',
    brandName: 'Thyronorm 50',
    genericName: 'Levothyroxine Sodium',
    dosageForm: 'TABLET',
    strength: '50 mcg',
    route: 'Oral',
    manufacturer: 'Abbott India Ltd',
    packageSize: 'Bottle of 120 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'Thyroid Hormone Replacement',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take strictly on an empty stomach 45-60 minutes before breakfast.',
    isActive: true,
  },
  {
    name: 'Lantus SoloStar 100 IU/ml Injection',
    brandName: 'Lantus SoloStar',
    genericName: 'Insulin Glargine',
    dosageForm: 'INJECTION',
    strength: '100 IU / ml',
    route: 'Subcutaneous',
    manufacturer: 'Sanofi India Ltd',
    packageSize: 'Pre-filled Pen 3 ml',
    schedule: 'Schedule H',
    therapeuticClass: 'Long-Acting Basal Insulin',
    requiresPrescription: true,
    standardDosageUnit: 'units',
    instructionsHint: 'Store refrigerated (2-8°C). Administer subcutaneously at the same time daily.',
    isActive: true,
  },
  {
    name: 'Electral ORS Powder Sachet',
    brandName: 'Electral',
    genericName: 'WHO Formula Oral Rehydration Salts',
    dosageForm: 'POWDER',
    strength: '21.8 g sachet',
    route: 'Oral',
    manufacturer: 'FDC Ltd',
    packageSize: 'Sachet of 21.8 g',
    schedule: 'OTC',
    therapeuticClass: 'Fluid & Electrolyte Replenisher',
    requiresPrescription: false,
    standardDosageUnit: 'sachet',
    instructionsHint: 'Dissolve entire sachet in 1 litre of clean drinking water; consume within 24 hours.',
    isActive: true,
  },
  {
    name: 'Ondem 4 Tablet',
    brandName: 'Ondem 4',
    genericName: 'Ondansetron Hydrochloride',
    dosageForm: 'TABLET',
    strength: '4 mg',
    route: 'Oral',
    manufacturer: 'Alkem Laboratories Ltd',
    packageSize: 'Strip of 10 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'Antiemetic (5-HT3 Antagonist)',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take 30 minutes before meals for nausea or vomiting as directed.',
    isActive: true,
  },
  {
    name: 'Rosuvas 10 Tablet',
    brandName: 'Rosuvas 10',
    genericName: 'Rosuvastatin Calcium',
    dosageForm: 'TABLET',
    strength: '10 mg',
    route: 'Oral',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    packageSize: 'Strip of 15 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take once daily at bedtime with or without food.',
    isActive: true,
  },
  {
    name: 'Amaryl 1mg Tablet',
    brandName: 'Amaryl 1',
    genericName: 'Glimepiride',
    dosageForm: 'TABLET',
    strength: '1 mg',
    route: 'Oral',
    manufacturer: 'Sanofi India Ltd',
    packageSize: 'Strip of 30 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'Oral Hypoglycemic (Sulfonylurea)',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take immediately before or with breakfast to avoid hypoglycemia.',
    isActive: true,
  },
  {
    name: 'Clopilet 75 Tablet',
    brandName: 'Clopilet 75',
    genericName: 'Clopidogrel Bisulfate',
    dosageForm: 'TABLET',
    strength: '75 mg',
    route: 'Oral',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    packageSize: 'Strip of 15 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'Antiplatelet Agent (P2Y12 Inhibitor)',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take once daily at the same time each day.',
    isActive: true,
  },
  {
    name: 'Met XL 25 Tablet',
    brandName: 'Met XL 25',
    genericName: 'Metoprolol Succinate (Extended Release)',
    dosageForm: 'TABLET',
    strength: '25 mg',
    route: 'Oral',
    manufacturer: 'Ajanta Pharma Ltd',
    packageSize: 'Strip of 20 tablets',
    schedule: 'Schedule H',
    therapeuticClass: 'Cardioselective Beta-Blocker',
    requiresPrescription: true,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take once daily after morning meal. Do not stop abruptly.',
    isActive: true,
  },
  {
    name: 'Zincovit Tablet',
    brandName: 'Zincovit',
    genericName: 'Multivitamins, Multiminerals & Grape Seed Extract',
    dosageForm: 'TABLET',
    strength: 'Therapeutic Formula',
    route: 'Oral',
    manufacturer: 'Apex Laboratories Pvt Ltd',
    packageSize: 'Strip of 15 tablets',
    schedule: 'OTC',
    therapeuticClass: 'Immunity & Nutritional Supplement',
    requiresPrescription: false,
    standardDosageUnit: 'tablet',
    instructionsHint: 'Take one tablet daily after lunch.',
    isActive: true,
  },
];

const buildWeeklySchedule = (consultationFee: number, facilityId: unknown) => {
  const activeDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
  return {
    timezone: 'Asia/Kolkata',
    slotDurationMinutes: 30,
    bufferMinutes: 5,
    weeklySchedule: [
      ...activeDays.map((day) => ({
        day,
        isEnabled: true,
        workingWindows:
          day === 'SATURDAY'
            ? [{ start: '09:30', end: '13:30' }]
            : [
                { start: '09:00', end: '13:00' },
                { start: '15:00', end: '18:30' },
              ],
        breaks: day === 'SATURDAY' ? [] : [{ start: '13:00', end: '15:00', label: 'OPD Lunch Break' }],
        slotDurationMinutes: 30,
        bufferMinutes: 5,
        consultationModes: ['IN_PERSON', 'TELECONSULTATION'] as ('IN_PERSON' | 'TELECONSULTATION')[],
      })),
      {
        day: 'SUNDAY' as const,
        isEnabled: false,
        workingWindows: [],
        breaks: [],
        slotDurationMinutes: 30,
        bufferMinutes: 5,
        consultationModes: ['TELECONSULTATION'] as ('IN_PERSON' | 'TELECONSULTATION')[],
      },
    ],
    consultationTypes: [
      {
        type: 'IN_PERSON' as const,
        name: 'In-Person OPD Consultation',
        isEnabled: true,
        durationMinutes: 30,
        facilityId,
        fee: consultationFee,
        bufferMinutes: 5,
        description: 'Comprehensive physical evaluation and vitals review at the hospital OPD.',
      },
      {
        type: 'TELECONSULTATION' as const,
        name: 'Video Teleconsultation',
        isEnabled: true,
        durationMinutes: 20,
        facilityId,
        fee: Math.round(consultationFee * 0.8),
        bufferMinutes: 5,
        description: 'Secure ABDM-compliant remote follow-up and digital prescription review.',
      },
      {
        type: 'FOLLOW_UP' as const,
        name: 'Report Review Follow-Up',
        isEnabled: true,
        durationMinutes: 15,
        facilityId,
        fee: Math.round(consultationFee * 0.5),
        bufferMinutes: 5,
        description: 'Diagnostic report and medication titration check-in.',
      },
    ],
    blockedDates: [],
    overrides: [],
  };
};

/**
 * HealthBridge India — Synthetic Database Seeder
 * Populates rich, non-production synthetic healthcare data & medicines across all 5 portals.
 */
export const seedDatabase = async (): Promise<void> => {
  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error(
      'SECURITY_BLOCK: Synthetic database seeding is strictly forbidden when NODE_ENV=production.'
    );
  }

  logger.info('--- Starting HealthBridge Synthetic Database & Medicine Seeding ---');

  const connection = await connectDatabase();
  if (!connection) {
    throw new Error('Database connection failed. Ensure MongoDB is running before seeding.');
  }

  const demoEmails = [
    'admin.demo@healthbridge.local',
    'dr.priya.sharma@healthbridge.local',
    'dr.arjun.mehta@healthbridge.local',
    'dr.ananya.iyer@healthbridge.local',
    'ramesh.patel@healthbridge.local',
    'meera.nair@healthbridge.local',
    'vikram.singh@healthbridge.local',
    'pharmacy.demo@healthbridge.local',
    'lab.demo@healthbridge.local',
  ];

  const demoHfrIds = ['IN-DL-HFR-00921', 'IN-KA-HFR-04112', 'IN-MH-HFR-07834'];

  logger.info('Purging previous synthetic demo fixtures for idempotent re-seed...');
  const existingUsers = await UserModel.find({ email: { $in: demoEmails } });
  const existingUserIds = existingUsers.map((u) => u._id);
  const existingLabProfiles =
    existingUserIds.length > 0
      ? await LaboratoryProfileModel.find({ userId: { $in: existingUserIds } })
      : [];
  const existingLabProfileIds = existingLabProfiles.map((p) => p._id);

  await Promise.all([
    existingUserIds.length > 0
      ? PatientProfileModel.deleteMany({ userId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? DoctorProfileModel.deleteMany({ userId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? PharmacyProfileModel.deleteMany({ userId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? LaboratoryProfileModel.deleteMany({ userId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? AdminProfileModel.deleteMany({ userId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? DoctorScheduleModel.deleteMany({ doctorId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? MedicalRecordModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? EncounterModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? PrescriptionModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? AppointmentModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? LaboratoryOrderModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? LaboratoryReportModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingLabProfileIds.length > 0
      ? LabTestModel.deleteMany({ laboratoryId: { $in: existingLabProfileIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? SupplierModel.deleteMany({ pharmacyId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? PharmacyInventoryModel.deleteMany({ pharmacyId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? PharmacyOrderModel.deleteMany({ pharmacyId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? ConsentRequestModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? ConsentArtifactModel.deleteMany({ patientId: { $in: existingUserIds } })
      : Promise.resolve(),
    existingUserIds.length > 0
      ? NotificationModel.deleteMany({ userId: { $in: existingUserIds } })
      : Promise.resolve(),
    PharmacyOrderModel.deleteMany({ orderNumber: { $regex: /^RX-ORD-DEMO-/ } }),
    LaboratoryOrderModel.deleteMany({ orderNumber: { $regex: /^LAB-ORD-DEMO-/ } }),
    LaboratoryReportModel.deleteMany({ reportNumber: { $regex: /^LAB-RPT-DEMO-/ } }),
    FacilityModel.deleteMany({ hfrId: { $in: demoHfrIds } }),
    existingUserIds.length > 0
      ? UserModel.deleteMany({ _id: { $in: existingUserIds } })
      : Promise.resolve(),
  ]);

  const defaultPasswordHash = await bcryptjs.hash('DemoSecure#2026', 10);

  // =========================================================================
  // 1. FACILITIES (HFR-Style Demo Network)
  // =========================================================================
  logger.info('Seeding Medical Facilities...');
  const [delhiFacility, bengaluruFacility, mumbaiFacility] = await Promise.all([
    FacilityModel.create({
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
    }),
    FacilityModel.create({
      name: 'Apollo Spectra Bengaluru Demo Clinic',
      facilityType: 'CLINIC',
      hfrId: 'IN-KA-HFR-04112',
      address: {
        line1: '80 Feet Road, Koramangala 4th Block',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560034',
      },
      contactPhone: '9845011224',
      contactEmail: 'care@apollospectra.demo.in',
      isActive: true,
    }),
    FacilityModel.create({
      name: 'Sahyadri Heart & Diagnostics Mumbai Demo',
      facilityType: 'HOSPITAL',
      hfrId: 'IN-MH-HFR-07834',
      address: {
        line1: 'Bandra Kurla Complex, Sector G',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        postalCode: '400051',
      },
      contactPhone: '9820011225',
      contactEmail: 'desk@sahyadri.demo.in',
      isActive: true,
    }),
  ]);

  // =========================================================================
  // 2. USERS & PROFILES (Admin, 3 Doctors, 3 Patients, Pharmacy, Laboratory)
  // =========================================================================
  logger.info('Seeding Demo Users & Role Profiles...');
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

  // Doctors
  const [drPriya, drArjun, drAnanya] = await Promise.all([
    UserModel.create({
      name: 'Dr. Priya Sharma',
      email: 'dr.priya.sharma@healthbridge.local',
      phone: '9876543211',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
    UserModel.create({
      name: 'Dr. Arjun Mehta',
      email: 'dr.arjun.mehta@healthbridge.local',
      phone: '9876543221',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
    UserModel.create({
      name: 'Dr. Ananya Iyer',
      email: 'dr.ananya.iyer@healthbridge.local',
      phone: '9876543222',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
  ]);

  await DoctorProfileModel.create([
    {
      userId: drPriya._id,
      registrationNumber: 'NMC/2016/DL/098124',
      specialization: ['Cardiology', 'Internal Medicine'],
      qualifications: ['MBBS', 'MD (General Medicine)', 'DM (Cardiology)'],
      experience: 10,
      verificationStatus: 'VERIFIED',
      facilityId: delhiFacility._id,
    },
    {
      userId: drArjun._id,
      registrationNumber: 'NMC/2014/KA/067432',
      specialization: ['Endocrinology', 'Diabetology', 'Internal Medicine'],
      qualifications: ['MBBS', 'MD (Internal Medicine)', 'DM (Endocrinology)'],
      experience: 12,
      verificationStatus: 'VERIFIED',
      facilityId: bengaluruFacility._id,
    },
    {
      userId: drAnanya._id,
      registrationNumber: 'NMC/2018/MH/112908',
      specialization: ['Pulmonology', 'General Medicine'],
      qualifications: ['MBBS', 'MD (Respiratory Medicine)'],
      experience: 8,
      verificationStatus: 'VERIFIED',
      facilityId: mumbaiFacility._id,
    },
  ]);

  // Doctor Schedules (enables real slot booking across all 3 doctors)
  await DoctorScheduleModel.create([
    { doctorId: drPriya._id, facilityId: delhiFacility._id, ...buildWeeklySchedule(800, delhiFacility._id) },
    { doctorId: drArjun._id, facilityId: bengaluruFacility._id, ...buildWeeklySchedule(700, bengaluruFacility._id) },
    { doctorId: drAnanya._id, facilityId: mumbaiFacility._id, ...buildWeeklySchedule(600, mumbaiFacility._id) },
  ]);

  // Patients
  const [patientRamesh, patientMeera, patientVikram] = await Promise.all([
    UserModel.create({
      name: 'Ramesh Kumar Patel',
      email: 'ramesh.patel@healthbridge.local',
      phone: '9876543212',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
    UserModel.create({
      name: 'Meera Nair',
      email: 'meera.nair@healthbridge.local',
      phone: '9876543231',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
    UserModel.create({
      name: 'Vikram Singh Chauhan',
      email: 'vikram.singh@healthbridge.local',
      phone: '9876543232',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
  ]);

  await PatientProfileModel.create([
    {
      userId: patientRamesh._id,
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
    },
    {
      userId: patientMeera._id,
      dateOfBirth: new Date('1991-02-22'),
      gender: 'FEMALE',
      address: {
        line1: '14, Indiranagar 2nd Stage',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560038',
      },
      emergencyContact: {
        name: 'Rajesh Nair',
        relationship: 'Brother',
        phone: '9845098765',
      },
      abhaLinkageStatus: 'LINKED',
      abhaAddress: 'meera.nair@abdm',
      abhaNumber: '91-2345-6789-0123',
    },
    {
      userId: patientVikram._id,
      dateOfBirth: new Date('1978-11-04'),
      gender: 'MALE',
      address: {
        line1: '702, Hiranandani Gardens, Powai',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        postalCode: '400076',
      },
      emergencyContact: {
        name: 'Kavita Chauhan',
        relationship: 'Spouse',
        phone: '9820098766',
      },
      abhaLinkageStatus: 'PENDING',
      abhaAddress: 'vikram.chauhan@abdm',
    },
  ]);

  // Pharmacy Provider
  const pharmacyUser = await UserModel.create({
    name: 'Sanjivani Medicos Pharmacy',
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
    facilityId: delhiFacility._id,
    verificationStatus: 'VERIFIED',
  });

  // Diagnostic Laboratory Provider
  const labUser = await UserModel.create({
    name: 'National Pathology Diagnostics',
    email: 'lab.demo@healthbridge.local',
    phone: '9876543214',
    passwordHash: defaultPasswordHash,
    role: 'LABORATORY',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  });

  const labProfile = await LaboratoryProfileModel.create({
    userId: labUser._id,
    laboratoryLicenseNumber: 'DL-LAB-2022-77441',
    facilityId: delhiFacility._id,
    verificationStatus: 'VERIFIED',
  });

  // =========================================================================
  // 3. MEDICATION CATALOG (30 Standardized Indian Clinical Medicines)
  // =========================================================================
  logger.info('Seeding 30 Medicines into Medication Catalog...');
  const allMedicines = [...INITIAL_MEDICATION_CATALOG, ...EXTRA_MEDICATION_CATALOG];
  const medByBrand = new Map<string, typeof MedicationCatalogModel.prototype>();

  for (const med of allMedicines) {
    const doc = await MedicationCatalogModel.findOneAndUpdate(
      {
        brandName: med.brandName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        manufacturer: med.manufacturer,
      },
      {
        $set: {
          ...med,
          requiresPrescription:
            typeof (med as { requiresPrescription?: boolean }).requiresPrescription === 'boolean'
              ? (med as { requiresPrescription?: boolean }).requiresPrescription
              : med.schedule !== 'OTC',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    medByBrand.set(med.brandName, doc);
  }

  // =========================================================================
  // 4. PHARMACY SUPPLIERS & INVENTORY BATCHES (Normal, Low Stock, Near Expiry, Out of Stock)
  // =========================================================================
  logger.info('Seeding Verified Pharmaceutical Suppliers...');
  await SupplierModel.create([
    {
      pharmacyId: pharmacyUser._id,
      supplierCode: 'SUP-DL-001',
      name: 'MedLife Pharma Distributors Pvt Ltd',
      legalName: 'MedLife Pharma Distributors Private Limited',
      supplierType: 'DISTRIBUTOR',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      taxId: '07AABCM1234F1Z5',
      drugLicenseNumber: 'DL-WH-20B-2022-4411',
      email: 'orders@medlifedist.demo.in',
      phone: '9811044551',
      address: {
        line1: 'Plot 24, Okhla Industrial Area Phase II',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110020',
        country: 'India',
      },
      contactPersons: [
        {
          name: 'Sandeep Kapoor',
          email: 'sandeep.k@medlifedist.demo.in',
          phone: '9811044552',
          designation: 'Regional Supply Manager',
          isPrimary: true,
        },
      ],
      paymentTermsDays: 30,
      leadTimeDays: 2,
      rating: 5,
      verifiedAt: new Date(Date.now() - DAY_MS * 60),
      verifiedBy: adminUser._id,
    },
    {
      pharmacyId: pharmacyUser._id,
      supplierCode: 'SUP-MH-002',
      name: 'Bharat Lifesciences Wholesale Hub',
      legalName: 'Bharat Lifesciences Healthcare LLP',
      supplierType: 'WHOLESALER',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      taxId: '27AAACB5678G1Z9',
      drugLicenseNumber: 'MH-MZ4-21B-2021-8892',
      email: 'dispatch@bharatlife.demo.in',
      phone: '9820155661',
      address: {
        line1: 'Unit 11, Bhiwandi Pharma Logistics Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '421302',
        country: 'India',
      },
      contactPersons: [
        {
          name: 'Neha Deshmukh',
          email: 'neha.d@bharatlife.demo.in',
          phone: '9820155662',
          designation: 'Key Accounts Lead',
          isPrimary: true,
        },
      ],
      paymentTermsDays: 45,
      leadTimeDays: 4,
      rating: 4,
      verifiedAt: new Date(Date.now() - DAY_MS * 45),
      verifiedBy: adminUser._id,
    },
    {
      pharmacyId: pharmacyUser._id,
      supplierCode: 'SUP-KA-003',
      name: 'Apex Cold-Chain Medical Supply',
      legalName: 'Apex Cold-Chain Biologics India Pvt Ltd',
      supplierType: 'MANUFACTURER',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      taxId: '29AABCA9012H1Z1',
      drugLicenseNumber: 'KA-BLR-20B-2023-1190',
      email: 'coldchain@apexmed.demo.in',
      phone: '9845166771',
      address: {
        line1: 'Biotech Park Phase 2, Electronic City',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        country: 'India',
      },
      contactPersons: [
        {
          name: 'Karthik Rao',
          email: 'karthik.r@apexmed.demo.in',
          phone: '9845166772',
          designation: 'Cold-Chain Operations Lead',
          isPrimary: true,
        },
      ],
      paymentTermsDays: 15,
      leadTimeDays: 2,
      rating: 5,
      verifiedAt: new Date(Date.now() - DAY_MS * 30),
      verifiedBy: adminUser._id,
    },
  ]);

  logger.info('Seeding 23 Pharmacy Medicine Inventory Batches...');
  const inventorySeedSpecs: Array<{
    brand: string;
    batch: string;
    supplier: string;
    receivedQty: number;
    availQty: number;
    reorderLevel: number;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    expiryDays: number;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEAR_EXPIRY';
    rack: string;
  }> = [
    { brand: 'Atorva 10', batch: 'BCH-ATV-2601', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 250, availQty: 185, reorderLevel: 40, purchasePrice: 54, sellingPrice: 72, mrp: 78, expiryDays: 420, status: 'IN_STOCK', rack: 'A-01' },
    { brand: 'Telma 40', batch: 'BCH-TLM-2602', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 300, availQty: 210, reorderLevel: 50, purchasePrice: 145, sellingPrice: 192, mrp: 215, expiryDays: 390, status: 'IN_STOCK', rack: 'A-02' },
    { brand: 'Amlong 5', batch: 'BCH-AML-2603', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 240, availQty: 165, reorderLevel: 40, purchasePrice: 28, sellingPrice: 39, mrp: 45, expiryDays: 450, status: 'IN_STOCK', rack: 'A-03' },
    { brand: 'Ecosprin 75', batch: 'BCH-ECO-2604', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 400, availQty: 310, reorderLevel: 60, purchasePrice: 4.5, sellingPrice: 6.5, mrp: 7.5, expiryDays: 500, status: 'IN_STOCK', rack: 'A-04' },
    { brand: 'Met XL 25', batch: 'BCH-MXL-2605', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 180, availQty: 122, reorderLevel: 30, purchasePrice: 68, sellingPrice: 92, mrp: 102, expiryDays: 360, status: 'IN_STOCK', rack: 'A-05' },
    { brand: 'Rosuvas 10', batch: 'BCH-RSV-2606', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 200, availQty: 138, reorderLevel: 35, purchasePrice: 130, sellingPrice: 175, mrp: 195, expiryDays: 410, status: 'IN_STOCK', rack: 'A-06' },
    { brand: 'Glycomet 500 SR', batch: 'BCH-GLY-2607', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 350, availQty: 240, reorderLevel: 60, purchasePrice: 36, sellingPrice: 49, mrp: 56, expiryDays: 480, status: 'IN_STOCK', rack: 'B-01' },
    { brand: 'Amaryl 1', batch: 'BCH-AMR-2608', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 180, availQty: 110, reorderLevel: 30, purchasePrice: 82, sellingPrice: 112, mrp: 126, expiryDays: 375, status: 'IN_STOCK', rack: 'B-02' },
    { brand: 'Thyronorm 50', batch: 'BCH-THY-2609', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 160, availQty: 96, reorderLevel: 25, purchasePrice: 148, sellingPrice: 195, mrp: 218, expiryDays: 510, status: 'IN_STOCK', rack: 'B-03' },
    { brand: 'Dolo-650', batch: 'BCH-DOL-2610', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 600, availQty: 445, reorderLevel: 100, purchasePrice: 22, sellingPrice: 31, mrp: 35, expiryDays: 540, status: 'IN_STOCK', rack: 'C-01' },
    { brand: 'Crocin', batch: 'BCH-CRC-2611', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 450, availQty: 318, reorderLevel: 80, purchasePrice: 15, sellingPrice: 21, mrp: 24, expiryDays: 490, status: 'IN_STOCK', rack: 'C-02' },
    { brand: 'Combiflam', batch: 'BCH-CMB-2612', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 300, availQty: 194, reorderLevel: 50, purchasePrice: 32, sellingPrice: 44, mrp: 49, expiryDays: 430, status: 'IN_STOCK', rack: 'C-03' },
    { brand: 'Augmentin 625 Duo', batch: 'BCH-AUG-2613', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 200, availQty: 124, reorderLevel: 40, purchasePrice: 162, sellingPrice: 212, mrp: 235, expiryDays: 330, status: 'IN_STOCK', rack: 'D-01' },
    { brand: 'Pan 40', batch: 'BCH-PAN-2614', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 320, availQty: 215, reorderLevel: 50, purchasePrice: 105, sellingPrice: 142, mrp: 158, expiryDays: 460, status: 'IN_STOCK', rack: 'D-02' },
    { brand: 'Pan-D', batch: 'BCH-PND-2615', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 220, availQty: 148, reorderLevel: 40, purchasePrice: 142, sellingPrice: 188, mrp: 210, expiryDays: 410, status: 'IN_STOCK', rack: 'D-03' },
    { brand: 'Montair-LC', batch: 'BCH-MNT-2616', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 180, availQty: 92, reorderLevel: 30, purchasePrice: 156, sellingPrice: 204, mrp: 226, expiryDays: 350, status: 'IN_STOCK', rack: 'E-01' },
    { brand: 'Shelcal 500', batch: 'BCH-SHL-2617', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 250, availQty: 162, reorderLevel: 40, purchasePrice: 98, sellingPrice: 132, mrp: 146, expiryDays: 520, status: 'IN_STOCK', rack: 'F-01' },
    { brand: 'Electral', batch: 'BCH-ORS-2618', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 500, availQty: 360, reorderLevel: 80, purchasePrice: 16, sellingPrice: 22, mrp: 24, expiryDays: 600, status: 'IN_STOCK', rack: 'F-02' },
    // Low-Stock Items (triggers Pharmacy Reorder & Low-Stock Alerts)
    { brand: 'Azithral 500', batch: 'BCH-AZT-2619', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 120, availQty: 12, reorderLevel: 35, purchasePrice: 88, sellingPrice: 118, mrp: 132, expiryDays: 310, status: 'LOW_STOCK', rack: 'D-04' },
    { brand: 'Asthalin Inhaler', batch: 'BCH-AST-2620', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 80, availQty: 7, reorderLevel: 20, purchasePrice: 118, sellingPrice: 158, mrp: 175, expiryDays: 290, status: 'LOW_STOCK', rack: 'E-02' },
    { brand: 'Lantus SoloStar', batch: 'BCH-LNT-2621', supplier: 'Apex Cold-Chain Medical Supply', receivedQty: 50, availQty: 6, reorderLevel: 15, purchasePrice: 540, sellingPrice: 690, mrp: 750, expiryDays: 240, status: 'LOW_STOCK', rack: 'COLD-01' },
    // Near-Expiry & Out-of-Stock Items (triggers Pharmacy Expiry & Stockout Alerts)
    { brand: 'Ascoril D Plus', batch: 'BCH-ASC-2598', supplier: 'Bharat Lifesciences Wholesale Hub', receivedQty: 90, availQty: 28, reorderLevel: 20, purchasePrice: 92, sellingPrice: 124, mrp: 138, expiryDays: 19, status: 'NEAR_EXPIRY', rack: 'E-03' },
    { brand: 'Oflox-OZ', batch: 'BCH-OFX-2599', supplier: 'MedLife Pharma Distributors Pvt Ltd', receivedQty: 100, availQty: 0, reorderLevel: 25, purchasePrice: 110, sellingPrice: 148, mrp: 165, expiryDays: 280, status: 'OUT_OF_STOCK', rack: 'D-05' },
  ];

  const inventoryByBrand = new Map<string, typeof PharmacyInventoryModel.prototype>();
  for (const spec of inventorySeedSpecs) {
    const med = medByBrand.get(spec.brand);
    if (!med) continue;
    const inv = await PharmacyInventoryModel.create({
      pharmacyId: pharmacyUser._id,
      medicationCatalogId: med._id,
      medicationName: med.name,
      genericName: med.genericName,
      brandName: med.brandName,
      dosageForm: med.dosageForm,
      strength: med.strength,
      manufacturer: med.manufacturer,
      supplier: spec.supplier,
      invoiceNumber: `INV-2026-${spec.batch.slice(-4)}`,
      batchNumber: spec.batch,
      receivedQuantity: spec.receivedQty,
      availableQuantity: spec.availQty,
      reservedQuantity: 0,
      reorderLevel: spec.reorderLevel,
      purchasePrice: spec.purchasePrice,
      sellingPrice: spec.sellingPrice,
      mrp: spec.mrp,
      manufacturingDate: new Date(Date.now() - DAY_MS * 150),
      expiryDate: new Date(Date.now() + DAY_MS * spec.expiryDays),
      status: spec.status,
      rackLocation: spec.rack,
      isQuarantined: false,
    });
    inventoryByBrand.set(spec.brand, inv);
  }

  // =========================================================================
  // 5. ENCOUNTERS, MEDICAL RECORDS & PRESCRIPTIONS
  // =========================================================================
  logger.info('Seeding Clinical Encounters, Medical Records & Prescriptions...');
  const [encCardio, encEndo, encPulmo] = await Promise.all([
    EncounterModel.create({
      patientId: patientRamesh._id,
      practitionerId: drPriya._id,
      facilityId: delhiFacility._id,
      encounterType: 'AMBULATORY',
      startTime: new Date(Date.now() - DAY_MS * 3),
      endTime: new Date(Date.now() - DAY_MS * 3 + 1_800_000),
      status: 'COMPLETED',
      isDraft: false,
      notes:
        'Routine cardiovascular follow-up. BP 132/84 mmHg, HR 76 bpm, SpO2 99%. Mild exertion fatigue reported; lipid panel and HbA1c ordered.',
    }),
    EncounterModel.create({
      patientId: patientMeera._id,
      practitionerId: drArjun._id,
      facilityId: bengaluruFacility._id,
      encounterType: 'AMBULATORY',
      startTime: new Date(Date.now() - DAY_MS * 5),
      endTime: new Date(Date.now() - DAY_MS * 5 + 1_500_000),
      status: 'COMPLETED',
      isDraft: false,
      notes:
        'Quarterly Type 2 Diabetes & Hypothyroidism review. Fasting glucose improving; continued Metformin 500mg SR and Levothyroxine 50mcg.',
    }),
    EncounterModel.create({
      patientId: patientVikram._id,
      practitionerId: drAnanya._id,
      facilityId: mumbaiFacility._id,
      encounterType: 'VIRTUAL',
      startTime: new Date(Date.now() - DAY_MS * 9),
      endTime: new Date(Date.now() - DAY_MS * 9 + 1_200_000),
      status: 'COMPLETED',
      isDraft: false,
      notes:
        'Seasonal allergic bronchitis follow-up via teleconsultation. Night cough reduced significantly; inhaler technique reviewed.',
    }),
  ]);

  const pdfCardio = buildSyntheticPdfBase64(
    'Cardiology Outpatient Consultation Summary',
    'Patient: Ramesh Kumar Patel | Dr. Priya Sharma | BP 132/84 | Plan: Atorva 10, Telma 40'
  );
  const pdfLab = buildSyntheticPdfBase64(
    'Diagnostic Pathology Report - Lipid & HbA1c',
    'Total Chol 185 mg/dL | LDL 112 mg/dL (Borderline High) | HbA1c 5.6% (Normal)'
  );
  const pdfRx = buildSyntheticPdfBase64(
    'Digital Prescription Record - RX-2026-0001',
    'Atorva 10mg (0-0-1) | Telma 40mg (1-0-0) | Ecosprin 75mg (0-1-0) | 30 Days'
  );
  const pdfImmun = buildSyntheticPdfBase64(
    'Adult Immunization & Vaccination Certificate',
    'Quadrivalent Influenza Vaccine (2026-27) | Administered at AIIMS New Delhi Demo'
  );
  const pdfEndo = buildSyntheticPdfBase64(
    'Endocrinology Follow-Up Clinical Note',
    'Patient: Meera Nair | Dr. Arjun Mehta | Glycomet 500 SR & Thyronorm 50mcg'
  );

  await MedicalRecordModel.create([
    {
      patientId: patientRamesh._id,
      recordType: 'OP_CONSULTATION',
      title: 'Cardiology Consultation Note — Preventive Evaluation',
      description:
        'Presented with mild exertion dyspnea. Resting vitals stable (BP 132/84 mmHg). Advised extended lipid profile, HbA1c, and 30-day cardioprotective regimen.',
      source: 'MANUAL_ENTRY',
      resourceReference: `urn:healthbridge:encounter:${encCardio._id}`,
      recordDate: new Date(Date.now() - DAY_MS * 3),
      doctorName: drPriya.name,
      doctorId: drPriya._id,
      facilityName: delhiFacility.name,
      facilityId: delhiFacility._id,
      fileName: 'cardiology-consultation-2026.pdf',
      mimeType: 'application/pdf',
      fileSize: pdfCardio.size,
      fileData: pdfCardio.base64,
      sha256Checksum: pdfCardio.sha256,
      scanStatus: 'CLEAN',
      verificationStatus: 'VERIFIED',
      createdBy: drPriya._id,
    },
    {
      patientId: patientRamesh._id,
      recordType: 'DIAGNOSTIC_REPORT',
      title: 'Lipid Profile Extended & HbA1c Pathology Report',
      description:
        'National Pathology Diagnostics report: Total Cholesterol 185 mg/dL, HDL 48 mg/dL, LDL 112 mg/dL (mildly elevated), HbA1c 5.6%.',
      source: 'EHR_SYNC',
      recordDate: new Date(Date.now() - DAY_MS * 1),
      doctorName: drPriya.name,
      doctorId: drPriya._id,
      facilityName: 'National Pathology Diagnostics',
      facilityId: delhiFacility._id,
      fileName: 'lipid-hba1c-report-2026.pdf',
      mimeType: 'application/pdf',
      fileSize: pdfLab.size,
      fileData: pdfLab.base64,
      sha256Checksum: pdfLab.sha256,
      scanStatus: 'CLEAN',
      verificationStatus: 'VERIFIED',
      createdBy: labUser._id,
    },
    {
      patientId: patientRamesh._id,
      recordType: 'PRESCRIPTION',
      title: 'Cardiovascular Maintenance Digital Prescription (RX-2026-0001)',
      description:
        'Active 30-day prescription containing Atorva 10mg, Telma 40mg, and Ecosprin 75mg with low-sodium dietary guidance.',
      source: 'MANUAL_ENTRY',
      recordDate: new Date(Date.now() - DAY_MS * 3),
      doctorName: drPriya.name,
      doctorId: drPriya._id,
      facilityName: delhiFacility.name,
      facilityId: delhiFacility._id,
      fileName: 'rx-2026-0001-cardiology.pdf',
      mimeType: 'application/pdf',
      fileSize: pdfRx.size,
      fileData: pdfRx.base64,
      sha256Checksum: pdfRx.sha256,
      scanStatus: 'CLEAN',
      verificationStatus: 'VERIFIED',
      createdBy: drPriya._id,
    },
    {
      patientId: patientRamesh._id,
      recordType: 'IMMUNIZATION_RECORD',
      title: 'Annual Quadrivalent Influenza Immunization Record',
      description:
        'Seasonal quadrivalent inactivated influenza vaccine (0.5 mL IM, left deltoid). Zero adverse reaction observed during 15-minute post-vaccination monitoring.',
      source: 'ABDM_INGESTION',
      recordDate: new Date(Date.now() - DAY_MS * 45),
      doctorName: drPriya.name,
      doctorId: drPriya._id,
      facilityName: delhiFacility.name,
      facilityId: delhiFacility._id,
      fileName: 'influenza-immunization-2026.pdf',
      mimeType: 'application/pdf',
      fileSize: pdfImmun.size,
      fileData: pdfImmun.base64,
      sha256Checksum: pdfImmun.sha256,
      scanStatus: 'CLEAN',
      verificationStatus: 'VERIFIED',
      createdBy: drPriya._id,
    },
    {
      patientId: patientMeera._id,
      recordType: 'OP_CONSULTATION',
      title: 'Endocrinology Consultation — Diabetes & Thyroid Management',
      description:
        'Routine glycemic and thyroid review. HbA1c trending downwards (6.4%). Continued Metformin 500mg SR and Thyronorm 50mcg.',
      source: 'MANUAL_ENTRY',
      resourceReference: `urn:healthbridge:encounter:${encEndo._id}`,
      recordDate: new Date(Date.now() - DAY_MS * 5),
      doctorName: drArjun.name,
      doctorId: drArjun._id,
      facilityName: bengaluruFacility.name,
      facilityId: bengaluruFacility._id,
      fileName: 'endocrinology-review-meera.pdf',
      mimeType: 'application/pdf',
      fileSize: pdfEndo.size,
      fileData: pdfEndo.base64,
      sha256Checksum: pdfEndo.sha256,
      scanStatus: 'CLEAN',
      verificationStatus: 'VERIFIED',
      createdBy: drArjun._id,
    },
  ]);

  // Prescriptions linked to MedicationCatalog
  const [rxCardio, rxAcute, rxEndo] = await Promise.all([
    PrescriptionModel.create({
      prescriptionNumber: 'RX-2026-0001',
      patientId: patientRamesh._id,
      doctorId: drPriya._id,
      encounterId: encCardio._id,
      facilityId: delhiFacility._id,
      diagnosis: 'Essential Hypertension (Stage 1) & Borderline Dyslipidemia',
      medications: [
        {
          medicationCatalogId: medByBrand.get('Atorva 10')?._id,
          name: 'Atorva 10 Tablet',
          genericName: 'Atorvastatin Calcium',
          brandName: 'Atorva 10',
          strength: '10 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '0-0-1 (Nightly)',
          duration: '30 days',
          quantity: 30,
          instructions: 'Take once daily after dinner.',
          status: 'ACTIVE',
        },
        {
          medicationCatalogId: medByBrand.get('Telma 40')?._id,
          name: 'Telma 40 Tablet',
          genericName: 'Telmisartan',
          brandName: 'Telma 40',
          strength: '40 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '1-0-0 (Morning)',
          duration: '30 days',
          quantity: 30,
          instructions: 'Take in the morning with water; track blood pressure twice weekly.',
          status: 'ACTIVE',
        },
        {
          medicationCatalogId: medByBrand.get('Ecosprin 75')?._id,
          name: 'Ecosprin 75 Tablet',
          genericName: 'Aspirin (Acetylsalicylic Acid)',
          brandName: 'Ecosprin 75',
          strength: '75 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '0-1-0 (Afternoon)',
          duration: '30 days',
          quantity: 30,
          instructions: 'Take after lunch with full glass of water.',
          status: 'ACTIVE',
        },
      ],
      instructions: 'Maintain low-sodium diet (<5g salt/day) and 30 minutes of brisk walking 5 days/week.',
      followUpInstructions: 'Return in 4 weeks with fasting lipid profile and home BP log.',
      issuedAt: new Date(Date.now() - DAY_MS * 3),
      issuedBy: drPriya._id,
      validUntil: new Date(Date.now() + DAY_MS * 27),
      status: 'ACTIVE',
      isDraft: false,
      refillEligible: true,
      refillsAllowed: 2,
      refillsRemaining: 2,
    }),
    PrescriptionModel.create({
      prescriptionNumber: 'RX-2026-0002',
      patientId: patientRamesh._id,
      doctorId: drAnanya._id,
      facilityId: delhiFacility._id,
      diagnosis: 'Seasonal Viral Pharyngitis & Acid Reflux',
      medications: [
        {
          medicationCatalogId: medByBrand.get('Dolo-650')?._id,
          name: 'Paracetamol 650mg Tablet (Dolo-650)',
          genericName: 'Paracetamol',
          brandName: 'Dolo-650',
          strength: '650 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: 'SOS (Max 3/day)',
          duration: '5 days',
          quantity: 15,
          instructions: 'Take only for fever > 100°F or body ache after food.',
          status: 'ACTIVE',
        },
        {
          medicationCatalogId: medByBrand.get('Pan 40')?._id,
          name: 'Pan 40 Tablet',
          genericName: 'Pantoprazole Sodium',
          brandName: 'Pan 40',
          strength: '40 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '1-0-0 (Before Breakfast)',
          duration: '14 days',
          quantity: 15,
          instructions: 'Take 30 minutes before breakfast.',
          status: 'ACTIVE',
        },
      ],
      instructions: 'Warm saline gargles twice daily and adequate oral hydration.',
      followUpInstructions: 'Consult if fever persists beyond 72 hours.',
      issuedAt: new Date(Date.now() - DAY_MS * 1),
      issuedBy: drAnanya._id,
      validUntil: new Date(Date.now() + DAY_MS * 14),
      status: 'ACTIVE',
      isDraft: false,
      refillEligible: false,
      refillsAllowed: 0,
      refillsRemaining: 0,
    }),
    PrescriptionModel.create({
      prescriptionNumber: 'RX-2026-0003',
      patientId: patientMeera._id,
      doctorId: drArjun._id,
      encounterId: encEndo._id,
      facilityId: bengaluruFacility._id,
      diagnosis: 'Type 2 Diabetes Mellitus (Controlled) & Primary Hypothyroidism',
      medications: [
        {
          medicationCatalogId: medByBrand.get('Glycomet 500 SR')?._id,
          name: 'Glycomet 500 SR Tablet',
          genericName: 'Metformin Hydrochloride (Sustained Release)',
          brandName: 'Glycomet 500 SR',
          strength: '500 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '0-0-1 (With Dinner)',
          duration: '60 days',
          quantity: 60,
          instructions: 'Swallow whole with evening meal.',
          status: 'ACTIVE',
        },
        {
          medicationCatalogId: medByBrand.get('Thyronorm 50')?._id,
          name: 'Thyronorm 50mcg Tablet',
          genericName: 'Levothyroxine Sodium',
          brandName: 'Thyronorm 50',
          strength: '50 mcg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '1-0-0 (Empty Stomach)',
          duration: '60 days',
          quantity: 60,
          instructions: 'Take 45 minutes before tea or breakfast.',
          status: 'ACTIVE',
        },
      ],
      instructions: 'Continue structured low-glycemic Indian diet and monitor fasting glucose weekly.',
      followUpInstructions: 'Repeat HbA1c and TSH in 3 months.',
      issuedAt: new Date(Date.now() - DAY_MS * 5),
      issuedBy: drArjun._id,
      validUntil: new Date(Date.now() + DAY_MS * 55),
      status: 'ACTIVE',
      isDraft: false,
      refillEligible: true,
      refillsAllowed: 3,
      refillsRemaining: 3,
    }),
    PrescriptionModel.create({
      prescriptionNumber: 'RX-2026-0004',
      patientId: patientVikram._id,
      doctorId: drAnanya._id,
      encounterId: encPulmo._id,
      facilityId: mumbaiFacility._id,
      diagnosis: 'Allergic Bronchitis with Mild Bronchospasm',
      medications: [
        {
          medicationCatalogId: medByBrand.get('Montair-LC')?._id,
          name: 'Montair-LC Tablet',
          genericName: 'Levocetirizine + Montelukast Sodium',
          brandName: 'Montair-LC',
          strength: '5 mg / 10 mg',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '0-0-1 (Bedtime)',
          duration: '10 days',
          quantity: 10,
          instructions: 'Take at bedtime.',
          status: 'COMPLETED',
        },
        {
          medicationCatalogId: medByBrand.get('Asthalin Inhaler')?._id,
          name: 'Asthalin Inhaler 100mcg',
          genericName: 'Salbutamol (Albuterol)',
          brandName: 'Asthalin Inhaler',
          strength: '100 mcg / actuation',
          dosage: '2 puffs',
          route: 'Inhalation',
          frequency: 'SOS for wheezing',
          duration: '30 days',
          quantity: 1,
          instructions: 'Rinse mouth after inhalation.',
          status: 'COMPLETED',
        },
      ],
      instructions: 'Avoid dust/smoke exposure; use spacer with inhaler if needed.',
      issuedAt: new Date(Date.now() - DAY_MS * 9),
      issuedBy: drAnanya._id,
      validUntil: new Date(Date.now() + DAY_MS * 21),
      status: 'DISPENSED',
      isDraft: false,
      refillEligible: false,
      refillsAllowed: 0,
      refillsRemaining: 0,
    }),
  ]);

  // =========================================================================
  // 6. PHARMACY ORDERS (Pending Queue, Ready for Pickup, Completed Analytics)
  // =========================================================================
  logger.info('Seeding Pharmacy Fulfillment Orders...');
  const invAtorva = inventoryByBrand.get('Atorva 10');
  const invTelma = inventoryByBrand.get('Telma 40');
  const invDolo = inventoryByBrand.get('Dolo-650');
  const invPan = inventoryByBrand.get('Pan 40');
  const invGlycomet = inventoryByBrand.get('Glycomet 500 SR');
  const invThyronorm = inventoryByBrand.get('Thyronorm 50');

  await PharmacyOrderModel.create([
    {
      orderNumber: 'RX-ORD-DEMO-1001',
      pharmacyId: pharmacyUser._id,
      pharmacyName: pharmacyUser.name,
      patientId: patientRamesh._id,
      patientName: patientRamesh.name,
      patientPhone: patientRamesh.phone,
      prescriptionId: rxCardio._id,
      prescriptionNumber: rxCardio.prescriptionNumber,
      doctorId: drPriya._id,
      doctorName: drPriya.name,
      facilityId: delhiFacility._id,
      facilityName: delhiFacility.name,
      items: [
        {
          inventoryId: invAtorva?._id,
          medicationCatalogId: medByBrand.get('Atorva 10')?._id,
          medicationName: 'Atorva 10 Tablet',
          genericName: 'Atorvastatin Calcium',
          brandName: 'Atorva 10',
          strength: '10 mg',
          dosageForm: 'TABLET',
          quantity: 2,
          requestedQuantity: 2,
          fulfilledQuantity: 0,
          remainingQuantity: 2,
          fulfillmentStatus: 'UNFULFILLED',
          unitPrice: 72,
          totalPrice: 144,
          batchNumber: invAtorva?.batchNumber,
          instructions: 'Take after dinner',
        },
        {
          inventoryId: invTelma?._id,
          medicationCatalogId: medByBrand.get('Telma 40')?._id,
          medicationName: 'Telma 40 Tablet',
          genericName: 'Telmisartan',
          brandName: 'Telma 40',
          strength: '40 mg',
          dosageForm: 'TABLET',
          quantity: 2,
          requestedQuantity: 2,
          fulfilledQuantity: 0,
          remainingQuantity: 2,
          fulfillmentStatus: 'UNFULFILLED',
          unitPrice: 192,
          totalPrice: 384,
          batchNumber: invTelma?.batchNumber,
          instructions: 'Take in morning',
        },
      ],
      subtotal: 528,
      tax: 26.4,
      discount: 20,
      totalAmount: 534.4,
      fulfillmentType: 'IN_STORE_PICKUP',
      status: 'PENDING',
      notes: 'Patient requested 30-day cardiology refill for evening pickup.',
      statusHistory: [
        {
          newStatus: 'PENDING',
          actorId: patientRamesh._id,
          actorName: patientRamesh.name,
          actorRole: 'PATIENT',
          reason: 'Order placed against digital prescription RX-2026-0001',
          timestamp: new Date(Date.now() - 3_600_000 * 4),
        },
      ],
    },
    {
      orderNumber: 'RX-ORD-DEMO-1002',
      pharmacyId: pharmacyUser._id,
      pharmacyName: pharmacyUser.name,
      patientId: patientRamesh._id,
      patientName: patientRamesh.name,
      patientPhone: patientRamesh.phone,
      prescriptionId: rxAcute._id,
      prescriptionNumber: rxAcute.prescriptionNumber,
      doctorId: drAnanya._id,
      doctorName: drAnanya.name,
      facilityId: delhiFacility._id,
      facilityName: delhiFacility.name,
      items: [
        {
          inventoryId: invDolo?._id,
          medicationCatalogId: medByBrand.get('Dolo-650')?._id,
          medicationName: 'Paracetamol 650mg Tablet (Dolo-650)',
          genericName: 'Paracetamol',
          brandName: 'Dolo-650',
          strength: '650 mg',
          dosageForm: 'TABLET',
          quantity: 1,
          requestedQuantity: 1,
          fulfilledQuantity: 1,
          remainingQuantity: 0,
          fulfillmentStatus: 'FULFILLED',
          unitPrice: 31,
          totalPrice: 31,
          batchNumber: invDolo?.batchNumber,
        },
        {
          inventoryId: invPan?._id,
          medicationCatalogId: medByBrand.get('Pan 40')?._id,
          medicationName: 'Pan 40 Tablet',
          genericName: 'Pantoprazole Sodium',
          brandName: 'Pan 40',
          strength: '40 mg',
          dosageForm: 'TABLET',
          quantity: 1,
          requestedQuantity: 1,
          fulfilledQuantity: 1,
          remainingQuantity: 0,
          fulfillmentStatus: 'FULFILLED',
          unitPrice: 142,
          totalPrice: 142,
          batchNumber: invPan?.batchNumber,
        },
      ],
      subtotal: 173,
      tax: 8.65,
      discount: 0,
      totalAmount: 181.65,
      fulfillmentType: 'IN_STORE_PICKUP',
      status: 'READY_FOR_PICKUP',
      pickupDetails: {
        pickupReference: 'PKP-DEMO-8841',
        pickupInstructions: 'Collect from Counter 2 (Express Digital Rx Lane).',
        expiresAt: new Date(Date.now() + DAY_MS * 3),
        verificationAttempts: 0,
        maxAttempts: 5,
        isVerified: false,
      },
      statusHistory: [
        {
          newStatus: 'PENDING',
          actorId: patientRamesh._id,
          actorName: patientRamesh.name,
          actorRole: 'PATIENT',
          timestamp: new Date(Date.now() - DAY_MS),
        },
        {
          previousStatus: 'PENDING',
          newStatus: 'READY_FOR_PICKUP',
          actorId: pharmacyUser._id,
          actorName: pharmacyUser.name,
          actorRole: 'PHARMACY',
          reason: 'Packed and verified by duty pharmacist',
          timestamp: new Date(Date.now() - 3_600_000 * 6),
        },
      ],
    },
    {
      orderNumber: 'RX-ORD-DEMO-1003',
      pharmacyId: pharmacyUser._id,
      pharmacyName: pharmacyUser.name,
      patientId: patientMeera._id,
      patientName: patientMeera.name,
      patientPhone: patientMeera.phone,
      prescriptionId: rxEndo._id,
      prescriptionNumber: rxEndo.prescriptionNumber,
      doctorId: drArjun._id,
      doctorName: drArjun.name,
      facilityId: bengaluruFacility._id,
      facilityName: bengaluruFacility.name,
      items: [
        {
          inventoryId: invGlycomet?._id,
          medicationCatalogId: medByBrand.get('Glycomet 500 SR')?._id,
          medicationName: 'Glycomet 500 SR Tablet',
          genericName: 'Metformin Hydrochloride (Sustained Release)',
          brandName: 'Glycomet 500 SR',
          strength: '500 mg',
          dosageForm: 'TABLET',
          quantity: 3,
          requestedQuantity: 3,
          fulfilledQuantity: 3,
          remainingQuantity: 0,
          fulfillmentStatus: 'FULFILLED',
          unitPrice: 49,
          totalPrice: 147,
          batchNumber: invGlycomet?.batchNumber,
        },
        {
          inventoryId: invThyronorm?._id,
          medicationCatalogId: medByBrand.get('Thyronorm 50')?._id,
          medicationName: 'Thyronorm 50mcg Tablet',
          genericName: 'Levothyroxine Sodium',
          brandName: 'Thyronorm 50',
          strength: '50 mcg',
          dosageForm: 'TABLET',
          quantity: 1,
          requestedQuantity: 1,
          fulfilledQuantity: 1,
          remainingQuantity: 0,
          fulfillmentStatus: 'FULFILLED',
          unitPrice: 195,
          totalPrice: 195,
          batchNumber: invThyronorm?.batchNumber,
        },
      ],
      subtotal: 342,
      tax: 17.1,
      discount: 15,
      totalAmount: 344.1,
      fulfillmentType: 'HOME_DELIVERY',
      deliveryAddress: {
        line1: '14, Indiranagar 2nd Stage',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
      },
      status: 'COMPLETED',
      statusHistory: [
        {
          newStatus: 'PENDING',
          actorId: patientMeera._id,
          actorName: patientMeera.name,
          actorRole: 'PATIENT',
          timestamp: new Date(Date.now() - DAY_MS * 4),
        },
        {
          previousStatus: 'PENDING',
          newStatus: 'COMPLETED',
          actorId: pharmacyUser._id,
          actorName: pharmacyUser.name,
          actorRole: 'PHARMACY',
          reason: 'Delivered and signed by patient',
          timestamp: new Date(Date.now() - DAY_MS * 3),
        },
      ],
    },
  ]);

  // =========================================================================
  // 7. APPOINTMENTS (Upcoming, Today Queue, Teleconsult, Completed)
  // =========================================================================
  logger.info('Seeding Clinical Appointments...');
  const todaySlot = new Date();
  todaySlot.setHours(11, 0, 0, 0);

  await AppointmentModel.create([
    {
      patientId: patientRamesh._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      scheduledAt: new Date(Date.now() + DAY_MS * 5),
      startTime: '10:30',
      endTime: '11:00',
      consultationType: 'IN_PERSON',
      reason: 'Follow-up Cardiology Evaluation & Lipid Profile Review',
      notes: 'Bring home BP log and recent lipid panel printout.',
      status: 'CONFIRMED',
      confirmedBy: drPriya._id,
    },
    {
      patientId: patientRamesh._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      scheduledAt: new Date(Date.now() + 3_600_000 * 2),
      startTime: '17:00',
      endTime: '17:20',
      consultationType: 'TELECONSULTATION',
      reason: 'Encrypted Video Follow-Up — Blood Pressure & Lipid Review',
      notes: 'Keep recent digital BP readings ready for video review.',
      status: 'CONFIRMED',
      confirmedBy: drPriya._id,
    },
    {
      patientId: patientMeera._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      scheduledAt: new Date(Date.now() + DAY_MS * 1 + 3_600_000 * 6),
      startTime: '15:30',
      endTime: '15:50',
      consultationType: 'TELECONSULTATION',
      reason: 'Video Consultation Request — Preventive Cardiology Screening',
      status: 'REQUESTED',
    },
    {
      patientId: patientRamesh._id,
      doctorId: drAnanya._id,
      facilityId: mumbaiFacility._id,
      scheduledAt: new Date(Date.now() + DAY_MS * 2),
      startTime: '16:00',
      endTime: '16:20',
      consultationType: 'TELECONSULTATION',
      reason: 'Telehealth Follow-up for Seasonal Pharyngitis Recovery',
      status: 'CONFIRMED',
      confirmedBy: drAnanya._id,
    },
    {
      patientId: patientMeera._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      scheduledAt: todaySlot,
      startTime: '11:00',
      endTime: '11:30',
      consultationType: 'IN_PERSON',
      reason: 'Preventive Cardiac Risk Screening (Diabetic Profile)',
      status: 'CHECKED_IN',
      checkedInAt: new Date(Date.now() - 900_000),
      queueNumber: 4,
    },
    {
      patientId: patientVikram._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      scheduledAt: new Date(Date.now() + DAY_MS * 1),
      startTime: '09:30',
      endTime: '10:00',
      consultationType: 'IN_PERSON',
      reason: 'Chest Tightness & Treadmill Test Pre-Evaluation',
      status: 'SCHEDULED',
    },
    {
      patientId: patientRamesh._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      scheduledAt: new Date(Date.now() - DAY_MS * 3),
      startTime: '10:00',
      endTime: '10:30',
      consultationType: 'IN_PERSON',
      reason: 'Baseline Cardiovascular Checkup',
      status: 'COMPLETED',
      completedAt: new Date(Date.now() - DAY_MS * 3 + 1_800_000),
      completedBy: drPriya._id,
      encounterId: encCardio._id,
    },
  ]);

  // =========================================================================
  // 8. DIAGNOSTIC LAB TEST CATALOGUE, ORDERS & REPORTS
  // =========================================================================
  logger.info('Seeding Lab Test Catalogue, Orders & Published Reports...');
  await LabTestModel.create([
    {
      laboratoryId: labProfile._id,
      facilityId: delhiFacility._id,
      testName: 'Lipid Profile Extended',
      testCode: 'LIPID-01',
      category: 'BIOCHEMISTRY',
      description: 'Measures Total Cholesterol, HDL, LDL, VLDL, and Triglycerides for cardiovascular risk assessment.',
      specimenType: 'SERUM',
      collectionMethod: 'Venipuncture',
      preparationInstructions: '10-12 hours overnight fasting required; plain water allowed.',
      containerRequirements: 'SST Gold-Top Tube (5 mL)',
      fastingRequirement: true,
      fastingDurationHours: 12,
      expectedTurnaroundTime: '6 Hours',
      price: 750,
      isActive: true,
      performingDepartment: 'Clinical Biochemistry',
    },
    {
      laboratoryId: labProfile._id,
      facilityId: delhiFacility._id,
      testName: 'Glycated Hemoglobin (HbA1c)',
      testCode: 'HBA1C-01',
      category: 'BIOCHEMISTRY',
      description: '3-month average blood glucose indicator via HPLC method.',
      specimenType: 'WHOLE_BLOOD',
      collectionMethod: 'Venipuncture',
      preparationInstructions: 'No fasting required.',
      containerRequirements: 'EDTA Lavender-Top Tube (3 mL)',
      fastingRequirement: false,
      expectedTurnaroundTime: '4 Hours',
      price: 550,
      isActive: true,
      performingDepartment: 'Clinical Biochemistry',
    },
    {
      laboratoryId: labProfile._id,
      facilityId: delhiFacility._id,
      testName: 'Complete Blood Count (CBC)',
      testCode: 'CBC-01',
      category: 'HEMATOLOGY',
      description: '24-parameter hematology panel including Hemoglobin, WBC, RBC, Platelets, and Differential.',
      specimenType: 'WHOLE_BLOOD',
      collectionMethod: 'Venipuncture',
      preparationInstructions: 'No fasting required.',
      containerRequirements: 'EDTA Lavender-Top Tube (3 mL)',
      fastingRequirement: false,
      expectedTurnaroundTime: '3 Hours',
      price: 350,
      isActive: true,
      performingDepartment: 'Hematology',
    },
    {
      laboratoryId: labProfile._id,
      facilityId: delhiFacility._id,
      testName: 'Thyroid Function Panel (T3, T4, TSH)',
      testCode: 'TFT-01',
      category: 'BIOCHEMISTRY',
      description: 'Quantitative chemiluminescence immunoassay for thyroid health evaluation.',
      specimenType: 'SERUM',
      collectionMethod: 'Venipuncture',
      preparationInstructions: 'Morning sample preferred prior to levothyroxine dose.',
      containerRequirements: 'SST Gold-Top Tube (4 mL)',
      fastingRequirement: false,
      expectedTurnaroundTime: '8 Hours',
      price: 650,
      isActive: true,
      performingDepartment: 'Immunoassay & Endocrinology',
    },
    {
      laboratoryId: labProfile._id,
      facilityId: delhiFacility._id,
      testName: 'Liver Function Test (LFT)',
      testCode: 'LFT-01',
      category: 'BIOCHEMISTRY',
      description: 'SGOT, SGPT, Bilirubin (Total/Direct), ALP, Total Protein, and Albumin.',
      specimenType: 'SERUM',
      collectionMethod: 'Venipuncture',
      preparationInstructions: '8 hours fasting recommended; avoid alcohol for 24 hours.',
      containerRequirements: 'SST Gold-Top Tube (5 mL)',
      fastingRequirement: true,
      fastingDurationHours: 8,
      expectedTurnaroundTime: '6 Hours',
      price: 600,
      isActive: true,
      performingDepartment: 'Clinical Biochemistry',
    },
    {
      laboratoryId: labProfile._id,
      facilityId: delhiFacility._id,
      testName: 'Kidney Function Test (KFT / RFT)',
      testCode: 'KFT-01',
      category: 'BIOCHEMISTRY',
      description: 'Serum Creatinine, Blood Urea, Uric Acid, eGFR, and Electrolytes (Na+, K+, Cl-).',
      specimenType: 'SERUM',
      collectionMethod: 'Venipuncture',
      preparationInstructions: 'Stay well hydrated prior to sample collection.',
      containerRequirements: 'SST Gold-Top Tube (5 mL)',
      fastingRequirement: false,
      expectedTurnaroundTime: '6 Hours',
      price: 650,
      isActive: true,
      performingDepartment: 'Clinical Biochemistry',
    },
  ]);

  const [labOrderCompleted, labOrderInProgress] = await Promise.all([
    LaboratoryOrderModel.create({
      orderNumber: 'LAB-ORD-DEMO-2001',
      patientId: patientRamesh._id,
      orderedBy: drPriya._id,
      encounterId: encCardio._id,
      laboratoryId: labUser._id,
      facilityId: delhiFacility._id,
      tests: [
        { testCode: 'LIPID-01', testName: 'Lipid Profile Extended', category: 'BIOCHEMISTRY', specimenType: 'SERUM' },
        { testCode: 'HBA1C-01', testName: 'Glycated Hemoglobin (HbA1c)', category: 'BIOCHEMISTRY', specimenType: 'WHOLE_BLOOD' },
      ],
      status: 'COMPLETED',
      priority: 'ROUTINE',
      collectionStatus: 'ACCESSIONED',
      orderedAt: new Date(Date.now() - DAY_MS * 2),
      acceptedAt: new Date(Date.now() - DAY_MS * 2 + 3_600_000),
      clinicalNotes: 'Fasting cardiovascular risk baseline assessment.',
    }),
    LaboratoryOrderModel.create({
      orderNumber: 'LAB-ORD-DEMO-2002',
      patientId: patientMeera._id,
      orderedBy: drArjun._id,
      encounterId: encEndo._id,
      laboratoryId: labUser._id,
      facilityId: delhiFacility._id,
      tests: [
        { testCode: 'TFT-01', testName: 'Thyroid Function Panel (T3, T4, TSH)', category: 'BIOCHEMISTRY', specimenType: 'SERUM' },
        { testCode: 'HBA1C-01', testName: 'Glycated Hemoglobin (HbA1c)', category: 'BIOCHEMISTRY', specimenType: 'WHOLE_BLOOD' },
      ],
      status: 'COMPLETED',
      priority: 'ROUTINE',
      collectionStatus: 'ACCESSIONED',
      orderedAt: new Date(Date.now() - DAY_MS * 4),
      acceptedAt: new Date(Date.now() - DAY_MS * 4 + 1_800_000),
      clinicalNotes: 'Quarterly endocrine monitoring.',
    }),
    LaboratoryOrderModel.create({
      orderNumber: 'LAB-ORD-DEMO-2003',
      patientId: patientRamesh._id,
      orderedBy: drPriya._id,
      laboratoryId: labUser._id,
      facilityId: delhiFacility._id,
      tests: [
        { testCode: 'CBC-01', testName: 'Complete Blood Count (CBC)', category: 'HEMATOLOGY', specimenType: 'WHOLE_BLOOD' },
        { testCode: 'KFT-01', testName: 'Kidney Function Test (KFT / RFT)', category: 'BIOCHEMISTRY', specimenType: 'SERUM' },
      ],
      status: 'SAMPLE_COLLECTED',
      priority: 'URGENT',
      collectionStatus: 'COLLECTED',
      orderedAt: new Date(Date.now() - 3_600_000 * 5),
      acceptedAt: new Date(Date.now() - 3_600_000 * 4),
      clinicalNotes: 'Pre-medication renal baseline check for Telmisartan therapy.',
    }),
  ]);

  const [reportCardio, reportEndo] = await Promise.all([
    LaboratoryReportModel.create({
      reportNumber: 'LAB-RPT-DEMO-3001',
      patientId: patientRamesh._id,
      laboratoryId: labUser._id,
      orderId: labOrderCompleted._id,
      doctorId: drPriya._id,
      facilityId: delhiFacility._id,
      testName: 'Lipid Profile Extended & HbA1c',
      category: 'BIOCHEMISTRY',
      testDate: new Date(Date.now() - DAY_MS * 2),
      publishedAt: new Date(Date.now() - DAY_MS * 1),
      status: 'PUBLISHED',
      currentVersion: 1,
      tests: [
        { testCode: 'LIPID-01', testName: 'Lipid Profile Extended', specimenType: 'SERUM', category: 'BIOCHEMISTRY' },
        { testCode: 'HBA1C-01', testName: 'Glycated Hemoglobin (HbA1c)', specimenType: 'WHOLE_BLOOD', category: 'BIOCHEMISTRY' },
      ],
      observations: [
        {
          parameterCode: 'CHOL-TOT',
          testName: 'Total Cholesterol',
          value: '185',
          numericValue: 185,
          unit: 'mg/dL',
          referenceRange: '< 200 mg/dL',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
        {
          parameterCode: 'HDL',
          testName: 'HDL Cholesterol',
          value: '48',
          numericValue: 48,
          unit: 'mg/dL',
          referenceRange: '> 40 mg/dL',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
        {
          parameterCode: 'LDL',
          testName: 'LDL Cholesterol',
          value: '112',
          numericValue: 112,
          unit: 'mg/dL',
          referenceRange: '< 100 mg/dL',
          interpretation: 'ABOVE_RANGE',
          flag: 'HIGH',
          isAbnormal: true,
        },
        {
          parameterCode: 'TRIG',
          testName: 'Serum Triglycerides',
          value: '138',
          numericValue: 138,
          unit: 'mg/dL',
          referenceRange: '< 150 mg/dL',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
        {
          parameterCode: 'HBA1C',
          testName: 'HbA1c (Glycated Hemoglobin)',
          value: '5.6',
          numericValue: 5.6,
          unit: '%',
          referenceRange: '< 5.7 %',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
      ],
      reportUrl: 'https://storage.healthbridge.local/reports/synthetic-report-3001.pdf',
      clinicalNotes: 'Mild borderline elevation in LDL Cholesterol; glycemic control within normal limits.',
      interpretation: 'Correlate clinically with Atorvastatin 10mg lipid-lowering regimen.',
    }),
    LaboratoryReportModel.create({
      reportNumber: 'LAB-RPT-DEMO-3002',
      patientId: patientMeera._id,
      laboratoryId: labUser._id,
      orderId: labOrderInProgress._id,
      doctorId: drArjun._id,
      facilityId: delhiFacility._id,
      testName: 'Thyroid Function Panel & HbA1c',
      category: 'BIOCHEMISTRY',
      testDate: new Date(Date.now() - DAY_MS * 4),
      publishedAt: new Date(Date.now() - DAY_MS * 3),
      status: 'PUBLISHED',
      currentVersion: 1,
      tests: [
        { testCode: 'TFT-01', testName: 'Thyroid Function Panel (T3, T4, TSH)', specimenType: 'SERUM', category: 'BIOCHEMISTRY' },
        { testCode: 'HBA1C-01', testName: 'Glycated Hemoglobin (HbA1c)', specimenType: 'WHOLE_BLOOD', category: 'BIOCHEMISTRY' },
      ],
      observations: [
        {
          parameterCode: 'TSH',
          testName: 'Serum TSH (Ultrasensitive)',
          value: '3.1',
          numericValue: 3.1,
          unit: 'µIU/mL',
          referenceRange: '0.4 - 4.2 µIU/mL',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
        {
          parameterCode: 'FT4',
          testName: 'Free T4',
          value: '1.18',
          numericValue: 1.18,
          unit: 'ng/dL',
          referenceRange: '0.8 - 1.8 ng/dL',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
        {
          parameterCode: 'HBA1C',
          testName: 'HbA1c (Glycated Hemoglobin)',
          value: '6.4',
          numericValue: 6.4,
          unit: '%',
          referenceRange: '< 6.5 % (Target)',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
        },
      ],
      reportUrl: 'https://storage.healthbridge.local/reports/synthetic-report-3002.pdf',
      clinicalNotes: 'Euthyroid on Levothyroxine 50mcg; good glycemic control.',
    }),
  ]);

  await Promise.all([
    LaboratoryOrderModel.updateOne({ _id: labOrderCompleted._id }, { $set: { reportId: reportCardio._id } }),
    LaboratoryOrderModel.updateOne({ _id: labOrderInProgress._id }, { $set: { reportId: reportEndo._id } }),
  ]);

  // =========================================================================
  // 9. ABDM CONSENT REQUESTS (1 Granted/Active + 1 Pending Patient Decision)
  // =========================================================================
  logger.info('Seeding ABDM Consent Requests & Artifacts...');
  const [grantedConsentReq] = await Promise.all([
    ConsentRequestModel.create({
      patientId: patientRamesh._id,
      requesterId: drPriya._id,
      requesterName: 'Dr. Priya Sharma (AIIMS Cardiology)',
      requesterRole: 'DOCTOR',
      organization: delhiFacility.name,
      facilityId: delhiFacility._id,
      purpose: 'CAREMGT',
      purposeDescription: 'Access longitudinal medical records for ongoing cardiovascular care',
      requestedDataTypes: ['OP_CONSULTATION', 'DIAGNOSTIC_REPORT', 'PRESCRIPTION'],
      dateRange: {
        from: new Date(Date.now() - DAY_MS * 365),
        to: new Date(),
      },
      requestedAt: new Date(Date.now() - DAY_MS * 2),
      approvedAt: new Date(Date.now() - DAY_MS * 2 + 1_800_000),
      status: 'GRANTED',
      expiresAt: new Date(Date.now() + DAY_MS * 30),
    }),
    ConsentRequestModel.create({
      patientId: patientRamesh._id,
      requesterId: drArjun._id,
      requesterName: 'Dr. Arjun Mehta (Apollo Spectra Endocrinology)',
      requesterRole: 'DOCTOR',
      organization: bengaluruFacility.name,
      facilityId: bengaluruFacility._id,
      purpose: 'CAREMGT',
      purposeDescription: 'Review recent HbA1c and Lipid Profile reports for metabolic screening',
      requestedDataTypes: ['DIAGNOSTIC_REPORT', 'PRESCRIPTION'],
      dateRange: {
        from: new Date(Date.now() - DAY_MS * 180),
        to: new Date(),
      },
      requestedAt: new Date(Date.now() - 3_600_000 * 3),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + DAY_MS * 14),
    }),
  ]);

  await ConsentArtifactModel.create({
    consentRequestId: grantedConsentReq._id,
    patientId: patientRamesh._id,
    requesterId: drPriya._id,
    requesterName: 'Dr. Priya Sharma (AIIMS Cardiology)',
    purpose: 'CAREMGT',
    permittedDataTypes: ['OP_CONSULTATION', 'DIAGNOSTIC_REPORT', 'PRESCRIPTION'],
    validityPeriod: {
      from: new Date(Date.now() - DAY_MS * 2),
      to: new Date(Date.now() + DAY_MS * 30),
    },
    consentStatus: 'ACTIVE',
    approvedAt: new Date(Date.now() - DAY_MS * 2 + 1_800_000),
    signature: 'SHA256_RSA_DEMO_SIGNATURE_HB_ABDM_TEST_2026',
  });

  // =========================================================================
  // 10. ROLE-SCOPED NOTIFICATIONS (Across All 5 Demo Accounts)
  // =========================================================================
  logger.info('Seeding Multi-Role Portal Notifications...');
  await NotificationModel.create([
    {
      userId: patientRamesh._id,
      userRole: 'PATIENT',
      category: 'LAB',
      eventType: 'LAB_REPORT_PUBLISHED',
      title: 'Lab Report Ready: Lipid Profile & HbA1c',
      message: 'National Pathology Diagnostics published your report (LAB-RPT-DEMO-3001).',
      priority: 'HIGH',
      type: 'LAB_REPORT',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/patient/reports',
      isRead: false,
    },
    {
      userId: patientRamesh._id,
      userRole: 'PATIENT',
      category: 'CONSENT',
      eventType: 'CONSENT_REQUESTED',
      title: 'New ABDM Consent Request from Dr. Arjun Mehta',
      message: 'Approve or decline access to your diagnostic reports and prescriptions.',
      priority: 'HIGH',
      type: 'CONSENT_REQUEST',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/patient/consent',
      isRead: false,
    },
    {
      userId: patientRamesh._id,
      userRole: 'PATIENT',
      category: 'ORDER',
      eventType: 'ORDER_READY_FOR_PICKUP',
      title: 'Medicines Ready for Pickup (RX-ORD-DEMO-1002)',
      message: 'Your order at Sanjivani Medicos Pharmacy is packed. Pickup ref: PKP-DEMO-8841.',
      priority: 'MEDIUM',
      type: 'ORDER',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/patient/prescriptions',
      isRead: false,
    },
    {
      userId: drPriya._id,
      userRole: 'DOCTOR',
      category: 'APPOINTMENT',
      eventType: 'PATIENT_CHECKED_IN',
      title: 'Patient Checked In: Meera Nair (Queue #4)',
      message: 'Preventive Cardiac Risk Screening appointment is checked in at OPD Desk.',
      priority: 'HIGH',
      type: 'APPOINTMENT',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/doctor/appointments',
      isRead: false,
    },
    {
      userId: pharmacyUser._id,
      userRole: 'PHARMACY',
      category: 'INVENTORY',
      eventType: 'LOW_STOCK_ALERT',
      title: 'Inventory Alert: 3 Low-Stock & 1 Out-of-Stock Medicine',
      message: 'Azithral 500, Asthalin Inhaler, and Lantus SoloStar are below reorder threshold; Oflox-OZ is out of stock.',
      priority: 'CRITICAL',
      type: 'INVENTORY',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/pharmacy/alerts',
      isRead: false,
    },
    {
      userId: pharmacyUser._id,
      userRole: 'PHARMACY',
      category: 'ORDER',
      eventType: 'NEW_RX_ORDER',
      title: 'New Prescription Order RX-ORD-DEMO-1001',
      message: 'Ramesh Kumar Patel submitted a 30-day refill for Atorva 10 & Telma 40.',
      priority: 'HIGH',
      type: 'ORDER',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/pharmacy/orders',
      isRead: false,
    },
    {
      userId: labUser._id,
      userRole: 'LABORATORY',
      category: 'LAB',
      eventType: 'URGENT_SAMPLE_COLLECTED',
      title: 'Urgent Sample Ready for Analysis (LAB-ORD-DEMO-2003)',
      message: 'CBC & Kidney Function Test specimen collected for Ramesh Kumar Patel.',
      priority: 'HIGH',
      type: 'LAB_REPORT',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/laboratory/orders',
      isRead: false,
    },
    {
      userId: adminUser._id,
      userRole: 'ADMIN',
      category: 'SYSTEM',
      eventType: 'SEED_SUMMARY',
      title: 'Synthetic Healthcare Dataset Loaded',
      message: '30 medicines, 23 pharmacy inventory batches, 3 facilities, 9 demo accounts, and clinical records are active.',
      priority: 'MEDIUM',
      type: 'SYSTEM_ALERT',
      deliveryStatus: 'DELIVERED',
      linkUrl: '/admin/dashboard',
      isRead: false,
    },
  ]);

  // =========================================================================
  // 11. APPEND-ONLY AUDIT LOG
  // =========================================================================
  logger.info('Recording Seed Audit Event...');
  await AuditLogModel.create({
    actorId: adminUser._id,
    action: 'SEED_SYNTHETIC_HEALTHCARE_AND_MEDICINES',
    resourceType: 'SYSTEM',
    resourceId: 'INITIAL_SEED',
    timestamp: new Date(),
    requestId: 'req-seed-' + Date.now(),
    outcome: 'SUCCESS',
    metadata: {
      facilities: 3,
      users: 9,
      medications: allMedicines.length,
      pharmacySuppliers: 3,
      pharmacyInventoryBatches: inventorySeedSpecs.length,
      pharmacyOrders: 3,
      prescriptions: 4,
      medicalRecords: 5,
      appointments: 5,
      labTests: 6,
      labOrders: 3,
      labReports: 2,
      consents: 2,
      notifications: 8,
      environment: process.env.NODE_ENV || 'development',
    },
  });

  logger.info(
    `✅ HealthBridge database seeded successfully: ${allMedicines.length} medicines, ${inventorySeedSpecs.length} pharmacy stock batches, 3 suppliers, 6 lab tests, 4 prescriptions, 5 medical records, 5 appointments, and 9 demo accounts.`
  );
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
