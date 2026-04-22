/**
 * Polls /health on all LUXE APIs until healthy or timeout.
 * Uses global fetch (Node 18+). Run from repo root or api-tests; URLs default to localhost.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadDotEnv();

const urls = [
  process.env.AUTH_BASE_URL ?? 'http://127.0.0.1:9000',
  process.env.AIRLINES_BASE_URL ?? 'http://127.0.0.1:9001',
  process.env.CRUISES_BASE_URL ?? 'http://127.0.0.1:9002',
];

const TIMEOUT_MS = Number(process.env.WAIT_SERVICES_TIMEOUT_MS ?? 120_000);
const INTERVAL_MS = 2000;

async function checkHealth(base) {
  const u = `${base.replace(/\/$/, '')}/health`;
  const res = await fetch(u, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return false;
  const body = await res.json();
  return body?.status === 'healthy';
}

async function main() {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < TIMEOUT_MS) {
    attempt += 1;
    const results = await Promise.all(
      urls.map(async (base) => {
        try {
          return await checkHealth(base);
        } catch {
          return false;
        }
      }),
    );
    if (results.every(Boolean)) {
      console.log(`All services healthy after ${attempt} attempt(s).`);
      process.exit(0);
    }
    console.log(
      `[wait] attempt ${attempt}: ` +
        urls.map((b, i) => `${b}=${results[i] ? 'ok' : 'down'}`).join(' | '),
    );
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.error('Timeout waiting for services to become healthy.');
  process.exit(1);
}

main();
