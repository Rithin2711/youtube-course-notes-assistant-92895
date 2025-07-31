from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import os
from typing import Dict
import re
import asyncio
from datetime import datetime

from models import VideoURLRequest, VideoProcessResponse, VideoProcessStatusResponse, VideoProcessStatus
from database import get_db, VideoProcessingTask, Note
from services.youtube_service import YouTubeService
from services.ai_service import AIService

router = APIRouter()

# Initialize services
youtube_service = YouTubeService()
ai_service = AIService()

# PUBLIC_INTERFACE
@router.post(
    "/videos/process",
    response_model=VideoProcessResponse,
    summary="Process YouTube video",
    description="Initiate processing of a YouTube video to generate AI notes. Returns a task ID for tracking progress."
)
async def process_video(
    request: VideoURLRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process a YouTube video URL to generate AI-powered notes.
    
    This endpoint:
    1. Validates the YouTube URL
    2. Creates a processing task
    3. Initiates background processing
    4. Returns a task ID for progress tracking
    """
    try:
        # Validate YouTube URL
        if not _is_valid_youtube_url(str(request.url)):
            raise HTTPException(
                status_code=400,
                detail="Invalid YouTube URL format"
            )
        
        # Create processing task
        task = VideoProcessingTask(
            video_url=str(request.url),
            status=VideoProcessStatus.PENDING,
            progress="0",
            message="Video processing queued"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        
        # Start background processing
        background_tasks.add_task(
            _process_video_background,
            task.id,
            str(request.url)
        )
        
        return VideoProcessResponse(
            task_id=task.id,
            status=VideoProcessStatus.PENDING,
            message="Video processing initiated successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate video processing: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.get(
    "/videos/status/{task_id}",
    response_model=VideoProcessStatusResponse,
    summary="Get processing status",
    description="Check the status of a video processing task using the task ID."
)
async def get_processing_status(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the current status of a video processing task.
    
    Returns progress information and the generated note ID if processing is complete.
    """
    task = db.query(VideoProcessingTask).filter(
        VideoProcessingTask.id == task_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Processing task not found"
        )
    
    return VideoProcessStatusResponse(
        task_id=task.id,
        status=VideoProcessStatus(task.status),
        progress=int(task.progress),
        message=task.message,
        note_id=task.note_id
    )

def _is_valid_youtube_url(url: str) -> bool:
    """Validate YouTube URL format"""
    youtube_regex = re.compile(
        r'^(https?://)?(www\.)?(youtube\.com/(watch\?v=|embed/)|youtu\.be/)[\w-]+(&[\w=]*)?$'
    )
    return bool(youtube_regex.match(url))

async def _process_video_background(task_id: str, video_url: str):
    """Background task to process video and generate notes"""
    db = SessionLocal()
    
    try:
        # Get task
        task = db.query(VideoProcessingTask).filter(
            VideoProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        # Update status to processing
        task.status = VideoProcessStatus.PROCESSING
        task.progress = "10"
        task.message = "Extracting video information..."
        db.commit()
        
        # Extract video info
        video_info = await youtube_service.get_video_info(video_url)
        
        task.progress = "30"
        task.message = "Downloading transcript..."
        db.commit()
        
        # Get transcript
        transcript = await youtube_service.get_transcript(video_url)
        
        task.progress = "60"
        task.message = "Generating AI notes..."
        db.commit()
        
        # Generate AI notes
        notes_content = await ai_service.generate_notes(
            transcript, 
            video_info.get('title', 'Untitled Video')
        )
        
        task.progress = "90"
        task.message = "Saving notes..."
        db.commit()
        
        # Create note
        note = Note(
            title=video_info.get('title', 'Untitled Video'),
            content=notes_content['content'],
            video_url=video_url,
            timestamps=notes_content.get('timestamps', []),
            is_public=False
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        
        # Update task completion
        task.status = VideoProcessStatus.COMPLETED
        task.progress = "100"
        task.message = "Notes generated successfully"
        task.note_id = note.id
        db.commit()
        
    except Exception as e:
        # Update task with error
        task.status = VideoProcessStatus.FAILED
        task.message = f"Processing failed: {str(e)}"
        db.commit()
        
    finally:
        db.close()

# Import SessionLocal for background tasks
from database import SessionLocal
