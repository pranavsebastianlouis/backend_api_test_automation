import { request } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { tokenOutSchema } from './tests/utils/schemas/auth.zod';
import { uniqueEmail, strongPassword } from './tests/fixtures/testData';
import { DEFAULT_EXTRA_HEADERS } from './tests/utils/httpDefaults';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function globalSetup() {
  const authBase = process.env.AUTH_BASE_URL ?? 'http://localhost:9000';
  const cacheDir = path.join(__dirname, '.cache');
  const cacheFile = path.join(cacheDir, 'bearer.json');

  fs.mkdirSync(cacheDir, { recursive: true });

  const ctx = await request.newContext({
    baseURL: authBase,
    extraHTTPHeaders: DEFAULT_EXTRA_HEADERS,
  });

  let accessToken: string;
  let userId: string;
  let email: string;

  const envEmail = process.env.E2E_USER_EMAIL;
  const envPassword = process.env.E2E_USER_PASSWORD;

  if (envEmail && envPassword) {
    const loginRes = await ctx.post('/auth/login', {
      data: { email: envEmail, password: envPassword },
      failOnStatusCode: false,
    });
    if (!loginRes.ok()) {
      throw new Error(`global-setup: login failed for ${envEmail}: ${loginRes.status()} ${await loginRes.text()}`);
    }
    const parsed = tokenOutSchema.parse(await loginRes.json());
    accessToken = parsed.access_token;
    userId = parsed.user.id;
    email = parsed.user.email;
  } else {
    email = uniqueEmail('setup');
    const password = strongPassword();
    const reg = await ctx.post('/auth/register', {
      data: {
        email,
        password,
        first_name: 'E2E',
        last_name: 'Setup',
        phone: '0000000000',
      },
      failOnStatusCode: false,
    });
    if (!reg.ok()) {
      throw new Error(`global-setup: register failed: ${reg.status()} ${await reg.text()}`);
    }
    const parsed = tokenOutSchema.parse(await reg.json());
    accessToken = parsed.access_token;
    userId = parsed.user.id;
    email = parsed.user.email;
  }

  fs.writeFileSync(
    cacheFile,
    JSON.stringify({ accessToken, userId, email }, null, 2),
    'utf8',
  );

  await ctx.dispose();
}

export default globalSetup;
