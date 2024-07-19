import express from 'express';
import { getAllConversations, getOrCreateConversation } from '../controllers/ConversationController';

import authenticateToken from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/conversation', authenticateToken, getOrCreateConversation);
router.post('/conversations', authenticateToken, getAllConversations);

export default router;
