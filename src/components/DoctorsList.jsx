import React, { useState, useMemo } from 'react';
import doctorsData from '../db/doctors.json';

export default function DoctorsList({ viewMode = 'featured' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  const isFullView = viewMode === 'full';

  // Initial 8 doctors to show on the landing page featured section
  const featuredDoctors = useMemo(() => {
    return doctorsData.slice(0, 8);
  }, []);

  // Unique specialties and cities for filters in full view
  const specialties = useMemo(() => {
    const list = new Set(doctorsData.map(d => d.specialization).filter(Boolean));
    return ['All', ...Array.from(list).sort()];
  }, []);

  const cities = useMemo(() => {
    const list = new Set(doctorsData.map(d => d.city).filter(Boolean));
    return ['All', ...Array.from(list).sort()];
  }, []);

  // Filtered doctors based on search queries
  const filteredDoctors = useMemo(() => {
    if (!isFullView) return [];
    return doctorsData.filter(doc => {
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = selectedSpecialty === 'All' || doc.specialization === selectedSpecialty;
      const matchesCity = selectedCity === 'All' || doc.city === selectedCity;

      return matchesSearch && matchesSpecialty && matchesCity;
    });
  }, [isFullView, searchQuery, selectedSpecialty, selectedCity]);

  // Pagination configuration: 15 cards per page
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  const paginatedDoctors = useMemo(() => {
    if (!isFullView) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(startIndex, startIndex + itemsPerPage);
  }, [isFullView, currentPage, filteredDoctors]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCardClick = (s_no) => {
    window.location.hash = `#/doctor/${s_no}`;
  };

  return (
    <section id="doctors-list-section" className={`doctors-section ${isFullView ? 'full-directory-view' : ''}`}>
      <div className="doctors-container">
        {!isFullView ? (
          /* FEATURED MODE (exactly 8 cards for landing page) */
          <>
            <p className="doctors-eyebrow">Clinic Network</p>
            <h2>Our Certified Practitioners</h2>
            <p className="doctors-sub">
              Connect directly with 300+ private doctors, general physicians, and specialists across our trusted network.
            </p>

            <div className="doctors-grid">
              {featuredDoctors.map((doc) => (
                <div 
                  key={doc.s_no} 
                  className="doctor-card reveal visible"
                  onClick={() => handleCardClick(doc.s_no)}
                >
                  <div className="doctor-avatar">
                    <span className="avatar-initials">
                      {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                    <span className="status-indicator"></span>
                  </div>
                  <div className="doctor-info">
                    <span className="specialty-badge">{doc.specialization || 'General'}</span>
                    <h3>{doc.name}</h3>
                    <p className="clinic-name">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 18H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V8h10v4zm-3-6h-4v2h4V6z"/>
                      </svg>
                      {doc.clinic}
                    </p>
                    <p className="location">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      {doc.address}, {doc.city}
                    </p>
                  </div>
                  <div className="doctor-card-footer">
                    <span className="source-tag">{doc.source}</span>
                    <button className="view-details-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(doc.s_no); }}>View Details</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="doctors-actions">
              <a href="#/doctors" className="btn-more-services">
                More Services (300+ Doctors)
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </a>
            </div>
          </>
        ) : (
          /* FULL DIRECTORY MODE (search, filter, 15-card pagination on next page) */
          <div className="expanded-doctors-panel">
            <p className="doctors-eyebrow">VitaCard Network</p>
            <h2>Search Clinic Directory</h2>
            <p className="doctors-sub">Browse all 313 registered private practitioners, clinical specialists, and diagnostics centres.</p>
            
            <div className="filters-container">
              <div className="search-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search doctor name, specialty, clinic, address..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>&times;</button>
                )}
              </div>

              <div className="filter-dropdowns">
                <div className="select-wrapper">
                  <select 
                    value={selectedSpecialty} 
                    onChange={(e) => {
                      setSelectedSpecialty(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All Specializations</option>
                    {specialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select 
                    value={selectedCity} 
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {paginatedDoctors.length > 0 ? (
              <>
                <div className="doctors-grid">
                  {paginatedDoctors.map((doc) => (
                    <div 
                      key={doc.s_no} 
                      className="doctor-card expanded-card"
                      onClick={() => handleCardClick(doc.s_no)}
                    >
                      <div className="doctor-avatar">
                        <span className="avatar-initials">
                          {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="status-indicator"></span>
                      </div>
                      <div className="doctor-info">
                        <span className="specialty-badge">{doc.specialization || 'General'}</span>
                        <h3>{doc.name}</h3>
                        <p className="clinic-name">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 18H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V8h10v4zm-3-6h-4v2h4V6z"/>
                          </svg>
                          {doc.clinic}
                        </p>
                        <p className="location">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          {doc.address}, {doc.city}
                        </p>
                      </div>
                      <div className="doctor-card-footer">
                        <span className="source-tag">{doc.source}</span>
                        <button className="view-details-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(doc.s_no); }}>View Details</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <button 
                      className="pagination-btn prev-btn" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      Prev
                    </button>
                    
                    <div className="pagination-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = currentPage;
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        // Fallback edge case
                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      className="pagination-btn next-btn" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="results-count">
                  Showing {Math.min(filteredDoctors.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredDoctors.length, currentPage * itemsPerPage)} of {filteredDoctors.length} results
                </div>
              </>
            ) : (
              <div className="no-results">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--g-emerald)" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <h3>No practitioners found</h3>
                <p>Try refining your search terms or resetting the specialization/city filters.</p>
                <button className="reset-filters-btn" onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); setSelectedCity('All'); }}>Reset All Filters</button>
              </div>
            )}

            <div className="doctors-actions">
              <a href="#/" className="btn-close-services">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
