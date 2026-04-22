import { test, expect } from '@playwright/test';
import { createApiClient } from '../../utils/apiClient';
import { bearerHeaders, readStoredAuth } from '../../utils/authHelper';
import { getHealth } from '../../utils/health';
import {
  airportSchema,
  bookingOutSchema,
  flightOutSchema,
  flightSearchSchema,
  healthAirlinesSchema,
} from '../../utils/schemas/airlines.zod';
import { futureFlightDate, passengerPayload } from '../../fixtures/testData';
import { findFlightsForRoute } from '../../utils/flightSearchHelpers';

test.describe('Airlines API', () => {
  test('GET /health returns healthy', async ({ request, baseURL }) => {
    const body = await getHealth(request, baseURL!);
    expect(healthAirlinesSchema.safeParse(body).success).toBeTruthy();
  });

  test('GET /airports returns a list of airports', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/airports');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThan(3);
    list.slice(0, 3).forEach((a) => airportSchema.parse(a));
  });

  test('GET /airports/search finds Mumbai (BOM)', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/airports/search', { params: { q: 'BOM' } });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThanOrEqual(1);
    const bom = list.map((x) => airportSchema.parse(x)).find((a) => a.iata_code === 'BOM');
    expect(bom?.city).toBe('Mumbai');
  });

  test('GET /flights/search returns flights for valid route and date', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const date = futureFlightDate(7);
    const res = await client.get('/flights/search', {
      params: { origin: 'BOM', destination: 'DEL', date, passengers: 1, cabin_class: 'Economy' },
    });
    expect(res.status()).toBe(200);
    const body = flightSearchSchema.parse(await res.json());
    expect(body.search_params.origin).toBe('BOM');
    body.flights.forEach((f) => flightOutSchema.parse(f));
  });

  test('GET /flights/search returns 404 for unknown airport', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const date = futureFlightDate(3);
    const res = await client.get('/flights/search', {
      params: { origin: 'XXX', destination: 'DEL', date, passengers: 1, cabin_class: 'Economy' },
    });
    expect(res.status()).toBe(404);
  });

  test('GET /flights/{id} returns flight details', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const found = await findFlightsForRoute(client, 'DEL', 'BLR');
    test.skip(!found, 'No seeded flights found for DEL→BLR in scanned date window');
    const flightId = found!.flights[0].id;

    const res = await client.get(`/flights/${flightId}`);
    expect(res.status()).toBe(200);
    flightOutSchema.parse(await res.json());
  });

  test('POST /bookings requires authentication', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/bookings', {
      data: {
        flight_id: '00000000-0000-0000-0000-000000000001',
        ...passengerPayload(),
      },
    });
    expect(res.status()).toBe(401);
  });

  test('booking lifecycle: create, list mine, get by id, cancel', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const found = await findFlightsForRoute(client, 'BOM', 'DEL');
    test.skip(!found, 'No seeded flights found for BOM→DEL in scanned date window');
    const flightId = found!.flights[0].id;

    const create = await client.post('/bookings', {
      headers,
      data: { flight_id: flightId, ...passengerPayload() },
    });
    expect(create.status()).toBe(201);
    const booking = bookingOutSchema.parse(await create.json());

    const mine = await client.get('/bookings/my', { headers });
    expect(mine.status()).toBe(200);
    const mineList = (await mine.json()) as unknown[];
    expect(mineList.some((b) => bookingOutSchema.parse(b).id === booking.id)).toBeTruthy();

    const one = await client.get(`/bookings/${booking.id}`, { headers });
    expect(one.status()).toBe(200);
    bookingOutSchema.parse(await one.json());

    const cancel = await client.patch(`/bookings/${booking.id}/cancel`, { headers });
    expect(cancel.status()).toBe(200);
    const cancelBody = (await cancel.json()) as { message?: string };
    expect(cancelBody.message).toMatch(/cancelled/i);
  });

  test('GET /destinations/top returns marketing destinations', async ({ request, baseURL }) => {
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/destinations/top');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as { city: string; starting_price: number }[];
    expect(list.length).toBeGreaterThan(0);
    list.forEach((d) => {
      expect(typeof d.city).toBe('string');
      expect(typeof d.starting_price).toBe('number');
    });
  });
});
