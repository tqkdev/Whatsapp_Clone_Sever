export interface User {
    id?: string; // ID của người dùng, được Firebase tự động tạo.
    username: string; // Tên người dùng.
    email: string; // Email của người dùng.
    password: string; // Mật khẩu của người dùng.
    avatarUrl?: string; // URL của ảnh đại diện người dùng.
    dateOfBirth?: string; // Ngày sinh của người dùng.
    gender?: 'nam' | 'nu' | 'khac'; // Giới tính của người dùng.
    friends?: string[]; //Danh sách ID của bạn bè
    chats?: string[]; // Danh sách ID của Chats
    friendRequests?: FriendRequestInfo[];
    created_at?: Date; // Thời gian tài khoản người dùng được tạo.
}

export interface FriendRequestInfo {
    requestId: string; // ID của lời mời kết bạn
    senderId: string; // ID của người gửi lời mời
}
