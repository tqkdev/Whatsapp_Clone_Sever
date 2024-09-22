import { Request, Response } from 'express';
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { firestoredatabase } from '../database/Firebase';
import {
    sendErrorResponse,
    sendNotFoundResponse,
    sendSuccessResponse,
    sendValidationErrorResponse,
} from '../utils/response ';
import { Chat } from '../model/ChatModel';
import { User } from '../model/UserModel';
import { io, userSockets } from '../../index'; // Import io từ index.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../database/Firebase';
import { upload } from '../middlewares/uploadMiddleware';

export const createChat = [
    upload.single('image'), // Xử lý file upload từ client
    async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const { createdBy } = req.body;
            let { name, participant } = req.body;
            if (name === '') {
                name = undefined;
            }
            participant = JSON.parse(participant);
            let avatarUrl = null;

            // Nếu có file được tải lên, tải file lên Firebase Storage
            if (file) {
                const fileName = `${uuidv4()}_${file.originalname}`;

                const storageRef = ref(storage, `chats/${fileName}`);

                // Upload file lên Firebase Storage
                await uploadBytes(storageRef, file.buffer);

                // Lấy URL của ảnh vừa tải lên
                avatarUrl = await getDownloadURL(storageRef);
            }

            // Định nghĩa đối tượng Chat
            const newChat: Chat = {
                messages: [], // Khởi tạo mảng tin nhắn trống
                created_at: new Date(),
            };

            if (participant.length >= 3) {
                // Trường hợp là nhóm (Group)
                newChat.name =
                    name ||
                    participant
                        .slice(0, 3)
                        .map((p: { username: string }) => p.username)
                        .join(', ');
                newChat.avatarUrl =
                    avatarUrl ||
                    'https://res.cloudinary.com/dyoctwffi/image/upload/v1725959255/ORGAVIVE/imagesgroup_gzjqql.jpg';
                newChat.members = participant.map(
                    (participant: { id: string; username: string; avatarUrl?: string }) => ({
                        id: participant.id,
                        username: participant.username,
                    }),
                );
                newChat.createdBy = createdBy;
            } else {
                sendValidationErrorResponse(
                    res,
                    [],
                    'Invalid data. Participant IDs array should have 2 or more elements.',
                );
                return;
            }

            // // Lưu đối tượng Chat vào Firestore
            const chatsRef = collection(firestoredatabase, 'chats');
            const docRef = await addDoc(chatsRef, newChat);

            // Lấy danh sách userIds từ participant
            const userIds = participant.map((p: { id: string }) => p.id);
            // Cập nhật danh sách chats của từng người dùng
            await Promise.all(
                userIds.map(async (userId: string) => {
                    const userRef = doc(firestoredatabase, 'users', userId);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        const updatedChats = userData.chats ? [...userData.chats, docRef.id] : [docRef.id];

                        // Cập nhật lại danh sách chats cho user
                        await updateDoc(userRef, { chats: updatedChats });
                    }
                }),
            );

            // Phát sự kiện tới các người dùng trong cuộc trò chuyện
            userIds.forEach((userId: string) => {
                const socketId = userSockets.get(userId);
                if (socketId) {
                    io.to(socketId).emit('newConversation', { id: docRef.id, ...newChat });
                }
            });

            sendSuccessResponse(res, { id: 3, ...newChat }, 'Group created successfully.');
        } catch (error) {
            console.error('Error creating chat:', error);
            sendErrorResponse(res, 'Failed to create chat.');
        }
    },
];

const getUserInfo = async (userId: string) => {
    const userRef = doc(firestoredatabase, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User not found.');
    }

    const userData = userDoc.data() as User;
    // Return user info without email and password
    const { email, password, friends, friendRequests, created_at, chats, ...userInfo } = userData;
    return {
        id: userId, // Thêm userId vào đối tượng trả về
        userInfo,
    };
};

