import { Request, Response, NextFunction } from 'express';
import { medicationCatalogService } from '../services/medication-catalog.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';

export class MedicationCatalogController {
  async searchCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicationCatalogService.searchCatalog(req.query as any);
      sendSuccess(
        res,
        result.items,
        'Medication catalog retrieved successfully',
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

  async getMedicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medication = await medicationCatalogService.getMedicationById(req.params.medicationId as string);
      sendSuccess(res, medication, 'Medication details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const medicationCatalogController = new MedicationCatalogController();
export default medicationCatalogController;