import { Request, Response } from 'express';
import { firestoredatabase, doc } from '../database/Firebase';
import { Message } from '../model/MessageModel';
import { Conversation } from '../model/ConversationModel';
import { sendSuccessResponse, sendNotFoundResponse } from '../utils/response ';
import { getDoc, updateDoc } from 'firebase/firestore';
import { io } from '../../index'; // Import io từ index.ts

// export const getMessages = async (req: Request, res: Response) => {
//     try {
//         const { conversationId } = req.params;

//         if (!conversationId) {
//             sendNotFoundResponse(res, 'Missing conversation ID.');
//             return;
//         }

//         // Lấy tham chiếu đến cuộc trò chuyện
//         const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
//         const conversationDoc = await getDoc(conversationRef);

//         if (!conversationDoc.exists()) {
//             sendNotFoundResponse(res, 'Conversation not found.');
//             return;
//         }

//         const conversationData = conversationDoc.data() as Conversation;
//         const messages: Message[] = conversationData.messages;

//         sendSuccessResponse(res, messages, 'Fetched messages successfully.');
//     } catch (error) {
//         console.error('Error in getMessages:', error);
//         sendNotFoundResponse(res, 'Failed to fetch messages.');
//     }
// };

// export const sendMessage = async (req: Request, res: Response) => {
//     try {
//         const { conversationId } = req.params;
//         const { senderId, content } = req.body;

//         if (!conversationId) {
//             sendNotFoundResponse(res, 'Missing conversation ID.');
//             return;
//         }

//         // Kiểm tra nếu các trường bắt buộc thiếu
//         if (!senderId || !content) {
//             sendNotFoundResponse(res, 'Missing required fields (senderId, content).');
//             return;
//         }

//         // Tạo tin nhắn mới
//         const newMessage: Message = {
//             ConversationId: conversationId,
//             senderId,
//             content,
//             created_at: new Date(),
//         };

//         // Lấy tham chiếu đến cuộc trò chuyện
//         const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
//         const conversationDoc = await getDoc(conversationRef);

//         if (!conversationDoc.exists()) {
//             sendNotFoundResponse(res, 'Conversation not found.');
//             return;
//         }

//         // Lấy dữ liệu của cuộc trò chuyện và cập nhật tin nhắn mới vào messages
//         const conversationData = conversationDoc.data() as Conversation;
//         const updatedMessages = [...conversationData.messages, newMessage];

//         // Cập nhật dữ liệu cuộc trò chuyện trong Firestore
//         await updateDoc(conversationRef, {
//             messages: updatedMessages,
//             created_at: new Date(),
//         });

//         // Gửi phản hồi thành công
//         sendSuccessResponse(res, newMessage, 'Message sent successfully.');
//     } catch (error) {
//         console.error('Error in sendMessage:', error);
//         sendNotFoundResponse(res, 'Failed to send message.');
//     }
// };

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { senderId, content } = req.body;

        if (!conversationId) {
            sendNotFoundResponse(res, 'Missing conversation ID.');
            return;
        }

        // Kiểm tra nếu các trường bắt buộc thiếu
        if (!senderId || !content) {
            sendNotFoundResponse(res, 'Missing required fields (senderId, content).');
            return;
        }

        // Tạo tin nhắn mới
        const newMessage: Message = {
            ConversationId: conversationId,
            senderId,
            content,
            created_at: new Date(),
        };

        // Lấy tham chiếu đến cuộc trò chuyện
        const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);

        if (!conversationDoc.exists()) {
            sendNotFoundResponse(res, 'Conversation not found.');
            return;
        }

        // Lấy dữ liệu của cuộc trò chuyện và cập nhật tin nhắn mới vào messages
        const conversationData = conversationDoc.data() as Conversation;
        const updatedMessages = [...conversationData.messages, newMessage];

        // Cập nhật dữ liệu cuộc trò chuyện trong Firestore
        await updateDoc(conversationRef, {
            messages: updatedMessages,
            created_at: new Date(),
        });

        // Phát tín hiệu qua Socket.IO
        io.to(conversationId).emit('newMessage', newMessage);

        // Gửi phản hồi thành công
        sendSuccessResponse(res, newMessage, 'Message sent successfully.');
    } catch (error) {
        console.error('Error in sendMessage:', error);
        sendNotFoundResponse(res, 'Failed to send message.');
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            sendNotFoundResponse(res, 'Missing conversation ID.');
            return;
        }

        // Lấy tham chiếu đến cuộc trò chuyện
        const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);

        if (!conversationDoc.exists()) {
            sendNotFoundResponse(res, 'Conversation not found.');
            return;
        }

        const conversationData = conversationDoc.data() as Conversation;
        const messages: Message[] = conversationData.messages;

        // Lắng nghe sự kiện joinRoom để tham gia vào room tương ứng với conversationId
        io.on('connection', (socket) => {
            socket.join(conversationId);
        });

        sendSuccessResponse(res, messages, 'Fetched messages successfully.');
    } catch (error) {
        console.error('Error in getMessages:', error);
        sendNotFoundResponse(res, 'Failed to fetch messages.');
    }
};
