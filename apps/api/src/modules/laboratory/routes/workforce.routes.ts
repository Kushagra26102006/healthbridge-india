import { Router } from 'express';
import { laboratoryWorkforceController } from '../controllers/workforce.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validate } from '../../../middleware/validate';
import {
  inviteLaboratoryStaffSchema,
  acceptLaboratoryStaffInviteSchema,
  updateLaboratoryStaffSchema,
  updateStaffPermissionsSchema,
  updateStaffStatusSchema,
  laboratoryStaffFilterSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createShiftTemplateSchema,
  updateShiftTemplateSchema,
  assignShiftSchema,
  batchAssignShiftSchema,
  updateShiftAssignmentSchema,
  requestShiftSwapSchema,
  reviewShiftSwapSchema,
  shiftFilterSchema,
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  leaveFilterSchema,
  updateStaffAvailabilitySchema,
  createTaskAssignmentSchema,
  reassignTaskSchema,
  updateTaskStatusSchema,
  taskFilterSchema,
} from '@healthbridge/validation';

export const workforceRoutes = Router();

// ============================================================================
// 1. PUBLIC / OPTIONALLY AUTHENTICATED ENDPOINTS
// ============================================================================

/**
 * Accept staff invitation token (can be accessed by invitee)
 */
workforceRoutes.post(
  '/staff/accept-invite',
  validate(acceptLaboratoryStaffInviteSchema),
  laboratoryWorkforceController.acceptInvitation.bind(laboratoryWorkforceController)
);

// All subsequent workforce management endpoints require authentication & laboratory role
workforceRoutes.use(authenticate);
workforceRoutes.use(authorize('LABORATORY', 'ADMIN'));

// ============================================================================
// 2. STAFF DIRECTORY & LIFECYCLE
// ============================================================================

workforceRoutes.get(
  '/staff',
  validate({ query: laboratoryStaffFilterSchema }),
  laboratoryWorkforceController.listStaff.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/staff/invite',
  validate(inviteLaboratoryStaffSchema),
  laboratoryWorkforceController.inviteStaff.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/staff/:id',
  laboratoryWorkforceController.getStaffById.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/staff/:id',
  validate(updateLaboratoryStaffSchema),
  laboratoryWorkforceController.updateStaff.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/staff/:id/permissions',
  validate(updateStaffPermissionsSchema),
  laboratoryWorkforceController.updatePermissions.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/staff/:id/status',
  validate(updateStaffStatusSchema),
  laboratoryWorkforceController.updateStatus.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/staff/:id/activity',
  laboratoryWorkforceController.getStaffActivity.bind(laboratoryWorkforceController)
);

// ============================================================================
// 3. PERMISSIONS & ROLES
// ============================================================================

workforceRoutes.get(
  '/permissions/catalogue',
  laboratoryWorkforceController.getPermissionCatalogue.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/permissions/roles',
  laboratoryWorkforceController.getRolePermissions.bind(laboratoryWorkforceController)
);

// ============================================================================
// 4. DEPARTMENT MANAGEMENT
// ============================================================================

workforceRoutes.get(
  '/departments',
  laboratoryWorkforceController.listDepartments.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/departments',
  validate(createDepartmentSchema),
  laboratoryWorkforceController.createDepartment.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/departments/:id',
  laboratoryWorkforceController.getDepartmentById.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/departments/:id',
  validate(updateDepartmentSchema),
  laboratoryWorkforceController.updateDepartment.bind(laboratoryWorkforceController)
);

// ============================================================================
// 5. SHIFT SCHEDULING
// ============================================================================

workforceRoutes.get(
  '/scheduling/shift-templates',
  laboratoryWorkforceController.listShiftTemplates.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/scheduling/shift-templates',
  validate(createShiftTemplateSchema),
  laboratoryWorkforceController.createShiftTemplate.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/scheduling/shift-templates/:id',
  validate(updateShiftTemplateSchema),
  laboratoryWorkforceController.updateShiftTemplate.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/scheduling/shifts',
  validate({ query: shiftFilterSchema }),
  laboratoryWorkforceController.listShifts.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/scheduling/shifts',
  validate(assignShiftSchema),
  laboratoryWorkforceController.assignShift.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/scheduling/shifts/batch',
  validate(batchAssignShiftSchema),
  laboratoryWorkforceController.batchAssignShifts.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/scheduling/shifts/:id',
  validate(updateShiftAssignmentSchema),
  laboratoryWorkforceController.updateShiftAssignment.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/scheduling/shifts/:id/swap-request',
  validate(requestShiftSwapSchema),
  laboratoryWorkforceController.requestShiftSwap.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/scheduling/shifts/:id/swap-review',
  validate(reviewShiftSwapSchema),
  laboratoryWorkforceController.reviewShiftSwap.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/scheduling/availability/:staffId',
  laboratoryWorkforceController.getStaffAvailability.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/scheduling/availability/:staffId',
  validate(updateStaffAvailabilitySchema),
  laboratoryWorkforceController.updateStaffAvailability.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/scheduling/leave',
  validate({ query: leaveFilterSchema }),
  laboratoryWorkforceController.listLeaveRequests.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/scheduling/leave',
  validate(createLeaveRequestSchema),
  laboratoryWorkforceController.submitLeaveRequest.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/scheduling/leave/:id/review',
  validate(reviewLeaveRequestSchema),
  laboratoryWorkforceController.reviewLeaveRequest.bind(laboratoryWorkforceController)
);

// ============================================================================
// 6. WORKLOAD ALLOCATION & DASHBOARD
// ============================================================================

workforceRoutes.get(
  '/workload/dashboard',
  laboratoryWorkforceController.getWorkloadDashboard.bind(laboratoryWorkforceController)
);

workforceRoutes.get(
  '/workload/tasks',
  validate({ query: taskFilterSchema }),
  laboratoryWorkforceController.listTasks.bind(laboratoryWorkforceController)
);

workforceRoutes.post(
  '/workload/tasks',
  validate(createTaskAssignmentSchema),
  laboratoryWorkforceController.createTask.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/workload/tasks/:id/reassign',
  validate(reassignTaskSchema),
  laboratoryWorkforceController.reassignTask.bind(laboratoryWorkforceController)
);

workforceRoutes.put(
  '/workload/tasks/:id/status',
  validate(updateTaskStatusSchema),
  laboratoryWorkforceController.updateTaskStatus.bind(laboratoryWorkforceController)
);

export default workforceRoutes;
