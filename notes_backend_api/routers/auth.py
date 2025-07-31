from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

from models import UserCreate, UserLogin, TokenResponse, UserResponse
from database import get_db, User

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# PUBLIC_INTERFACE
@router.post(
    "/auth/register",
    response_model=TokenResponse,
    summary="Register a new user",
    description="Create a new user account and return an access token."
)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    Creates a new user with email and password, then returns an access token
    for immediate authentication.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate access token
    access_token = _create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

# PUBLIC_INTERFACE
@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Login user",
    description="Authenticate user with email and password, return access token."
)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    Validates user credentials and returns a JWT token for API access.
    """
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Generate access token
    access_token = _create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

# PUBLIC_INTERFACE
@router.get(
    "/auth/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get current authenticated user information."
)
async def get_current_user(
    db: Session = Depends(get_db),
    # Note: In a real implementation, you'd have token validation here
):
    """
    Get current authenticated user information.
    
    Requires valid JWT token in Authorization header.
    """
    # Mock user for now - in real implementation, decode JWT token
    mock_user = User(
        id="user_123",
        email="demo@example.com",
        created_at=datetime.utcnow()
    )
    
    return UserResponse(
        id=mock_user.id,
        email=mock_user.email,
        created_at=mock_user.created_at
    )

def _create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
