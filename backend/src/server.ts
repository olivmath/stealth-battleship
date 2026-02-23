import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app.js';
import { loadCircuits } from './shared/circuits.js';
import { createSocketServer } from './ws/socket.js';
import { initStellarAsset, setupIssuerFlags } from './payment/stellar-asset.js';
import { startPaymentStream } from './payment/interactor.js';
import { c } from './log.js';

const PORT = process.env.PORT || 3000;

async function main() {
  console.log('');
  console.log(c.bgBlue('═══════════════════════════════════════'));
  console.log(c.bgBlue('   Battleship ZK — Proof Server        '));
  console.log(c.bgBlue('═══════════════════════════════════════'));
  console.log('');

  console.log(c.cyan('[server]') + ' Loading circuits...');
  const t0 = Date.now();
  await loadCircuits();
  console.log(c.cyan('[server]') + ` Circuits ready ${c.ok('✓')} ${c.time(`(${Date.now() - t0}ms)`)}`);
  console.log('');

  // Initialize Stellar BATTLE asset + SSE payment stream
  try {
    initStellarAsset();
    await setupIssuerFlags();
    startPaymentStream();
  } catch (err: any) {
    console.log(c.yellow('[payment]') + ` Stellar not initialized: ${err.message}`);
    console.log(c.yellow('[payment]') + ' PvP payment gate will be unavailable');
  }

  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(c.cyan('[server]') + ` Listening on ${c.boldCyan(`http://0.0.0.0:${PORT}`)}`);
    console.log(c.cyan('[server]') + ` Health:         ${c.green('GET')}  ${c.dim(`http://localhost:${PORT}/health`)}`);
    console.log(c.cyan('[server]') + ` Payment:        ${c.yellow('POST')} ${c.dim(`http://localhost:${PORT}/api/payment/memo`)}`);
    console.log(c.cyan('[server]') + ` WebSocket:      ${c.magenta('WS')}   ${c.dim(`ws://localhost:${PORT}`)}`);
    console.log('');
    console.log(c.bgGreen('Ready for proof requests + PvP'));
    console.log('');
  });
}

main().catch((err) => {
  console.error(c.bgRed('FATAL') + ' ' + c.err(err.message));
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(c.bgRed('UNHANDLED REJECTION') + ' ' + String(reason));
});

process.on('uncaughtException', (err) => {
  console.error(c.bgRed('UNCAUGHT EXCEPTION') + ' ' + c.err(err.message));
  console.error(err.stack);
});
