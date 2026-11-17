/**
 * HealthBridge India — Laboratory Workforce & Operations Shared Types (Day 6 Task 06)
 * Enterprise Laboratory Staff Management, Laboratory-Scoped RBAC, Department Management,
 * Shift Scheduling, Availability, Leave Tracking, and Workload Allocation.
 */

// ============================================================================
// 1. LABORATORY ROLES & PERMISSIONS
// ============================================================================

export const LaboratoryStaffRole = {
  LAB_ADMIN: 'LAB_ADMIN',
  LAB_MANAGER: 'LAB_MANAGER',
  LAB_SUPERVISOR: 'LAB_SUPERVISOR',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  LAB_REVIEWER: 'LAB_REVIEWER',
  LAB_PATHOLOGIST: 'LAB_PATHOLOGIST',
  LAB_INVENTORY_MANAGER: 'LAB_INVENTORY_MANAGER',
  LAB_QUALITY_MANAGER: 'LAB_QUALITY_MANAGER',
} as const;

export type LaboratoryStaffRole =
  (typeof LaboratoryStaffRole)[keyof typeof LaboratoryStaffRole];

export const LABORATORY_STAFF_ROLES: readonly [LaboratoryStaffRole, ...LaboratoryStaffRole[]] = [
  'LAB_ADMIN',
  'LAB_MANAGER',
  'LAB_SUPERVISOR',
  'LAB_TECHNICIAN',
  'LAB_REVIEWER',
  'LAB_PATHOLOGIST',
  'LAB_INVENTORY_MANAGER',
  'LAB_QUALITY_MANAGER',
];

export const LaboratoryPermission = {
  // Staff
  STAFF_VIEW: 'staff.view',
  STAFF_INVITE: 'staff.invite',
  STAFF_UPDATE: 'staff.update',
  STAFF_DEACTIVATE: 'staff.deactivate',
  STAFF_PERMISSIONS_MANAGE: 'staff.permissions.manage',

  // Orders and samples
  LAB_ORDERS_VIEW: 'lab.orders.view',
  LAB_ORDERS_ASSIGN: 'lab.orders.assign',
  LAB_SAMPLES_VIEW: 'lab.samples.view',
  LAB_SAMPLES_COLLECT: 'lab.samples.collect',
  LAB_SAMPLES_ACCESSION: 'lab.samples.accession',

  // Processing
  LAB_PROCESSING_VIEW: 'lab.processing.view',
  LAB_PROCESSING_PERFORM: 'lab.processing.perform',
  LAB_RESULTS_CREATE: 'lab.results.create',
  LAB_RESULTS_UPDATE: 'lab.results.update',
  LAB_RESULTS_SUBMIT: 'lab.results.submit',

  // Reports
  LAB_REPORTS_VIEW: 'lab.reports.view',
  LAB_REPORTS_GENERATE: 'lab.reports.generate',
  LAB_REPORTS_REVIEW: 'lab.reports.review',
  LAB_REPORTS_APPROVE: 'lab.reports.approve',
  LAB_REPORTS_PUBLISH: 'lab.reports.publish',
  LAB_REPORTS_AMEND: 'lab.reports.amend',

  // Quality
  LAB_QC_VIEW: 'lab.qc.view',
  LAB_QC_CONFIGURE: 'lab.qc.configure',
  LAB_QC_EXECUTE: 'lab.qc.execute',
  LAB_INCIDENTS_MANAGE: 'lab.incidents.manage',
  LAB_CAPA_MANAGE: 'lab.capa.manage',

  // Instruments
  LAB_INSTRUMENTS_VIEW: 'lab.instruments.view',
  LAB_INSTRUMENTS_MANAGE: 'lab.instruments.manage',
  LAB_CALIBRATION_MANAGE: 'lab.calibration.manage',
  LAB_MAINTENANCE_MANAGE: 'lab.maintenance.manage',

  // Inventory
  LAB_REAGENTS_VIEW: 'lab.reagents.view',
  LAB_REAGENTS_MANAGE: 'lab.reagents.manage',
  LAB_INVENTORY_RECEIVE: 'lab.inventory.receive',
  LAB_INVENTORY_CONSUME: 'lab.inventory.consume',
  LAB_INVENTORY_ADJUST: 'lab.inventory.adjust',
  LAB_INVENTORY_QUARANTINE: 'lab.inventory.quarantine',

  // Analytics
  LAB_ANALYTICS_VIEW: 'lab.analytics.view',
  LAB_ANALYTICS_EXPORT: 'lab.analytics.export',
} as const;

export type LaboratoryPermission =
  (typeof LaboratoryPermission)[keyof typeof LaboratoryPermission];

export const ALL_LABORATORY_PERMISSIONS = Object.values(LaboratoryPermission) as LaboratoryPermission[];

export interface PermissionGroupDto {
  group: string;
  label: string;
  permissions: {
    code: LaboratoryPermission;
    label: string;
    description: string;
  }[];
}

