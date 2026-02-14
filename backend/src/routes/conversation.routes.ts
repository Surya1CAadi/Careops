import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Conversation/Inbox routes - to be implemented
router.get('/', async (req, res) => res.json({ success: true, data: [] }));
router.get('/:id/messages', async (req, res) => res.json({ success: true, data: [] }));
router.post('/:id/messages', async (req, res) => res.json({ success: true, data: {} }));

export default router;
