import { Request, Response, NextFunction } from 'express';
import { pharmacyService } from '../services/pharmacy.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import type {
  UpdatePharmacyProfileDto,
  CreatePharmacyInventoryItemDto,
  PharmacyInventoryFilterDto,
  CreatePharmacyOrderDto,
  CreateMedicineCatalogDto,
  UpdateMedicineCatalogDto,
  MedicineCatalogFilterDto,
  PharmacyStockInDto,
  PharmacyStockAdjustmentDto,
  QuarantineBatchDto,
  ReleaseBatchDto,
  InventoryTransactionFilterDto,
  DispensePrescriptionDto,
  CancelDispensingDto,
  DispensingFilterDto,
  UploadPharmacyDocumentDto,
  UpdateOperatingHoursDto,
  UpdatePharmacyServicesDto,
  InvitePharmacyStaffDto,
  UpdatePharmacyStaffDto,
  AcceptStaffInviteDto,
  PharmacyStaffFilterDto,
  ChangePharmacyPasswordDto,
} from '@healthbridge/shared-types';

export class PharmacyController {
  /**
   * GET /api/v1/pharmacy/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await pharmacyService.getProfile(userId);
      sendSuccess(res, profile, 'Pharmacy profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await pharmacyService.updateProfile(
        userId,
        req.body as UpdatePharmacyProfileDto
      );
      sendSuccess(res, profile, 'Pharmacy profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/dashboard/summary
   */
  async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await pharmacyService.getDashboardSummary(userId);
      sendSuccess(res, summary, 'Pharmacy dashboard summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     MEDICINE CATALOGUE MANAGEMENT
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/medicines
   */
  async getMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pharmacyService.getMedicines(
        req.query as unknown as MedicineCatalogFilterDto
      );
      sendSuccess(res, result, 'Medication catalogue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/medicines/:id
   */
  async getMedicineById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await pharmacyService.getMedicineById(req.params.id as string);
      sendSuccess(res, item, 'Medication catalogue item retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/medicines
   */
  async createMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await pharmacyService.createMedicine(
        req.body as CreateMedicineCatalogDto
      );
      sendSuccess(res, item, 'Medication catalogue item created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/medicines/:id
   */
  async updateMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await pharmacyService.updateMedicine(
        req.params.id as string,
        req.body as UpdateMedicineCatalogDto
      );
      sendSuccess(res, item, 'Medication catalogue item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     INVENTORY & BATCH MANAGEMENT
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/inventory
   */
  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const inventory = await pharmacyService.getInventory(
        userId,
        req.query as unknown as PharmacyInventoryFilterDto
      );
      sendSuccess(res, inventory, 'Pharmacy inventory retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/alerts
   */
  async getInventoryAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await pharmacyService.getDashboardSummary(userId);
      sendSuccess(res, summary.inventoryAlerts, 'Inventory alerts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/alerts-summary
   */
  async getAlertsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await pharmacyService.getAlertsSummary(userId);
      sendSuccess(res, summary, 'Detailed inventory alerts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/analytics
   */
  async getInventoryAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const analytics = await pharmacyService.getInventoryAnalytics(userId);
      sendSuccess(res, analytics, 'Inventory analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/expiry-report
   */
  async getExpiryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const report = await pharmacyService.getExpiryReport(
        userId,
        req.query as any
      );
      sendSuccess(res, report, 'Inventory expiry report retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/:inventoryId
   */
  async getInventoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.getInventoryById(
        userId,
        req.params.inventoryId as string
      );
      sendSuccess(res, item, 'Inventory batch details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory
   */
  async createInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.createInventoryItem(
        userId,
        req.body as CreatePharmacyInventoryItemDto
      );
      sendSuccess(res, item, 'Inventory batch created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/stock-in
   */
  async receiveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.receiveStock(
        userId,
        req.body as PharmacyStockInDto
      );
      sendSuccess(res, item, 'Stock received and inventory updated successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/stock-adjustment
   */
  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.adjustStock(
        userId,
        req.body as PharmacyStockAdjustmentDto
      );
      sendSuccess(res, item, 'Inventory stock adjusted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/batches/:inventoryId/quarantine
   */
  async quarantineBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.quarantineBatch(
        userId,
        req.params.inventoryId as string,
        req.body as QuarantineBatchDto
      );
      sendSuccess(res, item, 'Batch quarantined successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/inventory/batches/:inventoryId/release
   */
  async releaseBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const item = await pharmacyService.releaseQuarantinedBatch(
        userId,
        req.params.inventoryId as string,
        req.body as ReleaseBatchDto
      );
      sendSuccess(res, item, 'Batch released from quarantine successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     INVENTORY TRANSACTION LEDGER
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/inventory/transactions
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const transactions = await pharmacyService.getTransactions(
        userId,
        req.query as unknown as InventoryTransactionFilterDto
      );
      sendSuccess(res, transactions, 'Inventory transaction ledger retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/inventory/transactions/:transactionId
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const transaction = await pharmacyService.getTransactionById(
        userId,
        req.params.transactionId as string
      );
      sendSuccess(res, transaction, 'Transaction detail retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     PRESCRIPTIONS & ORDERS
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/prescriptions
   */
  async getPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const prescriptions = await pharmacyService.getPrescriptionQueue(
        userId,
        req.query as any
      );
      sendSuccess(res, prescriptions, 'Prescription queue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/prescriptions/:prescriptionId
   */
  async getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const prescription = await pharmacyService.getPrescriptionDetail(
        userId,
        req.params.prescriptionId as string
      );
      sendSuccess(res, prescription, 'Prescription details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders
   */
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orders = await pharmacyService.getOrders(userId, req.query as any);
      sendSuccess(res, orders, 'Pharmacy orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/orders/:orderId
   */
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await pharmacyService.getOrderById(userId, req.params.orderId as string);
      sendSuccess(res, order, 'Pharmacy order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/orders
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const order = await pharmacyService.createOrder(
        userId,
        req.body as CreatePharmacyOrderDto
      );
      sendSuccess(res, order, 'Pharmacy order created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * ============================================================================
   * DAY 5 TASK 03: PRESCRIPTION VERIFICATION, MATCHING & DISPENSING ENDPOINTS
   * ============================================================================
   */

  /**
   * GET /api/v1/pharmacy/prescriptions/:prescriptionId/verify
   */
  async verifyPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.verifyPrescription(
        userId,
        req.params.prescriptionId as string
      );
      sendSuccess(res, result, 'Prescription verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/prescriptions/:prescriptionId/match-inventory
   */
  async matchPrescriptionInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.matchPrescriptionInventory(
        userId,
        req.params.prescriptionId as string
      );
      sendSuccess(res, result, 'Prescription inventory matches retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/dispensing
   */
  async dispensePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const record = await pharmacyService.dispensePrescription(
        userId,
        req.body as DispensePrescriptionDto
      );
      sendSuccess(res, record, 'Prescription dispensed successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/dispensing
   */
  async getDispensingRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.getDispensingRecords(
        userId,
        req.query as unknown as DispensingFilterDto
      );
      sendSuccess(res, result, 'Dispensing records retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/dispensing/:id
   */
  async getDispensingRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const record = await pharmacyService.getDispensingRecordById(
        userId,
        req.params.id as string
      );
      sendSuccess(res, record, 'Dispensing record retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/dispensing/:id/receipt
   */
  async getDispensingReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const receipt = await pharmacyService.getDispensingReceipt(
        userId,
        req.params.id as string
      );
      sendSuccess(res, receipt, 'Dispensing receipt generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/dispensing/:id/cancel
   */
  async cancelDispensingRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const record = await pharmacyService.cancelDispensingRecord(
        userId,
        req.params.id as string,
        req.body as CancelDispensingDto
      );
      sendSuccess(res, record, 'Dispensing record cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     DAY 5 TASK 07: PROFILE DOCUMENTS
     ========================================================================== */

  /**
   * POST /api/v1/pharmacy/profile/documents
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const doc = await pharmacyService.uploadDocument(
        userId,
        req.body as UploadPharmacyDocumentDto
      );
      sendSuccess(res, doc, 'Statutory document uploaded successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/pharmacy/profile/documents/:documentId
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.deleteDocument(
        userId,
        req.params.documentId as string
      );
      sendSuccess(res, result, 'Statutory document removed successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     DAY 5 TASK 07: OPERATING HOURS & TIMEZONE
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/settings/operating-hours
   */
  async getOperatingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const hours = await pharmacyService.getOperatingHours(userId);
      sendSuccess(res, hours, 'Operating hours retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/pharmacy/settings/operating-hours
   */
  async updateOperatingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const hours = await pharmacyService.updateOperatingHours(
        userId,
        req.body as UpdateOperatingHoursDto
      );
      sendSuccess(res, hours, 'Operating hours updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     DAY 5 TASK 07: PHARMACY SERVICES
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/settings/services
   */
  async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const services = await pharmacyService.getServices(userId);
      sendSuccess(res, services, 'Pharmacy service settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/pharmacy/settings/services
   */
  async updateServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const services = await pharmacyService.updateServices(
        userId,
        req.body as UpdatePharmacyServicesDto
      );
      sendSuccess(res, services, 'Pharmacy service settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     DAY 5 TASK 07: STAFF MANAGEMENT
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/staff
   */
  async getStaffList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.getStaffList(
        userId,
        req.query as unknown as PharmacyStaffFilterDto
      );
      sendSuccess(res, result, 'Pharmacy staff list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/staff/invite
   */
  async inviteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const staff = await pharmacyService.inviteStaff(
        userId,
        req.body as InvitePharmacyStaffDto
      );
      sendSuccess(res, staff, 'Staff invitation issued successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/pharmacy/staff/:id
   */
  async getStaffMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const staff = await pharmacyService.getStaffMember(userId, req.params.id as string);
      sendSuccess(res, staff, 'Staff details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/pharmacy/staff/:id
   */
  async updateStaffMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const staff = await pharmacyService.updateStaffMember(
        userId,
        req.params.id as string,
        req.body as UpdatePharmacyStaffDto
      );
      sendSuccess(res, staff, 'Staff details updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/staff/:id/suspend
   */
  async suspendStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const staff = await pharmacyService.suspendStaff(
        userId,
        req.params.id as string,
        req.body?.reason
      );
      sendSuccess(res, staff, 'Staff member access suspended successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/staff/:id/reactivate
   */
  async reactivateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const staff = await pharmacyService.reactivateStaff(userId, req.params.id as string);
      sendSuccess(res, staff, 'Staff member access reactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/staff/:id/revoke
   */
  async revokeStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const staff = await pharmacyService.revokeStaff(userId, req.params.id as string);
      sendSuccess(res, staff, 'Staff member access permanently revoked');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/staff/accept-invite
   */
  async acceptStaffInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pharmacyService.acceptStaffInvite(
        req.body as AcceptStaffInviteDto
      );
      sendSuccess(res, result, 'Staff invitation accepted successfully');
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     DAY 5 TASK 07: SESSIONS & ACCOUNT SECURITY
     ========================================================================== */

  /**
   * GET /api/v1/pharmacy/sessions
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const currentToken = req.headers['authorization']?.replace('Bearer ', '');
      const sessions = await pharmacyService.getSessions(userId, currentToken);
      sendSuccess(res, sessions, 'Active sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/pharmacy/sessions/:sessionId
   */
  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.revokeSession(
        userId,
        req.params.sessionId as string,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, result, 'Session revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/sessions/revoke-others
   */
  async revokeOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const currentToken = req.headers['authorization']?.replace('Bearer ', '');
      const result = await pharmacyService.revokeOtherSessions(
        userId,
        currentToken,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, result, 'All other sessions revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/pharmacy/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await pharmacyService.changePassword(
        userId,
        req.body as ChangePharmacyPasswordDto,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const pharmacyController = new PharmacyController();
export default pharmacyController;