export const getAllChats = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            sendErrorResponse(res, 'User ID is required');
            return;
        }

        // Lấy tất cả các đoạn chat từ collection 'chats'
        const chatsRef = collection(firestoredatabase, 'chats');
        const querySnapshot = await getDocs(chatsRef);

        const userChats: Chat[] = [];

        // Hàm helper lấy thông tin chi tiết của participant hoặc member
        const getChatUsersInfo = async (userList: { id: string; username: string }[]) => {
            return Promise.all(
                userList.map(async (user) => {
                    try {
                        const userInfo = await getUserInfo(user.id); // Gọi hàm getUserInfo
                        return { ...user, ...userInfo }; // Kết hợp thông tin user từ Firestore và danh sách ban đầu
                    } catch (error) {
                        console.error(`Error fetching user info for userId ${user.id}:`, error);
                        return user; // Nếu có lỗi, trả về thông tin cơ bản
                    }
                }),
            );
        };

        // Duyệt qua từng tài liệu và kiểm tra nếu người dùng là participant hoặc member
        for (const doc of querySnapshot.docs) {
            try {
                const chat = doc.data() as Chat;

                // Lấy danh sách participant và member IDs từ đoạn chat
                const participantIds = chat.participants?.map((participant) => participant.id) || [];
                const memberIds = chat.members?.map((member) => member.id) || [];

                // Kiểm tra nếu userId nằm trong participantIds hoặc memberIds
                if (participantIds.includes(userId) || memberIds.includes(userId)) {
                    const participantsWithInfo = chat.participants ? await getChatUsersInfo(chat.participants) : [];
                    const membersWithInfo = chat.members ? await getChatUsersInfo(chat.members) : [];

                    userChats.push({
                        id: doc.id,
                        participants: participantsWithInfo,
                        members: membersWithInfo,
                        messages: chat.messages,
                        created_at: chat.created_at,
                        name: chat.name,
                        avatarUrl: chat.avatarUrl,
                        createdBy: chat.createdBy,
                    });
                }
            } catch (error) {
                console.error('Error in processing chat:', error);
            }
        }

        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit('allConversations', userChats);
        }

        // Trả về danh sách đoạn chat của người dùng
        sendSuccessResponse(res, userChats, 'Chats fetched successfully');
    } catch (error) {
        console.error('Error fetching user chats:', error);
        sendErrorResponse(res, 'Failed to fetch chats');
    }
};

// export const getChatGroup = async (req: Request, res: Response) => {
//     try {
//         // Lấy userId từ URL parameter
//         const userId = req.params.userId;

//         if (!userId) {
//             sendErrorResponse(res, 'User ID is required');
//             return;
//         }

//         // Lấy tất cả các cuộc trò chuyện từ collection 'chats'
//         const chatsRef = collection(firestoredatabase, 'chats');
//         const querySnapshot = await getDocs(chatsRef);

//         const userChats: Chat[] = [];

//         // Duyệt qua từng tài liệu và kiểm tra nếu người dùng hiện tại là member
//         querySnapshot.forEach((doc) => {
//             try {
//                 const chat = doc.data() as Chat;

//                 // Lấy danh sách member IDs từ đoạn chat
//                 const memberIds = chat.members?.map((member) => member.id) || [];

//                 // Kiểm tra nếu userId nằm trong memberIds
//                 if (memberIds.includes(userId)) {
//                     userChats.push({
//                         id: doc.id,
//                         participants: chat.participants,
//                         members: chat.members,
//                         messages: chat.messages,
//                         created_at: chat.created_at,
//                         name: chat.name,
//                         avatarUrl: chat.avatarUrl,
//                         createdBy: chat.createdBy,
//                     });
//                 }
//             } catch (error) {
//                 console.error('Error in forEach:', error);
//             }
//         });

//         // Trả về danh sách các cuộc trò chuyện của người dùng hiện tại
//         sendSuccessResponse(res, userChats, 'Chats fetched successfully');
//     } catch (error) {
//         console.error('Error fetching user chats:', error);
//         sendErrorResponse(res, 'Failed to fetch chats');
//     }
// };

export const getChatGroup = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            sendErrorResponse(res, 'User ID is required');
            return;
        }

        // Lấy tất cả các cuộc trò chuyện từ collection 'chats'
        const chatsRef = collection(firestoredatabase, 'chats');
        const querySnapshot = await getDocs(chatsRef);

        const userChats: Chat[] = [];

        // Hàm helper lấy thông tin chi tiết của participant hoặc member
        const getChatUsersInfo = async (userList: { id: string; username: string }[]) => {
            return Promise.all(
                userList.map(async (user) => {
                    try {
                        const userInfo = await getUserInfo(user.id); // Gọi hàm getUserInfo
                        return { ...user, ...userInfo }; // Kết hợp thông tin user từ Firestore và danh sách ban đầu
                    } catch (error) {
                        console.error(`Error fetching user info for userId ${user.id}:`, error);
                        return user; // Nếu có lỗi, trả về thông tin cơ bản
                    }
                }),
            );
        };

        // Duyệt qua từng tài liệu và kiểm tra nếu người dùng hiện tại là member
        for (const doc of querySnapshot.docs) {
            try {
                const chat = doc.data() as Chat;

                // Lấy danh sách member IDs từ đoạn chat
                const memberIds = chat.members?.map((member) => member.id) || [];

                // Kiểm tra nếu userId nằm trong memberIds
                if (memberIds.includes(userId)) {
                    const participantsWithInfo = chat.participants ? await getChatUsersInfo(chat.participants) : [];
                    const membersWithInfo = chat.members ? await getChatUsersInfo(chat.members) : [];

                    userChats.push({
                        id: doc.id,
                        participants: participantsWithInfo,
                        members: membersWithInfo,
                        messages: chat.messages,
                        created_at: chat.created_at,
                        name: chat.name,
                        avatarUrl: chat.avatarUrl,
                        createdBy: chat.createdBy,
                    });
                }
            } catch (error) {
                console.error('Error in processing chat:', error);
            }
        }

        // Trả về danh sách các cuộc trò chuyện của người dùng hiện tại
        sendSuccessResponse(res, userChats, 'Chats fetched successfully');
    } catch (error) {
        console.error('Error fetching user chats:', error);
        sendErrorResponse(res, 'Failed to fetch chats');
    }
};

