import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

// Los IDs son BIGINT (Prisma BigInt) y JSON.stringify no los soporta nativamente.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
  this: bigint,
) {
  return this.toString();
};

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);
