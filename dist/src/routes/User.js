"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = (0, express_1.Router)();
router.get('/users', UserController_1.getAllUsers);
router.get('/user/:userId', authMiddleware_1.default, UserController_1.getUserById);
router.post('/register', UserController_1.register);
router.post('/login', UserController_1.login);
router.post('/logout', authMiddleware_1.default, UserController_1.logout);
router.get('/searchuser/:email', authMiddleware_1.default, UserController_1.searchUser);
// /////
router.put('/user/profile/:userId', authMiddleware_1.default, UserController_1.updateUserProfile);
router.put('/users/avatar/:userId', authMiddleware_1.default, uploadMiddleware_1.upload.single('avatar'), UserController_1.uploadAvatar);
router.get('/searchfriends/:userId/:searchValue', authMiddleware_1.default, UserController_1.SearchFriends);
router.get('/searchgroups/:userId/:searchValue', authMiddleware_1.default, UserController_1.SearchGroups);
exports.default = router;
