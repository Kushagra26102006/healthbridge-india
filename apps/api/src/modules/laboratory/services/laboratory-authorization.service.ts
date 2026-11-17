import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  LaboratoryStaffRole,
  LaboratoryPermission,
  PermissionGroupDto,
} from '@healthbridge/shared-types';
import { LaboratoryStaffModel, ILaboratoryStaffDocument } from '../models/laboratory-staff.model';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { AppError } from '../../../shared/errors/app-error';

export class LaboratoryAuthorizationService {
  /**
   * Complete Permission Catalogue categorized by operational area
   */
  getPermissionCatalogue(): PermissionGroupDto[] {
    return [
      {
        group: 'STAFF',
        label: 'Workforce & Staff Administration',
        permissions: [
          { code: LaboratoryPermission.STAFF_VIEW, label: 'View Staff', description: 'View laboratory staff directory and profiles' },
          { code: LaboratoryPermission.STAFF_INVITE, label: 'Invite Staff', description: 'Send onboarding invitations to new workforce members' },
          { code: LaboratoryPermission.STAFF_UPDATE, label: 'Update Staff', description: 'Modify staff profile and role attributes' },
          { code: LaboratoryPermission.STAFF_DEACTIVATE, label: 'Deactivate Staff', description: 'Suspend or deactivate laboratory staff accounts' },
          { code: LaboratoryPermission.STAFF_PERMISSIONS_MANAGE, label: 'Manage Permissions', description: 'Configure granular permission overrides for staff' },
        ],
      },
      {
        group: 'ORDERS_SAMPLES',
        label: 'Orders & Sample Accessioning',
        permissions: [
          { code: LaboratoryPermission.LAB_ORDERS_VIEW, label: 'View Orders', description: 'Browse and inspect inbound laboratory orders' },
          { code: LaboratoryPermission.LAB_ORDERS_ASSIGN, label: 'Assign Orders', description: 'Accept, reject, and assign laboratory tests to work queues' },
          { code: LaboratoryPermission.LAB_SAMPLES_VIEW, label: 'View Samples', description: 'Inspect specimen details, tracking barcodes, and histories' },
          { code: LaboratoryPermission.LAB_SAMPLES_COLLECT, label: 'Collect Samples', description: 'Register sample collection and generate barcode labels' },
          { code: LaboratoryPermission.LAB_SAMPLES_ACCESSION, label: 'Accession Samples', description: 'Accept or reject laboratory specimens during accessioning' },
        ],
      },
      {
        group: 'PROCESSING',
        label: 'Analytical Test Processing',
        permissions: [
          { code: LaboratoryPermission.LAB_PROCESSING_VIEW, label: 'View Worklists', description: 'Access laboratory test benches and processing queues' },
          { code: LaboratoryPermission.LAB_PROCESSING_PERFORM, label: 'Process Tests', description: 'Execute diagnostic runs on laboratory instruments' },
          { code: LaboratoryPermission.LAB_RESULTS_CREATE, label: 'Record Results', description: 'Enter structured quantitative and qualitative test values' },
          { code: LaboratoryPermission.LAB_RESULTS_UPDATE, label: 'Update Results', description: 'Modify preliminary or un-reviewed test parameters' },
          { code: LaboratoryPermission.LAB_RESULTS_SUBMIT, label: 'Submit Results', description: 'Submit recorded test results for clinical peer review' },
        ],
      },
      {
        group: 'REPORTS',
        label: 'Report Generation & Approval',
        permissions: [
          { code: LaboratoryPermission.LAB_REPORTS_VIEW, label: 'View Reports', description: 'Inspect draft, approved, and published laboratory reports' },
          { code: LaboratoryPermission.LAB_REPORTS_GENERATE, label: 'Generate Reports', description: 'Draft unified diagnostic reports from completed tests' },
          { code: LaboratoryPermission.LAB_REPORTS_REVIEW, label: 'Review Reports', description: 'Perform technical review and corrections on draft reports' },
          { code: LaboratoryPermission.LAB_REPORTS_APPROVE, label: 'Approve Reports', description: 'Authorize final clinical sign-off and approval on reports' },
          { code: LaboratoryPermission.LAB_REPORTS_PUBLISH, label: 'Publish Reports', description: 'Publish sealed PDF reports to patients and doctors' },
          { code: LaboratoryPermission.LAB_REPORTS_AMEND, label: 'Amend Reports', description: 'Create versioned amendments for already published reports' },
        ],
      },
      {
        group: 'QUALITY',
        label: 'Quality Control & Incidents',
        permissions: [
          { code: LaboratoryPermission.LAB_QC_VIEW, label: 'View QC', description: 'View QC profiles, run logs, and Levey-Jennings charts' },
          { code: LaboratoryPermission.LAB_QC_CONFIGURE, label: 'Configure QC', description: 'Define QC limits, multi-level controls, and target values' },
          { code: LaboratoryPermission.LAB_QC_EXECUTE, label: 'Execute QC', description: 'Record control runs and evaluate Westgard tolerance rules' },
          { code: LaboratoryPermission.LAB_INCIDENTS_MANAGE, label: 'Manage Incidents', description: 'Investigate, resolve, and audit laboratory quality failures' },
          { code: LaboratoryPermission.LAB_CAPA_MANAGE, label: 'Manage CAPA', description: 'Create and verify Corrective & Preventive Action plans' },
        ],
      },
      {
        group: 'INSTRUMENTS',
        label: 'Instruments & Maintenance',
        permissions: [
          { code: LaboratoryPermission.LAB_INSTRUMENTS_VIEW, label: 'View Instruments', description: 'Inspect instrument registry, statuses, and service logs' },
          { code: LaboratoryPermission.LAB_INSTRUMENTS_MANAGE, label: 'Manage Instruments', description: 'Register, edit, and decommission laboratory instruments' },
          { code: LaboratoryPermission.LAB_CALIBRATION_MANAGE, label: 'Manage Calibrations', description: 'Record calibrations and perform lock-out clearances' },
          { code: LaboratoryPermission.LAB_MAINTENANCE_MANAGE, label: 'Manage Maintenance', description: 'Schedule preventive maintenance and log service work' },
        ],
      },
      {
        group: 'INVENTORY',
        label: 'Reagents & Consumables',
        permissions: [
          { code: LaboratoryPermission.LAB_REAGENTS_VIEW, label: 'View Reagents', description: 'Browse reagent catalogue, lot numbers, and stock levels' },
          { code: LaboratoryPermission.LAB_REAGENTS_MANAGE, label: 'Manage Reagents', description: 'Add and configure reagents, test mappings, and thresholds' },
          { code: LaboratoryPermission.LAB_INVENTORY_RECEIVE, label: 'Receive Inventory', description: 'Record incoming reagent lots and shipment receipts' },
          { code: LaboratoryPermission.LAB_INVENTORY_CONSUME, label: 'Consume Stock', description: 'Log test consumption and wastage of laboratory reagents' },
          { code: LaboratoryPermission.LAB_INVENTORY_ADJUST, label: 'Adjust Inventory', description: 'Perform physical stock audits and ledger adjustments' },
          { code: LaboratoryPermission.LAB_INVENTORY_QUARANTINE, label: 'Quarantine & Recall', description: 'Quarantine or recall suspect or expired reagent lots' },
        ],
      },
      {
        group: 'ANALYTICS',
        label: 'Operational Analytics',
        permissions: [
          { code: LaboratoryPermission.LAB_ANALYTICS_VIEW, label: 'View Analytics', description: 'View workload, turnaround time, and quality KPI metrics' },
          { code: LaboratoryPermission.LAB_ANALYTICS_EXPORT, label: 'Export Analytics', description: 'Export laboratory management and audit records' },
        ],
      },
    ];
  }

