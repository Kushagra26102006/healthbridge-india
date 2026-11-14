import { Request, Response, NextFunction } from 'express';
import { doctorPatientService } from '../services/doctor-patient.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';

export class DoctorPatientController {
  /**
   * GET /api/v1/doctors/patients
   */
  async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await doctorPatientService.getPatientDirectory(userId, req.query as any);
      sendSuccess(
        res,
        result.items,
        'Assigned patient roster retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId
   */
  async getPatientProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const profile = await doctorPatientService.getPatientProfileOverview(
        userId,
        patientId,
        req.requestId
      );
      sendSuccess(res, profile, 'Patient profile overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/history
   */
  async getPatientHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const result = await doctorPatientService.getPatientTimelineHistory(
        userId,
        patientId,
        req.query as any,
        req.requestId
      );
      sendSuccess(
        res,
        result.items,
        'Patient clinical history timeline retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/records
   */
  async getPatientRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const result = await doctorPatientService.getPatientMedicalRecords(
        userId,
        patientId,
        req.query as any,
        req.requestId
      );
      sendSuccess(
        res,
        result.items,
        'Patient medical records retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/encounters
   */
  async getPatientEncounters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await doctorPatientService.getPatientEncounters(
        userId,
        patientId,
        page,
        limit,
        req.requestId
      );
      sendSuccess(
        res,
        result.items,
        'Patient encounter history retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/prescriptions
   */
  async getPatientPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await doctorPatientService.getPatientPrescriptions(
        userId,
        patientId,
        page,
        limit,
        req.requestId
      );
      sendSuccess(
        res,
        result.items,
        'Patient prescription history retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/lab-reports
   */
  async getPatientLabReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await doctorPatientService.getPatientLabReports(
        userId,
        patientId,
        page,
        limit,
        req.requestId
      );
      sendSuccess(
        res,
        result.items,
        'Patient laboratory reports retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/doctors/patients/:patientId/consent-requests
   */
  async createConsentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const request = await doctorPatientService.createConsentRequest(
        userId,
        patientId,
        req.body,
        req.requestId
      );
      sendSuccess(
        res,
        request,
        'Consent request created successfully and dispatched to patient',
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }
}

export const doctorPatientController = new DoctorPatientController();
