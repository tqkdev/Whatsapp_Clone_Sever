import { Message } from './MessageModel';

export interface Chat {
    id?: string; // ID của cuộc trò chuyện hoặc nhóm, được Firebase tự động tạo.
    name?: string; // Tên của nhóm (không có cho Conversation).
    avatarUrl?: string; // URL của ảnh đại diện nhóm (không có cho Conversation).
    participants?: participantsInfo[]; // Danh sách ID của người tham gia (dùng cho Conversation).
    members?: participantsInfo[]; // Danh sách ID của thành viên (dùng cho Group).
    messages: Message[]; // Mảng chứa các tin nhắn.
    // messages: []; // Mảng chứa các id tin nhắn.
    createdBy?: string; // ID của người tạo nhóm (không có cho Conversation).
    created_at?: Date; // Thời gian cuộc trò chuyện hoặc nhóm được tạo.
}
export interface participantsInfo {
    id: string; // ID của lời mời kết bạn
    username: string; // ID của người gửi lời mời
}
