from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from routers import notes, videos, auth, export
from database import init_db

# Load environment variables
load_dotenv()

# Initialize FastAPI app with metadata for OpenAPI
app = FastAPI(
    title="YouTube Course Notes API",
    description="AI-powered note generation from YouTube course videos",
    version="1.0.0",
    openapi_tags=[
        {
            "name": "videos",
            "description": "YouTube video processing and transcription"
        },
        {
            "name": "notes",
            "description": "Note creation, editing, and management"
        },
        {
            "name": "auth",
            "description": "User authentication and authorization"
        },
        {
            "name": "export",
            "description": "Note exporting in various formats"
        }
    ]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(videos.router, prefix="/api/v1", tags=["videos"])
app.include_router(notes.router, prefix="/api/v1", tags=["notes"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(export.router, prefix="/api/v1", tags=["export"])

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()

# PUBLIC_INTERFACE
@app.get("/", summary="Root endpoint", description="Welcome message for the API")
async def root():
    """
    Root endpoint that returns basic API information
    """
    return {
        "message": "YouTube Course Notes API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

# PUBLIC_INTERFACE
@app.get("/health", summary="Health check", description="Check API health status")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {"status": "healthy", "service": "notes-api"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
