import React, { useState, useEffect } from 'react';
import { getDoctorById, getCurrentSession, addAppointment, subscribeToState } from '../utils/state';

export default function DoctorDetails({ doctorId }) {
  const [doctor, setDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingMode, setBookingMode] = useState('offline');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const session = getCurrentSession();
  const [patientName, setPatientName] = useState(session && session.role === 'patient' ? session.name : '');
  const [patientPhone, setPatientPhone] = useState(session && session.role === 'patient' ? session.phone : '');

  const loadDoctor = () => {
    const doc = getDoctorById(doctorId);
    setDoctor(doc);
  };

  useEffect(() => {
    loadDoctor();
    return subscribeToState(loadDoctor);
  }, [doctorId]);

  if (!doctor) {
    return (
      <div className="details-error-page">
        <div className="details-error-container">
          <h2>Doctor Not Found</h2>
          <p>We couldn't find a practitioner with ID #{doctorId} in our directory.</p>
          <a href="#/doctors" className="btn-back-home">Back to Directory</a>
        </div>
      </div>
    );
  }

  const handleBooking = (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime || !patientName || !patientPhone) {
      alert("Please fill in all booking fields.");
      return;
    }

    const patientId = session && session.role === 'patient' ? session.id : `guest_${Date.now()}`;
    
    addAppointment({
      patientId,
      patientName,
      patientPhone,
      doctorId: doctor.s_no,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      clinicName: doctor.clinic,
      address: `${doctor.address}, ${doctor.city}`,
      date: bookingDate,
      time: bookingTime,
      mode: bookingMode,
      notes: session ? 'Booked via patient portal session.' : 'Guest user booking.'
    });

    setBookingSuccess(true);
    setTimeout(() => {
      // Clear fields
      setBookingDate('');
      setBookingTime('');
      setBookingMode('offline');
      if (!session) {
        setPatientName('');
        setPatientPhone('');
      }
      
      // If logged in, redirect to dashboard to see the booking
      if (session && session.role === 'patient') {
        window.location.hash = '#/dashboard';
      }
    }, 2000);
  };

  const initials = doctor.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="doctor-details-page">
      <div className="details-nav-header">
        <a href="#/doctors" className="btn-back-nav">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Listings
        </a>
      </div>

      <div className="details-layout-grid">
        {/* Left Side: Doctor Card and Booking Details */}
        <div className="details-left-col">
          <div className="details-hero-card">
            <div className="details-avatar-large">
              <span>{initials}</span>
              <span className="details-status-online"></span>
            </div>
            
            <div className="details-main-info">
              <span className="details-badge-spec">{doctor.specialization || 'Medical Specialist'}</span>
              <h1>{doctor.name}</h1>
              <p className="details-subtitle">{doctor.education || 'Accredited Practitioner'}</p>
              
              <div className="details-verified-row">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--g-emerald)">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Credentials verified via {doctor.source}</span>
              </div>
            </div>
          </div>

          <div className="details-info-section">
            <h3>Practice Location & Details</h3>
            
            <div className="details-fields-list">
              <div className="details-field-row">
                <div className="field-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 18H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V8h10v4zm-3-6h-4v2h4V6z"/>
                  </svg>
                </div>
                <div className="field-text">
                  <span className="field-label">Clinic / Hospital</span>
                  <span className="field-value">{doctor.clinic}</span>
                </div>
              </div>

              <div className="details-field-row">
                <div className="field-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div className="field-text">
                  <span className="field-label">Full Address</span>
                  <span className="field-value">{doctor.address}</span>
                </div>
              </div>

              <div className="details-field-row">
                <div className="field-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </div>
                <div className="field-text">
                  <span className="field-label">City</span>
                  <span className="field-value">{doctor.city}</span>
                </div>
              </div>

              <div className="details-field-row">
                <div className="field-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.57c-2.83-1.44-5.15-3.76-6.59-6.59l1.57-1.57c.27-.27.35-.65.24-1-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19c-.54 0-1 .45-1 .99C3.19 14.7 10.3 21.8 19.01 21.8c.54 0 .99-.45.99-.99v-4.44c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                </div>
                <div className="field-text">
                  <span className="field-label">Phone Contact</span>
                  <span className="field-value phone-value">
                    {doctor.phone && doctor.phone !== 'N/A' && doctor.phone !== '' ? (
                      <a href={`tel:${doctor.phone}`} className="details-phone-link">
                        {doctor.phone}
                      </a>
                    ) : (
                      'N/A (Online Direct Booking)'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="details-info-section" style={{ marginTop: '24px' }}>
            <h3>Biography & Details</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{doctor.bio}</p>
            
            <div className="details-fields-list" style={{ marginTop: '16px' }}>
              <div className="details-field-row">
                <div className="field-text">
                  <span className="field-label">Experience</span>
                  <span className="field-value">{doctor.experience_years} Years</span>
                </div>
              </div>
              <div className="details-field-row">
                <div className="field-text">
                  <span className="field-label">Consultation Fee</span>
                  <span className="field-value">{doctor.fee_range}</span>
                </div>
              </div>
              <div className="details-field-row">
                <div className="field-text">
                  <span className="field-label">Languages Spoken</span>
                  <span className="field-value">{doctor.languages ? doctor.languages.join(', ') : 'English'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Appointment Booking Panel */}
        <div className="details-right-col">
          <div className="booking-panel-card">
            <h3>Book Appointment</h3>
            <p className="booking-perk-note">Show your digital VitaCard at the clinic to claim 15-20% discounts.</p>
            
            {bookingSuccess ? (
              <div className="booking-success-message">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h4>Appointment Scheduled!</h4>
                <p style={{ marginTop: '8px', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  {session && session.role === 'patient' 
                    ? "Your scheduling was successfully registered in your dashboard. Redirecting..."
                    : "Your guest appointment is confirmed. Please keep note of details."
                  }
                </p>
              </div>
            ) : (
              <form className="booking-form" onSubmit={handleBooking}>
                <div className="form-group">
                  <label htmlFor="patientName">Patient Full Name</label>
                  <input 
                    type="text" 
                    id="patientName"
                    placeholder="Enter your full name" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="patientPhone">Mobile Number</label>
                  <input 
                    type="tel" 
                    id="patientPhone"
                    placeholder="Enter mobile number" 
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bookingMode">Consultation Mode</label>
                  <select 
                    id="bookingMode"
                    className="form-input"
                    value={bookingMode}
                    onChange={(e) => setBookingMode(e.target.value)}
                    required
                  >
                    <option value="offline">In-Person Clinic Visit (Offline)</option>
                    <option value="online">Video Consultation (Online)</option>
                  </select>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="bookingDate">Preferred Date</label>
                    <input 
                      type="date" 
                      id="bookingDate"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bookingTime">Time Slot</label>
                    <select 
                      id="bookingTime"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      required
                    >
                      <option value="">Select slot</option>
                      {doctor.slots ? doctor.slots.map(s => (
                        <option key={s} value={s}>{s}</option>
                      )) : (
                        <>
                          <option value="09:00 AM">09:00 AM</option>
                          <option value="10:30 AM">10:30 AM</option>
                          <option value="11:45 AM">11:45 AM</option>
                          <option value="02:00 PM">02:00 PM</option>
                          <option value="03:30 PM">03:30 PM</option>
                          <option value="05:00 PM">05:00 PM</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-submit-booking">
                  Confirm Direct Appointment
                </button>
              </form>
            )}
          </div>

          <div className="details-card-perks-large">
            <h4>VitaCard Clinic Benefits</h4>
            <div className="perk-bullets">
              <div className="perk-bullet-item">
                <span className="perk-check">&check;</span>
                <p><strong>Up to 20% Direct discount</strong> on consultant fee and diagnostic services.</p>
              </div>
              <div className="perk-bullet-item">
                <span className="perk-check">&check;</span>
                <p><strong>Priority scheduling</strong> with accredited medical specialists.</p>
              </div>
              <div className="perk-bullet-item">
                <span className="perk-check">&check;</span>
                <p><strong>Instant registration</strong> — simply show your mobile card during your visit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
