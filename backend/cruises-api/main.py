"""
LUXE Cruises API  –  port 9002
Ports include: Mumbai, Kochi, Goa, Chennai, Kolkata, Vizag
Same cities as Airline airports so users can fly to a city then board a cruise.
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
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, func, select, or_
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/luxe_cruises")
SECRET_KEY   = os.getenv("SECRET_KEY", "LUXE_SUPER_SECRET_CHANGE_IN_PROD_2024")
ALGORITHM    = "HS256"

engine            = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class PortORM(Base):
    __tablename__ = "ports"
    id        = Column(Integer, primary_key=True, autoincrement=True)
    name      = Column(String(200), nullable=False)
    city      = Column(String(100), nullable=False)
    country   = Column(String(100), nullable=False)
    image_url = Column(String(500))

class ShipORM(Base):
    __tablename__ = "ships"
    id           = Column(Integer, primary_key=True, autoincrement=True)
    name         = Column(String(200), nullable=False)
    operator     = Column(String(200), default="LUXE Cruises")
    total_cabins = Column(Integer)
    max_capacity = Column(Integer)
    year_built   = Column(Integer)
    image_url    = Column(String(500))
    description  = Column(String)

class CruiseORM(Base):
    __tablename__ = "cruises"
    id                = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name              = Column(String(200), nullable=False)
    ship_id           = Column(Integer, ForeignKey("ships.id"))
    departure_port_id = Column(Integer, ForeignKey("ports.id"))
    arrival_port_id   = Column(Integer, ForeignKey("ports.id"))
    departure_date    = Column(String, nullable=False)
    arrival_date      = Column(String, nullable=False)
    duration_nights   = Column(Integer, nullable=False)
    cabin_type        = Column(String(50), default="Standard")
    price_per_person  = Column(Numeric(12, 2), nullable=False)
    available_cabins  = Column(Integer, nullable=False)
    total_cabins      = Column(Integer, nullable=False)
    status            = Column(String(20), default="available")
    image_url         = Column(String(500))
    created_at        = Column(String, server_default=func.now())

class CruiseBookingORM(Base):
    __tablename__ = "cruise_bookings"
    id                  = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(PG_UUID(as_uuid=True), nullable=False)
    cruise_id           = Column(PG_UUID(as_uuid=True), ForeignKey("cruises.id"))
    booking_reference   = Column(String(10), unique=True, nullable=False)
    passenger_name      = Column(String(200), nullable=False)
    passenger_id_number = Column(String(50), nullable=False)
    date_of_birth       = Column(String, nullable=False)
    num_guests          = Column(Integer, default=1)
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
        if not uid: raise HTTPException(status_code=401, detail="Invalid token")
        return uid
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class PortOut(BaseModel):
    id: int; name: str; city: str; country: str; image_url: Optional[str]

class ShipOut(BaseModel):
    id: int; name: str; operator: str; total_cabins: int; max_capacity: int
    year_built: Optional[int]; image_url: Optional[str]; description: Optional[str]

class CruiseOut(BaseModel):
    id: str; name: str; ship: ShipOut; departure_port: PortOut; arrival_port: PortOut
    departure_date: str; arrival_date: str; duration_nights: int; cabin_type: str
    price_per_person: float; available_cabins: int; total_cabins: int
    status: str; image_url: Optional[str]

class CruiseBookingIn(BaseModel):
    cruise_id: str; passenger_name: str; passenger_id_number: str
    date_of_birth: str; num_guests: int = 1

class CruiseBookingOut(BaseModel):
    id: str; booking_reference: str; cruise_id: str; cruise_name: str
    passenger_name: str; passenger_id_number: str; date_of_birth: str
    num_guests: int; total_price: float; status: str; created_at: str

class TopDestinationOut(BaseModel):
    city: str; country: str; image_url: Optional[str]; starting_price: float

def make_ref() -> str:
    return "LC" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

app = FastAPI(title="LUXE Cruises API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_data()

async def seed_data():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(func.count()).select_from(PortORM))
        if res.scalar() > 0:
            return

        # ── Ports ─────────────────────────────────────────────────────────────
        # NOTE: Mumbai, Kochi, Goa, Chennai, Kolkata, Vizag all have LUXE Airlines
        # flights (BOM, COK, GOI, MAA, CCU, VTZ) — so fly-then-cruise works end-to-end
        ports_data = [
            ("Mumbai Passenger Terminal",    "Mumbai",     "India", "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600"),
            ("Cochin Port",                  "Kochi",      "India", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600"),
            ("Mormugao Port",                "Goa",        "India", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600"),
            ("Chennai Port",                 "Chennai",    "India", "https://images.unsplash.com/photo-1604154999816-a0a1bf621a9c?w=600"),
            ("Kolkata Garden Reach Terminal","Kolkata",    "India", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"),
            ("Visakhapatnam Port",           "Vizag",      "India", "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=600"),
            ("Lakshadweep Islands Terminal", "Lakshadweep","India", "https://images.unsplash.com/photo-1552083375-1447ce886485?w=600"),
            ("Andaman Port Blair",           "Port Blair", "India", "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600"),
            ("Male International Marina",    "Malé",       "Maldives","https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600"),
        ]
        for name, city, country, img in ports_data:
            db.add(PortORM(name=name, city=city, country=country, image_url=img))

        ships_data = [
            ("MV Luxe Sapphire", 450, 900, 2019, "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600", "Our flagship vessel offering unmatched luxury."),
            ("MV Luxe Horizon",  380, 760, 2021, "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600", "Perfect for exploring India's stunning coastline."),
            ("MV Luxe Pearl",    280, 560, 2018, "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600", "An intimate luxury experience for the discerning traveller."),
        ]
        for name, cabins, cap, yr, img, desc in ships_data:
            db.add(ShipORM(name=name, total_cabins=cabins, max_capacity=cap,
                           year_built=yr, image_url=img, description=desc))
        await db.commit()

        port_res = await db.execute(select(PortORM))
        ports    = {p.city: p.id for p in port_res.scalars().all()}
        ship_res = await db.execute(select(ShipORM))
        ships    = [s.id for s in ship_res.scalars().all()]

        cruise_templates = [
            # name, dep_city, arr_city, nights, cabin, price, avail, img
            ("Arabian Sea Splendour",     "Mumbai",     "Lakshadweep", 7,  "Standard",  28999, 80,  "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800"),
            ("Malabar Coast Classic",     "Goa",        "Kochi",       5,  "Deluxe",    22999, 60,  "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800"),
            ("Andaman Island Escape",     "Chennai",    "Port Blair",  7,  "Suite",     45999, 30,  "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800"),
            ("Maldives Luxury Voyage",    "Mumbai",     "Malé",        7,  "Penthouse", 89999, 10,  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800"),
            ("Eastern Coastline Explorer","Chennai",    "Vizag",       5,  "Standard",  18999, 100, "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800"),
            ("Lakshadweep Dream",         "Kochi",      "Lakshadweep", 4,  "Deluxe",    32999, 40,  "https://images.unsplash.com/photo-1552083375-1447ce886485?w=800"),
            ("Goa to Kochi Escape",       "Goa",        "Kochi",       3,  "Standard",  15999, 120, "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800"),
            ("Grand India Coastal Tour",  "Mumbai",     "Chennai",     10, "Suite",     65999, 20,  "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800"),
            ("Bay of Bengal Explorer",    "Kolkata",    "Port Blair",  6,  "Deluxe",    38999, 50,  "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800"),
            ("Vizag to Andaman Voyage",   "Vizag",      "Port Blair",  5,  "Standard",  24999, 70,  "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800"),
            ("Mumbai to Chennai Coastal", "Mumbai",     "Chennai",     5,  "Standard",  21999, 90,  "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800"),
            ("Kochi to Goa Weekend",      "Kochi",      "Goa",         3,  "Deluxe",    17999, 110, "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800"),
        ]

        for i, (name, dep_city, arr_city, nights, cabin, price, avail, img) in enumerate(cruise_templates):
            if dep_city not in ports or arr_city not in ports:
                continue
            dep = (datetime.now() + timedelta(days=10 + i * 5)).date()
            arr = dep + timedelta(days=nights)
            total_cabins = avail + random.randint(10, 40)
            db.add(CruiseORM(
                id=uuid.uuid4(), name=name,
                ship_id=ships[i % len(ships)],
                departure_port_id=ports[dep_city],
                arrival_port_id=ports[arr_city],
                departure_date=dep.isoformat(),
                arrival_date=arr.isoformat(),
                duration_nights=nights, cabin_type=cabin,
                price_per_person=price,
                available_cabins=avail, total_cabins=total_cabins,
                status="available", image_url=img,
            ))
        await db.commit()

async def _build_cruise_out(c: CruiseORM, db: AsyncSession) -> CruiseOut:
    ship = (await db.execute(select(ShipORM).where(ShipORM.id == c.ship_id))).scalar_one()
    dep  = (await db.execute(select(PortORM).where(PortORM.id == c.departure_port_id))).scalar_one()
    arr  = (await db.execute(select(PortORM).where(PortORM.id == c.arrival_port_id))).scalar_one()
    def po(p: PortORM): return PortOut(id=p.id, name=p.name, city=p.city, country=p.country, image_url=p.image_url)
    return CruiseOut(
        id=str(c.id), name=c.name,
        ship=ShipOut(id=ship.id, name=ship.name, operator=ship.operator or "LUXE Cruises",
                     total_cabins=ship.total_cabins, max_capacity=ship.max_capacity,
                     year_built=ship.year_built, image_url=ship.image_url, description=ship.description),
        departure_port=po(dep), arrival_port=po(arr),
        departure_date=c.departure_date, arrival_date=c.arrival_date,
        duration_nights=c.duration_nights, cabin_type=c.cabin_type,
        price_per_person=float(c.price_per_person),
        available_cabins=c.available_cabins, total_cabins=c.total_cabins,
        status=c.status, image_url=c.image_url,
    )

@app.get("/ports", response_model=List[PortOut])
async def list_ports(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PortORM).order_by(PortORM.city))
    return [PortOut(id=p.id, name=p.name, city=p.city, country=p.country, image_url=p.image_url)
            for p in res.scalars().all()]

@app.get("/ports/search", response_model=List[PortOut])
async def search_ports(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PortORM).where(
        or_(PortORM.city.ilike(f"%{q}%"), PortORM.name.ilike(f"%{q}%"))
    ).limit(10))
    return [PortOut(id=p.id, name=p.name, city=p.city, country=p.country, image_url=p.image_url)
            for p in res.scalars().all()]

@app.get("/cruises/search")
async def search_cruises(
    departure_port: Optional[str] = Query(None),
    destination:    Optional[str] = Query(None),
    date:           Optional[str] = Query(None),
    guests:         int           = Query(1),
    cabin_type:     Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(CruiseORM).where(CruiseORM.status == "available",
                                 CruiseORM.available_cabins >= guests)
    if departure_port:
        pr = await db.execute(select(PortORM).where(PortORM.city.ilike(f"%{departure_port}%")))
        ids = [p.id for p in pr.scalars().all()]
        if ids: q = q.where(CruiseORM.departure_port_id.in_(ids))
    if destination:
        dr = await db.execute(select(PortORM).where(PortORM.city.ilike(f"%{destination}%")))
        ids = [p.id for p in dr.scalars().all()]
        if ids: q = q.where(CruiseORM.arrival_port_id.in_(ids))
    if date:
        q = q.where(CruiseORM.departure_date >= date)
    if cabin_type and cabin_type != "Any":
        q = q.where(CruiseORM.cabin_type == cabin_type)

    res     = await db.execute(q.order_by(CruiseORM.departure_date))
    cruises = res.scalars().all()
    results = [await _build_cruise_out(c, db) for c in cruises]
    return {"cruises": results, "total": len(results)}

@app.get("/cruises/{cruise_id}", response_model=CruiseOut)
async def get_cruise(cruise_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CruiseORM).where(CruiseORM.id == uuid.UUID(cruise_id)))
    c   = res.scalar_one_or_none()
    if not c: raise HTTPException(status_code=404, detail="Cruise not found")
    return await _build_cruise_out(c, db)

@app.post("/cruise-bookings", response_model=CruiseBookingOut, status_code=201)
async def create_booking(body: CruiseBookingIn, user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db)):
    cruise = (await db.execute(select(CruiseORM).where(CruiseORM.id == uuid.UUID(body.cruise_id)))).scalar_one_or_none()
    if not cruise: raise HTTPException(status_code=404, detail="Cruise not found")
    if cruise.available_cabins < body.num_guests:
        raise HTTPException(status_code=400, detail="Not enough cabins available")
    total = float(cruise.price_per_person) * body.num_guests
    b = CruiseBookingORM(
        id=uuid.uuid4(), user_id=uuid.UUID(user_id), cruise_id=uuid.UUID(body.cruise_id),
        booking_reference=make_ref(), passenger_name=body.passenger_name,
        passenger_id_number=body.passenger_id_number, date_of_birth=body.date_of_birth,
        num_guests=body.num_guests, total_price=total, status="confirmed",
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat(),
    )
    cruise.available_cabins -= body.num_guests
    db.add(b); await db.commit(); await db.refresh(b)
    return CruiseBookingOut(id=str(b.id), booking_reference=b.booking_reference,
                             cruise_id=str(b.cruise_id), cruise_name=cruise.name,
                             passenger_name=b.passenger_name, passenger_id_number=b.passenger_id_number,
                             date_of_birth=b.date_of_birth, num_guests=b.num_guests,
                             total_price=float(b.total_price), status=b.status, created_at=b.created_at)

@app.get("/cruise-bookings/my", response_model=List[CruiseBookingOut])
async def my_bookings(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CruiseBookingORM, CruiseORM)
        .join(CruiseORM, CruiseBookingORM.cruise_id == CruiseORM.id)
        .where(CruiseBookingORM.user_id == uuid.UUID(user_id))
        .order_by(CruiseBookingORM.created_at.desc())
    )
    return [CruiseBookingOut(id=str(b.id), booking_reference=b.booking_reference,
                              cruise_id=str(b.cruise_id), cruise_name=c.name,
                              passenger_name=b.passenger_name, passenger_id_number=b.passenger_id_number,
                              date_of_birth=b.date_of_birth, num_guests=b.num_guests,
                              total_price=float(b.total_price), status=b.status, created_at=b.created_at)
            for b, c in res.all()]

@app.get("/cruise-bookings/{booking_id}", response_model=CruiseBookingOut)
async def get_booking(booking_id: str, user_id: str = Depends(get_current_user_id),
                      db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CruiseBookingORM, CruiseORM)
        .join(CruiseORM, CruiseBookingORM.cruise_id == CruiseORM.id)
        .where(CruiseBookingORM.id == uuid.UUID(booking_id),
               CruiseBookingORM.user_id == uuid.UUID(user_id))
    )
    row = res.one_or_none()
    if not row: raise HTTPException(status_code=404, detail="Booking not found")
    b, c = row
    return CruiseBookingOut(id=str(b.id), booking_reference=b.booking_reference,
                             cruise_id=str(b.cruise_id), cruise_name=c.name,
                             passenger_name=b.passenger_name, passenger_id_number=b.passenger_id_number,
                             date_of_birth=b.date_of_birth, num_guests=b.num_guests,
                             total_price=float(b.total_price), status=b.status, created_at=b.created_at)

@app.patch("/cruise-bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(CruiseBookingORM).where(
        CruiseBookingORM.id == uuid.UUID(booking_id),
        CruiseBookingORM.user_id == uuid.UUID(user_id)
    ))).scalar_one_or_none()
    if not b: raise HTTPException(status_code=404, detail="Booking not found")
    if b.status == "cancelled": raise HTTPException(status_code=400, detail="Already cancelled")
    b.status = "cancelled"
    cruise = (await db.execute(select(CruiseORM).where(CruiseORM.id == b.cruise_id))).scalar_one_or_none()
    if cruise: cruise.available_cabins += b.num_guests
    await db.commit()
    return {"message": "Booking cancelled", "booking_reference": b.booking_reference}

@app.get("/destinations/top", response_model=List[TopDestinationOut])
async def top_destinations(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PortORM).limit(6))
    return [TopDestinationOut(city=p.city, country=p.country, image_url=p.image_url,
                               starting_price=round(random.uniform(15000, 50000), 0))
            for p in res.scalars().all()]

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cruises-api", "port": 9002}
