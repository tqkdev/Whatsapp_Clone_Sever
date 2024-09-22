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
exports.SearchGroups = exports.SearchFriends = exports.uploadAvatar = exports.updateUserProfile = exports.searchUser = exports.logout = exports.login = exports.register = exports.generateRefreshToken = exports.generateAccessToken = exports.getUserById = exports.getAllUsers = void 0;
const Firebase_1 = require("../database/Firebase");
const firestore_1 = require("firebase/firestore");
const response_1 = require("../utils/response ");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
// ///////
const Firebase_2 = require("../database/Firebase");
const storage_1 = require("firebase/storage");
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
            const { password, friendRequests, friends } = userData, userWithoutPassword = __rest(userData, ["password", "friendRequests", "friends"]);
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
    const { username, email, password, avatarUrl, dateOfBirth, gender } = req.body;
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
            avatarUrl: avatarUrl || 'https://res.cloudinary.com/dyoctwffi/image/upload/v1721403257/ORGAVIVE/avt_tpgoie.png',
            dateOfBirth: dateOfBirth || '1/1/1945',
            gender: gender || 'khac',
            created_at: new Date(),
        });
        const newUser = {
            id: newUserRef.id,
            username,
            email,
            avatarUrl,
            dateOfBirth,
            gender,
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
    const { email } = req.params;
    try {
        // Tạo truy vấn để tìm người dùng theo email
        const usersRef = (0, Firebase_1.collection)(Firebase_1.firestoredatabase, 'users');
        const q = (0, firestore_1.query)(usersRef, (0, firestore_1.where)('email', '==', email));
        const querySnapshot = yield (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty) {
            (0, response_1.sendNotFoundResponse)(res, 'User not found.');
            return;
        }
        // Giả sử chỉ có một người dùng với email duy nhất
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id; // Lấy ID của tài liệu
        const { password } = userData, userWithoutPassword = __rest(userData, ["password"]);
        // Thêm userId vào đối tượng người dùng mà không có mật khẩu
        const responseData = Object.assign({ userId }, userWithoutPassword);
        (0, response_1.sendSuccessResponse)(res, responseData, 'User fetched successfully.');
    }
    catch (error) {
        console.error('Error fetching user:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to fetch user.');
    }
});
exports.searchUser = searchUser;
// Hàm cập nhật thông tin người dùng
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Lấy userId từ URL params
    const { username, dateOfBirth, gender } = req.body; // Lấy thông tin cần cập nhật từ body của request
    // Kiểm tra đầu vào hợp lệ
    if (!username && !dateOfBirth && !gender) {
        (0, response_1.sendValidationErrorResponse)(res, [], 'No fields to update.');
        return;
    }
    try {
        // Tham chiếu đến tài liệu người dùng trong Firestore
        const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
        // Tạo đối tượng cập nhật dựa trên các trường có giá trị
        const updatedData = {};
        if (username)
            updatedData.username = username;
        if (dateOfBirth)
            updatedData.dateOfBirth = dateOfBirth;
        if (gender)
            updatedData.gender = gender;
        // Thực hiện cập nhật tài liệu
        yield (0, firestore_1.updateDoc)(userRef, updatedData);
        (0, response_1.sendSuccessResponse)(res, updatedData, 'User profile updated successfully.');
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to update user profile.');
    }
});
exports.updateUserProfile = updateUserProfile;
const uploadAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!req.file) {
        (0, response_1.sendNotFoundResponse)(res, 'No file uploaded.');
        return;
    }
    try {
        // Tạo tham chiếu tới Firebase Storage cho file ảnh
        const avatarRef = (0, storage_1.ref)(Firebase_2.storage, `avatars/${userId}/${req.file.originalname}`);
        // Upload ảnh lên Firebase Storage
        yield (0, storage_1.uploadBytes)(avatarRef, req.file.buffer);
        // Lấy URL của ảnh đã tải lên từ Firebase Storage
        const avatarUrl = yield (0, storage_1.getDownloadURL)(avatarRef);
        // Cập nhật trường avatarUrl trong Firestore cho người dùng
        const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
        yield (0, firestore_1.updateDoc)(userRef, { avatarUrl });
        (0, response_1.sendSuccessResponse)(res, { avatarUrl }, 'Avatar uploaded successfully.');
    }
    catch (error) {
        console.error('Error uploading avatar:', error);
        (0, response_1.sendNotFoundResponse)(res, 'Failed to upload avatar.');
    }
});
exports.uploadAvatar = uploadAvatar;
// Hàm lấy thông tin chi tiết của một người dùng
const getUserInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
    const userDoc = yield (0, firestore_1.getDoc)(userRef);
    if (!userDoc.exists()) {
        throw new Error('User not found.');
    }
    const userData = userDoc.data();
    const { email, password, friends, friendRequests, created_at, chats } = userData, userInfo = __rest(userData, ["email", "password", "friends", "friendRequests", "created_at", "chats"]);
    return {
        id: userId,
        userInfo,
    };
});
// Hàm SearchFriends
const SearchFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, searchValue } = req.params;
        if (!userId || !searchValue) {
            return (0, response_1.sendErrorResponse)(res, 'User ID and search value are required.');
        }
        // Lấy thông tin user
        const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
        const userDoc = yield (0, firestore_1.getDoc)(userRef);
        if (!userDoc.exists()) {
            return (0, response_1.sendErrorResponse)(res, 'User not found.');
        }
        const userData = userDoc.data();
        const { friends } = userData;
        if (!friends || friends.length === 0) {
            return (0, response_1.sendSuccessResponse)(res, [], 'No friends found.');
        }
        // Tìm kiếm bạn bè dựa vào searchValue
        const matchedFriends = [];
        for (const friendId of friends) {
            const friendInfo = yield getUserInfo(friendId);
            if (friendInfo.userInfo.username.toLowerCase().includes(searchValue.toLowerCase())) {
                matchedFriends.push(friendInfo);
            }
        }
        // Trả kết quả tìm kiếm
        (0, response_1.sendSuccessResponse)(res, matchedFriends, 'Search results for friends fetched successfully.');
    }
    catch (error) {
        console.error('Error in SearchFriends:', error);
        (0, response_1.sendErrorResponse)(res, 'Failed to search friends.');
    }
});
exports.SearchFriends = SearchFriends;
// Hàm SearchGroups
const SearchGroups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, searchValue } = req.params;
        if (!userId || !searchValue) {
            return (0, response_1.sendErrorResponse)(res, 'User ID and search value are required.');
        }
        // Lấy thông tin user
        const userRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'users', userId);
        const userDoc = yield (0, firestore_1.getDoc)(userRef);
        if (!userDoc.exists()) {
            return (0, response_1.sendErrorResponse)(res, 'User not found.');
        }
        const userData = userDoc.data();
        const { chats } = userData;
        if (!chats || chats.length === 0) {
            return (0, response_1.sendSuccessResponse)(res, [], 'No groups found.');
        }
        // Tìm kiếm trong danh sách chats của user
        const matchedGroups = [];
        for (const chatId of chats) {
            const chatRef = (0, Firebase_1.doc)(Firebase_1.firestoredatabase, 'chats', chatId);
            const chatDoc = yield (0, firestore_1.getDoc)(chatRef);
            if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                // Kiểm tra nếu có `name` hoặc kiểm tra theo `participants` nếu không có `name`
                const isMatch = chatData.name
                    ? chatData.name.toLowerCase().includes(searchValue.toLowerCase())
                    : (_a = chatData.participants) === null || _a === void 0 ? void 0 : _a.some((p) => p.username.toLowerCase().includes(searchValue.toLowerCase()));
                if (isMatch && chatData.members) {
                    // Lấy chi tiết participants bằng cách sử dụng getUserInfo
                    const detailedMembers = yield Promise.all(chatData.members.map((member) => __awaiter(void 0, void 0, void 0, function* () {
                        const userInfo = yield getUserInfo(member.id); // Gọi hàm getUserInfo để lấy chi tiết user
                        return userInfo;
                    })));
                    // Thêm participants chi tiết vào chat
                    const { messages } = chatData, data = __rest(chatData, ["messages"]);
                    matchedGroups.push(Object.assign(Object.assign({ id: chatId }, data), { members: detailedMembers }));
                }
            }
        }
        // Trả kết quả tìm kiếm
        (0, response_1.sendSuccessResponse)(res, matchedGroups, 'Search results for groups fetched successfully.');
    }
    catch (error) {
        console.error('Error in SearchGroups:', error);
        (0, response_1.sendErrorResponse)(res, 'Failed to search groups.');
    }
});
exports.SearchGroups = SearchGroups;
