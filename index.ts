import express, { Express } from 'express';
import User from './src/routes/User';
import Student from './src/routes/index';

import cors from 'cors';
import bodyParser from 'body-parser';

const port = 3001;
const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api', User);
app.use('/api', Student);

app.listen(port, () => {
    console.log(`Server is running....`);
});
