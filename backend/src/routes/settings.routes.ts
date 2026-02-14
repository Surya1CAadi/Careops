import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember
} from '../controllers/settings.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Workspace settings routes
router.get('/workspace', getWorkspaceSettings)
router.put('/workspace', updateWorkspaceSettings)

// User profile routes
router.get('/profile', getUserProfile)
router.put('/profile', updateUserProfile)
router.post('/profile/password', changePassword)

// Team management routes
router.get('/team', getTeamMembers)
router.post('/team/invite', inviteTeamMember)
router.put('/team/:memberId/role', updateTeamMemberRole)
router.delete('/team/:memberId', removeTeamMember)

export default router
