import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// PUBLIC_INTERFACE
function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        YouTube Course Notes
      </Link>
      <nav className="header-nav">
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          Dashboard
        </Link>
        <Link 
          to="/shared" 
          className={location.pathname === '/shared' ? 'active' : ''}
        >
          Shared Notes
        </Link>
        <button className="btn btn-primary">
          New Note
        </button>
      </nav>
    </header>
  );
}

export default Header;
