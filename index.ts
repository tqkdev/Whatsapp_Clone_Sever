import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import User from './src/routes/User';
import Conversation from './src/routes/Conversation';
import Message from './src/routes/Message';

dotenv.config();

const port = 3001;
const app: Express = express();
const server = createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: '*',
//     },
// });
const io = new Server(server, {
    cors: {
        origin: process.env.REACT_URL,
        credentials: true,
    },
});

app.use(
    cors({
        origin: process.env.REACT_URL,
        credentials: true,
        exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
    }),
);

app.use(cors({ origin: process.env.REACT_URL, credentials: true, exposedHeaders: ['Set-Cookie', 'Date', 'ETag'] }));
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const reactUrl = process.env.REACT_URL || 'http://localhost:5173';

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

app.use('/api', User);
app.use('/api', Conversation);
app.use('/api', Message);

app.listen(port, () => {
    console.log(`Server is running....`);
});
// Sử dụng io trong các controller
export { io };
