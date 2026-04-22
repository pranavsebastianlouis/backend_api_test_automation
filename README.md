# backend_api_test_automation

A full-stack **micro-frontend (MFE)** travel platform with two distinct brands that share authentication and cross-import each other's search widgets via **Vite Module Federation**.

```
┌─────────────────────────────────────────────────────────────────┐
│                      LUXE Travel Platform                        │
│                                                                  │
│  ┌──────────────────┐     MFE      ┌──────────────────┐         │
│  │  LUXE Airlines   │ ◄──────────► │  LUXE Cruises    │         │
│  │  Port: 8001      │   imports    │  Port: 8002      │         │
│  │                  │  each other  │                  │         │
│  │  Exposes:        │              │  Exposes:        │         │
│  │  FlightSearch    │              │  CruiseSearch    │         │
│  │  Widget          │              │  Widget          │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                   │
│           └──────────────┬──────────────────┘                   │
│                          │  Shared Auth                         │
│                    ┌─────▼─────┐                                │
│                    │ Auth App  │                                 │
│                    │ Port:8003 │                                 │
│                    └─────┬─────┘                                │
│                          │                                      │
│  ┌───────────────────────┼──────────────────────────────────┐   │
│  │                  Backend APIs                             │   │
│  │  Auth API (9000) ─────┼─── Airlines API (9001)           │   │
│  │                       └─── Cruises API  (9002)           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              3 Separate PostgreSQL Databases              │   │
│  │   luxe_users (5432)  luxe_airlines (5433)  luxe_cruises  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Docker** + **Docker Compose**
- **npm** or **yarn**

---

### Step 1 — Start the Databases & Backend APIs

```bash
cd luxe-travel
docker-compose up -d
```

This starts:
| Service | Port | Description |
|---------|------|-------------|
| `postgres-users`    | 5432 | Shared user auth database |
| `postgres-airlines` | 5433 | Airlines-only database |
| `postgres-cruises`  | 5434 | Cruises-only database |
| `auth-api`          | 9000 | JWT auth FastAPI service |
| `airlines-api`      | 9001 | Airlines FastAPI service |
| `cruises-api`       | 9002 | Cruises FastAPI service |

> **First run:** The APIs auto-seed airports, flights, ports, ships and cruises on startup.

Verify everything is up:
```bash
curl http://localhost:9000/health   # Auth API
curl http://localhost:9001/health   # Airlines API
curl http://localhost:9002/health   # Cruises API
```

---

### Step 2 — Start Frontend Apps

Open **3 separate terminals**:

**Terminal 1 — Auth App (port 8003)**
```bash
cd frontend/auth
cp .env.example .env
npm install
npm run dev
```

**Terminal 2 — Airlines App (port 8001)**
```bash
cd frontend/airlines
cp .env.example .env
npm install
npm run dev
```

**Terminal 3 — Cruises App (port 8002)**
```bash
cd frontend/cruises
cp .env.example .env
npm install
npm run dev
```

> **Important:** Start **Auth** first, then **Airlines** and **Cruises** in any order.
> Both Airlines and Cruises must be running for MFE cross-imports to work.

---

### Access the Apps

| App | URL | Description |
|-----|-----|-------------|
| 🛫 LUXE Airlines | http://localhost:8001 | Full airlines booking site |
| 🚢 LUXE Cruises  | http://localhost:8002 | Full cruise booking site |
| 🔐 Auth          | http://localhost:8003 | Shared sign-in / sign-up |
| 📖 Auth API Docs     | http://localhost:9000/docs | FastAPI Swagger |
| 📖 Airlines API Docs | http://localhost:9001/docs | FastAPI Swagger |
| 📖 Cruises API Docs  | http://localhost:9002/docs | FastAPI Swagger |

---

## Project Structure

```
luxe-travel/
├── docker-compose.yml
├── db/
│   ├── users-schema.sql        # Shared user DB (luxe_users)
│   ├── airlines-schema.sql     # Airlines DB (luxe_airlines) with seeds
│   └── cruises-schema.sql      # Cruises DB (luxe_cruises) with seeds
│
├── backend/
│   ├── auth-api/               # Port 9000 — JWT auth, shared by both sites
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   ├── airlines-api/           # Port 9001 — Flights, bookings
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── cruises-api/            # Port 9002 — Cruises, voyages
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
│
└── frontend/
    ├── auth/                   # Port 8003 — Shared Sign In / Create Account
    │   └── src/pages/AuthPage.tsx
    │
    ├── airlines/               # Port 8001 — LUXE Airlines
    │   ├── vite.config.ts      # MFE: exposes FlightSearchWidget, consumes CruiseSearchWidget
    │   └── src/
    │       ├── api.ts           ← ALL API calls documented here
    │       ├── types.ts
    │       ├── store/authStore.ts
    │       ├── components/
    │       │   ├── Navbar.tsx
    │       │   ├── SearchBar.tsx
    │       │   └── FlightCard.tsx
    │       ├── pages/
    │       │   ├── Home.tsx
    │       │   ├── SearchResults.tsx
    │       │   ├── Booking.tsx
    │       │   ├── PaymentSuccess.tsx
    │       │   └── Profile.tsx
    │       └── mfe/
    │           └── FlightSearchWidget.tsx  ← exported MFE component
    │
    └── cruises/                # Port 8002 — LUXE Cruises
        ├── vite.config.ts      # MFE: exposes CruiseSearchWidget, consumes FlightSearchWidget
        └── src/
            ├── api.ts           ← ALL API calls documented here
            ├── store/authStore.ts
            ├── components/
            │   ├── Navbar.tsx
            │   └── CruiseCard.tsx
            ├── pages/
            │   ├── Home.tsx
            │   ├── SearchResults.tsx
            │   ├── Booking.tsx
            │   ├── PaymentSuccess.tsx
            │   └── Profile.tsx
            └── mfe/
                └── CruiseSearchWidget.tsx  ← exported MFE component
