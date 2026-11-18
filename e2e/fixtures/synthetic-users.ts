/**
 * Synthetic E2E credentials & non-production safety guard for Playwright tests.
 * Never store real patient data or production credentials here.
 */

export type E2ERole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

export interface SyntheticE2EAccount {
  role: E2ERole;
  identifier: string;
  password: string;
  dashboardPath: string;
}

export function assertSafeE2ETarget(baseURL: string): void {
  const url = new URL(baseURL);
  const allowedHosts = new Set(['localhost', '127.0.0.1', 'staging.healthbridge.internal']);
  if (!allowedHosts.has(url.hostname)) {
    throw new Error(
      `SECURITY_BLOCK: Refusing to execute synthetic E2E tests against non-test host "${url.hostname}".`
    );
  }
}

export const SYNTHETIC_E2E_ACCOUNTS: Record<E2ERole, SyntheticE2EAccount> = {
  PATIENT: {
    role: 'PATIENT',
    identifier: process.env.E2E_PATIENT_EMAIL || 'patient.synthetic@healthbridge.test',
    password: process.env.E2E_PATIENT_PASSWORD || 'SyntheticTest#2026!',
    dashboardPath: '/patient/dashboard',
  },
  DOCTOR: {
    role: 'DOCTOR',
    identifier: process.env.E2E_DOCTOR_EMAIL || 'doctor.synthetic@healthbridge.test',
    password: process.env.E2E_DOCTOR_PASSWORD || 'SyntheticTest#2026!',
    dashboardPath: '/doctor/dashboard',
  },
  PHARMACY: {
    role: 'PHARMACY',
    identifier: process.env.E2E_PHARMACY_EMAIL || 'pharmacy.synthetic@healthbridge.test',
    password: process.env.E2E_PHARMACY_PASSWORD || 'SyntheticTest#2026!',
    dashboardPath: '/pharmacy/dashboard',
  },
  LABORATORY: {
    role: 'LABORATORY',
    identifier: process.env.E2E_LAB_EMAIL || 'lab.synthetic@healthbridge.test',
    password: process.env.E2E_LAB_PASSWORD || 'SyntheticTest#2026!',
    dashboardPath: '/laboratory/dashboard',
  },
  ADMIN: {
    role: 'ADMIN',
    identifier: process.env.E2E_ADMIN_EMAIL || 'admin.synthetic@healthbridge.test',
    password: process.env.E2E_ADMIN_PASSWORD || 'SyntheticTest#2026!',
    dashboardPath: '/admin/dashboard',
  },
};
