import React, { useEffect, useState } from "react";
import "./App.css";
import "./index.css";

// PUBLIC_INTERFACE
function App() {
  // --- State Definitions ---
  const [user, setUser] = useState(null); // null means not authenticated
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [notes, setNotes] = useState([]); // List of user/owned notes
  const [currentNote, setCurrentNote] = useState(null); // The note object {id, title, body, ...}
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); // For responsive view
  const [sharingUrl, setSharingUrl] = useState("");
  const [editingBody, setEditingBody] = useState(""); // For rich text edit
  const [activeTab, setActiveTab] = useState("my-notes"); // "my-notes"|"shared"
  // --- End state ---

  // Simulated API endpoint root
  const API_ROOT = process.env.REACT_APP_API_ROOT || "http://localhost:5001/api";

  // -- Authentication check on mount --
  useEffect(() => {
    // PUBLIC_INTERFACE
    async function fetchUser() {
      try {
        // Check for existing token in localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
          // In production, validate token with backend
          // For now, use demo user with token
          setUser({
            id: 1,
            email: "demo@notegpt.com",
            name: "Demo User",
            avatar: null,
            token: token
          });
        } else {
          // Demo mode - auto-login for testing
          const demoToken = 'demo-token-' + Date.now();
          localStorage.setItem('auth_token', demoToken);
          setUser({
            id: 1,
            email: "demo@notegpt.com",
            name: "Demo User",
            avatar: null,
            token: demoToken
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  // Fetch user's notes on mount or when user logs in
  useEffect(() => {
    if (!user) return;
    async function fetchNotes() {
      setIsLoading(true);
      try {
        // Try to fetch from real API
        const response = await fetch(`${API_ROOT}/notes`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const apiNotes = await response.json();
          // Transform API response to frontend format
          const formattedNotes = apiNotes.map(note => ({
            id: note.id,
            title: note.title,
            youtube_url: note.youtube_url || '',
            body: note.content || '',
            timestamps: note.timestamps || [],
            exportable: true,
            shared: note.is_public || false,
          }));
          setNotes(formattedNotes);
        } else {
          // Fallback to demo data if API fails
          console.log('API not available, using demo data');
          setNotes([
            {
              id: 1,
              title: "Sample Note (Demo)",
              youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              body: "<p><strong>This is a demo note.</strong> Click 'Generate Notes' with a real YouTube URL to create AI-powered notes.</p>",
              timestamps: [{ ts: 124, label: "2:04", content: "Sample timestamp." }],
              exportable: true,
              shared: false,
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        // Fallback to demo data on error
        setNotes([
          {
            id: 1,
            title: "Sample Note (Demo)",
            youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            body: "<p><strong>This is a demo note.</strong> Click 'Generate Notes' with a real YouTube URL to create AI-powered notes.</p>",
            timestamps: [],
            exportable: true,
            shared: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotes();
  }, [user]);

  // Set currentNote when notes change (as default view)
  useEffect(() => {
    if (!currentNote && notes.length > 0) setCurrentNote(notes[0]);
  }, [notes]);

  // Handle sidebar for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 700) setSidebarVisible(false);
      else setSidebarVisible(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // -- UI Event Handlers --

  // PUBLIC_INTERFACE
  function handleYoutubeUrlInput(e) {
    setYoutubeUrl(e.target.value);
    // Clear any previous error messages when user starts typing
    if (errorMsg) {
      setErrorMsg(null);
    }
  }

  // PUBLIC_INTERFACE
  async function handleNoteSubmit() {
    if (!user) return setErrorMsg("Please log in to generate notes.");
    
    // More flexible YouTube URL validation
    const youtubeRegex = /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
    if (!youtubeRegex.test(youtubeUrl.trim())) {
      return setErrorMsg("Please enter a valid YouTube URL (youtube.com or youtu.be)");
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Generate a title from the URL or use a default
      const defaultTitle = `Notes for ${youtubeUrl.split('v=')[1]?.substring(0, 11) || 'YouTube Video'}`;
      
      console.log('Attempting to generate notes for:', youtubeUrl);
      console.log('API endpoint:', `${API_ROOT}/youtube/ingest`);
      
      // Real API call to backend
      const response = await fetch(`${API_ROOT}/youtube/ingest?youtube_url=${encodeURIComponent(youtubeUrl)}&title=${encodeURIComponent(defaultTitle)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || 'demo-token'}`
        }
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        
        // If backend is not available, fall back to demo functionality
        if (response.status === 404 || response.status >= 500) {
          console.log('Backend not available, using demo mode');
          const demoNote = {
            id: Date.now(),
            title: defaultTitle,
            youtube_url: youtubeUrl,
            body: `<p><strong>Demo Note Generated!</strong></p><p>This is a demo note for: <a href="${youtubeUrl}" target="_blank">${youtubeUrl}</a></p><p>In production, this would contain AI-generated notes from the YouTube video.</p>`,
            timestamps: [],
            exportable: true,
            shared: false,
          };
          
          setNotes([demoNote, ...notes]);
          setCurrentNote(demoNote);
          setYoutubeUrl("");
          setShowNewNoteDialog(false);
          setErrorMsg(null);
          return;
        }
        
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const newNote = await response.json();
      console.log('Successfully generated note:', newNote);
      
      // Transform backend response to match frontend format
      const formattedNote = {
        id: newNote.id,
        title: newNote.title,
        youtube_url: newNote.youtube_url,
        body: newNote.content || "<p>AI-generated notes will appear here...</p>",
        timestamps: newNote.timestamps || [],
        exportable: true,
        shared: newNote.is_public || false,
      };

      setNotes([formattedNote, ...notes]);
      setCurrentNote(formattedNote);
      setYoutubeUrl("");
      setShowNewNoteDialog(false);
      
    } catch (error) {
      console.error('Note generation failed:', error);
      setErrorMsg(error.message || "Failed to generate notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleNoteSelect(note) {
    setCurrentNote(note);
    setEditingBody(null);
  }

  // PUBLIC_INTERFACE
  function handleEditClick() {
    setEditingBody(currentNote.body || "");
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setEditingBody(null);
  }

  // PUBLIC_INTERFACE
  function handleSaveEdit() {
    // Replace with PATCH /notes/:id
    setNotes((prev) =>
      prev.map((n) =>
        n.id === currentNote.id ? { ...n, body: editingBody } : n
      )
    );
    setCurrentNote({ ...currentNote, body: editingBody });
    setEditingBody(null);
  }

  // PUBLIC_INTERFACE
  function handleExport() {
    setShowExportDialog(true);
  }

  // PUBLIC_INTERFACE
  function handleShare() {
    setShowShareDialog(true);
    // Shareable URL - this will be generated from backend with /notes/:id/share (returns url)
    setSharingUrl(
      window.location.origin +
        "/share/" +
        (currentNote?.id || "noteid123")
    );
  }

  // PUBLIC_INTERFACE
  function handleCopySharingUrl() {
    navigator.clipboard.writeText(sharingUrl);
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    localStorage.removeItem('auth_token');
    setUser(null);
    setNotes([]);
    setCurrentNote(null);
    setErrorMsg(null);
  }

  // PUBLIC_INTERFACE
  function handleTabSwitch(tab) {
    setActiveTab(tab);
    // Optionally fetch shared notes if needed; for now, keep demo notes static
  }

  // --- UI COMPONENTS ---

  // PUBLIC_INTERFACE
  function BrandHeader() {
    return (
      <div className="brand-header">
        <span className="brand-logo" aria-label="Logo"></span>
        <span className="brand-title">NoteGPT</span>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function YoutubeInputPanel() {
    return (
      <div className="youtube-input-panel">
        {errorMsg && (
          <div className="error-message" style={{
            color: '#ff4444',
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            padding: '8px 12px',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '0.9rem',
            border: '1px solid rgba(255, 68, 68, 0.3)'
          }}>
            {errorMsg}
          </div>
        )}
        <input
          value={youtubeUrl}
          onChange={handleYoutubeUrlInput}
          placeholder="Paste a YouTube course link…"
          className="youtube-input"
          type="url"
          autoFocus
          disabled={isLoading}
        />
        <button className="generate-btn" onClick={handleNoteSubmit} disabled={isLoading || !youtubeUrl}>
          {isLoading ? "Generating…" : "Generate Notes"}
        </button>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function Sidebar() {
    return (
      <aside className={`sidebar${sidebarVisible ? " visible" : ""}`}>
        <BrandHeader />
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab${activeTab === "my-notes" ? " selected" : ""}`}
            onClick={()=>handleTabSwitch("my-notes")}
          >
            My Notes
          </button>
          <button
            className={`sidebar-tab${activeTab === "shared" ? " selected" : ""}`}
            onClick={()=>handleTabSwitch("shared")}
          >
            Shared
          </button>
        </div>
        <button className="new-note-btn" onClick={() => setShowNewNoteDialog(true)}>
          + Add from YouTube
        </button>
        <nav className="note-list" aria-label="My Notes">
          {notes.length === 0 ? (
            <div className="note-placeholder">No notes yet.</div>
          ) : (
            notes.map((note) => (
              <div
                className={`note-list-item${currentNote && note.id === currentNote.id ? " active" : ""}`}
                key={note.id}
                onClick={() => handleNoteSelect(note)}
              >
                <div className="note-title">{note.title}</div>
                <div className="note-url">{note.youtube_url.replace(/^https:\/\/(www\.)?youtube.com\//, "")}</div>
              </div>
            ))
          )}
        </nav>
        <div className="sidebar-footer">
          {user ? (
            <div className="user-box">
              {user.avatar ? <img alt="avatar" src={user.avatar} className="avatar"/> :
                <span className="avatar-circle">{user.name[0]}</span>}
              <span className="user-email">{user.email}</span>
              <button className="logout-btn" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <button className="login-btn" onClick={()=>{
              const demoToken = 'demo-token-' + Date.now();
              localStorage.setItem('auth_token', demoToken);
              setUser({id:1,email:"demo@notegpt.com", name:"Demo User", token: demoToken});
            }}>
              Log in (Demo)
            </button>
          )}
        </div>
      </aside>
    );
  }

  // PUBLIC_INTERFACE
  function MainPanel() {
    if (!user) {
      return (
        <main className="main-panel unauth-state" style={{justifyContent:'center', alignItems:'center'}}>
          <BrandHeader />
          <h1 className="headline">YouTube Course Notes, Automated</h1>
          <p className="description">
            Paste a YouTube course/video URL and instantly generate editable notes with timestamps and sharing.<br /><br />
            <span style={{ color: "var(--coffee-brown)", fontWeight:600}}>Demo mode: No login required — click "Generate Notes"!</span>
          </p>
          <YoutubeInputPanel />
        </main>
      );
    }
    if (!currentNote) {
      return (
        <main className="main-panel centered-message">
          <h2>Get started!</h2>
          <YoutubeInputPanel />
        </main>
      );
    }
    return (
      <main className="main-panel">
        <div className="note-toolbar">
          <button className="toolbar-btn" onClick={handleEditClick}>Edit</button>
          <button className="toolbar-btn" onClick={handleExport}>Export</button>
          <button className="toolbar-btn" onClick={handleShare}>Share</button>
        </div>
        <div className="note-content">
          <h2 className="note-main-title">{currentNote.title}</h2>
          <a className="note-youtube-link" href={currentNote.youtube_url} target="_blank" rel="noopener noreferrer">
            Open YouTube Video ↗
          </a>
          {editingBody !== null ? (
            <RichTextEditor
              value={editingBody}
              onChange={setEditingBody}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div
              className="note-body"
              // Dangerously set: controlled by owned data only.
              dangerouslySetInnerHTML={{ __html: currentNote.body }}
            ></div>
          )}
          {currentNote.timestamps && currentNote.timestamps.length > 0 && (
            <section className="timestamps-section">
              <div className="timestamps-label">Jump to section:</div>
              <ul className="timestamps-list">
                {currentNote.timestamps.map((ts, idx) => (
                  <li key={idx}>
                    <a
                      href={currentNote.youtube_url + "&t=" + ts.ts + "s"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ts.label}: {ts.content}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    );
  }

  // PUBLIC_INTERFACE
  function RichTextEditor({ value, onChange, onSave, onCancel }) {
    // Simple contenteditable instead of a heavy package
    const [html, setHtml] = useState(value);
    return (
      <div className="richtext-editor">
        <div
          contentEditable
          className="editor-content"
          suppressContentEditableWarning
          spellCheck="true"
          aria-label="Edit note"
          onInput={e => setHtml(e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="editor-controls">
          <button className="toolbar-btn" onClick={() => {onChange(html); onSave();}}>Save</button>
          <button className="toolbar-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function Modal({ show, onClose, title, children }) {
    if (!show) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-content">{children}</div>
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function NewNoteDialog() {
    return (
      <Modal show={showNewNoteDialog} onClose={()=>setShowNewNoteDialog(false)} title="New Notes from YouTube">
        <div style={{padding:"10px"}}>
          <YoutubeInputPanel />
        </div>
      </Modal>
    );
  }

  // PUBLIC_INTERFACE
  function ExportDialog() {
    if (!currentNote) return null;
    return (
      <Modal show={showExportDialog} onClose={()=>setShowExportDialog(false)} title="Export Note">
        <div className="export-options">
          <button className="export-btn" onClick={() => handleExportFormat("txt")}>Export as Text</button>
          <button className="export-btn" onClick={() => handleExportFormat("pdf")}>Export as PDF</button>
        </div>
      </Modal>
    );
  }

  // PUBLIC_INTERFACE
  function handleExportFormat(fmt) {
    setShowExportDialog(false);
    // Simulate export, for PDF in real app call backend endpoint to generate/download file
    if (fmt === "txt") {
      downloadTextFile(currentNote.title + ".txt", stripHTML(currentNote.body));
    } else if (fmt === "pdf") {
      // Placeholder: In real app, request PDF from backend.
      alert("PDF export only supported in production backend.");
    }
  }

  // PUBLIC_INTERFACE
  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // PUBLIC_INTERFACE
  function stripHTML(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  // PUBLIC_INTERFACE
  function ShareDialog() {
    return (
      <Modal show={showShareDialog} onClose={()=>setShowShareDialog(false)} title="Share Note">
        <div className="share-url-box">
          <input type="text" value={sharingUrl} readOnly spellCheck="false" />
          <button className="copy-share-btn" onClick={handleCopySharingUrl}>
            Copy
          </button>
        </div>
        <div className="share-desc">
          Send this link to share a view-only version. Set access privacy in your dashboard.<br/>
        </div>
      </Modal>
    );
  }

  // MAIN RENDER
  return (
    <div className="app-root">
      <Sidebar />
      <MainPanel />
      <NewNoteDialog />
      <ExportDialog />
      <ShareDialog />
    </div>
  );
}

export default App;
