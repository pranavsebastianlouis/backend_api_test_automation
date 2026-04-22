-- ============================================
-- LUXE CRUISES DATABASE
-- Completely separate from Airlines DB
-- ============================================

CREATE DATABASE luxe_cruises;
\c luxe_cruises;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---- PORTS ----
CREATE TABLE ports (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(200) NOT NULL,
    city      VARCHAR(100) NOT NULL,
    country   VARCHAR(100) NOT NULL,
    image_url VARCHAR(500)
);

-- ---- SHIPS ----
CREATE TABLE ships (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    operator        VARCHAR(200) DEFAULT 'LUXE Cruises',
    total_cabins    INTEGER NOT NULL,
    max_capacity    INTEGER NOT NULL,
    year_built      INTEGER,
    gross_tonnage   INTEGER,
    amenities       TEXT[],
    image_url       VARCHAR(500),
    description     TEXT
);

-- ---- CRUISES ----
CREATE TABLE cruises (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(200) NOT NULL,
    ship_id           INTEGER REFERENCES ships(id) ON DELETE RESTRICT,
    departure_port_id INTEGER REFERENCES ports(id) ON DELETE RESTRICT,
    arrival_port_id   INTEGER REFERENCES ports(id) ON DELETE RESTRICT,
    departure_date    DATE NOT NULL,
    arrival_date      DATE NOT NULL,
    duration_nights   INTEGER NOT NULL,
    cabin_type        VARCHAR(50) DEFAULT 'Standard'
                          CHECK (cabin_type IN ('Standard','Deluxe','Suite','Penthouse')),
    price_per_person  NUMERIC(12,2) NOT NULL,
    available_cabins  INTEGER NOT NULL,
    total_cabins      INTEGER NOT NULL,
    highlights        TEXT[],
    status            VARCHAR(20) DEFAULT 'available'
                          CHECK (status IN ('available','sold_out','cancelled','completed')),
    image_url         VARCHAR(500),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cabins_check CHECK (available_cabins <= total_cabins),
    CONSTRAINT arrival_after_dep CHECK (arrival_date > departure_date)
);

CREATE INDEX idx_cruises_departure     ON cruises(departure_date);
CREATE INDEX idx_cruises_dep_port      ON cruises(departure_port_id);
CREATE INDEX idx_cruises_arr_port      ON cruises(arrival_port_id);
CREATE INDEX idx_cruises_status        ON cruises(status);
CREATE INDEX idx_cruises_route_date    ON cruises(departure_port_id, arrival_port_id, departure_date);

-- ---- CRUISE ITINERARIES ----
CREATE TABLE cruise_itineraries (
    id             SERIAL PRIMARY KEY,
    cruise_id      UUID REFERENCES cruises(id) ON DELETE CASCADE,
    day_number     INTEGER NOT NULL,
    port_id        INTEGER REFERENCES ports(id),
    arrival_time   TIME,
    departure_time TIME,
    description    TEXT,
    UNIQUE (cruise_id, day_number)
);

-- ---- CRUISE BOOKINGS ----
CREATE TABLE cruise_bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,                              -- FK to luxe_users.users
    cruise_id           UUID REFERENCES cruises(id) ON DELETE RESTRICT,
    booking_reference   VARCHAR(10) UNIQUE NOT NULL,
    passenger_name      VARCHAR(200) NOT NULL,
    passenger_id_number VARCHAR(50) NOT NULL,
    date_of_birth       DATE NOT NULL,
    num_guests          INTEGER DEFAULT 1 CHECK (num_guests > 0),
    total_price         NUMERIC(12,2) NOT NULL,
    status              VARCHAR(20) DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed','cancelled','completed','pending')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cruise_bookings_user      ON cruise_bookings(user_id);
CREATE INDEX idx_cruise_bookings_cruise    ON cruise_bookings(cruise_id);
CREATE INDEX idx_cruise_bookings_reference ON cruise_bookings(booking_reference);

-- ---- SEED: PORTS ----
INSERT INTO ports (name, city, country, image_url) VALUES
('Mumbai Passenger Terminal',    'Mumbai',    'India', 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600'),
('Cochin Port',                  'Kochi',     'India', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600'),
('Mormugao Port',                'Goa',       'India', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600'),
('Chennai Port',                 'Chennai',   'India', 'https://images.unsplash.com/photo-1604154999816-a0a1bf621a9c?w=600'),
('Visakhapatnam Port',           'Vizag',     'India', 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=600'),
('Lakshadweep Islands Terminal', 'Agatti',    'India', 'https://images.unsplash.com/photo-1552083375-1447ce886485?w=600'),
('Andaman Port Blair',           'Port Blair','India', 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600'),
('Male International Marina',    'Malé',      'Maldives', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600');

-- ---- SEED: SHIPS ----
INSERT INTO ships (name, total_cabins, max_capacity, year_built, gross_tonnage, amenities, image_url, description) VALUES
('MV Luxe Sapphire', 450, 900, 2019, 58000,
 ARRAY['Infinity Pool','Spa','Casino','Multiple Restaurants','Theater','Kids Club'],
 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600',
 'Our flagship vessel offering unmatched luxury on the Arabian Sea.'),
('MV Luxe Horizon', 380, 760, 2021, 48000,
 ARRAY['Rooftop Pool','Wellness Center','Fine Dining','Live Entertainment','Water Sports'],
 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600',
 'The perfect vessel for exploring India''s stunning coastline.'),
('MV Luxe Pearl', 280, 560, 2018, 35000,
 ARRAY['Boutique Spa','Gourmet Restaurant','Library','Yoga Deck','Private Balconies'],
 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600',
 'An intimate luxury experience for the discerning traveller.');

-- ---- SEED: CRUISES ----
INSERT INTO cruises (name, ship_id, departure_port_id, arrival_port_id, departure_date, arrival_date,
                     duration_nights, cabin_type, price_per_person, available_cabins, total_cabins,
                     highlights, status, image_url)
VALUES
('Arabian Sea Splendour', 1, 1, 6,
 CURRENT_DATE + 15, CURRENT_DATE + 22, 7, 'Standard', 28999,  80, 120,
 ARRAY['Lakshadweep Snorkeling','Sunset Gala Dinner','Island Safari'],
 'available', 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800'),

('Malabar Coast Classic', 2, 3, 2,
 CURRENT_DATE + 20, CURRENT_DATE + 25, 5, 'Deluxe', 22999, 60, 95,
 ARRAY['Goa Heritage Tour','Kerala Backwaters','Spice Market Visit'],
 'available', 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800'),

('Andaman Island Escape', 1, 4, 7,
 CURRENT_DATE + 10, CURRENT_DATE + 17, 7, 'Suite', 45999, 30, 50,
 ARRAY['Radhanagar Beach','Havelock Diving','Cellular Jail Tour'],
 'available', 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800'),

('Maldives Luxury Voyage', 3, 1, 8,
 CURRENT_DATE + 30, CURRENT_DATE + 37, 7, 'Penthouse', 89999, 10, 15,
 ARRAY['Private Island Access','Underwater Restaurant','Dolphin Watching'],
 'available', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800'),

('Eastern Coastline Explorer', 2, 4, 5,
 CURRENT_DATE + 25, CURRENT_DATE + 30, 5, 'Standard', 18999, 100, 130,
 ARRAY['Vizag Beach Hop','Chilika Lake Visit','Temple Tours'],
 'available', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800');
