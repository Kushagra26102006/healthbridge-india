/**
 * HealthBridge India — Laboratory Workforce & Operations Zod Validation Schemas (Day 6 Task 06)
 */

import { z } from 'zod';
import {
  LABORATORY_STAFF_ROLES,
  ALL_LABORATORY_PERMISSIONS,
} from '@healthbridge/shared-types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;          // YYYY-MM-DD

// ============================================================================
// 1. STAFF DIRECTORY & LIFECYCLE SCHEMAS
// ============================================================================

export const inviteLaboratoryStaffSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Staff email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{10,15}$/, 'Invalid phone number format')
    .optional(),
  employeeId: z
    .string()
    .trim()
    .max(50, 'Employee ID cannot exceed 50 characters')
    .optional(),
  designation: z
    .string({ required_error: 'Designation is required' })
    .trim()
    .min(2, 'Designation must be at least 2 characters')
    .max(100, 'Designation cannot exceed 100 characters'),
  departmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid department ID format')
    .optional(),
  role: z.enum(LABORATORY_STAFF_ROLES as [string, ...string[]], {
    required_error: 'Laboratory staff role is required',
  }),
  allowedPermissions: z
    .array(z.enum(ALL_LABORATORY_PERMISSIONS as [string, ...string[]]))
    .optional(),
  deniedPermissions: z
    .array(z.enum(ALL_LABORATORY_PERMISSIONS as [string, ...string[]]))
    .optional(),
  qualifications: z.array(z.string().trim().max(100)).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const acceptLaboratoryStaffInviteSchema = z.object({
  invitationToken: z
    .string({ required_error: 'Invitation token is required' })
    .trim()
    .min(32, 'Invalid invitation token format'),
});

export const updateLaboratoryStaffSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{10,15}$/, 'Invalid phone number format')
    .optional(),
  designation: z
    .string()
    .trim()
    .min(2, 'Designation must be at least 2 characters')
    .max(100, 'Designation cannot exceed 100 characters')
    .optional(),
  departmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid department ID format')
    .nullable()
    .optional(),
  role: z
    .enum(LABORATORY_STAFF_ROLES as [string, ...string[]])
    .optional(),
  profilePhotoUrl: z
    .string()
    .url('Invalid photo URL')
    .optional(),
  qualifications: z.array(z.string().trim().max(100)).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateStaffPermissionsSchema = z.object({
  allowedPermissions: z.array(
    z.enum(ALL_LABORATORY_PERMISSIONS as [string, ...string[]])
  ),
  deniedPermissions: z.array(
    z.enum(ALL_LABORATORY_PERMISSIONS as [string, ...string[]])
  ),
  reason: z.string().trim().max(500).optional(),
});

export const updateStaffStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
  reason: z.string().trim().max(500).optional(),
});

export const laboratoryStaffFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.enum(LABORATORY_STAFF_ROLES as [string, ...string[]]).optional(),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID').optional(),
  status: z.enum(['INVITED', 'PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'EXPIRED']).optional(),
});

// ============================================================================
// 2. DEPARTMENT MANAGEMENT SCHEMAS
// ============================================================================

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Department code is required' })
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .toUpperCase(),
  description: z.string().trim().max(500).optional(),
  headOfDepartmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid head of department ID')
    .optional(),
  contactExtension: z.string().trim().max(20).optional(),
  location: z.string().trim().max(100).optional(),
  isActive: z.boolean().default(true),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  code: z.string().trim().min(2).max(20).toUpperCase().optional(),
  description: z.string().trim().max(500).optional(),
  headOfDepartmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid head of department ID')
    .nullable()
    .optional(),
  contactExtension: z.string().trim().max(20).optional(),
  location: z.string().trim().max(100).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// 3. SHIFT SCHEDULING SCHEMAS
// ============================================================================

