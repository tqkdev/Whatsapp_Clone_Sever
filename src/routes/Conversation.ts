import express from 'express';
// import { getAllConversations, getOrCreateConversation } from '../controllers/ConversationController';
import { getAllConversations } from '../controllers/ConversationController';

import authenticateToken from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/conversation', authenticateToken, getAllConversations);
// router.get('/conversations', authenticateToken, getAllConversations);

export default router;
