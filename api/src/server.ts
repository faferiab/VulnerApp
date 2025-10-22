import express, { NextFunction, Request, Response } from 'express';
import * as queryGraphQl from './controllers/queryGraphql';
import path = require('path');
import os = require('os');
import { MongoClient, ServerApiVersion } from 'mongodb';
import { CategoriesRepository } from './repositories/categories.repository';
import { AppService } from './services/simple.service';
import { AppController } from './controllers/simple.controller';

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = os.hostname();

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_URL = process.env.MONGO_URL;
const URL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_URL}/?retryWrites=true&w=majority&appName=vulnerapp`
const client = new MongoClient(URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  timeoutMS: 3000
});
client.connect();

const repository = CategoriesRepository({ client });
const service = AppService({ repository });
const controller = AppController({ service });


app.use((req: Request, _: Response, next: NextFunction) => {
  console.log('Time:', Date.now(), req.originalUrl);
  next();
});

app.use(express.static('build'));

app.use('/api', controller.getRouter());

//app.get('/api/info', queryGraphQl.getUtamByFilter);

//app.get('/api/od', queryGraphQl.getOdByFilter);

app.get('/*', (_, res) => res.sendFile(path.resolve('build/index.html')));

app.listen(PORT, () =>
  console.log(`Server is running here https://${HOST}:${PORT}`)
);
