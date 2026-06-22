import React, { useState } from 'react';
import { signupUser } from '../utils/state';

export default function Signup() {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Patient fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  // Doctor fields
  const [specialization, setSpecialization] = useState('General Physician');
  const [clinic, setClinic] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const signupDetails = {
      role,
      email,
      password,
      name,
      phone,
      ...(role === 'patient' && { age, gender }),
      ...(role === 'doctor' && { specialization, clinic, address, city })
    };

    const res = signupUser(signupDetails);
    if (res.success) {
      window.location.hash = '#/dashboard';
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left: Hero Visual Pane */}
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
            Sign up for <span>smarter care.</span>
          </h1>
          <p className="auth-hero-desc">
            Register to claim instant clearances, share medical profiles securely, or list your private clinical practice.
          </p>

          <div className="auth-hero-benefits">
            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="benefit-text">
                <h4>Verified Specializations</h4>
                <p>Choose from over 300+ accredited local clinics and consultants.</p>
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
                <p>Provide doctor-restricted allergies and past medical logs in one click.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="benefit-text">
                <h4>Dynamic Booking Rescheduling</h4>
                <p>Change your consultation dates and times based on active slot calendars.</p>
              </div>
            </div>
          </div>

          <div className="auth-floating-graphic">
            <div className="mock-card card-primary">
              <h5>Verification Code</h5>
              <p>Credentials verified via lybrate.com database integration.</p>
            </div>
          </div>
        </div>
        
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', zIndex: 5 }}>
          © 2026 VitaCard. Verified medical scheduler.
        </div>
      </div>

      {/* Right: Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-card" style={{ maxWidth: '540px' }}>
          <h2>Get Started</h2>
          <p className="auth-subtitle">Create a private patient or practitioner profile.</p>

          <div className="role-selector">
            <button 
              type="button" 
              className={`role-btn ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
            >
              As Patient
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => setRole('doctor')}
            >
              As Practitioner
            </button>
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: '0.84rem', marginBottom: '16px', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-with-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder={role === 'doctor' ? 'Dr. Sarah Connor' : 'Satish Kumar'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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
            </div>

            <div className="form-grid-row">
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
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Contact Number</label>
                <div className="input-with-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {role === 'patient' ? (
              <div className="form-grid-row">
                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    className="form-input"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="0"
                    max="120"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    className="form-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ height: '45px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="form-grid-row">
                  <div className="form-group">
                    <label htmlFor="specialization">Specialization</label>
                    <select
                      id="specialization"
                      className="form-input"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      style={{ height: '45px' }}
                    >
                      <option value="General Physician">General Physician</option>
                      <option value="Dentist">Dentist</option>
                      <option value="Ophthalmologist">Ophthalmologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Paediatrics">Paediatrics</option>
                      <option value="Obstetrics and Gynecology">Obstetrics and Gynecology</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="clinic">Clinic/Hospital Name</label>
                    <input
                      type="text"
                      id="clinic"
                      className="form-input"
                      placeholder="e.g. Metro Clinic"
                      value={clinic}
                      onChange={(e) => setClinic(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-row">
                  <div className="form-group">
                    <label htmlFor="address">Clinic Address</label>
                    <input
                      type="text"
                      id="address"
                      className="form-input"
                      placeholder="e.g. 15, Park Avenue"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      className="form-input"
                      placeholder="e.g. Jamshedpur"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn-contact" style={{ marginTop: '14px' }}>
              Create Account
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? 
            <a href="#/login" className="auth-link">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
