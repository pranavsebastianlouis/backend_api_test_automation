import { test, expect } from '../../fixtures/test';
import { createApiClient } from '../../utils/apiClient';
import { bearerHeaders, readStoredAuth } from '../../utils/authHelper';
import { getHealth } from '../../utils/health';
import {
  cruiseBookingOutSchema,
  cruiseOutSchema,
  cruiseSearchSchema,
  healthCruisesSchema,
  portSchema,
} from '../../utils/schemas/cruises.zod';
import { cruiseGuestPayload } from '../../fixtures/testData';
import { applyAllureMeta } from '../../utils/allureMeta';

test.describe('Cruises API', () => {
  test('TC-CRU-001 GET /health returns healthy', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-01',
      storyName: 'Cruises Service Health & Availability',
      testCaseId: 'TC-CRU-001',
      scenarioId: 'TS-CRU-01',
    });
    const body = await getHealth(request, baseURL!);
    expect(healthCruisesSchema.safeParse(body).success).toBeTruthy();
  });

  test('TC-CRU-002 GET /ports returns ports', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-02',
      storyName: 'Port Management',
      testCaseId: 'TC-CRU-002',
      scenarioId: 'TS-CRU-02',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/ports');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThan(3);
    list.slice(0, 3).forEach((p) => portSchema.parse(p));
  });

  test('TC-CRU-003 GET /ports/search valid query returns results', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-02',
      storyName: 'Port Management',
      testCaseId: 'TC-CRU-003',
      scenarioId: 'TS-CRU-03',
    });
    const client = createApiClient(request, baseURL!);
    // Seed data differs between environments; any query that returns >=1 row qualifies.
    const res = await client.get('/ports/search', { params: { q: 'Mum' } });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThanOrEqual(1);
    list.forEach((p) => portSchema.parse(p));
  });

  test('TC-CRU-004 GET /ports/search no match returns empty list', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-02',
      storyName: 'Port Management',
      testCaseId: 'TC-CRU-004',
      scenarioId: 'TS-CRU-04',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/ports/search', { params: { q: 'ZZZNOTEXIST' } });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list).toEqual([]);
  });

  test('TC-CRU-005 GET /ports/search missing q returns 422', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-02',
      storyName: 'Port Management',
      testCaseId: 'TC-CRU-005',
      scenarioId: 'TS-CRU-05',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/ports/search');
    expect(res.status()).toBe(422);
  });

  test('TC-CRU-006 GET /cruises/search with no filters returns cruises+total', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-03',
      storyName: 'Cruise Search',
      testCaseId: 'TC-CRU-006',
      scenarioId: 'TS-CRU-06',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/cruises/search');
    expect(res.status()).toBe(200);
    const body = cruiseSearchSchema.parse(await res.json());
    expect(typeof body.total).toBe('number');
    expect(Array.isArray(body.cruises)).toBeTruthy();
  });

  test('TC-CRU-007 GET /cruises/search filter by guests returns results with capacity', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-03',
      storyName: 'Cruise Search',
      testCaseId: 'TC-CRU-007',
      scenarioId: 'TS-CRU-07',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/cruises/search', { params: { guests: 2 } });
    expect(res.status()).toBe(200);
    const body = cruiseSearchSchema.parse(await res.json());
    body.cruises.forEach((c) => {
      const parsed = cruiseOutSchema.parse(c);
      expect(parsed.available_cabins).toBeGreaterThanOrEqual(2);
    });
  });

  test('TC-CRU-008 GET /cruises/search filter by date returns cruises+total', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-03',
      storyName: 'Cruise Search',
      testCaseId: 'TC-CRU-008',
      scenarioId: 'TS-CRU-08',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/cruises/search', { params: { date: '2025-01-01' } });
    expect(res.status()).toBe(200);
    cruiseSearchSchema.parse(await res.json());
  });

  test('TC-CRU-009 GET /cruises/{id} not found returns 404', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-03',
      storyName: 'Cruise Search',
      testCaseId: 'TC-CRU-009',
      scenarioId: 'TS-CRU-09',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/cruises/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
  });

  test('TC-CRU-019 GET /cruises/{id} returns cruise details for valid cruise', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-03',
      storyName: 'Cruise Search',
      testCaseId: 'TC-CRU-019',
      scenarioId: 'TS-CRU-19',
    });
    const client = createApiClient(request, baseURL!);
    const search = await client.get('/cruises/search', { params: { guests: 1 } });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    expect(parsed.cruises.length).toBeGreaterThan(0);
    const id = parsed.cruises[0].id;

    const res = await client.get(`/cruises/${id}`);
    expect(res.status()).toBe(200);
    cruiseOutSchema.parse(await res.json());
  });

  test('TC-CRU-016 POST /cruise-bookings requires authentication', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-016',
      scenarioId: 'TS-CRU-16',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/cruise-bookings', {
      data: {
        cruise_id: '00000000-0000-0000-0000-000000000002',
        ...cruiseGuestPayload(),
      },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-CRU-010 POST /cruise-bookings creates booking (success)', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-010',
      scenarioId: 'TS-CRU-10',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const search = await client.get('/cruises/search', { params: { guests: 1 } });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    test.skip(parsed.cruises.length === 0, 'No cruises found for guests=1');
    const cruiseId = parsed.cruises[0].id;

    const create = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: cruiseId, ...cruiseGuestPayload() },
    });
    expect(create.status()).toBe(201);
    cruiseBookingOutSchema.parse(await create.json());
  });

  test('TC-CRU-011 GET /cruise-bookings/my returns my bookings', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-011',
      scenarioId: 'TS-CRU-11',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);
    const mine = await client.get('/cruise-bookings/my', { headers });
    expect(mine.status()).toBe(200);
    const list = (await mine.json()) as unknown[];
    expect(Array.isArray(list)).toBeTruthy();
  });

  test('TC-CRU-012 GET /cruise-bookings/{id} returns booking by id', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-012',
      scenarioId: 'TS-CRU-12',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const search = await client.get('/cruises/search', { params: { guests: 1 } });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    test.skip(parsed.cruises.length === 0, 'No cruises found for guests=1');
    const cruiseId = parsed.cruises[0].id;

    const create = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: cruiseId, ...cruiseGuestPayload() },
    });
    expect(create.status()).toBe(201);
    const booking = cruiseBookingOutSchema.parse(await create.json());

    const one = await client.get(`/cruise-bookings/${booking.id}`, { headers });
    expect(one.status()).toBe(200);
    cruiseBookingOutSchema.parse(await one.json());
  });

  test('TC-CRU-013 GET /cruise-bookings/{id} without token returns 401', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-013',
      scenarioId: 'TS-CRU-13',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const search = await client.get('/cruises/search', { params: { guests: 1 } });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    test.skip(parsed.cruises.length === 0, 'No cruises found for guests=1');
    const cruiseId = parsed.cruises[0].id;

    const create = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: cruiseId, ...cruiseGuestPayload() },
    });
    expect(create.status()).toBe(201);
    const booking = cruiseBookingOutSchema.parse(await create.json());

    const res = await client.get(`/cruise-bookings/${booking.id}`);
    expect(res.status()).toBe(401);
  });

  test('TC-CRU-014 PATCH /cruise-bookings/{id}/cancel cancels booking', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-014',
      scenarioId: 'TS-CRU-14',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const search = await client.get('/cruises/search', { params: { guests: 1 } });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    test.skip(parsed.cruises.length === 0, 'No cruises found for guests=1');
    const cruiseId = parsed.cruises[0].id;

    const create = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: cruiseId, ...cruiseGuestPayload() },
    });
    expect(create.status()).toBe(201);
    const booking = cruiseBookingOutSchema.parse(await create.json());

    const cancel = await client.patch(`/cruise-bookings/${booking.id}/cancel`, { headers });
    expect(cancel.status()).toBe(200);
  });

  test('TC-CRU-015 PATCH /cruise-bookings/{id}/cancel again returns 400', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-015',
      scenarioId: 'TS-CRU-15',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const search = await client.get('/cruises/search', { params: { guests: 1 } });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    test.skip(parsed.cruises.length === 0, 'No cruises found for guests=1');
    const cruiseId = parsed.cruises[0].id;

    const create = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: cruiseId, ...cruiseGuestPayload() },
    });
    expect(create.status()).toBe(201);
    const booking = cruiseBookingOutSchema.parse(await create.json());

    const first = await client.patch(`/cruise-bookings/${booking.id}/cancel`, { headers });
    expect(first.status()).toBe(200);

    const second = await client.patch(`/cruise-bookings/${booking.id}/cancel`, { headers });
    expect(second.status()).toBe(400);
    const body = (await second.json()) as { detail?: string };
    expect(String(body.detail)).toMatch(/already cancelled/i);
  });

  test('TC-CRU-017 POST /cruise-bookings invalid cruise_id returns 404', async ({
    request,
    baseURL,
  }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-04',
      storyName: 'Cruise Booking Management',
      testCaseId: 'TC-CRU-017',
      scenarioId: 'TS-CRU-17',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);
    const res = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: '00000000-0000-0000-0000-000000000000', ...cruiseGuestPayload() },
    });
    expect(res.status()).toBe(404);
  });

  test('TC-CRU-018 GET /destinations/top returns destinations', async ({ request, baseURL }) => {
    await applyAllureMeta({
      epicId: 'EP-03',
      epicName: 'Cruises API Testing',
      storyId: 'ST-CRU-05',
      storyName: 'Cruise Destinations',
      testCaseId: 'TC-CRU-018',
      scenarioId: 'TS-CRU-18',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/destinations/top');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as { city: string; starting_price: number }[];
    expect(list.length).toBeGreaterThan(0);
  });
});
