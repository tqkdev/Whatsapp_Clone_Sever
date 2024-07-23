"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = (0, express_1.Router)();
router.get('/users', UserController_1.getAllUsers);
router.get('/user/:userId', authMiddleware_1.default, UserController_1.getUserById);
router.post('/register', UserController_1.register);
router.post('/login', UserController_1.login);
router.post('/logout', authMiddleware_1.default, UserController_1.logout);
router.get('/searchuser', authMiddleware_1.default, UserController_1.searchUser);
exports.default = router;
