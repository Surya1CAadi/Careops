import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName: string;
  address?: string;
  timezone: string;
  contactEmail: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// Generate JWT token
const generateToken = (userId: string, email: string, role: UserRole, workspaceId: string) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as string;

  if (!secret) {
    throw new AppError('JWT secret not configured', 500);
  }

  return jwt.sign({ id: userId, email, role, workspaceId }, secret, { expiresIn } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (userId: string) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string;

  if (!secret) {
    throw new AppError('JWT refresh secret not configured', 500);
  }

  return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};

// @desc    Register new user and create workspace
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const {
      email,
      password,
      firstName,
      lastName,
      workspaceName,
      address,
      timezone,
      contactEmail,
    }: RegisterBody = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create workspace and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          address: address || '',
          timezone,
          contactEmail,
          onboardingStep: 0,
          isActive: false,
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.OWNER,
          workspaceId: workspace.id,
        },
      });

      // Create default permissions
      await tx.permission.create({
        data: {
          userId: user.id,
          canAccessInbox: true,
          canManageBookings: true,
          canViewForms: true,
          canViewInventory: true,
        },
      });

      return { workspace, user };
    });

    // Generate tokens
    const token = generateToken(
      result.user.id,
      result.user.email,
      result.user.role,
      result.workspace.id
    );
    const refreshToken = generateRefreshToken(result.user.id);

    res.status(201).json({
      success: true,
      message: 'User and workspace created successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          onboardingStep: result.workspace.onboardingStep,
          isActive: result.workspace.isActive,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { email, password }: LoginBody = req.body;

    // Find user with workspace
    const user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const token = generateToken(user.id, user.email, user.role, user.workspaceId);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        workspace: {
          id: user.workspace.id,
          name: user.workspace.name,
          onboardingStep: user.workspace.onboardingStep,
          isActive: user.workspace.isActive,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new AppError('JWT refresh secret not configured', 500);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, secret) as { id: string };

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        workspaceId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new access token
    const newToken = generateToken(user.id, user.email, user.role, user.workspaceId);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            onboardingStep: true,
            isActive: true,
            timezone: true,
            contactEmail: true,
          },
        },
        permissions: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        workspace: user.workspace,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
