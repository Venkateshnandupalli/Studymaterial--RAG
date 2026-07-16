from fastapi import Depends, HTTPException, Header
from supabase_client import supabase


def get_current_user(authorization: str = Header(None)) -> dict:
    """Validate the Supabase Bearer token using the Supabase Admin SDK.

    This works for ALL auth methods: email/password, Google OAuth, GitHub OAuth.
    The Supabase SDK handles all token formats and algorithm details internally.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(status_code=401, detail="Token is empty")

    try:
        res = supabase.auth.get_user(token)

        if res is None or res.user is None:
            raise HTTPException(status_code=401, detail="Invalid token: no user found")

        user = res.user
        user_id = user.id
        email = user.email or ""

        return {"id": user_id, "email": email, "sub": user_id}

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Provide clearer error messages for common cases
        if "expired" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {error_msg}")
