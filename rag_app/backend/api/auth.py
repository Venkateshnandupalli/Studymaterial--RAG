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

from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.google import GoogleSSO
from fastapi_sso.sso.github import GithubSSO
import secrets
import os
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

google_sso = GoogleSSO(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    f"{BACKEND_URL}/auth/google/callback",
    allow_insecure_http=True
)

github_sso = GithubSSO(
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    f"{BACKEND_URL}/auth/github/callback",
    allow_insecure_http=True
)

async def process_oauth_user(email: str, name: str):
    if not email:
        raise HTTPException(status_code=400, detail="OAuth provider did not return an email")
        
    result = supabase.table("users").select("*").eq("email", email).execute()
    if not result.data:
        supabase.table("users").insert({
            "name": name or "",
            "email": email,
            "password": hash_password(secrets.token_urlsafe(32)),
        }).execute()
        
    token = create_access_token({"sub": email, "name": name or ""})
    import urllib.parse
    safe_name = urllib.parse.quote(name or email or "")
    redirect_url = f"{FRONTEND_URL}/oauth/callback?token={token}&name={safe_name}"
    return RedirectResponse(url=redirect_url)

@router.get("/google/login")
async def google_login():
    with google_sso:
        return await google_sso.get_login_redirect()

@router.get("/google/callback")
async def google_callback(request: Request):
    with google_sso:
        user = await google_sso.verify_and_process(request)
    if not user:
        raise HTTPException(status_code=400, detail="Failed to login with Google")
    
    return await process_oauth_user(user.email, user.display_name)

@router.get("/github/login")
async def github_login():
    with github_sso:
        return await github_sso.get_login_redirect()

@router.get("/github/callback")
async def github_callback(request: Request):
    with github_sso:
        user = await github_sso.verify_and_process(request)
    if not user:
        raise HTTPException(status_code=400, detail="Failed to login with GitHub")
    
    return await process_oauth_user(user.email, user.display_name)

