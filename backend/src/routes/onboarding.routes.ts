import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  updateWorkspaceDetails,
  setupBusinessHours,
  configureServices,
  setupNotifications,
  setupAutomations,
  inviteTeamMembers,
  setupIntegrations,
  completeOnboarding,
  getOnboardingStatus
} from '../controllers/onboarding.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get current onboarding status
router.get('/status', getOnboardingStatus)

// Step 1: Workspace details
router.post('/workspace-details', updateWorkspaceDetails)

// Step 2: Business hours
router.post('/business-hours', setupBusinessHours)

// Step 3: Services/Products
router.post('/services', configureServices)

// Step 4: Notification preferences
router.post('/notifications', setupNotifications)

// Step 5: Automation rules
router.post('/automations', setupAutomations)

// Step 6: Team invites
router.post('/team-invites', inviteTeamMembers)

// Step 7: Integrations
router.post('/integrations', setupIntegrations)

// Step 8: Complete onboarding
router.post('/complete', completeOnboarding)

export default router
