import { Router } from 'express';
import { demoController } from './demo.controller';

const router = Router();

/**
 * @route   GET /api/v1/demo/accounts
 * @desc    Get safe metadata of synthetic demo accounts for testing
 * @access  Public (Never returns passwords or private patient data)
 */
router.get('/accounts', (req, res, next) => demoController.getDemoAccounts(req, res, next));

export const demoRoutes: Router = router;
export default demoRoutes;
