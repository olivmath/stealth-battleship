import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import boardValidityVerifyRouter from './board-validity/verify-translator.js';
import shotProofVerifyRouter from './shot-proof/verify-translator.js';
import turnsProofVerifyRouter from './turns-proof/verify-translator.js';
import { paymentRouter } from './payment/translator.js';
import { c, debug } from './log.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  debug('[health]', `${req.method} ${req.url} from ${req.ip}`);
  console.log(c.green('[health]') + ' Health check ' + c.ok('OK'));
  res.json({ status: 'ok' });
});

// Payment routes
app.use('/api/payment', paymentRouter);

// Verify routes
app.use('/api/verify', boardValidityVerifyRouter);
app.use('/api/verify', shotProofVerifyRouter);
app.use('/api/verify', turnsProofVerifyRouter);

// 404
app.use((req, res) => {
  debug('[404]', `${req.method} ${req.url} from ${req.ip}, headers=${JSON.stringify(req.headers).slice(0, 200)}`);
  console.log(c.yellow('[404]') + ` ${c.dim(req.method)} ${c.dim(req.url)}`);
  res.status(404).json({ error: 'Not found' });
});

export default app;
