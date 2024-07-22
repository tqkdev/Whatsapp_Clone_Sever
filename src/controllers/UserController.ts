import { Request, Response } from 'express';
import { firestoredatabase, collection, doc } from '../database/Firebase';
import { User } from '../model/UserModel';
import { addDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { sendNotFoundResponse, sendSuccessResponse, sendValidationErrorResponse } from '../utils/response ';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { RefreshToken } from '../model/RefreshTokenModel';

dotenv.config();

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const usersRef = collection(firestoredatabase, 'users');
        const snapshot = await getDocs(usersRef);
        const users: Partial<User>[] = snapshot.docs.map((doc) => {
            const { password, ...userWithoutPassword } = doc.data() as User;
            return { id: doc.id, ...userWithoutPassword };
        });
        sendSuccessResponse(res, users, 'Users fetched successfully.');
    } catch (error) {
        console.error('Error fetching users:', error);
        sendNotFoundResponse(res, 'Failed to fetch users.');
    }
};

export const getUserById = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const userRef = doc(firestoredatabase, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const { password, ...userWithoutPassword } = userData;
            sendSuccessResponse(res, userWithoutPassword, 'User fetched successfully.');
        } else {
            sendNotFoundResponse(res, 'User not found.');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        sendNotFoundResponse(res, 'Failed to fetch user.');
    }
};
// Hàm sinh mã token JWT access
export const generateAccessToken = (user: { _id: string }): string => {
    return jwt.sign(
        {
            id: user._id,
        },
        process.env.JWT_ACCESS_KEY!,
        {
            expiresIn: '30000s',
        },
    );
};

// Hàm sinh mã token JWT refresh
export const generateRefreshToken = (user: { _id: string }): string => {
    return jwt.sign(
        {
            id: user._id,
        },
        process.env.JWT_REFRESH_KEY!,
        {
            expiresIn: '365d',
        },
    );
};

const SALT_ROUNDS = 10; // Số lượt lặp để tạo salt

export const register = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
        // Kiểm tra xem username đã tồn tại chưa
        const usersRef = collection(firestoredatabase, 'users');
        const querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));

        if (!querySnapshot.empty) {
            sendValidationErrorResponse(
                res,
                [{ field: 'email', message: 'email already exists.' }],
                'Registration failed.',
            );
            return;
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Lưu người dùng vào cơ sở dữ liệu
        const newUserRef = await addDoc(usersRef, {
            username,
            email,
            password: hashedPassword,
            created_at: new Date(),
        });

        const newUser = {
            id: newUserRef.id,
            username,
            email,
        };

        sendSuccessResponse(res, newUser, 'Registration successful.');
    } catch (error) {
        console.error('Error registering user:', error);
        sendNotFoundResponse(res, 'Registration failed.');
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Tìm người dùng trong cơ sở dữ liệu
        const usersRef = collection(firestoredatabase, 'users');
        const querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));

        if (querySnapshot.empty) {
            sendNotFoundResponse(res, 'email not found.');
            return;
        }

        // Lấy thông tin người dùng từ snapshot đầu tiên
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;

        // So sánh mật khẩu đã hash
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            sendValidationErrorResponse(res, [{ field: 'password', message: 'Invalid password.' }], 'Login failed.');
            return;
        }

        // Tạo token access và refresh
        const accessToken = generateAccessToken({ _id: userDoc.id });
        const refreshToken = generateRefreshToken({ _id: userDoc.id });

        // Lưu refresh token vào Firebase
        const refreshTokensRef = collection(firestoredatabase, 'refreshTokens');
        const newRefreshToken: RefreshToken = {
            userId: userDoc.id,
            refreshToken: refreshToken,
            created_at: new Date(),
        };
        await addDoc(refreshTokensRef, newRefreshToken);

        // Đặt token vào cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Nên để là true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'none',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true, // Nên để là true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'none',
        });

        const { password: _, ...userWithoutPassword } = userData;
        sendSuccessResponse(res, { id: userDoc.id, user: userWithoutPassword }, 'Login successful.');
    } catch (error) {
        console.error('Error logging in:', error);
        sendNotFoundResponse(res, 'Login failed.');
    }
};

export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        sendNotFoundResponse(res, 'Refresh token not found.');
        return;
    }

    try {
        // Tìm và xóa refresh token trong cơ sở dữ liệu
        const refreshTokensRef = collection(firestoredatabase, 'refreshTokens');
        const querySnapshot = await getDocs(query(refreshTokensRef, where('refreshToken', '==', refreshToken)));

        if (querySnapshot.empty) {
            sendNotFoundResponse(res, 'Refresh token not found in database.');
            return;
        }

        // Xóa refresh token
        const refreshTokenDoc = querySnapshot.docs[0];
        await deleteDoc(doc(firestoredatabase, 'refreshTokens', refreshTokenDoc.id));

        // Xóa cookie
        res.clearCookie('refreshToken', { path: '/' });
        res.clearCookie('accessToken', { path: '/' });

        sendSuccessResponse(res, {}, 'Logout successful.');
    } catch (error) {
        console.error('Error logging out:', error);
        sendNotFoundResponse(res, 'Logout failed.');
    }
};

export const searchUser = async (req: Request, res: Response) => {
    const { username } = req.query;

    if (!username) {
        sendNotFoundResponse(res, 'Missing username.');
        return;
    }

    try {
        const usersRef = collection(firestoredatabase, 'users');
        const userQuery = query(
            usersRef,
            where('username', '>=', username),
            where('username', '<=', username + '\uf8ff'),
        );
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
            sendNotFoundResponse(res, 'No users found.');
            return;
        }

        const users: Partial<User>[] = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data() as User;
            const { password, ...userWithoutPassword } = userData;
            users.push({ id: doc.id, ...userWithoutPassword });
        });

        sendSuccessResponse(res, users, 'Users found.');
    } catch (error) {
        console.error('Error searching users:', error);
        sendNotFoundResponse(res, 'Failed to search users.');
    }
};
