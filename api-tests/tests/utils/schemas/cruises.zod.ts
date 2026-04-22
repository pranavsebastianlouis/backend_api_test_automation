import { z } from 'zod';

export const portSchema = z.object({
  id: z.number(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  image_url: z.string().nullable().optional(),
});

export const shipSchema = z.object({
  id: z.number(),
  name: z.string(),
  operator: z.string(),
  total_cabins: z.number(),
  max_capacity: z.number(),
  year_built: z.number().nullable().optional(),
  image_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const cruiseOutSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ship: shipSchema,
  departure_port: portSchema,
  arrival_port: portSchema,
  departure_date: z.string(),
  arrival_date: z.string(),
  duration_nights: z.number(),
  cabin_type: z.string(),
  price_per_person: z.number(),
  available_cabins: z.number(),
  total_cabins: z.number(),
  status: z.string(),
  image_url: z.string().nullable().optional(),
});

export const cruiseSearchSchema = z.object({
  cruises: z.array(cruiseOutSchema),
  total: z.number().int().nonnegative(),
});

export const cruiseBookingOutSchema = z.object({
  id: z.string().uuid(),
  booking_reference: z.string(),
  cruise_id: z.string().uuid(),
  cruise_name: z.string(),
  passenger_name: z.string(),
  passenger_id_number: z.string(),
  date_of_birth: z.string(),
  num_guests: z.number().int().positive(),
  total_price: z.number(),
  status: z.string(),
  created_at: z.string(),
});

export const healthCruisesSchema = z.object({
  status: z.literal('healthy'),
  service: z.literal('cruises-api'),
  port: z.literal(9002),
});
