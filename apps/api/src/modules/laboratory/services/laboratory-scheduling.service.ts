import mongoose, { Types } from 'mongoose';
import {
  LaboratoryShiftTemplateDto,
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
  LaboratoryShiftAssignmentDto,
  AssignShiftDto,
  BatchAssignShiftDto,
  UpdateShiftAssignmentDto,
  RequestShiftSwapDto,
  ReviewShiftSwapDto,
  ShiftFilterDto,
  LaboratoryLeaveRequestDto,
  CreateLeaveRequestDto,
  ReviewLeaveRequestDto,
  LeaveFilterDto,
  LaboratoryStaffAvailabilityDto,
  UpdateStaffAvailabilityDto,
} from '@healthbridge/shared-types';
import {
  LaboratoryShiftTemplateModel,
  LaboratoryShiftAssignmentModel,
  ILaboratoryShiftTemplateDocument,
  ILaboratoryShiftAssignmentDocument,
} from '../models/laboratory-shift.model';
import {
  LaboratoryLeaveRequestModel,
  LaboratoryStaffAvailabilityModel,
  ILaboratoryLeaveRequestDocument,
  ILaboratoryStaffAvailabilityDocument,
} from '../models/laboratory-leave.model';
import { LaboratoryStaffModel } from '../models/laboratory-staff.model';
import { LaboratoryTaskAssignmentModel } from '../models/laboratory-task-assignment.model';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { notificationService } from '../../notifications/services/notification.service';
import { AppError } from '../../../shared/errors/app-error';

export class LaboratorySchedulingService {
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

  // ===========================================================================
  // 1. SHIFT TEMPLATES
  // ===========================================================================

