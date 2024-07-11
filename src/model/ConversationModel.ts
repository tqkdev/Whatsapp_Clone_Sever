import { Message } from './MessageModel';
import { User } from './UserModel';

export interface Conversation {
    id?: string; // ID của cuộc trò chuyện, được Firebase tự động tạo
    participants: ConversationParticipant[]; // Mảng các người tham gia
    messages: Message[]; // Array chứa các tin nhắn trong cuộc trò chuyện
    lastMessageTimestamp?: string | null; // ISO string của thời gian tin nhắn cuối cùng
}

export interface ConversationParticipant {
    userId: string; // ID của người dùng
    userDetails: User; // Chi tiết của người dùng, có thể chỉ lưu username hoặc thêm các thông tin khác
}