```

---

## API Reference

### Auth API — `http://localhost:9000`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Create account → returns JWT |
| `POST` | `/auth/login`    | ❌ | Sign in → returns JWT |
| `GET`  | `/auth/me`       | ✅ | Get current user profile |
| `PUT`  | `/auth/profile`  | ✅ | Update name / phone |

### Airlines API — `http://localhost:9001`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/airports`               | ❌ | List all airports |
| `GET` | `/airports/search?q=`     | ❌ | Search airports by city/IATA |
| `GET` | `/flights/search?origin=&destination=&date=&passengers=&cabin_class=` | ❌ | Search flights |
| `GET` | `/flights/:id`            | ❌ | Get single flight details |
| `POST`| `/bookings`               | ✅ | Create a booking |
| `GET` | `/bookings/my`            | ✅ | Get current user's bookings |
| `GET` | `/bookings/:id`           | ✅ | Get a specific booking |
| `PATCH`| `/bookings/:id/cancel`   | ✅ | Cancel a booking |
| `GET` | `/destinations/top`       | ❌ | Top destinations with prices |

### Cruises API — `http://localhost:9002`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/ports`                  | ❌ | List all ports |
| `GET` | `/ports/search?q=`        | ❌ | Search ports |
| `GET` | `/cruises/search?departure_port=&destination=&date=&guests=&cabin_type=` | ❌ | Search cruises |
| `GET` | `/cruises/:id`            | ❌ | Get single cruise |
| `POST`| `/cruise-bookings`        | ✅ | Create a cruise booking |
| `GET` | `/cruise-bookings/my`     | ✅ | Get user's cruise bookings |
| `GET` | `/cruise-bookings/:id`    | ✅ | Get a specific cruise booking |
| `PATCH`| `/cruise-bookings/:id/cancel` | ✅ | Cancel a cruise booking |
| `GET` | `/destinations/top`       | ❌ | Top cruise destinations |

---

## Module Federation (MFE) Architecture

### How It Works

The platform uses **Vite Plugin Federation** (`@originjs/vite-plugin-federation`) for MFE.

