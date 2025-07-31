import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import VideoPlayer from '../components/VideoPlayer';

// PUBLIC_INTERFACE
function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id]);

  // PUBLIC_INTERFACE
  const loadNote = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockNote = {
        id: parseInt(id),
        title: 'React Hooks Tutorial',
        content: '<h2>Introduction to React Hooks</h2><p>React Hooks were introduced in React 16.8...</p><h3>useState Hook</h3><p>The useState hook allows you to add state to functional components...</p>',
        videoUrl: 'https://www.youtube.com/watch?v=example1',
        timestamps: [
          { time: '0:30', note: 'Introduction to hooks' },
          { time: '2:15', note: 'useState explained' },
          { time: '5:40', note: 'useEffect basics' }
        ],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15'
      };
      setNote(mockNote);
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleSave = async (content) => {
    try {
      setSaving(true);
      // Mock save - replace with API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNote(prev => ({ ...prev, content, updatedAt: new Date().toISOString() }));
      console.log('Note saved:', content);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleExport = async (format) => {
    try {
      // Mock export - replace with API call
      console.log(`Exporting note as ${format}`);
      // Here you would call the backend API to generate the export
    } catch (error) {
      console.error('Error exporting note:', error);
    }
  };

  // PUBLIC_INTERFACE
  const handleShare = async () => {
    try {
      // Mock share - replace with API call
      console.log('Sharing note');
      // Here you would call the backend API to create a share link
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading note...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="content-area">
        <h1>Note not found</h1>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="content-area">
          <div className="content-header">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="content-title">{note.title}</h1>
                <p className="content-subtitle">
                  Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn btn-ghost"
                  onClick={() => handleExport('pdf')}
                >
                  Export PDF
                </button>
                <button 
                  className="btn btn-ghost"
                  onClick={() => handleExport('txt')}
                >
                  Export Text
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleShare}
                >
                  Share
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/')}
                >
                  Back
                </button>
              </div>
            </div>
          </div>

          <RichTextEditor
            initialContent={note.content}
            onSave={handleSave}
            saving={saving}
          />
        </div>
      </div>

      <div className="split-right">
        <div className="content-area">
          <VideoPlayer videoUrl={note.videoUrl} />
          
          {note.timestamps && note.timestamps.length > 0 && (
            <div className="card mt-3">
              <div className="card-header">
                <h3 className="card-title">Timestamps</h3>
              </div>
              <div className="timestamps-list">
                {note.timestamps.map((timestamp, index) => (
                  <div key={index} className="timestamp-item">
                    <button 
                      className="timestamp-button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer',
                        fontWeight: 'var(--font-weight-medium)',
                        marginRight: 'var(--spacing-md)'
                      }}
                    >
                      {timestamp.time}
                    </button>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {timestamp.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteEditor;
