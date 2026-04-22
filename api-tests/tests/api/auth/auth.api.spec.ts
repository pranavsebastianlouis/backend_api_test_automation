import { test, expect } from '@playwright/test';
import { createApiClient } from '../../utils/apiClient';
import { bearerHeaders, readStoredAuth } from '../../utils/authHelper';
import { getHealth } from '../../utils/health';
import { healthAuthSchema, tokenOutSchema, userOutSchema } from '../../utils/schemas/auth.zod';
import { uniqueEmail, strongPassword } from '../../fixtures/testData';
import { applyAllureMeta } from '../../utils/allureMeta';

test.describe('Auth API', () => {
  test('TC-AUTH-001 GET /health returns healthy', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-01',
      storyName: 'Auth Service Health & Availability',
      testCaseId: 'TC-AUTH-001',
      scenarioId: 'TS-AUTH-01',
    });
    const body = await getHealth(request, baseURL!);
    expect(healthAuthSchema.safeParse(body).success).toBeTruthy();
  });

  test('TC-AUTH-002 POST /auth/register creates user and returns token', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-02',
      storyName: 'User Registration',
      testCaseId: 'TC-AUTH-002',
      scenarioId: 'TS-AUTH-02',
    });
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

  test('TC-AUTH-003 POST /auth/register rejects duplicate email', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-02',
      storyName: 'User Registration',
      testCaseId: 'TC-AUTH-003',
      scenarioId: 'TS-AUTH-03',
    });
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

  test('TC-AUTH-004 POST /auth/register missing email returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-02',
      storyName: 'User Registration',
      testCaseId: 'TC-AUTH-004',
      scenarioId: 'TS-AUTH-04',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/auth/register', {
      data: {
        password: strongPassword(),
        first_name: 'ApiTest',
        last_name: 'User',
      },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AUTH-005 POST /auth/register missing password returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-02',
      storyName: 'User Registration',
      testCaseId: 'TC-AUTH-005',
      scenarioId: 'TS-AUTH-05',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/auth/register', {
      data: {
        email: uniqueEmail('missingpw'),
        first_name: 'ApiTest',
        last_name: 'User',
      },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AUTH-006 POST /auth/register missing first_name returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-02',
      storyName: 'User Registration',
      testCaseId: 'TC-AUTH-006',
      scenarioId: 'TS-AUTH-06',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/auth/register', {
      data: {
        email: uniqueEmail('missingfn'),
        password: strongPassword(),
        last_name: 'User',
      },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AUTH-007 POST /auth/register invalid email returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-02',
      storyName: 'User Registration',
      testCaseId: 'TC-AUTH-007',
      scenarioId: 'TS-AUTH-07',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/auth/register', {
      data: {
        email: 'not-an-email',
        password: strongPassword(),
        first_name: 'ApiTest',
        last_name: 'User',
      },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AUTH-008 POST /auth/login accepts valid credentials', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-03',
      storyName: 'User Login',
      testCaseId: 'TC-AUTH-008',
      scenarioId: 'TS-AUTH-08',
    });
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

  test('TC-AUTH-009 POST /auth/login rejects invalid password', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-03',
      storyName: 'User Login',
      testCaseId: 'TC-AUTH-009',
      scenarioId: 'TS-AUTH-09',
    });
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

  test('TC-AUTH-010 POST /auth/login rejects non-existent email', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-03',
      storyName: 'User Login',
      testCaseId: 'TC-AUTH-010',
      scenarioId: 'TS-AUTH-10',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/auth/login', {
      data: { email: uniqueEmail('nobody'), password: strongPassword() },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-011 POST /auth/login empty credentials returns 401 or 422', async ({
    request,
    baseURL,
  }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-03',
      storyName: 'User Login',
      testCaseId: 'TC-AUTH-011',
      scenarioId: 'TS-AUTH-11',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/auth/login', { data: { email: '', password: '' } });
    expect([401, 422]).toContain(res.status());
  });

  test('TC-AUTH-013 GET /auth/me requires authentication', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-04',
      storyName: 'Profile Management',
      testCaseId: 'TC-AUTH-013',
      scenarioId: 'TS-AUTH-13',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/auth/me');
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-014 GET /auth/me invalid token returns 401', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-04',
      storyName: 'Profile Management',
      testCaseId: 'TC-AUTH-014',
      scenarioId: 'TS-AUTH-14',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/auth/me', {
      headers: bearerHeaders('totally.invalid.token'),
    });
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-012 GET /auth/me returns profile when authenticated', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-04',
      storyName: 'Profile Management',
      testCaseId: 'TC-AUTH-012',
      scenarioId: 'TS-AUTH-12',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken, email } = readStoredAuth();
    const res = await client.get('/auth/me', { headers: bearerHeaders(accessToken) });
    expect(res.status()).toBe(200);
    const user = userOutSchema.parse(await res.json());
    expect(user.email).toBe(email);
  });

  test('TC-AUTH-015 PUT /auth/profile updates fields', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-04',
      storyName: 'Profile Management',
      testCaseId: 'TC-AUTH-015',
      scenarioId: 'TS-AUTH-15',
    });
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

  test('TC-AUTH-016 PUT /auth/profile without token returns 401', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-01',
      epicName: 'Auth API Testing',
      storyId: 'ST-AUTH-04',
      storyName: 'Profile Management',
      testCaseId: 'TC-AUTH-016',
      scenarioId: 'TS-AUTH-16',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.put('/auth/profile', {
      data: { first_name: 'Updated' },
    });
    expect(res.status()).toBe(401);
  });
});
