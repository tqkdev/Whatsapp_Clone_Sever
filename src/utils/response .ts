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