  /**
   * Default permissions by Laboratory Role
   */
  getDefaultPermissionsForRole(role: LaboratoryStaffRole): LaboratoryPermission[] {
    switch (role) {
      case LaboratoryStaffRole.LAB_ADMIN:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.STAFF_INVITE,
          LaboratoryPermission.STAFF_UPDATE,
          LaboratoryPermission.STAFF_DEACTIVATE,
          LaboratoryPermission.STAFF_PERMISSIONS_MANAGE,
          LaboratoryPermission.LAB_ORDERS_VIEW,
          LaboratoryPermission.LAB_ORDERS_ASSIGN,
          LaboratoryPermission.LAB_SAMPLES_VIEW,
          LaboratoryPermission.LAB_SAMPLES_COLLECT,
          LaboratoryPermission.LAB_SAMPLES_ACCESSION,
          LaboratoryPermission.LAB_PROCESSING_VIEW,
          LaboratoryPermission.LAB_PROCESSING_PERFORM,
          LaboratoryPermission.LAB_RESULTS_CREATE,
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_RESULTS_SUBMIT,
          LaboratoryPermission.LAB_REPORTS_VIEW,
          LaboratoryPermission.LAB_REPORTS_GENERATE,
          LaboratoryPermission.LAB_REPORTS_REVIEW,
          LaboratoryPermission.LAB_REPORTS_APPROVE,
          LaboratoryPermission.LAB_REPORTS_PUBLISH,
          LaboratoryPermission.LAB_REPORTS_AMEND,
          LaboratoryPermission.LAB_QC_VIEW,
          LaboratoryPermission.LAB_QC_CONFIGURE,
          LaboratoryPermission.LAB_QC_EXECUTE,
          LaboratoryPermission.LAB_INCIDENTS_MANAGE,
          LaboratoryPermission.LAB_CAPA_MANAGE,
          LaboratoryPermission.LAB_INSTRUMENTS_VIEW,
          LaboratoryPermission.LAB_INSTRUMENTS_MANAGE,
          LaboratoryPermission.LAB_CALIBRATION_MANAGE,
          LaboratoryPermission.LAB_MAINTENANCE_MANAGE,
          LaboratoryPermission.LAB_REAGENTS_VIEW,
          LaboratoryPermission.LAB_REAGENTS_MANAGE,
          LaboratoryPermission.LAB_INVENTORY_RECEIVE,
          LaboratoryPermission.LAB_INVENTORY_CONSUME,
          LaboratoryPermission.LAB_INVENTORY_ADJUST,
          LaboratoryPermission.LAB_INVENTORY_QUARANTINE,
          LaboratoryPermission.LAB_ANALYTICS_VIEW,
          LaboratoryPermission.LAB_ANALYTICS_EXPORT,
        ];

      case LaboratoryStaffRole.LAB_MANAGER:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.STAFF_INVITE,
          LaboratoryPermission.STAFF_UPDATE,
          LaboratoryPermission.LAB_ORDERS_VIEW,
          LaboratoryPermission.LAB_ORDERS_ASSIGN,
          LaboratoryPermission.LAB_SAMPLES_VIEW,
          LaboratoryPermission.LAB_SAMPLES_COLLECT,
          LaboratoryPermission.LAB_SAMPLES_ACCESSION,
          LaboratoryPermission.LAB_PROCESSING_VIEW,
          LaboratoryPermission.LAB_PROCESSING_PERFORM,
          LaboratoryPermission.LAB_RESULTS_CREATE,
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_RESULTS_SUBMIT,
          LaboratoryPermission.LAB_REPORTS_VIEW,
          LaboratoryPermission.LAB_REPORTS_GENERATE,
          LaboratoryPermission.LAB_REPORTS_REVIEW,
          LaboratoryPermission.LAB_REPORTS_APPROVE,
          LaboratoryPermission.LAB_REPORTS_PUBLISH,
          LaboratoryPermission.LAB_REPORTS_AMEND,
          LaboratoryPermission.LAB_QC_VIEW,
          LaboratoryPermission.LAB_QC_CONFIGURE,
          LaboratoryPermission.LAB_QC_EXECUTE,
          LaboratoryPermission.LAB_INCIDENTS_MANAGE,
          LaboratoryPermission.LAB_CAPA_MANAGE,
          LaboratoryPermission.LAB_INSTRUMENTS_VIEW,
          LaboratoryPermission.LAB_INSTRUMENTS_MANAGE,
          LaboratoryPermission.LAB_CALIBRATION_MANAGE,
          LaboratoryPermission.LAB_MAINTENANCE_MANAGE,
          LaboratoryPermission.LAB_REAGENTS_VIEW,
          LaboratoryPermission.LAB_REAGENTS_MANAGE,
          LaboratoryPermission.LAB_INVENTORY_RECEIVE,
          LaboratoryPermission.LAB_INVENTORY_CONSUME,
          LaboratoryPermission.LAB_INVENTORY_ADJUST,
          LaboratoryPermission.LAB_INVENTORY_QUARANTINE,
          LaboratoryPermission.LAB_ANALYTICS_VIEW,
          LaboratoryPermission.LAB_ANALYTICS_EXPORT,
        ];

