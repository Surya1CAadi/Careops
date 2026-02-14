import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
router.use(authenticate);
router.use(authorize(UserRole.OWNER));

// Automation routes - to be implemented
router.get('/', async (req, res) => res.json({ success: true, data: [] }));
router.post('/', async (req, res) => res.json({ success: true, data: {} }));
router.put('/:id', async (req, res) => res.json({ success: true, data: {} }));

export default router;
