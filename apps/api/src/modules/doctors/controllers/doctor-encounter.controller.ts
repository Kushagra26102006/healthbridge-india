import { Request, Response, NextFunction } from 'express';
import { doctorEncounterService } from '../services/doctor-encounter.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import type { EncounterFilterQueryDto } from '@healthbridge/shared-types';

export class DoctorEncounterController {
  /**
   * GET /api/v1/doctors/encounters/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await doctorEncounterService.getSummaryCounts(userId);
      sendSuccess(res, summary, 'Encounter summary counts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/encounters
   */
  async getEncounters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { items, pagination } = await doctorEncounterService.getEncounters(
        userId,
        req.query as EncounterFilterQueryDto
      );
      sendSuccess(res, items, 'Encounters retrieved successfully', HttpStatus.OK, pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/encounters/:encounterId
   */
  async getEncounterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const encounterId = req.params.encounterId as string;
      const encounter = await doctorEncounterService.getEncounterById(userId, encounterId);
      sendSuccess(res, encounter, 'Encounter details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/doctors/encounters
   */
  async createEncounter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const encounter = await doctorEncounterService.createEncounter(
        userId,
        req.body,
        req.requestId
      );
      sendSuccess(res, encounter, 'Clinical encounter started successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/encounters/:encounterId
   * POST /api/v1/doctors/encounters/:encounterId/save-draft
   */
  async updateDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const encounterId = req.params.encounterId as string;
      const updated = await doctorEncounterService.updateEncounterDraft(
        userId,
        encounterId,
        req.body,
        req.requestId
      );
      sendSuccess(res, updated, 'Encounter draft saved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/doctors/encounters/:encounterId/complete
   */
  async completeEncounter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const encounterId = req.params.encounterId as string;
      const completed = await doctorEncounterService.completeEncounter(
        userId,
        encounterId,
        req.body,
        req.requestId
      );
      sendSuccess(res, completed, 'Clinical encounter finalized and completed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/patients/:patientId/clinical-history
   */
  async getPatientClinicalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const patientId = req.params.patientId as string;
      const history = await doctorEncounterService.getPatientClinicalHistory(
        userId,
        patientId,
        req.requestId
      );
      sendSuccess(res, history, 'Patient clinical history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const doctorEncounterController = new DoctorEncounterController();
