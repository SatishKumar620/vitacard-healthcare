import React from 'react';

const testimonialsRow1 = [
  {
    quote: "I saved over ₹4,000 last year on dental and GP visits alone. It paid for itself in the first month.",
    name: "Sarah K.",
    initials: "SK",
    role: "Member since 2023 · Jamshedpur"
  },
  {
    quote: "The mental health discount genuinely changed things for me. I can now afford fortnightly therapy sessions.",
    name: "Priya R.",
    initials: "PR",
    role: "Member since 2024 · Ranchi"
  },
  {
    quote: "Found a fantastic eye specialist through VitaCard. The whole booking process was seamless and quick.",
    name: "Amit D.",
    initials: "AD",
    role: "Member since 2024 · Jamshedpur"
  },
  {
    quote: "As a parent of two, having instant access to pediatric care at discounted rates is a lifesaver.",
    name: "Neha S.",
    initials: "NS",
    role: "Member since 2023 · Bokaro"
  },
  {
    quote: "The digital card was ready in 2 minutes. No paperwork, no waiting. Just scan and save at the clinic.",
    name: "Vikram T.",
    initials: "VT",
    role: "Member since 2024 · Dhanbad"
  },
];

const testimonialsRow2 = [
  {
    quote: "Finally got proper physio without waiting months. The discount made it affordable to go weekly.",
    name: "James M.",
    initials: "JM",
    role: "Member since 2024 · Kolkata"
  },
  {
    quote: "I was skeptical at first, but VitaCard literally halved my family's annual healthcare spending.",
    name: "Ritu G.",
    initials: "RG",
    role: "Member since 2023 · Jamshedpur"
  },
  {
    quote: "The 24/7 chat support is incredible. Got a consultation at midnight when my kid had a high fever.",
    name: "Deepak P.",
    initials: "DP",
    role: "Member since 2024 · Ranchi"
  },
  {
    quote: "Switched from another health plan to VitaCard and immediately noticed the savings. Highly recommend.",
    name: "Sunita B.",
    initials: "SB",
    role: "Member since 2023 · Jamshedpur"
  },
  {
    quote: "The partner clinic network keeps growing. Last month they added three more near my workplace.",
    name: "Rahul M.",
    initials: "RM",
    role: "Member since 2024 · Adityapur"
  },
];

function TestiCard({ t }) {
  return (
    <div className="testi-card" aria-label={`Testimonial by ${t.name}`}>
      <div className="stars" aria-label="5 star rating">
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--g-emerald)">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p className="testi-quote">"{t.quote}"</p>
      <div className="testi-person">
        <div className="testi-ava">{t.initials}</div>
        <div>
          <div className="testi-who">{t.name}</div>
          <div className="testi-role">{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  // Duplicate items for seamless infinite scroll
  const row1Items = [...testimonialsRow1, ...testimonialsRow1];
  const row2Items = [...testimonialsRow2, ...testimonialsRow2];

  return (
    <section className="testi-section">
      <p className="sec-eyebrow">Testimonials</p>
      <h2 className="reveal">Real people, real savings</h2>
      <p className="sec-sub reveal" style={{ maxWidth: 540, margin: '0 auto 40px' }}>
        Trusted by thousands of members across India for affordable, quality healthcare.
      </p>

      {/* Row 1: scrolls LEFT */}
      <div className="testi-marquee-track">
        <div className="testi-marquee-row testi-scroll-left">
          {row1Items.map((t, i) => (
            <TestiCard key={`r1-${i}`} t={t} />
          ))}
        </div>
      </div>

      {/* Row 2: scrolls RIGHT */}
      <div className="testi-marquee-track" style={{ marginTop: 16 }}>
        <div className="testi-marquee-row testi-scroll-right">
          {row2Items.map((t, i) => (
            <TestiCard key={`r2-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
