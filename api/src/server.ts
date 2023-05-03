import express, { NextFunction, Request, Response } from 'express';
import * as queryGraphQl from './controllers/queryGraphql';
import path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use((req: Request, _: Response, next: NextFunction) => {
  console.log('Time:', Date.now(), req.originalUrl);
  next();
});

app.use(express.static('build'))

app.get('/api/info', queryGraphQl.getUtamByFilter);

app.get('/api/od', queryGraphQl.getOdByFilter);

app.get('/*', (_, res) => res.sendFile(path.resolve('build/index.html')));

app.listen(PORT, () =>
  console.log(`Server is running here https://localhost:${PORT}`)
);
