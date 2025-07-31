from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class VideoProcessStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ExportFormat(str, Enum):
    PDF = "pdf"
    TXT = "txt"
    MD = "md"

# Video Processing Models
class VideoURLRequest(BaseModel):
    """Request model for YouTube video URL processing"""
    url: HttpUrl = Field(..., description="YouTube video URL to process")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
        }

class VideoProcessResponse(BaseModel):
    """Response model for video processing initiation"""
    task_id: str = Field(..., description="Unique task identifier for tracking processing")
    status: VideoProcessStatus = Field(..., description="Current processing status")
    message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "abc123-def456",
                "status": "pending",
                "message": "Video processing initiated"
            }
        }

class VideoProcessStatusResponse(BaseModel):
    """Response model for video processing status check"""
    task_id: str = Field(..., description="Task identifier")
    status: VideoProcessStatus = Field(..., description="Current processing status")
    progress: int = Field(..., ge=0, le=100, description="Processing progress percentage")
    message: str = Field(..., description="Status message")
    note_id: Optional[str] = Field(None, description="Generated note ID if completed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "abc123-def456",
                "status": "completed",
                "progress": 100,
                "message": "Notes generated successfully",
                "note_id": "note_789"
            }
        }

# Note Models
class NoteCreate(BaseModel):
    """Request model for creating a new note"""
    title: str = Field(..., min_length=1, max_length=200, description="Note title")
    content: str = Field(..., description="Note content in HTML format")
    video_url: Optional[HttpUrl] = Field(None, description="Associated YouTube video URL")
    timestamps: Optional[List[Dict[str, str]]] = Field([], description="Video timestamps with notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "React Hooks Tutorial",
                "content": "<h2>Introduction</h2><p>React Hooks allow...</p>",
                "video_url": "https://www.youtube.com/watch?v=example",
                "timestamps": [
                    {"time": "0:30", "note": "Introduction to hooks"},
                    {"time": "2:15", "note": "useState explained"}
                ]
            }
        }

class NoteUpdate(BaseModel):
    """Request model for updating an existing note"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Note title")
    content: Optional[str] = Field(None, description="Note content in HTML format")
    timestamps: Optional[List[Dict[str, str]]] = Field(None, description="Video timestamps with notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Updated React Hooks Tutorial",
                "content": "<h2>Updated Introduction</h2><p>React Hooks allow...</p>",
                "timestamps": [
                    {"time": "0:30", "note": "Updated introduction to hooks"}
                ]
            }
        }

class NoteResponse(BaseModel):
    """Response model for note data"""
    id: str = Field(..., description="Unique note identifier")
    title: str = Field(..., description="Note title")
    content: str = Field(..., description="Note content in HTML format")
    video_url: Optional[str] = Field(None, description="Associated YouTube video URL")
    timestamps: List[Dict[str, str]] = Field([], description="Video timestamps with notes")
    is_public: bool = Field(False, description="Whether the note is publicly shared")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    user_id: Optional[str] = Field(None, description="Owner user ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "note_123",
                "title": "React Hooks Tutorial",
                "content": "<h2>Introduction</h2><p>React Hooks allow...</p>",
                "video_url": "https://www.youtube.com/watch?v=example",
                "timestamps": [
                    {"time": "0:30", "note": "Introduction to hooks"}
                ],
                "is_public": False,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "user_id": "user_456"
            }
        }

class NotesListResponse(BaseModel):
    """Response model for notes list"""
    notes: List[NoteResponse] = Field(..., description="List of notes")
    total: int = Field(..., description="Total number of notes")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Number of notes per page")
    
    class Config:
        json_schema_extra = {
            "example": {
                "notes": [],
                "total": 10,
                "page": 1,
                "per_page": 10
            }
        }

# Export Models
class ExportRequest(BaseModel):
    """Request model for note export"""
    format: ExportFormat = Field(..., description="Export format")
    include_timestamps: bool = Field(True, description="Whether to include timestamps")
    
    class Config:
        json_schema_extra = {
            "example": {
                "format": "pdf",
                "include_timestamps": True
            }
        }

class ExportResponse(BaseModel):
    """Response model for export operation"""
    download_url: str = Field(..., description="URL to download the exported file")
    expires_at: datetime = Field(..., description="Download link expiration time")
    format: ExportFormat = Field(..., description="Export format")
    
    class Config:
        json_schema_extra = {
            "example": {
                "download_url": "/api/v1/exports/download/abc123",
                "expires_at": "2024-01-15T11:30:00Z",
                "format": "pdf"
            }
        }

# Share Models
class ShareRequest(BaseModel):
    """Request model for sharing a note"""
    is_public: bool = Field(..., description="Whether to make the note public")
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_public": True
            }
        }

class ShareResponse(BaseModel):
    """Response model for share operation"""
    share_url: str = Field(..., description="Public share URL")
    is_public: bool = Field(..., description="Whether the note is public")
    
    class Config:
        json_schema_extra = {
            "example": {
                "share_url": "/shared/note_123",
                "is_public": True
            }
        }

# User Authentication Models
class UserCreate(BaseModel):
    """Request model for user registration"""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (minimum 8 characters)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }

class UserLogin(BaseModel):
    """Request model for user login"""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }

class TokenResponse(BaseModel):
    """Response model for authentication token"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }

class UserResponse(BaseModel):
    """Response model for user data"""
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email address")
    created_at: datetime = Field(..., description="Account creation timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "user_456",
                "email": "user@example.com",
                "created_at": "2024-01-15T10:00:00Z"
            }
        }

# Error Models
class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict] = Field(None, description="Additional error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "validation_error",
                "message": "Invalid input data",
                "details": {"field": "email", "issue": "Invalid email format"}
            }
        }
