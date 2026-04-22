// ── Shared Auth Types ─────────────────────────────────────────────────────────
export interface User {
  id:         string;
  email:      string;
  first_name: string;
  last_name:  string;
  phone?:     string;
  avatar_url?: string;
}

// ── Airlines Domain Types ─────────────────────────────────────────────────────
export interface Airport {
  id:        number;
  iata_code: string;
  name:      string;
  city:      string;
  country:   string;
  image_url?: string;
}

export interface Flight {
  id:               string;
  flight_number:    string;
  origin:           Airport;
  destination:      Airport;
  departure_time:   string;   // ISO string
  arrival_time:     string;
  duration_minutes: number;
  aircraft_model:   string;
  cabin_class:      'Economy' | 'Business' | 'First';
  available_seats:  number;
  total_seats:      number;
  price_per_person: number;
  status:           string;
}

export interface FlightSearchParams {
  origin:       string;
  destination:  string;
  date:         string;
  passengers:   number;
  cabin_class:  string;
  trip_type:    'one-way' | 'round-trip';
  return_date?: string;
}

export interface Booking {
  id:                  string;
  booking_reference:   string;
  flight_id:           string;
  flight_number:       string;
  passenger_name:      string;
  passenger_id_number: string;
  date_of_birth:       string;
  num_passengers:      number;
  total_price:         number;
  status:              'confirmed' | 'cancelled' | 'completed' | 'pending';
  created_at:          string;
}

export interface TopDestination {
  city:           string;
  iata_code:      string;
  country:        string;
  image_url?:     string;
  starting_price: number;
}
