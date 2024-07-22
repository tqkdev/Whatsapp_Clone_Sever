import { Request, Response } from 'express';
import { addDoc, collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { firestoredatabase } from '../database/Firebase';
import { Conversation } from '../model/ConversationModel';
import { sendNotFoundResponse, sendSuccessResponse } from '../utils/response ';
import { io, userSockets } from '../../index'; // Import io từ index.ts

// export const getOrCreateConversation = async (req: Request, res: Response) => {
//     try {
//         const { user1Id, user2Id, username1, username2 } = req.body;

//         if (!user1Id || !user2Id) {
//             sendNotFoundResponse(res, 'Missing user IDs.');
//             return;
//         }

//         const userIds = [user1Id, user2Id].sort();
//         const conversationsRef = collection(firestoredatabase, 'conversations');

//         const querySnapshot = await getDocs(conversationsRef);

//         let foundConversation: Conversation | undefined;

//         querySnapshot.forEach((doc) => {
//             try {
//                 const conversation = doc.data() as Conversation;
//                 const participantIds = conversation.participants.map((participant) => participant.id).sort();
//                 if (userIds.toString() === participantIds.toString()) {
//                     foundConversation = {
//                         id: doc.id,
//                         participants: conversation.participants,
//                         messages: conversation.messages,
//                     };
//                 }
//             } catch (error) {
//                 console.error('Error in forEach:', error);
//             }
//         });

//         if (foundConversation) {
//             sendSuccessResponse(res, foundConversation, 'Found existing conversation.');
//         } else {
//             const newConversation: Conversation = {
//                 participants: [
//                     { id: user1Id, username: username1 || 'Unknown User' },
//                     { id: user2Id, username: username2 || 'Unknown User' },
//                 ],
//                 messages: [],
//             };

//             const newConversationRef = await addDoc(conversationsRef, newConversation);

//             // Phát tín hiệu qua Socket.IO
//             io.emit('newConversation', { id: newConversationRef.id, ...newConversation });

//             sendSuccessResponse(res, { id: newConversationRef.id, ...newConversation }, 'Created new conversation.');
//         }
//     } catch (error) {
//         console.error('Error in getOrCreateConversation:', error);
//         sendNotFoundResponse(res, 'Failed to get or create conversation.');
//     }
// };

// export const getAllConversations = async (req: Request, res: Response) => {
//     try {
//         const { userId } = req.body;

//         if (!userId) {
//             sendNotFoundResponse(res, 'Missing user ID.');
//             return;
//         }

//         const conversationsRef = collection(firestoredatabase, 'conversations');

//         const querySnapshot = await getDocs(conversationsRef);

//         const conversations: Conversation[] = [];

//         querySnapshot.forEach((doc) => {
//             try {
//                 const conversation = doc.data() as Conversation;
//                 const participantIds = conversation.participants.map((participant) => participant.id);

//                 if (participantIds.includes(userId)) {
//                     conversations.push({
//                         id: doc.id,
//                         participants: conversation.participants,
//                         messages: conversation.messages,
//                     });
//                 }
//             } catch (error) {
//                 console.error('Error in forEach:', error);
//             }
//         });

//         // Phát tín hiệu qua Socket.IO
//         io.emit('allConversations', conversations);

//         sendSuccessResponse(res, conversations, 'Fetched all conversations.');
//     } catch (error) {
//         console.error('Error in getAllConversations:', error);
//         sendNotFoundResponse(res, 'Failed to fetch conversations.');
//     }
// };

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { user1Id, user2Id, username1, username2 } = req.body;

        if (!user1Id || !user2Id) {
            sendNotFoundResponse(res, 'Missing user IDs.');
            return;
        }

        const userIds = [user1Id, user2Id].sort();
        const conversationsRef = collection(firestoredatabase, 'conversations');

        const querySnapshot = await getDocs(conversationsRef);

        let foundConversation: Conversation | undefined;

        querySnapshot.forEach((doc) => {
            try {
                const conversation = doc.data() as Conversation;
                const participantIds = conversation.participants.map((participant) => participant.id).sort();
                if (userIds.toString() === participantIds.toString()) {
                    foundConversation = {
                        id: doc.id,
                        participants: conversation.participants,
                        messages: conversation.messages,
                    };
                }
            } catch (error) {
                console.error('Error in forEach:', error);
            }
        });

        if (foundConversation) {
            const socketId1 = userSockets.get(user1Id);
            const socketId2 = userSockets.get(user2Id);
            if (socketId1) {
                io.to(socketId1).emit('newConversation', foundConversation);
            }
            if (socketId2) {
                io.to(socketId2).emit('newConversation', foundConversation);
            }
            sendSuccessResponse(res, foundConversation, 'Found existing conversation.');
        } else {
            const newConversation: Conversation = {
                participants: [
                    { id: user1Id, username: username1 || 'Unknown User' },
                    { id: user2Id, username: username2 || 'Unknown User' },
                ],
                messages: [],
            };

            const newConversationRef = await addDoc(conversationsRef, newConversation);

            const socketId1 = userSockets.get(user1Id);
            const socketId2 = userSockets.get(user2Id);
            if (socketId1) {
                io.to(socketId1).emit('newConversation', { id: newConversationRef.id, ...newConversation });
            }
            if (socketId2) {
                io.to(socketId2).emit('newConversation', { id: newConversationRef.id, ...newConversation });
            }

            sendSuccessResponse(res, { id: newConversationRef.id, ...newConversation }, 'Created new conversation.');
        }
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        sendNotFoundResponse(res, 'Failed to get or create conversation.');
    }
};

export const getAllConversations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            sendNotFoundResponse(res, 'Missing user ID.');
            return;
        }

        const conversationsRef = collection(firestoredatabase, 'conversations');

        const querySnapshot = await getDocs(conversationsRef);

        const conversations: Conversation[] = [];

        querySnapshot.forEach((doc) => {
            try {
                const conversation = doc.data() as Conversation;
                const participantIds = conversation.participants.map((participant) => participant.id);

                if (participantIds.includes(userId)) {
                    conversations.push({
                        id: doc.id,
                        participants: conversation.participants,
                        messages: conversation.messages,
                    });
                }
            } catch (error) {
                console.error('Error in forEach:', error);
            }
        });

        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit('allConversations', conversations);
        }

        sendSuccessResponse(res, conversations, 'Fetched all conversations.');
    } catch (error) {
        console.error('Error in getAllConversations:', error);
        sendNotFoundResponse(res, 'Failed to fetch conversations.');
    }
};
