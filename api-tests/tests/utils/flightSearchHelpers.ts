import type { ApiClient } from './apiClient';
import { flightSearchSchema } from './schemas/airlines.zod';
import { futureFlightDate } from '../fixtures/testData';

/**
 * Airlines seeds flights for ~30 days from API startup (not "today" on the test runner).
 * Scan a window of calendar days so tests stay stable even if the compose stack has been up a while.
 */
export async function findFlightsForRoute(
  client: ApiClient,
  origin: string,
  destination: string,
  maxDayOffset = 45,
): Promise<{ date: string; flights: ReturnType<typeof flightSearchSchema.parse>['flights'] } | null> {
  for (let d = 1; d <= maxDayOffset; d += 1) {
    const date = futureFlightDate(d);
    const res = await client.get('/flights/search', {
      params: { origin, destination, date, passengers: 1, cabin_class: 'Economy' },
    });
    if (!res.ok()) continue;
    const parsed = flightSearchSchema.safeParse(await res.json());
    if (parsed.success && parsed.data.flights.length > 0) {
      return { date, flights: parsed.data.flights };
    }
  }
  return null;
}
