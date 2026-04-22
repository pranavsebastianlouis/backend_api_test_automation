import type { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createApiClient } from './apiClient';

export type StoredAuth = {
  accessToken: string;
  userId: string;
  email: string;
};

const defaultCacheFile = () =>
  path.resolve(process.cwd(), '.cache', 'bearer.json');

export function bearerHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function readStoredAuth(cacheFile = defaultCacheFile()): StoredAuth {
  const raw = fs.readFileSync(cacheFile, 'utf8');
  return JSON.parse(raw) as StoredAuth;
}

export async function registerUser(
  request: APIRequestContext,
  authBaseUrl: string,
  body: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  },
) {
  const client = createApiClient(request, authBaseUrl);
  return client.post('/auth/register', { data: body });
}

export async function loginUser(
  request: APIRequestContext,
  authBaseUrl: string,
  body: { email: string; password: string },
) {
  const client = createApiClient(request, authBaseUrl);
  return client.post('/auth/login', { data: body });
}
