import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import SharedNotes from './pages/SharedNotes';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/note/:id" element={<NoteEditor />} />
            <Route path="/shared" element={<SharedNotes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
