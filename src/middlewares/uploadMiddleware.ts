import multer from 'multer';

const storage = multer.memoryStorage(); // Sử dụng bộ nhớ tạm
export const upload = multer({ storage: storage });
