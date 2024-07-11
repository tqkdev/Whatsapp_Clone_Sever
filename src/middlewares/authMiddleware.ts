import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendUnauthorizedResponse } from '../utils/response ';

dotenv.config();

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return sendUnauthorizedResponse(res, 'Access token required.');
    }

    jwt.verify(token, process.env.JWT_ACCESS_KEY as string, (err: any, user: any) => {
        if (err) {
            return sendUnauthorizedResponse(res, 'Invalid access token.');
        }

        req.user = user; // Gán thông tin người dùng vào request object
        next();
    });
};

export default authenticateToken;
