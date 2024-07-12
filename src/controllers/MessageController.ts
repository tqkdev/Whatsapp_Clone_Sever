import { Request, Response } from 'express';
import { firestoredatabase, doc } from '../database/Firebase';
import { Message } from '../model/MessageModel';
import { Conversation } from '../model/ConversationModel';
import { sendSuccessResponse, sendNotFoundResponse } from '../utils/response ';
import { getDoc, updateDoc } from 'firebase/firestore';

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

        sendSuccessResponse(res, messages, 'Fetched messages successfully.');
    } catch (error) {
        console.error('Error in getMessages:', error);
        sendNotFoundResponse(res, 'Failed to fetch messages.');
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { senderId, content, timestamp } = req.body;

        if (!conversationId) {
            sendNotFoundResponse(res, 'Missing conversation ID.');
            return;
        }

        // Kiểm tra nếu các trường bắt buộc thiếu
        if (!senderId || !content || !timestamp) {
            sendNotFoundResponse(res, 'Missing required fields (senderId, content, timestamp).');
            return;
        }

        // Tạo tin nhắn mới
        const newMessage: Message = {
            ConversationId: conversationId,
            senderId,
            content,
            timestamp,
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
            lastMessageTimestamp: timestamp,
        });

        // Gửi phản hồi thành công
        sendSuccessResponse(res, newMessage, 'Message sent successfully.');
    } catch (error) {
        console.error('Error in sendMessage:', error);
        sendNotFoundResponse(res, 'Failed to send message.');
    }
};
