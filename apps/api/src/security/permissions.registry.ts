/**
 * HealthBridge India — Centralized Security Permission Registry (Day 9 Task 01)
 *
 * Authoritative role-to-permission & scope definitions across all 5 platform roles.
 * Enforces least privilege: ADMIN is explicitly NOT granted unrestricted clinical record access.
 */

import type { UserRole } from '@healthbridge/shared-types';

export type SecurityPermission =
  // Patient self-service & personal health records
  | 'patient:profile:read:own'
  | 'patient:profile:write:own'
  | 'patient:records:read:own'
  | 'patient:records:write:own'
  | 'patient:appointments:manage:own'
  | 'patient:prescriptions:read:own'
  | 'patient:lab_reports:read:own'
  | 'patient:consent:manage:own'
  | 'patient:timeline:read:own'
  // Doctor clinical care
  | 'doctor:patients:read:assigned'
  | 'doctor:appointments:manage:assigned'
  | 'doctor:encounters:manage:assigned'
  | 'doctor:prescriptions:issue'
  | 'doctor:lab_orders:create'
  | 'doctor:lab_reports:read:authorized'
  | 'doctor:records:read:consented'
  | 'doctor:consent:request'
  // Pharmacy scoped operations
  | 'pharmacy:prescriptions:read:eligible'
  | 'pharmacy:dispensing:execute:scoped'
  | 'pharmacy:inventory:manage:scoped'
  | 'pharmacy:orders:manage:scoped'
  | 'pharmacy:procurement:manage:scoped'
  // Laboratory scoped operations
  | 'laboratory:orders:manage:scoped'
  | 'laboratory:samples:manage:scoped'
  | 'laboratory:results:enter:scoped'
  | 'laboratory:reports:publish:scoped'
  | 'laboratory:quality:manage:scoped'
  // Platform administration (operational & audit only — never unrestricted PHI)
  | 'admin:users:manage'
  | 'admin:platform:monitor'
  | 'admin:events:manage'
  | 'admin:audit:read'
  | 'admin:abdm:monitor'
  | 'admin:notifications:publish_operational';

export interface RolePolicyMetadata {
  role: UserRole;
  description: string;
  scopeBoundary: 'SELF' | 'CARE_RELATIONSHIP_AND_CONSENT' | 'FACILITY_PHARMACY' | 'FACILITY_LABORATORY' | 'PLATFORM_OPERATIONS';
  unrestrictedClinicalAccess: false;
  permissions: ReadonlyArray<SecurityPermission>;
}

export const ROLE_PERMISSION_REGISTRY: Record<UserRole, RolePolicyMetadata> = {
  PATIENT: {
    role: 'PATIENT',
    description: 'Patient self-service access strictly isolated to own canonical patientId.',
    scopeBoundary: 'SELF',
    unrestrictedClinicalAccess: false,
    permissions: [
      'patient:profile:read:own',
      'patient:profile:write:own',
      'patient:records:read:own',
      'patient:records:write:own',
      'patient:appointments:manage:own',
      'patient:prescriptions:read:own',
      'patient:lab_reports:read:own',
      'patient:consent:manage:own',
      'patient:timeline:read:own',
    ],
  },
  DOCTOR: {
    role: 'DOCTOR',
    description: 'Licensed clinician scoped to assigned appointments/care relationships and active patient consent.',
    scopeBoundary: 'CARE_RELATIONSHIP_AND_CONSENT',
    unrestrictedClinicalAccess: false,
    permissions: [
      'doctor:patients:read:assigned',
      'doctor:appointments:manage:assigned',
      'doctor:encounters:manage:assigned',
      'doctor:prescriptions:issue',
      'doctor:lab_orders:create',
      'doctor:lab_reports:read:authorized',
      'doctor:records:read:consented',
      'doctor:consent:request',
    ],
  },
  PHARMACY: {
    role: 'PHARMACY',
    description: 'Pharmacy facility scoped to eligible prescriptions, own inventory, procurement, and dispensing.',
    scopeBoundary: 'FACILITY_PHARMACY',
    unrestrictedClinicalAccess: false,
    permissions: [
      'pharmacy:prescriptions:read:eligible',
      'pharmacy:dispensing:execute:scoped',
      'pharmacy:inventory:manage:scoped',
      'pharmacy:orders:manage:scoped',
      'pharmacy:procurement:manage:scoped',
    ],
  },
  LABORATORY: {
    role: 'LABORATORY',
    description: 'Diagnostic laboratory scoped to assigned lab orders, samples, QC, and authorized report publication.',
    scopeBoundary: 'FACILITY_LABORATORY',
    unrestrictedClinicalAccess: false,
    permissions: [
      'laboratory:orders:manage:scoped',
      'laboratory:samples:manage:scoped',
      'laboratory:results:enter:scoped',
      'laboratory:reports:publish:scoped',
      'laboratory:quality:manage:scoped',
    ],
  },
  ADMIN: {
    role: 'ADMIN',
    description: 'Platform administrator restricted to operational governance, account lifecycle, event replay, and audit metadata — never unrestricted clinical records.',
    scopeBoundary: 'PLATFORM_OPERATIONS',
    unrestrictedClinicalAccess: false,
    permissions: [
      'admin:users:manage',
      'admin:platform:monitor',
      'admin:events:manage',
      'admin:audit:read',
      'admin:abdm:monitor',
      'admin:notifications:publish_operational',
    ],
  },
};

export function hasRolePermission(role: UserRole, permission: SecurityPermission): boolean {
  const entry = ROLE_PERMISSION_REGISTRY[role];
  if (!entry) return false;
  return entry.permissions.includes(permission);
}

export function getRolePermissions(role: UserRole): ReadonlyArray<SecurityPermission> {
  return ROLE_PERMISSION_REGISTRY[role]?.permissions ?? [];
}
