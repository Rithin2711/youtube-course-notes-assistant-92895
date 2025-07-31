import React from 'react';

// PUBLIC_INTERFACE
function VideoPlayer({ videoUrl }) {
  // PUBLIC_INTERFACE
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="video-container">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: '16/9'
          }}
        ></iframe>
      ) : (
        <div className="video-placeholder">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📺</div>
            <p>Enter a YouTube URL to start taking notes</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
