import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authUrl = process.env.AUTH_BASE_URL ?? 'http://localhost:9000';
const airlinesUrl = process.env.AIRLINES_BASE_URL ?? 'http://localhost:9001';
const cruisesUrl = process.env.CRUISES_BASE_URL ?? 'http://localhost:9002';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true, suiteTitle: false }],
    ['github'],
  ],
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  use: {
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  expect: {
    timeout: 15_000,
  },
  timeout: 60_000,
  projects: [
    {
      name: 'auth-api',
      testMatch: /api\/auth\/.*\.spec\.ts/,
      use: { baseURL: authUrl },
    },
    {
      name: 'airlines-api',
      testMatch: /api\/airlines\/.*\.spec\.ts/,
      use: { baseURL: airlinesUrl },
    },
    {
      name: 'cruises-api',
      testMatch: /api\/cruises\/.*\.spec\.ts/,
      use: { baseURL: cruisesUrl },
    },
    {
      name: 'coverage',
      testMatch: /api\/testcaseCoverage\.spec\.ts/,
      use: {},
    },
  ],
});
