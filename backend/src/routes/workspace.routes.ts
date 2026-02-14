import { Router } from 'express';
import { body } from 'express-validator';
import {
  updateWorkspace,
  completeOnboardingStep,
  activateWorkspace,
  getWorkspace,
  addStaffUser,
} from '../controllers/workspace.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/workspaces/current
// @desc    Get current workspace
// @access  Private
router.get('/current', getWorkspace);

// @route   PUT /api/workspaces/current
// @desc    Update workspace settings
// @access  Private (Owner only)
router.put(
  '/current',
  authorize(UserRole.OWNER),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('timezone').optional().notEmpty().withMessage('Timezone cannot be empty'),
  ],
  updateWorkspace
);

// @route   POST /api/workspaces/onboarding/step
// @desc    Complete onboarding step
// @access  Private (Owner only)
router.post(
  '/onboarding/step',
  authorize(UserRole.OWNER),
  [body('step').isInt({ min: 1, max: 8 }).withMessage('Invalid step number')],
  completeOnboardingStep
);

// @route   POST /api/workspaces/activate
// @desc    Activate workspace
// @access  Private (Owner only)
router.post('/activate', authorize(UserRole.OWNER), activateWorkspace);

// @route   POST /api/workspaces/staff
// @desc    Add staff user
// @access  Private (Owner only)
router.post(
  '/staff',
  authorize(UserRole.OWNER),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  addStaffUser
);

export default router;
