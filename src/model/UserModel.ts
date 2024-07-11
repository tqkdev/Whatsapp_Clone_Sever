export interface User {
    id?: string; // id sẽ được tự động tạo, do đó nó có thể không bắt buộc khi tạo mới
    username: string;
    email: string;
    password: string;
}
