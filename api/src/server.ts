import express, { type Request, type Response } from 'express';
import { claimsRouter } from './claims.js';

export const app = express();

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    sha: process.env.GIT_SHA ?? 'unknown',
  });
});

app.use(claimsRouter);

const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;

if (isMainModule) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`api listening on ${port}`);
  });
}
