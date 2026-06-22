import React from 'react';

export default function PremiumCare() {
  const photoSrc = `${import.meta.env.BASE_URL}doctor_consultation.png`;

  return (
    <section className="premium-care-section" id="why-vitacard">
      <div className="premium-care-container reveal">
        {/* PHOTO COLUMN */}
        <div className="premium-care-image-col">
          <div className="premium-care-image-wrapper">
            <img 
              src={photoSrc} 
              alt="Professional doctor consulting with patient" 
              className="premium-care-img"
            />
            <div className="premium-care-image-accent"></div>
          </div>
        </div>

        {/* CONTENT COLUMN */}
        <div className="premium-care-content-col">
          <span className="premium-care-eyebrow">WHY VITACARD</span>
          <h2>Private healthcare, without the private insurance cost</h2>
          <p className="premium-care-lead">
            Traditional health insurance is complex, expensive, and filled with exclusion clauses. VitaCard replaces it with direct, hassle-free savings on the care you actually use.
          </p>

          <div className="premium-care-features">
            {/* Feature 1 */}
            <div className="premium-care-feat">
              <div className="premium-care-feat-bullet">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div className="premium-care-feat-text">
                <h3>Skip the NHS Wait Times</h3>
                <p>Book private GP appointments and see a general practitioner on the very same day. No waiting weeks for a phone consultation slot.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="premium-care-feat">
              <div className="premium-care-feat-bullet">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div className="premium-care-feat-text">
                <h3>Pre-existing Conditions Covered</h3>
                <p>Traditional private health insurance policies exclude ongoing illnesses. With VitaCard, everyone is approved instantly with zero health check questionnaires.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="premium-care-feat">
              <div className="premium-care-feat-bullet">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div className="premium-care-feat-text">
                <h3>500+ Accredited Clinics</h3>
                <p>Enjoy discounted treatments at fully licensed private clinics, dental practices, optical shops, and pharmacies located all across the UK.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
