import React, { useState } from 'react';

const Dashboard = () => {
  const [activeDate, setActiveDate] = useState("25");

  // Simulation des données
  const allStocks = [
    { name: "Neflorine", rest: 5, total: 30, color: "#e74a3b", bg: "#fff5f5" },
    { name: "Doliprane", rest: 24, total: 30, color: "#1cc88a", bg: "#eafaf1" },
    { name: "Insuline", rest: 3, total: 10, color: "#e74a3b", bg: "#fff5f5" }
  ];

  const appointments = [
    { doctor: "Dr. Martin", specialty: "Cardiologue", date: "12 Avril", time: "14:30", icon: "hospital" },
    { doctor: "Dr. Bensaid", specialty: "Généraliste", date: "20 Avril", time: "10:00", icon: "person-badge" }
  ];

  const lowStocks = allStocks.filter(item => item.rest <= 5);

  const weekDays = [
    { day: "Lun", date: "23" }, { day: "Mar", date: "24" }, { day: "Mer", date: "25" }, 
    { day: "Jeu", date: "26" }, { day: "Ven", date: "27" }, { day: "Sam", date: "28" }, { day: "Dim", date: "29" }
  ];

  const stats = [
    { title: "Observance", val: "92%", sub: "Score hebdomadaire", icon: "graph-up-arrow", color: "#4e73df", bg: "#eef2ff" },
    { title: "Prochain", val: "12:33", sub: "Neflorine", icon: "clock-history", color: "#6f42c1", bg: "#f5f0ff" },
    { title: "Complétés", val: "2", sub: "Prises effectuées", icon: "check2-circle", color: "#1cc88a", bg: "#eafaf1" },
    { title: "Tension", val: "11/7", sub: "Dernière mesure", icon: "heart-pulse", color: "#e74a3b", bg: "#fff5f5" },
  ];

  return (
    <div className="container-fluid min-vh-100 bg-light py-4 px-xl-5 position-relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* BOUTON FLOTTANT */}
      <button 
        className="btn btn-primary rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center border-0" 
        style={{ bottom: '30px', right: '30px', width: '64px', height: '64px', zIndex: 1000, fontSize: '28px', background: 'linear-gradient(135deg, #4e73df 0%, #224abe 100%)' }}
      >
        <i className="bi bi-plus-lg text-white"></i>
      </button>

      <div className="container-fluid">
        
        {/* HEADER SECTION */}
        <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">Bonjour, Aya <span className="ms-1">👋</span></h2>
            <p className="text-muted mb-0 fw-medium">
              <i className="bi bi-calendar3 me-2"></i>Samedi 28 mars 2026
            </p>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <button className="btn btn-white shadow-sm rounded-pill px-4 py-2 border-0 fw-bold text-secondary bg-white d-flex align-items-center">
              <i className="bi bi-file-earmark-pdf me-2 text-danger fs-5"></i> Export PDF
            </button>
            <div className="position-relative">
               <input className="form-control border-0 shadow-sm ps-5 rounded-pill py-2" placeholder="Rechercher un médicament..." style={{ width: "280px" }} />
               <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            </div>
          </div>
        </header>

        {/* WEEK CALENDAR */}
        <section className="mb-5">
          <div className="card border-0 shadow-sm rounded-4 p-2 bg-white">
            <div className="d-flex justify-content-between">
              {weekDays.map((d, i) => (
                <div key={i} onClick={() => setActiveDate(d.date)} className="p-3 rounded-4 flex-grow-1 text-center transition-all" 
                  style={{ cursor: 'pointer', backgroundColor: activeDate === d.date ? '#4e73df' : 'transparent', color: activeDate === d.date ? '#fff' : '#6c757d' }}>
                  <small className="d-block text-uppercase fw-bold mb-1" style={{ fontSize: '0.65rem', opacity: activeDate === d.date ? 1 : 0.5 }}>{d.day}</small>
                  <span className="fs-5 fw-bold">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS CARDS */}
        <section className="row g-4 mb-5">
          {stats.map((card, i) => (
            <div className="col-sm-6 col-xl-3" key={i}>
              <div className="card border-0 shadow-sm h-100 rounded-4 p-4 border-start border-4" style={{ borderColor: card.color }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-3 me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: card.bg, color: card.color, width: '56px', height: '56px' }}>
                    <i className={`bi bi-${card.icon} fs-4`}></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>{card.title}</h6>
                    <h3 className="fw-bold mb-0 text-dark">{card.val}</h3>
                  </div>
                </div>
                <div className="pt-3 border-top mt-1 text-muted d-flex align-items-center">
                    <i className="bi bi-info-circle me-2 small"></i>
                    <small className="fw-medium">{card.sub}</small>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="row g-4">
          {/* COLONNE GAUCHE : ACTIONS QUOTIDIENNES */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <i className="bi bi-bell-fill text-primary me-2 fs-5"></i>
                    <h5 className="fw-bold mb-0 text-dark">Rappels du jour</h5>
                </div>
                <span className="badge text-primary rounded-pill px-3 py-2" style={{ backgroundColor: '#eef2ff' }}>
                   Mercredi {activeDate}
                </span>
              </div>
              <div className="list-group list-group-flush">
                {[
                  { name: "Doliprane", time: "08:00", status: "done", icon: "capsule", color: "#1cc88a" },
                  { name: "Insuline", time: "13:00", status: "pending", icon: "droplet-half", color: "#4e73df" },
                  { name: "Paracétamol", time: "20:00", status: "pending", icon: "capsule-pill", color: "#6f42c1" }
                ].map((notif, i) => (
                  <div key={i} className="list-group-item border-0 px-0 mb-3 d-flex align-items-center rounded-3 p-2 bg-light-hover transition-all">
                    <div className="rounded-4 p-3 me-3 d-flex align-items-center justify-content-center shadow-sm" 
                         style={{ backgroundColor: notif.status === 'done' ? '#eafaf1' : '#fff', width: '56px', height: '56px', color: notif.color }}>
                         <i className={`bi bi-${notif.icon} fs-4`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className={`mb-0 fw-bold ${notif.status === 'done' ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{notif.name}</h6>
                      <small className="text-muted fw-medium mt-1"><i className="bi bi-clock me-1"></i> {notif.time}</small>
                    </div>
                    {notif.status !== 'done' ? (
                        <button className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold border-2 d-flex align-items-center">
                            <i className="bi bi-check-lg me-1"></i> Pris
                        </button>
                    ) : (
                        <i className="bi bi-check-circle-fill text-success fs-4"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : ALERTES ET AGENDA */}
          <div className="col-lg-5 d-flex flex-column gap-4">
            {lowStocks.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-bottom border-4 border-danger">
                <div className="d-flex align-items-center mb-3 text-danger">
                  <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
                  <h5 className="fw-bold mb-0">Stocks Critiques</h5>
                </div>
                <div className="d-flex flex-column gap-3">
                  {lowStocks.map((item, i) => (
                    <div key={i} className="p-3 rounded-4 shadow-sm" style={{ backgroundColor: '#fff5f5', border: '1px solid #fee2e2' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-dark d-flex align-items-center">
                            <i className="bi bi-box-seam me-2 text-muted"></i>{item.name}
                        </span>
                        <span className="badge rounded-pill bg-danger d-flex align-items-center">
                            <i className="bi bi-graph-down me-1"></i> {item.rest} restants
                        </span>
                      </div>
                      <div className="progress bg-white" style={{ height: "6px", borderRadius: '10px' }}>
                        <div className="progress-bar bg-danger" style={{ width: `${(item.rest/item.total)*100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-check-fill text-primary me-2 fs-5"></i>
                    <h5 className="fw-bold mb-0 text-dark">Prochains RDV</h5>
                </div>
                <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-plus"></i></button>
              </div>
              <div className="d-flex flex-column gap-3">
                {appointments.map((rdv, i) => (
                  <div key={i} className="d-flex align-items-center p-3 rounded-4" style={{ backgroundColor: '#f8f9fc', border: '1px solid #edf2f7' }}>
                    <div className="rounded-circle p-3 bg-white text-primary shadow-sm me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                      <i className={`bi bi-${rdv.icon} fs-5`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-bold text-dark">{rdv.doctor}</h6>
                      <small className="text-muted fw-medium">{rdv.specialty}</small>
                    </div>
                    <div className="text-end">
                      <span className="d-block fw-bold text-primary small d-flex align-items-center justify-content-end">
                          <i className="bi bi-calendar-event me-1"></i> {rdv.date}
                      </span>
                      <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-alarm me-1"></i>{rdv.time}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;