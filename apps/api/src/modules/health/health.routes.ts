import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive system health and connectivity check
 * @access  Public
 */
router.get('/', (req, res, next) => healthController.getHealth(req, res, next));

export const healthRoutes: Router = router;