      case LaboratoryStaffRole.LAB_SUPERVISOR:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.LAB_ORDERS_VIEW,
          LaboratoryPermission.LAB_ORDERS_ASSIGN,
          LaboratoryPermission.LAB_SAMPLES_VIEW,
          LaboratoryPermission.LAB_SAMPLES_COLLECT,
          LaboratoryPermission.LAB_SAMPLES_ACCESSION,
          LaboratoryPermission.LAB_PROCESSING_VIEW,
          LaboratoryPermission.LAB_PROCESSING_PERFORM,
          LaboratoryPermission.LAB_RESULTS_CREATE,
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_RESULTS_SUBMIT,
          LaboratoryPermission.LAB_REPORTS_VIEW,
          LaboratoryPermission.LAB_REPORTS_GENERATE,
          LaboratoryPermission.LAB_REPORTS_REVIEW,
          LaboratoryPermission.LAB_QC_VIEW,
          LaboratoryPermission.LAB_QC_EXECUTE,
          LaboratoryPermission.LAB_INCIDENTS_MANAGE,
          LaboratoryPermission.LAB_INSTRUMENTS_VIEW,
          LaboratoryPermission.LAB_CALIBRATION_MANAGE,
          LaboratoryPermission.LAB_MAINTENANCE_MANAGE,
          LaboratoryPermission.LAB_REAGENTS_VIEW,
          LaboratoryPermission.LAB_INVENTORY_CONSUME,
          LaboratoryPermission.LAB_ANALYTICS_VIEW,
        ];

      case LaboratoryStaffRole.LAB_TECHNICIAN:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.LAB_ORDERS_VIEW,
          LaboratoryPermission.LAB_SAMPLES_VIEW,
          LaboratoryPermission.LAB_SAMPLES_COLLECT,
          LaboratoryPermission.LAB_SAMPLES_ACCESSION,
          LaboratoryPermission.LAB_PROCESSING_VIEW,
          LaboratoryPermission.LAB_PROCESSING_PERFORM,
          LaboratoryPermission.LAB_RESULTS_CREATE,
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_RESULTS_SUBMIT,
          LaboratoryPermission.LAB_QC_VIEW,
          LaboratoryPermission.LAB_QC_EXECUTE,
          LaboratoryPermission.LAB_INSTRUMENTS_VIEW,
          LaboratoryPermission.LAB_REAGENTS_VIEW,
          LaboratoryPermission.LAB_INVENTORY_CONSUME,
        ];

      case LaboratoryStaffRole.LAB_REVIEWER:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.LAB_ORDERS_VIEW,
          LaboratoryPermission.LAB_SAMPLES_VIEW,
          LaboratoryPermission.LAB_PROCESSING_VIEW,
          LaboratoryPermission.LAB_RESULTS_CREATE,
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_RESULTS_SUBMIT,
          LaboratoryPermission.LAB_REPORTS_VIEW,
          LaboratoryPermission.LAB_REPORTS_REVIEW,
          LaboratoryPermission.LAB_REPORTS_APPROVE,
          LaboratoryPermission.LAB_QC_VIEW,
        ];

      case LaboratoryStaffRole.LAB_PATHOLOGIST:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.LAB_ORDERS_VIEW,
          LaboratoryPermission.LAB_SAMPLES_VIEW,
          LaboratoryPermission.LAB_PROCESSING_VIEW,
          LaboratoryPermission.LAB_RESULTS_CREATE,
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_RESULTS_SUBMIT,
          LaboratoryPermission.LAB_REPORTS_VIEW,
          LaboratoryPermission.LAB_REPORTS_GENERATE,
          LaboratoryPermission.LAB_REPORTS_REVIEW,
          LaboratoryPermission.LAB_REPORTS_APPROVE,
          LaboratoryPermission.LAB_REPORTS_PUBLISH,
          LaboratoryPermission.LAB_REPORTS_AMEND,
          LaboratoryPermission.LAB_QC_VIEW,
          LaboratoryPermission.LAB_INCIDENTS_MANAGE,
          LaboratoryPermission.LAB_ANALYTICS_VIEW,
        ];

      case LaboratoryStaffRole.LAB_INVENTORY_MANAGER:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.LAB_REAGENTS_VIEW,
          LaboratoryPermission.LAB_REAGENTS_MANAGE,
          LaboratoryPermission.LAB_INVENTORY_RECEIVE,
          LaboratoryPermission.LAB_INVENTORY_CONSUME,
          LaboratoryPermission.LAB_INVENTORY_ADJUST,
          LaboratoryPermission.LAB_INVENTORY_QUARANTINE,
          LaboratoryPermission.LAB_INSTRUMENTS_VIEW,
          LaboratoryPermission.LAB_INSTRUMENTS_MANAGE,
          LaboratoryPermission.LAB_MAINTENANCE_MANAGE,
        ];

      case LaboratoryStaffRole.LAB_QUALITY_MANAGER:
        return [
          LaboratoryPermission.STAFF_VIEW,
          LaboratoryPermission.LAB_QC_VIEW,
          LaboratoryPermission.LAB_QC_CONFIGURE,
          LaboratoryPermission.LAB_QC_EXECUTE,
          LaboratoryPermission.LAB_INCIDENTS_MANAGE,
          LaboratoryPermission.LAB_CAPA_MANAGE,
          LaboratoryPermission.LAB_INSTRUMENTS_VIEW,
          LaboratoryPermission.LAB_INSTRUMENTS_MANAGE,
          LaboratoryPermission.LAB_CALIBRATION_MANAGE,
          LaboratoryPermission.LAB_MAINTENANCE_MANAGE,
          LaboratoryPermission.LAB_REAGENTS_VIEW,
          LaboratoryPermission.LAB_INVENTORY_QUARANTINE,
          LaboratoryPermission.LAB_REPORTS_VIEW,
          LaboratoryPermission.LAB_REPORTS_REVIEW,
          LaboratoryPermission.LAB_ANALYTICS_VIEW,
          LaboratoryPermission.LAB_ANALYTICS_EXPORT,
        ];

      default:
        return [LaboratoryPermission.STAFF_VIEW, LaboratoryPermission.LAB_ORDERS_VIEW];
    }
  }

  /**
   * Resolves effective permissions: (RoleDefaults + allowed) - denied
   */
  resolveEffectivePermissions(staff: ILaboratoryStaffDocument): LaboratoryPermission[] {
    if (staff.isPrimaryOwner || staff.role === LaboratoryStaffRole.LAB_ADMIN) {
      // Primary owner or Lab Admin possesses all permissions
      return Object.values(LaboratoryPermission) as LaboratoryPermission[];
    }

    const defaultPerms = this.getDefaultPermissionsForRole(staff.role);
    const allowed = new Set<string>([...defaultPerms, ...(staff.allowedPermissions || [])]);
    const denied = new Set<string>(staff.deniedPermissions || []);

    const effective: LaboratoryPermission[] = [];
    for (const p of allowed) {
      if (!denied.has(p)) {
        effective.push(p as LaboratoryPermission);
      }
    }

    return effective;
  }

  /**
   * Checks whether a given user possesses the specified permission in the target laboratory
   */
  async checkUserPermission(
    userId: string,
    laboratoryId: string | Types.ObjectId,
    requiredPermission: LaboratoryPermission
  ): Promise<{
    hasPermission: boolean;
    isPrimaryOwner: boolean;
    staff: ILaboratoryStaffDocument | null;
  }> {
    const labObjectId =
      typeof laboratoryId === 'string' ? new Types.ObjectId(laboratoryId) : laboratoryId;
    const userObjectId = new Types.ObjectId(userId);

    // 1. Check if the user is the primary laboratory profile owner
    const labProfile = await LaboratoryProfileModel.findOne({
      _id: labObjectId,
      userId: userObjectId,
    });

    if (labProfile) {
      return { hasPermission: true, isPrimaryOwner: true, staff: null };
    }

    // 2. Check active staff profile
    const staff = await LaboratoryStaffModel.findOne({
      laboratoryId: labObjectId,
      userId: userObjectId,
      status: 'ACTIVE',
    });

    if (!staff) {
      return { hasPermission: false, isPrimaryOwner: false, staff: null };
    }

    const effective = this.resolveEffectivePermissions(staff);
    const hasPermission = effective.includes(requiredPermission);

    return {
      hasPermission,
      isPrimaryOwner: staff.isPrimaryOwner,
      staff,
    };
  }

  /**
   * Segregation of Duties Enforcement:
   * Prevents technician from self-approving their own test results/reports
   */
  enforceSeparationOfDuties(params: {
    action: 'APPROVE_REPORT' | 'REVIEW_REPORT';
    actorUserId: string;
    enteredByUserId?: string;
    overrideApproval?: boolean;
  }): void {
    if (
      params.action === 'APPROVE_REPORT' &&
      params.enteredByUserId &&
      params.actorUserId === params.enteredByUserId
    ) {
      if (!params.overrideApproval) {
        throw AppError.forbidden(
          'Separation of duties violation: The technician who entered test results cannot self-approve the clinical report. An independent reviewer or authorized supervisor override is required.'
        );
      }
    }
  }
}

