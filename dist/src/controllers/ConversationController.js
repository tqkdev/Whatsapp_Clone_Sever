"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllConversations = exports.getOrCreateConversation = void 0;
const firestore_1 = require("firebase/firestore");
const Firebase_1 = require("../database/Firebase");
const response_1 = require("../utils/response ");
const index_1 = require("../../index"); // Import io từ index.ts
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
const getOrCreateConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user1Id, user2Id, username1, username2 } = req.body;
        if (!user1Id || !user2Id) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing user IDs.');
            return;
        }
        const userIds = [user1Id, user2Id].sort();
        const conversationsRef = (0, firestore_1.collection)(Firebase_1.firestoredatabase, 'conversations');
        const querySnapshot = yield (0, firestore_1.getDocs)(conversationsRef);
        let foundConversation;
        querySnapshot.forEach((doc) => {
            try {
                const conversation = doc.data();
                const participantIds = conversation.participants.map((participant) => participant.id).sort();
                if (userIds.toString() === participantIds.toString()) {
                    foundConversation = {
                        id: doc.id,
                        participants: conversation.participants,
                        messages: conversation.messages,
                    };
                }
            }
            catch (error) {
                console.error('Error in forEach:', error);
            }
        });
        if (foundConversation) {
            const socketId1 = index_1.userSockets.get(user1Id);
            const socketId2 = index_1.userSockets.get(user2Id);
            if (socketId1) {
                index_1.io.to(socketId1).emit('newConversation', foundConversation);
            }
            if (socketId2) {
                index_1.io.to(socketId2).emit('newConversation', foundConversation);
            }
            (0, response_1.sendSuccessResponse)(res, foundConversation, 'Found existing conversation.');
        }
        else {
            const newConversation = {
                participants: [
                    { id: user1Id, username: username1 || 'Unknown User' },
                    { id: user2Id, username: username2 || 'Unknown User' },
                ],
                messages: [],
            };
            const newConversationRef = yield (0, firestore_1.addDoc)(conversationsRef, newConversation);
            const socketId1 = index_1.userSockets.get(user1Id);
            const socketId2 = index_1.userSockets.get(user2Id);
            if (socketId1) {
                index_1.io.to(socketId1).emit('newConversation', Object.assign({ id: newConversationRef.id }, newConversation));
            }
            if (socketId2) {
                index_1.io.to(socketId2).emit('newConversation', Object.assign({ id: newConversationRef.id }, newConversation));
            }
            (0, response_1.sendSuccessResponse)(res, Object.assign({ id: newConversationRef.id }, newConversation), 'Created new conversation.');
        }
    }
    catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to get or create conversation.');
    }
});
exports.getOrCreateConversation = getOrCreateConversation;
const getAllConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing user ID.');
            return;
        }
        const conversationsRef = (0, firestore_1.collection)(Firebase_1.firestoredatabase, 'conversations');
        const querySnapshot = yield (0, firestore_1.getDocs)(conversationsRef);
        const conversations = [];
        querySnapshot.forEach((doc) => {
            try {
                const conversation = doc.data();
                const participantIds = conversation.participants.map((participant) => participant.id);
                if (participantIds.includes(userId)) {
                    conversations.push({
                        id: doc.id,
                        participants: conversation.participants,
                        messages: conversation.messages,
                    });
                }
            }
            catch (error) {
                console.error('Error in forEach:', error);
            }
        });
        const socketId = index_1.userSockets.get(userId);
        if (socketId) {
            index_1.io.to(socketId).emit('allConversations', conversations);
        }
        (0, response_1.sendSuccessResponse)(res, conversations, 'Fetched all conversations.');
    }
    catch (error) {
        console.error('Error in getAllConversations:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to fetch conversations.');
    }
});
exports.getAllConversations = getAllConversations;
