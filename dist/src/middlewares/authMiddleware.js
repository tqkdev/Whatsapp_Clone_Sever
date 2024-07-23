"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const response_1 = require("../utils/response ");
dotenv_1.default.config();
const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return (0, response_1.sendUnauthorizedResponse)(res, 'Access token required.');
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
        if (err) {
            return (0, response_1.sendUnauthorizedResponse)(res, 'Invalid access token.');
        }
        req.user = user; // Gán thông tin người dùng vào request object
        next();
    });
};
exports.default = authenticateToken;
