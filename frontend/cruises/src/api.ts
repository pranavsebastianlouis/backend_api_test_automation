/**
 * LUXE Cruises  –  api.ts
 *
 * Backend ports:
 *   Auth API    →  http://localhost:9000
 *   Cruises API →  http://localhost:9002
 */
import axios, { AxiosInstance } from 'axios'

const CRUISES_BASE = import.meta.env.VITE_CRUISES_API_URL ?? 'http://localhost:9002'
const AUTH_BASE    = import.meta.env.VITE_AUTH_API_URL    ?? 'http://localhost:9000'

function makeClient(baseURL: string): AxiosInstance {
  const c = axios.create({ baseURL })
  c.interceptors.request.use(cfg => {
    const t = localStorage.getItem('luxe_token')
    if (t) cfg.headers.Authorization = `Bearer ${t}`
    return cfg
  })
  c.interceptors.response.use(r => r, err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('luxe_token')
      localStorage.removeItem('luxe_user')
    }
    return Promise.reject(err)
  })
  return c
}

const cruisesClient = makeClient(CRUISES_BASE)
const authClient    = makeClient(AUTH_BASE)

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Port     { id: number; name: string; city: string; country: string; image_url?: string }
export interface Ship     { id: number; name: string; operator: string; total_cabins: number; max_capacity: number; year_built?: number; image_url?: string; description?: string }
export interface Cruise   {
  id: string; name: string; ship: Ship; departure_port: Port; arrival_port: Port;
  departure_date: string; arrival_date: string; duration_nights: number;
  cabin_type: string; price_per_person: number; available_cabins: number;
  total_cabins: number; status: string; image_url?: string;
}
export interface CruiseBooking {
  id: string; booking_reference: string; cruise_id: string; cruise_name: string;
  passenger_name: string; passenger_id_number: string; date_of_birth: string;
  num_guests: number; total_price: number; status: string; created_at: string;
}
export interface User { id: string; email: string; first_name: string; last_name: string; phone?: string }

// ── Auth ───────────────────────────────────────────────────────────────────────
// POST /auth/login    →  { access_token, token_type, user }
// POST /auth/register →  { access_token, token_type, user }
// GET  /auth/me       →  User
// PUT  /auth/profile  →  User
export interface AuthResponse { access_token: string; token_type: string; user: User }
export const authApi = {
  login:         (p: { email: string; password: string })   => authClient.post<AuthResponse>('/auth/login', p).then(r => r.data),
  register:      (p: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
                                                               authClient.post<AuthResponse>('/auth/register', p).then(r => r.data),
  me:            ()                                          => authClient.get<User>('/auth/me').then(r => r.data),
  updateProfile: (p: Partial<User>)                          => authClient.put<User>('/auth/profile', p).then(r => r.data),
}

// ── Ports ──────────────────────────────────────────────────────────────────────
// GET /ports          →  Port[]
// GET /ports/search   →  Port[]
export const portsApi = {
  list:   ()          => cruisesClient.get<Port[]>('/ports').then(r => r.data),
  search: (q: string) => cruisesClient.get<Port[]>('/ports/search', { params: { q } }).then(r => r.data),
}

// ── Cruises ────────────────────────────────────────────────────────────────────
// GET /cruises/search?departure_port=Mumbai&destination=Kochi&date=...&guests=2&cabin_type=...
//   →  { cruises: Cruise[], total: number }
// GET /cruises/:id  →  Cruise
export interface CruiseSearchParams {
  departure_port?: string; destination?: string; date?: string;
  guests?: number; cabin_type?: string;
}
export const cruisesApi = {
  search:  (p: CruiseSearchParams) => cruisesClient.get<{ cruises: Cruise[]; total: number }>('/cruises/search', { params: p }).then(r => r.data),
  getById: (id: string)             => cruisesClient.get<Cruise>(`/cruises/${id}`).then(r => r.data),
}

// ── Cruise Bookings ────────────────────────────────────────────────────────────
// POST  /cruise-bookings            →  CruiseBooking
// GET   /cruise-bookings/my         →  CruiseBooking[]
// GET   /cruise-bookings/:id        →  CruiseBooking
// PATCH /cruise-bookings/:id/cancel →  { message, booking_reference }
export interface CreateCruiseBookingPayload {
  cruise_id: string; passenger_name: string; passenger_id_number: string;
  date_of_birth: string; num_guests: number;
}
export const cruiseBookingsApi = {
  create:     (p: CreateCruiseBookingPayload) => cruisesClient.post<CruiseBooking>('/cruise-bookings', p).then(r => r.data),
  myBookings: ()                               => cruisesClient.get<CruiseBooking[]>('/cruise-bookings/my').then(r => r.data),
  getById:    (id: string)                     => cruisesClient.get<CruiseBooking>(`/cruise-bookings/${id}`).then(r => r.data),
  cancel:     (id: string)                     => cruisesClient.patch(`/cruise-bookings/${id}/cancel`).then(r => r.data),
}

// ── Destinations ───────────────────────────────────────────────────────────────
// GET /destinations/top  →  { city, country, image_url, starting_price }[]
export const destinationsApi = {
  top: () => cruisesClient.get<{ city: string; country: string; image_url?: string; starting_price: number }[]>('/destinations/top').then(r => r.data),
}

// ── Health ─────────────────────────────────────────────────────────────────────
// GET /health → { status, service, port }
export const healthApi = { check: () => cruisesClient.get('/health').then(r => r.data) }
