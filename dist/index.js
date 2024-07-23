"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSockets = exports.io = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const User_1 = __importDefault(require("./src/routes/User"));
const Conversation_1 = __importDefault(require("./src/routes/Conversation"));
const Message_1 = __importDefault(require("./src/routes/Message"));
const http_1 = require("http");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.REACT_URL,
        // origin: '*',
        credentials: true,
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
const userSockets = new Map(); // Map to store userId to socketId
exports.userSockets = userSockets;
io.on('connection', (socket) => {
    // console.log('A user connected');
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
        // console.log(`User joined conversation: ${conversationId}`);
    });
    socket.on('setUserId', (userId) => {
        userSockets.set(userId, socket.id);
        // console.log(`User with ID: ${userId} is connected with socket ID: ${socket.id}`);
    });
    socket.on('disconnect', () => {
        // console.log('User disconnected');
        userSockets.forEach((value, key) => {
            if (value === socket.id) {
                userSockets.delete(key);
            }
        });
    });
});
// io.on('connection', (socket) => {
//     console.log('A user connected');
//     socket.on('joinConversation', (conversationId) => {
//         socket.join(conversationId);
//         console.log(`User joined conversation: ${conversationId}`);
//     });
//     socket.on('disconnect', () => {
//         console.log('User disconnected');
//     });
// });
app.use((0, cors_1.default)({ origin: process.env.REACT_URL, credentials: true, exposedHeaders: ['Set-Cookie', 'Date', 'ETag'] }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
const reactUrl = process.env.REACT_URL || 'http://localhost:3000';
// Add headers before the routes are defined
app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', reactUrl);
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Pass to next layer of middleware
    next();
});
// initializeSocket(server);
app.use('/api', User_1.default);
app.use('/api', Conversation_1.default);
app.use('/api', Message_1.default);
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
