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

  // -- Fake: check login on mount (replace with real API auth, JWT, etc.) --
  useEffect(() => {
    // mock login - replace with token check from backend
    // PUBLIC_INTERFACE
    async function fetchUser() {
      try {
        // Replace this with real user fetch
        // Example: GET /user/me, returns {id, email, ...}
        setUser({
          id: 1,
          email: "testuser@notegpt.com",
          name: "Demo User",
          avatar: null,
        });
      } catch (err) {
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
      // Replace with REAL API call to /notes?mine=1
      // Public/share endpoint is /notes/shared
      setTimeout(() => {
        setNotes([
          {
            id: 1,
            title: "How React Works (YouTube)",
            youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            body: "<p><strong>React</strong> is a UI library for building apps. <span data-timestamp='124'>Click here</span> to jump to 2:04.</p>",
            timestamps: [{ ts: 124, label: "2:04", content: "Virtual DOM explained." }],
            exportable: true,
            shared: false,
          },
        ]);
        setIsLoading(false);
      }, 600);
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
  }

  // PUBLIC_INTERFACE
  async function handleNoteSubmit() {
    if (!user) return setErrorMsg("Please log in to generate notes.");
    if (!/^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(youtubeUrl.trim()))
      return setErrorMsg("Input a valid YouTube course URL (ex: https://youtube.com/watch?v=...).");

    setErrorMsg(null);
    setIsLoading(true);

    // Simulate API
    setTimeout(() => {
      const note = {
        id: notes.length + 1,
        title: "Generated Note",
        youtube_url: youtubeUrl,
        body: "<p>Your AI notes will appear here...</p>",
        timestamps: [],
        exportable: true,
        shared: false,
      };
      setNotes([note, ...notes]);
      setCurrentNote(note);
      setYoutubeUrl("");
      setShowNewNoteDialog(false);
      setIsLoading(false);
    }, 1200);

    // Real: POST /notes {youtube_url}, and poll for note_ready
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
    setUser(null);
    setNotes([]);
    setCurrentNote(null);
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
            <button className="login-btn" onClick={()=>setUser({id:1,email:"try@demo.com", name:"Demo User"})}>
              Log in
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
