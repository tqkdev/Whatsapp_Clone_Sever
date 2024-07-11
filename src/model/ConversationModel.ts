import { Message } from './MessageModel';

export interface Conversation {
    id?: string; // ID của cuộc trò chuyện, được Firebase tự động tạo
    messages: Message[]; // Array chứa các tin nhắn trong cuộc trò chuyện
    lastMessageTimestamp?: string; // ISO string của thời gian tin nhắn cuối cùng
}
