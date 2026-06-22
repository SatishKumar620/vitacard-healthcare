import React from 'react';

export default function CtaBanner() {
  return (
    <section className="cta-banner">
      <h2 className="reveal">Ready to take care of yourself?</h2>
      <p className="reveal">Join 50,000+ members. Cancel any time. Start for £9.99/month.</p>
      <button className="btn-cta-white reveal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 2a8 8 0 1 0 0 16A8 8 0 0 0 12 4zm1 4v3h3v2h-3v3h-2v-3H8v-2h3V8h2z" />
        </svg>
        Get your VitaCard
      </button>
    </section>
  );
}
