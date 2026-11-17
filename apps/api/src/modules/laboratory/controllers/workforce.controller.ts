import { Request, Response, NextFunction } from 'express';
import { laboratoryStaffService } from '../services/laboratory-staff.service';
import { laboratoryDepartmentService } from '../services/laboratory-department.service';
import { laboratorySchedulingService } from '../services/laboratory-scheduling.service';
import { laboratoryWorkloadService } from '../services/laboratory-workload.service';
import { laboratoryAuthorizationService } from '../services/laboratory-authorization.service';
import { LaboratoryStaffRole } from '@healthbridge/shared-types';

export class LaboratoryWorkforceController {
  // ===========================================================================
  // 1. STAFF MANAGEMENT
  // ===========================================================================

  async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.listStaff(req.user!.userId, req.query as any);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async inviteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.inviteStaff(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Staff member invited successfully',
        data: result.staff,
        invitationToken: result.rawInvitationToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.acceptInvitation(
        req.body,
        req.user?.userId
      );
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.staff,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStaffById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.getStaffById(req.user!.userId, req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.updateStaff(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Staff profile updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.updatePermissions(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Staff permissions updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryStaffService.updateStatus(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: `Staff status updated to ${result.status}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStaffActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await laboratoryStaffService.getStaffActivity(
        req.user!.userId,
        req.params.id as string,
        page,
        limit
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // 2. PERMISSION CATALOGUE & ROLES
  // ===========================================================================

  getPermissionCatalogue(_req: Request, res: Response, _next: NextFunction): void {
    const catalogue = laboratoryAuthorizationService.getPermissionCatalogue();
    res.status(200).json({ success: true, data: catalogue });
  }

  getRolePermissions(_req: Request, res: Response, _next: NextFunction): void {
    const roles = Object.values(LaboratoryStaffRole);
    const roleMappings = roles.map((role) => ({
      role,
      permissions: laboratoryAuthorizationService.getDefaultPermissionsForRole(role),
    }));
    res.status(200).json({ success: true, data: roleMappings });
  }

  // ===========================================================================
  // 3. DEPARTMENT MANAGEMENT
  // ===========================================================================

  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryDepartmentService.createDepartment(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryDepartmentService.updateDepartment(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryDepartmentService.listDepartments(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryDepartmentService.getDepartmentById(
        req.user!.userId,
        req.params.id as string
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // 4. SHIFT SCHEDULING
  // ===========================================================================

  async createShiftTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.createShiftTemplate(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Shift template created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateShiftTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.updateShiftTemplate(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Shift template updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listShiftTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.listShiftTemplates(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async assignShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.assignShift(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Shift assigned successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async batchAssignShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.batchAssignShifts(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: `${result.length} shifts scheduled successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.listShifts(
        req.user!.userId,
        req.query as any
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateShiftAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.updateShiftAssignment(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Shift assignment updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async requestShiftSwap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.requestShiftSwap(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Shift swap requested successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async reviewShiftSwap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.reviewShiftSwap(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: `Shift swap ${result.status.toLowerCase()} successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // 5. LEAVE & AVAILABILITY
  // ===========================================================================

  async submitLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.submitLeaveRequest(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async reviewLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.reviewLeaveRequest(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: `Leave request ${result.status.toLowerCase()} successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listLeaveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.listLeaveRequests(
        req.user!.userId,
        req.query as any
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStaffAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.getStaffAvailability(
        req.user!.userId,
        req.params.staffId as string
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateStaffAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratorySchedulingService.updateStaffAvailability(
        req.user!.userId,
        req.params.staffId as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Staff availability updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // 6. WORKLOAD ALLOCATION & DASHBOARD
  // ===========================================================================

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryWorkloadService.createTask(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Task assigned successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async reassignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryWorkloadService.reassignTask(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Task reassigned successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryWorkloadService.updateTaskStatus(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        success: true,
        message: `Task status updated to ${result.status}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryWorkloadService.listTasks(
        req.user!.userId,
        req.query as any
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getWorkloadDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await laboratoryWorkloadService.getWorkloadDashboard(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const laboratoryWorkforceController = new LaboratoryWorkforceController();
