"""
LUXE Auth API  –  port 9000
Shared by Airlines (8001) and Cruises (8002)
"""
from __future__ import annotations

import os, uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, String, Boolean, func, select, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, mapped_column
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
DATABASE_URL             = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/luxe_users")
SECRET_KEY               = os.getenv("SECRET_KEY", "LUXE_SUPER_SECRET_CHANGE_IN_PROD_2024")
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_MINS = int(os.getenv("TOKEN_EXPIRE_MINS", "1440"))  # 24 h

# ── DB ────────────────────────────────────────────────────────────────────────
engine           = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class UserORM(Base):
    __tablename__ = "users"
    id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name    = Column(String(100), nullable=False)
    last_name     = Column(String(100), nullable=False)
    phone         = Column(String(20))
    avatar_url    = Column(String(500))
    is_active     = Column(Boolean, default=True)
    created_at    = Column(String, server_default=func.now())

# ── Security ──────────────────────────────────────────────────────────────────
pwd_ctx       = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def hash_password(pw: str) -> str:
    # bcrypt only considers the first 72 bytes; passlib raises if longer.
    # We reject long passwords with a clear 400 instead of a 500.
    if len(pw.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password is too long (max 72 bytes). Please use a shorter password.",
        )
    return pwd_ctx.hash(pw)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_token(user_id: str) -> str:
    exp  = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINS)
    data = {"sub": user_id, "exp": exp}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# ── Pydantic ──────────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    email:      EmailStr
    password:   str
    first_name: str
    last_name:  str
    phone:      Optional[str] = None

class LoginIn(BaseModel):
    email:    EmailStr
    password: str

class UserOut(BaseModel):
    id:         str
    email:      str
    first_name: str
    last_name:  str
    phone:      Optional[str]
    avatar_url: Optional[str]

class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

class ProfileUpdateIn(BaseModel):
    first_name: Optional[str] = None
    last_name:  Optional[str] = None
    phone:      Optional[str] = None
    avatar_url: Optional[str] = None

# ── Deps ──────────────────────────────────────────────────────────────────────
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserORM:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(UserORM).where(UserORM.id == uuid.UUID(user_id)))
    user   = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def to_user_out(u: UserORM) -> UserOut:
    return UserOut(id=str(u.id), email=u.email, first_name=u.first_name,
                   last_name=u.last_name, phone=u.phone, avatar_url=u.avatar_url)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="LUXE Auth API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    # Allow local MFEs + local dev tooling (localhost/127.0.0.1 on any port).
    # This avoids CORS mismatches when the browser uses 127.0.0.1 vs localhost.
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=TokenOut, status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserORM).where(UserORM.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = UserORM(
        id            = uuid.uuid4(),
        email         = body.email,
        password_hash = hash_password(body.password),
        first_name    = body.first_name,
        last_name     = body.last_name,
        phone         = body.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return TokenOut(access_token=create_token(str(user.id)), user=to_user_out(user))

@app.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserORM).where(UserORM.email == body.email))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenOut(access_token=create_token(str(user.id)), user=to_user_out(user))

@app.get("/auth/me", response_model=UserOut)


@app.put("/auth/profile", response_model=UserOut)
async def update_profile(
    body: ProfileUpdateIn,
    current_user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.first_name: current_user.first_name = body.first_name
    if body.last_name:  current_user.last_name  = body.last_name
    if body.phone:      current_user.phone       = body.phone
    if body.avatar_url: current_user.avatar_url  = body.avatar_url
    await db.commit()
    await db.refresh(current_user)
    return to_user_out(current_user)

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth-api", "port": 9000}
