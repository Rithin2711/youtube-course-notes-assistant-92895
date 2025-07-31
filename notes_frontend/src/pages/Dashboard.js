import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import URLInput from '../components/URLInput';

// PUBLIC_INTERFACE
function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing notes on component mount
    loadNotes();
  }, []);

  // PUBLIC_INTERFACE
  const loadNotes = async () => {
    try {
      setLoading(true);
      // Mock data for now - will be replaced with API call
      const mockNotes = [
        {
          id: 1,
          title: 'React Hooks Tutorial',
          preview: 'Learn about useState, useEffect, and custom hooks...',
          videoUrl: 'https://www.youtube.com/watch?v=example1',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15'
        },
        {
          id: 2,
          title: 'Advanced JavaScript Concepts',
          preview: 'Closures, prototypes, and async programming...',
          videoUrl: 'https://www.youtube.com/watch?v=example2',
          createdAt: '2024-01-14',
          updatedAt: '2024-01-14'
        }
      ];
      setNotes(mockNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleVideoSubmit = async (videoUrl) => {
    try {
      setLoading(true);
      setCurrentVideo(videoUrl);
      // Here we would call the backend API to process the video
      // For now, just simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Processing video:', videoUrl);
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="content-area">
          <div className="content-header">
            <h1 className="content-title">Course Notes</h1>
            <p className="content-subtitle">
              Generate AI-powered notes from YouTube course videos
            </p>
          </div>

          <URLInput onSubmit={handleVideoSubmit} loading={loading} />

          <div className="notes-section">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Recent Notes</h2>
              <button className="btn btn-secondary">
                View All
              </button>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                Loading notes...
              </div>
            ) : (
              <div className="notes-list">
                {notes.map(note => (
                  <Link 
                    key={note.id} 
                    to={`/note/${note.id}`}
                    className="note-item"
                  >
                    <h3 className="note-title">{note.title}</h3>
                    <p className="note-preview">{note.preview}</p>
                    <div className="note-meta">
                      <span className="note-date">
                        Created: {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <span className="note-date">
                        Updated: {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="split-right">
        <div className="content-area">
          <VideoPlayer videoUrl={currentVideo} />
          
          <div className="card mt-3">
            <div className="card-header">
              <h3 className="card-title">How it works</h3>
            </div>
            <div className="card-body">
              <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                <li>Paste a YouTube course video URL</li>
                <li>AI transcribes and analyzes the content</li>
                <li>Get structured notes with timestamps</li>
                <li>Edit, export, and share your notes</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
