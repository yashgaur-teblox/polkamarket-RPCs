import express from 'express';
import * as dotenv from "dotenv";
import cors from "cors";

import { router } from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

export { app };
