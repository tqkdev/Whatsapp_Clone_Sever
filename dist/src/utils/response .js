"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.sendUnauthorizedResponse = exports.sendNotFoundResponse = exports.sendValidationErrorResponse = exports.sendSuccessResponse = void 0;
const sendSuccessResponse = (res, data, message) => {
    const responseData = {
        data,
        message,
    };
    res.status(200).json(responseData);
};
exports.sendSuccessResponse = sendSuccessResponse;
const sendValidationErrorResponse = (res, errors, message) => {
    const errorResponse = {
        message,
        errors,
        code: 'FST_ERR_VALIDATION',
        statusCode: 422,
    };
    res.status(422).json(errorResponse);
};
exports.sendValidationErrorResponse = sendValidationErrorResponse;
const sendNotFoundResponse = (res, message) => {
    const errorResponse = {
        message,
        statusCode: 404,
    };
    res.status(404).json(errorResponse);
};
exports.sendNotFoundResponse = sendNotFoundResponse;
const sendUnauthorizedResponse = (res, message) => {
    res.status(401).json({ message });
};
exports.sendUnauthorizedResponse = sendUnauthorizedResponse;
const sendErrorResponse = (res, message) => {
    res.status(500).json({ error: true, message });
};
exports.sendErrorResponse = sendErrorResponse;
// import { Response } from 'express';
// import { Server as SocketIOServer, Socket } from 'socket.io';
// interface SuccessResponseData {
//     data?: any;
//     message: string;
// }
// interface ErrorResponseData {
//     message: string;
//     errors?: any[];
//     code?: string;
//     statusCode: number;
// }
// export const sendSuccessResponse = (res: Response, io: SocketIOServer, data: any, message: string): void => {
//     const responseData: SuccessResponseData = {
//         data,
//         message,
//     };
//     res.status(200).json(responseData);
//     io.emit('response', responseData); // Gửi phản hồi qua Socket.IO
// };
// export const sendValidationErrorResponse = (
//     res: Response,
//     io: SocketIOServer,
//     errors: any[],
//     message: string,
// ): void => {
//     const errorResponse: ErrorResponseData = {
//         message,
//         errors,
//         code: 'FST_ERR_VALIDATION',
//         statusCode: 422,
//     };
//     res.status(422).json(errorResponse);
//     io.emit('response', errorResponse); // Gửi phản hồi qua Socket.IO
// };
// export const sendNotFoundResponse = (res: Response, io: SocketIOServer, message: string): void => {
//     const errorResponse: ErrorResponseData = {
//         message,
//         statusCode: 404,
//     };
//     res.status(404).json(errorResponse);
//     io.emit('response', errorResponse); // Gửi phản hồi qua Socket.IO
// };
// export const sendUnauthorizedResponse = (res: Response, io: SocketIOServer, message: string) => {
//     const errorResponse = { message };
//     res.status(401).json(errorResponse);
//     io.emit('response', errorResponse); // Gửi phản hồi qua Socket.IO
// };
// export const sendErrorResponse = (res: Response, io: SocketIOServer, message: string) => {
//     const errorResponse = { error: true, message };
//     res.status(500).json(errorResponse);
//     io.emit('response', errorResponse); // Gửi phản hồi qua Socket.IO
// };
