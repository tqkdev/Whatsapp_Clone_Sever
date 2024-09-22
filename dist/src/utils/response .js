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
