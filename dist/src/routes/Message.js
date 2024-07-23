"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MessageController_1 = require("../controllers/MessageController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = (0, express_1.Router)();
router.get('/messages/:conversationId', authMiddleware_1.default, MessageController_1.getMessages);
router.post('/messages/:conversationId', authMiddleware_1.default, MessageController_1.sendMessage);
exports.default = router;
