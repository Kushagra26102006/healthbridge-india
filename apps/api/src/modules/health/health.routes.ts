import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive system health and connectivity check
 * @access  Public
 */
router.get('/', (req, res, next) => healthController.getHealth(req, res, next));

/**
 * @route   GET /api/v1/health/live
 * @desc    Process liveness probe (200 while event loop is responsive)
 * @access  Public
 */
router.get('/live', (req, res) => healthController.getLiveness(req, res));

/**
 * @route   GET /api/v1/health/ready
 * @desc    Traffic readiness probe (200 only when MongoDB connection is active, else 503)
 * @access  Public
 */
router.get('/ready', (req, res, next) => healthController.getReadiness(req, res, next));

export const healthRoutes: Router = router;
