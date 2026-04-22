import { test, expect } from '@playwright/test';
import { createApiClient } from '../../utils/apiClient';
import { bearerHeaders, readStoredAuth } from '../../utils/authHelper';
import { getHealth } from '../../utils/health';
import { healthAuthSchema, tokenOutSchema, userOutSchema } from '../../utils/schemas/auth.zod';
import { uniqueEmail, strongPassword } from '../../fixtures/testData';

test.describe('Auth API', () => {
  test('GET /health returns healthy', async ({ request, baseURL }) => {
    const body = await getHealth(request, baseURL!);
    expect(healthAuthSchema.safeParse(body).success).toBeTruthy();
  });

  test('POST /auth/register creates user and returns token', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const email = uniqueEmail('reg');
    const password = strongPassword();
    const res = await client.post('/auth/register', {
      data: {
        email,
        password,
        first_name: 'Test',
        last_name: 'User',
      },
    });
    expect(res.status()).toBe(201);
    const json = tokenOutSchema.parse(await res.json());
    expect(json.user.email).toBe(email);
    expect(json.token_type).toBe('bearer');
  });

  test('POST /auth/register rejects duplicate email', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const email = uniqueEmail('dup');
    const password = strongPassword();
    const first = await client.post('/auth/register', {
      data: { email, password, first_name: 'A', last_name: 'B' },
    });
    expect(first.status()).toBe(201);

    const second = await client.post('/auth/register', {
      data: { email, password: strongPassword(), first_name: 'C', last_name: 'D' },
    });
    expect(second.status()).toBe(400);
    const err = (await second.json()) as { detail?: string };
    expect(String(err.detail)).toMatch(/already registered/i);
  });

  test('POST /auth/login accepts valid credentials', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const email = uniqueEmail('login');
    const password = strongPassword();
    const reg = await client.post('/auth/register', {
      data: { email, password, first_name: 'L', last_name: 'N' },
    });
    expect(reg.status()).toBe(201);

    const res = await client.post('/auth/login', { data: { email, password } });
    expect(res.status()).toBe(200);
    tokenOutSchema.parse(await res.json());
  });

  test('POST /auth/login rejects invalid password', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const email = uniqueEmail('badlogin');
    const password = strongPassword();
    await client.post('/auth/register', {
      data: { email, password, first_name: 'X', last_name: 'Y' },
    });

    const res = await client.post('/auth/login', {
      data: { email, password: `${password}_wrong` },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /auth/me requires authentication', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/auth/me');
    expect(res.status()).toBe(401);
  });

  test('GET /auth/me returns profile when authenticated', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const { accessToken, email } = readStoredAuth();
    const res = await client.get('/auth/me', { headers: bearerHeaders(accessToken) });
    expect(res.status()).toBe(200);
    const user = userOutSchema.parse(await res.json());
    expect(user.email).toBe(email);
  });

  test('PUT /auth/profile updates fields', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const res = await client.put('/auth/profile', {
      headers: bearerHeaders(accessToken),
      data: { first_name: 'Updated', phone: '1234567890' },
    });
    expect(res.status()).toBe(200);
    const user = userOutSchema.parse(await res.json());
    expect(user.first_name).toBe('Updated');
    expect(user.phone).toBe('1234567890');
  });
});