  async createShiftTemplate(
    callerUserId: string,
    input: CreateShiftTemplateDto
  ): Promise<LaboratoryShiftTemplateDto> {
    const labId = await this.resolveLabContext(callerUserId);
    const code = input.code.trim().toUpperCase();

    const existing = await LaboratoryShiftTemplateModel.findOne({
      laboratoryId: labId,
      code,
    });
    if (existing) {
      throw AppError.conflict(`Shift template with code '${code}' already exists`);
    }

    const isOvernight =
      input.isOvernight !== undefined
        ? input.isOvernight
        : input.endTime < input.startTime;

    const template = await LaboratoryShiftTemplateModel.create({
      laboratoryId: labId,
      name: input.name.trim(),
      code,
      startTime: input.startTime.trim(),
      endTime: input.endTime.trim(),
      breakMinutes: input.breakMinutes ?? 30,
      isOvernight,
      color: input.color,
      applicableDepartmentIds: (input.applicableDepartmentIds || []).map(
        (id) => new Types.ObjectId(id)
      ),
      isActive: input.isActive ?? true,
    });

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_SHIFT_TEMPLATE_CREATED',
      resourceType: 'LaboratoryShiftTemplate',
      resourceId: template._id.toString(),
      metadata: { laboratoryId: labId.toString(), code, name: template.name },
    });

    return this.mapTemplateDoc(template);
  }

  async updateShiftTemplate(
    callerUserId: string,
    templateId: string,
    input: UpdateShiftTemplateDto
  ): Promise<LaboratoryShiftTemplateDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const template = await LaboratoryShiftTemplateModel.findOne({
      _id: new Types.ObjectId(templateId),
      laboratoryId: labId,
    });
    if (!template) {
      throw AppError.notFound('Shift template not found');
    }

    if (input.code && input.code !== template.code) {
      const conflict = await LaboratoryShiftTemplateModel.findOne({
        laboratoryId: labId,
        code: input.code.toUpperCase(),
        _id: { $ne: template._id },
      });
      if (conflict) {
        throw AppError.conflict(`Shift code '${input.code}' is already in use`);
      }
      template.code = input.code.toUpperCase();
    }

    if (input.name !== undefined) template.name = input.name.trim();
    if (input.startTime !== undefined) template.startTime = input.startTime.trim();
    if (input.endTime !== undefined) template.endTime = input.endTime.trim();
    if (input.breakMinutes !== undefined) template.breakMinutes = input.breakMinutes;
    if (input.isOvernight !== undefined) template.isOvernight = input.isOvernight;
    else if (input.startTime || input.endTime) {
      template.isOvernight = template.endTime < template.startTime;
    }
    if (input.color !== undefined) template.color = input.color;
    if (input.isActive !== undefined) template.isActive = input.isActive;
    if (input.applicableDepartmentIds !== undefined) {
      template.applicableDepartmentIds = input.applicableDepartmentIds.map(
        (id) => new Types.ObjectId(id)
      );
    }

    await template.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_SHIFT_TEMPLATE_UPDATED',
      resourceType: 'LaboratoryShiftTemplate',
      resourceId: template._id.toString(),
      metadata: { laboratoryId: labId.toString(), code: template.code },
    });

    return this.mapTemplateDoc(template);
  }

  async listShiftTemplates(callerUserId: string): Promise<LaboratoryShiftTemplateDto[]> {
    const labId = await this.resolveLabContext(callerUserId);
    const templates = await LaboratoryShiftTemplateModel.find({ laboratoryId: labId }).sort({
      startTime: 1,
    });
    return templates.map((doc) => this.mapTemplateDoc(doc));
  }

  // ===========================================================================
  // 2. SHIFT ASSIGNMENTS
  // ===========================================================================

  async assignShift(
    callerUserId: string,
    input: AssignShiftDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    // 1. Verify staff belongs to lab and is ACTIVE
    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(input.staffId),
      laboratoryId: labId,
      status: 'ACTIVE',
    });
    if (!staff) {
      throw AppError.badRequest('Assigned staff member is not active in this laboratory');
    }

    // 2. Check for approved leave conflict
    const leaveConflict = await LaboratoryLeaveRequestModel.findOne({
      laboratoryId: labId,
      staffId: staff._id,
      status: 'APPROVED',
      startDate: { $lte: input.date },
      endDate: { $gte: input.date },
    });
    if (leaveConflict) {
      throw AppError.badRequest(
        `Cannot assign shift: Staff member has approved ${leaveConflict.leaveType} leave on ${input.date}`
      );
    }

    // 3. Resolve shift template
    const template = await LaboratoryShiftTemplateModel.findOne({
      _id: new Types.ObjectId(input.shiftTemplateId),
      laboratoryId: labId,
      isActive: true,
    });
    if (!template) {
      throw AppError.notFound('Active shift template not found');
    }

    // 4. Overlap conflict detection on same date
    const existingShift = await LaboratoryShiftAssignmentModel.findOne({
      laboratoryId: labId,
      staffId: staff._id,
      date: input.date,
      status: { $in: ['SCHEDULED', 'CONFIRMED', 'SWAP_REQUESTED'] },
    });
    if (existingShift) {
      throw AppError.conflict(
        `Staff member is already assigned to a shift on ${input.date} (${existingShift.startTime} - ${existingShift.endTime})`
      );
    }

    const assignment = await LaboratoryShiftAssignmentModel.create({
      laboratoryId: labId,
      staffId: staff._id,
      departmentId: input.departmentId
        ? new Types.ObjectId(input.departmentId)
        : staff.departmentId,
      shiftTemplateId: template._id,
      date: input.date,
      startTime: template.startTime,
      endTime: template.endTime,
      isOvernight: template.isOvernight,
      status: 'SCHEDULED',
      notes: input.notes?.trim(),
    });

    // Notify staff
    if (staff.userId) {
      try {
        await notificationService.publishEvent({
          recipientId: staff.userId.toString(),
          recipientRole: 'LABORATORY',
          category: 'LAB',
          eventType: 'SHIFT_ASSIGNED',
          priority: 'LOW',
          title: 'Shift Assignment Scheduled',
          message: `You have been scheduled for shift ${template.name} (${template.startTime} - ${template.endTime}) on ${input.date}.`,
          relatedEntity: {
            entityType: 'LaboratoryShiftAssignment',
            entityId: assignment._id.toString(),
            referenceNumber: input.date,
          },
        });
      } catch {
        // Notification failure is non-blocking
      }
    }

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_SHIFT_ASSIGNED',
      resourceType: 'LaboratoryShiftAssignment',
      resourceId: assignment._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        staffId: staff._id.toString(),
        date: input.date,
        templateCode: template.code,
      },
    });

    return this.mapAssignmentDoc(assignment, staff.fullName, staff.employeeId, staff.role, template.name, template.code);
  }

  async batchAssignShifts(
    callerUserId: string,
    input: BatchAssignShiftDto
  ): Promise<LaboratoryShiftAssignmentDto[]> {
    const results: LaboratoryShiftAssignmentDto[] = [];
    for (const item of input.assignments) {
      const res = await this.assignShift(callerUserId, item);
      results.push(res);
    }
    return results;
  }

  async listShifts(
    callerUserId: string,
    query: ShiftFilterDto
  ): Promise<LaboratoryShiftAssignmentDto[]> {
    const labId = await this.resolveLabContext(callerUserId);

    const filter: Record<string, unknown> = { laboratoryId: labId };
    if (query.staffId) filter.staffId = new Types.ObjectId(query.staffId);
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.status) filter.status = query.status;

    if (query.startDate && query.endDate) {
      filter.date = { $gte: query.startDate, $lte: query.endDate };
    } else if (query.startDate) {
      filter.date = { $gte: query.startDate };
    } else if (query.endDate) {
      filter.date = { $lte: query.endDate };
    }

    const assignments = await LaboratoryShiftAssignmentModel.find(filter)
      .populate('staffId', 'fullName employeeId role')
      .populate('shiftTemplateId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ date: 1, startTime: 1 });

    return assignments.map((doc: any) =>
      this.mapAssignmentDoc(
        doc,
        doc.staffId?.fullName,
        doc.staffId?.employeeId,
        doc.staffId?.role,
        doc.shiftTemplateId?.name,
        doc.shiftTemplateId?.code,
        doc.departmentId?.name
      )
    );
  }

  async updateShiftAssignment(
    callerUserId: string,
    assignmentId: string,
    input: UpdateShiftAssignmentDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const assignment = await LaboratoryShiftAssignmentModel.findOne({
      _id: new Types.ObjectId(assignmentId),
      laboratoryId: labId,
    });
    if (!assignment) {
      throw AppError.notFound('Shift assignment not found');
    }

    if (input.shiftTemplateId) {
      const template = await LaboratoryShiftTemplateModel.findOne({
        _id: new Types.ObjectId(input.shiftTemplateId),
        laboratoryId: labId,
        isActive: true,
      });
      if (!template) {
        throw AppError.notFound('Shift template not found');
      }
      assignment.shiftTemplateId = template._id;
      assignment.startTime = template.startTime;
      assignment.endTime = template.endTime;
      assignment.isOvernight = template.isOvernight;
    }

    if (input.departmentId !== undefined) {
      assignment.departmentId = new Types.ObjectId(input.departmentId);
    }
    if (input.status !== undefined) assignment.status = input.status;
    if (input.notes !== undefined) assignment.notes = input.notes?.trim();

    await assignment.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_SHIFT_UPDATED',
      resourceType: 'LaboratoryShiftAssignment',
      resourceId: assignment._id.toString(),
      metadata: { laboratoryId: labId.toString(), status: assignment.status },
    });

    const populated: any = await LaboratoryShiftAssignmentModel.findById(assignment._id)
      .populate('staffId', 'fullName employeeId role')
      .populate('shiftTemplateId', 'name code');

    return this.mapAssignmentDoc(
      populated,
      populated.staffId?.fullName,
      populated.staffId?.employeeId,
      populated.staffId?.role,
      populated.shiftTemplateId?.name,
      populated.shiftTemplateId?.code
    );
  }

  async requestShiftSwap(
    callerUserId: string,
    assignmentId: string,
    input: RequestShiftSwapDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const assignment = await LaboratoryShiftAssignmentModel.findOne({
      _id: new Types.ObjectId(assignmentId),
      laboratoryId: labId,
    });
    if (!assignment) {
      throw AppError.notFound('Shift assignment not found');
    }

    const targetStaff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(input.targetStaffId),
      laboratoryId: labId,
      status: 'ACTIVE',
    });
    if (!targetStaff) {
      throw AppError.badRequest('Target staff member for swap is not active in this laboratory');
    }

    assignment.status = 'SWAP_REQUESTED';
    assignment.swapDetails = {
      requestedWithStaffId: targetStaff._id,
      reason: input.reason.trim(),
      requestedAt: new Date(),
      status: 'PENDING',
    };
    await assignment.save();

    // Notify target staff member
    if (targetStaff.userId) {
      try {
        await notificationService.publishEvent({
          recipientId: targetStaff.userId.toString(),
          recipientRole: 'LABORATORY',
          category: 'LAB',
          eventType: 'SHIFT_SWAP_REQUESTED',
          priority: 'MEDIUM',
          title: 'Shift Swap Requested',
          message: `A colleague has requested to swap shifts with you for date ${assignment.date}.`,
          relatedEntity: {
            entityType: 'LaboratoryShiftAssignment',
            entityId: assignment._id.toString(),
            referenceNumber: assignment.date,
          },
        });
      } catch {
        // Notification failure
      }
    }

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_SHIFT_SWAP_REQUESTED',
      resourceType: 'LaboratoryShiftAssignment',
      resourceId: assignment._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        targetStaffId: targetStaff._id.toString(),
        date: assignment.date,
      },
    });

    const populated: any = await LaboratoryShiftAssignmentModel.findById(assignment._id)
      .populate('staffId', 'fullName employeeId role')
      .populate('shiftTemplateId', 'name code');

    return this.mapAssignmentDoc(
      populated,
      populated.staffId?.fullName,
      populated.staffId?.employeeId,
      populated.staffId?.role,
      populated.shiftTemplateId?.name,
      populated.shiftTemplateId?.code
    );
  }

  async reviewShiftSwap(
    callerUserId: string,
    assignmentId: string,
    input: ReviewShiftSwapDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const assignment = await LaboratoryShiftAssignmentModel.findOne({
      _id: new Types.ObjectId(assignmentId),
      laboratoryId: labId,
    });
    if (!assignment || !assignment.swapDetails) {
      throw AppError.notFound('Pending shift swap request not found');
    }

    if (input.approved) {
      const originalStaffId = assignment.staffId;
      const targetStaffId = assignment.swapDetails.requestedWithStaffId;

      assignment.staffId = targetStaffId;
      assignment.status = 'SWAPPED';
      assignment.swapDetails.status = 'APPROVED';
      assignment.swapDetails.reviewedBy = new Types.ObjectId(callerUserId);
      assignment.swapDetails.reviewedAt = new Date();

      await assignment.save();

      await this.recordAudit({
        actorId: callerUserId,
        action: 'LAB_SHIFT_SWAP_APPROVED',
        resourceType: 'LaboratoryShiftAssignment',
        resourceId: assignment._id.toString(),
        metadata: {
          originalStaffId: originalStaffId.toString(),
          targetStaffId: targetStaffId.toString(),
          date: assignment.date,
        },
      });
    } else {
      assignment.status = 'SCHEDULED';
      assignment.swapDetails.status = 'REJECTED';
      assignment.swapDetails.rejectionReason = input.reason?.trim();
      assignment.swapDetails.reviewedBy = new Types.ObjectId(callerUserId);
      assignment.swapDetails.reviewedAt = new Date();

      await assignment.save();

      await this.recordAudit({
        actorId: callerUserId,
        action: 'LAB_SHIFT_SWAP_REJECTED',
        resourceType: 'LaboratoryShiftAssignment',
        resourceId: assignment._id.toString(),
        metadata: { reason: input.reason },
      });
    }

    const populated: any = await LaboratoryShiftAssignmentModel.findById(assignment._id)
      .populate('staffId', 'fullName employeeId role')
      .populate('shiftTemplateId', 'name code');

    return this.mapAssignmentDoc(
      populated,
      populated.staffId?.fullName,
      populated.staffId?.employeeId,
      populated.staffId?.role,
      populated.shiftTemplateId?.name,
      populated.shiftTemplateId?.code
    );
  }

  // ===========================================================================
  // 3. LEAVE MANAGEMENT
  // ===========================================================================

  async submitLeaveRequest(
    callerUserId: string,
    input: CreateLeaveRequestDto
  ): Promise<LaboratoryLeaveRequestDto> {
    const labId = await this.resolveLabContext(callerUserId);

    let staffId: Types.ObjectId;
    if (input.staffId) {
      staffId = new Types.ObjectId(input.staffId);
    } else {
      const selfStaff = await LaboratoryStaffModel.findOne({
        userId: new Types.ObjectId(callerUserId),
        laboratoryId: labId,
        status: 'ACTIVE',
      });
      if (!selfStaff) {
        throw AppError.badRequest('Caller is not an active staff member in this laboratory');
      }
      staffId = selfStaff._id;
    }

    const staff = await LaboratoryStaffModel.findOne({
      _id: staffId,
      laboratoryId: labId,
    });
    if (!staff) {
      throw AppError.notFound('Staff member not found');
    }

    // Check conflict with scheduled shifts
    const [affectedShiftCount, affectedTaskCount] = await Promise.all([
      LaboratoryShiftAssignmentModel.countDocuments({
        laboratoryId: labId,
        staffId: staff._id,
        date: { $gte: input.startDate, $lte: input.endDate },
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      }),
      LaboratoryTaskAssignmentModel.countDocuments({
        laboratoryId: labId,
        assignedStaffId: staff._id,
        dueDate: {
          $gte: new Date(`${input.startDate}T00:00:00.000Z`),
          $lte: new Date(`${input.endDate}T23:59:59.999Z`),
        },
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED'] },
      }),
    ]);

    const leave = await LaboratoryLeaveRequestModel.create({
      laboratoryId: labId,
      staffId: staff._id,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason.trim(),
      status: 'PENDING',
      affectedShiftCount,
      affectedTaskCount,
    });

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_LEAVE_REQUESTED',
      resourceType: 'LaboratoryLeaveRequest',
      resourceId: leave._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        staffId: staff._id.toString(),
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        affectedShiftCount,
        affectedTaskCount,
      },
    });

    return this.mapLeaveDoc(leave, staff.fullName, staff.employeeId);
  }

  async reviewLeaveRequest(
    callerUserId: string,
    leaveId: string,
    input: ReviewLeaveRequestDto
  ): Promise<LaboratoryLeaveRequestDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const leave = await LaboratoryLeaveRequestModel.findOne({
      _id: new Types.ObjectId(leaveId),
      laboratoryId: labId,
    });
    if (!leave) {
      throw AppError.notFound('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw AppError.badRequest(`Leave request is already ${leave.status.toLowerCase()}`);
    }

    leave.status = input.status;
    leave.approvedBy = new Types.ObjectId(callerUserId);
    leave.approvedAt = new Date();
    if (input.status === 'REJECTED') {
      leave.rejectionReason = input.rejectionReason?.trim();
    }
    await leave.save();

    const staff = await LaboratoryStaffModel.findById(leave.staffId);

    // If approved, notify staff and supervisors
    if (input.status === 'APPROVED' && staff?.userId) {
      try {
        await notificationService.publishEvent({
          recipientId: staff.userId.toString(),
          recipientRole: 'LABORATORY',
          category: 'LAB',
          eventType: 'LEAVE_REQUEST_APPROVED',
          priority: 'MEDIUM',
          title: 'Leave Request Approved',
          message: `Your ${leave.leaveType} leave request for ${leave.startDate} to ${leave.endDate} has been approved.`,
          relatedEntity: {
            entityType: 'LaboratoryLeaveRequest',
            entityId: leave._id.toString(),
            referenceNumber: `${leave.startDate}_${leave.endDate}`,
          },
        });
      } catch {
        // Notification failure
      }
    }

    await this.recordAudit({
      actorId: callerUserId,
      action: `LAB_LEAVE_${input.status}`,
      resourceType: 'LaboratoryLeaveRequest',
      resourceId: leave._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        status: input.status,
        rejectionReason: input.rejectionReason,
      },
    });

    return this.mapLeaveDoc(leave, staff?.fullName, staff?.employeeId);
  }

  async listLeaveRequests(
    callerUserId: string,
    query: LeaveFilterDto
  ): Promise<LaboratoryLeaveRequestDto[]> {
    const labId = await this.resolveLabContext(callerUserId);

    const filter: Record<string, unknown> = { laboratoryId: labId };
    if (query.staffId) filter.staffId = new Types.ObjectId(query.staffId);
    if (query.status) filter.status = query.status;

    if (query.startDate && query.endDate) {
      filter.startDate = { $lte: query.endDate };
      filter.endDate = { $gte: query.startDate };
    }

    const leaves = await LaboratoryLeaveRequestModel.find(filter)
      .populate('staffId', 'fullName employeeId')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return leaves.map((doc: any) =>
      this.mapLeaveDoc(
        doc,
        doc.staffId?.fullName,
        doc.staffId?.employeeId,
        doc.approvedBy?.name
      )
    );
  }

  // ===========================================================================
  // 4. STAFF AVAILABILITY
  // ===========================================================================

  async getStaffAvailability(
    callerUserId: string,
    staffId: string
  ): Promise<LaboratoryStaffAvailabilityDto> {
    const labId = await this.resolveLabContext(callerUserId);

    let availability = await LaboratoryStaffAvailabilityModel.findOne({
      laboratoryId: labId,
      staffId: new Types.ObjectId(staffId),
    });

    const staff = await LaboratoryStaffModel.findById(staffId);
    if (!staff) {
      throw AppError.notFound('Staff member not found');
    }

    if (!availability) {
      availability = await LaboratoryStaffAvailabilityModel.create({
        laboratoryId: labId,
        staffId: staff._id,
        timezone: 'Asia/Kolkata',
      });
    }

    return this.mapAvailabilityDoc(availability, staff.fullName);
  }

  async updateStaffAvailability(
    callerUserId: string,
    staffId: string,
    input: UpdateStaffAvailabilityDto
  ): Promise<LaboratoryStaffAvailabilityDto> {
    const labId = await this.resolveLabContext(callerUserId);

    let availability = await LaboratoryStaffAvailabilityModel.findOne({
      laboratoryId: labId,
      staffId: new Types.ObjectId(staffId),
    });

    const staff = await LaboratoryStaffModel.findById(staffId);
    if (!staff) {
      throw AppError.notFound('Staff member not found');
    }

    if (!availability) {
      availability = new LaboratoryStaffAvailabilityModel({
        laboratoryId: labId,
        staffId: staff._id,
      });
    }

    if (input.timezone !== undefined) availability.timezone = input.timezone;
    if (input.weeklySchedule !== undefined) {
      availability.weeklySchedule = input.weeklySchedule.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        isAvailable: w.isAvailable,
        preferredShiftTemplateId: w.preferredShiftTemplateId
          ? new Types.ObjectId(w.preferredShiftTemplateId)
          : undefined,
        maxHours: w.maxHours,
      }));
    }
    if (input.customBlackouts !== undefined) {
      availability.customBlackouts = input.customBlackouts;
    }

    await availability.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_STAFF_AVAILABILITY_UPDATED',
      resourceType: 'LaboratoryStaffAvailability',
      resourceId: availability._id.toString(),
      metadata: { laboratoryId: labId.toString(), staffId },
    });

    return this.mapAvailabilityDoc(availability, staff.fullName);
  }

  // ===========================================================================
  // MAPPERS
  // ===========================================================================

  private mapTemplateDoc(doc: ILaboratoryShiftTemplateDocument): LaboratoryShiftTemplateDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      name: doc.name,
      code: doc.code,
      startTime: doc.startTime,
      endTime: doc.endTime,
      breakMinutes: doc.breakMinutes,
      isOvernight: doc.isOvernight,
      color: doc.color,
      applicableDepartmentIds: (doc.applicableDepartmentIds || []).map((id) => id.toString()),
      isActive: doc.isActive,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapAssignmentDoc(
    doc: ILaboratoryShiftAssignmentDocument,
    staffName?: string,
    staffEmployeeId?: string,
    staffRole?: any,
    shiftTemplateName?: string,
    shiftTemplateCode?: string,
    departmentName?: string
  ): LaboratoryShiftAssignmentDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      staffId: doc.staffId.toString(),
      staffName,
      staffEmployeeId,
      staffRole,
      departmentId: doc.departmentId?.toString(),
      departmentName,
      shiftTemplateId: doc.shiftTemplateId.toString(),
      shiftTemplateName,
      shiftTemplateCode,
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      isOvernight: doc.isOvernight,
      status: doc.status,
      swapDetails: doc.swapDetails
        ? {
            requestedWithStaffId: doc.swapDetails.requestedWithStaffId.toString(),
            reason: doc.swapDetails.reason,
            requestedAt: doc.swapDetails.requestedAt.toISOString(),
            reviewedBy: doc.swapDetails.reviewedBy?.toString(),
            reviewedAt: doc.swapDetails.reviewedAt?.toISOString(),
            status: doc.swapDetails.status,
            rejectionReason: doc.swapDetails.rejectionReason,
          }
        : undefined,
      notes: doc.notes,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapLeaveDoc(
    doc: ILaboratoryLeaveRequestDocument,
    staffName?: string,
    staffEmployeeId?: string,
    approvedByName?: string
  ): LaboratoryLeaveRequestDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      staffId: doc.staffId.toString(),
      staffName,
      staffEmployeeId,
      leaveType: doc.leaveType,
      startDate: doc.startDate,
      endDate: doc.endDate,
      reason: doc.reason,
      status: doc.status,
      approvedBy: doc.approvedBy?.toString(),
      approvedByName,
      approvedAt: doc.approvedAt?.toISOString(),
      rejectionReason: doc.rejectionReason,
      affectedShiftCount: doc.affectedShiftCount || 0,
      affectedTaskCount: doc.affectedTaskCount || 0,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapAvailabilityDoc(
    doc: ILaboratoryStaffAvailabilityDocument,
    staffName?: string
  ): LaboratoryStaffAvailabilityDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      staffId: doc.staffId.toString(),
      staffName,
      timezone: doc.timezone,
      weeklySchedule: (doc.weeklySchedule || []).map((w) => ({
        dayOfWeek: w.dayOfWeek as any,
        isAvailable: w.isAvailable,
        preferredShiftTemplateId: w.preferredShiftTemplateId?.toString(),
        maxHours: w.maxHours,
      })),
      customBlackouts: doc.customBlackouts || [],
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

export const laboratorySchedulingService = new LaboratorySchedulingService();
