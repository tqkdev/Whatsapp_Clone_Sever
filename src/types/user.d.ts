import { User } from '../models/User'; // Điều chỉnh đường dẫn cho phù hợp

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
