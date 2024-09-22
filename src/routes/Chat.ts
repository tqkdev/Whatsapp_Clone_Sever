import express from 'express';
import { createChat, getAllChats, getChatGroup, getChatId, searchChats } from '../controllers/ChatController';
import authenticateToken from '../middlewares/authMiddleware';

const router = express.Router();

// lấy tất cả
router.post('/createchat', authenticateToken, createChat);
router.post('/chats', authenticateToken, getAllChats);
router.get('/chatsgroup/:userId', authenticateToken, getChatGroup);
router.get('/chatid/:chatId', authenticateToken, getChatId);
router.get('/chats/search/:userId/:searchValue', authenticateToken, searchChats);

export default router;
