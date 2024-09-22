export interface Message {
    id?: string; // ID của tin nhắn, được Firebase tự động tạo
    ChatId?: string; // ID của nhóm mà tin nhắn thuộc về (dùng cho chat nhóm)
    senderId: string; // userId của người gửi
    content?: string; // Nội dung văn bản của tin nhắn (nếu có)
    imageUrl?: string | null; // URL của ảnh (nếu có)
    created_at?: Date;
}
