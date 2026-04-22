import { test, expect } from '@playwright/test';
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

test.describe('Cruises API', () => {
  test('GET /health returns healthy', async ({ request, baseURL }) => {
    const body = await getHealth(request, baseURL!);
    expect(healthCruisesSchema.safeParse(body).success).toBeTruthy();
  });

  test('GET /ports returns ports', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/ports');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThan(3);
    list.slice(0, 3).forEach((p) => portSchema.parse(p));
  });

  test('GET /ports/search finds Mumbai', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/ports/search', { params: { q: 'Mumbai' } });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((p) => portSchema.parse(p).city === 'Mumbai')).toBeTruthy();
  });

  test('GET /cruises/search returns cruises', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/cruises/search', {
      params: { departure_port: 'Mumbai', guests: 1 },
    });
    expect(res.status()).toBe(200);
    const body = cruiseSearchSchema.parse(await res.json());
    body.cruises.forEach((c) => cruiseOutSchema.parse(c));
  });

  test('GET /cruises/{id} returns cruise details', async ({ request, baseURL }) => {
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

  test('POST /cruise-bookings requires authentication', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/cruise-bookings', {
      data: {
        cruise_id: '00000000-0000-0000-0000-000000000002',
        ...cruiseGuestPayload(),
      },
    });
    expect(res.status()).toBe(401);
  });

  test('cruise booking lifecycle: create, list mine, get by id, cancel', async ({
    request,
    baseURL,
  }) => {
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const search = await client.get('/cruises/search', {
      params: { departure_port: 'Goa', guests: 1 },
    });
    expect(search.status()).toBe(200);
    const parsed = cruiseSearchSchema.parse(await search.json());
    test.skip(parsed.cruises.length === 0, 'No cruises from Goa');
    const cruiseId = parsed.cruises[0].id;

    const create = await client.post('/cruise-bookings', {
      headers,
      data: { cruise_id: cruiseId, ...cruiseGuestPayload() },
    });
    expect(create.status()).toBe(201);
    const booking = cruiseBookingOutSchema.parse(await create.json());

    const mine = await client.get('/cruise-bookings/my', { headers });
    expect(mine.status()).toBe(200);
    const mineList = (await mine.json()) as unknown[];
    expect(mineList.some((b) => cruiseBookingOutSchema.parse(b).id === booking.id)).toBeTruthy();

    const one = await client.get(`/cruise-bookings/${booking.id}`, { headers });
    expect(one.status()).toBe(200);
    cruiseBookingOutSchema.parse(await one.json());

    const cancel = await client.patch(`/cruise-bookings/${booking.id}/cancel`, { headers });
    expect(cancel.status()).toBe(200);
  });

  test('GET /destinations/top returns destinations', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/destinations/top');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as { city: string; starting_price: number }[];
    expect(list.length).toBeGreaterThan(0);
  });
});
