"use strict";
// import { Server } from 'socket.io';
// import dotenv from 'dotenv';
// dotenv.config();
// let io: Server;
// const initializeSocket = (server: any) => {
//     io = new Server(server, {
//         cors: {
//             // origin: process.env.REACT_URL,
//             origin: '*',
//             credentials: true,
//             methods: ['GET', 'POST'],
//         },
//     });
//     io.on('connection', (socket) => {
//         console.log('a user connected');
//         socket.on('disconnect', () => {
//             console.log('user disconnected');
//         });
//         // Your other event handlers go here
//     });
// };
// const getSocketIO = () => {
//     if (!io) {
//         throw new Error('Socket.io not initialized');
//     }
//     return io;
// };
// export { initializeSocket, getSocketIO };
