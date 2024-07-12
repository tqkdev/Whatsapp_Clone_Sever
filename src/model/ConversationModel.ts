import { Message } from './MessageModel';
import { User } from './UserModel';

export interface Conversation {
    id?: string; // ID của cuộc trò chuyện, được Firebase tự động tạo
    participants: Omit<User, 'email' | 'password'>[]; // Array chứa chi tiết thông tin user trừ email và password
    messages: Message[]; // Array chứa các tin nhắn trong cuộc trò chuyện
    lastMessageTimestamp?: string | null; // ISO string của thời gian tin nhắn cuối cùng
}
