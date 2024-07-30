#  Express.js + TypeScript

## Giới Thiệu
<p> Whatsapp_Clone_Sever là một máy chủ Express.js cho 1 ứng dụng nhắn tin được xây dựng bằng TypeScript, Firestore và Socket.IO. Nó bao gồm các chức năng quản lý người dùng và cuộc trò chuyện, với khả năng giao tiếp thời gian thực.</p>
<h1>Cấu trúc dữ liệu</h1>
<p>User: Lưu trữ thông tin người dùng như username, email, và password.</p>
<p>Conversation: Lưu trữ thông tin về các cuộc trò chuyện giữa các người dùng, bao gồm danh sách các tin nhắn.</p>
<p>Message: Lưu trữ nội dung của các tin nhắn trong các cuộc trò chuyện.</p>
<h2>Socket.IO</h2>
<p>Socket.IO để cung cấp các tính năng giao tiếp thời gian thực. Socket.IO cho phép server gửi các sự kiện đến các client kết nối, và ngược lại, giúp duy trì cập nhật dữ liệu liên tục mà không cần phải tải lại trang.</p>

## Công Nghệ
- **Backend**: Node.js, Express.js, TypeScript, Firestore, Socket.IO, JWT.

## Cài Đặt

1. Clone repository:

    ```sh
    git clone git@github.com:tqkdev/Whatsapp_Clone_Sever.git
    cd app/Whatsapp_Clone_Sever
    ```

2. Cài đặt các phụ thuộc:

    ```sh
    npm install
    ```

3. Tạo file `.env` ở thư mục gốc của backend và thêm nội dung sau:

    ```env
    JWT_ACCESS_KEY=<jwt_access_key>
    JWT_REFRESH_KEY=<jwt_refresh_key>
    PORT=3001
    REACT_URL = <react_url>
    FIREBASE_DATABASE_URL = <firebase_database_url>
    ```

4. Sửa file `package.json` :
    ```scripts
    "build": "rimraf dist && npx tsc"
    "prestart": "npm run build"
    "start": "node dist/index.js"
    "preserve": "npm run build"
    "serve": "concurrently \"npx tsc -w\"  \"nodemon dist/index.js\""
    ```

4. Khởi động server backend:

    ```sh
    npm serve
    ```
