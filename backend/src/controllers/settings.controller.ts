import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Get workspace settings
export const getWorkspaceSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        workspace: {
          include: {
            users: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    res.json({
      success: true,
      data: user.workspace
    })
  } catch (error) {
    console.error('Get workspace settings error:', error)
    res.status(500).json({ error: 'Failed to fetch workspace settings' })
  }
}

// Update workspace settings
export const updateWorkspaceSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, timezone } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Only owners can update workspace settings
    if (user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only workspace owners can update settings' })
    }

    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        name,
        timezone
      }
    })

    res.json({
      success: true,
      data: workspace
    })
  } catch (error) {
    console.error('Update workspace settings error:', error)
    res.status(500).json({ error: 'Failed to update workspace settings' })
  }
}

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ error: 'Failed to fetch user profile' })
  }
}

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { firstName, lastName, email } = req.body

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ error: 'Failed to update user profile' })
  }
}

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

// Get team members
export const getTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const members = await prisma.user.findMany({
      where: { workspaceId: user.workspace.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json({
      success: true,
      data: members
    })
  } catch (error) {
    console.error('Get team members error:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
}

// Invite team member
export const inviteTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { email, firstName, lastName, role } = req.body

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, first name, and last name are required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Only owners can invite team members
    if (user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only workspace owners can invite team members' })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Create temporary password (in production, send email invitation)
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    const newMember = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || 'STAFF',
        workspaceId: user.workspace.id
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      data: newMember,
      message: `Team member invited. Temporary password: ${tempPassword}`
    })
  } catch (error) {
    console.error('Invite team member error:', error)
    res.status(500).json({ error: 'Failed to invite team member' })
  }
}

// Update team member role
export const updateTeamMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { memberId } = req.params
    const { role } = req.body

    if (!role || !['OWNER', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Only owners can update roles
    if (user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only workspace owners can update roles' })
    }

    // Can't change own role
    if (memberId === userId) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }

    // Verify member belongs to same workspace
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        workspaceId: user.workspace.id
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      data: updatedMember
    })
  } catch (error) {
    console.error('Update team member role error:', error)
    res.status(500).json({ error: 'Failed to update team member role' })
  }
}

// Remove team member
export const removeTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { memberId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Only owners can remove team members
    if (user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only workspace owners can remove team members' })
    }

    // Can't remove yourself
    if (memberId === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' })
    }

    // Verify member belongs to same workspace
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        workspaceId: user.workspace.id
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    await prisma.user.delete({
      where: { id: memberId }
    })

    res.json({
      success: true,
      message: 'Team member removed'
    })
  } catch (error) {
    console.error('Remove team member error:', error)
    res.status(500).json({ error: 'Failed to remove team member' })
  }
}
