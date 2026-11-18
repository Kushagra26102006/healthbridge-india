/**
 * HealthBridge India — Centralized Visual Asset Manifest
 *
 * Single source of truth for all verified local imagery and original SVG illustrations.
 * Zero external hotlinks, zero unlicensed stock imagery, zero fake government seals.
 */

export type VisualAssetCategory =
  | 'landing'
  | 'patient'
  | 'doctor'
  | 'pharmacy'
  | 'laboratory'
  | 'admin'
  | 'abdm'
  | 'security'
  | 'documents'
  | 'empty-states';

export interface VisualAssetEntry {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly format: 'webp' | 'svg';
  readonly category: VisualAssetCategory;
  readonly intendedPages: readonly string[];
  readonly alt: string;
  readonly decorative?: boolean;
  readonly license: string;
}

export const EDITORIAL_ASSETS = {
  heroHealthcarePlatform: {
    src: '/images/landing/hero-healthcare-platform.webp',
    width: 1200,
    height: 806,
    format: 'webp',
    category: 'landing',
    intendedPages: ['/'],
    alt: 'Modern medical consultation desk with a digital ECG tablet display and stethoscope in a sunlit clinic',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  ecosystemPatientCare: {
    src: '/images/landing/ecosystem-patient-care.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'patient',
    intendedPages: ['/', '/patient/dashboard'],
    alt: 'Patient reviewing a personal digital health timeline on a smartphone in a calm sunlit living space',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  ecosystemDoctorWorkspace: {
    src: '/images/landing/ecosystem-doctor-workspace.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'doctor',
    intendedPages: ['/', '/doctor/dashboard'],
    alt: 'Clinician hands at a bright consultation desk reviewing a structured clinical dashboard alongside a stethoscope',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  ecosystemPharmacyDispensing: {
    src: '/images/landing/ecosystem-pharmacy-dispensing.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'pharmacy',
    intendedPages: ['/', '/pharmacy/dashboard'],
    alt: 'Minimalist clinical pharmacy counter with organized medicine shelves, unbranded bottles, and barcode scanner',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  ecosystemLaboratoryDiagnostics: {
    src: '/images/landing/ecosystem-laboratory-diagnostics.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'laboratory',
    intendedPages: ['/', '/laboratory/dashboard'],
    alt: 'Contemporary diagnostic pathology laboratory bench with sample vials, pipettes, and automated analyzer',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  platformDigitalRecords: {
    src: '/images/landing/platform-digital-records.webp',
    width: 960,
    height: 536,
    format: 'webp',
    category: 'landing',
    intendedPages: ['/', '/patient/records'],
    alt: 'Glass clinical desk featuring a sleek digital health timeline tablet beside a stethoscope',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  privacyConsentShield: {
    src: '/images/security/privacy-consent-shield.webp',
    width: 960,
    height: 536,
    format: 'webp',
    category: 'security',
    intendedPages: ['/', '/admin/security/overview'],
    alt: 'Frosted glass geometric shield representing consent-based healthcare privacy and encrypted record protection',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  serviceAppointmentsBooking: {
    src: '/images/landing/service-appointments-booking.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'landing',
    intendedPages: ['/', '/patient/appointments/book'],
    alt: 'Bright minimalist clinic reception counter with a digital scheduling tablet and sunlit waiting lounge',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  serviceDigitalPrescriptions: {
    src: '/images/landing/service-digital-prescriptions.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'landing',
    intendedPages: ['/', '/patient/prescriptions'],
    alt: 'Minimalist medical desk with a digital prescription tablet displaying dosage progress bars beside an unbranded frosted bottle',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  serviceLabReports: {
    src: '/images/landing/service-lab-reports.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'laboratory',
    intendedPages: ['/', '/patient/lab-reports', '/laboratory/reports'],
    alt: 'Clinical pathology workstation with glass microscope slides, diagnostic microscope, and digital chart display',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  serviceConsentControl: {
    src: '/images/security/service-consent-control.webp',
    width: 880,
    height: 492,
    format: 'webp',
    category: 'security',
    intendedPages: ['/', '/patient/consent'],
    alt: 'Translucent frosted glass toggle controls and blue-and-teal permission cards symbolizing granular patient consent',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  howItWorksTelehealth: {
    src: '/images/landing/how-it-works-telehealth.webp',
    width: 960,
    height: 536,
    format: 'webp',
    category: 'doctor',
    intendedPages: ['/'],
    alt: 'Clinician working at a bright desk with a connected clinical dashboard monitor, stethoscope, and notebook',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
  authPortalClinic: {
    src: '/images/landing/auth-portal-clinic.webp',
    width: 960,
    height: 536,
    format: 'webp',
    category: 'landing',
    intendedPages: ['/', '/login', '/register', '/forgot-password'],
    alt: 'Contemporary sunlit hospital atrium with curved white glass corridors, skylight, and indoor biophilic greenery',
    license: 'Original AI-generated project asset (HealthBridge India)',
  },
} as const satisfies Record<string, VisualAssetEntry>;

export const DIAGRAM_ASSETS = {
  abdmEcosystemFlow: {
    src: '/images/abdm/abdm-ecosystem-flow.svg',
    width: 680,
    height: 240,
    format: 'svg',
    category: 'abdm',
    intendedPages: ['/', '/admin/integrations/abdm'],
    alt: 'Neutral architecture diagram illustrating consent-mediated FHIR R4 health record exchange between Citizen, Consent Bridge, HIP Provider, and HIU Consumer',
    license: 'Original vector illustration (HealthBridge India)',
  },
  abhaIdentityFlow: {
    src: '/images/abdm/abha-identity-flow.svg',
    width: 640,
    height: 190,
    format: 'svg',
    category: 'abdm',
    intendedPages: ['/patient/abha'],
    alt: 'Three-step ABHA workflow diagram: Verify Identity via OTP, Approve Consent Scope, and Access Unified Timeline',
    license: 'Original vector illustration (HealthBridge India)',
  },
  fhirInteroperability: {
    src: '/images/abdm/fhir-interoperability.svg',
    width: 640,
    height: 180,
    format: 'svg',
    category: 'abdm',
    intendedPages: ['/admin/integrations/abdm'],
    alt: 'Diagram showing clinical sources validated through HL7 FHIR R4 NRCeS profiles into verified consent-gated delivery',
    license: 'Original vector illustration (HealthBridge India)',
  },
  documentVaultBanner: {
    src: '/images/documents/document-vault-banner.svg',
    width: 420,
    height: 200,
    format: 'svg',
    category: 'documents',
    intendedPages: ['/patient/records'],
    alt: 'Illustration of an encrypted medical document vault linking PDF reports to a chronological health timeline',
    license: 'Original vector illustration (HealthBridge India)',
  },
  connectedHealthcareNetwork: {
    src: '/images/admin/connected-healthcare-network.svg',
    width: 680,
    height: 220,
    format: 'svg',
    category: 'admin',
    intendedPages: ['/', '/admin/dashboard'],
    alt: 'Schematic network topology connecting citizen portals, clinics, laboratories, pharmacies, and audit governance',
    license: 'Original vector illustration (HealthBridge India)',
  },
} as const satisfies Record<string, VisualAssetEntry>;

export const EMPTY_STATE_ASSETS = {
  'no-appointments': {
    src: '/images/empty-states/no-appointments.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/patient/appointments', '/doctor/appointments'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'no-records': {
    src: '/images/empty-states/no-records.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/patient/records'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'no-prescriptions': {
    src: '/images/empty-states/no-prescriptions.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/patient/prescriptions', '/pharmacy/prescriptions'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'no-lab-reports': {
    src: '/images/empty-states/no-lab-reports.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/patient/lab-reports', '/laboratory/reports'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'no-notifications': {
    src: '/images/empty-states/no-notifications.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: [
      '/patient/notifications',
      '/doctor/notifications',
      '/pharmacy/notifications',
      '/laboratory/notifications',
      '/admin/notifications',
    ],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'no-search-results': {
    src: '/images/empty-states/no-search-results.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/dashboard/search'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'empty-inventory': {
    src: '/images/empty-states/empty-inventory.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/pharmacy/inventory'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'no-lab-orders': {
    src: '/images/empty-states/no-lab-orders.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/laboratory/orders'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'upload-documents': {
    src: '/images/empty-states/upload-documents.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/patient/records'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'unauthorized-access': {
    src: '/images/empty-states/unauthorized-access.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['ProtectedRoute'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'connection-error': {
    src: '/images/empty-states/connection-error.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['ErrorState'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
  'onboarding-success': {
    src: '/images/empty-states/onboarding-success.svg',
    width: 200,
    height: 140,
    format: 'svg',
    category: 'empty-states',
    intendedPages: ['/patient/dashboard', '/patient/abha'],
    alt: '',
    decorative: true,
    license: 'Original vector illustration (HealthBridge India)',
  },
} as const satisfies Record<string, VisualAssetEntry>;

export type EditorialAssetKey = keyof typeof EDITORIAL_ASSETS;
export type DiagramAssetKey = keyof typeof DIAGRAM_ASSETS;
export type EmptyStateAssetKey = keyof typeof EMPTY_STATE_ASSETS;

export const ALL_VISUAL_ASSETS: readonly VisualAssetEntry[] = [
  ...Object.values(EDITORIAL_ASSETS),
  ...Object.values(DIAGRAM_ASSETS),
  ...Object.values(EMPTY_STATE_ASSETS),
];
