from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db.supabase import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials
    try:
        # Validate JWT with Supabase Auth
        res = supabase.auth.get_user(token)
        user = res.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Default to 'client' if role isn't explicitly set in metadata
        role = user.app_metadata.get('role', 'client')
        return {"id": str(user.id), "role": role, "email": user.email}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed or token expired")

def require_role(allowed_roles: list[str]):
    """Dependency generator for role-based access control."""
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker