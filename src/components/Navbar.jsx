import React, { useState, useEffect } from 'react';
import { getCurrentSession, getNotifications, logoutUser, subscribeToState } from '../utils/state';

export default function Navbar() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vitacard-theme') || 'dark';
  });
  
  const [session, setSession] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const syncState = () => {
    const activeSession = getCurrentSession();
    setSession(activeSession);
    if (activeSession) {
      const notifs = getNotifications(activeSession.id);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } else {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vitacard-theme', theme);
  }, [theme]);

  useEffect(() => {
    syncState();
    return subscribeToState(syncState);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogoutClick = () => {
    logoutUser();
    window.location.hash = '#/';
  };

  const userInitials = session ? session.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <nav>
      <a className="nav-logo" href="#">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="10" fill="#FF6B00" fillOpacity="0.15" />
          <path d="M18 26s-9-5.5-9-11.5A5.5 5.5 0 0 1 18 10.5 5.5 5.5 0 0 1 27 14.5c0 6-9 11.5-9 11.5z" fill="#FF6B00" />
          <path d="M10 18h3l2-4 3 8 2-5 2 3h4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Vita<span style={{ color: '#FF6B00' }}>Card</span>
      </a>
      <ul className="nav-links">
        <li><a href="#">Services</a></li>
        <li><a href="#/doctors">Providers</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <div className="nav-right">
        {/* Day / Night Toggle */}
        <button 
          className="theme-toggle" 
          id="themeToggle" 
          onClick={toggleTheme}
          aria-label="Toggle day/night mode" 
          title="Toggle day/night"
        >
          <div className="toggle-knob">
            <span className="toggle-icon" id="toggleIcon">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </div>
        </button>

        {session ? (
          <>
            {/* Notification Bell */}
            <a href="#/dashboard" className="nav-bell-btn" title="View Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              {unreadCount > 0 && <span className="nav-bell-badge">{unreadCount}</span>}
            </a>

            {/* Profile Avatar & Name */}
            <a href="#/dashboard" className="navbar-user-avatar">
              <div className="nav-user-circle" title={`${session.name} Dashboard`}>
                {userInitials}
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700 }} className="nav-username">
                {session.role === 'doctor' ? 'Practitioner' : 'Patient'}
              </span>
            </a>

            <button 
              className="nav-pill" 
              onClick={handleLogoutClick}
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <a href="#/login" className="nav-signin-btn">
              Sign In
            </a>
            <button className="nav-pill" onClick={() => window.location.hash = '#/signup'}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
