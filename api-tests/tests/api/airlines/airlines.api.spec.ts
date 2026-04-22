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
import { applyAllureMeta } from '../../utils/allureMeta';

test.describe('Airlines API', () => {
  test('TC-AIR-001 GET /health returns healthy', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-01',
      storyName: 'Airlines Service Health & Availability',
      testCaseId: 'TC-AIR-001',
      scenarioId: 'TS-AIR-01',
    });
    const body = await getHealth(request, baseURL!);
    expect(healthAirlinesSchema.safeParse(body).success).toBeTruthy();
  });

  test('TC-AIR-002 GET /airports returns a list of airports', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-02',
      storyName: 'Airport Management',
      testCaseId: 'TC-AIR-002',
      scenarioId: 'TS-AIR-02',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/airports');
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThan(3);
    list.slice(0, 3).forEach((a) => airportSchema.parse(a));
  });

  test('TC-AIR-003 GET /airports/search valid query returns results', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-02',
      storyName: 'Airport Management',
      testCaseId: 'TC-AIR-003',
      scenarioId: 'TS-AIR-03',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/airports/search', { params: { q: 'BOM' } });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list.length).toBeGreaterThanOrEqual(1);
    const bom = list.map((x) => airportSchema.parse(x)).find((a) => a.iata_code === 'BOM');
    expect(bom?.city).toBe('Mumbai');
  });

  test('TC-AIR-004 GET /airports/search no match returns empty list', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-02',
      storyName: 'Airport Management',
      testCaseId: 'TC-AIR-004',
      scenarioId: 'TS-AIR-04',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/airports/search', { params: { q: 'ZZZNOTEXIST' } });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(list).toEqual([]);
  });

  test('TC-AIR-005 GET /airports/search missing q returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-02',
      storyName: 'Airport Management',
      testCaseId: 'TC-AIR-005',
      scenarioId: 'TS-AIR-05',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/airports/search');
    expect(res.status()).toBe(422);
  });

  test('TC-AIR-006 GET /flights/search returns flights for valid route/date', async ({
    request,
    baseURL,
  }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-006',
      scenarioId: 'TS-AIR-06',
    });
    const client = createApiClient(request, baseURL!);
    const found = await findFlightsForRoute(client, 'BOM', 'DEL');
    test.skip(!found, 'No seeded flights found for BOM→DEL in scanned date window');

    const res = await client.get('/flights/search', {
      params: {
        origin: 'BOM',
        destination: 'DEL',
        date: found!.date,
        passengers: 1,
        cabin_class: 'Economy',
      },
    });
    expect(res.status()).toBe(200);
    const body = flightSearchSchema.parse(await res.json());
    expect(body.search_params.origin).toBe('BOM');
    expect(body.search_params.destination).toBe('DEL');
    body.flights.forEach((f) => flightOutSchema.parse(f));
  });

  test('TC-AIR-007 GET /flights/search invalid airport code returns 404', async ({
    request,
    baseURL,
  }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-007',
      scenarioId: 'TS-AIR-07',
    });
    const client = createApiClient(request, baseURL!);
    const date = futureFlightDate(3);
    const res = await client.get('/flights/search', {
      params: { origin: 'XXX', destination: 'DEL', date, passengers: 1, cabin_class: 'Economy' },
    });
    expect(res.status()).toBe(404);
  });

  test('TC-AIR-008 GET /flights/search missing origin returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-008',
      scenarioId: 'TS-AIR-08',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/flights/search', {
      params: { destination: 'DEL', date: futureFlightDate(3) },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AIR-009 GET /flights/search missing destination returns 422', async ({
    request,
    baseURL,
  }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-009',
      scenarioId: 'TS-AIR-09',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/flights/search', {
      params: { origin: 'BOM', date: futureFlightDate(3) },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AIR-010 GET /flights/search missing date returns 422', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-010',
      scenarioId: 'TS-AIR-10',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/flights/search', {
      params: { origin: 'BOM', destination: 'DEL' },
    });
    expect(res.status()).toBe(422);
  });

  test('TC-AIR-011 GET /flights/{id} not found returns 404', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-011',
      scenarioId: 'TS-AIR-11',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.get('/flights/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
  });

  test('TC-AIR-021 GET /flights/{id} returns flight details for valid flight', async ({
    request,
    baseURL,
  }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-03',
      storyName: 'Flight Search',
      testCaseId: 'TC-AIR-021',
      scenarioId: 'TS-AIR-21',
    });
    const client = createApiClient(request, baseURL!);
    const found = await findFlightsForRoute(client, 'DEL', 'BLR');
    test.skip(!found, 'No seeded flights found for DEL→BLR in scanned date window');
    const flightId = found!.flights[0].id;

    const res = await client.get(`/flights/${flightId}`);
    expect(res.status()).toBe(200);
    flightOutSchema.parse(await res.json());
  });

  test('TC-AIR-018 POST /bookings requires authentication', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-018',
      scenarioId: 'TS-AIR-18',
    });
    const client = createApiClient(request, baseURL!);
    const res = await client.post('/bookings', {
      data: {
        flight_id: '00000000-0000-0000-0000-000000000001',
        ...passengerPayload(),
      },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-AIR-012 POST /bookings creates booking (success)', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-012',
      scenarioId: 'TS-AIR-12',
    });
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
    bookingOutSchema.parse(await create.json());
  });

  test('TC-AIR-013 GET /bookings/my returns my bookings', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-013',
      scenarioId: 'TS-AIR-13',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);

    const mine = await client.get('/bookings/my', { headers });
    expect(mine.status()).toBe(200);
    const list = (await mine.json()) as unknown[];
    expect(Array.isArray(list)).toBeTruthy();
  });

  test('TC-AIR-014 GET /bookings/{id} returns booking by id', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-014',
      scenarioId: 'TS-AIR-14',
    });
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

    const one = await client.get(`/bookings/${booking.id}`, { headers });
    expect(one.status()).toBe(200);
    bookingOutSchema.parse(await one.json());
  });

  test('TC-AIR-015 GET /bookings/{id} without token returns 401', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-015',
      scenarioId: 'TS-AIR-15',
    });
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

    const res = await client.get(`/bookings/${booking.id}`);
    expect(res.status()).toBe(401);
  });

  test('TC-AIR-016 PATCH /bookings/{id}/cancel cancels booking', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-016',
      scenarioId: 'TS-AIR-16',
    });
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

    const cancel = await client.patch(`/bookings/${booking.id}/cancel`, { headers });
    expect(cancel.status()).toBe(200);
    const cancelBody = (await cancel.json()) as { message?: string };
    expect(cancelBody.message).toMatch(/cancelled/i);
  });

  test('TC-AIR-017 PATCH /bookings/{id}/cancel again returns 400', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-017',
      scenarioId: 'TS-AIR-17',
    });
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

    const first = await client.patch(`/bookings/${booking.id}/cancel`, { headers });
    expect(first.status()).toBe(200);

    const second = await client.patch(`/bookings/${booking.id}/cancel`, { headers });
    expect(second.status()).toBe(400);
    const body = (await second.json()) as { detail?: string };
    expect(String(body.detail)).toMatch(/already cancelled/i);
  });

  test('TC-AIR-019 POST /bookings invalid flight_id returns 404', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-04',
      storyName: 'Airline Booking Management',
      testCaseId: 'TC-AIR-019',
      scenarioId: 'TS-AIR-19',
    });
    const client = createApiClient(request, baseURL!);
    const { accessToken } = readStoredAuth();
    const headers = bearerHeaders(accessToken);
    const res = await client.post('/bookings', {
      headers,
      data: { flight_id: '00000000-0000-0000-0000-000000000000', ...passengerPayload() },
    });
    expect(res.status()).toBe(404);
  });

  test('TC-AIR-020 GET /destinations/top returns marketing destinations', async ({ request, baseURL }) => {
    applyAllureMeta({
      epicId: 'EP-02',
      epicName: 'Airlines API Testing',
      storyId: 'ST-AIR-05',
      storyName: 'Airline Destinations',
      testCaseId: 'TC-AIR-020',
      scenarioId: 'TS-AIR-20',
    });
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
