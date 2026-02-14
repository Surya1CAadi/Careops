import { Response, NextFunction } from 'express';
import { PrismaClient, BookingStatus, FormSubmissionStatus } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { startOfDay, endOfDay, addDays } from 'date-fns';

const prisma = new PrismaClient();

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private
export const getDashboardMetrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const workspaceId = req.user.workspaceId;
    const today = new Date();

    // Parallel queries for metrics
    const [
      todayBookings,
      upcomingBookings,
      completedBookings,
      noShowBookings,
      newInquiries,
      ongoingConversations,
      unansweredMessages,
      pendingForms,
      overdueForms,
      completedForms,
      lowStockItems,
      alerts,
    ] = await Promise.all([
      // Today's bookings
      prisma.booking.findMany({
        where: {
          workspaceId,
          startTime: {
            gte: startOfDay(today),
            lte: endOfDay(today),
          },
        },
        include: {
          contact: true,
          bookingType: true,
        },
        orderBy: { startTime: 'asc' },
      }),

      // Upcoming bookings (next 7 days)
      prisma.booking.findMany({
        where: {
          workspaceId,
          startTime: {
            gte: addDays(startOfDay(today), 1),
            lte: addDays(endOfDay(today), 7),
          },
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
        include: {
          contact: true,
          bookingType: true,
        },
        orderBy: { startTime: 'asc' },
        take: 10,
      }),

      // Completed bookings count (last 30 days)
      prisma.booking.count({
        where: {
          workspaceId,
          status: BookingStatus.COMPLETED,
          updatedAt: {
            gte: addDays(today, -30),
          },
        },
      }),

      // No-show bookings count (last 30 days)
      prisma.booking.count({
        where: {
          workspaceId,
          status: BookingStatus.NO_SHOW,
          updatedAt: {
            gte: addDays(today, -30),
          },
        },
      }),

      // New inquiries (last 24 hours)
      prisma.contact.count({
        where: {
          workspaceId,
          createdAt: {
            gte: addDays(today, -1),
          },
        },
      }),

      // Ongoing conversations
      prisma.conversation.count({
        where: {
          workspaceId,
          status: 'active',
        },
      }),

      // Unanswered messages
      prisma.message.count({
        where: {
          conversation: {
            workspaceId,
          },
          direction: 'INBOUND',
          isRead: false,
        },
      }),

      // Pending forms
      prisma.formSubmission.count({
        where: {
          contact: {
            workspaceId,
          },
          status: FormSubmissionStatus.PENDING,
        },
      }),

      // Overdue forms
      prisma.formSubmission.count({
        where: {
          contact: {
            workspaceId,
          },
          status: FormSubmissionStatus.OVERDUE,
        },
      }),

      // Completed forms (last 30 days)
      prisma.formSubmission.count({
        where: {
          contact: {
            workspaceId,
          },
          status: FormSubmissionStatus.COMPLETED,
          submittedAt: {
            gte: addDays(today, -30),
          },
        },
      }),

      // Low stock items
      prisma.inventoryItem.findMany({
        where: {
          workspaceId,
          isActive: true,
          quantity: {
            lte: prisma.inventoryItem.fields.lowStockThreshold,
          },
        },
      }),

      // Recent alerts (unread)
      prisma.alert.findMany({
        where: {
          workspaceId,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      data: {
        bookings: {
          today: todayBookings,
          upcoming: upcomingBookings,
          completedCount: completedBookings,
          noShowCount: noShowBookings,
        },
        leads: {
          newInquiries,
          ongoingConversations,
          unansweredMessages,
        },
        forms: {
          pending: pendingForms,
          overdue: overdueForms,
          completed: completedForms,
        },
        inventory: {
          lowStockItems,
          alertCount: lowStockItems.length,
        },
        alerts: alerts,
      },
    });
  } catch (error) {
    next(error);
  }
};
