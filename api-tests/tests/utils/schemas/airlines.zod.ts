import { z } from 'zod';

export const airportSchema = z.object({
  id: z.number(),
  iata_code: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  image_url: z.string().nullable().optional(),
});

export const flightOutSchema = z.object({
  id: z.string().uuid(),
  flight_number: z.string(),
  origin: airportSchema,
  destination: airportSchema,
  departure_time: z.string(),
  arrival_time: z.string(),
  duration_minutes: z.number().nonnegative(),
  aircraft_model: z.string(),
  cabin_class: z.string(),
  available_seats: z.number().int().nonnegative(),
  total_seats: z.number().int().positive(),
  price_per_person: z.number(),
  status: z.string(),
});

export const flightSearchSchema = z.object({
  flights: z.array(flightOutSchema),
  total: z.number().int().nonnegative(),
  search_params: z.object({
    origin: z.string(),
    destination: z.string(),
    date: z.string(),
    passengers: z.number(),
    cabin_class: z.string(),
  }),
});

export const bookingOutSchema = z.object({
  id: z.string().uuid(),
  booking_reference: z.string(),
  flight_id: z.string().uuid(),
  flight_number: z.string(),
  passenger_name: z.string(),
  passenger_id_number: z.string(),
  date_of_birth: z.string(),
  num_passengers: z.number().int().positive(),
  total_price: z.number(),
  status: z.string(),
  created_at: z.string(),
});

export const healthAirlinesSchema = z.object({
  status: z.literal('healthy'),
  service: z.literal('airlines-api'),
  port: z.literal(9001),
});
