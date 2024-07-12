export interface Message {
    id?: string; // ID của tin nhắn, được Firebase tự động tạo
    ConversationId: string; // ID của cuộc trò chuyện mà tin nhắn thuộc về
    senderId: string; // userId của người gửi
    content: string;
    created_at?: Date;
}
