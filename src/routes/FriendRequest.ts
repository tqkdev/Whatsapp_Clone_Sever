import express from 'express';
import {
    acceptFriendRequest,
    getAllFriends,
    getFriendRequests,
    sendFriendRequest,
} from '../controllers/FriendRequestController';
import authenticateToken from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/friend-requests', authenticateToken, sendFriendRequest);
router.post('/friend-requests/accept/:requestId', authenticateToken, acceptFriendRequest);
router.get('/friend-requests/:userId', authenticateToken, getFriendRequests);
router.get('/getallfriends/:userId', authenticateToken, getAllFriends);

export default router;
