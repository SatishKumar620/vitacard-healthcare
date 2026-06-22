import doctorsData from '../db/doctors.json';

// Custom event to notify components when state changes
const STATE_EVENT = 'vitacard_state_change';

export function emitStateChange() {
  window.dispatchEvent(new Event(STATE_EVENT));
}

export function subscribeToState(callback) {
  window.addEventListener(STATE_EVENT, callback);
  return () => window.removeEventListener(STATE_EVENT, callback);
}

// Helper to safely parse JSON from localStorage
function getStorageItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper to write JSON to localStorage
function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key ${key} to localStorage:`, error);
  }
}

// Initialize state
export function initGlobalState() {
  // 1. Doctors database (claimable & editable)
  if (!localStorage.getItem('vitacard_doctors')) {
    const enrichedDoctors = doctorsData.map(doc => {
      return {
        ...doc,
        bio: doc.bio || `Accredited practitioner specialized in ${doc.specialization || 'general healthcare'} with years of clinical experience.`,
        experience_years: doc.experience_years || (10 + (doc.s_no % 15)),
        rating: doc.rating || (4.0 + (doc.s_no % 10) * 0.1).toFixed(1),
        fee_range: doc.fee_range || `₹${300 + (doc.s_no % 5) * 100} - ₹${500 + (doc.s_no % 5) * 100}`,
        languages: doc.languages || ['English', 'Hindi'],
        education: doc.education || 'MBBS, MD',
        slots: doc.slots || ['09:00 AM', '10:30 AM', '11:45 AM', '02:00 PM', '03:30 PM', '05:00 PM']
      };
    });
    setStorageItem('vitacard_doctors', enrichedDoctors);
  }

  // 2. Users database (credentials for login + clinical history profiles)
  if (!localStorage.getItem('vitacard_users')) {
    const defaultUsers = [
      {
        id: 'user_pat_1',
        email: 'patient@vitacard.com',
        password: 'password',
        role: 'patient',
        name: 'Satish Kumar',
        phone: '+91 98765 43210',
        age: '28',
        gender: 'Male',
        conditions: 'Hypertension (Mild)',
        allergies: 'Penicillin',
        medications: 'Lisinopril 5mg',
        pastReports: [
          {
            id: 'rep_1',
            hospitalName: 'Metro Heart Centre',
            doctorDetails: 'Dr. R. K. Prasad (Cardiologist)',
            date: '2026-04-12',
            time: '09:30 AM',
            notes: 'Annual ECG assessment. Normal sinus rhythm.'
          },
          {
            id: 'rep_2',
            hospitalName: 'Apollo Diagnostics',
            doctorDetails: 'Dr. S. Sengupta (Physician)',
            date: '2025-11-05',
            time: '03:00 PM',
            notes: 'Blood lipid panel. Cholesterol levels border high.'
          }
        ]
      },
      {
        id: 'user_doc_1',
        email: 'doctor@vitacard.com',
        password: 'password',
        role: 'doctor',
        name: 'Dr. Nitesh Kumar Singh',
        phone: '+91 91223 34455',
        doctorId: 1, // Linked to doctor s_no: 1
      }
    ];
    setStorageItem('vitacard_users', defaultUsers);
  }

  // 3. Appointments database
  if (!localStorage.getItem('vitacard_appointments')) {
    const initialAppointments = [
      {
        id: 'apt_1',
        patientId: 'user_pat_1',
        patientName: 'Satish Kumar',
        patientPhone: '+91 98765 43210',
        doctorId: 1,
        doctorName: 'Dr. Nitesh Kumar Singh',
        specialization: 'General Physician',
        clinicName: 'ASG Eye Hospital',
        address: 'Sakchi, Jamshedpur',
        date: '2026-06-22',
        time: '10:30 AM',
        status: 'scheduled',
        notes: 'Routine health checkup and consultation.'
      },
      {
        id: 'apt_2',
        patientId: 'user_pat_1',
        patientName: 'Satish Kumar',
        patientPhone: '+91 98765 43210',
        doctorId: 2,
        doctorName: 'Dr. Madan Shivam Rajkumar',
        specialization: 'Ophthalmologist',
        clinicName: 'ASG Eye Hospital',
        address: 'Sakchi, Jamshedpur',
        date: '2026-06-25',
        time: '02:00 PM',
        status: 'scheduled',
        notes: 'Eye vision testing and pressure checkup.'
      },
      {
        id: 'apt_3',
        patientId: 'patient_john',
        patientName: 'John Doe',
        patientPhone: '+91 90000 11111',
        doctorId: 1,
        doctorName: 'Dr. Nitesh Kumar Singh',
        specialization: 'General Physician',
        clinicName: 'ASG Eye Hospital',
        address: 'Sakchi, Jamshedpur',
        date: '2026-06-23',
        time: '11:45 AM',
        status: 'scheduled',
        notes: 'Consultation for mild flu symptoms and cough.'
      }
    ];
    setStorageItem('vitacard_appointments', initialAppointments);
  }

  // 4. Notifications database
  if (!localStorage.getItem('vitacard_notifications')) {
    const initialNotifications = [
      {
        id: 'notif_1',
        userId: 'user_doc_1',
        text: 'Welcome to the VitaCard Provider Portal! Your digital schedule is active.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        isRead: false
      },
      {
        id: 'notif_2',
        userId: 'user_doc_1',
        text: 'New appointment scheduled by Satish Kumar for June 22nd at 10:30 AM.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        isRead: false
      },
      {
        id: 'notif_3',
        userId: 'user_pat_1',
        text: 'Welcome to VitaCard! Display your digital health card to claim clinical discounts.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        isRead: false
      },
      {
        id: 'notif_4',
        userId: 'user_pat_1',
        text: 'Your appointment with Dr. Nitesh Kumar Singh on June 22nd at 10:30 AM has been successfully booked.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        isRead: false
      }
    ];
    setStorageItem('vitacard_notifications', initialNotifications);
  }
}

// Global initialization call
initGlobalState();

/* ─── State Getters and Setters ─── */

export function getCurrentSession() {
  return getStorageItem('vitacard_session', null);
}

export function loginUser(email, password, role) {
  const users = getStorageItem('vitacard_users', []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role);
  if (user) {
    const session = { ...user };
    delete session.password; // Don't keep password in active session
    setStorageItem('vitacard_session', session);
    emitStateChange();
    return { success: true, user: session };
  }
  return { success: false, error: 'Invalid email, password, or role.' };
}

export function signupUser(details) {
  const users = getStorageItem('vitacard_users', []);
  const emailExists = users.some(u => u.email.toLowerCase() === details.email.toLowerCase());
  
  if (emailExists) {
    return { success: false, error: 'Email already registered.' };
  }

  const newUserId = `user_${details.role}_${Date.now()}`;
  let doctorId = null;

  if (details.role === 'doctor') {
    const doctors = getStorageItem('vitacard_doctors', []);
    const newDocId = doctors.length > 0 ? Math.max(...doctors.map(d => d.s_no)) + 1 : 1;
    
    const newDoctor = {
      s_no: newDocId,
      name: details.name.startsWith('Dr. ') ? details.name : `Dr. ${details.name}`,
      specialization: details.specialization || 'General Physician',
      clinic: details.clinic || 'VitaCard Clinic',
      address: details.address || 'Central Street',
      city: details.city || 'Jamshedpur',
      phone: details.phone || 'N/A',
      source: 'vitacard.com',
      bio: details.bio || 'Accredited medical practitioner.',
      experience_years: details.experience_years || 5,
      rating: '5.0',
      fee_range: details.fee_range || '₹300 - ₹500',
      languages: details.languages || ['English', 'Hindi'],
      education: details.education || 'MBBS',
      slots: ['09:00 AM', '10:30 AM', '11:45 AM', '02:00 PM', '03:30 PM', '05:00 PM']
    };
    
    doctors.push(newDoctor);
    setStorageItem('vitacard_doctors', doctors);
    doctorId = newDocId;
  }

  const newUser = {
    id: newUserId,
    email: details.email,
    password: details.password,
    role: details.role,
    name: details.name,
    phone: details.phone,
    age: details.age || '',
    gender: details.gender || '',
    conditions: '',
    allergies: '',
    medications: '',
    pastReports: [],
    ...(doctorId && { doctorId })
  };

  users.push(newUser);
  setStorageItem('vitacard_users', users);

  const session = { ...newUser };
  delete session.password;
  setStorageItem('vitacard_session', session);

  addNotification(newUserId, `Welcome to VitaCard, ${details.name}! Complete your details to start.`);
  emitStateChange();
  return { success: true, user: session };
}

export function logoutUser() {
  localStorage.removeItem('vitacard_session');
  emitStateChange();
}

export function getDoctorsList() {
  return getStorageItem('vitacard_doctors', []);
}

export function getDoctorById(id) {
  const doctors = getDoctorsList();
  return doctors.find(d => d.s_no === parseInt(id, 10));
}

export function updateDoctorProfile(doctorId, updatedFields) {
  const doctors = getStorageItem('vitacard_doctors', []);
  const docIndex = doctors.findIndex(d => d.s_no === parseInt(doctorId, 10));
  
  if (docIndex !== -1) {
    doctors[docIndex] = { ...doctors[docIndex], ...updatedFields };
    setStorageItem('vitacard_doctors', doctors);
    emitStateChange();
    return { success: true, doctor: doctors[docIndex] };
  }
  return { success: false, error: 'Doctor profile not found.' };
}

export function updatePatientProfile(patientId, profileData) {
  const users = getStorageItem('vitacard_users', []);
  const userIdx = users.findIndex(u => u.id === patientId && u.role === 'patient');
  
  if (userIdx !== -1) {
    users[userIdx] = { ...users[userIdx], ...profileData };
    setStorageItem('vitacard_users', users);
    
    // Sync session
    const session = getCurrentSession();
    if (session && session.id === patientId) {
      const updatedSession = { ...session, ...profileData };
      setStorageItem('vitacard_session', updatedSession);
    }
    
    emitStateChange();
    return { success: true, user: users[userIdx] };
  }
  return { success: false, error: 'Patient profile not found.' };
}

export function getPatientById(id) {
  const users = getStorageItem('vitacard_users', []);
  return users.find(u => u.id === id && u.role === 'patient');
}

export function getAppointments() {
  return getStorageItem('vitacard_appointments', []);
}

export function addAppointment(appointmentData) {
  const appointments = getStorageItem('vitacard_appointments', []);
  const newApt = {
    id: `apt_${Date.now()}`,
    status: 'scheduled',
    ...appointmentData
  };
  
  appointments.push(newApt);
  setStorageItem('vitacard_appointments', appointments);

  // Send notifications
  addNotification(newApt.patientId, `Appointment scheduled with ${newApt.doctorName} on ${newApt.date} at ${newApt.time}.`);
  
  const users = getStorageItem('vitacard_users', []);
  const doctorUser = users.find(u => u.role === 'doctor' && u.doctorId === parseInt(newApt.doctorId, 10));
  if (doctorUser) {
    addNotification(doctorUser.id, `New booking: Patient ${newApt.patientName} scheduled for ${newApt.date} at ${newApt.time}.`);
  }

  // Derive Patient & Doctor emails for Resend trigger
  let patientEmail = 'patient@vitacard.com';
  const patientUser = users.find(u => u.id === newApt.patientId);
  if (patientUser && patientUser.email) {
    patientEmail = patientUser.email;
  } else {
    const session = getCurrentSession();
    if (session && session.id === newApt.patientId && session.email) {
      patientEmail = session.email;
    }
  }

  let doctorEmail = null;
  if (doctorUser && doctorUser.email) {
    doctorEmail = doctorUser.email;
  } else {
    const cleanDocName = newApt.doctorName ? newApt.doctorName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'doctor';
    doctorEmail = `${cleanDocName}@vitacard.com`;
  }

  // Fire-and-forget email API call
  fetch('/api/send-appointment-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appointmentId: newApt.id,
      patientName: newApt.patientName,
      patientEmail: patientEmail,
      patientPhone: newApt.patientPhone,
      doctorName: newApt.doctorName,
      doctorEmail: doctorEmail,
      specialization: newApt.specialization,
      clinicName: newApt.clinicName,
      address: newApt.address,
      date: newApt.date,
      time: newApt.time,
      notes: newApt.notes
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('📧 Email send trigger response:', data);
  })
  .catch(err => {
    console.error('❌ Failed to trigger email notification:', err);
  });

  emitStateChange();
  return newApt;
}

export function rescheduleAppointment(aptId, newDate, newTime) {
  const appointments = getStorageItem('vitacard_appointments', []);
  const aptIndex = appointments.findIndex(a => a.id === aptId);

  if (aptIndex !== -1) {
    const apt = appointments[aptIndex];
    const oldDate = apt.date;
    const oldTime = apt.time;
    
    apt.date = newDate;
    apt.time = newTime;
    appointments[aptIndex] = apt;
    setStorageItem('vitacard_appointments', appointments);

    // Send notifications
    addNotification(apt.patientId, `Appointment with ${apt.doctorName} rescheduled to ${newDate} at ${newTime}.`);
    
    const users = getStorageItem('vitacard_users', []);
    const doctorUser = users.find(u => u.role === 'doctor' && u.doctorId === parseInt(apt.doctorId, 10));
    if (doctorUser) {
      addNotification(doctorUser.id, `Rescheduled appointment: Patient ${apt.patientName} moved from ${oldDate} ${oldTime} to ${newDate} ${newTime}.`);
    }

    emitStateChange();
    return { success: true, appointment: apt };
  }
  return { success: false, error: 'Appointment not found.' };
}

export function cancelAppointment(aptId) {
  const appointments = getStorageItem('vitacard_appointments', []);
  const aptIndex = appointments.findIndex(a => a.id === aptId);

  if (aptIndex !== -1) {
    const apt = appointments[aptIndex];
    apt.status = 'cancelled';
    appointments[aptIndex] = apt;
    setStorageItem('vitacard_appointments', appointments);

    // Notifications
    addNotification(apt.patientId, `Appointment with ${apt.doctorName} on ${apt.date} has been cancelled.`);
    
    const users = getStorageItem('vitacard_users', []);
    const doctorUser = users.find(u => u.role === 'doctor' && u.doctorId === parseInt(apt.doctorId, 10));
    if (doctorUser) {
      addNotification(doctorUser.id, `Cancelled appointment: Patient ${apt.patientName} cancelled slot for ${apt.date} at ${apt.time}.`);
    }

    emitStateChange();
    return { success: true };
  }
  return { success: false, error: 'Appointment not found.' };
}

export function getNotifications(userId) {
  const notifications = getStorageItem('vitacard_notifications', []);
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function addNotification(userId, text) {
  const notifications = getStorageItem('vitacard_notifications', []);
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    text,
    timestamp: new Date().toISOString(),
    isRead: false
  };
  notifications.push(newNotif);
  setStorageItem('vitacard_notifications', notifications);
  emitStateChange();
}

export function markNotificationsAsRead(userId) {
  const notifications = getStorageItem('vitacard_notifications', []);
  let changed = false;
  notifications.forEach(n => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      changed = true;
    }
  });
  if (changed) {
    setStorageItem('vitacard_notifications', notifications);
    emitStateChange();
  }
}
