import { Request, Response } from 'express';
import { firestoredatabase, doc } from '../database/Firebase';
import { Message } from '../model/MessageModel';
import { sendSuccessResponse, sendNotFoundResponse } from '../utils/response ';
import { addDoc, collection, getDoc, updateDoc } from 'firebase/firestore';
import { io } from '../../index'; // Import io từ index.ts
import { upload } from '../middlewares/uploadMiddleware';
// /////
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../database/Firebase';
import { Chat } from '../model/ChatModel';
import { User } from '../model/UserModel';

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { senderId, content, created_at } = req.body;

        if (!chatId) {
            sendNotFoundResponse(res, 'Missing chat ID.');
            return;
        }

        if (!senderId || !content) {
            sendNotFoundResponse(res, 'Missing required fields (senderId, content).');
            return;
        }

        const newMessage: Message = {
            ChatId: chatId,
            senderId,
            content,
            created_at: created_at || new Date(),
        };

        // Lưu tin nhắn mới vào collection "messages"
        const messagesCollectionRef = collection(firestoredatabase, 'messages');
        const docRef = await addDoc(messagesCollectionRef, newMessage);

        // Cập nhật dữ liệu tin nhắn với ID tài liệu
        newMessage.id = docRef.id;

        const chatRef = doc(firestoredatabase, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            sendNotFoundResponse(res, 'Chat not found.');
            return;
        }

        const chatData = chatDoc.data() as Chat;
        const updatedMessages = [...chatData.messages, newMessage];

        await updateDoc(chatRef, {
            messages: updatedMessages,
        });

        // Phát tin nhắn mới đến tất cả client trong cuộc trò chuyện
        io.to(chatId).emit('newMessage', newMessage);

        sendSuccessResponse(res, newMessage, 'Message sent successfully.');
    } catch (error) {
        console.error('Error in sendMessage:', error);
        sendNotFoundResponse(res, 'Failed to send message.');
    }
};

// Helper function to get user info
const getUserInfo = async (userId: string) => {
    const userRef = doc(firestoredatabase, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User not found.');
    }

    const userData = userDoc.data() as User;
    // Return user info without email and password
    const { email, password, friends, friendRequests, created_at, chats, ...userInfo } = userData;
    return {
        id: userId, // Thêm userId vào đối tượng trả về
        userInfo,
    };
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;

        if (!chatId) {
            sendNotFoundResponse(res, 'Missing chat ID.');
            return;
        }

        // Lấy tài liệu chat từ Firestore
        const chatRef = doc(firestoredatabase, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            sendNotFoundResponse(res, 'Chat not found.');
            return;
        }

        const chatData = chatDoc.data() as Chat;
        const messages = chatData.messages || [];

        // Dùng hàm getUserInfo để lấy thông tin người gửi cho từng tin nhắn
        const messagesWithSenderInfo = await Promise.all(
            messages.map(async (message) => {
                try {
                    const senderInfo = await getUserInfo(message.senderId); // Gọi hàm getUserInfo
                    return {
                        ...message,
                        senderInfo: senderInfo, // Thêm thông tin người gửi vào tin nhắn
                    };
                } catch (error) {
                    console.error(`Error fetching user info for senderId ${message.senderId}:`, error);
                    return {
                        ...message,
                        sender: { id: message.senderId, username: 'Unknown' }, // Trường hợp không tìm thấy user
                    };
                }
            }),
        );

        // Trả về kết quả thành công với thông tin người gửi đã được bổ sung
        sendSuccessResponse(res, messagesWithSenderInfo, 'Fetched messages successfully.');

        // Phát sự kiện socket.io để thông báo về tin nhắn
        io.to(chatId).emit('messagesFetched', { chatId, messages: messagesWithSenderInfo });
    } catch (error) {
        console.error('Error in getMessages:', error);
        sendNotFoundResponse(res, 'Failed to fetch messages.');
    }
};
// Helper function to get user info
// const getMessageInfo = async (messageId: string) => {
//     const messageRef = doc(firestoredatabase, 'messages', messageId);
//     const messageDoc = await getDoc(messageRef);

//     if (!messageDoc.exists()) {
//         throw new Error('User not found.');
//     }

//     const messageData = messageDoc.data() as Message;
//     // const {, ...userInfo } = messageData;
//     return {
//         messageId: messageId, // Thêm userId vào đối tượng trả về
//         messageData,
//     };
// };

// export const getMessages = async (req: Request, res: Response) => {
//     try {
//         const { chatId } = req.params;

//         if (!chatId) {
//             sendNotFoundResponse(res, 'Missing chat ID.');
//             return;
//         }

//         // Lấy tài liệu chat từ Firestore
//         const chatRef = doc(firestoredatabase, 'chats', chatId);
//         const chatDoc = await getDoc(chatRef);

//         if (!chatDoc.exists()) {
//             sendNotFoundResponse(res, 'Chat not found.');
//             return;
//         }

//         const chatData = chatDoc.data() as Chat;
//         const messagesId = chatData.messages || [];

//         if (messagesId.length === 0) {
//             sendSuccessResponse(res, [], 'No message.');
//             return;
//         }

//         // Lấy thông tin của các bạn bè sử dụng hàm getUserInfo
//         const messageInfos = [];
//         for (const messageId of messagesId) {
//             try {
//                 // Lấy thông tin message
//                 const messageInfo = await getMessageInfo(messageId);
//                 try {
//                     // Lấy thông tin của sender
//                     const senderInfo = await getUserInfo(messageInfo.messageData.senderId);
//                     // Kết hợp thông tin của message với thông tin của sender
//                     const messageWithSenderInfo = {
//                         ...messageInfo,
//                         senderInfo, // Thêm thông tin của người gửi vào message
//                     };
//                     messageInfos.push(messageWithSenderInfo);
//                 } catch (error) {
//                     console.error(`Error fetching sender with ID ${messageInfo.messageData.senderId}:`, error);
//                 }
//             } catch (error) {
//                 console.error(`Error fetching message with ID ${messageId}:`, error);
//             }
//         }