export const createShiftTemplateSchema = z.object({
  name: z
    .string({ required_error: 'Shift template name is required' })
    .trim()
    .min(2)
    .max(100),
  code: z
    .string({ required_error: 'Shift code is required' })
    .trim()
    .min(2)
    .max(20)
    .toUpperCase(),
  startTime: z
    .string({ required_error: 'Start time is required' })
    .regex(timeFormatRegex, 'Start time must be in HH:mm format'),
  endTime: z
    .string({ required_error: 'End time is required' })
    .regex(timeFormatRegex, 'End time must be in HH:mm format'),
  breakMinutes: z.coerce.number().int().min(0).max(360).default(30),
  isOvernight: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color code').optional(),
  applicableDepartmentIds: z
    .array(z.string().regex(objectIdRegex, 'Invalid department ID'))
    .optional(),
  isActive: z.boolean().default(true),
});

export const updateShiftTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  code: z.string().trim().min(2).max(20).toUpperCase().optional(),
  startTime: z.string().regex(timeFormatRegex, 'Start time must be HH:mm').optional(),
  endTime: z.string().regex(timeFormatRegex, 'End time must be HH:mm').optional(),
  breakMinutes: z.coerce.number().int().min(0).max(360).optional(),
  isOvernight: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color code').optional(),
  applicableDepartmentIds: z
    .array(z.string().regex(objectIdRegex, 'Invalid department ID'))
    .optional(),
  isActive: z.boolean().optional(),
});

export const assignShiftSchema = z.object({
  staffId: z
    .string({ required_error: 'Staff ID is required' })
    .regex(objectIdRegex, 'Invalid staff ID format'),
  shiftTemplateId: z
    .string({ required_error: 'Shift template ID is required' })
    .regex(objectIdRegex, 'Invalid shift template ID format'),
  date: z
    .string({ required_error: 'Date is required' })
    .regex(dateFormatRegex, 'Date must be in YYYY-MM-DD format'),
  departmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid department ID format')
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export const batchAssignShiftSchema = z.object({
  assignments: z.array(assignShiftSchema).min(1, 'At least one assignment required'),
});

export const updateShiftAssignmentSchema = z.object({
  shiftTemplateId: z.string().regex(objectIdRegex, 'Invalid shift template ID').optional(),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID').optional(),
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'SWAP_REQUESTED',
    'SWAPPED',
    'COMPLETED',
    'ABSENT',
    'CANCELLED',
  ]).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const requestShiftSwapSchema = z.object({
  targetStaffId: z
    .string({ required_error: 'Target staff member ID is required' })
    .regex(objectIdRegex, 'Invalid staff ID format'),
  reason: z
    .string({ required_error: 'Reason for shift swap is required' })
    .trim()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const reviewShiftSwapSchema = z.object({
  approved: z.boolean({ required_error: 'Approval decision is required' }),
  reason: z.string().trim().max(500).optional(),
});

export const shiftFilterSchema = z.object({
  startDate: z.string().regex(dateFormatRegex, 'Invalid startDate format').optional(),
  endDate: z.string().regex(dateFormatRegex, 'Invalid endDate format').optional(),
  staffId: z.string().regex(objectIdRegex, 'Invalid staff ID').optional(),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID').optional(),
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'SWAP_REQUESTED',
    'SWAPPED',
    'COMPLETED',
    'ABSENT',
    'CANCELLED',
  ]).optional(),
});

// ============================================================================
// 4. LEAVE & AVAILABILITY SCHEMAS
// ============================================================================

export const createLeaveRequestSchema = z.object({
  staffId: z.string().regex(objectIdRegex, 'Invalid staff ID').optional(),
  leaveType: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'MATERNITY', 'OTHER'], {
    required_error: 'Leave type is required',
  }),
  startDate: z
    .string({ required_error: 'Start date is required' })
    .regex(dateFormatRegex, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string({ required_error: 'End date is required' })
    .regex(dateFormatRegex, 'End date must be in YYYY-MM-DD format'),
  reason: z
    .string({ required_error: 'Leave reason is required' })
    .trim()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
}).refine((data) => data.startDate <= data.endDate, {
  message: 'End date cannot be earlier than start date',
  path: ['endDate'],
});

export const reviewLeaveRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    required_error: 'Review status is required',
  }),
  rejectionReason: z.string().trim().max(500).optional(),
}).refine(
  (data) => data.status !== 'REJECTED' || (data.rejectionReason && data.rejectionReason.length >= 3),
  {
    message: 'Rejection reason is required when rejecting a leave request',
    path: ['rejectionReason'],
  }
);

