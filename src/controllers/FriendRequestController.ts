import { Request, Response } from 'express';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestoredatabase } from '../database/Firebase';
import {
    sendErrorResponse,
    sendNotFoundResponse,
    sendSuccessResponse,
    sendValidationErrorResponse,
} from '../utils/response ';
import { FriendRequest } from '../model/FriendRequest';
import { FriendRequestInfo, User } from '../model/UserModel';
import { Chat } from '../model/ChatModel';
import { io, userSockets } from '../../index'; // Import io từ index.ts

export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId } = req.body;

        if (!senderId || !receiverId) {
            sendNotFoundResponse(res, 'Missing required fields (senderId, receiverId).');
            return;
        }

        const newRequest: FriendRequest = {
            senderId,
            receiverId,
            status: 'pending',
            created_at: new Date(),
        };

        // Lưu lời mời kết bạn vào Firestore
        const requestCollectionRef = collection(firestoredatabase, 'friendRequests');
        const docRef = await addDoc(requestCollectionRef, newRequest);

        // Cập nhật mảng friendRequests của người nhận
        const userRef = doc(firestoredatabase, 'users', receiverId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            sendNotFoundResponse(res, 'Receiver not found.');
            return;
        }

        const userData = userDoc.data() as User;
        const newFriendRequestInfo: FriendRequestInfo = {
            requestId: docRef.id,
            senderId: senderId,
        };

        const updatedFriendRequests = userData.friendRequests
            ? [...userData.friendRequests, newFriendRequestInfo]
            : [newFriendRequestInfo];

        await updateDoc(userRef, { friendRequests: updatedFriendRequests });

        sendSuccessResponse(res, { id: docRef.id, ...newRequest }, 'Friend request sent successfully.');
    } catch (error) {
        console.error('Error in sendFriendRequest:', error);
        sendNotFoundResponse(res, 'Failed to send friend request.');
    }
};

export const getFriendRequests = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            sendNotFoundResponse(res, 'User ID is required.');
            return;
        }

        // Lấy thông tin người dùng từ Firestore
        const userRef = doc(firestoredatabase, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            sendNotFoundResponse(res, 'User not found.');
            return;
        }

        const userData = userDoc.data() as User;
        const friendRequests = userData.friendRequests || [];

        // Lấy thông tin của các người gửi lời mời kèm theo requestId
        const senderInfos = [];
        for (const request of friendRequests) {
            const senderInfo = await getUserInfo(request.senderId);
            senderInfos.push({
                requestId: request.requestId, // Bao gồm requestId
                senderId: request.senderId,
                senderInfo,
            });
        }

        sendSuccessResponse(res, senderInfos, 'Friend requests fetched successfully.');
    } catch (error) {
        console.error('Error in getFriendRequests:', error);
        sendErrorResponse(res, 'Failed to fetch friend requests.');
    }
};

// Helper function to get user info
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

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        const requestId = req.params.requestId; // requestId là id của yêu cầu kết bạn

        const data = req.body;
        const Idreceiver = data.Idreceiver; // userId là id của người nhận là gnười dùng hiện tại
        const participant = data.participant; // tạo cuộc Chat

        if (!Idreceiver || !requestId) {
            sendNotFoundResponse(res, 'User ID and Request ID are required.');
            return;
        }

        // Lấy thông tin của lời mời kết bạn từ Firestore
        const requestRef = doc(firestoredatabase, 'friendRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            sendNotFoundResponse(res, 'Friend request not found.');
            return;
        }

        const friendRequest = requestDoc.data() as FriendRequest;

        if (friendRequest.receiverId !== Idreceiver) {
            sendNotFoundResponse(res, 'Request does not belong to the user.');
            return;
        }

        // Cập nhật trạng thái của lời mời kết bạn
        await updateDoc(requestRef, { status: 'accepted' });

        // Cập nhật danh sách bạn bè của người gửi và người nhận
        const senderRef = doc(firestoredatabase, 'users', friendRequest.senderId);
        const receiverRef = doc(firestoredatabase, 'users', friendRequest.receiverId);

        // Lấy thông tin của người gửi và người nhận
        const senderDoc = await getDoc(senderRef);
        const receiverDoc = await getDoc(receiverRef);

        if (!senderDoc.exists() || !receiverDoc.exists()) {
            sendNotFoundResponse(res, 'Sender or receiver not found.');
            return;
        }

        const senderData = senderDoc.data() as User;
        const receiverData = receiverDoc.data() as User;

        // Cập nhật danh sách bạn bè của người gửi
        const updatedSenderFriends = senderData.friends
            ? [...senderData.friends, friendRequest.receiverId]
            : [friendRequest.receiverId];
        await updateDoc(senderRef, { friends: updatedSenderFriends });

        // Cập nhật danh sách bạn bè của người nhận
        const updatedReceiverFriends = receiverData.friends
            ? [...receiverData.friends, friendRequest.senderId]
            : [friendRequest.senderId];
        await updateDoc(receiverRef, { friends: updatedReceiverFriends });

        // Xóa lời mời kết bạn khỏi danh sách của người nhận
        const updatedFriendRequests = (receiverData.friendRequests || []).filter((req) => req.requestId !== requestId);

        // Cập nhật lại danh sách friendRequests của người nhận trong Firestore
        await updateDoc(receiverRef, { friendRequests: updatedFriendRequests });

        // tạo Chat
        // Định nghĩa đối tượng Chat
        const newChat: Chat = {
            messages: [], // Khởi tạo mảng tin nhắn trống
            created_at: new Date(),
        };

        if (participant.length === 2) {
            // Trường hợp là cuộc trò chuyện cá nhân (Conversation)
            newChat.participants = participant.map(
                (participant: { id: string; username: string; avatarUrl?: string }) => ({
                    id: participant.id,
                    username: participant.username,
                }),
            );
        } else {
            sendValidationErrorResponse(res, [], 'Invalid data. Participant IDs array should have 2 or more elements.');
            return;
        }

        // Lưu đối tượng Chat vào Firestore
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

        sendSuccessResponse(res, { requestId }, 'Friend request accepted successfully.');
    } catch (error) {
        console.error('Error in acceptFriendRequest:', error);
        sendErrorResponse(res, 'Failed to accept friend request.');
    }
};

export const getAllFriends = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            sendNotFoundResponse(res, 'User ID is required.');
            return;
        }

        // Lấy thông tin người dùng từ Firestore
        const userRef = doc(firestoredatabase, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            sendNotFoundResponse(res, 'User not found.');
            return;
        }

        const userData = userDoc.data() as User;
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) {
            sendSuccessResponse(res, [], 'User has no friends.');
            return;
        }

        // Lấy thông tin của các bạn bè sử dụng hàm getUserInfo
        const friendInfos = [];
        for (const friendId of friendIds) {
            try {
                const friendInfo = await getUserInfo(friendId);
                friendInfos.push(friendInfo);
            } catch (error) {
                console.error(`Error fetching friend with ID ${friendId}:`, error);
            }
        }

        sendSuccessResponse(res, friendInfos, 'Friends fetched successfully.');
    } catch (error) {
        console.error('Error in getAllFriends:', error);
        sendErrorResponse(res, 'Failed to fetch friends.');
    }
};
