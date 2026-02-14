import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'

const prisma = new PrismaClient()

export const updateWorkspaceDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { businessName, industry, teamSize, timezone } = req.body

    // Get user's workspace
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Update workspace
    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        name: businessName,
        timezone,
        onboardingStep: 1
      }
    })

    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Update workspace details error:', error)
    res.status(500).json({ error: 'Failed to update workspace details' })
  }
}

export const setupBusinessHours = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { businessHours } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 2
      }
    })

    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Setup business hours error:', error)
    res.status(500).json({ error: 'Failed to setup business hours' })
  }
}

export const configureServices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { services } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Store services configuration for later (can be used to create booking types or inventory)
    // For now, just complete this onboarding step
    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 3
      }
    })

    res.json({ success: true, data: { workspace, services } })
  } catch (error) {
    console.error('Configure services error:', error)
    res.status(500).json({ error: 'Failed to configure services' })
  }
}

export const setupNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { emailNotifications, smsNotifications } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 4
      }
    })

    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Setup notifications error:', error)
    res.status(500).json({ error: 'Failed to setup notifications' })
  }
}

export const setupAutomations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { automations } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Create automation rules
    const automationRules = await Promise.all(
      automations.map((automation: any) =>
        prisma.automation.create({
          data: {
            workspaceId: user.workspace.id,
            name: automation.name,
            trigger: automation.trigger,
            action: automation.action || 'SEND_EMAIL',
            config: automation.actions || {},
            isActive: automation.enabled || true
          }
        })
      )
    )

    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 5
      }
    })

    res.json({ success: true, data: { workspace, automations: automationRules } })
  } catch (error) {
    console.error('Setup automations error:', error)
    res.status(500).json({ error: 'Failed to setup automations' })
  }
}

export const inviteTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { invites } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Store invites (actual invitation emails can be sent later)
    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 6
      }
    })

    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Invite team members error:', error)
    res.status(500).json({ error: 'Failed to invite team members' })
  }
}

export const setupIntegrations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { integrations } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 7
      }
    })

    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Setup integrations error:', error)
    res.status(500).json({ error: 'Failed to setup integrations' })
  }
}

export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const workspace = await prisma.workspace.update({
      where: { id: user.workspace.id },
      data: {
        onboardingStep: 8,
        isActive: true
      }
    })

    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    res.status(500).json({ error: 'Failed to complete onboarding' })
  }
}

export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const currentStep = user.workspace.onboardingStep || 0
    const isCompleted = currentStep >= 8

    res.json({
      success: true,
      data: {
        currentStep,
        isCompleted,
        workspace: user.workspace
      }
    })
  } catch (error) {
    console.error('Get onboarding status error:', error)
    res.status(500).json({ error: 'Failed to get onboarding status' })
  }
}
