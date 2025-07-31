from sqlalchemy import create_engine, Column, String, Text, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./notes.db")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    video_url = Column(String, nullable=True)
    timestamps = Column(JSON, default=list)
    is_public = Column(Boolean, default=False)
    user_id = Column(String, nullable=True)  # For anonymous notes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VideoProcessingTask(Base):
    __tablename__ = "video_processing_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_url = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(String, default="0")
    message = Column(String, default="")
    note_id = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ExportTask(Base):
    __tablename__ = "export_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    note_id = Column(String, nullable=False)
    format = Column(String, nullable=False)  # pdf, txt, md
    file_path = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    user_id = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database dependency
def get_db():
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# PUBLIC_INTERFACE
async def init_db():
    """
    Initialize database tables
    """
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")
