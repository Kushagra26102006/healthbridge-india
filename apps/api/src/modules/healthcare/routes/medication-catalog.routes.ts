import { Router } from 'express';
import { medicationCatalogController } from '../controllers/medication-catalog.controller';
import { authenticate } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validate';
import {
  medicationCatalogQuerySchema,
  medicationCatalogIdParamSchema,
} from '@healthbridge/validation';

export const medicationCatalogRoutes = Router();

// Require authentication for medication catalog lookup
medicationCatalogRoutes.use(authenticate);

/**
 * @route   GET /api/v1/medication-catalog
 * @desc    Search and list pharmaceutical catalog items
 * @access  Private (Authenticated users)
 */
medicationCatalogRoutes.get(
  '/',
  validateRequest({ query: medicationCatalogQuerySchema }),
  (req, res, next) => medicationCatalogController.searchCatalog(req, res, next)
);

/**
 * @route   GET /api/v1/medication-catalog/:medicationId
 * @desc    Get detailed medication information from catalog
 * @access  Private (Authenticated users)
 */
medicationCatalogRoutes.get(
  '/:medicationId',
  validateRequest({ params: medicationCatalogIdParamSchema }),
  (req, res, next) => medicationCatalogController.getMedicationById(req, res, next)
);

export default medicationCatalogRoutes;