import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    login,
    logout,
    register,
    SearchFriends,
    SearchGroups,
    searchUser,
    updateUserProfile,
    uploadAvatar,
} from '../controllers/UserController';
import authenticateToken from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.get('/users', getAllUsers);
router.get('/user/:userId', authenticateToken, getUserById);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/searchuser/:email', authenticateToken, searchUser);

// /////
router.put('/user/profile/:userId', authenticateToken, updateUserProfile);
router.put('/users/avatar/:userId', authenticateToken, upload.single('avatar'), uploadAvatar);
router.get('/searchfriends/:userId/:searchValue', authenticateToken, SearchFriends);
router.get('/searchgroups/:userId/:searchValue', authenticateToken, SearchGroups);

export default router;
