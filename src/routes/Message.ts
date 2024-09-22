import { Router } from 'express';
import { getMessages, sendMessage, sendMessageWithImage } from '../controllers/MessageController';
import authenticateToken from '../middlewares/authMiddleware';

const router = Router();

router.get('/messages/:chatId', authenticateToken, getMessages);
router.post('/messages/:chatId', authenticateToken, sendMessage);
router.post('/messagesImage/:chatId', authenticateToken, sendMessageWithImage);

export default router;
