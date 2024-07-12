import { Router } from 'express';
import { getAllUsers, getUserById, login, logout, register } from '../controllers/UserController';
import authenticateToken from '../middlewares/authMiddleware';

const router = Router();

router.get('/users', getAllUsers);
router.get('/user/:userId', authenticateToken, getUserById);
router.post('/user', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);

export default router;
