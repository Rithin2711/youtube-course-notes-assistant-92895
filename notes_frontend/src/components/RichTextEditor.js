import React, { useState, useRef } from 'react';

// PUBLIC_INTERFACE
function RichTextEditor({ initialContent = '', onSave, saving = false }) {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef(null);

  // PUBLIC_INTERFACE
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  // PUBLIC_INTERFACE
  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
  };

  // PUBLIC_INTERFACE
  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('italic')}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('underline')}
          title="Underline"
        >
          <u>U</u>
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-primary)', margin: '0 var(--spacing-sm)' }}></div>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('formatBlock', 'h2')}
          title="Heading 2"
        >
          H2
        </button>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('formatBlock', 'h3')}
          title="Heading 3"
        >
          H3
        </button>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('formatBlock', 'p')}
          title="Paragraph"
        >
          P
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-primary)', margin: '0 var(--spacing-sm)' }}></div>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('insertUnorderedList')}
          title="Bullet List"
        >
          •
        </button>
        <button 
          className="btn btn-ghost"
          onClick={() => handleFormat('insertOrderedList')}
          title="Numbered List"
        >
          1.
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
      
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        dangerouslySetInnerHTML={{ __html: initialContent }}
        onInput={handleContentChange}
        style={{
          outline: 'none',
          minHeight: '400px',
          padding: 'var(--spacing-lg)',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
}

export default RichTextEditor;
