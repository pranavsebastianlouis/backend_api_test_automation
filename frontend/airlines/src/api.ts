/**
 * LUXE Airlines  –  api.ts
 *
 * Centralised API layer.  All endpoints documented here so you know
 * exactly what to implement in the FastAPI backend.
 *
 * Backend ports:
 *   Auth API     →  http://localhost:9000
 *   Airlines API →  http://localhost:9001
 */

import axios, { AxiosInstance } from 'axios';
import { Airport, Flight, FlightSearchParams, Booking, TopDestination, User } from './types';

// ── Axios clients ─────────────────────────────────────────────────────────────
const AIRLINES_BASE = import.meta.env.VITE_AIRLINES_API_URL ?? 'http://localhost:9001';
const AUTH_BASE     = import.meta.env.VITE_AUTH_API_URL     ?? 'http://localhost:9000';

function makeClient(baseURL: string, opts?: { clearStorageOn401?: boolean }): AxiosInstance {
  const client = axios.create({ baseURL });
  client.interceptors.request.use((cfg) => {
    const token = localStorage.getItem('luxe_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });
  client.interceptors.response.use(
    (r) => r,
    (err) => {
      if (
        err.response?.status === 401 &&
        (opts?.clearStorageOn401 ?? true)
      ) {
        localStorage.removeItem('luxe_token');
        localStorage.removeItem('luxe_user');
      }
      return Promise.reject(err);
    },
  );
  return client;
}

const airlinesClient = makeClient(AIRLINES_BASE, { clearStorageOn401: false });
const authClient     = makeClient(AUTH_BASE);

// ── Auth ──────────────────────────────────────────────────────────────────────
// POST /auth/register   →  { access_token, token_type, user }
// POST /auth/login      →  { access_token, token_type, user }
// GET  /auth/me         →  User
// PUT  /auth/profile    →  User

export interface AuthResponse { access_token: string; token_type: string; user: User; }
export interface LoginPayload    { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; first_name: string; last_name: string; phone?: string; }
export interface ProfileUpdatePayload { first_name?: string; last_name?: string; phone?: string; avatar_url?: string; }

export const authApi = {
  login:         (p: LoginPayload)          => authClient.post<AuthResponse>('/auth/login', p).then(r => r.data),
  register:      (p: RegisterPayload)       => authClient.post<AuthResponse>('/auth/register', p).then(r => r.data),
  me:            ()                         => authClient.get<User>('/auth/me').then(r => r.data),
  updateProfile: (p: ProfileUpdatePayload)  => authClient.put<User>('/auth/profile', p).then(r => r.data),
};

// ── Airports ──────────────────────────────────────────────────────────────────
// GET /airports             →  Airport[]
// GET /airports/search?q=   →  Airport[]

export const airportsApi = {
  list:   ()            => airlinesClient.get<Airport[]>('/airports').then(r => r.data),
  search: (q: string)   => airlinesClient.get<Airport[]>('/airports/search', { params: { q } }).then(r => r.data),
};

// ── Flights ───────────────────────────────────────────────────────────────────
// GET /flights/search?origin=DEL&destination=BOM&date=2024-04-15&passengers=1&cabin_class=Economy
//   → { flights: Flight[], total: number, search_params: {...} }
// GET /flights/:id  →  Flight

export interface FlightSearchResponse { flights: Flight[]; total: number; search_params: FlightSearchParams; }

export const flightsApi = {
  search: (params: Omit<FlightSearchParams, 'trip_type' | 'return_date'>) =>
    airlinesClient.get<FlightSearchResponse>('/flights/search', { params }).then(r => r.data),

  getById: (id: string) =>
    airlinesClient.get<Flight>(`/flights/${id}`).then(r => r.data),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
// POST   /bookings               →  { booking: Booking, message: string }
// GET    /bookings/my            →  Booking[]
// GET    /bookings/:id           →  Booking
// PATCH  /bookings/:id/cancel    →  { message: string, booking_reference: string }

export interface CreateBookingPayload {
  flight_id:           string;
  passenger_name:      string;
  passenger_id_number: string;
  date_of_birth:       string;   // YYYY-MM-DD
  num_passengers:      number;
}

export const bookingsApi = {
  create:       (p: CreateBookingPayload) => airlinesClient.post<Booking>('/bookings', p).then(r => r.data),
  myBookings:   ()                        => airlinesClient.get<Booking[]>('/bookings/my').then(r => r.data),
  getById:      (id: string)              => airlinesClient.get<Booking>(`/bookings/${id}`).then(r => r.data),
  cancel:       (id: string)              => airlinesClient.patch(`/bookings/${id}/cancel`).then(r => r.data),
};

// ── Destinations ──────────────────────────────────────────────────────────────
// GET /destinations/top  →  TopDestination[]

export const destinationsApi = {
  top: () => airlinesClient.get<TopDestination[]>('/destinations/top').then(r => r.data),
};

// ── Health ────────────────────────────────────────────────────────────────────
// GET /health  →  { status, service, port }
export const healthApi = {
  check: () => airlinesClient.get('/health').then(r => r.data),
};
