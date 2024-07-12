import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';

import User from './src/routes/User';
import Conversation from './src/routes/Conversation';
import Message from './src/routes/Message';

const port = 3001;
const app: Express = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));

// // Route để lấy conversationId
// app.get('/api/conversations/:conversationId', (req: Request, res: Response) => {
//     const { conversationId } = req.params;
//     console.log(conversationId); // In ra conversationId từ req.params

//     // Xử lý logic tiếp theo
//     res.send(`Conversation ID: ${conversationId}`);
// });

app.use('/api', User);
app.use('/api', Conversation);
app.use('/api', Message);

app.listen(port, () => {
    console.log(`Server is running....`);
});
