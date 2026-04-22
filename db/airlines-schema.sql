-- ============================================
-- LUXE AIRLINES DATABASE
-- Completely separate from Cruises DB
-- ============================================

CREATE DATABASE luxe_airlines;
\c luxe_airlines;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---- AIRPORTS ----
CREATE TABLE airports (
    id        SERIAL PRIMARY KEY,
    iata_code CHAR(3) UNIQUE NOT NULL,
    name      VARCHAR(200) NOT NULL,
    city      VARCHAR(100) NOT NULL,
    country   VARCHAR(100) NOT NULL,
    timezone  VARCHAR(50) DEFAULT 'Asia/Kolkata',
    image_url VARCHAR(500)
);

-- ---- AIRCRAFT ----
CREATE TABLE aircraft (
    id          SERIAL PRIMARY KEY,
    model       VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    seat_config VARCHAR(20)  -- e.g. "3-3", "2-4-2"
);

-- ---- FLIGHTS ----
CREATE TABLE flights (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_number    VARCHAR(10) NOT NULL,
    origin_id        INTEGER REFERENCES airports(id) ON DELETE RESTRICT,
    destination_id   INTEGER REFERENCES airports(id) ON DELETE RESTRICT,
    departure_time   TIMESTAMPTZ NOT NULL,
    arrival_time     TIMESTAMPTZ NOT NULL,
    aircraft_id      INTEGER REFERENCES aircraft(id),
    cabin_class      VARCHAR(20) DEFAULT 'Economy' CHECK (cabin_class IN ('Economy','Business','First')),
    total_seats      INTEGER NOT NULL,
    available_seats  INTEGER NOT NULL,
    price_per_person NUMERIC(12,2) NOT NULL,
    status           VARCHAR(20) DEFAULT 'scheduled'
                         CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled','delayed')),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT available_lte_total CHECK (available_seats <= total_seats),
    CONSTRAINT arrival_after_departure CHECK (arrival_time > departure_time)
);

CREATE INDEX idx_flights_origin      ON flights(origin_id);
CREATE INDEX idx_flights_dest        ON flights(destination_id);
CREATE INDEX idx_flights_departure   ON flights(departure_time);
CREATE INDEX idx_flights_status      ON flights(status);
CREATE INDEX idx_flights_route_date  ON flights(origin_id, destination_id, departure_time);

-- ---- BOOKINGS ----
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,                          -- FK to luxe_users.users
    flight_id           UUID REFERENCES flights(id) ON DELETE RESTRICT,
    booking_reference   VARCHAR(10) UNIQUE NOT NULL,
    passenger_name      VARCHAR(200) NOT NULL,
    passenger_id_number VARCHAR(50) NOT NULL,
    date_of_birth       DATE NOT NULL,
    num_passengers      INTEGER DEFAULT 1 CHECK (num_passengers > 0),
    total_price         NUMERIC(12,2) NOT NULL,
    status              VARCHAR(20) DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed','cancelled','completed','pending')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_user      ON bookings(user_id);
CREATE INDEX idx_bookings_flight    ON bookings(flight_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status    ON bookings(status);

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION (
        SELECT 'UPDATE TRIGGER' -- placeholder; define update_updated_at_column() separately
    );

-- ---- SEED: AIRPORTS ----
INSERT INTO airports (iata_code, name, city, country, image_url) VALUES
('DEL', 'Indira Gandhi International Airport',              'New Delhi',  'India', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600'),
('BOM', 'Chhatrapati Shivaji Maharaj International Airport','Mumbai',     'India', 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600'),
('MAA', 'Chennai International Airport',                    'Chennai',    'India', 'https://images.unsplash.com/photo-1604154999816-a0a1bf621a9c?w=600'),
('BLR', 'Kempegowda International Airport',                 'Bengaluru',  'India', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600'),
('HYD', 'Rajiv Gandhi International Airport',               'Hyderabad',  'India', 'https://images.unsplash.com/photo-1609944304977-3b3e5b14a62d?w=600'),
('COK', 'Cochin International Airport',                     'Kochi',      'India', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600'),
('CCU', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata',    'India', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'),
('GOI', 'Dabolim Airport',                                  'Goa',        'India', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600'),
('JAI', 'Jaipur International Airport',                     'Jaipur',     'India', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600'),
('AMD', 'Sardar Vallabhbhai Patel International Airport',   'Ahmedabad',  'India', 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=600');

-- ---- SEED: AIRCRAFT ----
INSERT INTO aircraft (model, total_seats, seat_config) VALUES
('Airbus A320',    180, '3-3'),
('Airbus A321',    220, '3-3'),
('Boeing 737-800', 189, '3-3'),
('Boeing 777-300', 396, '3-4-3'),
('Airbus A380',    555, '3-4-3');

-- ---- SEED: SAMPLE FLIGHTS (generated for next 30 days) ----
-- A selection of routes; in production you'd generate these programmatically
INSERT INTO flights (flight_number, origin_id, destination_id, departure_time, arrival_time,
                     aircraft_id, cabin_class, total_seats, available_seats, price_per_person, status)
SELECT
    'LA' || LPAD((100 + gs)::TEXT, 4, '0'),
    origin_id,
    dest_id,
    NOW() + (gs || ' days')::INTERVAL + '06:00'::INTERVAL,
    NOW() + (gs || ' days')::INTERVAL + '08:30'::INTERVAL,
    1, 'Economy', 180,
    (RANDOM() * 60 + 20)::INT,
    (RANDOM() * 5000 + 3000)::NUMERIC(12,2),
    'scheduled'
FROM
    generate_series(1, 30) AS gs,
    (VALUES
        (1, 2), (2, 1),  -- DEL <-> BOM
        (1, 4), (4, 1),  -- DEL <-> BLR
        (2, 5), (5, 2),  -- BOM <-> HYD
        (6, 1), (1, 6),  -- COK <-> DEL
        (3, 1), (1, 3),  -- MAA <-> DEL
        (8, 2), (2, 8)   -- GOI <-> BOM
    ) AS routes(origin_id, dest_id);
