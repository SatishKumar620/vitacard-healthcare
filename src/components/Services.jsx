import React from 'react';

export default function Services() {
  return (
    <section className="services-section">
      <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--g-emerald)', marginBottom: '8px' }}>
        What's covered
      </p>
      <h2 className="reveal">Every part of your health</h2>
      <p className="sec-sub reveal">One card. Six categories of care. Real savings every time you visit.</p>
      <div className="services-grid">
        <div className="srv reveal">
          <div className="srv-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--g-emerald)">
              <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
              <rect x="11" y="14" width="2" height="6" fill="#fff" />
              <rect x="8" y="17" width="8" height="2" fill="#fff" />
            </svg>
          </div>
          <h3>Private GP</h3>
          <div className="srv-pct">up to 20% off</div>
        </div>

        <div className="srv reveal">
          <div className="srv-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--g-emerald)">
              <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
            </svg>
          </div>
          <h3>Dental</h3>
          <div className="srv-pct">up to 15% off</div>
        </div>

        <div className="srv reveal">
          <div className="srv-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--g-emerald)">
              <circle cx="12" cy="10" r="3.5" />
              <path d="M12 2a8 8 0 0 0-5.4 13.8L12 22l5.4-6.2A8 8 0 0 0 12 2zm0 11.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
            </svg>
          </div>
          <h3>Optical</h3>
          <div className="srv-pct">up to 18% off</div>
        </div>

        <div className="srv reveal">
          <div className="srv-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--g-emerald)">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-1-11h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <h3>Mental Health</h3>
          <div className="srv-pct">up to 20% off</div>
        </div>

        <div className="srv reveal">
          <div className="srv-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--g-emerald)">
              <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43-1.43-1.43L22 16.29z" />
            </svg>
          </div>
          <h3>Physio</h3>
          <div className="srv-pct">up to 15% off</div>
        </div>

        <div className="srv reveal">
          <div className="srv-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--g-emerald)">
              <path d="M6 3h12l2 6-8 13L4 9zm6 13.2L17.2 9H6.8L12 16.2zM9 9h6l-1.5-3h-3z" />
            </svg>
          </div>
          <h3>Pharmacy</h3>
          <div className="srv-pct">up to 12% off</div>
        </div>
      </div>
    </section>
  );
}