//         // Trả về kết quả thành công với thông tin người gửi đã được bổ sung
//         sendSuccessResponse(res, messageInfos, 'Fetched messages successfully.');

//         // Phát sự kiện socket.io để thông báo về tin nhắn
//         io.to(chatId).emit('messagesFetched', { chatId, messages: messageInfos });
//     } catch (error) {
//         console.error('Error in getMessages:', error);
//         sendNotFoundResponse(res, 'Failed to fetch messages.');
//     }
// };

// Gửi tin nhắn với hình ảnh
export const sendMessageWithImage = [
    upload.single('image'), // Xử lý file upload từ client
    async (req: Request, res: Response) => {
        try {
            const { chatId } = req.params;
            const { senderId, content } = req.body;
            const file = req.file;

            if (!senderId) {
                return res.status(400).json({ message: 'Missing senderId.' });
            }

            if (!file && !content) {
                return res.status(400).json({ message: 'You must send either a message or an image file.' });
            }

            let imageUrl = null;

            // Nếu có file được tải lên, tải file lên Firebase Storage
            if (file) {
                const fileName = `${uuidv4()}_${file.originalname}`;
                const storageRef = ref(storage, `messages/${chatId}/${fileName}`);

                // Upload file lên Firebase Storage
                await uploadBytes(storageRef, file.buffer);

                // Lấy URL của ảnh vừa tải lên
                imageUrl = await getDownloadURL(storageRef);
            }

            // Tạo tin nhắn mới
            const newMessage: Message = {
                ChatId: chatId,
                senderId,
                content: content || null, // Nội dung text nếu có
                imageUrl: imageUrl || null, // URL ảnh nếu có
                created_at: new Date(),
            };

            // Lưu tin nhắn mới vào Firestore
            const messagesCollectionRef = collection(firestoredatabase, 'messages');
            const docRef = await addDoc(messagesCollectionRef, newMessage);

            // Cập nhật dữ liệu tin nhắn với ID tài liệu
            newMessage.id = docRef.id;

            const chatRef = doc(firestoredatabase, 'chats', chatId);
            const chatDoc = await getDoc(chatRef);

            if (!chatDoc.exists()) {
                sendNotFoundResponse(res, 'Chat not found.');
                return;
            }

            const chatData = chatDoc.data() as Chat;
            const updatedMessages = [...chatData.messages, newMessage];

            await updateDoc(chatRef, {
                messages: updatedMessages,
            });

            // Phát tin nhắn mới đến tất cả client trong cuộc trò chuyện
            io.to(chatId).emit('newMessage', newMessage);

            sendSuccessResponse(res, newMessage, 'Message sent successfully.');
        } catch (error) {
            console.error('Error in sendMessageWithImage:', error);
            sendNotFoundResponse(res, 'Failed to send message.');
        }
    },
];

// export const sendMessageWithImage = [
//     upload.single('image'), // Xử lý file upload từ client
//     async (req: Request, res: Response) => {
//         try {
//             const { chatId } = req.params;
//             const { senderId, content } = req.body;
//             const file = req.file;

//             if (!senderId) {
//                 return res.status(400).json({ message: 'Missing senderId.' });
//             }

//             if (!file && !content) {
//                 return res.status(400).json({ message: 'You must send either a message or an image file.' });
//             }

//             let imageUrl = null;

//             // Nếu có file được tải lên, tải file lên Firebase Storage
//             if (file) {
//                 const fileName = `${uuidv4()}_${file.originalname}`;
//                 const storageRef = ref(storage, `messages/${chatId}/${fileName}`);

//                 // Upload file lên Firebase Storage
//                 await uploadBytes(storageRef, file.buffer);

//                 // Lấy URL của ảnh vừa tải lên
//                 imageUrl = await getDownloadURL(storageRef);
//             }

//             // Tạo tin nhắn mới
//             const newMessage: Message = {
//                 ChatId: chatId,
//                 senderId,
//                 content: content || null, // Nội dung text nếu có
//                 imageUrl: imageUrl || null, // URL ảnh nếu có
//                 created_at: new Date(),
//             };

//             // Lưu tin nhắn mới vào Firestore
//             const messagesCollectionRef = collection(firestoredatabase, 'messages');
//             const docRef = await addDoc(messagesCollectionRef, newMessage);

//             // Cập nhật dữ liệu tin nhắn với ID tài liệu
//             newMessage.id = docRef.id;

//             const chatRef = doc(firestoredatabase, 'chats', chatId);
//             const chatDoc = await getDoc(chatRef);

//             if (!chatDoc.exists()) {
//                 sendNotFoundResponse(res, 'Chat not found.');
//                 return;
//             }

//             const chatData = chatDoc.data() as Chat;
//             const updatedMessages = [...chatData.messages, newMessage.id];

//             await updateDoc(chatRef, {
//                 messages: updatedMessages,
//             });

//             // Phát tin nhắn mới đến tất cả client trong cuộc trò chuyện
//             io.to(chatId).emit('newMessage', newMessage);

//             sendSuccessResponse(res, newMessage, 'Message sent successfully.');
//         } catch (error) {
//             console.error('Error in sendMessageWithImage:', error);
//             sendNotFoundResponse(res, 'Failed to send message.');
//         }
//     },
// ];
