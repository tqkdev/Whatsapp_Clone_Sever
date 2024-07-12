import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/MessageController';
import authenticateToken from '../middlewares/authMiddleware';

const router = Router();

router.get('/messages/:conversationId', authenticateToken, getMessages);
router.post('/messages/:conversationId', authenticateToken, sendMessage);

export default router;
