import cron from 'node-cron';
import { PrismaClient, AutomationTrigger, AutomationAction, FormSubmissionStatus } from '@prisma/client';
import { Server } from 'socket.io';
import { sendEmail } from '../integrations/email.service';
import { sendSMS } from '../integrations/sms.service';
import { addDays, differenceInHours, parseISO } from 'date-fns';

const prisma = new PrismaClient();

let ioInstance: Server | null = null;

export const startAutomationEngine = (io: Server) => {
  ioInstance = io;
  console.log('🤖 Automation engine initialized');

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running scheduled automations...');
    await checkBookingReminders();
    await checkPendingForms();
    await checkInventoryLevels();
  });

  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly automations...');
    await checkOverdueForms();
  });
};

// Trigger automation based on event
export const triggerAutomation = async (
  workspaceId: string,
  trigger: AutomationTrigger,
  context: any
) => {
  try {
    // Get active automations for this trigger
    const automations = await prisma.automation.findMany({
      where: {
        workspaceId,
        trigger,
        isActive: true,
      },
    });

    for (const automation of automations) {
      await executeAutomation(automation, context);
    }
  } catch (error) {
    console.error('Error triggering automation:', error);
  }
};

// Execute automation action
const executeAutomation = async (automation: any, context: any) => {
  try {
    const config = automation.config;

    switch (automation.action) {
      case AutomationAction.SEND_EMAIL:
        if (context.email) {
          await sendEmail({
            to: context.email,
            subject: config.subject || 'Notification',
            body: replaceVariables(config.body, context),
          });
        }
        break;

      case AutomationAction.SEND_SMS:
        if (context.phone) {
          await sendSMS({
            to: context.phone,
            message: replaceVariables(config.message, context),
          });
        }
        break;

      case AutomationAction.CREATE_ALERT:
        await prisma.alert.create({
          data: {
            workspaceId: automation.workspaceId,
            type: config.alertType,
            priority: config.priority || 'MEDIUM',
            title: replaceVariables(config.title, context),
            message: replaceVariables(config.message, context),
            linkTo: context.linkTo || null,
          },
        });

        // Emit real-time alert via Socket.IO
        if (ioInstance) {
          ioInstance.to(`workspace-${automation.workspaceId}`).emit('new-alert', {
            type: config.alertType,
            message: replaceVariables(config.message, context),
          });
        }
        break;
    }
  } catch (error) {
    console.error('Error executing automation:', error);
  }
};

// Replace variables in templates
const replaceVariables = (template: string, context: any): string => {
  let result = template;

  Object.keys(context).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, context[key] || '');
  });

  return result;
};

// Check for booking reminders (24 hours before)
const checkBookingReminders = async () => {
  try {
    const tomorrow = addDays(new Date(), 1);

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: tomorrow,
          lte: addDays(tomorrow, 1),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        contact: true,
        bookingType: true,
        workspace: true,
      },
    });

    for (const booking of upcomingBookings) {
      await triggerAutomation(booking.workspaceId, AutomationTrigger.BOOKING_REMINDER, {
        contactName: `${booking.contact?.firstName} ${booking.contact?.lastName || ''}`.trim(),
        email: booking.contact?.email,
        phone: booking.contact?.phone,
        bookingType: booking.bookingType?.name,
        bookingDate: new Date(booking.startTime).toLocaleDateString(),
        bookingTime: new Date(booking.startTime).toLocaleTimeString(),
      });
    }
  } catch (error) {
    console.error('Error checking booking reminders:', error);
  }
};

// Check for pending forms (send reminder after 24 hours)
const checkPendingForms = async () => {
  try {
    const oneDayAgo = addDays(new Date(), -1);

    const pendingForms = await prisma.formSubmission.findMany({
      where: {
        status: FormSubmissionStatus.PENDING,
        createdAt: {
          lte: oneDayAgo,
        },
      },
      include: {
        form: true,
        contact: true,
        booking: {
          include: {
            workspace: true,
          },
        },
      },
    });

    for (const submission of pendingForms) {
      if (submission.booking) {
        await triggerAutomation(
          submission.booking.workspaceId,
          AutomationTrigger.FORM_PENDING,
          {
            contactName: `${submission.contact.firstName} ${
              submission.contact.lastName || ''
            }`.trim(),
            email: submission.contact.email,
            phone: submission.contact.phone,
            formName: submission.form.name,
          }
        );
      }
    }
  } catch (error) {
    console.error('Error checking pending forms:', error);
  }
};

// Check for overdue forms
const checkOverdueForms = async () => {
  try {
    const now = new Date();

    const overdueForms = await prisma.formSubmission.findMany({
      where: {
        status: FormSubmissionStatus.PENDING,
        dueDate: {
          lt: now,
        },
      },
    });

    // Update status to overdue
    for (const submission of overdueForms) {
      await prisma.formSubmission.update({
        where: { id: submission.id },
        data: { status: FormSubmissionStatus.OVERDUE },
      });
    }
  } catch (error) {
    console.error('Error checking overdue forms:', error);
  }
};

// Check inventory levels
const checkInventoryLevels = async () => {
  try {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        quantity: {
          lte: prisma.inventoryItem.fields.lowStockThreshold,
        },
      },
      include: {
        workspace: true,
      },
    });

    for (const item of lowStockItems) {
      // Create alert if not already created recently
      const recentAlert = await prisma.alert.findFirst({
        where: {
          workspaceId: item.workspaceId,
          type: 'LOW_INVENTORY',
          createdAt: {
            gte: addDays(new Date(), -1),
          },
          message: {
            contains: item.name,
          },
        },
      });

      if (!recentAlert) {
        await triggerAutomation(item.workspaceId, AutomationTrigger.INVENTORY_LOW, {
          itemName: item.name,
          quantity: item.quantity,
          threshold: item.lowStockThreshold,
          linkTo: `/inventory/${item.id}`,
        });
      }
    }
  } catch (error) {
    console.error('Error checking inventory levels:', error);
  }
};
