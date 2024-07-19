import { Request, Response } from 'express';
import { addDoc, collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { firestoredatabase } from '../database/Firebase';
import { Conversation } from '../model/ConversationModel';
import { sendNotFoundResponse, sendSuccessResponse } from '../utils/response ';
import { io } from '../../index'; // Import io từ index.ts
// import { getSocketIO } from '../Socket/Socket';
// const io = getSocketIO();

// Hàm để lấy hoặc tạo Conversation giữa hai người dùng

// export const getOrCreateConversation = async (req: Request, res: Response) => {
//     try {
//         const { user1Id, user2Id, username1, username2 } = req.body;

//         if (!user1Id || !user2Id) {
//             sendNotFoundResponse(res, 'Missing user IDs.');
//             return;
//         }

//         // Tạo một mảng chứa user ids để sử dụng trong truy vấn
//         const userIds = [user1Id, user2Id].sort(); // Sắp xếp để đảm bảo thứ tự không đổi
//         const conversationsRef = collection(firestoredatabase, 'conversations');
//         const querySnapshot = await getDocs(conversationsRef);

//         let foundConversation: Conversation | undefined;

//         querySnapshot.forEach((doc) => {
//             try {
//                 const conversation = doc.data() as Conversation;
//                 // Kiểm tra xem Conversation có chứa cả hai user không
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

//         // Nếu tìm thấy Conversation
//         if (foundConversation) {
//             sendSuccessResponse(res, foundConversation, 'Found existing conversation.');
//         } else {
//             // Nếu không tìm thấy Conversation, tạo mới
//             const newConversation: Conversation = {
//                 participants: [
//                     { id: user1Id, username: username1 || 'Unknown User' },
//                     { id: user2Id, username: username2 || 'Unknown User' },
//                 ],
//                 messages: [],
//             };

//             const newConversationRef = await addDoc(conversationsRef, newConversation);
//             sendSuccessResponse(res, { id: newConversationRef.id, ...newConversation }, 'Created new conversation.');
//         }
//     } catch (error) {
//         console.error('Error in getOrCreateConversation:', error);
//         sendNotFoundResponse(res, 'Failed to get or create conversation.');
//     }
// };
// export const getAllConversations = async (req: Request, res: Response) => {
//     try {
//         const conversationsRef = collection(firestoredatabase, 'conversations');
//         const querySnapshot = await getDocs(conversationsRef);

//         const conversations: Conversation[] = [];

//         querySnapshot.forEach((doc) => {
//             try {
//                 const conversation = doc.data() as Conversation;
//                 conversations.push({
//                     id: doc.id,
//                     participants: conversation.participants,
//                     messages: conversation.messages,
//                 });
//             } catch (error) {
//                 console.error('Error in forEach:', error);
//             }
//         });

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
        // console.log(querySnapshot);

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

            // Phát tín hiệu qua Socket.IO
            // const io = getSocketIO();
            io.emit('newConversation', { id: newConversationRef.id, ...newConversation });

            sendSuccessResponse(res, { id: newConversationRef.id, ...newConversation }, 'Created new conversation.');
        }
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        sendNotFoundResponse(res, 'Failed to get or create conversation.');
    }
};

// export const getAllConversations = async (req: Request, res: Response) => {
//     try {
// const conversationsRef = collection(firestoredatabase, 'conversations');
// const querySnapshot = await getDocs(conversationsRef);

// const conversations: Conversation[] = [];

//         querySnapshot.forEach((doc) => {
//             try {
//                 const conversation = doc.data() as Conversation;
//                 conversations.push({
//                     id: doc.id,
//                     participants: conversation.participants,
//                     messages: conversation.messages,
//                 });
//             } catch (error) {
//                 console.error('Error in forEach:', error);
//             }
//         });

//         // Phát tín hiệu qua Socket.IO
//         // const io = getSocketIO();
//         io.emit('allConversations', conversations);

//         sendSuccessResponse(res, conversations, 'Fetched all conversations.');
//     } catch (error) {
//         console.error('Error in getAllConversations:', error);
//         sendNotFoundResponse(res, 'Failed to fetch conversations.');
//     }
// };

export const getAllConversations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            sendNotFoundResponse(res, 'Missing user ID.');
            return;
        }

        const conversationsRef = collection(firestoredatabase, 'conversations');

        const querySnapshot = await getDocs(conversationsRef);
        // console.log(querySnapshot);

        // querySnapshot.forEach((doc) => {
        //     try {
        //         const conversation = doc.data() as Conversation;
        //         const participantIds = conversation.participants.map((participant) => participant.id).sort();
        //         console.log(participantIds);

        //         if (userId.toString() === participantIds.toString()) {
        //             foundConversation = {
        //                 id: doc.id,
        //                 participants: conversation.participants,
        //                 messages: conversation.messages,
        //             };
        //         }
        //     } catch (error) {
        //         console.error('Error in forEach:', error);
        //     }
        // });

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

        // Phát tín hiệu qua Socket.IO
        io.emit('allConversations', conversations);

        sendSuccessResponse(res, conversations, 'Fetched all conversations.');
    } catch (error) {
        console.error('Error in getAllConversations:', error);
        sendNotFoundResponse(res, 'Failed to fetch conversations.');
    }
};

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

//             // Emit Socket.IO event
//             const io = getSocketIO();
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
//         const conversationsRef = collection(firestoredatabase, 'conversations');
//         const querySnapshot = await getDocs(conversationsRef);

//         const conversations: Conversation[] = [];

//         querySnapshot.forEach((doc) => {
//             try {
//                 const conversation = doc.data() as Conversation;
//                 conversations.push({
//                     id: doc.id,
//                     participants: conversation.participants,
//                     messages: conversation.messages,
//                 });
//             } catch (error) {
//                 console.error('Error in forEach:', error);
//             }
//         });

//         // Emit Socket.IO event
//         const io = getSocketIO();
//         io.emit('allConversations', conversations);

//         sendSuccessResponse(res, conversations, 'Fetched all conversations.');
//     } catch (error) {
//         console.error('Error in getAllConversations:', error);
//         sendNotFoundResponse(res, 'Failed to fetch conversations.');
//     }
// };
