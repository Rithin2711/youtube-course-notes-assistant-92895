from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import tempfile
from datetime import datetime, timedelta

from models import ExportRequest, ExportResponse, ExportFormat
from database import get_db, Note, ExportTask
from services.export_service import ExportService

router = APIRouter()
export_service = ExportService()

# PUBLIC_INTERFACE
@router.post(
    "/notes/{note_id}/export",
    response_model=ExportResponse,
    summary="Export a note",
    description="Export a note in the specified format (PDF, TXT, or Markdown)."
)
async def export_note(
    note_id: str,
    export_data: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Export a note in the specified format.
    
    Supported formats:
    - PDF: Formatted document with styling
    - TXT: Plain text version
    - MD: Markdown format
    
    Returns a download URL that expires after 1 hour.
    """
    # Check if note exists
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    
    try:
        # Create export task
        export_task = ExportTask(
            note_id=note_id,
            format=export_data.format.value,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(export_task)
        db.commit()
        db.refresh(export_task)
        
        # Start background export
        background_tasks.add_task(
            _export_note_background,
            export_task.id,
            note,
            export_data.format,
            export_data.include_timestamps
        )
        
        return ExportResponse(
            download_url=f"/api/v1/exports/download/{export_task.id}",
            expires_at=export_task.expires_at,
            format=export_data.format
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate export: {str(e)}"
        )

# PUBLIC_INTERFACE
@router.get(
    "/exports/download/{task_id}",
    summary="Download exported file",
    description="Download the exported file using the task ID from the export response."
)
async def download_export(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    Download an exported file.
    
    The download link expires after 1 hour for security.
    """
    # Get export task
    export_task = db.query(ExportTask).filter(
        ExportTask.id == task_id
    ).first()
    
    if not export_task:
        raise HTTPException(
            status_code=404,
            detail="Export task not found"
        )
    
    # Check if expired
    if export_task.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=410,
            detail="Download link has expired"
        )
    
    # Check if file exists
    if not export_task.file_path or not os.path.exists(export_task.file_path):
        raise HTTPException(
            status_code=404,
            detail="Export file not found or still processing"
        )
    
    # Get file extension for proper content type
    file_ext = export_task.format
    content_type = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "md": "text/markdown"
    }.get(file_ext, "application/octet-stream")
    
    # Get note for filename
    note = db.query(Note).filter(Note.id == export_task.note_id).first()
    filename = f"{note.title if note else 'note'}.{file_ext}"
    
    return FileResponse(
        path=export_task.file_path,
        media_type=content_type,
        filename=filename
    )

async def _export_note_background(
    task_id: str,
    note: Note,
    format: ExportFormat,
    include_timestamps: bool
):
    """Background task to generate export file"""
    from database import SessionLocal
    
    db = SessionLocal()
    
    try:
        # Get task
        export_task = db.query(ExportTask).filter(
            ExportTask.id == task_id
        ).first()
        
        if not export_task:
            return
        
        # Update status
        export_task.status = "processing"
        db.commit()
        
        # Generate export file
        if format == ExportFormat.PDF:
            file_path = await export_service.export_to_pdf(
                note, include_timestamps
            )
        elif format == ExportFormat.TXT:
            file_path = await export_service.export_to_txt(
                note, include_timestamps
            )
        elif format == ExportFormat.MD:
            file_path = await export_service.export_to_markdown(
                note, include_timestamps
            )
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        # Update task with file path
        export_task.file_path = file_path
        export_task.status = "completed"
        db.commit()
        
    except Exception as e:
        # Update task with error
        export_task.status = "failed"
        db.commit()
        print(f"Export failed: {str(e)}")
        
    finally:
        db.close()
