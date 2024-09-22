import { Request, Response } from 'express';
import { firestoredatabase, collection, doc } from '../database/Firebase';
import { User } from '../model/UserModel';
import { addDoc, deleteDoc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import {
    sendErrorResponse,
    sendNotFoundResponse,
    sendSuccessResponse,
    sendValidationErrorResponse,
} from '../utils/response ';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { RefreshToken } from '../model/RefreshTokenModel';
// ///////
import { storage } from '../database/Firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Chat } from '../model/ChatModel';

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
            const { password, friendRequests, friends, ...userWithoutPassword } = userData;
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
    const { username, email, password, avatarUrl, dateOfBirth, gender } = req.body;

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
            avatarUrl:
                avatarUrl || 'https://res.cloudinary.com/dyoctwffi/image/upload/v1721403257/ORGAVIVE/avt_tpgoie.png',
            dateOfBirth: dateOfBirth || '1/1/1945',
            gender: gender || 'khac',
            created_at: new Date(),
        });

        const newUser = {
            id: newUserRef.id,
            username,
            email,
            avatarUrl,
            dateOfBirth,
            gender,
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
            secure: false, // Nên để là true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false, // Nên để là true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
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
    const { email } = req.params;

    try {
        // Tạo truy vấn để tìm người dùng theo email
        const usersRef = collection(firestoredatabase, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            sendNotFoundResponse(res, 'User not found.');
            return;
        }

        // Giả sử chỉ có một người dùng với email duy nhất
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;
        const userId = userDoc.id; // Lấy ID của tài liệu
        const { password, ...userWithoutPassword } = userData;

        // Thêm userId vào đối tượng người dùng mà không có mật khẩu
        const responseData = { userId, ...userWithoutPassword };

        sendSuccessResponse(res, responseData, 'User fetched successfully.');
    } catch (error) {
        console.error('Error fetching user:', error);
        sendNotFoundResponse(res, 'Failed to fetch user.');
    }
};

// Hàm cập nhật thông tin người dùng
export const updateUserProfile = async (req: Request, res: Response) => {
    const { userId } = req.params; // Lấy userId từ URL params
    const { username, dateOfBirth, gender } = req.body; // Lấy thông tin cần cập nhật từ body của request

    // Kiểm tra đầu vào hợp lệ
    if (!username && !dateOfBirth && !gender) {
        sendValidationErrorResponse(res, [], 'No fields to update.');
        return;
    }

    try {
        // Tham chiếu đến tài liệu người dùng trong Firestore
        const userRef = doc(firestoredatabase, 'users', userId);

        // Tạo đối tượng cập nhật dựa trên các trường có giá trị
        const updatedData: Partial<User> = {};
        if (username) updatedData.username = username;
        if (dateOfBirth) updatedData.dateOfBirth = dateOfBirth;
        if (gender) updatedData.gender = gender;

        // Thực hiện cập nhật tài liệu
        await updateDoc(userRef, updatedData);

        sendSuccessResponse(res, updatedData, 'User profile updated successfully.');
    } catch (error) {
        console.error('Error updating user profile:', error);
        sendNotFoundResponse(res, 'Failed to update user profile.');
    }
};

export const uploadAvatar = async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!req.file) {
        sendNotFoundResponse(res, 'No file uploaded.');
        return;
    }

    try {
        // Tạo tham chiếu tới Firebase Storage cho file ảnh
        const avatarRef = ref(storage, `avatars/${userId}/${req.file.originalname}`);

        // Upload ảnh lên Firebase Storage
        await uploadBytes(avatarRef, req.file.buffer);

        // Lấy URL của ảnh đã tải lên từ Firebase Storage
        const avatarUrl = await getDownloadURL(avatarRef);

        // Cập nhật trường avatarUrl trong Firestore cho người dùng
        const userRef = doc(firestoredatabase, 'users', userId);
        await updateDoc(userRef, { avatarUrl });

        sendSuccessResponse(res, { avatarUrl }, 'Avatar uploaded successfully.');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        sendNotFoundResponse(res, 'Failed to upload avatar.');
    }
};

