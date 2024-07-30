<p> Whatsapp_Clone_Sever là một máy chủ Express.js cho 1 ứng dụng nhắn tin được xây dựng bằng TypeScript, Firestore và Socket.IO. Nó bao gồm các chức năng quản lý người dùng và cuộc trò chuyện, với khả năng giao tiếp thời gian thực.</p>
<h1>Cấu trúc dữ liệu</h1>
<p>User: Lưu trữ thông tin người dùng như username, email, và password.</p>
<p>Conversation: Lưu trữ thông tin về các cuộc trò chuyện giữa các người dùng, bao gồm danh sách các tin nhắn.</p>
<p>Message: Lưu trữ nội dung của các tin nhắn trong các cuộc trò chuyện.</p>
<h2>Socket.IO</h2>
<p>Dự án sử dụng Socket.IO để cung cấp các tính năng giao tiếp thời gian thực. Socket.IO cho phép server gửi các sự kiện đến các client kết nối, và ngược lại, giúp duy trì cập nhật dữ liệu liên tục mà không cần phải tải lại trang.</p>
<h2>Các sự kiện Socket.IO</h2>
<p>newConversation: Phát khi một cuộc trò chuyện mới được tạo.</p>
<p>newMessage: Phát khi một tin nhắn mới được gửi trong cuộc trò chuyện.</p>
<p>allConversations: Phát khi tất cả các cuộc trò chuyện được lấy từ database.</p>
