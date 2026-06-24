import React, { useState, useEffect } from 'react';
import { 
  getCurrentSession, 
  logoutUser, 
  getAppointments, 
  getNotifications, 
  markNotificationsAsRead, 
  rescheduleAppointment, 
  cancelAppointment, 
  getDoctorById, 
  updateDoctorProfile,
  updatePatientProfile,
  getPatientById,
  subscribeToState
} from '../utils/state';

/* ─── CALENDAR UTILITY FUNCTIONS ─── */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatLocalDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/* ────────────────────────────────────────────────────────────────
   SHARED COMPONENT: DECORATIVE WIREFRAME SVG ACCENTS
   ──────────────────────────────────────────────────────────────── */
function WireframeAccent({ position = 'top-right' }) {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1" 
      className={`wireframe-accent-svg ${position}`}
    >
      {position.includes('top') ? (
        <>
          <line x1="0" y1="0" x2="24" y2="0"></line>
          <line x1="24" y1="0" x2="24" y2="24"></line>
          <circle cx="24" cy="0" r="3" fill="currentColor"></circle>
        </>
      ) : (
        <>
          <line x1="0" y1="24" x2="24" y2="24"></line>
          <line x1="0" y1="0" x2="0" y2="24"></line>
          <circle cx="0" cy="24" r="3" fill="currentColor"></circle>
        </>
      )}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   SHARED COMPONENT: INTERACTIVE SVG ANALYTICS CHART
   ──────────────────────────────────────────────────────────────── */
function SVGAnalyticsChart({ title, dataPoints, color = '#FF6B00' }) {
  const width = 500;
  const height = 180;
  const paddingX = 45;
  const paddingY = 30;
  
  const points = dataPoints.map((dp, i) => {
    const x = paddingX + (i * (width - paddingX * 2)) / (dataPoints.length - 1);
    const y = height - paddingY - (dp.value * (height - paddingY * 2)) / 10;
    return { x, y, label: dp.label, value: dp.value };
  });

  // Calculate smooth cubic bezier path
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
  }

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(-1);
  
  // Calculate average, peak and total values to show metrics in graph card
  const values = dataPoints.map(dp => dp.value);
  const maxVal = Math.max(...values, 0);
  const avgVal = (values.reduce((a, b) => a + b, 0) / (values.length || 1)).toFixed(1);

  return (
    <div className="chart-container-glass card-double-border" style={{ marginBottom: '24px' }}>
      <WireframeAccent position="top-right" />
      <div className="chart-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ margin: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--g-emerald)' }}>
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            {title}
          </h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Real-time health activity wave</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="chart-legend" style={{ gap: '12px' }}>
            <div className="legend-item">
              <span className="legend-color" style={{ background: color, boxShadow: `0 0 6px ${color}` }}></span>
              <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>Trend wave</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', background: 'rgba(255,107,0,0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,107,0,0.15)', fontWeight: 700 }}>
            Avg: {avgVal} • Peak: {maxVal}
          </div>
        </div>
      </div>
      
      <div className="chart-svg-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Horizontal Gridlines */}
          {[0, 2, 4, 6, 8, 10].map(val => {
            const y = height - paddingY - (val * (height - paddingY * 2)) / 10;
            return (
              <g key={val}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} className="chart-grid-line" />
                <text x={paddingX - 12} y={y + 3} style={{ fontSize: '8px', fill: 'var(--text-muted)', textAnchor: 'end', fontWeight: 700 }}>{val}</text>
              </g>
            );
          })}

          {/* Hover Guideline */}
          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={paddingY} 
              x2={hoveredPoint.x} 
              y2={height - paddingY} 
              className="chart-hover-line"
            />
          )}

          {/* Area under the line */}
          <path d={areaPath} className="chart-area-path" />

          {/* Sparkline Curve */}
          <path d={linePath} className="chart-line-path" style={{ stroke: color, filter: 'url(#glow)' }} />

          {/* Interactive Dots */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === idx ? "6" : "4.5"}
              className="chart-dot-point"
              style={{ 
                stroke: color, 
                fill: hoverIndex === idx ? color : 'var(--bg-body)'
              }}
              onMouseEnter={() => { setHoveredPoint(p); setHoverIndex(idx); }}
              onMouseLeave={() => { setHoveredPoint(null); setHoverIndex(-1); }}
            />
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text 
              key={idx} 
              x={p.x} 
              y={height - 12} 
              className="chart-label-text"
              style={{ fontWeight: hoverIndex === idx ? 800 : 500, fill: hoverIndex === idx ? 'var(--text-body)' : 'var(--text-muted)' }}
            >
              {p.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div 
            className="chart-tooltip-bubble" 
            style={{ 
              display: 'block',
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: color }}>{hoveredPoint.label}</div>
            <div style={{ marginTop: '2px', fontWeight: 600 }}>Value Index: <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>{hoveredPoint.value}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SHARED COMPONENT: MONTHLY CALENDAR
   ──────────────────────────────────────────────────────────────── */
function CalendarView({ appointments, selectedDate, onSelectDate }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const calendarCells = [];
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDaysCount - i,
      isCurrentMonth: false,
      dateString: ''
    });
  }

  for (let d = 1; d <= daysCount; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateString: formatLocalDate(currentYear, currentMonth, d)
    });
  }

  const remaining = 42 - calendarCells.length;
  for (let n = 1; n <= remaining; n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      dateString: ''
    });
  }

  return (
    <div className="calendar-view-container">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrevMonth} title="Previous Month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h3>{MONTHS[currentMonth]} {currentYear}</h3>
        <button className="calendar-nav-btn" onClick={handleNextMonth} title="Next Month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}

        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div key={`empty-${idx}`} className="calendar-day-cell other-month">
                {cell.day}
              </div>
            );
          }

          const hasApts = appointments.some(apt => apt.date === cell.dateString && apt.status !== 'cancelled');
          const isSelected = selectedDate === cell.dateString;
          const isToday = cell.dateString === formatLocalDate(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <div 
              key={`day-${cell.day}`} 
              className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onSelectDate(cell.dateString)}
            >
              {cell.day}
              {hasApts && (
                <div className="apt-dots">
                  <span className="apt-dot"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SUB-COMPONENT: PATIENT DASHBOARD (VERTICAL SIDEBAR LAYOUT)
   ──────────────────────────────────────────────────────────────── */
function PatientDashboard({ session, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, appointments, profile, notifications
  const [viewMode, setViewMode] = useState('cards'); // calendar, cards
  const [rescheduleAptId, setRescheduleAptId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  
  // Patient Profile Edit inputs
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [pastReports, setPastReports] = useState([]);
  const [enableChatHistory, setEnableChatHistory] = useState(false);
  
  // New report inputs
  const [repActive, setRepActive] = useState(false);
  const [repHospital, setRepHospital] = useState('');
  const [repDoctor, setRepDoctor] = useState('');
  const [repDate, setRepDate] = useState('');
  const [repTime, setRepTime] = useState('');
  const [repNotes, setRepNotes] = useState('');

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const patientActivityData = [
    { label: 'Wk 1', value: 1 },
    { label: 'Wk 2', value: 4 },
    { label: 'Wk 3', value: 2 },
    { label: 'Wk 4', value: 6 },
    { label: 'Wk 5', value: 3 },
    { label: 'Wk 6', value: 8 },
    { label: 'Wk 7', value: 5 }
  ];

  const loadData = () => {
    const list = getAppointments().filter(a => a.patientId === session.id);
    setAppointments(list);
    setNotifications(getNotifications(session.id));
    
    const pProfile = getPatientById(session.id);
    if (pProfile) {
      setPatientData(pProfile);
      setConditions(pProfile.conditions || '');
      setAllergies(pProfile.allergies || '');
      setMedications(pProfile.medications || '');
      setPastReports(pProfile.pastReports || []);
      setEnableChatHistory(pProfile.enableChatHistory || false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToState(loadData);
  }, [session.id]);

  const handleCancel = (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelAppointment(id);
    }
  };

  const handleRescheduleSubmit = (e, id) => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    const res = rescheduleAppointment(id, newDate, newTime);
    if (res.success) {
      setRescheduleAptId(null);
      setNewDate('');
      setNewTime('');
    } else {
      alert(res.error);
    }
  };

  const handleSendReminder = async (apt) => {
    try {
      const users = JSON.parse(localStorage.getItem('vitacard_users') || '[]');
      const doctorUser = users.find(u => u.role === 'doctor' && u.doctorId === parseInt(apt.doctorId, 10));
      const patientUser = users.find(u => u.id === apt.patientId);
      
      const patientEmail = (patientUser && patientUser.email) || 'patient@vitacard.com';
      const doctorEmail = (doctorUser && doctorUser.email) || `${apt.doctorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@vitacard.com`;

      const response = await fetch('/api/send-appointment-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: apt.id,
          patientName: apt.patientName,
          patientEmail: patientEmail,
          patientPhone: apt.patientPhone,
          doctorName: apt.doctorName,
          doctorEmail: doctorEmail,
          specialization: apt.specialization || '',
          clinicName: apt.clinicName || '',
          address: apt.address || '',
          date: apt.date,
          time: apt.time,
          mode: apt.mode || 'offline',
          jitsiLink: apt.jitsiLink || null,
          notes: apt.notes || ''
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("✉️ Appointment reminder email successfully sent to both Patient and Doctor!");
      } else {
        alert("❌ Failed to send reminder: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("❌ Connection error while sending email reminder.");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!enableChatHistory) {
      localStorage.removeItem(`vitacard_chat_history_${session.id}`);
    }
    const res = await updatePatientProfile(session.id, {
      conditions,
      allergies,
      medications,
      pastReports,
      enableChatHistory
    });
    if (res.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!repHospital || !repDoctor || !repDate || !repTime || !repNotes) {
      alert("Please fill out all report fields.");
      return;
    }

    const newReport = {
      id: `rep_${Date.now()}`,
      hospitalName: repHospital,
      doctorDetails: repDoctor,
      date: repDate,
      time: repTime,
      notes: repNotes
    };

    const updatedReports = [...pastReports, newReport];
    setPastReports(updatedReports);

    await updatePatientProfile(session.id, {
      conditions,
      allergies,
      medications,
      pastReports: updatedReports
    });

    setRepHospital('');
    setRepDoctor('');
    setRepDate('');
    setRepTime('');
    setRepNotes('');
    setRepActive(false);
  };

  const handleRemoveReport = async (repId) => {
    if (window.confirm("Remove this report from history?")) {
      const updatedReports = pastReports.filter(r => r.id !== repId);
      setPastReports(updatedReports);
      await updatePatientProfile(session.id, {
        conditions,
        allergies,
        medications,
        pastReports: updatedReports
      });
    }
  };

  const markRead = () => {
    markNotificationsAsRead(session.id);
  };

  const calendarFilteredAppointments = appointments.filter(a => a.date === selectedDate && a.status !== 'cancelled');
  const userInitials = session.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-layout-wrapper">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar-glass">
        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-meta">
            <h4>{session.name}</h4>
            <span>Patient Profile</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="sidebar-nav-list">
          <button 
            className={`sidebar-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Overview
          </button>

          <button 
            className={`sidebar-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Appointments
          </button>

          <button 
            className={`sidebar-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Medical Profile
          </button>

          <button 
            className={`sidebar-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); markRead(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            Notifications
          </button>

          <button 
            className="sidebar-tab-btn"
            onClick={onLogout}
            style={{ color: '#EF4444', marginTop: '16px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>

        {/* Security online footer */}
        <div className="sidebar-system-footer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div className="system-status-text">
            <span>Systems Secured</span>
            <p>Verification Link Live <span className="pulsing-indicator-dot"></span></p>
          </div>
        </div>
      </div>

      {/* Right Content Pane */}
      <div className="dashboard-main-content-pane">
        <div className="dashboard-header-block">
          <div className="dashboard-welcome">
            <h1>Hello, {session.name}</h1>
            <p>Verify your digital card details to claim discounts at clinical centers.</p>
          </div>
          <span className="dashboard-header-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ID Code: VC-{session.id.toUpperCase().split('_')[2]}
          </span>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Quick Actions Panel */}
            <div className="quick-actions-bar">
              <button className="btn-quick-action" onClick={() => setActiveTab('appointments')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Book Appointment
              </button>
              <button className="btn-quick-action" onClick={() => setActiveTab('profile')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Upload Medical Record
              </button>
              <button className="btn-quick-action" onClick={() => setShowQrModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <rect x="7" y="7" width="3" height="3"></rect>
                  <rect x="14" y="7" width="3" height="3"></rect>
                  <rect x="7" y="14" width="3" height="3"></rect>
                  <rect x="14" y="14" width="3" height="3"></rect>
                </svg>
                Show Card QR Code
              </button>
              <button className="btn-quick-action" onClick={() => alert("Connecting to VitaCard Priority Help desk: 1800-419-VITA")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Priority Helpline
              </button>
            </div>

            {/* Vitals Health Metrics Grid */}
            <div className="vitals-cards-grid">
              {/* Heart Rate Widget */}
              <div className="vital-card-glass card-double-border">
                <div className="vital-card-header">
                  <div className="vital-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="vital-icon-pulse red">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Heart Rate</span>
                  </div>
                  <span className="vital-status-pill normal">Normal</span>
                </div>
                <div className="vital-value-group">
                  <span className="vital-value">72</span>
                  <span className="vital-unit">bpm</span>
                </div>
                <svg className="vital-sparkline-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,10 L20,10 L25,3 L30,17 L35,10 L50,10 L55,5 L60,15 L65,10 L100,10" fill="none" stroke="#EF4444" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Blood Pressure Widget */}
              <div className="vital-card-glass card-double-border">
                <div className="vital-card-header">
                  <div className="vital-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="vital-icon-pulse">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    <span>Blood Pressure</span>
                  </div>
                  <span className="vital-status-pill normal">Optimal</span>
                </div>
                <div className="vital-value-group">
                  <span className="vital-value">120/80</span>
                  <span className="vital-unit">mmHg</span>
                </div>
                <svg className="vital-sparkline-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,15 Q20,5 40,12 T80,8 T100,13" fill="none" stroke="var(--g-emerald)" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Blood Glucose Widget */}
              <div className="vital-card-glass card-double-border">
                <div className="vital-card-header">
                  <div className="vital-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="vital-icon-pulse blue">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span>Blood Glucose</span>
                  </div>
                  <span className="vital-status-pill normal">Fasting</span>
                </div>
                <div className="vital-value-group">
                  <span className="vital-value">98</span>
                  <span className="vital-unit">mg/dL</span>
                </div>
                <svg className="vital-sparkline-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,8 Q15,18 35,5 T70,12 T100,7" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <SVGAnalyticsChart 
              title="Weekly Healthcare Activity Wave" 
              dataPoints={patientActivityData} 
              color="#FF6B00" 
            />

            <div className="dashboard-grid-layout" style={{ marginTop: '24px' }}>
              <div className="dashboard-panel-card card-double-border">
                <WireframeAccent position="top-right" />
                <h2>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Next Consultation
                </h2>
                {appointments.filter(a => a.status === 'scheduled').length > 0 ? (
                  <div className="appointments-card-list" style={{ gridTemplateColumns: '1fr' }}>
                    {[appointments.filter(a => a.status === 'scheduled')[0]].map(apt => (
                      <div key={apt.id} className="apt-card-glass" style={{ borderLeft: '4px solid var(--g-emerald)' }}>
                        <div className="apt-card-header">
                          <div className="apt-user-profile">
                            <div className="apt-avatar-initials">
                              {apt.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="apt-user-info">
                              <h4>{apt.doctorName}</h4>
                              <p>{apt.specialization}</p>
                            </div>
                          </div>
                          <span className="status-badge scheduled">Confirmed</span>
                        </div>
                        <div className="apt-card-details">
                          <div className="apt-detail-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>{apt.date}</span>
                          </div>
                          <div className="apt-detail-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>{apt.time}</span>
                          </div>
                          <div className="apt-detail-row">
                            <span style={{ fontSize: '0.74rem', padding: '2px 6px', borderRadius: '4px', background: apt.mode === 'online' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: apt.mode === 'online' ? '#3B82F6' : '#10B981', fontWeight: 'bold' }}>
                              {apt.mode === 'online' ? '🎥 Online Video' : '🏥 In-Person Clinic'}
                            </span>
                          </div>
                        </div>

                        {apt.mode === 'online' && apt.status === 'scheduled' && apt.jitsiLink && (
                          <div className="apt-jitsi-row" style={{ marginTop: '10px', background: 'rgba(59, 130, 246, 0.08)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                              <span style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>Jitsi Call Active</span>
                            </div>
                            <a href={apt.jitsiLink} target="_blank" rel="noopener noreferrer" className="btn-apt-primary" style={{ fontSize: '0.72rem', padding: '3px 8px', textDecoration: 'none', background: '#3B82F6', borderRadius: '4px', fontWeight: 'bold' }}>Join</a>
                          </div>
                        )}

                        <div className="apt-card-actions" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                          <button 
                            type="button"
                            className="btn-apt-warning"
                            style={{ flex: 1, padding: '5px 10px', fontSize: '0.78rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: '600', cursor: 'pointer' }}
                            onClick={() => handleSendReminder(apt)}
                          >
                            🔔 Remind Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="calendar-info-box">
                    No upcoming consultations scheduled. Browse listings to book slots!
                  </div>
                )}
              </div>

              {/* Digital VitaCard Wallet Card */}
              <div className="digital-wallet-card-wrapper card-double-border">
                <div className="wallet-card-top">
                  <div className="wallet-card-logo-group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#wallet-grad)" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <defs>
                        <linearGradient id="wallet-grad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FF9E53" />
                          <stop offset="100%" stopColor="#FF6B00" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="wallet-logo-text">VitaCard</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Discount Rate</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--g-emerald)' }}>25% OFF</div>
                  </div>
                </div>

                <div className="wallet-card-chip"></div>

                <div className="wallet-card-number">
                  XXXX XXXX VC-{session.id.toUpperCase().split('_')[2]}
                </div>

                <div className="wallet-card-bottom">
                  <div>
                    <div className="wallet-member-lbl">Cardholder Name</div>
                    <div className="wallet-member-name">{session.name}</div>
                  </div>

                  <div className="wallet-card-barcode-area">
                    <div className="barcode-svg-wrapper" onClick={() => setShowQrModal(true)} style={{ cursor: 'pointer' }}>
                      <svg width="60" height="25" viewBox="0 0 60 25">
                        <line x1="2" y1="2" x2="2" y2="23" stroke="#000" strokeWidth="2" />
                        <line x1="6" y1="2" x2="6" y2="23" stroke="#000" strokeWidth="1" />
                        <line x1="9" y1="2" x2="9" y2="23" stroke="#000" strokeWidth="3" />
                        <line x1="14" y1="2" x2="14" y2="23" stroke="#000" strokeWidth="1" />
                        <line x1="18" y1="2" x2="18" y2="23" stroke="#000" strokeWidth="2" />
                        <line x1="22" y1="2" x2="22" y2="23" stroke="#000" strokeWidth="4" />
                        <line x1="28" y1="2" x2="28" y2="23" stroke="#000" strokeWidth="1" />
                        <line x1="32" y1="2" x2="32" y2="23" stroke="#000" strokeWidth="2" />
                        <line x1="36" y1="2" x2="36" y2="23" stroke="#000" strokeWidth="1" />
                        <line x1="40" y1="2" x2="40" y2="23" stroke="#000" strokeWidth="3" />
                        <line x1="45" y1="2" x2="45" y2="23" stroke="#000" strokeWidth="1" />
                        <line x1="50" y1="2" x2="50" y2="23" stroke="#000" strokeWidth="2" />
                        <line x1="55" y1="2" x2="55" y2="23" stroke="#000" strokeWidth="2" />
                      </svg>
                    </div>
                    <button className="btn-wallet-action" onClick={() => setShowQrModal(true)} style={{ width: '100%', fontSize: '0.62rem', padding: '3px 8px', marginTop: '2px' }}>
                      Show QR
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Modal Popup */}
            {showQrModal && (
              <div className="modal-overlay-glass" onClick={() => setShowQrModal(false)}>
                <div className="modal-content-card qr-modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={() => setShowQrModal(false)}>×</button>
                  <h2>VitaCard Digital Wallet</h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Scan at any verified hospital or clinic desk to redeem health benefits.</p>
                  
                  <div className="qr-code-frame">
                    <svg width="180" height="180" viewBox="0 0 100 100">
                      <rect x="5" y="5" width="90" height="90" fill="none" stroke="#1C120E" strokeWidth="2" />
                      <rect x="10" y="10" width="25" height="25" fill="#1C120E" />
                      <rect x="15" y="15" width="15" height="15" fill="#fff" />
                      <rect x="18" y="18" width="9" height="9" fill="#FF6B00" />
                      <rect x="65" y="10" width="25" height="25" fill="#1C120E" />
                      <rect x="70" y="15" width="15" height="15" fill="#fff" />
                      <rect x="73" y="18" width="9" height="9" fill="#FF6B00" />
                      <rect x="10" y="65" width="25" height="25" fill="#1C120E" />
                      <rect x="15" y="70" width="15" height="15" fill="#fff" />
                      <rect x="18" y="73" width="9" height="9" fill="#FF6B00" />
                      <rect x="70" y="70" width="10" height="10" fill="#1C120E" />
                      <rect x="73" y="73" width="4" height="4" fill="#fff" />
                      <rect x="74" y="74" width="2" height="2" fill="#FF6B00" />
                      <rect x="40" y="10" width="5" height="5" fill="#1C120E" />
                      <rect x="50" y="15" width="5" height="10" fill="#1C120E" />
                      <rect x="45" y="20" width="10" height="5" fill="#1C120E" />
                      <rect x="40" y="30" width="5" height="15" fill="#1C120E" />
                      <rect x="40" y="50" width="10" height="5" fill="#1C120E" />
                      <rect x="55" y="45" width="5" height="5" fill="#1C120E" />
                      <rect x="60" y="40" width="5" height="10" fill="#1C120E" />
                      <rect x="50" y="60" width="15" height="5" fill="#1C120E" />
                      <rect x="45" y="70" width="5" height="15" fill="#1C120E" />
                      <rect x="55" y="75" width="10" height="5" fill="#1C120E" />
                      <rect x="55" y="85" width="5" height="5" fill="#1C120E" />
                      <rect x="10" y="45" width="15" height="5" fill="#1C120E" />
                      <rect x="20" y="50" width="5" height="10" fill="#1C120E" />
                      <rect x="80" y="45" width="10" height="5" fill="#1C120E" />
                      <rect x="85" y="50" width="5" height="10" fill="#1C120E" />
                    </svg>
                  </div>

                  <div style={{ fontStyle: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: 'var(--g-emerald)' }}>
                    MEMBER-VC-{session.id.toUpperCase().split('_')[2]}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Expires: 12/2028 • Valid at 250+ partners
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'appointments' && (
          <div className="dashboard-panel-card card-double-border">
            <WireframeAccent position="top-right" />
            <div className="view-mode-bar">
              <h3>Consultation Bookings</h3>
              <div className="view-mode-toggles">
                <button 
                  className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  Card Grid
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => { setViewMode('calendar'); setSelectedDate(new Date().toISOString().split('T')[0]); }}
                >
                  Calendar View
                </button>
              </div>
            </div>

            {viewMode === 'cards' ? (
              appointments.length > 0 ? (
                <div className="appointments-card-list">
                  {appointments.map(apt => (
                    <div key={apt.id} className="apt-card-glass">
                      <div className="apt-card-header">
                        <div className="apt-user-profile">
                          <div className="apt-avatar-initials">
                            {apt.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="apt-user-info">
                            <h4>{apt.doctorName}</h4>
                            <p>{apt.specialization} • {apt.clinicName}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                      </div>

                      <div className="apt-card-details">
                        <div className="apt-detail-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>{apt.date}</span>
                        </div>
                        <div className="apt-detail-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span>{apt.time}</span>
                        </div>
                        <div className="apt-detail-row">
                          <span style={{ fontSize: '0.74rem', padding: '2px 6px', borderRadius: '4px', background: apt.mode === 'online' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: apt.mode === 'online' ? '#3B82F6' : '#10B981', fontWeight: 'bold' }}>
                            {apt.mode === 'online' ? '🎥 Online Video' : '🏥 In-Person Clinic'}
                          </span>
                        </div>
                      </div>

                      {apt.mode === 'online' && apt.status === 'scheduled' && apt.jitsiLink && (
                        <div className="apt-jitsi-row" style={{ margin: '10px 16px', background: 'rgba(59, 130, 246, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>Jitsi Call Active</span>
                          </div>
                          <a href={apt.jitsiLink} target="_blank" rel="noopener noreferrer" className="btn-apt-primary" style={{ fontSize: '0.72rem', padding: '3px 8px', textDecoration: 'none', background: '#3B82F6', borderRadius: '4px', fontWeight: 'bold' }}>Join call</a>
                        </div>
                      )}

                      {apt.notes && <p className="apt-card-notes">"{apt.notes}"</p>}

                      {apt.status === 'scheduled' && (
                        <div className="apt-card-actions">
                          <button 
                            className="btn-apt-danger"
                            onClick={() => handleCancel(apt.id)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="btn-apt-warning"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: '600' }}
                            onClick={() => handleSendReminder(apt)}
                          >
                            🔔 Remind
                          </button>
                          <button 
                            className="btn-apt-primary"
                            onClick={() => {
                              setRescheduleAptId(apt.id);
                              setNewDate(apt.date);
                              setNewTime(apt.time);
                            }}
                          >
                            Reschedule
                          </button>
                        </div>
                      )}

                      {rescheduleAptId === apt.id && (
                        <form className="reschedule-box-glass" onSubmit={(e) => handleRescheduleSubmit(e, apt.id)}>
                          <div className="form-grid-row">
                            <div className="form-group">
                              <label>New Date</label>
                              <input 
                                type="date" 
                                className="form-input"
                                value={newDate} 
                                onChange={(e) => setNewDate(e.target.value)} 
                                min={new Date().toISOString().split('T')[0]}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label>New Time</label>
                              <select 
                                className="form-input"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                required
                              >
                                <option value="09:00 AM">09:00 AM</option>
                                <option value="10:30 AM">10:30 AM</option>
                                <option value="11:45 AM">11:45 AM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="03:30 PM">03:30 PM</option>
                                <option value="05:00 PM">05:00 PM</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button type="button" className="btn-apt-secondary" onClick={() => setRescheduleAptId(null)}>Cancel</button>
                            <button type="submit" className="btn-apt-primary">Confirm Reschedule</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="calendar-info-box">No appointments found.</div>
              )
            ) : (
              <div className="dashboard-grid-layout">
                <div>
                  <CalendarView 
                    appointments={appointments} 
                    selectedDate={selectedDate}
                    onSelectDate={(date) => setSelectedDate(date)}
                  />
                </div>

                <div className="dashboard-panel-card card-double-border" style={{ padding: '24px' }}>
                  <h3>Schedule for {selectedDate || 'Selected Date'}</h3>
                  {calendarFilteredAppointments.length > 0 ? (
                    <div className="appointments-card-list calendar-list">
                      {calendarFilteredAppointments.map(apt => (
                        <div key={apt.id} className="apt-card-glass" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4>{apt.doctorName}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: apt.mode === 'online' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: apt.mode === 'online' ? '#3B82F6' : '#10B981', fontWeight: 'bold' }}>
                                {apt.mode === 'online' ? 'Online' : 'In-Person'}
                              </span>
                              <span style={{ color: 'var(--g-emerald)', fontWeight: 700 }}>{apt.time}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {apt.clinicName} • {apt.specialization}
                          </p>
                          {apt.mode === 'online' && apt.status === 'scheduled' && apt.jitsiLink && (
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                              <a href={apt.jitsiLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                Join Video Call
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="calendar-info-box" style={{ marginTop: '12px' }}>
                      No bookings scheduled for this date.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-panel-card card-double-border">
            <WireframeAccent position="top-right" />
            <h2>My Medical Profile & Clinical History</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Manage clinical records shared securely with verified doctors.
            </p>

            {profileSuccess && (
              <div className="save-success-alert">
                ✓ Clinical profile metrics updated successfully.
              </div>
            )}

            <form className="profile-editor-form" onSubmit={handleProfileSave}>
              <div className="editor-section-title">A. Clinical Indicators & Conditions</div>
              <div className="form-grid-row">
                <div className="form-group">
                  <label>Chronic Medical Conditions</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Mild Asthma, Hypertension, Diabetes Type 2"
                    value={conditions} 
                    onChange={(e) => setConditions(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Known Allergies</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Penicillin, Peanuts, Sulfa Drugs"
                    value={allergies} 
                    onChange={(e) => setAllergies(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Current Medications & Dosages</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Metformin 500mg (Daily), Albuterol inhaler"
                  value={medications} 
                  onChange={(e) => setMedications(e.target.value)} 
                />
              </div>

              <div className="editor-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>B. Past Medical History & Reports</span>
                <button 
                  type="button" 
                  className="btn-apt-primary" 
                  style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                  onClick={() => setRepActive(!repActive)}
                >
                  {repActive ? "Cancel Add" : "+ Add Report Log"}
                </button>
              </div>

              {repActive && (
                <div className="reschedule-box-glass" style={{ background: 'rgba(255, 107, 0, 0.03)', border: '1px dashed var(--g-emerald)' }}>
                  <h4>Log Past Treatment/Diagnostic Report</h4>
                  <div className="form-grid-row">
                    <div className="form-group">
                      <label>Hospital/Clinic Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. City General Hospital"
                        value={repHospital}
                        onChange={(e) => setRepHospital(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Doctor Details</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Dr. Amit Shah (Orthopedic)"
                        value={repDoctor}
                        onChange={(e) => setRepDoctor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-row">
                    <div className="form-group">
                      <label>Date of Visit</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={repDate}
                        onChange={(e) => setRepDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 11:30 AM"
                        value={repTime}
                        onChange={(e) => setRepTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Diagnosis Summary / Report Notes</label>
                    <textarea 
                      className="form-input" 
                      rows="2"
                      placeholder="e.g. Fracture check. Cast applied."
                      value={repNotes}
                      onChange={(e) => setRepNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-apt-secondary" onClick={() => setRepActive(false)}>Cancel</button>
                    <button type="button" className="btn-apt-primary" onClick={handleAddReport}>Log Record</button>
                  </div>
                </div>
              )}

              <div className="clinical-records-table-wrapper">
                {pastReports.length > 0 ? (
                  <table className="clinical-records-table">
                    <thead>
                      <tr>
                        <th>Date / Time</th>
                        <th>Clinic & Practitioner</th>
                        <th>Notes & Diagnosis</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastReports.map(rep => (
                        <tr key={rep.id}>
                          <td>
                            <strong>{rep.date}</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{rep.time}</p>
                          </td>
                          <td className="record-doc-cell">
                            <h5>{rep.hospitalName}</h5>
                            <p>{rep.doctorDetails}</p>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{rep.notes}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button"
                              className="btn-apt-danger"
                              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                              onClick={() => handleRemoveReport(rep.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="calendar-info-box" style={{ border: 'none' }}>
                    No past reports logged.
                  </div>
                )}
              </div>

              <div className="editor-section-title" style={{ marginTop: '24px' }}>B. Account & Interface Preferences</div>
              <div className="profile-settings-preferences" style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>Enable Chatbot Chat History</h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      If enabled, your conversations with the VitaCard AI triage chatbot will be securely saved in this browser.
                    </p>
                  </div>
                  <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={enableChatHistory} 
                      onChange={(e) => setEnableChatHistory(e.target.checked)} 
                      style={{ display: 'none' }}
                    />
                    <span className="slider-toggle-round" style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: enableChatHistory ? 'var(--g-emerald)' : '#4a5568', 
                      transition: '0.3s', 
                      borderRadius: '34px'
                    }}>
                      <span className="slider-toggle-thumb" style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: enableChatHistory ? '24px' : '4px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '0.3s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-profile-save">
                Save Profile Clinical Details
              </button>
            </form>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="dashboard-panel-card card-double-border">
            <WireframeAccent position="top-right" />
            <h2>Notifications Log</h2>
            {notifications.length > 0 ? (
              <div className="notifications-panel">
                {notifications.map(notif => (
                  <div key={notif.id} className={`notif-item-card ${!notif.isRead ? 'unread' : ''}`}>
                    {!notif.isRead && <div className="notif-indicator-dot"></div>}
                    <div className="notif-content-block">
                      <p className="notif-text-message">{notif.text}</p>
                      <span className="notif-timestamp-tag">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-notifications-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                No notification logs.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SUB-COMPONENT: DOCTOR DASHBOARD (VERTICAL SIDEBAR LAYOUT)
   ──────────────────────────────────────────────────────────────── */
function DoctorDashboard({ session, onLogout }) {
  const doctorId = session.doctorId;
  const [doctorData, setDoctorData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, appointments, profile, notifications
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // calendar, cards
  const [selectedPatient, setSelectedPatient] = useState(null); // Patient history view modal
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescPatientName, setPrescPatientName] = useState('');
  const [prescMedication, setPrescMedication] = useState('');
  const [prescDosage, setPrescDosage] = useState('');
  const [prescInstructions, setPrescInstructions] = useState('');
  const [prescSuccess, setPrescSuccess] = useState(false);

  // Doctor Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinic, setClinic] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [feeRange, setFeeRange] = useState('');
  const [education, setEducation] = useState('');
  const [languages, setLanguages] = useState([]);
  const [tempLanguage, setTempLanguage] = useState('');

  const doctorActivityData = [
    { label: 'Mon', value: 2 },
    { label: 'Tue', value: 5 },
    { label: 'Wed', value: 8 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 6 },
    { label: 'Sat', value: 3 },
    { label: 'Sun', value: 1 }
  ];

  const loadData = () => {
    if (!doctorId) return;
    const doc = getDoctorById(doctorId);
    if (doc) {
      setDoctorData(doc);
      setName(doc.name);
      setPhone(doc.phone || '');
      setSpecialization(doc.specialization || '');
      setClinic(doc.clinic || '');
      setAddress(doc.address || '');
      setCity(doc.city || '');
      setBio(doc.bio || '');
      setExperience(doc.experience_years || '');
      setFeeRange(doc.fee_range || '');
      setEducation(doc.education || '');
      setLanguages(doc.languages || []);
    }

    const list = getAppointments().filter(a => a.doctorId === doctorId);
    setAppointments(list);
    setNotifications(getNotifications(session.id));
  };

  useEffect(() => {
    loadData();
    return subscribeToState(loadData);
  }, [doctorId, session.id]);

  const handleSendReminder = async (apt) => {
    try {
      const users = JSON.parse(localStorage.getItem('vitacard_users') || '[]');
      const doctorUser = users.find(u => u.role === 'doctor' && u.doctorId === parseInt(apt.doctorId, 10));
      const patientUser = users.find(u => u.id === apt.patientId);
      
      const patientEmail = (patientUser && patientUser.email) || 'patient@vitacard.com';
      const doctorEmail = (doctorUser && doctorUser.email) || `${apt.doctorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@vitacard.com`;

      const response = await fetch('/api/send-appointment-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: apt.id,
          patientName: apt.patientName,
          patientEmail: patientEmail,
          patientPhone: apt.patientPhone,
          doctorName: apt.doctorName,
          doctorEmail: doctorEmail,
          specialization: apt.specialization || '',
          clinicName: apt.clinicName || '',
          address: apt.address || '',
          date: apt.date,
          time: apt.time,
          mode: apt.mode || 'offline',
          jitsiLink: apt.jitsiLink || null,
          notes: apt.notes || ''
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("✉️ Appointment reminder email successfully sent to both Patient and Doctor!");
      } else {
        alert("❌ Failed to send reminder: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("❌ Connection error while sending email reminder.");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!doctorId) return;

    const res = await updateDoctorProfile(doctorId, {
      name,
      phone,
      specialization,
      clinic,
      address,
      city,
      bio,
      experience_years: parseInt(experience, 10) || 0,
      fee_range: feeRange,
      education,
      languages
    });

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(res.error);
    }
  };

  const handleAddLanguage = (e) => {
    if (e.key === 'Enter' && tempLanguage.trim()) {
      e.preventDefault();
      if (!languages.includes(tempLanguage.trim())) {
        setLanguages([...languages, tempLanguage.trim()]);
      }
      setTempLanguage('');
    }
  };

  const handleRemoveLanguage = (langToRemove) => {
    setLanguages(languages.filter(l => l !== langToRemove));
  };

  const handleViewPatientProfile = (apt) => {
    const pProfile = getPatientById(apt.patientId);
    setSelectedPatient({
      name: apt.patientName,
      phone: apt.patientPhone,
      date: apt.date,
      time: apt.time,
      notes: apt.notes || 'None provided.',
      status: apt.status,
      conditions: pProfile?.conditions || 'None Declared',
      allergies: pProfile?.allergies || 'None Declared',
      medications: pProfile?.medications || 'None Declared',
      pastReports: pProfile?.pastReports || []
    });
  };

  const markRead = () => {
    markNotificationsAsRead(session.id);
  };

  const calendarFilteredAppointments = appointments.filter(a => a.date === selectedDate && a.status !== 'cancelled');
  const userInitials = name ? name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <div className="dashboard-layout-wrapper">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar-glass">
        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-meta">
            <h4>{name || session.name}</h4>
            <span>Practitioner</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="sidebar-nav-list">
          <button 
            className={`sidebar-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Overview
          </button>

          <button 
            className={`sidebar-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Patient Schedule
          </button>

          <button 
            className={`sidebar-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit Profile
          </button>

          <button 
            className={`sidebar-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); markRead(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            Notifications
          </button>

          <button 
            className="sidebar-tab-btn"
            onClick={onLogout}
            style={{ color: '#EF4444', marginTop: '16px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>

        {/* Security online footer */}
        <div className="sidebar-system-footer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div className="system-status-text">
            <span>Systems Secured</span>
            <p>Verification Link Live <span className="pulsing-indicator-dot"></span></p>
          </div>
        </div>
      </div>

      {/* Right Content Pane */}
      <div className="dashboard-main-content-pane">
        <div className="dashboard-header-block">
          <div className="dashboard-welcome">
            <h1>Welcome, {name || session.name}</h1>
            <p>Practice Portal: Manage coordinates, consultation schedule, and credentials.</p>
          </div>
          <span className="dashboard-header-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Verified Specialist
          </span>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Quick Actions Panel */}
            <div className="quick-actions-bar">
              <button className="btn-quick-action" onClick={() => setShowPrescriptionModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Write Prescription
              </button>
              <button className="btn-quick-action" onClick={() => setActiveTab('appointments')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Patient Schedule
              </button>
              <button className="btn-quick-action" onClick={() => setActiveTab('profile')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Update Profile Settings
              </button>
              <button className="btn-quick-action" onClick={() => alert("Connecting to Practitioner Support Center: 1800-419-DOCS")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Practice Helpdesk
              </button>
            </div>

            <div className="stats-cards-grid">
              <div className="stat-card-glass card-double-border">
                <WireframeAccent position="top-right" />
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="stat-meta">
                  <h3>{appointments.filter(a => a.status === 'scheduled').length}</h3>
                  <p>Active Slots</p>
                </div>
              </div>
              <div className="stat-card-glass card-double-border">
                <WireframeAccent position="top-right" />
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div className="stat-meta">
                  <h3>{doctorData?.rating || '5.0'}</h3>
                  <p>Clinic Rating</p>
                </div>
              </div>
              <div className="stat-card-glass card-double-border">
                <WireframeAccent position="top-right" />
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="stat-meta">
                  <h3 style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                    {clinic || 'VitaCard Clinic'}
                  </h3>
                  <p>Practice Hub</p>
                </div>
              </div>
            </div>

            <SVGAnalyticsChart 
              title="Weekly Patient Consultation Volume" 
              dataPoints={doctorActivityData} 
              color="#FF6B00" 
            />

            {/* Prescription Modal Popup */}
            {showPrescriptionModal && (
              <div className="modal-overlay-glass" onClick={() => { setShowPrescriptionModal(false); setPrescSuccess(false); }}>
                <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <button className="modal-close-btn" onClick={() => { setShowPrescriptionModal(false); setPrescSuccess(false); }}>×</button>
                  
                  {!prescSuccess ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!prescPatientName || !prescMedication || !prescDosage || !prescInstructions) {
                        alert("Please fill in all details.");
                        return;
                      }
                      setPrescSuccess(true);
                    }}>
                      <h2>Generate Digital Prescription</h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Issue secured clinical prescriptions directly to the patient's digital card wallet.
                      </p>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label>Patient Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Satish Kumar" 
                          value={prescPatientName} 
                          onChange={(e) => setPrescPatientName(e.target.value)} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label>Medication / Rx</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Amoxicillin 500mg" 
                          value={prescMedication} 
                          onChange={(e) => setPrescMedication(e.target.value)} 
                          required 
                        />
                      </div>

                      <div className="form-grid-row" style={{ marginBottom: '12px' }}>
                        <div className="form-group">
                          <label>Dosage & Frequency</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. 1 capsule every 8 hours" 
                            value={prescDosage} 
                            onChange={(e) => setPrescDosage(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Instructions & Refills</label>
                        <textarea 
                          className="form-input" 
                          rows="3" 
                          placeholder="e.g. Take with food. Complete the full course of 10 days." 
                          value={prescInstructions} 
                          onChange={(e) => setPrescInstructions(e.target.value)} 
                          required 
                        />
                      </div>

                      <button type="submit" className="btn-apt-primary" style={{ width: '100%', padding: '12px' }}>
                        Generate & Sign Prescription
                      </button>
                    </form>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--g-emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g-emerald)', marginBottom: '16px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <h2>Prescription Signed Electronically</h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        The prescription has been logged and cryptographically attached to the patient's card.
                      </p>

                      <div style={{ background: 'rgba(255, 107, 0, 0.04)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: '8px', padding: '16px', textAlign: 'left', marginBottom: '20px', fontFamily: 'monospace' }}>
                        <div style={{ borderBottom: '1px dashed rgba(255,107,0,0.15)', paddingBottom: '8px', marginBottom: '8px', fontWeight: 800 }}>
                          Rx: {prescMedication}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong>Patient:</strong> {prescPatientName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong>Dosage:</strong> {prescDosage}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <strong>Instructions:</strong> {prescInstructions}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(16, 185, 129, 0.8)', marginTop: '8px', textAlign: 'right' }}>
                          ✓ Digitally Signed by {name || session.name}
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="btn-apt-secondary" 
                        onClick={() => {
                          setShowPrescriptionModal(false);
                          setPrescSuccess(false);
                          setPrescPatientName('');
                          setPrescMedication('');
                          setPrescDosage('');
                          setPrescInstructions('');
                        }}
                        style={{ width: '100%', padding: '10px' }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'appointments' && (
          <div className="dashboard-panel-card card-double-border">
            <WireframeAccent position="top-right" />
            <div className="view-mode-bar">
              <h3>Scheduled Patient Consultations</h3>
              <div className="view-mode-toggles">
                <button 
                  className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  Cards View
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => { setViewMode('calendar'); setSelectedDate(new Date().toISOString().split('T')[0]); }}
                >
                  Calendar View
                </button>
              </div>
            </div>

            {viewMode === 'cards' ? (
              appointments.length > 0 ? (
                <div className="appointments-card-list">
                  {appointments.map(apt => (
                    <div key={apt.id} className="apt-card-glass">
                      <div className="apt-card-header">
                        <div className="apt-user-profile">
                          <div className="apt-avatar-initials" style={{ background: 'linear-gradient(135deg, #FF9E53, #FF6B00)' }}>
                            {apt.patientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="apt-user-info">
                            <h4>{apt.patientName}</h4>
                            <p>Contact: {apt.patientPhone || 'N/A'}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                      </div>

                      <div className="apt-card-details">
                        <div className="apt-detail-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>{apt.date}</span>
                        </div>
                        <div className="apt-detail-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span>{apt.time}</span>
                        </div>
                        <div className="apt-detail-row">
                          <span style={{ fontSize: '0.74rem', padding: '2px 6px', borderRadius: '4px', background: apt.mode === 'online' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: apt.mode === 'online' ? '#3B82F6' : '#10B981', fontWeight: 'bold' }}>
                            {apt.mode === 'online' ? '🎥 Online Video' : '🏥 In-Person Clinic'}
                          </span>
                        </div>
                      </div>

                      {apt.mode === 'online' && apt.status === 'scheduled' && apt.jitsiLink && (
                        <div className="apt-jitsi-row" style={{ margin: '10px 16px', background: 'rgba(59, 130, 246, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>Jitsi Call Active</span>
                          </div>
                          <a href={apt.jitsiLink} target="_blank" rel="noopener noreferrer" className="btn-apt-primary" style={{ fontSize: '0.72rem', padding: '3px 8px', textDecoration: 'none', background: '#3B82F6', borderRadius: '4px', fontWeight: 'bold' }}>Join call</a>
                        </div>
                      )}

                      {apt.notes && <p className="apt-card-notes">"{apt.notes}"</p>}

                      <div className="apt-card-actions">
                        <button 
                          className="btn-apt-primary"
                          onClick={() => handleViewPatientProfile(apt)}
                        >
                          View Patient Profile & Details
                        </button>
                        {apt.status === 'scheduled' && (
                          <button 
                            className="btn-apt-warning"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: '600' }}
                            onClick={() => handleSendReminder(apt)}
                          >
                            🔔 Remind
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="calendar-info-box">No appointments listed.</div>
              )
            ) : (
              <div className="dashboard-grid-layout">
                <div>
                  <CalendarView 
                    appointments={appointments}
                    selectedDate={selectedDate}
                    onSelectDate={(date) => setSelectedDate(date)}
                  />
                </div>

                <div className="dashboard-panel-card card-double-border" style={{ padding: '24px' }}>
                  <h3>Consultations for {selectedDate || 'Selected Date'}</h3>
                  {calendarFilteredAppointments.length > 0 ? (
                    <div className="appointments-card-list calendar-list">
                      {calendarFilteredAppointments.map(apt => (
                        <div key={apt.id} className="apt-card-glass" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '0.92rem' }}>{apt.patientName}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: apt.mode === 'online' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: apt.mode === 'online' ? '#3B82F6' : '#10B981', fontWeight: 'bold' }}>
                                {apt.mode === 'online' ? 'Online' : 'In-Person'}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--g-emerald)', fontWeight: 700 }}>{apt.time}</span>
                            </div>
                          </div>
                          {apt.mode === 'online' && apt.status === 'scheduled' && apt.jitsiLink && (
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                              <a href={apt.jitsiLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                Join Video Call
                              </a>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button 
                              className="btn-apt-secondary"
                              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                              onClick={() => handleViewPatientProfile(apt)}
                            >
                              View Patient Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="calendar-info-box" style={{ marginTop: '12px' }}>
                      No bookings scheduled for this date.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-panel-card card-double-border">
            <WireframeAccent position="top-right" />
            <h2>Practitioner Details Profile Editor</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Provide clinical coordinates and bio. Updates sync instantly with directory indexing.
            </p>

            {saveSuccess && (
              <div className="save-success-alert">
                ✓ Clinic Profile Panel updated successfully! Details updated across directory indexing.
              </div>
            )}

            <form className="profile-editor-form" onSubmit={handleProfileSave}>
              <div className="editor-section-title">A. Coordinates & Identification</div>
              <div className="form-grid-row">
                <div className="form-group">
                  <label>Practitioner Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label>Specialization Department</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={specialization} 
                    onChange={(e) => setSpecialization(e.target.value)} 
                    required 
                />
                </div>
                <div className="form-group">
                  <label>Education / Degrees</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. MBBS, MD, FRCP" 
                    value={education} 
                    onChange={(e) => setEducation(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="editor-section-title">B. Practice Location & Fees</div>
              <div className="form-grid-row">
                <div className="form-group">
                  <label>Clinic / Hospital Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={clinic} 
                    onChange={(e) => setClinic(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Consultation Fee Range</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. ₹400 - ₹600" 
                    value={feeRange} 
                    onChange={(e) => setFeeRange(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label>Street Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="editor-section-title">C. Professional Bio & Experience</div>
              <div className="form-grid-row">
                <div className="form-group">
                  <label>Years of Clinical Experience</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={experience} 
                    onChange={(e) => setExperience(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Spoken Languages (Press Enter to add tag)</label>
                  <div className="tags-input-container">
                    {languages.map(lang => (
                      <span key={lang} className="profile-tag-badge">
                        {lang}
                        <button type="button" onClick={() => handleRemoveLanguage(lang)}>&times;</button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      className="tags-text-input" 
                      placeholder="Add language..."
                      value={tempLanguage}
                      onChange={(e) => setTempLanguage(e.target.value)}
                      onKeyDown={handleAddLanguage}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Doctor Biography / Statement</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Describe your practice philosophy..."
                  required
                />
              </div>

              <button type="submit" className="btn-profile-save">
                Save Clinic Profile Changes
              </button>
            </form>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="dashboard-panel-card card-double-border">
            <WireframeAccent position="top-right" />
            <h2>Notifications Log</h2>
            {notifications.length > 0 ? (
              <div className="notifications-panel">
                {notifications.map(notif => (
                  <div key={notif.id} className={`notif-item-card ${!notif.isRead ? 'unread' : ''}`}>
                    {!notif.isRead && <div className="notif-indicator-dot"></div>}
                    <div className="notif-content-block">
                      <p className="notif-text-message">{notif.text}</p>
                      <span className="notif-timestamp-tag">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-notifications-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                No notification logs.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="modal-overlay-glass" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPatient(null)}>&times;</button>
            <div className="modal-patient-header">
              <div className="apt-avatar-initials" style={{ width: '48px', height: '48px', fontSize: '1rem', background: 'linear-gradient(135deg, #FF9E53, #FF6B00)' }}>
                {selectedPatient.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedPatient.name}</h3>
                <span className={`status-badge ${selectedPatient.status}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {selectedPatient.status}
                </span>
              </div>
            </div>

            <div className="modal-patient-details-grid">
              <div className="modal-detail-row-item">
                <span className="detail-lbl">Contact Number</span>
                <span className="detail-val">{selectedPatient.phone || 'N/A'}</span>
              </div>
              <div className="modal-detail-row-item">
                <span className="detail-lbl">Date of Appointment</span>
                <span className="detail-val">{selectedPatient.date}</span>
              </div>
              <div className="modal-detail-row-item">
                <span className="detail-lbl">Preferred Time Slot</span>
                <span className="detail-val">{selectedPatient.time}</span>
              </div>
            </div>

            <div style={{ marginTop: '4px' }}>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Consultation Booking Notes
              </h4>
              <div className="modal-notes-area">
                "{selectedPatient.notes}"
              </div>
            </div>

            {/* RESTRICTED CLINICAL HISTORY CARD */}
            <div style={{ borderTop: '1px solid rgba(255, 107, 0, 0.15)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#EF4444', letterSpacing: '0.5px' }}>
                  Restricted Clinical Records
                </h4>
              </div>

              <div className="medical-history-banner" style={{ background: 'rgba(239, 68, 68, 0.04)', borderColor: 'rgba(239, 68, 68, 0.15)', marginBottom: '16px' }}>
                <div className="medical-history-grid">
                  <div className="med-history-item">
                    <span className="lbl">Conditions</span>
                    <span className="val">{selectedPatient.conditions}</span>
                  </div>
                  <div className="med-history-item">
                    <span className="lbl">Allergies</span>
                    <span className="val" style={{ color: '#EF4444' }}>{selectedPatient.allergies}</span>
                  </div>
                  <div className="med-history-item">
                    <span className="lbl">Medications</span>
                    <span className="val">{selectedPatient.medications}</span>
                  </div>
                </div>
              </div>

              <h5 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Past Diagnosis History & Reports</h5>
              <div className="clinical-records-table-wrapper" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {selectedPatient.pastReports && selectedPatient.pastReports.length > 0 ? (
                  <table className="clinical-records-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hospital & Practitioner</th>
                        <th>Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatient.pastReports.map(rep => (
                        <tr key={rep.id}>
                          <td><strong>{rep.date}</strong></td>
                          <td>
                            <strong>{rep.hospitalName}</strong>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rep.doctorDetails}</p>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{rep.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="calendar-info-box" style={{ padding: '12px', border: 'none' }}>
                    No past reports shared in patient record.
                  </div>
                )}
              </div>
            </div>

            <button 
              className="btn-contact" 
              onClick={() => setSelectedPatient(null)}
              style={{ marginTop: '10px' }}
            >
              Close Profile View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MASTER CONTROLLER COMPONENT: DASHBOARD
   ──────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const checkSession = () => {
    const s = getCurrentSession();
    const prevSession = session;
    setSession(s);
    setLoading(false);

    if (s && !prevSession) {
      setShowWelcome(true);
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    checkSession();
    return subscribeToState(checkSession);
  }, [session]);

  const handleLogout = () => {
    logoutUser();
    window.location.hash = '#/';
  };

  if (loading) {
    return (
      <div className="dashboard-page-container dotted-grid-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading session details...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="dashboard-page-container dotted-grid-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card">
          <h2>Access Denied</h2>
          <p className="auth-subtitle" style={{ marginBottom: '20px' }}>Please login or create an account to view your medical dashboard.</p>
          <a href="#/login" className="btn-contact" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container dotted-grid-bg">
      {showWelcome && (
        <div className="dashboard-welcome-toast">
          <div className="welcome-toast-content">
            <span className="welcome-toast-icon">👋</span>
            <div className="welcome-toast-text">
              <h4>Welcome Back, {session.name}!</h4>
              <p>You have successfully logged in to your secure portal.</p>
            </div>
          </div>
          <button className="welcome-toast-close" onClick={() => setShowWelcome(false)}>✕</button>
        </div>
      )}

      {session.role === 'doctor' ? (
        <DoctorDashboard session={session} onLogout={handleLogout} />
      ) : (
        <PatientDashboard session={session} onLogout={handleLogout} />
      )}
    </div>
  );
}
