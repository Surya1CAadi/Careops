import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'

const prisma = new PrismaClient()

// Get all conversations for workspace
export const getAllConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { status } = req.query

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

    if (status) {
      where.status = status
    }

    const conversations = await prisma.conversation.findMany({
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
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            body: true,
            channel: true,
            direction: true,
            isRead: true,
            sentAt: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    res.json({
      success: true,
      data: conversations
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
}

// Get single conversation with messages
export const getConversation = async (req: AuthRequest, res: Response) => {
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

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            tags: true
          }
        },
        messages: {
          include: {
            sentBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { sentAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    res.json({
      success: true,
      data: conversation
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ error: 'Failed to fetch conversation' })
  }
}

// Send message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { conversationId, body, channel, subject } = req.body

    if (!conversationId || !body || !channel) {
      return res.status(400).json({ 
        error: 'Conversation ID, body, and channel are required' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Verify conversation belongs to workspace
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId: user.workspace.id
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        body,
        channel,
        subject,
        direction: 'OUTBOUND',
        sentById: userId,
        isRead: true
      },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    })

    res.status(201).json({
      success: true,
      data: message
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

// Mark messages as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
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

    // Verify conversation belongs to workspace
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Mark all messages in conversation as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    res.json({
      success: true,
      message: 'Messages marked as read'
    })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
}

// Archive conversation
export const archiveConversation = async (req: AuthRequest, res: Response) => {
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

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    await prisma.conversation.update({
      where: { id },
      data: { status: 'archived' }
    })

    res.json({
      success: true,
      message: 'Conversation archived'
    })
  } catch (error) {
    console.error('Archive conversation error:', error)
    res.status(500).json({ error: 'Failed to archive conversation' })
  }
}

// Unarchive conversation
export const unarchiveConversation = async (req: AuthRequest, res: Response) => {
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

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    await prisma.conversation.update({
      where: { id },
      data: { status: 'active' }
    })

    res.json({
      success: true,
      message: 'Conversation unarchived'
    })
  } catch (error) {
    console.error('Unarchive conversation error:', error)
    res.status(500).json({ error: 'Failed to unarchive conversation' })
  }
}

// Get inbox statistics
export const getInboxStats = async (req: AuthRequest, res: Response) => {
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
      totalConversations,
      activeConversations,
      archivedConversations,
      unreadMessages
    ] = await Promise.all([
      prisma.conversation.count({
        where: { workspaceId: user.workspace.id }
      }),
      prisma.conversation.count({
        where: { 
          workspaceId: user.workspace.id,
          status: 'active'
        }
      }),
      prisma.conversation.count({
        where: { 
          workspaceId: user.workspace.id,
          status: 'archived'
        }
      }),
      prisma.message.count({
        where: {
          conversation: {
            workspaceId: user.workspace.id
          },
          isRead: false,
          direction: 'INBOUND'
        }
      })
    ])

    res.json({
      success: true,
      data: {
        totalConversations,
        activeConversations,
        archivedConversations,
        unreadMessages
      }
    })
  } catch (error) {
    console.error('Get inbox stats error:', error)
    res.status(500).json({ error: 'Failed to fetch inbox statistics' })
  }
}
