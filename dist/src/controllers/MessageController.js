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
exports.getMessages = exports.sendMessage = void 0;
const Firebase_1 = require("../database/Firebase");
const response_1 = require("../utils/response ");
const firestore_1 = require("firebase/firestore");
const index_1 = require("../../index"); // Import io từ index.ts
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const { senderId, content, created_at } = req.body;
        if (!conversationId) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing conversation ID.');
            return;
        }
        if (!senderId || !content) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing required fields (senderId, content).');
            return;
        }
        const newMessage = {
            ConversationId: conversationId,
            senderId,
            content,
            created_at: created_at,
        };
        // Lưu tin nhắn mới vào collection "messages"
        const messagesCollectionRef = (0, firestore_1.collection)(Firebase_1.firestoredatabase, 'messages');
        const docRef = yield (0, firestore_1.addDoc)(messagesCollectionRef, newMessage);
        // Cập nhật dữ liệu tin nhắn với ID tài liệu
        newMessage.id = docRef.id;
        const conversationRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'conversations', conversationId);
        const conversationDoc = yield (0, firestore_1.getDoc)(conversationRef);
        if (!conversationDoc.exists()) {
            (0, response_1.sendNotFoundResponse)(res, 'Conversation not found.');
            return;
        }
        const conversationData = conversationDoc.data();
        const updatedMessages = [...conversationData.messages, newMessage];
        yield (0, firestore_1.updateDoc)(conversationRef, {
            messages: updatedMessages,
        });
        index_1.io.to(conversationId).emit('newMessage', newMessage);
        (0, response_1.sendSuccessResponse)(res, newMessage, 'Message sent successfully.');
    }
    catch (error) {
        console.error('Error in sendMessage:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to send message.');
    }
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing conversation ID.');
            return;
        }
        const conversationRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'conversations', conversationId);
        const conversationDoc = yield (0, firestore_1.getDoc)(conversationRef);
        if (!conversationDoc.exists()) {
            (0, response_1.sendNotFoundResponse)(res, 'Conversation not found.');
            return;
        }
        const conversationData = conversationDoc.data();
        const messages = conversationData.messages;
        (0, response_1.sendSuccessResponse)(res, messages, 'Fetched messages successfully.');
    }
    catch (error) {
        console.error('Error in getMessages:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to fetch messages.');
    }
});
exports.getMessages = getMessages;
