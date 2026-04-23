"""
LUXE Airlines API  –  port 9001
Airports include: Mumbai, Kochi, Goa, Chennai, Kolkata — same cities as Cruise ports
so users can fly to a city then book a cruise from there.
"""
from __future__ import annotations
import os, uuid, random, string
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, func, select, and_, or_
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/luxe_airlines")
SECRET_KEY   = os.getenv("SECRET_KEY", "LUXE_SUPER_SECRET_CHANGE_IN_PROD_2024")
ALGORITHM    = "HS256"

engine            = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class AirportORM(Base):
    __tablename__ = "airports"
    id        = Column(Integer, primary_key=True, autoincrement=True)
    iata_code = Column(String(3), unique=True, nullable=False)
    name      = Column(String(200), nullable=False)
    city      = Column(String(100), nullable=False)
    country   = Column(String(100), nullable=False)
    image_url = Column(String(500))

class AircraftORM(Base):
    __tablename__ = "aircraft"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    model       = Column(String(100))
    total_seats = Column(Integer)
    seat_config = Column(String(20))

class FlightORM(Base):
    __tablename__ = "flights"
    id               = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_number    = Column(String(10), nullable=False)
    origin_id        = Column(Integer, ForeignKey("airports.id"))
    destination_id   = Column(Integer, ForeignKey("airports.id"))
    departure_time   = Column(String, nullable=False)
    arrival_time     = Column(String, nullable=False)
    aircraft_id      = Column(Integer, ForeignKey("aircraft.id"))
    cabin_class      = Column(String(20), default="Economy")
    total_seats      = Column(Integer, nullable=False)
    available_seats  = Column(Integer, nullable=False)
    price_per_person = Column(Numeric(12, 2), nullable=False)
    status           = Column(String(20), default="scheduled")

class BookingORM(Base):
    __tablename__ = "bookings"
    id                  = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(PG_UUID(as_uuid=True), nullable=False)
    flight_id           = Column(PG_UUID(as_uuid=True), ForeignKey("flights.id"))
    booking_reference   = Column(String(10), unique=True, nullable=False)
    passenger_name      = Column(String(200), nullable=False)
    passenger_id_number = Column(String(50), nullable=False)
    date_of_birth       = Column(String, nullable=False)
    num_passengers      = Column(Integer, default=1)
    total_price         = Column(Numeric(12, 2), nullable=False)
    status              = Column(String(20), default="confirmed")
    created_at          = Column(String, server_default=func.now())
    updated_at          = Column(String, server_default=func.now())

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)

async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")
        return uid
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class AirportOut(BaseModel):
    id: int; iata_code: str; name: str; city: str; country: str; image_url: Optional[str]

class FlightOut(BaseModel):
    id: str; flight_number: str
    origin: AirportOut; destination: AirportOut
    departure_time: str; arrival_time: str; duration_minutes: int
    aircraft_model: str; cabin_class: str
    available_seats: int; total_seats: int
    price_per_person: float; status: str

class BookingIn(BaseModel):
    flight_id: str; passenger_name: str; passenger_id_number: str
    date_of_birth: str; num_passengers: int = 1

class BookingOut(BaseModel):
    id: str; booking_reference: str; flight_id: str; flight_number: str
    passenger_name: str; passenger_id_number: str; date_of_birth: str
    num_passengers: int; total_price: float; status: str; created_at: str

class TopDestinationOut(BaseModel):
    city: str; iata_code: str; country: str; image_url: Optional[str]; starting_price: float

def make_ref() -> str:
    return "LA" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

