from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

# All authentication routes (login, register, OAuth) are now handled 
# directly on the frontend by the Supabase SDK. 


