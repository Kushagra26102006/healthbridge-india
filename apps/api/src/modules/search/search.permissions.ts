/**
 * HealthBridge India — Centralized Role-Based Global Search Permission Matrix (Day 8 Task 02)
 *
 * Strictly enforces server-side search scopes derived exclusively from the authenticated JWT role.
 * Never trusts client-supplied patientId, doctorId, pharmacyId, or laboratoryId as proof of access.
 */

import type {
  GlobalSearchCategoryGroup,
  GlobalSearchResourceType,
  UserRole,
} from '@healthbridge/shared-types';
import { AppError } from '../../shared/errors/app-error';
import { HttpStatus } from '../../shared/constants/http-status';
import { ErrorCode } from '../../shared/errors/error-codes';

export const ROLE_SEARCH_PERMISSION_MATRIX: Record<UserRole, GlobalSearchResourceType[]> = {
  // Patient: own records + public provider discovery only (NEVER other patients)
  PATIENT: [
    'appointment',
    'prescription',
    'lab_report',
    'medical_record',
    'external_record',
    'doctor',
    'pharmacy',
    'laboratory',
  ],
  // Doctor: authorized care-relationship/consent patients & clinical records + medicines (NEVER unrestricted patient search)
  DOCTOR: [
    'patient',
    'appointment',
    'encounter',
    'prescription',
    'lab_order',
    'lab_report',
    'medical_record',
    'medicine',
    'external_record',
  ],
  // Pharmacy: pharmacy-scoped operations & authorized issued prescriptions only (NEVER general clinical histories/encounters/lab reports)
  PHARMACY: [
    'prescription',
    'pharmacy_order',
    'inventory',
    'medicine',
    'supplier',
    'dispensing',
  ],
  // Laboratory: laboratory-scoped orders, samples, tests, reports & minimal authorized patient identity (NEVER unrestricted clinical records)
  LABORATORY: [
    'lab_order',
    'lab_sample',
    'lab_test',
    'lab_report',
    'patient',
  ],
  // Admin: platform users & operational resources only (NEVER exposes unnecessary clinical notes, lab results, or private clinical history)
  ADMIN: [
    'user',
    'doctor',
    'pharmacy',
    'laboratory',
    'appointment',
    'lab_order',
    'pharmacy_order',
  ],
};

export const RESOURCE_TYPE_TO_CATEGORY_GROUP: Record<
  GlobalSearchResourceType,
  GlobalSearchCategoryGroup
> = {
  patient: 'PEOPLE',
  user: 'PEOPLE',
  doctor: 'HEALTHCARE_PROVIDERS',
  pharmacy: 'HEALTHCARE_PROVIDERS',
  laboratory: 'HEALTHCARE_PROVIDERS',
  appointment: 'APPOINTMENTS',
  prescription: 'PRESCRIPTIONS',
  lab_order: 'LABORATORY',
  lab_sample: 'LABORATORY',
  lab_test: 'LABORATORY',
  lab_report: 'LABORATORY',
  medical_record: 'MEDICAL_RECORDS',
  encounter: 'MEDICAL_RECORDS',
  medicine: 'MEDICINES',
  inventory: 'PHARMACY_OPERATIONS',
  pharmacy_order: 'PHARMACY_OPERATIONS',
  dispensing: 'PHARMACY_OPERATIONS',
  supplier: 'PHARMACY_OPERATIONS',
  external_record: 'ABDM_EXTERNAL',
};

export function getAllowedSearchTypesForRole(role: UserRole): GlobalSearchResourceType[] {
  return [...(ROLE_SEARCH_PERMISSION_MATRIX[role] || [])];
}

/**
 * Intersects requested types with the authenticated role's permitted search matrix.
 * Fails CLOSED with 403 FORBIDDEN if the caller explicitly requests unauthorized resource types
 * that leave zero permitted targets.
 */
export function resolveAuthorizedSearchTypes(
  role: UserRole,
  requestedTypes?: GlobalSearchResourceType[]
): GlobalSearchResourceType[] {
  const allowed = ROLE_SEARCH_PERMISSION_MATRIX[role] || [];
  if (allowed.length === 0) {
    throw new AppError(
      'Your role is not permitted to perform global search queries.',
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  if (!requestedTypes || requestedTypes.length === 0) {
    return [...allowed];
  }

  const allowedSet = new Set<GlobalSearchResourceType>(allowed);
  const authorized = Array.from(new Set(requestedTypes.filter((t) => allowedSet.has(t))));

  if (authorized.length === 0) {
    throw new AppError(
      `Role '${role}' is not authorized to search the requested resource type(s).`,
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  return authorized;
}
