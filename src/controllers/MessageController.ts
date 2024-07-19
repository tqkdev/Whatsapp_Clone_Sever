import { Request, Response } from 'express';
import { firestoredatabase, doc } from '../database/Firebase';
import { Message } from '../model/MessageModel';
import { Conversation } from '../model/ConversationModel';
import { sendSuccessResponse, sendNotFoundResponse } from '../utils/response ';
import { addDoc, collection, getDoc, updateDoc } from 'firebase/firestore';
import { io } from '../../index'; // Import io từ index.ts

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { senderId, content, created_at } = req.body;

        console.log(created_at);

        if (!conversationId) {
            sendNotFoundResponse(res, 'Missing conversation ID.');
            return;
        }

        if (!senderId || !content) {
            sendNotFoundResponse(res, 'Missing required fields (senderId, content).');
            return;
        }

        const newMessage: Message = {
            ConversationId: conversationId,
            senderId,
            content,
            created_at: created_at,
        };

        // Lưu tin nhắn mới vào collection "messages"
        const messagesCollectionRef = collection(firestoredatabase, 'messages');
        const docRef = await addDoc(messagesCollectionRef, newMessage);

        // Cập nhật dữ liệu tin nhắn với ID tài liệu
        newMessage.id = docRef.id;

        const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);

        if (!conversationDoc.exists()) {
            sendNotFoundResponse(res, 'Conversation not found.');
            return;
        }

        const conversationData = conversationDoc.data() as Conversation;
        const updatedMessages = [...conversationData.messages, newMessage];

        await updateDoc(conversationRef, {
            messages: updatedMessages,
        });

        io.to(conversationId).emit('newMessage', newMessage);

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
