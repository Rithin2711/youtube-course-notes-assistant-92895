from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import re

from models import (
    NoteCreate, NoteUpdate, NoteResponse, NotesListResponse,
    ShareRequest, ShareResponse
)
from database import get_db, Note

router = APIRouter()

# PUBLIC_INTERFACE
@router.post(
    "/notes",
    response_model=NoteResponse,
    summary="Create a new note",
    description="Create a new note with title, content, and optional video URL and timestamps."
)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new note.
    
    This endpoint allows users to create notes manually or programmatically.
    The content should be in HTML format for rich text support.
    """
    try:
        # Sanitize HTML content
        sanitized_content = _sanitize_html_content(note_data.content)
        
        note = Note(
            title=note_data.title,
            content=sanitized_content,
            video_url=str(note_data.video_url) if note_data.video_url else None,
            timestamps=note_data.timestamps or [],
            is_public=False
        )
        
        db.add(note)
        db.commit()
        db.refresh(note)
        
        return _note_to_response(note)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create note: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.get(
    "/notes",
    response_model=NotesListResponse,
    summary="Get notes list",
    description="Retrieve a paginated list of notes. Can filter by public/private status."
)
async def get_notes(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Number of notes per page"),
    public_only: bool = Query(False, description="Only return public notes"),
    db: Session = Depends(get_db)
):
    """
    Get a paginated list of notes.
    
    Parameters:
    - page: Page number (starts from 1)
    - per_page: Number of notes per page (max 100)
    - public_only: Filter to show only public notes
    """
    try:
        query = db.query(Note)
        
        if public_only:
            query = query.filter(Note.is_public == True)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        notes = query.offset(offset).limit(per_page).all()
        
        return NotesListResponse(
            notes=[_note_to_response(note) for note in notes],
            total=total,
            page=page,
            per_page=per_page
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve notes: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.get(
    "/notes/{note_id}",
    response_model=NoteResponse,
    summary="Get a specific note",
    description="Retrieve a specific note by its ID."
)
async def get_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific note by ID.
    
    Returns the complete note data including content, timestamps, and metadata.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    
    return _note_to_response(note)

# PUBLIC_INTERFACE
@router.put(
    "/notes/{note_id}",
    response_model=NoteResponse,
    summary="Update a note",
    description="Update an existing note's title, content, or timestamps."
)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing note.
    
    Only provided fields will be updated. All fields are optional.
    Content will be sanitized for security.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    
    try:
        # Update provided fields
        if note_data.title is not None:
            note.title = note_data.title
        
        if note_data.content is not None:
            note.content = _sanitize_html_content(note_data.content)
        
        if note_data.timestamps is not None:
            note.timestamps = note_data.timestamps
        
        db.commit()
        db.refresh(note)
        
        return _note_to_response(note)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update note: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.delete(
    "/notes/{note_id}",
    summary="Delete a note",
    description="Delete a specific note by its ID."
)
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a note.
    
    This action is irreversible. The note will be permanently removed.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    
    try:
        db.delete(note)
        db.commit()
        
        return {"message": "Note deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete note: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.post(
    "/notes/{note_id}/share",
    response_model=ShareResponse,
    summary="Share a note",
    description="Make a note public or private for sharing."
)
async def share_note(
    note_id: str,
    share_data: ShareRequest,
    db: Session = Depends(get_db)
):
    """
    Share a note by making it public or private.
    
    Public notes can be accessed by anyone with the share URL.
    Private notes are only accessible to the owner.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    
    try:
        note.is_public = share_data.is_public
        db.commit()
        
        share_url = f"/shared/{note_id}" if share_data.is_public else None
        
        return ShareResponse(
            share_url=share_url or "",
            is_public=share_data.is_public
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update sharing settings: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.get(
    "/notes/shared/{note_id}",
    response_model=NoteResponse,
    summary="Get a shared note",
    description="Access a publicly shared note by its ID."
)
async def get_shared_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a publicly shared note.
    
    Only notes that have been made public can be accessed through this endpoint.
    """
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.is_public == True
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Shared note not found or not public"
        )
    
    return _note_to_response(note)

def _sanitize_html_content(content: str) -> str:
    """Sanitize HTML content to prevent XSS attacks"""
    import bleach
    
    allowed_tags = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'blockquote', 'code', 'pre'
    ]
    
    allowed_attributes = {}
    
    return bleach.clean(content, tags=allowed_tags, attributes=allowed_attributes)

def _note_to_response(note: Note) -> NoteResponse:
    """Convert database note to response model"""
    return NoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        video_url=note.video_url,
        timestamps=note.timestamps or [],
        is_public=note.is_public,
        created_at=note.created_at,
        updated_at=note.updated_at,
        user_id=note.user_id
    )
