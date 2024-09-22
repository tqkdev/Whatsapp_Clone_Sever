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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageWithImage = exports.getMessages = exports.sendMessage = void 0;
const Firebase_1 = require("../database/Firebase");
const response_1 = require("../utils/response ");
const firestore_1 = require("firebase/firestore");
const index_1 = require("../../index"); // Import io từ index.ts
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
// /////
const storage_1 = require("firebase/storage");
const uuid_1 = require("uuid");
const Firebase_2 = require("../database/Firebase");
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatId } = req.params;
        const { senderId, content, created_at } = req.body;
        if (!chatId) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing chat ID.');
            return;
        }
        if (!senderId || !content) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing required fields (senderId, content).');
            return;
        }
        const newMessage = {
            ChatId: chatId,
            senderId,
            content,
            created_at: created_at || new Date(),
        };
        // Lưu tin nhắn mới vào collection "messages"
        const messagesCollectionRef = (0, firestore_1.collection)(Firebase_1.firestoredatabase, 'messages');
        const docRef = yield (0, firestore_1.addDoc)(messagesCollectionRef, newMessage);
        // Cập nhật dữ liệu tin nhắn với ID tài liệu
        newMessage.id = docRef.id;
        const chatRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'chats', chatId);
        const chatDoc = yield (0, firestore_1.getDoc)(chatRef);
        if (!chatDoc.exists()) {
            (0, response_1.sendNotFoundResponse)(res, 'Chat not found.');
            return;
        }
        const chatData = chatDoc.data();
        const updatedMessages = [...chatData.messages, newMessage];
        yield (0, firestore_1.updateDoc)(chatRef, {
            messages: updatedMessages,
        });
        // Phát tin nhắn mới đến tất cả client trong cuộc trò chuyện
        index_1.io.to(chatId).emit('newMessage', newMessage);
        (0, response_1.sendSuccessResponse)(res, newMessage, 'Message sent successfully.');
    }
    catch (error) {
        console.error('Error in sendMessage:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to send message.');
    }
});
exports.sendMessage = sendMessage;
// Helper function to get user info
const getUserInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
    const userDoc = yield (0, firestore_1.getDoc)(userRef);
    if (!userDoc.exists()) {
        throw new Error('User not found.');
    }
    const userData = userDoc.data();
    // Return user info without email and password
    const { email, password, friends, friendRequests, created_at, chats } = userData, userInfo = __rest(userData, ["email", "password", "friends", "friendRequests", "created_at", "chats"]);
    return {
        id: userId, // Thêm userId vào đối tượng trả về
        userInfo,
    };
});
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatId } = req.params;
        if (!chatId) {
            (0, response_1.sendNotFoundResponse)(res, 'Missing chat ID.');
            return;
        }
        // Lấy tài liệu chat từ Firestore
        const chatRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'chats', chatId);
        const chatDoc = yield (0, firestore_1.getDoc)(chatRef);
        if (!chatDoc.exists()) {
            (0, response_1.sendNotFoundResponse)(res, 'Chat not found.');
            return;
        }
        const chatData = chatDoc.data();
        const messages = chatData.messages || [];
        // Dùng hàm getUserInfo để lấy thông tin người gửi cho từng tin nhắn
        const messagesWithSenderInfo = yield Promise.all(messages.map((message) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const senderInfo = yield getUserInfo(message.senderId); // Gọi hàm getUserInfo
                return Object.assign(Object.assign({}, message), { senderInfo: senderInfo });
            }
            catch (error) {
                console.error(`Error fetching user info for senderId ${message.senderId}:`, error);
                return Object.assign(Object.assign({}, message), { sender: { id: message.senderId, username: 'Unknown' } });
            }
        })));
        // Trả về kết quả thành công với thông tin người gửi đã được bổ sung
        (0, response_1.sendSuccessResponse)(res, messagesWithSenderInfo, 'Fetched messages successfully.');
        // Phát sự kiện socket.io để thông báo về tin nhắn
        index_1.io.to(chatId).emit('messagesFetched', { chatId, messages: messagesWithSenderInfo });
    }
    catch (error) {
        console.error('Error in getMessages:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to fetch messages.');
    }
});
exports.getMessages = getMessages;
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
exports.sendMessageWithImage = [
    uploadMiddleware_1.upload.single('image'), // Xử lý file upload từ client
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                const fileName = `${(0, uuid_1.v4)()}_${file.originalname}`;
                const storageRef = (0, storage_1.ref)(Firebase_2.storage, `messages/${chatId}/${fileName}`);
                // Upload file lên Firebase Storage
                yield (0, storage_1.uploadBytes)(storageRef, file.buffer);
                // Lấy URL của ảnh vừa tải lên
                imageUrl = yield (0, storage_1.getDownloadURL)(storageRef);
            }
            // Tạo tin nhắn mới
            const newMessage = {
                ChatId: chatId,
                senderId,
                content: content || null, // Nội dung text nếu có
                imageUrl: imageUrl || null, // URL ảnh nếu có
                created_at: new Date(),
            };
            // Lưu tin nhắn mới vào Firestore
            const messagesCollectionRef = (0, firestore_1.collection)(Firebase_1.firestoredatabase, 'messages');
            const docRef = yield (0, firestore_1.addDoc)(messagesCollectionRef, newMessage);
            // Cập nhật dữ liệu tin nhắn với ID tài liệu
            newMessage.id = docRef.id;
            const chatRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'chats', chatId);
            const chatDoc = yield (0, firestore_1.getDoc)(chatRef);
            if (!chatDoc.exists()) {
                (0, response_1.sendNotFoundResponse)(res, 'Chat not found.');
                return;
            }
            const chatData = chatDoc.data();
            const updatedMessages = [...chatData.messages, newMessage];
            yield (0, firestore_1.updateDoc)(chatRef, {
                messages: updatedMessages,
            });
            // Phát tin nhắn mới đến tất cả client trong cuộc trò chuyện
            index_1.io.to(chatId).emit('newMessage', newMessage);
            (0, response_1.sendSuccessResponse)(res, newMessage, 'Message sent successfully.');
        }
        catch (error) {
            console.error('Error in sendMessageWithImage:', error);
            (0, response_1.sendNotFoundResponse)(res, 'Failed to send message.');
        }
    }),
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
