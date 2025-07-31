import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
function SharedNotes() {
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedNotes();
  }, []);

  // PUBLIC_INTERFACE
  const loadSharedNotes = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockSharedNotes = [
        {
          id: 'shared-1',
          title: 'Machine Learning Fundamentals',
          preview: 'Comprehensive notes on ML algorithms, supervised learning...',
          author: 'John Doe',
          videoUrl: 'https://www.youtube.com/watch?v=example3',
          sharedAt: '2024-01-10',
          views: 125
        },
        {
          id: 'shared-2',
          title: 'Web Development Best Practices',
          preview: 'Modern approaches to building scalable web applications...',
          author: 'Jane Smith',
          videoUrl: 'https://www.youtube.com/watch?v=example4',
          sharedAt: '2024-01-08',
          views: 89
        }
      ];
      setSharedNotes(mockSharedNotes);
    } catch (error) {
      console.error('Error loading shared notes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-area">
      <div className="content-header">
        <h1 className="content-title">Shared Notes</h1>
        <p className="content-subtitle">
          Discover notes shared by the community
        </p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading shared notes...
        </div>
      ) : (
        <div className="notes-list">
          {sharedNotes.map(note => (
            <div key={note.id} className="note-item">
              <h3 className="note-title">{note.title}</h3>
              <p className="note-preview">{note.preview}</p>
              <div className="note-meta flex justify-between">
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    By {note.author} • {note.views} views
                  </span>
                </div>
                <div>
                  <span className="note-date">
                    Shared: {new Date(note.sharedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Link 
                  to={`/note/${note.id}`}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  View Notes
                </Link>
                <a 
                  href={note.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  Watch Video
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharedNotes;
