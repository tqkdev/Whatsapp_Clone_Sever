export interface FriendRequest {
    id?: string; //
    senderId: string; // ID của người gửi lời mời kết bạn.
    receiverId: string; // ID của người nhận lời mời kết bạn.
    status: 'pending' | 'accepted' | 'rejected'; // Trạng thái của lời mời kết bạn.
    created_at: Date; // Thời gian lời mời kết bạn được gửi.
}
