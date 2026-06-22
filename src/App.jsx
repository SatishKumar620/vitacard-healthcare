import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import DoctorsList from './components/DoctorsList';
import DoctorDetails from './components/DoctorDetails';
import HowItWorks from './components/HowItWorks';
import PremiumCare from './components/PremiumCare';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import Chat from './components/Chat';

// Authentication & Dashboard components
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

import './dashboard.css';

function App() {
  const [route, setRoute] = useState({ path: 'home', param: null });

  // Hide global loader after mount
  useEffect(() => {
    const loader = document.getElementById('global-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
      }, 800);
    }
  }, []);

  useEffect(() => {
    const parseHashRoute = () => {
      const hash = window.location.hash || '#/';
      
      if (hash.startsWith('#/doctor/')) {
        const id = hash.replace('#/doctor/', '');
        setRoute({ path: 'details', param: id });
      } else if (hash === '#/doctors') {
        setRoute({ path: 'doctors', param: null });
      } else if (hash === '#/login') {
        setRoute({ path: 'login', param: null });
      } else if (hash === '#/signup') {
        setRoute({ path: 'signup', param: null });
      } else if (hash === '#/dashboard') {
        setRoute({ path: 'dashboard', param: null });
      } else {
        setRoute({ path: 'home', param: null });
      }
      
      // Always scroll to top on route change
      window.scrollTo(0, 0);
    };

    // Parse initial route
    parseHashRoute();

    // Listen to hash changes
    window.addEventListener('hashchange', parseHashRoute);

    return () => {
      window.removeEventListener('hashchange', parseHashRoute);
    };
  }, []);

  useEffect(() => {
    // Scroll reveal observer (only run if on home page)
    if (route.path !== 'home') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, [route.path]);

  return (
    <>
      <Navbar />
      
      {route.path === 'home' && (
        <>
          <Hero />
          <Services />
          <DoctorsList viewMode="featured" />
          <HowItWorks />
          <PremiumCare />
          <Testimonials />
          <Contact />
          <CtaBanner />
        </>
      )}

      {route.path === 'doctors' && (
        <div style={{ paddingTop: '80px' }}>
          <DoctorsList viewMode="full" />
        </div>
      )}

      {route.path === 'details' && (
        <div style={{ paddingTop: '80px' }}>
          <DoctorDetails doctorId={route.param} />
        </div>
      )}

      {route.path === 'login' && (
        <Login />
      )}

      {route.path === 'signup' && (
        <Signup />
      )}

      {route.path === 'dashboard' && (
        <Dashboard />
      )}

      <Footer />
      <Chat />
    </>
  );
}

export default App;
