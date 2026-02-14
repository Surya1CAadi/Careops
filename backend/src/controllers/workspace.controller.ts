import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// @desc    Get current workspace
// @route   GET /api/workspaces/current
// @access  Private
export const getWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
        integrations: {
          select: {
            id: true,
            type: true,
            provider: true,
            isActive: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workspace settings
// @route   PUT /api/workspaces/current
// @access  Private (Owner only)
export const updateWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { name, address, timezone, contactEmail } = req.body;

    const workspace = await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(timezone && { timezone }),
        ...(contactEmail && { contactEmail }),
      },
    });

    res.json({
      success: true,
      message: 'Workspace updated successfully',
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete onboarding step
// @route   POST /api/workspaces/onboarding/step
// @access  Private (Owner only)
export const completeOnboardingStep = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { step } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    // Update onboarding step only if the new step is higher
    if (step > workspace.onboardingStep) {
      const updatedWorkspace = await prisma.workspace.update({
        where: { id: req.user.workspaceId },
        data: { onboardingStep: step },
      });

      res.json({
        success: true,
        message: 'Onboarding step completed',
        data: updatedWorkspace,
      });
    } else {
      res.json({
        success: true,
        message: 'Onboarding step already completed',
        data: workspace,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Activate workspace
// @route   POST /api/workspaces/activate
// @access  Private (Owner only)
export const activateWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
      include: {
        integrations: true,
        bookingTypes: true,
      },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    // Validation checks before activation
    const hasActiveIntegration = workspace.integrations.some(
      (int) => int.isActive && (int.type === 'EMAIL' || int.type === 'SMS')
    );

    if (!hasActiveIntegration) {
      throw new AppError('At least one communication channel (Email or SMS) must be configured', 400);
    }

    if (workspace.bookingTypes.length === 0) {
      throw new AppError('At least one booking type must be created', 400);
    }

    // Activate workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: { isActive: true },
    });

    res.json({
      success: true,
      message: 'Workspace activated successfully',
      data: updatedWorkspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add staff user
// @route   POST /api/workspaces/staff
// @access  Private (Owner only)
export const addStaffUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { email, firstName, lastName, password, permissions } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create staff user with permissions
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.STAFF,
        workspaceId: req.user.workspaceId,
        permissions: {
          create: {
            canAccessInbox: permissions?.canAccessInbox || false,
            canManageBookings: permissions?.canManageBookings || false,
            canViewForms: permissions?.canViewForms || false,
            canViewInventory: permissions?.canViewInventory || false,
          },
        },
      },
      include: {
        permissions: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff user added successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
