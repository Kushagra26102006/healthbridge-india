import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { HttpStatus } from '../../shared/constants/http-status';
import { env } from '../../config/env';

export interface DemoAccountPublicMetadata {
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';
  label: string;
  name: string;
  email: string;
  phone: string;
  dashboard: string;
  dashboardUrl: string;
  description: string;
  features: string[];
}

export const SYNTHETIC_DEMO_ACCOUNTS_METADATA: readonly DemoAccountPublicMetadata[] = [
  {
    role: 'PATIENT',
    label: 'Patient',
    name: 'Demo Patient',
    email: 'patient.demo@healthbridge.local',
    phone: '9876543212',
    dashboard: '/patient/dashboard',
    dashboardUrl: '/patient/dashboard',
    description:
      'Personal health records, appointments, prescriptions, lab reports, ABHA profile, consent management.',
    features: [
      'Longitudinal personal medical record timeline',
      'Grant, view, and revoke healthcare provider consents',
      'Track outpatient prescriptions and pharmacy orders',
      'View diagnostic lab reports with synthetic PDF document previews',
      'Linked synthetic ABHA identity (91-1234-5678-9012)',
    ],
  },
  {
    role: 'DOCTOR',
    label: 'Doctor',
    name: 'Dr. Demo Doctor',
    email: 'doctor.demo@healthbridge.local',
    phone: '9876543211',
    dashboard: '/doctor/dashboard',
    dashboardUrl: '/doctor/dashboard',
    description:
      'Patient records only when authorized, appointments, prescriptions, clinical documentation, and consent-based health information.',
    features: [
      'Consent-verified longitudinal patient health timeline',
      'SOAP clinical encounters & structured e-prescriptions',
      'Diagnostic laboratory order requests',
      'Daily outpatient consultation queue & teleconsultation scheduling',
      'ABDM consent request initiation & verification',
    ],
  },
  {
    role: 'PHARMACY',
    label: 'Pharmacy',
    name: 'Demo Pharmacy',
    email: 'pharmacy.demo@healthbridge.local',
    phone: '9876543213',
    dashboard: '/pharmacy/dashboard',
    dashboardUrl: '/pharmacy/dashboard',
    description:
      'Prescription verification, medicine inventory, dispensing records, and authorized pharmacy operations.',
    features: [
      'Structured e-Prescription verification and dispensing queue',
      'Batch-tracked medicine stock ledger with expiry tracking',
      'Stock replenishment and purchase order requisitions',
      'Pickup confirmation and delivery verification',
    ],
  },
  {
    role: 'LABORATORY',
    label: 'Lab',
    name: 'Demo Laboratory',
    email: 'lab.demo@healthbridge.local',
    phone: '9876543214',
    dashboard: '/laboratory/dashboard',
    dashboardUrl: '/laboratory/dashboard',
    description:
      'Authorized lab orders, test management, report uploads, and diagnostic records.',
    features: [
      'Clinical test catalogue management (hematology, biochemistry, lipid profiles)',
      'Barcode sample accessioning, verification, and accession queue',
      'Diagnostic report review, sign-off, and instant publishing',
      'QMS instrument calibration, maintenance, and CAPA logs',
    ],
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    name: 'Demo Administrator',
    email: 'admin.demo@healthbridge.local',
    phone: '9876543210',
    dashboard: '/admin/dashboard',
    dashboardUrl: '/admin/dashboard',
    description:
      'User management, role management, platform analytics, system monitoring, and administrative controls.',
    features: [
      'Platform-wide anonymized healthcare exchange analytics',
      'Provider credential verification & licensing oversight',
      'Append-only cryptographic security audit logs',
      'System health and real-time infrastructure metrics',
    ],
  },
];

export class DemoController {
  /**
   * GET /api/v1/demo/accounts
   * Lists available synthetic demo accounts for testing without exposing any passwords, hashes, or tokens.
   */
  getDemoAccounts(_req: Request, res: Response, next: NextFunction): void {
    try {
      const isEnabled = env.DEMO_ACCOUNTS_ENABLED !== false;

      sendSuccess(
        res,
        {
          enabled: isEnabled,
          syntheticNotice:
            'SYNTHETIC DEMO DATA — Fictional healthcare accounts strictly for demonstration and testing.',
          accounts: isEnabled ? SYNTHETIC_DEMO_ACCOUNTS_METADATA : [],
        },
        isEnabled
          ? 'Available HealthBridge synthetic demo accounts retrieved successfully'
          : 'Demo accounts are disabled in this environment',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }
}

export const demoController = new DemoController();