export const getChatId = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;

        if (!chatId) {
            sendNotFoundResponse(res, 'Missing chat ID.');
            return;
        }

        // Lấy tài liệu chat từ Firestore
        const chatRef = doc(firestoredatabase, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            sendNotFoundResponse(res, 'Chat not found.');
            return;
        }

        const chatData1 = chatDoc.data() as Chat;
        const { messages, ...chatData } = chatData1;

        // Hàm helper để lấy thông tin chi tiết của từng thành viên
        const getMembersInfo = async (participants: { id: string; username: string }[]) => {
            return Promise.all(
                participants.map(async (participant) => {
                    try {
                        const userInfo = await getUserInfo(participant.id);
                        return { ...participant, ...userInfo }; // Kết hợp thông tin thành viên từ Firestore
                    } catch (error) {
                        console.error(`Error fetching user info for memberId ${participant.id}:`, error);
                        return participant; // Nếu có lỗi, trả về thông tin cơ bản
                    }
                }),
            );
        };

        // Lấy thông tin chi tiết của các thành viên
        const membersWithInfo = chatData.participants ? await getMembersInfo(chatData.participants) : [];

        // Trả về kết quả thành công với thông tin thành viên đã được bổ sung
        sendSuccessResponse(res, { ...chatData, participants: membersWithInfo }, 'Fetched chat successfully.');
    } catch (error) {
        console.error('Error in getChatId:', error);
        sendNotFoundResponse(res, 'Failed to fetch chat.');
    }
};

export const searchChats = async (req: Request, res: Response) => {
    try {
        const { userId, searchValue } = req.params;

        // Kiểm tra đầu vào
        if (!userId || !searchValue) {
            sendErrorResponse(res, 'Missing userId or search value.');
            return;
        }

        // Lấy dữ liệu user từ Firestore
        const userRef = doc(firestoredatabase, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            sendErrorResponse(res, 'User not found.');
            return;
        }

        const userData = userDoc.data() as User;

        if (!userData.chats || userData.chats.length === 0) {
            sendSuccessResponse(res, [], 'No chats found.');
            return;
        }

        // Lấy tất cả chats của người dùng từ Firestore
        const chatsRef = collection(firestoredatabase, 'chats');
        const chatsQuery = query(chatsRef, where('__name__', 'in', userData.chats));
        const chatDocs = await getDocs(chatsQuery);

        const matchingChats: any[] = [];

        // Lọc các cuộc trò chuyện dựa trên searchValue
        for (const doc of chatDocs.docs) {
            const chatData = doc.data() as Chat;

            // Kiểm tra name nếu có, hoặc tìm kiếm trong participants
            const isNameMatch = chatData.name?.toLowerCase().includes(searchValue.toLowerCase());
            const isParticipantMatch = chatData.participants?.some(
                (p) => p.id !== userId && p.username.toLowerCase().includes(searchValue.toLowerCase()),
            );

            if (isNameMatch && chatData.members) {
                // Lấy thông tin chi tiết của từng participant
                const membersWithInfo = await Promise.all(
                    chatData.members?.map(async (member) => {
                        const userInfo = await getUserInfo(member.id);
                        return userInfo;
                    }),
                );
                const { messages, ...data } = chatData;
                matchingChats.push({
                    id: doc.id,
                    ...data,
                    members: membersWithInfo, // Thêm thông tin chi tiết của participants
                });
            }

            if (isParticipantMatch && chatData.participants) {
                // Lấy thông tin chi tiết của từng participant
                const participantsWithInfo = await Promise.all(
                    chatData.participants.map(async (participant) => {
                        const userInfo = await getUserInfo(participant.id);
                        return userInfo;
                    }),
                );
                const { messages, ...data } = chatData;
                matchingChats.push({
                    id: doc.id,
                    ...data,
                    participants: participantsWithInfo, // Thêm thông tin chi tiết của participants
                });
            }
        }

        sendSuccessResponse(res, matchingChats, 'Search chats completed.');
    } catch (error) {
        console.error('Error searching chats:', error);
        sendErrorResponse(res, 'Failed to search chats.');
    }
};