def calc_duration(dep: str, arr: str) -> int:
    try:
        d = datetime.fromisoformat(dep[:19])
        a = datetime.fromisoformat(arr[:19])
        return max(0, int((a - d).total_seconds() // 60))
    except:
        return 0

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

app = FastAPI(title="LUXE Airlines API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_data()

async def seed_data():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(func.count()).select_from(AirportORM))
        if res.scalar() > 0:
            return

        # ── Airports ────────────────────────────────────────────────────────
        # NOTE: Mumbai(BOM), Kochi(COK), Goa(GOI), Chennai(MAA), Kolkata(CCU),
        #       and Vizag(VTZ) match the cruise port cities so users can fly → cruise
        airports_data = [
            ("DEL", "Indira Gandhi Intl",              "New Delhi",  "India", "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600"),
            ("BOM", "Chhatrapati Shivaji Maharaj Intl","Mumbai",     "India", "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600"),
            ("MAA", "Chennai International",            "Chennai",    "India", "https://images.unsplash.com/photo-1604154999816-a0a1bf621a9c?w=600"),
            ("BLR", "Kempegowda International",         "Bengaluru",  "India", "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600"),
            ("HYD", "Rajiv Gandhi International",       "Hyderabad",  "India", "https://images.unsplash.com/photo-1609944304977-3b3e5b14a62d?w=600"),
            ("COK", "Cochin International",             "Kochi",      "India", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600"),
            ("CCU", "Netaji Subhas Chandra Bose Intl",  "Kolkata",    "India", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"),
            ("GOI", "Dabolim Airport",                  "Goa",        "India", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600"),
            ("JAI", "Jaipur International",             "Jaipur",     "India", "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600"),
            ("VTZ", "Visakhapatnam International",      "Vizag",      "India", "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=600"),
            ("PNQ", "Pune Airport",                     "Pune",       "India", "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=600"),
            ("IXM", "Madurai Airport",                  "Madurai",    "India", "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600"),
        ]
        for iata, name, city, country, img in airports_data:
            db.add(AirportORM(iata_code=iata, name=name, city=city, country=country, image_url=img))

        aircraft_list = [
            AircraftORM(model="Airbus A320",    total_seats=180, seat_config="3-3"),
            AircraftORM(model="Airbus A321",    total_seats=220, seat_config="3-3"),
            AircraftORM(model="Boeing 737-800", total_seats=189, seat_config="3-3"),
            AircraftORM(model="Boeing 777-300", total_seats=396, seat_config="3-4-3"),
        ]
        for ac in aircraft_list:
            db.add(ac)
        await db.commit()

        ap_res = await db.execute(select(AirportORM))
        ap_map = {a.iata_code: a.id for a in ap_res.scalars().all()}
        ac_res = await db.execute(select(AircraftORM))
        ac_ids = [a.id for a in ac_res.scalars().all()]

        # Routes with duration (minutes) and base price (INR)
        routes = [
            ("DEL","BOM",135,4500), ("BOM","DEL",130,4500),
            ("DEL","BLR",165,5200), ("BLR","DEL",160,5200),
            ("DEL","COK",195,6100), ("COK","DEL",190,6100),
            ("DEL","MAA",160,5600), ("MAA","DEL",155,5600),
            ("DEL","CCU",145,4800), ("CCU","DEL",140,4800),
            ("BOM","HYD", 80,3800), ("HYD","BOM", 75,3800),
            ("BOM","GOI", 65,3200), ("GOI","BOM", 60,3200),
            ("BOM","COK",110,4200), ("COK","BOM",105,4200),
            ("BOM","MAA",110,4100), ("MAA","BOM",105,4100),
            ("MAA","COK", 65,2800), ("COK","MAA", 60,2800),
            ("MAA","VTZ",100,3500), ("VTZ","MAA", 95,3500),
            ("CCU","VTZ", 90,3200), ("VTZ","CCU", 85,3200),
            ("BLR","GOI", 75,3000), ("GOI","BLR", 70,3000),
            ("HYD","VTZ", 80,3100), ("VTZ","HYD", 75,3100),
            ("DEL","JAI", 60,2500), ("JAI","DEL", 55,2500),
        ]

        flight_counter = 100
        for day_offset in range(1, 31):
            for orig, dest, dur, base_price in routes:
                if orig not in ap_map or dest not in ap_map:
                    continue
                dep_hour = random.choice([6, 7, 8, 9, 10, 12, 14, 16, 18, 20])
                dep_dt   = datetime.now().replace(hour=dep_hour, minute=0, second=0, microsecond=0) \
                           + timedelta(days=day_offset)
                arr_dt   = dep_dt + timedelta(minutes=dur + random.randint(-5, 10))
                price    = round(base_price * random.uniform(0.85, 1.35), 2)
                seats    = random.randint(150, 189)
                avail    = random.randint(8, seats)

                db.add(FlightORM(
                    id               = uuid.uuid4(),
                    flight_number    = f"LA{flight_counter:04d}",
                    origin_id        = ap_map[orig],
                    destination_id   = ap_map[dest],
                    departure_time   = dep_dt.isoformat(),
                    arrival_time     = arr_dt.isoformat(),
                    aircraft_id      = random.choice(ac_ids),
                    cabin_class      = random.choice(["Economy","Economy","Economy","Business"]),
                    total_seats      = seats,
                    available_seats  = avail,
                    price_per_person = price,
                    status           = "scheduled",
                ))
                flight_counter += 1
        await db.commit()

async def _build_flight_out(f: FlightORM, db: AsyncSession) -> FlightOut:
    orig = (await db.execute(select(AirportORM).where(AirportORM.id == f.origin_id))).scalar_one()
    dest = (await db.execute(select(AirportORM).where(AirportORM.id == f.destination_id))).scalar_one()
    ac   = (await db.execute(select(AircraftORM).where(AircraftORM.id == f.aircraft_id))).scalar_one_or_none()
    def ap(a: AirportORM): return AirportOut(id=a.id, iata_code=a.iata_code, name=a.name,
                                              city=a.city, country=a.country, image_url=a.image_url)
    return FlightOut(
        id=str(f.id), flight_number=f.flight_number,
        origin=ap(orig), destination=ap(dest),
        departure_time=f.departure_time, arrival_time=f.arrival_time,
        duration_minutes=calc_duration(f.departure_time, f.arrival_time),
        aircraft_model=ac.model if ac else "Unknown",
        cabin_class=f.cabin_class, available_seats=f.available_seats,
        total_seats=f.total_seats, price_per_person=float(f.price_per_person), status=f.status,
    )

@app.get("/airports", response_model=List[AirportOut])
async def list_airports(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AirportORM).order_by(AirportORM.city))
    return [AirportOut(id=a.id, iata_code=a.iata_code, name=a.name, city=a.city,
                        country=a.country, image_url=a.image_url) for a in res.scalars().all()]

@app.get("/airports/search", response_model=List[AirportOut])
async def search_airports(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AirportORM).where(
        or_(AirportORM.iata_code.ilike(f"%{q.upper()}%"),
            AirportORM.city.ilike(f"%{q}%"),
            AirportORM.name.ilike(f"%{q}%"))
    ).limit(10))
    return [AirportOut(id=a.id, iata_code=a.iata_code, name=a.name, city=a.city,
                        country=a.country, image_url=a.image_url) for a in res.scalars().all()]

@app.get("/flights/search")
async def search_flights(
    origin: str = Query(...), destination: str = Query(...), date: str = Query(...),
    passengers: int = Query(1), cabin_class: str = Query("Economy"),
    db: AsyncSession = Depends(get_db),
):
    orig_ap = (await db.execute(select(AirportORM).where(AirportORM.iata_code == origin.upper()))).scalar_one_or_none()
    dest_ap = (await db.execute(select(AirportORM).where(AirportORM.iata_code == destination.upper()))).scalar_one_or_none()
    if not orig_ap or not dest_ap:
        raise HTTPException(status_code=404, detail="Airport not found")

    q = select(FlightORM).where(and_(
        FlightORM.origin_id       == orig_ap.id,
        FlightORM.destination_id  == dest_ap.id,
        FlightORM.departure_time  >= f"{date}T00:00:00",
        FlightORM.departure_time  <= f"{date}T23:59:59",
        FlightORM.available_seats >= passengers,
        FlightORM.status          != "cancelled",
    )).order_by(FlightORM.departure_time)

    if cabin_class and cabin_class != "Any":
        q = q.where(FlightORM.cabin_class == cabin_class)

    res     = await db.execute(q)
    flights = res.scalars().all()
    results = [await _build_flight_out(f, db) for f in flights]
    return {"flights": results, "total": len(results),
            "search_params": {"origin": origin, "destination": destination, "date": date,
                              "passengers": passengers, "cabin_class": cabin_class}}

@app.get("/flights/{flight_id}", response_model=FlightOut)
async def get_flight(flight_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(FlightORM).where(FlightORM.id == uuid.UUID(flight_id)))
    f   = res.scalar_one_or_none()
    if not f: raise HTTPException(status_code=404, detail="Flight not found")
    return await _build_flight_out(f, db)

@app.post("/bookings", response_model=BookingOut, status_code=201)
async def create_booking(body: BookingIn, user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db)):
    flight = (await db.execute(select(FlightORM).where(FlightORM.id == uuid.UUID(body.flight_id)))).scalar_one_or_none()
    if not flight: raise HTTPException(status_code=404, detail="Flight not found")
    if flight.available_seats < body.num_passengers:
        raise HTTPException(status_code=400, detail="Not enough seats available")
    total = float(flight.price_per_person) * body.num_passengers
    b = BookingORM(
        id=uuid.uuid4(), user_id=uuid.UUID(user_id), flight_id=uuid.UUID(body.flight_id),
        booking_reference=make_ref(), passenger_name=body.passenger_name,
        passenger_id_number=body.passenger_id_number, date_of_birth=body.date_of_birth,
        num_passengers=body.num_passengers, total_price=total, status="confirmed",
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat(),
    )
    flight.available_seats -= body.num_passengers
    db.add(b); await db.commit(); await db.refresh(b)
    return BookingOut(id=str(b.id), booking_reference=b.booking_reference,
                      flight_id=str(b.flight_id), flight_number=flight.flight_number,
                      passenger_name=b.passenger_name, passenger_id_number=b.passenger_id_number,
                      date_of_birth=b.date_of_birth, num_passengers=b.num_passengers,
                      total_price=float(b.total_price), status=b.status, created_at=b.created_at)

@app.get("/bookings/my", response_model=List[BookingOut])
async def my_bookings(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(BookingORM, FlightORM).join(FlightORM, BookingORM.flight_id == FlightORM.id)
        .where(BookingORM.user_id == uuid.UUID(user_id))
        .order_by(BookingORM.created_at.desc())
    )
    return [BookingOut(id=str(b.id), booking_reference=b.booking_reference,
                       flight_id=str(b.flight_id), flight_number=f.flight_number,
                       passenger_name=b.passenger_name, passenger_id_number=b.passenger_id_number,
                       date_of_birth=b.date_of_birth, num_passengers=b.num_passengers,
                       total_price=float(b.total_price), status=b.status, created_at=b.created_at)
            for b, f in res.all()]

@app.get("/bookings/{booking_id}", response_model=BookingOut)
async def get_booking(booking_id: str, user_id: str = Depends(get_current_user_id),
                      db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(BookingORM, FlightORM).join(FlightORM, BookingORM.flight_id == FlightORM.id)
        .where(BookingORM.id == uuid.UUID(booking_id), BookingORM.user_id == uuid.UUID(user_id))
    )
    row = res.one_or_none()
    if not row: raise HTTPException(status_code=404, detail="Booking not found")
    b, f = row
    return BookingOut(id=str(b.id), booking_reference=b.booking_reference,
                      flight_id=str(b.flight_id), flight_number=f.flight_number,
                      passenger_name=b.passenger_name, passenger_id_number=b.passenger_id_number,
                      date_of_birth=b.date_of_birth, num_passengers=b.num_passengers,
                      total_price=float(b.total_price), status=b.status, created_at=b.created_at)

@app.patch("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(BookingORM).where(
        BookingORM.id == uuid.UUID(booking_id), BookingORM.user_id == uuid.UUID(user_id)
    ))).scalar_one_or_none()
    if not b: raise HTTPException(status_code=404, detail="Booking not found")
    if b.status == "cancelled": raise HTTPException(status_code=400, detail="Already cancelled")
    b.status = "cancelled"
    flight = (await db.execute(select(FlightORM).where(FlightORM.id == b.flight_id))).scalar_one_or_none()
    if flight: flight.available_seats += b.num_passengers
    await db.commit()
    return {"message": "Booking cancelled", "booking_reference": b.booking_reference}

@app.get("/destinations/top", response_model=List[TopDestinationOut])
async def top_destinations(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AirportORM).order_by(AirportORM.city).limit(8))
    return [TopDestinationOut(city=a.city, iata_code=a.iata_code, country=a.country,
                               image_url=a.image_url,
                               starting_price=round(random.uniform(2500, 8000), 0))
            for a in res.scalars().all()]

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "airlines-api", "port": 9001}