export const laboratoryAuthorizationService = new LaboratoryAuthorizationService();

/**
 * Express Middleware: Enforces that the authenticated user possesses the required laboratory permission
 */
export const requireLabPermission = (permission: LaboratoryPermission) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        return next(AppError.unauthorized('Authentication required'));
      }

      // 1. Resolve laboratory context (from header, param, or user's active profile/staff association)
      let labId = (req.headers['x-laboratory-id'] as string) || req.params.laboratoryId;

      if (!labId) {
        // Try resolving profile where userId is owner
        const profile = await LaboratoryProfileModel.findOne({
          userId: new Types.ObjectId(req.user.userId),
        });
        if (profile) {
          labId = profile._id.toString();
        } else {
          // Check if user is staff of any lab
          const staff = await LaboratoryStaffModel.findOne({
            userId: new Types.ObjectId(req.user.userId),
            status: 'ACTIVE',
          });
          if (staff) {
            labId = staff.laboratoryId.toString();
          }
        }
      }

      if (!labId) {
        return next(
          AppError.forbidden(
            'Access forbidden: User is not associated with an active laboratory facility'
          )
        );
      }

      // 2. Verify permission
      const result = await laboratoryAuthorizationService.checkUserPermission(
        req.user.userId,
        labId,
        permission
      );

      if (!result.hasPermission) {
        return next(
          AppError.forbidden(
            `Access forbidden: Missing required laboratory permission '${permission}'`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