**Airlines exposes → consumed by Cruises:**
```ts
// airlines/vite.config.ts
exposes: { './FlightSearchWidget': './src/mfe/FlightSearchWidget.tsx' }
remotes: { cruises: 'http://localhost:8002/assets/remoteEntry.js' }

// cruises/Home.tsx
const FlightSearchWidget = lazy(() => import('airlines/FlightSearchWidget'))
```

**Cruises exposes → consumed by Airlines:**
```ts
// cruises/vite.config.ts
exposes: { './CruiseSearchWidget': './src/mfe/CruiseSearchWidget.tsx' }
remotes: { airlines: 'http://localhost:8001/assets/remoteEntry.js' }

// airlines/Home.tsx
const CruiseSearchWidget = lazy(() => import('cruises/CruiseSearchWidget'))
```

### Cross-booking Redirect Flow

```
User on Airlines site → clicks "Cruises" tab → CruiseSearchWidget loads
User searches cruises → sees results inline
User clicks "Book" on a cruise → redirected to http://localhost:8002/booking?cruise_id=...
                                                       ↑
                                             LUXE Cruises booking page
                                             User completes booking normally
```

---

## Auth Flow (Single Sign-On Pattern)

```
User clicks "Sign In" on Airlines (8001)
         ↓
Redirected to Auth App (8003)?redirect=http://localhost:8001
         ↓
User signs in → Auth API (9000) returns JWT
         ↓
Auth App redirects back to Airlines with:
  ?auth_token=<JWT>&user_data=<encoded JSON>
         ↓
Airlines reads params → stores in localStorage → cleans URL
         ↓
User is now signed in ✓
```

The same JWT works on both Airlines and Cruises because both verify against the same `SECRET_KEY`.

---

## Database Schema Overview

### `luxe_users` (shared, port 5432)
- `users` — email, password_hash, first/last name, phone

### `luxe_airlines` (port 5433)
- `airports` — IATA code, city, country, image
- `aircraft` — model, seats
- `flights` — route, times, seats, price, status
- `bookings` — user_id (FK to luxe_users), flight, passenger info

### `luxe_cruises` (port 5434)
- `ports` — name, city, country
- `ships` — name, capacity, amenities
- `cruises` — route, dates, cabin type, price
- `cruise_itineraries` — day-by-day port schedule
- `cruise_bookings` — user_id (FK to luxe_users), cruise, guest info

---

## Development Tips

**Running backends locally (without Docker):**
```bash
cd backend/auth-api
pip install -r requirements.txt
cp .env.example .env  # edit DATABASE_URL to point to local postgres
uvicorn main:app --port 9000 --reload
```

**MFE in production (build mode):**
```bash
# Build all frontends first
cd frontend/cruises && npm run build    # Must build before airlines imports it
cd frontend/airlines && npm run build
cd frontend/auth && npm run build

# Preview (serves built assets including remoteEntry.js)
cd frontend/cruises  && npm run preview   # http://localhost:8002
cd frontend/airlines && npm run preview   # http://localhost:8001
cd frontend/auth     && npm run preview   # http://localhost:8003
```

> **Note:** In dev mode (`npm run dev`), MFE remote imports may not resolve because
> `remoteEntry.js` is only generated during `build`. Use `npm run build && npm run preview`
> on both apps simultaneously for full MFE functionality.

---

## Environment Variables

### Frontend `.env` files

**`frontend/airlines/.env`**
```
VITE_AIRLINES_API_URL=http://localhost:9001
VITE_AUTH_API_URL=http://localhost:9000
VITE_AUTH_APP_URL=http://localhost:8003
VITE_CRUISES_APP_URL=http://localhost:8002
```

**`frontend/cruises/.env`**
```
VITE_CRUISES_API_URL=http://localhost:9002
VITE_AUTH_API_URL=http://localhost:9000
VITE_AUTH_APP_URL=http://localhost:8003
VITE_AIRLINES_APP_URL=http://localhost:8001
```

**`frontend/auth/.env`**
```
VITE_AUTH_API_URL=http://localhost:9000
```
