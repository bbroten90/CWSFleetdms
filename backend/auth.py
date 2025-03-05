from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib
import logging
import os
import sys
from sqlalchemy.orm import Session

# Add parent directory to path so we can import config
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from config import settings
from App import models, schemas
from App.database_module import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT configuration from settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Simple password hashing using SHA-256 (for development only)
# In production, use a proper password hashing library
def simple_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Try to use bcrypt, fall back to simple hashing if there's an issue
try:
    # Password hashing
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def get_password_hash(password):
        logger.info(f"Hashing password using bcrypt")
        return pwd_context.hash(password)
    
    def verify_password(plain_password, hashed_password):
        logger.info(f"Verifying password using bcrypt")
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Error verifying password with bcrypt: {str(e)}")
            # Fallback to simple hash comparison if bcrypt fails
            return simple_hash(plain_password) == hashed_password
    
    logger.info("Using bcrypt for password hashing")
except Exception as e:
    logger.warning(f"Error initializing bcrypt: {str(e)}")
    logger.warning("Falling back to simple SHA-256 hashing. DO NOT USE IN PRODUCTION!")
    
    # Use simple hashing instead
    def get_password_hash(password):
        logger.info(f"Hashing password using SHA-256")
        return simple_hash(password)
    
    def verify_password(plain_password, hashed_password):
        logger.info(f"Verifying password using SHA-256")
        return simple_hash(plain_password) == hashed_password

def authenticate_user(db: Session, username: str, password: str):
    logger.info(f"Attempting to authenticate user: {username}")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        logger.warning(f"User not found: {username}")
        return False
    
    logger.info(f"User found: {username}, verifying password")
    # For debugging only, create a simple hash of the provided password for comparison
    simple_hashed = simple_hash(password)
    logger.info(f"Simple hash of provided password: {simple_hashed[:10]}...")
    logger.info(f"Stored password hash: {user.password_hash[:10]}...")
    
    if not verify_password(password, user.password_hash):
        logger.warning(f"Password verification failed for user: {username}")
        # Try direct comparison with simple hash as a fallback
        if simple_hash(password) == user.password_hash:
            logger.info(f"Simple hash comparison succeeded for user: {username}")
            return user
        return False
    
    logger.info(f"Authentication successful for user: {username}")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def check_technician(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["technician", "manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Technician role required."
        )
    return current_user

async def check_manager(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Manager role required."
        )
    return current_user

async def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required."
        )
    return current_user
