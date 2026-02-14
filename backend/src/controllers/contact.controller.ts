import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'

const prisma = new PrismaClient()

export const getAllContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { search, status, tag } = req.query

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

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (tag) {
      where.tags = {
        has: tag as string
      }
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    res.json({
      success: true,
      data: contacts,
      total: contacts.length
    })
  } catch (error) {
    console.error('Get all contacts error:', error)
    res.status(500).json({ error: 'Failed to fetch contacts' })
  }
}

export const getContactById = async (req: AuthRequest, res: Response) => {
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

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' }
        },
        formSubmissions: {
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    res.json({
      success: true,
      data: contact
    })
  } catch (error) {
    console.error('Get contact by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch contact' })
  }
}

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      notes,
      tags,
      status
    } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if contact with email already exists
    if (email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email,
          workspaceId: user.workspace.id
        }
      })

      if (existingContact) {
        return res.status(400).json({ error: 'Contact with this email already exists' })
      }
    }

    const contact = await prisma.contact.create({
      data: {
        workspaceId: user.workspace.id,
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes,
        tags: tags || [],
        status: status || 'ACTIVE'
      }
    })

    res.status(201).json({
      success: true,
      data: contact
    })
  } catch (error) {
    console.error('Create contact error:', error)
    res.status(500).json({ error: 'Failed to create contact' })
  }
}

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      notes,
      tags,
      status
    } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if contact exists and belongs to workspace
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    // Check if email is being changed and if it conflicts
    if (email && email !== existingContact.email) {
      const emailConflict = await prisma.contact.findFirst({
        where: {
          email,
          workspaceId: user.workspace.id,
          id: { not: id }
        }
      })

      if (emailConflict) {
        return res.status(400).json({ error: 'Another contact with this email already exists' })
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes,
        tags,
        status
      }
    })

    res.json({
      success: true,
      data: contact
    })
  } catch (error) {
    console.error('Update contact error:', error)
    res.status(500).json({ error: 'Failed to update contact' })
  }
}

export const deleteContact = async (req: AuthRequest, res: Response) => {
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

    // Check if contact exists and belongs to workspace
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    await prisma.contact.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Delete contact error:', error)
    res.status(500).json({ error: 'Failed to delete contact' })
  }
}

export const bulkImportContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { contacts } = req.body

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Invalid contacts data' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const contactData of contacts) {
      try {
        // Skip if email already exists
        if (contactData.email) {
          const existing = await prisma.contact.findFirst({
            where: {
              email: contactData.email,
              workspaceId: user.workspace.id
            }
          })

          if (existing) {
            results.skipped++
            continue
          }
        }

        await prisma.contact.create({
          data: {
            workspaceId: user.workspace.id,
            firstName: contactData.firstName || '',
            lastName: contactData.lastName || '',
            email: contactData.email,
            phone: contactData.phone,
            address: contactData.address,
            city: contactData.city,
            state: contactData.state,
            zipCode: contactData.zipCode,
            notes: contactData.notes,
            tags: contactData.tags || [],
            status: 'ACTIVE'
          }
        })

        results.imported++
      } catch (error) {
        results.errors.push(`Failed to import contact: ${contactData.email || 'unknown'}`)
      }
    }

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Bulk import contacts error:', error)
    res.status(500).json({ error: 'Failed to import contacts' })
  }
}

export const exportContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId: user.workspace.id
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        notes: true,
        tags: true,
        status: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      data: contacts
    })
  } catch (error) {
    console.error('Export contacts error:', error)
    res.status(500).json({ error: 'Failed to export contacts' })
  }
}
