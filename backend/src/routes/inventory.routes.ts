import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryQuantity,
  getInventoryStats,
  getInventoryUsage
} from '../controllers/inventory.controller';

const router = Router();
router.use(authenticate);

router.get('/', getAllInventoryItems);
router.post('/', createInventoryItem);
router.get('/stats', getInventoryStats);
router.get('/:id', getInventoryItemById);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);
router.post('/:id/adjust', adjustInventoryQuantity);
router.get('/:id/usage', getInventoryUsage);

export default router;
