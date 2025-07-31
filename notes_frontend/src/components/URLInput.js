import React, { useState } from 'react';

// PUBLIC_INTERFACE
function URLInput({ onSubmit, loading = false }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  const validateYouTubeURL = (url) => {
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeURL(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    onSubmit(url.trim());
  };

  return (
    <div className="url-input-container">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="url"
            className="input url-input flex-1"
            placeholder="Paste YouTube course video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                Processing...
              </>
            ) : (
              'Generate Notes'
            )}
          </button>
        </div>
        {error && (
          <div style={{ color: 'var(--error)', fontSize: '14px', marginTop: 'var(--spacing-sm)' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default URLInput;
