from typing import Optional

from fastapi import Depends, HTTPException, Header
from supabase_client import supabase

def get_current_user(authorization: str = Header(None)) -> dict:
    """Extract and validate the Bearer token using Supabase."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = authorization.replace("Bearer ", "").strip()
    
    try:
        res = supabase.auth.get_user(token)
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": res.user.id, "email": res.user.email, "sub": res.user.id}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

