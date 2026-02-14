import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'

const prisma = new PrismaClient()

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { status, startDate, endDate, contactId } = req.query

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Build filter conditions
    const where: any = {
      workspaceId: user.workspace.id
    }

    if (status) {
      where.status = status
    }

    if (contactId) {
      where.contactId = contactId
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string)
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        startTime: 'asc'
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: bookings,
      total: bookings.length
    })
  } catch (error) {
    console.error('Get all bookings error:', error)
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
}

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      },
      include: {
        contact: true
      }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    res.json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Get booking by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch booking' })
  }
}

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const {
      contactId,
      title,
      description,
      startTime,
      endTime,
      location,
      notes,
      status
    } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Validate contact belongs to workspace
    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          workspaceId: user.workspace.id
        }
      })

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' })
      }
    }

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        workspaceId: user.workspace.id,
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          }
        ]
      }
    })

    if (overlapping) {
      return res.status(400).json({ 
        error: 'Time slot already booked',
        conflictingBooking: overlapping
      })
    }

    const booking = await prisma.booking.create({
      data: {
        workspaceId: user.workspace.id,
        contactId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        notes,
        status: status || 'PENDING'
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
}

export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const {
      contactId,
      title,
      description,
      startTime,
      endTime,
      location,
      notes,
      status
    } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if booking exists and belongs to workspace
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Check for overlapping bookings if time is changed
    if (startTime || endTime) {
      const newStartTime = startTime ? new Date(startTime) : existingBooking.startTime
      const newEndTime = endTime ? new Date(endTime) : existingBooking.endTime

      const overlapping = await prisma.booking.findFirst({
        where: {
          workspaceId: user.workspace.id,
          id: { not: id },
          status: { not: 'CANCELLED' },
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } }
              ]
            }
          ]
        }
      })

      if (overlapping) {
        return res.status(400).json({ 
          error: 'Time slot already booked',
          conflictingBooking: overlapping
        })
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        contactId,
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        notes,
        status
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Update booking error:', error)
    res.status(500).json({ error: 'Failed to update booking' })
  }
}

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if booking exists and belongs to workspace
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    await prisma.booking.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    })
  } catch (error) {
    console.error('Delete booking error:', error)
    res.status(500).json({ error: 'Failed to delete booking' })
  }
}

export const getBookingStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [total, pending, confirmed, completed, cancelled, thisMonth] = await Promise.all([
      prisma.booking.count({
        where: { workspaceId: user.workspace.id }
      }),
      prisma.booking.count({
        where: { workspaceId: user.workspace.id, status: 'PENDING' }
      }),
      prisma.booking.count({
        where: { workspaceId: user.workspace.id, status: 'CONFIRMED' }
      }),
      prisma.booking.count({
        where: { workspaceId: user.workspace.id, status: 'COMPLETED' }
      }),
      prisma.booking.count({
        where: { workspaceId: user.workspace.id, status: 'CANCELLED' }
      }),
      prisma.booking.count({
        where: {
          workspaceId: user.workspace.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
    ])

    res.json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        thisMonth
      }
    })
  } catch (error) {
    console.error('Get booking stats error:', error)
    res.status(500).json({ error: 'Failed to fetch booking stats' })
  }
}
