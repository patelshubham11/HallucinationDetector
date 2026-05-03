import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { askAi, getHistory } from '../controllers/chatController.js';

const router = express.Router();

router.post('/ask', protect, askAi);
router.get('/history', protect, getHistory);

export default router;
