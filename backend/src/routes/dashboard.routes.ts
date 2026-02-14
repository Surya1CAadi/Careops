import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/dashboard/metrics
// @desc    Get dashboard metrics and alerts
// @access  Private
router.get('/metrics', getDashboardMetrics);

export default router;