// ============================================================================
// 2. STAFF DIRECTORY & LIFECYCLE
// ============================================================================

export type LaboratoryStaffStatus =
  | 'INVITED'
  | 'PENDING_ACCEPTANCE'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'EXPIRED';

export interface LaboratoryStaffDto {
  id: string;
  laboratoryId: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeId: string;
  designation: string;
  departmentId?: string;
  departmentName?: string;
  role: LaboratoryStaffRole;
  permissions: LaboratoryPermission[];
  allowedPermissions: LaboratoryPermission[];
  deniedPermissions: LaboratoryPermission[];
  status: LaboratoryStaffStatus;
  isPrimaryOwner: boolean;
  profilePhotoUrl?: string;
  qualifications?: string[];
  licenseNumber?: string;
  notes?: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
  invitationAcceptedAt?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LaboratoryStaffListResponseDto {
  staff: LaboratoryStaffDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InviteLaboratoryStaffDto {
  fullName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  designation: string;
  departmentId?: string;
  role: LaboratoryStaffRole;
  allowedPermissions?: LaboratoryPermission[];
  deniedPermissions?: LaboratoryPermission[];
  qualifications?: string[];
  licenseNumber?: string;
  notes?: string;
}

export interface AcceptLaboratoryStaffInviteDto {
  invitationToken: string;
}

export interface UpdateLaboratoryStaffDto {
  fullName?: string;
  phone?: string;
  designation?: string;
  departmentId?: string | null;
  role?: LaboratoryStaffRole;
  profilePhotoUrl?: string;
  qualifications?: string[];
  licenseNumber?: string;
  notes?: string;
}

export interface UpdateStaffPermissionsDto {
  allowedPermissions: LaboratoryPermission[];
  deniedPermissions: LaboratoryPermission[];
  reason?: string;
}

export interface UpdateStaffStatusDto {
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  reason?: string;
}

export interface LaboratoryStaffFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: LaboratoryStaffRole;
  departmentId?: string;
  status?: LaboratoryStaffStatus;
}

export interface StaffActivityDto {
  id: string;
  actorId: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface StaffActivityListResponseDto {
  activities: StaffActivityDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// 3. DEPARTMENT MANAGEMENT
// ============================================================================

export interface LaboratoryDepartmentDto {
  id: string;
  laboratoryId: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  isActive: boolean;
  contactExtension?: string;
  location?: string;
  staffCount?: number;
  activeWorkloadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: string;
  contactExtension?: string;
  location?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  description?: string;
  headOfDepartmentId?: string | null;
  contactExtension?: string;
  location?: string;
  isActive?: boolean;
}

// ============================================================================
// 4. SHIFT SCHEDULING & CALENDAR
// ============================================================================

export interface LaboratoryShiftTemplateDto {
  id: string;
  laboratoryId: string;
  name: string;
  code: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes: number;
  isOvernight: boolean;
  color?: string;
  applicableDepartmentIds?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftTemplateDto {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  isOvernight?: boolean;
  color?: string;
  applicableDepartmentIds?: string[];
  isActive?: boolean;
}

export interface UpdateShiftTemplateDto {
  name?: string;
  code?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  isOvernight?: boolean;
  color?: string;
  applicableDepartmentIds?: string[];
  isActive?: boolean;
}

export type ShiftAssignmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'SWAP_REQUESTED'
  | 'SWAPPED'
  | 'COMPLETED'
  | 'ABSENT'
  | 'CANCELLED';

export type ShiftSwapStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShiftSwapDetailsDto {
  requestedWithStaffId: string;
  requestedWithStaffName?: string;
  reason?: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: ShiftSwapStatus;
  rejectionReason?: string;
}

export interface LaboratoryShiftAssignmentDto {
  id: string;
  laboratoryId: string;
  staffId: string;
  staffName?: string;
  staffEmployeeId?: string;
  staffRole?: LaboratoryStaffRole;
  departmentId?: string;
  departmentName?: string;
  shiftTemplateId: string;
  shiftTemplateName?: string;
  shiftTemplateCode?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  status: ShiftAssignmentStatus;
  swapDetails?: ShiftSwapDetailsDto;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignShiftDto {
  staffId: string;
  shiftTemplateId: string;
  date: string; // YYYY-MM-DD
  departmentId?: string;
  notes?: string;
}

export interface BatchAssignShiftDto {
  assignments: AssignShiftDto[];
}

export interface UpdateShiftAssignmentDto {
  shiftTemplateId?: string;
  departmentId?: string;
  status?: ShiftAssignmentStatus;
  notes?: string;
}

export interface RequestShiftSwapDto {
  targetStaffId: string;
  reason: string;
}

export interface ReviewShiftSwapDto {
  approved: boolean;
  reason?: string;
}

export interface ShiftFilterDto {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  departmentId?: string;
  status?: ShiftAssignmentStatus;
}

// ============================================================================
// 5. AVAILABILITY & LEAVE MANAGEMENT
// ============================================================================

export type LeaveType =
  | 'ANNUAL'
  | 'SICK'
  | 'CASUAL'
  | 'EMERGENCY'
  | 'MATERNITY'
  | 'OTHER';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LaboratoryLeaveRequestDto {
  id: string;
  laboratoryId: string;
  staffId: string;
  staffName?: string;
  staffEmployeeId?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  affectedShiftCount?: number;
  affectedTaskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestDto {
  staffId?: string; // If submitted by admin/supervisor for staff member; defaults to caller staffId
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
}

export interface ReviewLeaveRequestDto {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface LeaveFilterDto {
  staffId?: string;
  status?: LeaveRequestStatus;
  startDate?: string;
  endDate?: string;
}

export interface WeeklyAvailabilityWindowDto {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  isAvailable: boolean;
  preferredShiftTemplateId?: string;
  maxHours?: number;
}

export interface LaboratoryStaffAvailabilityDto {
  id: string;
  laboratoryId: string;
  staffId: string;
  staffName?: string;
  timezone: string;
  weeklySchedule: WeeklyAvailabilityWindowDto[];
  customBlackouts: Array<{ date: string; reason?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStaffAvailabilityDto {
  timezone?: string;
  weeklySchedule?: WeeklyAvailabilityWindowDto[];
  customBlackouts?: Array<{ date: string; reason?: string }>;
}

// ============================================================================
// 6. WORKLOAD ALLOCATION ENGINE & DASHBOARD
// ============================================================================

export type LaboratoryTaskType =
  | 'SAMPLE_COLLECTION'
  | 'SAMPLE_ACCESSIONING'
  | 'TEST_PROCESSING'
  | 'QC_RUN'
  | 'REPORT_REVIEW'
  | 'REPORT_APPROVAL'
  | 'INSTRUMENT_MAINTENANCE'
  | 'INVENTORY_ACTIVITY'
  | 'QUALITY_INCIDENT'
  | 'CAPA_ACTION';

export type LaboratoryTaskStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskAssignmentHistoryDto {
  timestamp: string;
  action: 'ASSIGNED' | 'REASSIGNED' | 'ACCEPTED' | 'STATUS_CHANGED' | 'BLOCKED' | 'UNBLOCKED' | 'COMPLETED';
  previousStaffId?: string;
  previousStaffName?: string;
  newStaffId?: string;
  newStaffName?: string;
  changedBy: string;
  changedByName?: string;
  note?: string;
}

export interface LaboratoryTaskAssignmentDto {
  id: string;
  assignmentNumber: string;
  laboratoryId: string;
  departmentId?: string;
  departmentName?: string;
  taskType: LaboratoryTaskType;
  title: string;
  description?: string;
  relatedEntityType: string;
  relatedEntityId?: string;
  assignedStaffId: string;
  assignedStaffName?: string;
  assignedStaffRole?: LaboratoryStaffRole;
  assignedBy: string;
  assignedByName?: string;
  priority: TaskPriority;
  dueDate: string;
  status: LaboratoryTaskStatus;
  blockedReason?: string;
  completionNotes?: string;
  completedAt?: string;
  assignmentHistory: TaskAssignmentHistoryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskAssignmentDto {
  taskType: LaboratoryTaskType;
  title: string;
  description?: string;
  departmentId?: string;
  relatedEntityType: string;
  relatedEntityId?: string;
  assignedStaffId: string;
  priority: TaskPriority;
  dueDate: string;
  notes?: string;
}

export interface ReassignTaskDto {
  newStaffId: string;
  reason: string;
}

export interface UpdateTaskStatusDto {
  status: LaboratoryTaskStatus;
  notes?: string;
  blockedReason?: string;
}

export interface TaskFilterDto {
  page?: number;
  limit?: number;
  taskType?: LaboratoryTaskType;
  status?: LaboratoryTaskStatus;
  priority?: TaskPriority;
  assignedStaffId?: string;
  departmentId?: string;
  overdueOnly?: boolean;
}

export interface StaffWorkloadDistributionDto {
  staffId: string;
  staffName: string;
  employeeId: string;
  role: LaboratoryStaffRole;
  departmentName?: string;
  activeTaskCount: number;
  completedTodayCount: number;
  isAvailableToday: boolean;
}

export interface DepartmentWorkloadDistributionDto {
  departmentId: string;
  departmentName: string;
  openTaskCount: number;
  completedTaskCount: number;
  staffCount: number;
}

export interface LaboratoryWorkloadDashboardDto {
  totalTasks: number;
  unassignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  pendingReportReviews: number;
  pendingReportApprovals: number;
  pendingSampleProcessing: number;
  activeStaffCount: number;
  staffWorkloadDistribution: StaffWorkloadDistributionDto[];
  departmentWorkloadDistribution: DepartmentWorkloadDistributionDto[];
}
