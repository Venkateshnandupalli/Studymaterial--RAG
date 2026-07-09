from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from supabase_client import supabase
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(body: RegisterRequest):
    """Register a new user. Stores bcrypt-hashed password in Supabase."""
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    supabase.table("users").insert({
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
    }).execute()

    return {"message": "User registered successfully"}


@router.post("/login")
def login(body: LoginRequest):
    """Log in and receive a JWT access token."""
    result = supabase.table("users").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    db_user = result.data[0]
    if not verify_password(body.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": db_user["email"], "name": db_user.get("name", "")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "name": db_user.get("name", ""),
        "email": db_user["email"],
    }
