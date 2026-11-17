import mongoose, { Types } from 'mongoose';
import {
  LaboratoryDepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@healthbridge/shared-types';
import { LaboratoryDepartmentModel, ILaboratoryDepartmentDocument } from '../models/laboratory-department.model';
import { LaboratoryStaffModel } from '../models/laboratory-staff.model';
import { LaboratoryTaskAssignmentModel } from '../models/laboratory-task-assignment.model';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';

export class LaboratoryDepartmentService {
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
   * Create a new laboratory department
   */
  async createDepartment(
    callerUserId: string,
    input: CreateDepartmentDto
  ): Promise<LaboratoryDepartmentDto> {
    const labId = await this.resolveLabContext(callerUserId);
    const code = input.code.trim().toUpperCase();

    // Check code uniqueness in this laboratory
    const existing = await LaboratoryDepartmentModel.findOne({
      laboratoryId: labId,
      code,
    });
    if (existing) {
      throw AppError.conflict(`Department code '${code}' already exists in this laboratory`);
    }

    let headObjectId: Types.ObjectId | undefined;
    if (input.headOfDepartmentId) {
      headObjectId = new Types.ObjectId(input.headOfDepartmentId);
      const staff = await LaboratoryStaffModel.findOne({
        _id: headObjectId,
        laboratoryId: labId,
        status: 'ACTIVE',
      });
      if (!staff) {
        throw AppError.badRequest('Assigned Head of Department is not an active staff member in this laboratory');
      }
    }

    const dept = await LaboratoryDepartmentModel.create({
      laboratoryId: labId,
      name: input.name.trim(),
      code,
      description: input.description?.trim(),
      headOfDepartmentId: headObjectId,
      contactExtension: input.contactExtension?.trim(),
      location: input.location?.trim(),
      isActive: input.isActive ?? true,
    });

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_DEPARTMENT_CREATED',
      resourceType: 'LaboratoryDepartment',
      resourceId: dept._id.toString(),
      metadata: { laboratoryId: labId.toString(), code, name: dept.name },
    });

    return this.mapDepartmentDoc(dept, 0, 0);
  }

  /**
   * Update department details
   */
  async updateDepartment(
    callerUserId: string,
    departmentId: string,
    input: UpdateDepartmentDto
  ): Promise<LaboratoryDepartmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const dept = await LaboratoryDepartmentModel.findOne({
      _id: new Types.ObjectId(departmentId),
      laboratoryId: labId,
    });
    if (!dept) {
      throw AppError.notFound('Department not found');
    }

    if (input.code && input.code !== dept.code) {
      const conflict = await LaboratoryDepartmentModel.findOne({
        laboratoryId: labId,
        code: input.code.toUpperCase(),
        _id: { $ne: dept._id },
      });
      if (conflict) {
        throw AppError.conflict(`Department code '${input.code}' is already in use`);
      }
      dept.code = input.code.toUpperCase();
    }

    if (input.name !== undefined) dept.name = input.name.trim();
    if (input.description !== undefined) dept.description = input.description?.trim();
    if (input.contactExtension !== undefined) dept.contactExtension = input.contactExtension?.trim();
    if (input.location !== undefined) dept.location = input.location?.trim();
    if (input.isActive !== undefined) dept.isActive = input.isActive;

    if (input.headOfDepartmentId !== undefined) {
      if (input.headOfDepartmentId === null) {
        dept.headOfDepartmentId = undefined;
      } else {
        const staff = await LaboratoryStaffModel.findOne({
          _id: new Types.ObjectId(input.headOfDepartmentId),
          laboratoryId: labId,
          status: 'ACTIVE',
        });
        if (!staff) {
          throw AppError.badRequest('Assigned Head of Department is not an active staff member in this laboratory');
        }
        dept.headOfDepartmentId = staff._id;
      }
    }

    await dept.save();

    await this.recordAudit({
      actorId: callerUserId,
      action: 'LAB_DEPARTMENT_UPDATED',
      resourceType: 'LaboratoryDepartment',
      resourceId: dept._id.toString(),
      metadata: { laboratoryId: labId.toString(), code: dept.code },
    });

    const [staffCount, workloadCount] = await Promise.all([
      LaboratoryStaffModel.countDocuments({ departmentId: dept._id, status: 'ACTIVE' }),
      LaboratoryTaskAssignmentModel.countDocuments({
        departmentId: dept._id,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED'] },
      }),
    ]);

    return this.mapDepartmentDoc(dept, staffCount, workloadCount);
  }

  /**
   * List all departments for the authenticated laboratory
   */
  async listDepartments(callerUserId: string): Promise<LaboratoryDepartmentDto[]> {
    const labId = await this.resolveLabContext(callerUserId);

    const departments = await LaboratoryDepartmentModel.find({ laboratoryId: labId })
      .populate('headOfDepartmentId', 'fullName employeeId')
      .sort({ name: 1 });

    const deptDtos: LaboratoryDepartmentDto[] = await Promise.all(
      departments.map(async (doc: any) => {
        const [staffCount, activeWorkloadCount] = await Promise.all([
          LaboratoryStaffModel.countDocuments({ departmentId: doc._id, status: 'ACTIVE' }),
          LaboratoryTaskAssignmentModel.countDocuments({
            departmentId: doc._id,
            status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED'] },
          }),
        ]);

        return {
          id: doc._id.toString(),
          laboratoryId: doc.laboratoryId.toString(),
          name: doc.name,
          code: doc.code,
          description: doc.description,
          headOfDepartmentId: doc.headOfDepartmentId?._id?.toString(),
          headOfDepartmentName: doc.headOfDepartmentId?.fullName,
          isActive: doc.isActive,
          contactExtension: doc.contactExtension,
          location: doc.location,
          staffCount,
          activeWorkloadCount,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        };
      })
    );

    return deptDtos;
  }

  /**
   * Retrieve single department
   */
  async getDepartmentById(callerUserId: string, departmentId: string): Promise<LaboratoryDepartmentDto> {
    const labId = await this.resolveLabContext(callerUserId);

    const dept: any = await LaboratoryDepartmentModel.findOne({
      _id: new Types.ObjectId(departmentId),
      laboratoryId: labId,
    }).populate('headOfDepartmentId', 'fullName employeeId');

    if (!dept) {
      throw AppError.notFound('Department not found');
    }

    const [staffCount, activeWorkloadCount] = await Promise.all([
      LaboratoryStaffModel.countDocuments({ departmentId: dept._id, status: 'ACTIVE' }),
      LaboratoryTaskAssignmentModel.countDocuments({
        departmentId: dept._id,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED'] },
      }),
    ]);

    return {
      id: dept._id.toString(),
      laboratoryId: dept.laboratoryId.toString(),
      name: dept.name,
      code: dept.code,
      description: dept.description,
      headOfDepartmentId: dept.headOfDepartmentId?._id?.toString(),
      headOfDepartmentName: dept.headOfDepartmentId?.fullName,
      isActive: dept.isActive,
      contactExtension: dept.contactExtension,
      location: dept.location,
      staffCount,
      activeWorkloadCount,
      createdAt: dept.createdAt.toISOString(),
      updatedAt: dept.updatedAt.toISOString(),
    };
  }

  private mapDepartmentDoc(
    doc: ILaboratoryDepartmentDocument,
    staffCount = 0,
    activeWorkloadCount = 0
  ): LaboratoryDepartmentDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      name: doc.name,
      code: doc.code,
      description: doc.description,
      headOfDepartmentId: doc.headOfDepartmentId?.toString(),
      isActive: doc.isActive,
      contactExtension: doc.contactExtension,
      location: doc.location,
      staffCount,
      activeWorkloadCount,
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
      // Do not crash main execution
    }
  }
}

export const laboratoryDepartmentService = new LaboratoryDepartmentService();
