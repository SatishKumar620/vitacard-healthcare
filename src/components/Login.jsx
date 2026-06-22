import React, { useState } from 'react';
import { loginUser } from '../utils/state';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await loginUser(email, password, role);
    if (res.success) {
      window.location.hash = '#/dashboard';
    } else {
      setError(res.error);
    }
  };

  const handleQuickLogin = async (demoRole) => {
    if (demoRole === 'patient') {
      const res = await loginUser('patient@vitacard.com', 'password', 'patient');
      if (res.success) window.location.hash = '#/dashboard';
    } else {
      const res = await loginUser('doctor@vitacard.com', 'password', 'doctor');
      if (res.success) window.location.hash = '#/dashboard';
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left: Hero Visual Showcase */}
      <div className="auth-hero-pane">
        <div className="auth-hero-grid"></div>
        <div className="auth-hero-glow"></div>
        
        <a className="auth-hero-header" href="#">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="#FF6B00" fillOpacity="0.15" />
            <path d="M18 26s-9-5.5-9-11.5A5.5 5.5 0 0 1 18 10.5 5.5 5.5 0 0 1 27 14.5c0 6-9 11.5-9 11.5z" fill="#FF6B00" />
            <path d="M10 18h3l2-4 3 8 2-5 2 3h4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Vita<span>Card</span>
        </a>

        <div className="auth-hero-content">
          <span className="auth-hero-tagline">Integrated Clinic Network</span>
          <h1 className="auth-hero-h1">
            Private specialist care, <span>streamlined.</span>
          </h1>
          <p className="auth-hero-desc">
            Connect directly with verified private practitioners and manage scheduled health consults securely.
          </p>

          <div className="auth-hero-benefits">
            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="benefit-text">
                <h4>Direct Billing Discounts</h4>
                <p>Verify your digital health code to clear 15-20% invoice discounts.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="benefit-text">
                <h4>Interactive Medical Calendars</h4>
                <p>Reschedule, cancel, or edit booking files seamlessly in real-time.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="benefit-text">
                <h4>Clinical History Sharing</h4>
                <p>Share medical records and past diagnostic summaries securely with doctors.</p>
              </div>
            </div>
          </div>

          <div className="auth-floating-graphic">
            <div className="mock-card card-primary">
              <h5>Active Schedule</h5>
              <p>Patient Satish Kumar has a general consultation on June 22nd at 10:30 AM.</p>
            </div>
            <div className="mock-card card-secondary">
              <h5>Direct Clearances</h5>
              <p>VitaCard verification cleared 18% fee discount.</p>
            </div>
          </div>
        </div>
        
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', zIndex: 5 }}>
          © 2026 VitaCard. Verified medical scheduler.
        </div>
      </div>

      {/* Right: Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your practitioner or patient account.</p>

          <div className="role-selector">
            <button 
              type="button" 
              className={`role-btn ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
            >
              Patient Portal
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => setRole('doctor')}
            >
              Practitioner Portal
            </button>
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: '0.84rem', marginBottom: '16px', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-contact" style={{ marginTop: '10px' }}>
              Access Dashboard
            </button>
          </form>

          <div className="quick-logins">
            <span className="quick-login-label">Quick Demo Access</span>
            <div className="quick-btn-row">
              <button 
                type="button" 
                className="quick-login-btn"
                onClick={() => handleQuickLogin('patient')}
              >
                Demo Patient
              </button>
              <button 
                type="button" 
                className="quick-login-btn"
                onClick={() => handleQuickLogin('doctor')}
              >
                Demo Doctor
              </button>
            </div>
          </div>

          <p className="auth-footer-text">
            Don't have an account? 
            <a href="#/signup" className="auth-link">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
