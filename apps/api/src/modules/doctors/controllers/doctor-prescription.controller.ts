import { Request, Response, NextFunction } from 'express';
import { doctorPrescriptionService } from '../services/doctor-prescription.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';

export class DoctorPrescriptionController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await doctorPrescriptionService.getSummaryCounts(req.user!.userId);
      sendSuccess(res, summary, 'Prescription summary metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await doctorPrescriptionService.getPrescriptions(req.user!.userId, req.query as any);
      sendSuccess(
        res,
        result.items,
        'Prescriptions retrieved successfully',
        HttpStatus.OK,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }
      );
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescription = await doctorPrescriptionService.getPrescriptionById(
        req.user!.userId,
        req.params.prescriptionId as string
      );
      sendSuccess(res, prescription, 'Prescription details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescription = await doctorPrescriptionService.createPrescription(
        req.user!.userId,
        req.body,
        req.headers['x-request-id'] as string | undefined
      );
      sendSuccess(
        res,
        prescription,
        prescription.status === 'DRAFT'
          ? 'Prescription draft saved successfully'
          : 'Prescription issued successfully',
        HttpStatus.CREATED
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescription = await doctorPrescriptionService.updatePrescription(
        req.user!.userId,
        req.params.prescriptionId as string,
        req.body,
        req.headers['x-request-id'] as string | undefined
      );
      sendSuccess(res, prescription, 'Prescription draft updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async issuePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescription = await doctorPrescriptionService.issuePrescription(
        req.user!.userId,
        req.params.prescriptionId as string,
        req.body,
        req.headers['x-request-id'] as string | undefined
      );
      sendSuccess(res, prescription, 'Prescription issued and sealed successfully');
    } catch (err) {
      next(err);
    }
  }

  async discontinuePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescription = await doctorPrescriptionService.discontinuePrescription(
        req.user!.userId,
        req.params.prescriptionId as string,
        req.body,
        req.headers['x-request-id'] as string | undefined
      );
      sendSuccess(res, prescription, 'Prescription discontinued successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const document = await doctorPrescriptionService.getPrescriptionDocument(
        req.user!.userId,
        req.params.prescriptionId as string
      );
      sendSuccess(res, document, 'Prescription document generated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const doctorPrescriptionController = new DoctorPrescriptionController();
export default doctorPrescriptionController;