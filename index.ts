import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';

import User from './src/routes/User';
import Conversation from './src/routes/Conversation';

const port = 3001;
const app: Express = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api', User);
app.use('/api', Conversation);

app.listen(port, () => {
    console.log(`Server is running....`);
});
