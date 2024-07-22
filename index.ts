import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import express from 'express';
import { Server } from 'socket.io';

import User from './src/routes/User';
import Conversation from './src/routes/Conversation';
import Message from './src/routes/Message';
import { createServer } from 'http';

dotenv.config();
const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.REACT_URL,
        // origin: '*',
        credentials: true,
        methods: ['GET', 'POST'],
    },
});
const userSockets = new Map<string, string>(); // Map to store userId to socketId

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

app.use(cors({ origin: process.env.REACT_URL, credentials: true, exposedHeaders: ['Set-Cookie', 'Date', 'ETag'] }));
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const reactUrl = process.env.REACT_URL || 'https://whatsapp-clone-lovat-mu.vercel.app';

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

app.use('/api', User);
app.use('/api', Conversation);
app.use('/api', Message);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// export { io };
export { io, userSockets };
