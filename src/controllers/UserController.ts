import { Request, Response } from 'express';
import { firestoredatabase, collection, doc } from '../database/Firebase';
import { User } from '../model/UserModel';
import { Conversation } from '../model/ConversationModel';
import { Message } from '../model/MessageModel';
import { addDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { sendNotFoundResponse, sendSuccessResponse, sendValidationErrorResponse } from '../utils/response ';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

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

// Hàm lấy người dùng theo ID và không trả về mật khẩu
export const getUserById = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const userRef = doc(firestoredatabase, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const { password, ...userWithoutPassword } = userDoc.data() as User;
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
        const querySnapshot = await getDocs(query(usersRef, where('username', '==', username)));

        if (!querySnapshot.empty) {
            sendValidationErrorResponse(
                res,
                [{ field: 'username', message: 'Username already exists.' }],
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

// Hàm đăng nhập và không trả về mật khẩu
export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        // Tìm người dùng trong cơ sở dữ liệu
        const usersRef = collection(firestoredatabase, 'users');
        const querySnapshot = await getDocs(query(usersRef, where('username', '==', username)));

        if (querySnapshot.empty) {
            sendNotFoundResponse(res, 'User not found.');
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

        const { password: _, ...userWithoutPassword } = userData;

        sendSuccessResponse(res, { accessToken, refreshToken, user: userWithoutPassword }, 'Login successful.');
    } catch (error) {
        console.error('Error logging in:', error);
        sendNotFoundResponse(res, 'Login failed.');
    }
};

//   export const getConversations = async (req: Request, res: Response) => {
//     try {
//       const conversationsRef = collection(firestoredatabase, 'conversations');
//       const snapshot = await getDocs(conversationsRef);
//       const conversations: Conversation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
//       res.status(200).json(conversations);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   };

//   export const getMessages = async (req: Request, res: Response) => {
//     const { conversationId } = req.params;
//     try {
//       const messagesRef = collection(firestoredatabase, `conversations/${conversationId}/messages`);
//       const snapshot = await getDocs(messagesRef);
//       const messages: Message[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
//       res.status(200).json(messages);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   };

//   export const sendMessage = async (req: Request, res: Response) => {
//     const { conversationId } = req.params;
//     const { senderId, content } = req.body;

//     try {
//       const messagesRef = collection(firestoredatabase, `conversations/${conversationId}/messages`);
//       const newMessage: Omit<Message, 'id'> = {
//         conversationId,
//         senderId,
//         content,
//         timestamp: new Date().toISOString()
//       };
//       const messageDoc = await addDoc(messagesRef, newMessage);

//       // Cập nhật lastMessageTimestamp trong tài liệu conversation
//       const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
//       await updateDoc(conversationRef, {
//         lastMessageTimestamp: newMessage.timestamp
//       });

//       res.status(200).send(`Message sent with ID: ${messageDoc.id}`);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   };

//   export const getOrCreateConversation = async (req: Request, res: Response) => {
//     const { userId1, userId2 } = req.body;

//     try {
//       // Kiểm tra xem cuộc trò chuyện giữa hai người dùng đã tồn tại chưa
//       const conversationsRef = collection(firestoredatabase, 'conversations');
//       const conversationQuery = await getDocs(query(collection(conversationsRef)
//         .where('participants', 'array-contains', userId1)));

//       let conversation: Conversation | null = null;
//       conversationQuery.forEach(doc => {
//         const data = doc.data() as Conversation;
//         if (data.participants.includes(userId2)) {
//           conversation = { id: doc.id, ...data };
//         }
//       });

//       let conversationId: string;

//       if (conversation) {
//         // Cuộc trò chuyện đã tồn tại
//         conversationId = conversation.id;
//       } else {
//         // Tạo cuộc trò chuyện mới
//         const newConversation: Omit<Conversation, 'id'> = {
//           participants: [userId1, userId2],
//           messages: []
//         };
//         const conversationDoc = await addDoc(conversationsRef, newConversation);
//         conversationId = conversationDoc.id;
//       }

//       res.status(200).json({ conversationId });
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   };
