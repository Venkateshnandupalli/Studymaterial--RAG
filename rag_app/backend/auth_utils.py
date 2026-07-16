from typing import Optional

from fastapi import Depends, HTTPException, Header
from jose import JWTError, jwt

from config import SUPABASE_JWT_SECRET, ALGORITHM


# ── JWT helpers ───────────────────────────────────────────────────────────────

def decode_token(token: str) -> dict:
    try:
        # Supabase uses HS256 and the JWT secret from the dashboard
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=[ALGORITHM], 
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── FastAPI dependency ────────────────────────────────────────────────────────

def get_current_user(authorization: str = Header(None)) -> dict:
    """Extract and validate the Bearer token from the Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token)
    return payload  # contains {"sub": user_id, "exp": ...}
