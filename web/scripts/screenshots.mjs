#!/usr/bin/env node
/**
 * screenshots.mjs — Capture all app screens for store submissions.
 *
 * Usage:
 *   node scripts/screenshots.mjs [--device iPhone14] [--out screenshots]
 *
 * Requires: npx playwright install chromium (one-time)
 *
 * The script seeds localStorage with realistic player data so every
 * screen renders with content instead of empty/loading states.
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { execSync, spawn } from 'child_process';

// ─── Config ──────────────────────────────────────────────────────────

const DEVICES = {
  'iPhone14':    { width: 390,  height: 844,  scale: 3 },
  'iPhone14Pro': { width: 393,  height: 852,  scale: 3 },
  'iPadPro':     { width: 1024, height: 1366, scale: 2 },
  'Pixel7':      { width: 412,  height: 915,  scale: 2.625 },
  'Desktop':     { width: 1280, height: 800,  scale: 1 },
};

const DEFAULT_DEVICE = 'iPhone14';
const DEFAULT_OUT = 'screenshots/store';
const BASE_URL = 'http://localhost:5173';
const WAIT_MS = 800; // wait for animations/lazy-load

// ─── Seed data ───────────────────────────────────────────────────────

const SEED_PLAYER = { name: 'Captain' };

const SEED_STATS = {
  wins: 42, losses: 18, totalShots: 847, totalHits: 412, totalXP: 3200,
};

const SEED_SETTINGS = { gridSize: 10, difficulty: 'hard' };

const SEED_HISTORY = [
  {
    id: 'match-001',
    date: new Date(Date.now() - 3600_000).toISOString(),
    result: 'victory',
    score: 850,
    gridSize: 10,
    difficulty: 'hard',
    stats: {
      score: 850, accuracy: 0.72, shotsFired: 32, shotsHit: 23,
      shotsToWin: 17, shipsSurvived: 3, totalShips: 5, longestStreak: 5,
      firstBloodTurn: 1, perfectKills: 2, killEfficiency: [],
    },
  },
  {
    id: 'match-002',
    date: new Date(Date.now() - 86400_000).toISOString(),
    result: 'defeat',
    score: 320,
    gridSize: 10,
    difficulty: 'hard',
    stats: {
      score: 320, accuracy: 0.48, shotsFired: 44, shotsHit: 21,
      shotsToWin: 0, shipsSurvived: 0, totalShips: 5, longestStreak: 3,
      firstBloodTurn: 2, perfectKills: 0, killEfficiency: [],
    },
  },
  {
    id: 'match-003',
    date: new Date(Date.now() - 172800_000).toISOString(),
    result: 'victory',
    score: 720,
    gridSize: 10,
    difficulty: 'normal',
    stats: {
      score: 720, accuracy: 0.65, shotsFired: 28, shotsHit: 18,
      shotsToWin: 17, shipsSurvived: 4, totalShips: 5, longestStreak: 4,
      firstBloodTurn: 1, perfectKills: 1, killEfficiency: [],
    },
  },
];

// ─── Routes to capture ───────────────────────────────────────────────

const SCREENS = [
  { name: '01-splash',        path: '/',              waitFor: 'BATTLESHIP' },
  { name: '02-login',         path: '/login',         setup: 'clearPlayer' },
  { name: '03-menu',          path: '/menu' },
  { name: '04-tutorial',      path: '/tutorial' },
  { name: '05-placement',     path: '/placement' },
  { name: '06-settings',      path: '/settings' },
  { name: '07-profile',       path: '/profile' },
  { name: '08-match-history', path: '/match-history' },
  { name: '09-match-detail',  path: '/match-detail',  setup: 'seedMatchDetail' },
  { name: '10-wallet',        path: '/wallet' },
  { name: '11-wallet-setup',  path: '/wallet-setup' },
  { name: '12-pvp-mode',      path: '/pvp-mode' },
  { name: '13-pvp-friend',    path: '/pvp-friend' },
  { name: '14-pvp-lobby',     path: '/pvp-lobby' },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let device = DEFAULT_DEVICE;
  let out = DEFAULT_OUT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--device' && args[i + 1]) device = args[++i];
    if (args[i] === '--out' && args[i + 1]) out = args[++i];
    if (args[i] === '--help') {
      console.log(`Usage: node scripts/screenshots.mjs [--device ${Object.keys(DEVICES).join('|')}] [--out dir]`);
      process.exit(0);
    }
  }

  if (!DEVICES[device]) {
    console.error(`Unknown device: ${device}. Available: ${Object.keys(DEVICES).join(', ')}`);
    process.exit(1);
  }

  return { device, out };
}

async function seedLocalStorage(page) {
  await page.evaluate(({ player, stats, settings, history, tutorial }) => {
    localStorage.setItem('@battleship_user', JSON.stringify(player));
    localStorage.setItem('@battleship_scores', JSON.stringify(stats));
    localStorage.setItem('@battleship_settings', JSON.stringify(settings));
    localStorage.setItem('@battleship_history', JSON.stringify(history));
    localStorage.setItem('@battleship_tutorial', 'true');
    localStorage.setItem('@stealth_language', 'en');
  }, {
    player: SEED_PLAYER,
    stats: SEED_STATS,
    settings: SEED_SETTINGS,
    history: SEED_HISTORY,
    tutorial: true,
  });
}

async function checkDevServer() {
  try {
    const resp = await fetch(BASE_URL);
    return resp.ok;
  } catch {
    return false;
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const { device, out } = parseArgs();
  const spec = DEVICES[device];
  const outDir = resolve(process.cwd(), out, device);

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Check dev server
  const serverUp = await checkDevServer();
  let devProcess = null;

  if (!serverUp) {
    console.log('Starting dev server...');
    devProcess = spawn('npx', ['vite', '--port', '5173'], {
      cwd: resolve(process.cwd()),
      stdio: 'ignore',
      detached: true,
    });

    // Wait for server
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await checkDevServer()) break;
    }

    if (!await checkDevServer()) {
      console.error('Dev server failed to start');
      devProcess.kill();
      process.exit(1);
    }
  }

  console.log(`\nCapturing ${SCREENS.length} screens — ${device} (${spec.width}x${spec.height})`);
  console.log(`Output: ${outDir}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: spec.scale,
  });
  const page = await context.newPage();

  // Initial seed
  await page.goto(BASE_URL);
  await seedLocalStorage(page);

  for (const screen of SCREENS) {
    try {
      // Per-screen setup
      if (screen.setup === 'clearPlayer') {
        await page.evaluate(() => localStorage.removeItem('@battleship_user'));
      }
      if (screen.setup === 'seedMatchDetail') {
        await page.evaluate((match) => {
          sessionStorage.setItem('matchDetail', JSON.stringify(match));
        }, SEED_HISTORY[0]);
      }

      await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(WAIT_MS);

      if (screen.waitFor) {
        await page.waitForSelector(`text=${screen.waitFor}`, { timeout: 5000 }).catch(() => {});
      }

      // Re-seed player for screens after login
      if (screen.setup === 'clearPlayer') {
        await seedLocalStorage(page);
      }

      const filePath = join(outDir, `${screen.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  ✓ ${screen.name}`);
    } catch (err) {
      console.log(`  ✗ ${screen.name} — ${err.message}`);
    }
  }

  await browser.close();

  if (devProcess) {
    process.kill(-devProcess.pid);
  }

  console.log(`\nDone! ${SCREENS.length} screenshots saved to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
