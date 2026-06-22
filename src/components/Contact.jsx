import React, { useState, useRef } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    topic: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const emailInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // Map IDs to formData keys
    const fieldMap = {
      'cf-fname': 'fname',
      'cf-lname': 'lname',
      'cf-email': 'email',
      'cf-topic': 'topic',
      'cf-msg': 'message'
    };
    setFormData((prev) => ({
      ...prev,
      [fieldMap[id]]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fname.trim() || !formData.email.trim() || !formData.message.trim()) {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
      return;
    }
    setSubmitted(true);
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-inner">
        <p className="sec-eyebrow">Get in touch</p>
        <h2 className="reveal">We're here to help</h2>
        <p className="sec-sub reveal">
          Questions about your membership, finding a provider, or just want to know more? Drop us a message — we typically respond within 2 hours.
        </p>

        <div className="contact-grid reveal">
          {/* info panel */}
          <div className="contact-info">
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" fill="var(--g-emerald)">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <div>
                <div className="contact-info-label">Email</div>
                <div className="contact-info-val">satishverma62044@gmail.com</div>
                <div className="contact-info-note">Replies within 2 hours on weekdays</div>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" fill="var(--g-emerald)">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <div>
                <div className="contact-info-label">Phone</div>
                <div className="contact-info-val">+91 6204477023</div>
                <div className="contact-info-note">Mon–Fri, 9am–6pm IST</div>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" fill="var(--g-emerald)">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                </svg>
              </div>
              <div>
                <div className="contact-info-label">Location</div>
                <div className="contact-info-val">Jamshedpur, Jharkhand, India</div>
                <div className="contact-info-note">By appointment only</div>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" fill="var(--g-emerald)">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                  <path d="M11 8h2v8h-2z" fill="transparent" />
                  <path d="M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm0 20c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V8z" />
                </svg>
              </div>
              <div>
                <div className="contact-info-label">Support Hours</div>
                <div className="contact-info-val">24/7 Chat Support</div>
                <div className="contact-info-note">Use the chat bubble below anytime</div>
              </div>
            </div>
          </div>

          {/* form */}
          <div>
            {!submitted ? (
              <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="cf-fname">First name</label>
                    <input 
                      type="text" 
                      placeholder="Jane" 
                      id="cf-fname" 
                      value={formData.fname} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="cf-lname">Last name</label>
                    <input 
                      type="text" 
                      placeholder="Smith" 
                      id="cf-lname" 
                      value={formData.lname} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="cf-email">Email</label>
                  <input 
                    type="email" 
                    placeholder="jane@example.com" 
                    id="cf-email" 
                    ref={emailInputRef} 
                    value={formData.email} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="cf-topic">Topic</label>
                  <select 
                    id="cf-topic" 
                    value={formData.topic} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select a topic…</option>
                    <option value="Membership enquiry">Membership enquiry</option>
                    <option value="Find a provider">Find a provider</option>
                    <option value="Billing & payments">Billing & payments</option>
                    <option value="Technical support">Technical support</option>
                    <option value="Partnership / business">Partnership / business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="cf-msg">Message</label>
                  <textarea 
                    placeholder="Tell us how we can help…" 
                    id="cf-msg" 
                    value={formData.message} 
                    onChange={handleInputChange} 
                  />
                </div>
                <button type="submit" className="btn-contact" id="cf-submit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  Send message
                </button>
              </form>
            ) : (
              <div className="contact-success" id="contactSuccess" style={{ display: 'block' }}>
                ✅ &nbsp;Message sent! We'll get back to you within 2 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
