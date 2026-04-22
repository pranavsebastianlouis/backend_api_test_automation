import { z } from 'zod';

export const userOutSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const tokenOutSchema = z.object({
  access_token: z.string().min(10),
  token_type: z.literal('bearer'),
  user: userOutSchema,
});

export const healthAuthSchema = z.object({
  status: z.literal('healthy'),
  service: z.literal('auth-api'),
  port: z.literal(9000),
});
