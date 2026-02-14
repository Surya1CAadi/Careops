import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'

const prisma = new PrismaClient()

// Get all forms for workspace
export const getAllForms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { type, isActive } = req.query

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const where: any = {
      workspaceId: user.workspace.id
    }

    if (type) {
      where.type = type
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const forms = await prisma.form.findMany({
      where,
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: forms
    })
  } catch (error) {
    console.error('Get forms error:', error)
    res.status(500).json({ error: 'Failed to fetch forms' })
  }
}

// Get single form by ID
export const getFormById = async (req: AuthRequest, res: Response) => {
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

    const form = await prisma.form.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!form) {
      return res.status(404).json({ error: 'Form not found' })
    }

    res.json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Get form error:', error)
    res.status(500).json({ error: 'Failed to fetch form' })
  }
}

// Create new form
export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, description, type, fields, isActive } = req.body

    if (!name || !type || !fields) {
      return res.status(400).json({ 
        error: 'Name, type, and fields are required' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Validate fields structure
    if (!Array.isArray(fields)) {
      return res.status(400).json({ error: 'Fields must be an array' })
    }

    const form = await prisma.form.create({
      data: {
        workspaceId: user.workspace.id,
        name,
        description,
        type,
        fields,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Create form error:', error)
    res.status(500).json({ error: 'Failed to create form' })
  }
}

// Update form
export const updateForm = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { name, description, type, fields, isActive } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if form exists and belongs to workspace
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' })
    }

    // Validate fields if provided
    if (fields && !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Fields must be an array' })
    }

    const form = await prisma.form.update({
      where: { id },
      data: {
        name,
        description,
        type,
        fields,
        isActive
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Update form error:', error)
    res.status(500).json({ error: 'Failed to update form' })
  }
}

// Delete form
export const deleteForm = async (req: AuthRequest, res: Response) => {
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

    // Check if form exists and belongs to workspace
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' })
    }

    await prisma.form.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Form deleted successfully'
    })
  } catch (error) {
    console.error('Delete form error:', error)
    res.status(500).json({ error: 'Failed to delete form' })
  }
}

// Get form statistics
export const getFormStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const [
      totalForms,
      activeForms,
      totalSubmissions,
      pendingSubmissions,
      completedSubmissions
    ] = await Promise.all([
      prisma.form.count({
        where: { workspaceId: user.workspace.id }
      }),
      prisma.form.count({
        where: { 
          workspaceId: user.workspace.id,
          isActive: true
        }
      }),
      prisma.formSubmission.count({
        where: {
          form: {
            workspaceId: user.workspace.id
          }
        }
      }),
      prisma.formSubmission.count({
        where: {
          form: {
            workspaceId: user.workspace.id
          },
          status: 'PENDING'
        }
      }),
      prisma.formSubmission.count({
        where: {
          form: {
            workspaceId: user.workspace.id
          },
          status: 'COMPLETED'
        }
      })
    ])

    res.json({
      success: true,
      data: {
        totalForms,
        activeForms,
        inactiveForms: totalForms - activeForms,
        totalSubmissions,
        pendingSubmissions,
        completedSubmissions
      }
    })
  } catch (error) {
    console.error('Get form stats error:', error)
    res.status(500).json({ error: 'Failed to fetch form statistics' })
  }
}

// Get form submissions
export const getFormSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { status } = req.query

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if form exists and belongs to workspace
    const form = await prisma.form.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!form) {
      return res.status(404).json({ error: 'Form not found' })
    }

    const where: any = {
      formId: id
    }

    if (status) {
      where.status = status
    }

    const submissions = await prisma.formSubmission.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        booking: {
          select: {
            id: true,
            title: true,
            startTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: submissions
    })
  } catch (error) {
    console.error('Get form submissions error:', error)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
}

// Submit form (public endpoint - no auth required)
export const submitForm = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const { data: submissionData, contactId, bookingId } = req.body

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' })
    }

    // Check if form exists and is active
    const form = await prisma.form.findUnique({
      where: { id }
    })

    if (!form) {
      return res.status(404).json({ error: 'Form not found' })
    }

    if (!form.isActive) {
      return res.status(400).json({ error: 'Form is not active' })
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    })

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        contactId,
        bookingId,
        data: submissionData,
        status: 'COMPLETED',
        submittedAt: new Date()
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Form submitted successfully'
    })
  } catch (error) {
    console.error('Submit form error:', error)
    res.status(500).json({ error: 'Failed to submit form' })
  }
}

// Get public form (no auth required)
export const getPublicForm = async (req: any, res: Response) => {
  try {
    const { id } = req.params

    const form = await prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        fields: true,
        isActive: true
      }
    })

    if (!form) {
      return res.status(404).json({ error: 'Form not found' })
    }

    if (!form.isActive) {
      return res.status(400).json({ error: 'Form is not active' })
    }

    res.json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Get public form error:', error)
    res.status(500).json({ error: 'Failed to fetch form' })
  }
}
