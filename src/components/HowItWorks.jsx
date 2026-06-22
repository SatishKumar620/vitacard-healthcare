import React from 'react';

export default function HowItWorks() {
  return (
    <section className="how-section">
      <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--g-emerald)', marginBottom: '8px' }}>
        How it works
      </p>
      <h2 className="reveal">Four steps to saving</h2>
      <p className="sec-sub reveal">No forms. No waiting lists. No small print surprises.</p>
      <div className="how-steps">
        <div className="how-step reveal">
          <div className="how-num">1</div>
          <div className="how-text">
            <h3>Sign up in 2 minutes</h3>
            <p>Your name, your email, and you're in. No health questionnaire, no approval process.</p>
          </div>
        </div>
        <div className="how-step reveal">
          <div className="how-num">2</div>
          <div className="how-text">
            <h3>Get your digital card</h3>
            <p>Your VitaCard lands in your inbox instantly, and lives in the app on your phone.</p>
          </div>
        </div>
        <div className="how-step reveal">
          <div className="how-num">3</div>
          <div className="how-text">
            <h3>Find a provider near you</h3>
            <p>Search 500+ clinics, GPs, dentists, and therapists in our growing UK network.</p>
          </div>
        </div>
        <div className="how-step reveal">
          <div className="how-num">4</div>
          <div className="how-text">
            <h3>Show your card, save</h3>
            <p>Flash the card or tap to pay. Your discount applies every single time — no codes needed.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
