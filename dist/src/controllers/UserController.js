"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUser = exports.logout = exports.login = exports.register = exports.generateRefreshToken = exports.generateAccessToken = exports.getUserById = exports.getAllUsers = void 0;
const Firebase_1 = require("../database/Firebase");
const firestore_1 = require("firebase/firestore");
const response_1 = require("../utils/response ");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usersRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'users');
        const snapshot = yield (0, firestore_1.getDocs)(usersRef);
        const users = snapshot.docs.map((doc) => {
            const _a = doc.data(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
            return Object.assign({ id: doc.id }, userWithoutPassword);
        });
        (0, response_1.sendSuccessResponse)(res, users, 'Users fetched successfully.');
    }
    catch (error) {
        console.error('Error fetching users:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to fetch users.');
    }
});
exports.getAllUsers = getAllUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
        const userDoc = yield (0, firestore_1.getDoc)(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const { password } = userData, userWithoutPassword = __rest(userData, ["password"]);
            (0, response_1.sendSuccessResponse)(res, userWithoutPassword, 'User fetched successfully.');
        }
        else {
            (0, response_1.sendNotFoundResponse)(res, 'User not found.');
        }
    }
    catch (error) {
        console.error('Error fetching user:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to fetch user.');
    }
});
exports.getUserById = getUserById;
// Hàm sinh mã token JWT access
const generateAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id,
    }, process.env.JWT_ACCESS_KEY, {
        expiresIn: '30000s',
    });
};
exports.generateAccessToken = generateAccessToken;
// Hàm sinh mã token JWT refresh
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id,
    }, process.env.JWT_REFRESH_KEY, {
        expiresIn: '365d',
    });
};
exports.generateRefreshToken = generateRefreshToken;
const SALT_ROUNDS = 10; // Số lượt lặp để tạo salt
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    try {
        // Kiểm tra xem username đã tồn tại chưa
        const usersRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'users');
        const querySnapshot = yield (0, firestore_1.getDocs)((0, firestore_1.query)(usersRef, (0, firestore_1.where)('email', '==', email)));
        if (!querySnapshot.empty) {
            (0, response_1.sendValidationErrorResponse)(res, [{ field: 'email', message: 'email already exists.' }], 'Registration failed.');
            return;
        }
        // Hash mật khẩu
        const hashedPassword = yield bcryptjs_1.default.hash(password, SALT_ROUNDS);
        // Lưu người dùng vào cơ sở dữ liệu
        const newUserRef = yield (0, firestore_1.addDoc)(usersRef, {
            username,
            email,
            password: hashedPassword,
            created_at: new Date(),
        });
        const newUser = {
            id: newUserRef.id,
            username,
            email,
        };
        (0, response_1.sendSuccessResponse)(res, newUser, 'Registration successful.');
    }
    catch (error) {
        console.error('Error registering user:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Registration failed.');
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Tìm người dùng trong cơ sở dữ liệu
        const usersRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'users');
        const querySnapshot = yield (0, firestore_1.getDocs)((0, firestore_1.query)(usersRef, (0, firestore_1.where)('email', '==', email)));
        if (querySnapshot.empty) {
            (0, response_1.sendNotFoundResponse)(res, 'email not found.');
            return;
        }
        // Lấy thông tin người dùng từ snapshot đầu tiên
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        // So sánh mật khẩu đã hash
        const isPasswordValid = yield bcryptjs_1.default.compare(password, userData.password);
        if (!isPasswordValid) {
            (0, response_1.sendValidationErrorResponse)(res, [{ field: 'password', message: 'Invalid password.' }], 'Login failed.');
            return;
        }
        // Tạo token access và refresh
        const accessToken = (0, exports.generateAccessToken)({ _id: userDoc.id });
        const refreshToken = (0, exports.generateRefreshToken)({ _id: userDoc.id });
        // Lưu refresh token vào Firebase
        const refreshTokensRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'refreshTokens');
        const newRefreshToken = {
            userId: userDoc.id,
            refreshToken: refreshToken,
            created_at: new Date(),
        };
        yield (0, firestore_1.addDoc)(refreshTokensRef, newRefreshToken);
        // Đặt token vào cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // Nên để là true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false, // Nên để là true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
        });
        const { password: _ } = userData, userWithoutPassword = __rest(userData, ["password"]);
        (0, response_1.sendSuccessResponse)(res, { id: userDoc.id, user: userWithoutPassword }, 'Login successful.');
    }
    catch (error) {
        console.error('Error logging in:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Login failed.');
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        (0, response_1.sendNotFoundResponse)(res, 'Refresh token not found.');
        return;
    }
    try {
        // Tìm và xóa refresh token trong cơ sở dữ liệu
        const refreshTokensRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'refreshTokens');
        const querySnapshot = yield (0, firestore_1.getDocs)((0, firestore_1.query)(refreshTokensRef, (0, firestore_1.where)('refreshToken', '==', refreshToken)));
        if (querySnapshot.empty) {
            (0, response_1.sendNotFoundResponse)(res, 'Refresh token not found in database.');
            return;
        }
        // Xóa refresh token
        const refreshTokenDoc = querySnapshot.docs[0];
        yield (0, firestore_1.deleteDoc)((0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'refreshTokens', refreshTokenDoc.id));
        // Xóa cookie
        res.clearCookie('refreshToken', { path: '/' });
        res.clearCookie('accessToken', { path: '/' });
        (0, response_1.sendSuccessResponse)(res, {}, 'Logout successful.');
    }
    catch (error) {
        console.error('Error logging out:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Logout failed.');
    }
});
exports.logout = logout;
const searchUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.query;
    if (!username) {
        (0, response_1.sendNotFoundResponse)(res, 'Missing username.');
        return;
    }
    try {
        const usersRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'users');
        const userQuery = (0, firestore_1.query)(usersRef, (0, firestore_1.where)('username', '>=', username), (0, firestore_1.where)('username', '<=', username + '\uf8ff'));
        const querySnapshot = yield (0, firestore_1.getDocs)(userQuery);
        if (querySnapshot.empty) {
            (0, response_1.sendNotFoundResponse)(res, 'No users found.');
            return;
        }
        const users = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const { password } = userData, userWithoutPassword = __rest(userData, ["password"]);
            users.push(Object.assign({ id: doc.id }, userWithoutPassword));
        });
        (0, response_1.sendSuccessResponse)(res, users, 'Users found.');
    }
    catch (error) {
        console.error('Error searching users:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to search users.');
    }
});
exports.searchUser = searchUser;
