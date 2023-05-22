// TODO: improve this, temp solution
const { JSDOM } = require('jsdom');
const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

import express from 'express';
import cors from 'cors';

import { router } from './routes';
import { queuesPath, queuesRouter } from './queues';

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
app.use(queuesPath, queuesRouter);

export { app };
