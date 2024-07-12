import { Response } from 'express';

interface SuccessResponseData {
    data?: any;
    message: string;
}

interface ErrorResponseData {
    message: string;
    errors?: any[];
    code?: string;
    statusCode: number;
}

export const sendSuccessResponse = (res: Response, data: any, message: string): void => {
    const responseData: SuccessResponseData = {
        data,
        message,
    };
    res.status(200).json(responseData);
};

export const sendValidationErrorResponse = (res: Response, errors: any[], message: string): void => {
    const errorResponse: ErrorResponseData = {
        message,
        errors,
        code: 'FST_ERR_VALIDATION',
        statusCode: 422,
    };
    res.status(422).json(errorResponse);
};

export const sendNotFoundResponse = (res: Response, message: string): void => {
    const errorResponse: ErrorResponseData = {
        message,
        statusCode: 404,
    };
    res.status(404).json(errorResponse);
};

export const sendUnauthorizedResponse = (res: Response, message: string) => {
    res.status(401).json({ message });
};
export const sendErrorResponse = (res: Response, message: string) => {
    res.status(500).json({ error: true, message });
};
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