// Hàm lấy thông tin chi tiết của một người dùng
const getUserInfo = async (userId: string) => {
    const userRef = doc(firestoredatabase, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User not found.');
    }

    const userData = userDoc.data() as User;
    const { email, password, friends, friendRequests, created_at, chats, ...userInfo } = userData;
    return {
        id: userId,
        userInfo,
    };
};

// Hàm SearchFriends
export const SearchFriends = async (req: Request, res: Response) => {
    try {
        const { userId, searchValue } = req.params;

        if (!userId || !searchValue) {
            return sendErrorResponse(res, 'User ID and search value are required.');
        }

        // Lấy thông tin user
        const userRef = doc(firestoredatabase, 'users', userId as string);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return sendErrorResponse(res, 'User not found.');
        }

        const userData = userDoc.data() as User;
        const { friends } = userData;

        if (!friends || friends.length === 0) {
            return sendSuccessResponse(res, [], 'No friends found.');
        }

        // Tìm kiếm bạn bè dựa vào searchValue
        const matchedFriends = [];
        for (const friendId of friends) {
            const friendInfo = await getUserInfo(friendId);
            if (friendInfo.userInfo.username.toLowerCase().includes((searchValue as string).toLowerCase())) {
                matchedFriends.push(friendInfo);
            }
        }

        // Trả kết quả tìm kiếm
        sendSuccessResponse(res, matchedFriends, 'Search results for friends fetched successfully.');
    } catch (error) {
        console.error('Error in SearchFriends:', error);
        sendErrorResponse(res, 'Failed to search friends.');
    }
};

// Hàm SearchGroups
export const SearchGroups = async (req: Request, res: Response) => {
    try {
        const { userId, searchValue } = req.params;

        if (!userId || !searchValue) {
            return sendErrorResponse(res, 'User ID and search value are required.');
        }

        // Lấy thông tin user
        const userRef = doc(firestoredatabase, 'users', userId as string);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return sendErrorResponse(res, 'User not found.');
        }

        const userData = userDoc.data() as User;
        const { chats } = userData;

        if (!chats || chats.length === 0) {
            return sendSuccessResponse(res, [], 'No groups found.');
        }

        // Tìm kiếm trong danh sách chats của user
        const matchedGroups = [];
        for (const chatId of chats) {
            const chatRef = doc(firestoredatabase, 'chats', chatId);
            const chatDoc = await getDoc(chatRef);

            if (chatDoc.exists()) {
                const chatData = chatDoc.data() as Chat;

                // Kiểm tra nếu có `name` hoặc kiểm tra theo `participants` nếu không có `name`
                const isMatch = chatData.name
                    ? chatData.name.toLowerCase().includes((searchValue as string).toLowerCase())
                    : chatData.participants?.some((p) =>
                          p.username.toLowerCase().includes((searchValue as string).toLowerCase()),
                      );

                if (isMatch && chatData.members) {
                    // Lấy chi tiết participants bằng cách sử dụng getUserInfo
                    const detailedMembers = await Promise.all(
                        chatData.members.map(async (member) => {
                            const userInfo = await getUserInfo(member.id); // Gọi hàm getUserInfo để lấy chi tiết user
                            return userInfo;
                        }),
                    );

                    // Thêm participants chi tiết vào chat
                    const { messages, ...data } = chatData;
                    matchedGroups.push({
                        id: chatId,
                        ...data,
                        members: detailedMembers,
                    });
                }
            }
        }

        // Trả kết quả tìm kiếm
        sendSuccessResponse(res, matchedGroups, 'Search results for groups fetched successfully.');
    } catch (error) {
        console.error('Error in SearchGroups:', error);
        sendErrorResponse(res, 'Failed to search groups.');
    }
};
