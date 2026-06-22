import React, { useEffect, useRef } from 'react';
import HeroCanvas from './HeroCanvas';

export default function Hero() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Parallax effect on mouse move for the entire container
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      containerRef.current.style.transform = `translate(${-x}px, ${-y}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero">
      {/* 3D INTERACTIVE BACKGROUND */}
      <HeroCanvas />
      
      {/* Fallback gradient overlay to ensure text readability */}
      <div className="hero-canvas-overlay"></div>

      <div className="hero-grid"></div>

      <div className="hero-redesign-container" ref={containerRef}>
        {/* SECTION 1: Intro Text */}
        <div className="hero-intro-text">
          <span className="hero-redesign-badge animate-fade-in-up delay-1">PREMIUM HEALTHCARE</span>
          <h1 className="hero-redesign-h1 animate-fade-in-up delay-2">
            Your health,<br />
            <span className="italic-word">actually</span> affordable
          </h1>
          <p className="hero-redesign-sub animate-fade-in-up delay-3">
            VitaCard gets you up to 20% off private GPs, dental, therapy, and more — starting from just £9.99/month.
          </p>
          {/* CTA Buttons */}
          <div className="hero-cta-row animate-fade-in-up delay-4">
            <a href="#/signup" className="hero-cta-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/>
              </svg>
              Get Started Free
            </a>
            <a href="#/login" className="hero-cta-secondary">
              Sign In
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </a>
          </div>

          {/* Social proof */}
          <div className="hero-social-proof animate-fade-in-up delay-5">
            <div className="hero-avatar-stack">
              <div className="hero-avatar" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF9A4D)' }}>SK</div>
              <div className="hero-avatar" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>PR</div>
              <div className="hero-avatar" style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}>AM</div>
            </div>
            <span className="hero-social-proof-text">Trusted by <strong>12,000+</strong> patients across India</span>
          </div>
        </div>

        {/* SECTION 2: Detail Cards */}
        <div className="hero-detail-cards">
          {/* Card 1 */}
          <div className="detail-card glassmorphic animate-fade-in-up delay-4">
            <div className="detail-card-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#FF6B00">
                <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                <rect x="11" y="14" width="2" height="6" fill="#fff" />
                <rect x="8" y="17" width="8" height="2" fill="#fff" />
              </svg>
            </div>
            <div className="detail-card-content">
              <h3>500+ Partner Clinics</h3>
              <p>Instantly gain access to top private GPs, dental care, and optical checkups across our UK network.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="detail-card glassmorphic animate-fade-in-up delay-5">
            <div className="detail-card-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#FF6B00">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16C9.39 5.5 8 6.7 8 8.75c0 2.45 2.02 3.67 4.97 4.34 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.91 3.8V21h3v-2.12c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.43z" />
              </svg>
            </div>
            <div className="detail-card-content">
              <h3>Up to 20% Savings</h3>
              <p>Save an average of £340 per year. Enjoy discounted rates on routine checkups and therapy sessions.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="detail-card glassmorphic animate-fade-in-up delay-6">
            <div className="detail-card-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#FF6B00">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <div className="detail-card-content">
              <h3>Instant Digital Card</h3>
              <p>No health questionnaires or approval periods. Receive your digital membership card in 2 minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

