import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getAllConversations,
  getConversation,
  sendMessage,
  markAsRead,
  archiveConversation,
  unarchiveConversation,
  getInboxStats
} from '../controllers/inbox.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Conversation routes
router.get('/conversations', getAllConversations)
router.get('/conversations/:id', getConversation)
router.post('/conversations/:id/archive', archiveConversation)
router.post('/conversations/:id/unarchive', unarchiveConversation)
router.post('/conversations/:id/read', markAsRead)

// Message routes
router.post('/messages', sendMessage)

// Stats route
router.get('/stats', getInboxStats)

export default router
