import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  getFormStats,
  getFormSubmissions,
  submitForm,
  getPublicForm
} from '../controllers/form.controller';

const router = Router();

// Public routes (no authentication required)
router.get('/public/:id', getPublicForm);
router.post('/:id/submit', submitForm);

// Protected routes (authentication required)
router.use(authenticate);

router.get('/', getAllForms);
router.post('/', createForm);
router.get('/stats', getFormStats);
router.get('/:id', getFormById);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);
router.get('/:id/submissions', getFormSubmissions);

export default router;
