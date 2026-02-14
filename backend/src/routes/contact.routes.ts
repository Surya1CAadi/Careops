import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  bulkImportContacts,
  exportContacts
} from '../controllers/contact.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Contact CRUD
router.get('/', getAllContacts)
router.post('/', createContact)
router.get('/export', exportContacts)
router.post('/import', bulkImportContacts)
router.get('/:id', getContactById)
router.put('/:id', updateContact)
router.delete('/:id', deleteContact)

export default router
