import { Request, Response } from 'express';
import { addDoc, collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { firestoredatabase } from '../database/Firebase';
import { Conversation } from '../model/ConversationModel';
import { sendErrorResponse, sendNotFoundResponse, sendSuccessResponse } from '../utils/response ';
import { User } from '../model/UserModel';

// Hàm để lấy hoặc tạo Conversation giữa hai người dùng

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { user1Id, user2Id, username1, username2 } = req.body;

        if (!user1Id || !user2Id) {
            sendNotFoundResponse(res, 'Missing user IDs.');
            return;
        }

        // Tạo một mảng chứa user ids để sử dụng trong truy vấn
        const userIds = [user1Id, user2Id].sort(); // Sắp xếp để đảm bảo thứ tự không đổi
        const conversationsRef = collection(firestoredatabase, 'conversations');
        const querySnapshot = await getDocs(conversationsRef);

        let foundConversation: Conversation | undefined;

        querySnapshot.forEach((doc) => {
            try {
                const conversation = doc.data() as Conversation;
                // Kiểm tra xem Conversation có chứa cả hai user không
                const participantIds = conversation.participants.map((participant) => participant.id).sort();
                if (userIds.toString() === participantIds.toString()) {
                    foundConversation = {
                        id: doc.id,
                        participants: conversation.participants,
                        messages: conversation.messages,
                        lastMessageTimestamp: conversation.lastMessageTimestamp,
                    };
                }
            } catch (error) {
                console.error('Error in forEach:', error);
            }
        });

        // Nếu tìm thấy Conversation
        if (foundConversation) {
            sendSuccessResponse(res, foundConversation, 'Found existing conversation.');
        } else {
            // Nếu không tìm thấy Conversation, tạo mới
            const newConversation: Conversation = {
                participants: [
                    { id: user1Id, username: username1 || 'Unknown User' },
                    { id: user2Id, username: username2 || 'Unknown User' },
                ],
                messages: [],
            };

            const newConversationRef = await addDoc(conversationsRef, newConversation);
            sendSuccessResponse(res, { id: newConversationRef.id, ...newConversation }, 'Created new conversation.');
        }
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        sendNotFoundResponse(res, 'Failed to get or create conversation.');
    }
};
export const getAllConversations = async (req: Request, res: Response) => {
    try {
        const conversationsRef = collection(firestoredatabase, 'conversations');
        const querySnapshot = await getDocs(conversationsRef);

        const conversations: Conversation[] = [];

        querySnapshot.forEach((doc) => {
            try {
                const conversation = doc.data() as Conversation;
                conversations.push({
                    id: doc.id,
                    participants: conversation.participants,
                    messages: conversation.messages,
                    lastMessageTimestamp: conversation.lastMessageTimestamp,
                });
            } catch (error) {
                console.error('Error in forEach:', error);
            }
        });

        sendSuccessResponse(res, conversations, 'Fetched all conversations.');
    } catch (error) {
        console.error('Error in getAllConversations:', error);
        sendNotFoundResponse(res, 'Failed to fetch conversations.');
    }
};
