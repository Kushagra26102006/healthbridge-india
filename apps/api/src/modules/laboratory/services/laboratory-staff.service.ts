import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import {
  LaboratoryStaffRole,
  LaboratoryStaffDto,
  LaboratoryStaffListResponseDto,
  InviteLaboratoryStaffDto,
  AcceptLaboratoryStaffInviteDto,
  UpdateLaboratoryStaffDto,
  UpdateStaffPermissionsDto,
  UpdateStaffStatusDto,
  LaboratoryStaffFilterDto,
  StaffActivityListResponseDto,
} from '@healthbridge/shared-types';
import { LaboratoryStaffModel, ILaboratoryStaffDocument } from '../models/laboratory-staff.model';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { UserModel } from '../../users/models/user.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { notificationService } from '../../notifications/services/notification.service';
import { laboratoryAuthorizationService } from './laboratory-authorization.service';
import { AppError } from '../../../shared/errors/app-error';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class LaboratoryStaffService {
  /**
   * Helper: Resolves the laboratory profile for the caller
   */
  async resolveLabContext(userId: string): Promise<Types.ObjectId> {
    const userObjectId = new Types.ObjectId(userId);

    // Check if user is primary owner
    const profile = await LaboratoryProfileModel.findOne({ userId: userObjectId });
    if (profile) {
      return profile._id;
    }

    // Check if user is active staff
    const staff = await LaboratoryStaffModel.findOne({
      userId: userObjectId,
      status: 'ACTIVE',
    });
    if (staff) {
      return staff.laboratoryId;
    }

    throw AppError.notFound('Laboratory context not found for user');
  }

  /**
   * Converts staff document to DTO
   */
  mapStaffDoc(doc: ILaboratoryStaffDocument, departmentName?: string): LaboratoryStaffDto {
    const effective = laboratoryAuthorizationService.resolveEffectivePermissions(doc);

    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      userId: doc.userId?.toString(),
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone,
      employeeId: doc.employeeId,
      designation: doc.designation,
      departmentId: doc.departmentId?.toString(),
      departmentName: departmentName,
      role: doc.role,
      permissions: effective,
      allowedPermissions: (doc.allowedPermissions || []) as any,
      deniedPermissions: (doc.deniedPermissions || []) as any,
      status: doc.status,
      isPrimaryOwner: doc.isPrimaryOwner || false,
      profilePhotoUrl: doc.profilePhotoUrl,
      qualifications: doc.qualifications || [],
      licenseNumber: doc.licenseNumber,
      notes: doc.notes,
      invitationSentAt: doc.invitationSentAt?.toISOString(),
      invitationExpiresAt: doc.invitationExpiresAt?.toISOString(),
      invitationAcceptedAt: doc.invitationAcceptedAt?.toISOString(),
      lastActiveAt: doc.lastActiveAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  /**
   * List staff members with filtering, search, and pagination
   */
  async listStaff(
    userId: string,
    query: LaboratoryStaffFilterDto
  ): Promise<LaboratoryStaffListResponseDto> {
    const labId = await this.resolveLabContext(userId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { laboratoryId: labId };

    if (query.role) filter.role = query.role;
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.status) filter.status = query.status;

    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ fullName: rx }, { email: rx }, { employeeId: rx }, { designation: rx }];
    }

    const [staffDocs, total] = await Promise.all([
      LaboratoryStaffModel.find(filter)
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LaboratoryStaffModel.countDocuments(filter),
    ]);

    const staffList: LaboratoryStaffDto[] = staffDocs.map((doc: any) => {
      const deptName = doc.departmentId?.name;
      return this.mapStaffDoc(doc, deptName);
    });

    return {
      staff: staffList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Send single-use cryptographically secure invitation to new staff member
   */
  async inviteStaff(
    callerUserId: string,
    input: InviteLaboratoryStaffDto
  ): Promise<{ staff: LaboratoryStaffDto; rawInvitationToken: string }> {
    const labId = await this.resolveLabContext(callerUserId);
    const email = input.email.trim().toLowerCase();

    // 1. Check if an active staff record with this email already exists
    const existing = await LaboratoryStaffModel.findOne({
      laboratoryId: labId,
      email,
      status: { $in: ['INVITED', 'PENDING_ACCEPTANCE', 'ACTIVE'] },
    });

    if (existing) {
      throw AppError.conflict(
        `A staff member with email '${email}' is already registered or invited in this laboratory`
      );
    }

    // 2. Role elevation guard: only LAB_ADMIN or primary owner can appoint LAB_ADMIN
    if (input.role === LaboratoryStaffRole.LAB_ADMIN) {
      const callerOwner = await LaboratoryProfileModel.findOne({
        _id: labId,
        userId: new Types.ObjectId(callerUserId),
      });
      const callerStaff = await LaboratoryStaffModel.findOne({
        laboratoryId: labId,
        userId: new Types.ObjectId(callerUserId),
        role: LaboratoryStaffRole.LAB_ADMIN,
        status: 'ACTIVE',
      });

      if (!callerOwner && !callerStaff) {
        throw AppError.forbidden('Only a Laboratory Administrator or Owner can assign the LAB_ADMIN role');
      }
    }

    // 3. Employee ID generation if omitted
    let employeeId = input.employeeId?.trim().toUpperCase();
    if (!employeeId) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      employeeId = `LAB-${year}-${rand}`;
    }

    // Verify employeeId uniqueness in this lab
    const empConflict = await LaboratoryStaffModel.findOne({
      laboratoryId: labId,
      employeeId,
    });
    if (empConflict) {
      employeeId = `${employeeId}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // 4. Cryptographically secure token generation
    const rawInvitationToken = crypto.randomBytes(32).toString('hex');
    const invitationTokenHash = crypto
      .createHash('sha256')
      .update(rawInvitationToken)
      .digest('hex');

    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 5. Check if user already has a User account
    const existingUser = await UserModel.findOne({ email });

    const staffDoc = await LaboratoryStaffModel.create({
      laboratoryId: labId,
      userId: existingUser?._id,
      fullName: input.fullName.trim(),
      email,
      phone: input.phone?.trim(),
      employeeId,
      designation: input.designation.trim(),
      departmentId: input.departmentId ? new Types.ObjectId(input.departmentId) : undefined,
      role: input.role,
      allowedPermissions: input.allowedPermissions || [],
      deniedPermissions: input.deniedPermissions || [],
      status: 'INVITED',
      isPrimaryOwner: false,
      invitationTokenHash,
      invitationSentAt: new Date(),
      invitationExpiresAt,
      invitedBy: new Types.ObjectId(callerUserId),
      qualifications: input.qualifications || [],
      licenseNumber: input.licenseNumber?.trim(),
      notes: input.notes?.trim(),
    });

    // 6. Send notification (idempotent notification helper)
    try {
      const recipientId = existingUser ? existingUser._id.toString() : callerUserId;
      await notificationService.publishEvent({
        recipientId,
        recipientRole: 'LABORATORY',
        category: 'SYSTEM',
        eventType: 'STAFF_INVITED',
        priority: 'MEDIUM',
        title: 'Laboratory Staff Invitation',
        message: `You have been invited to join the laboratory clinical team as ${input.designation}.`,
        relatedEntity: {
          entityType: 'LaboratoryStaff',
          entityId: staffDoc._id.toString(),
          referenceNumber: employeeId,
        },
      });
    } catch {
      // Notification provider failure should not block transaction
    }

    // 7. Audit log
    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_STAFF_INVITED',
      resourceType: 'LaboratoryStaff',
      resourceId: staffDoc._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        employeeId,
        email,
        role: input.role,
      },
    });

    return {
      staff: this.mapStaffDoc(staffDoc),
      rawInvitationToken,
    };
  }

  /**
   * Accept staff invitation using single-use raw token
   */
  async acceptInvitation(
    input: AcceptLaboratoryStaffInviteDto,
    authenticatedUserId?: string
  ): Promise<{ message: string; staff: LaboratoryStaffDto }> {
    const rawToken = input.invitationToken.trim();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const staff = await LaboratoryStaffModel.findOne({
      invitationTokenHash: tokenHash,
      status: { $in: ['INVITED', 'PENDING_ACCEPTANCE'] },
    });

    if (!staff) {
      throw AppError.notFound('Invitation token is invalid, expired, or already used');
    }

    if (staff.invitationExpiresAt && new Date() > staff.invitationExpiresAt) {
      staff.status = 'EXPIRED';
      await staff.save();
      throw AppError.badRequest('This staff invitation has expired. Please request a new invitation.');
    }

    // Associate user ID if available
    if (authenticatedUserId && Types.ObjectId.isValid(authenticatedUserId)) {
      staff.userId = new Types.ObjectId(authenticatedUserId);
    } else if (!staff.userId) {
      const user = await UserModel.findOne({ email: staff.email });
      if (user) {
        staff.userId = user._id;
      }
    }

    staff.status = 'ACTIVE';
    staff.invitationAcceptedAt = new Date();
    staff.invitationTokenHash = undefined;
    staff.lastActiveAt = new Date();
    await staff.save();

    await this.recordAudit({
      actorId: staff.userId ? staff.userId.toString() : staff._id.toString(),
      action: 'LAB_STAFF_INVITE_ACCEPTED',
      resourceType: 'LaboratoryStaff',
      resourceId: staff._id.toString(),
      metadata: {
        laboratoryId: staff.laboratoryId.toString(),
        employeeId: staff.employeeId,
        email: staff.email,
      },
    });

    return {
      message: 'Staff invitation accepted successfully. Account is now active.',
      staff: this.mapStaffDoc(staff),
    };
  }

  /**
   * Retrieve single staff profile by ID
   */
  async getStaffById(callerUserId: string, staffId: string): Promise<LaboratoryStaffDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(staffId),
      laboratoryId: labId,
    }).populate('departmentId', 'name code');

    if (!staff) {
      throw AppError.notFound('Laboratory staff member not found');
    }

    const deptName = (staff.departmentId as any)?.name;
    return this.mapStaffDoc(staff, deptName);
  }

  /**
   * Update staff member profile details
   */
  async updateStaff(
    callerUserId: string,
    staffId: string,
    input: UpdateLaboratoryStaffDto
  ): Promise<LaboratoryStaffDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(staffId),
      laboratoryId: labId,
    });

    if (!staff) {
      throw AppError.notFound('Laboratory staff member not found');
    }

    // Role elevation guard
    if (input.role && input.role !== staff.role && input.role === LaboratoryStaffRole.LAB_ADMIN) {
      const callerOwner = await LaboratoryProfileModel.findOne({
        _id: labId,
        userId: new Types.ObjectId(callerUserId),
      });
      const callerAdmin = await LaboratoryStaffModel.findOne({
        laboratoryId: labId,
        userId: new Types.ObjectId(callerUserId),
        role: LaboratoryStaffRole.LAB_ADMIN,
        status: 'ACTIVE',
      });

      if (!callerOwner && !callerAdmin) {
        throw AppError.forbidden('Only a Laboratory Administrator or Owner can assign the LAB_ADMIN role');
      }
    }

    if (input.fullName !== undefined) staff.fullName = input.fullName.trim();
    if (input.phone !== undefined) staff.phone = input.phone?.trim();
    if (input.designation !== undefined) staff.designation = input.designation.trim();
    if (input.departmentId !== undefined) {
      staff.departmentId = input.departmentId
        ? new Types.ObjectId(input.departmentId)
        : undefined;
    }
    if (input.role !== undefined) staff.role = input.role;
    if (input.profilePhotoUrl !== undefined) staff.profilePhotoUrl = input.profilePhotoUrl;
    if (input.qualifications !== undefined) staff.qualifications = input.qualifications;
    if (input.licenseNumber !== undefined) staff.licenseNumber = input.licenseNumber?.trim();
    if (input.notes !== undefined) staff.notes = input.notes?.trim();

    await staff.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_STAFF_UPDATED',
      resourceType: 'LaboratoryStaff',
      resourceId: staff._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        employeeId: staff.employeeId,
      },
    });

    return this.mapStaffDoc(staff);
  }

  /**
   * Update granular permission overrides for staff member
   */
  async updatePermissions(
    callerUserId: string,
    staffId: string,
    input: UpdateStaffPermissionsDto
  ): Promise<LaboratoryStaffDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(staffId),
      laboratoryId: labId,
    });

    if (!staff) {
      throw AppError.notFound('Laboratory staff member not found');
    }

    staff.allowedPermissions = input.allowedPermissions;
    staff.deniedPermissions = input.deniedPermissions;
    await staff.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_STAFF_PERMISSIONS_UPDATED',
      resourceType: 'LaboratoryStaff',
      resourceId: staff._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        employeeId: staff.employeeId,
        allowedPermissions: input.allowedPermissions,
        deniedPermissions: input.deniedPermissions,
        reason: input.reason,
      },
    });

    return this.mapStaffDoc(staff);
  }

  /**
   * Update staff status (ACTIVE, SUSPENDED, DEACTIVATED)
   */
  async updateStatus(
    callerUserId: string,
    staffId: string,
    input: UpdateStaffStatusDto
  ): Promise<LaboratoryStaffDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(staffId),
      laboratoryId: labId,
    });

    if (!staff) {
      throw AppError.notFound('Laboratory staff member not found');
    }

    if (staff.isPrimaryOwner) {
      throw AppError.badRequest('Primary laboratory facility owner account cannot be deactivated');
    }

    staff.status = input.status;
    await staff.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: `LAB_STAFF_${input.status}`,
      resourceType: 'LaboratoryStaff',
      resourceId: staff._id.toString(),
      metadata: {
        laboratoryId: labId.toString(),
        employeeId: staff.employeeId,
        status: input.status,
        reason: input.reason,
      },
    });

    return this.mapStaffDoc(staff);
  }

  /**
   * Retrieve authorized staff activity audit trail
   */
  async getStaffActivity(
    callerUserId: string,
    staffId: string,
    page = 1,
    limit = 20
  ): Promise<StaffActivityListResponseDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const staff = await LaboratoryStaffModel.findOne({
      _id: new Types.ObjectId(staffId),
      laboratoryId: labId,
    });

    if (!staff) {
      throw AppError.notFound('Laboratory staff member not found');
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const queryConditions: any[] = [
      { resourceId: staff._id.toString() },
      { 'metadata.staffId': staff._id.toString() },
      { 'metadata.employeeId': staff.employeeId },
    ];

    if (staff.userId) {
      queryConditions.push({ actorId: staff.userId });
    }

    const [auditDocs, total] = await Promise.all([
      AuditLogModel.find({ $or: queryConditions })
        .populate('actorId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLogModel.countDocuments({ $or: queryConditions }),
    ]);

    return {
      activities: auditDocs.map((doc: any) => ({
        id: doc._id.toString(),
        actorId: doc.actorId?._id?.toString() || doc.actorId?.toString() || 'SYSTEM',
        actorName: doc.actorId?.name,
        actorRole: doc.actorId?.role,
        action: doc.action,
        resourceType: doc.resourceType,
        resourceId: doc.resourceId,
        metadata: doc.metadata,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        createdAt: doc.timestamp?.toISOString() || doc.createdAt?.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
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
      // Audit log recording failure should not crash main transaction
    }
  }
}

export const laboratoryStaffService = new LaboratoryStaffService();