export const leaveFilterSchema = z.object({
  staffId: z.string().regex(objectIdRegex, 'Invalid staff ID').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  startDate: z.string().regex(dateFormatRegex).optional(),
  endDate: z.string().regex(dateFormatRegex).optional(),
});

export const updateStaffAvailabilitySchema = z.object({
  timezone: z.string().trim().default('Asia/Kolkata'),
  weeklySchedule: z.array(
    z.object({
      dayOfWeek: z.enum([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]),
      isAvailable: z.boolean(),
      preferredShiftTemplateId: z
        .string()
        .regex(objectIdRegex, 'Invalid shift template ID')
        .optional(),
      maxHours: z.number().min(0).max(24).optional(),
    })
  ).optional(),
  customBlackouts: z
    .array(
      z.object({
        date: z.string().regex(dateFormatRegex, 'Invalid blackout date format'),
        reason: z.string().trim().max(200).optional(),
      })
    )
    .optional(),
});

// ============================================================================
// 5. WORKLOAD ALLOCATION SCHEMAS
// ============================================================================

export const createTaskAssignmentSchema = z.object({
  taskType: z.enum(
    [
      'SAMPLE_COLLECTION',
      'SAMPLE_ACCESSIONING',
      'TEST_PROCESSING',
      'QC_RUN',
      'REPORT_REVIEW',
      'REPORT_APPROVAL',
      'INSTRUMENT_MAINTENANCE',
      'INVENTORY_ACTIVITY',
      'QUALITY_INCIDENT',
      'CAPA_ACTION',
    ],
    { required_error: 'Task type is required' }
  ),
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(1000).optional(),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID').optional(),
  relatedEntityType: z.string().trim().min(2).max(100),
  relatedEntityId: z.string().trim().optional(),
  assignedStaffId: z
    .string({ required_error: 'Assigned staff ID is required' })
    .regex(objectIdRegex, 'Invalid staff ID format'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .datetime({ message: 'Due date must be a valid ISO datetime' }),
  notes: z.string().trim().max(1000).optional(),
});

export const reassignTaskSchema = z.object({
  newStaffId: z
    .string({ required_error: 'New staff ID is required' })
    .regex(objectIdRegex, 'Invalid staff ID format'),
  reason: z
    .string({ required_error: 'Reassignment reason is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum([
    'UNASSIGNED',
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
    'BLOCKED',
    'COMPLETED',
    'CANCELLED',
  ]),
  notes: z.string().trim().max(1000).optional(),
  blockedReason: z.string().trim().max(500).optional(),
});

export const taskFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  taskType: z
    .enum([
      'SAMPLE_COLLECTION',
      'SAMPLE_ACCESSIONING',
      'TEST_PROCESSING',
      'QC_RUN',
      'REPORT_REVIEW',
      'REPORT_APPROVAL',
      'INSTRUMENT_MAINTENANCE',
      'INVENTORY_ACTIVITY',
      'QUALITY_INCIDENT',
      'CAPA_ACTION',
    ])
    .optional(),
  status: z
    .enum([
      'UNASSIGNED',
      'ASSIGNED',
      'ACCEPTED',
      'IN_PROGRESS',
      'BLOCKED',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedStaffId: z.string().regex(objectIdRegex, 'Invalid staff ID').optional(),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID').optional(),
  overdueOnly: z.coerce.boolean().optional(),
});
