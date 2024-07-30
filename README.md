Dự án này là một máy chủ Express.js được xây dựng bằng TypeScript, Firestore và Socket.IO. Nó bao gồm các chức năng quản lý người dùng và cuộc trò chuyện, với khả năng giao tiếp thời gian thực.
<h1>Cấu trúc dữ liệu</h1>
User: Lưu trữ thông tin người dùng như username, email, và password.
Conversation: Lưu trữ thông tin về các cuộc trò chuyện giữa các người dùng, bao gồm danh sách các tin nhắn.
Message: Lưu trữ nội dung của các tin nhắn trong các cuộc trò chuyện.
<h2>Socket.IO</h2>
Dự án sử dụng Socket.IO để cung cấp các tính năng giao tiếp thời gian thực. Socket.IO cho phép server gửi các sự kiện đến các client kết nối, và ngược lại, giúp duy trì cập nhật dữ liệu liên tục mà không cần phải tải lại trang.
<h2>Các sự kiện Socket.IO</h2>
newConversation: Phát khi một cuộc trò chuyện mới được tạo.
newMessage: Phát khi một tin nhắn mới được gửi trong cuộc trò chuyện.
allConversations: Phát khi tất cả các cuộc trò chuyện được lấy từ database.
