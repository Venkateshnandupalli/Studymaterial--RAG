from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from config import SUPABASE_JWT_SECRET


def get_current_user(authorization: str = Header(None)) -> dict:
    """Validate the Supabase Bearer JWT locally using the JWT secret.
    
    This avoids a round-trip network call to Supabase and works reliably
    for all auth methods — email/password AND Google/GitHub OAuth.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "").strip()

    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: SUPABASE_JWT_SECRET is not set."
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub", "")
        email: str = payload.get("email", "")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

        return {"id": user_id, "email": email, "sub": user_id}

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")
