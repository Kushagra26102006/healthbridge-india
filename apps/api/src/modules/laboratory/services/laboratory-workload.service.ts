import mongoose, { Types } from 'mongoose';
import {
  LaboratoryTaskType,
  LaboratoryPermission,
  LaboratoryTaskAssignmentDto,
  CreateTaskAssignmentDto,
  ReassignTaskDto,
  UpdateTaskStatusDto,
  TaskFilterDto,
  LaboratoryWorkloadDashboardDto,
  StaffWorkloadDistributionDto,
  DepartmentWorkloadDistributionDto,
} from '@healthbridge/shared-types';
import {
  LaboratoryTaskAssignmentModel,
  ILaboratoryTaskAssignmentDocument,
} from '../models/laboratory-task-assignment.model';
import { LaboratoryStaffModel } from '../models/laboratory-staff.model';
import { LaboratoryDepartmentModel } from '../models/laboratory-department.model';
import { LaboratoryLeaveRequestModel } from '../models/laboratory-leave.model';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { LaboratoryReportModel } from '../../healthcare/models/lab-report.model';
import { LabSampleModel } from '../models/lab-sample.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { notificationService } from '../../notifications/services/notification.service';
import { laboratoryAuthorizationService } from './laboratory-authorization.service';
import { AppError } from '../../../shared/errors/app-error';

export class LaboratoryWorkloadService {
  /**
   * Helper: Resolves laboratory profile for user
   */
  async resolveLabContext(userId: string): Promise<Types.ObjectId> {
    const userObjectId = new Types.ObjectId(userId);
    const profile = await LaboratoryProfileModel.findOne({ userId: userObjectId });
    if (profile) return profile._id;

    const staff = await LaboratoryStaffModel.findOne({
      userId: userObjectId,
      status: 'ACTIVE',
    });
    if (staff) return staff.laboratoryId;

    throw AppError.notFound('Laboratory context not found for user');
  }

  /**
   * Required permission by task type
   */
  getRequiredPermissionForTaskType(taskType: LaboratoryTaskType): LaboratoryPermission {
    switch (taskType) {
      case 'SAMPLE_COLLECTION':
        return LaboratoryPermission.LAB_SAMPLES_COLLECT;
      case 'SAMPLE_ACCESSIONING':
        return LaboratoryPermission.LAB_SAMPLES_ACCESSION;
      case 'TEST_PROCESSING':
        return LaboratoryPermission.LAB_PROCESSING_PERFORM;
      case 'QC_RUN':
        return LaboratoryPermission.LAB_QC_EXECUTE;
      case 'REPORT_REVIEW':
        return LaboratoryPermission.LAB_REPORTS_REVIEW;
      case 'REPORT_APPROVAL':
        return LaboratoryPermission.LAB_REPORTS_APPROVE;
      case 'INSTRUMENT_MAINTENANCE':
        return LaboratoryPermission.LAB_MAINTENANCE_MANAGE;
      case 'INVENTORY_ACTIVITY':
        return LaboratoryPermission.LAB_INVENTORY_RECEIVE;
      case 'QUALITY_INCIDENT':
        return LaboratoryPermission.LAB_INCIDENTS_MANAGE;
      case 'CAPA_ACTION':
        return LaboratoryPermission.LAB_CAPA_MANAGE;
      default:
        return LaboratoryPermission.STAFF_VIEW;
    }
  }

