from datetime import datetime, timedelta

from fastapi import HTTPException
from jose import jwt

# Security Configuration
SECRET_KEY = "MYSECRETKEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict) -> str:
    """Generate a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(authorization: str):
    """Validate bearer token and return payload."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token missing")
    try:
        token = authorization.split(" ")[1]  # Bearer <token>
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
