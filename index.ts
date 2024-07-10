import express, { Express, Request, Response } from 'express';
import { router } from './src/routes';
import cors from 'cors';
import bodyParser from 'body-parser';

const port = 3001;
const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api', router);

app.listen(port, () => {
    console.log(`Server is running....`);
});
