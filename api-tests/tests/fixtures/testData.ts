import * as crypto from 'crypto';

/**
 * Dynamic values for API tests (emails, passenger payloads, future dates).
 */
export function uniqueEmail(prefix = 'e2e'): string {
  const id = crypto.randomBytes(6).toString('hex');
  // Use a registrable-style domain; .test is rejected by pydantic/email-validator as reserved.
  return `${prefix}.${id}@luxe-e2e.example.com`;
}

export function strongPassword(): string {
  return `Aa1!${crypto.randomBytes(8).toString('hex')}`;
}

export function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Airlines seed uses flights for the next ~30 days from API startup time. */
export function futureFlightDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return toYmd(d);
}

export function passengerPayload(overrides?: Partial<PassengerPayload>): PassengerPayload {
  return {
    passenger_name: overrides?.passenger_name ?? 'Test Passenger',
    passenger_id_number: overrides?.passenger_id_number ?? `ID-${crypto.randomBytes(4).toString('hex')}`,
    date_of_birth: overrides?.date_of_birth ?? '1990-01-15',
    num_passengers: overrides?.num_passengers ?? 1,
  };
}

export type PassengerPayload = {
  passenger_name: string;
  passenger_id_number: string;
  date_of_birth: string;
  num_passengers: number;
};

export type CruiseGuestPayload = {
  passenger_name: string;
  passenger_id_number: string;
  date_of_birth: string;
  num_guests: number;
};

export function cruiseGuestPayload(overrides?: Partial<CruiseGuestPayload>): CruiseGuestPayload {
  const p = passengerPayload(overrides);
  return {
    passenger_name: p.passenger_name,
    passenger_id_number: p.passenger_id_number,
    date_of_birth: p.date_of_birth,
    num_guests: overrides?.num_guests ?? p.num_passengers,
  };
}
