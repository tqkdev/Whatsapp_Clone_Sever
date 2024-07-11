import { Request, Response } from 'express';
import { addDoc, collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { firestoredatabase } from '../database/Firebase';
import { Conversation, ConversationParticipant } from '../model/ConversationModel';
import { sendErrorResponse, sendSuccessResponse } from '../utils/response ';
import { User } from '../model/UserModel';

export const getAllConversations = async (req: Request, res: Response) => {
    const userId = req.user.id; // Lấy userId từ thông tin đã được xác thực

    try {
        const conversationsRef = collection(firestoredatabase, 'conversations');

        // Tìm tất cả cuộc trò chuyện mà người dùng tham gia
        const conversationQuery = query(conversationsRef, where('participants.userId', '==', userId));

        const querySnapshot = await getDocs(conversationQuery);

        const conversations: Conversation[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Conversation;

            // Lấy thông tin chi tiết của từng người tham gia
            const participantsWithDetails: ConversationParticipant[] = [];
            for (const participant of data.participants) {
                // Ví dụ lấy thông tin từng người dùng từ cơ sở dữ liệu
                const userDetails: User = {
                    id: participant.userId,
                    username: 'example_username',
                    email: 'example_email@example.com',
                    password: 'hashed_password', // Dữ liệu này cần được lấy từ cơ sở dữ liệu
                    // Thêm các thông tin khác nếu cần
                };

                participantsWithDetails.push({
                    userId: participant.userId,
                    userDetails: userDetails,
                });
            }

            const conversation: Conversation = {
                id: doc.id,
                participants: participantsWithDetails,
                messages: data.messages,
                lastMessageTimestamp: data.lastMessageTimestamp,
            };

            conversations.push(conversation);
        });

        sendSuccessResponse(res, conversations, 'Conversations fetched successfully.');
    } catch (error) {
        console.error('Error in getAllConversations:', error);
        sendErrorResponse(res, 'Failed to fetch conversations.');
    }
};