  /**
   * Create and assign a laboratory operational task
   */
  async createTask(
    callerUserId: string,
    input: CreateTaskAssignmentDto
  ): Promise<LaboratoryTaskAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    // 1. Verify assigned staff
    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(input.assignedStaffId),
      laboratoryId: labId,
      status: 'ACTIVE',
    });
    if (!staff) {
      throw AppError.badRequest('Assigned staff member is not active in this laboratory');
    }

    // 2. Verify staff has required permission
    const requiredPermission = this.getRequiredPermissionForTaskType(input.taskType);
    const effectivePermissions = laboratoryAuthorizationService.resolveEffectivePermissions(staff);
    if (!effectivePermissions.includes(requiredPermission)) {
      throw AppError.badRequest(
        `Staff member '${staff.fullName}' lacks permission '${requiredPermission}' required for ${input.taskType}`
      );
    }

    // 3. Check availability on due date (e.g. leave conflict)
    const dueDateObj = new Date(input.dueDate);
    const dueDateStr = dueDateObj.toISOString().slice(0, 10);
    const leaveConflict = await LaboratoryLeaveRequestModel.findOne({
      laboratoryId: labId,
      staffId: staff._id,
      status: 'APPROVED',
      startDate: { $lte: dueDateStr },
      endDate: { $gte: dueDateStr },
    });
    if (leaveConflict) {
      throw AppError.badRequest(
        `Cannot assign task: Staff member has approved ${leaveConflict.leaveType} leave on due date ${dueDateStr}`
      );
    }

    // 4. Generate unique assignment number
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const assignmentNumber = `TSK-${yearMonth}-${rand}`;

    const task = await LaboratoryTaskAssignmentModel.create({
      assignmentNumber,
      laboratoryId: labId,
      departmentId: input.departmentId
        ? new Types.ObjectId(input.departmentId)
        : staff.departmentId,
      taskType: input.taskType,
      title: input.title.trim(),
      description: input.description?.trim(),
      relatedEntityType: input.relatedEntityType.trim(),
      relatedEntityId: input.relatedEntityId?.trim(),
      assignedStaffId: staff._id,
      assignedBy: new Types.ObjectId(callerUserId),
      priority: input.priority || 'MEDIUM',
      dueDate: dueDateObj,
      status: 'ASSIGNED',
      assignmentHistory: [
        {
          timestamp: new Date(),
          action: 'ASSIGNED',
          newStaffId: staff._id,
          changedBy: new Types.ObjectId(callerUserId),
          note: input.notes?.trim() || 'Initial assignment',
        },
      ],
    });

    // Notify assigned staff
    if (staff.userId) {
      try {
        await notificationService.publishEvent({
          recipientId: staff.userId.toString(),
          recipientRole: 'LABORATORY',
          category: 'LAB',
          eventType: 'TASK_ASSIGNED',
          priority: input.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
          title: `Task Assigned: ${input.title}`,
          message: `You have been assigned task ${task.assignmentNumber} (${input.taskType}). Due by ${dueDateStr}.`,
          relatedEntity: {
            entityType: 'LaboratoryTaskAssignment',
            entityId: task._id.toString(),
            referenceNumber: assignmentNumber,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_TASK_ASSIGNED',
      resourceType: 'LaboratoryTaskAssignment',
      resourceId: task._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        assignmentNumber,
        assignedStaffId: staff._id.toString(),
        taskType: input.taskType,
      },
    });

    const populated: any = await LaboratoryTaskAssignmentModel.findById(task._id)
      .populate('assignedStaffId', 'fullName role')
      .populate('assignedBy', 'name email')
      .populate('departmentId', 'name');

    return this.mapTaskDoc(
      populated,
      populated.assignedStaffId?.fullName,
      populated.assignedStaffId?.role,
      populated.assignedBy?.name,
      populated.departmentId?.name
    );
  }

  /**
   * Reassign task to a different eligible staff member
   */
  async reassignTask(
    callerUserId: string,
    taskId: string,
    input: ReassignTaskDto
  ): Promise<LaboratoryTaskAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const task = await LaboratoryTaskAssignmentModel.findOne({
      _id: new Types.ObjectId(taskId),
      laboratoryId: labId,
    });
    if (!task) {
      throw AppError.notFound('Task assignment not found');
    }

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw AppError.badRequest(`Cannot reassign a ${task.status.toLowerCase()} task`);
    }

    const newStaff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(input.newStaffId),
      laboratoryId: labId,
      status: 'ACTIVE',
    });
    if (!newStaff) {
      throw AppError.badRequest('New staff member is not active in this laboratory');
    }

    const requiredPermission = this.getRequiredPermissionForTaskType(task.taskType);
    const effectivePermissions = laboratoryAuthorizationService.resolveEffectivePermissions(newStaff);
    if (!effectivePermissions.includes(requiredPermission)) {
      throw AppError.badRequest(
        `Staff member '${newStaff.fullName}' lacks permission '${requiredPermission}' required for ${task.taskType}`
      );
    }

    const previousStaffId = task.assignedStaffId;
    task.assignedStaffId = newStaff._id;
    task.status = 'ASSIGNED';

    task.assignmentHistory.push({
      timestamp: new Date(),
      action: 'REASSIGNED',
      previousStaffId,
      newStaffId: newStaff._id,
      changedBy: new Types.ObjectId(callerUserId),
      note: input.reason.trim(),
    });

    await task.save();

    // Notify new staff member
    if (newStaff.userId) {
      try {
        await notificationService.publishEvent({
          recipientId: newStaff.userId.toString(),
          recipientRole: 'LABORATORY',
          category: 'LAB',
          eventType: 'TASK_REASSIGNED',
          priority: 'MEDIUM',
          title: `Task Reassigned: ${task.title}`,
          message: `Task ${task.assignmentNumber} has been reassigned to you. Reason: ${input.reason}`,
          relatedEntity: {
            entityType: 'LaboratoryTaskAssignment',
            entityId: task._id.toString(),
            referenceNumber: task.assignmentNumber,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_TASK_REASSIGNED',
      resourceType: 'LaboratoryTaskAssignment',
      resourceId: task._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        assignmentNumber: task.assignmentNumber,
        previousStaffId: previousStaffId.toString(),
        newStaffId: newStaff._id.toString(),
        reason: input.reason,
      },
    });

    const populated: any = await LaboratoryTaskAssignmentModel.findById(task._id)
      .populate('assignedStaffId', 'fullName role')
      .populate('assignedBy', 'name email')
      .populate('departmentId', 'name');

    return this.mapTaskDoc(
      populated,
      populated.assignedStaffId?.fullName,
      populated.assignedStaffId?.role,
      populated.assignedBy?.name,
      populated.departmentId?.name
    );
  }

  /**
   * Update task status (ACCEPTED, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED)
   */
  async updateTaskStatus(
    callerUserId: string,
    taskId: string,
    input: UpdateTaskStatusDto
  ): Promise<LaboratoryTaskAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const task = await LaboratoryTaskAssignmentModel.findOne({
      _id: new Types.ObjectId(taskId),
      laboratoryId: labId,
    });
    if (!task) {
      throw AppError.notFound('Task assignment not found');
    }

    if (input.status === 'BLOCKED' && !input.blockedReason) {
      throw AppError.badRequest('Blocked reason is mandatory when blocking a task');
    }

    task.status = input.status;
    if (input.status === 'BLOCKED') {
      task.blockedReason = input.blockedReason?.trim();
    } else {
      task.blockedReason = undefined;
    }

    if (input.status === 'COMPLETED') {
      task.completedAt = new Date();
      task.completionNotes = input.notes?.trim();
    }

    task.assignmentHistory.push({
      timestamp: new Date(),
      action:
        input.status === 'ACCEPTED'
          ? 'ACCEPTED'
          : input.status === 'BLOCKED'
            ? 'BLOCKED'
            : input.status === 'COMPLETED'
              ? 'COMPLETED'
              : 'STATUS_CHANGED',
      changedBy: new Types.ObjectId(callerUserId),
      note: input.notes?.trim() || input.blockedReason?.trim() || `Status changed to ${input.status}`,
    });

    await task.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_TASK_STATUS_UPDATED',
      resourceType: 'LaboratoryTaskAssignment',
      resourceId: task._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        assignmentNumber: task.assignmentNumber,
        status: input.status,
        blockedReason: input.blockedReason,
      },
    });

    const populated: any = await LaboratoryTaskAssignmentModel.findById(task._id)
      .populate('assignedStaffId', 'fullName role')
      .populate('assignedBy', 'name email')
      .populate('departmentId', 'name');

    return this.mapTaskDoc(
      populated,
      populated.assignedStaffId?.fullName,
      populated.assignedStaffId?.role,
      populated.assignedBy?.name,
      populated.departmentId?.name
    );
  }

  /**
   * List tasks with filters and pagination
   */
  async listTasks(
    callerUserId: string,
    query: TaskFilterDto
  ): Promise<{ tasks: LaboratoryTaskAssignmentDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const labId = await this.resolveLabContext(callerUserId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { laboratoryId: labId };
    if (query.taskType) filter.taskType = query.taskType;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedStaffId) filter.assignedStaffId = new Types.ObjectId(query.assignedStaffId);
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);

    if (query.overdueOnly) {
      filter.status = { $nin: ['COMPLETED', 'CANCELLED'] };
      filter.dueDate = { $lt: new Date() };
    }

    const [tasks, total] = await Promise.all([
      LaboratoryTaskAssignmentModel.find(filter)
        .populate('assignedStaffId', 'fullName role')
        .populate('assignedBy', 'name email')
        .populate('departmentId', 'name')
        .sort({ dueDate: 1, priority: -1 })
        .skip(skip)
        .limit(limit),
      LaboratoryTaskAssignmentModel.countDocuments(filter),
    ]);

    const taskDtos = tasks.map((doc: any) =>
      this.mapTaskDoc(
        doc,
        doc.assignedStaffId?.fullName,
        doc.assignedStaffId?.role,
        doc.assignedBy?.name,
        doc.departmentId?.name
      )
    );

    return {
      tasks: taskDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Workload Overview Dashboard with real-time persisted KPIs
   */
  async getWorkloadDashboard(callerUserId: string): Promise<LaboratoryWorkloadDashboardDto> {
    const labId = await this.resolveLabContext(callerUserId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalTasks,
      unassignedTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      blockedTasks,
      pendingReportReviews,
      pendingReportApprovals,
      pendingSampleProcessing,
      activeStaffMembers,
      departments,
    ] = await Promise.all([
      LaboratoryTaskAssignmentModel.countDocuments({ laboratoryId: labId }),
      LaboratoryTaskAssignmentModel.countDocuments({ laboratoryId: labId, status: 'UNASSIGNED' }),
      LaboratoryTaskAssignmentModel.countDocuments({ laboratoryId: labId, status: 'IN_PROGRESS' }),
      LaboratoryTaskAssignmentModel.countDocuments({ laboratoryId: labId, status: 'COMPLETED' }),
      LaboratoryTaskAssignmentModel.countDocuments({
        laboratoryId: labId,
        status: { $nin: ['COMPLETED', 'CANCELLED'] },
        dueDate: { $lt: now },
      }),
      LaboratoryTaskAssignmentModel.countDocuments({ laboratoryId: labId, status: 'BLOCKED' }),
      LaboratoryReportModel.countDocuments({ laboratoryId: labId, status: 'SUBMITTED_FOR_REVIEW' }),
      LaboratoryReportModel.countDocuments({ laboratoryId: labId, status: 'APPROVED' }),
      LabSampleModel.countDocuments({ laboratoryId: labId, status: 'ACCESSIONED' }),
      LaboratoryStaffModel.find({ laboratoryId: labId, status: 'ACTIVE' }).populate('departmentId', 'name'),
      LaboratoryDepartmentModel.find({ laboratoryId: labId }),
    ]);

    // Staff workload distribution
    const todayStr = now.toISOString().slice(0, 10);
    const staffDistribution: StaffWorkloadDistributionDto[] = await Promise.all(
      activeStaffMembers.map(async (st: any) => {
        const [activeTaskCount, completedTodayCount, onLeave] = await Promise.all([
          LaboratoryTaskAssignmentModel.countDocuments({
            laboratoryId: labId,
            assignedStaffId: st._id,
            status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED'] },
          }),
          LaboratoryTaskAssignmentModel.countDocuments({
            laboratoryId: labId,
            assignedStaffId: st._id,
            status: 'COMPLETED',
            completedAt: { $gte: todayStart },
          }),
          LaboratoryLeaveRequestModel.exists({
            laboratoryId: labId,
            staffId: st._id,
            status: 'APPROVED',
            startDate: { $lte: todayStr },
            endDate: { $gte: todayStr },
          }),
        ]);

        return {
          staffId: st._id.toString(),
          staffName: st.fullName,
          employeeId: st.employeeId,
          role: st.role,
          departmentName: st.departmentId?.name,
          activeTaskCount,
          completedTodayCount,
          isAvailableToday: !onLeave,
        };
      })
    );

    // Department workload distribution
    const departmentDistribution: DepartmentWorkloadDistributionDto[] = await Promise.all(
      departments.map(async (dept: any) => {
        const [openTaskCount, completedTaskCount, staffCount] = await Promise.all([
          LaboratoryTaskAssignmentModel.countDocuments({
            laboratoryId: labId,
            departmentId: dept._id,
            status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED'] },
          }),
          LaboratoryTaskAssignmentModel.countDocuments({
            laboratoryId: labId,
            departmentId: dept._id,
            status: 'COMPLETED',
          }),
          LaboratoryStaffModel.countDocuments({
            laboratoryId: labId,
            departmentId: dept._id,
            status: 'ACTIVE',
          }),
        ]);

        return {
          departmentId: dept._id.toString(),
          departmentName: dept.name,
          openTaskCount,
          completedTaskCount,
          staffCount,
        };
      })
    );

    return {
      totalTasks,
      unassignedTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      blockedTasks,
      pendingReportReviews,
      pendingReportApprovals,
      pendingSampleProcessing,
      activeStaffCount: activeStaffMembers.length,
      staffWorkloadDistribution: staffDistribution,
      departmentWorkloadDistribution: departmentDistribution,
    };
  }

  private mapTaskDoc(
    doc: ILaboratoryTaskAssignmentDocument,
    assignedStaffName?: string,
    assignedStaffRole?: any,
    assignedByName?: string,
    departmentName?: string
  ): LaboratoryTaskAssignmentDto {
    return {
      id: doc._id.toString(),
      assignmentNumber: doc.assignmentNumber,
      laboratoryId: doc.laboratoryId.toString(),
      departmentId: doc.departmentId?.toString(),
      departmentName,
      taskType: doc.taskType,
      title: doc.title,
      description: doc.description,
      relatedEntityType: doc.relatedEntityType,
      relatedEntityId: doc.relatedEntityId,
      assignedStaffId: doc.assignedStaffId.toString(),
      assignedStaffName,
      assignedStaffRole,
      assignedBy: doc.assignedBy.toString(),
      assignedByName,
      priority: doc.priority,
      dueDate: doc.dueDate.toISOString(),
      status: doc.status,
      blockedReason: doc.blockedReason,
      completionNotes: doc.completionNotes,
      completedAt: doc.completedAt?.toISOString(),
      assignmentHistory: (doc.assignmentHistory || []).map((h) => ({
        timestamp: h.timestamp.toISOString(),
        action: h.action as any,
        previousStaffId: h.previousStaffId?.toString(),
        newStaffId: h.newStaffId?.toString(),
        changedBy: h.changedBy.toString(),
        note: h.note,
      })),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private async recordAudit(params: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          actorId:
            params.actorId && Types.ObjectId.isValid(params.actorId)
              ? new Types.ObjectId(params.actorId)
              : undefined,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          timestamp: new Date(),
          metadata: params.metadata,
        });
      }
    } catch {
      // Non-blocking
    }
  }
}

export const laboratoryWorkloadService = new LaboratoryWorkloadService();
