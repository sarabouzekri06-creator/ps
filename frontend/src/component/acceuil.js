import React from "react";
import { Link } from "react-router-dom";
// Assurez-vous d'avoir installé Bootstrap Icons : npm install bootstrap-icons

const Acceuil = () => {
  return (
    <div className="container-fluid p-0 bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      {/* --- NAVBAR (Ajoutée pour le professionnalisme) --- */}
     

      {/* --- SECTION HERO AMÉLIORÉE --- */}
      <section className="py-5 position-relative overflow-hidden" style={{ backgroundColor: "#fbfdff" }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            {/* Texte */}
            <div className="col-lg-6 text-center text-lg-start animate__animated animate__fadeInLeft">
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 mb-3 fw-bold border border-success border-opacity-25">
                <i className="bi bi-shield-check me-2"></i>Votre Assistant Santé Intelligent
              </span>
              <h1 className="fw-bold text-dark display-3 mb-4" style={{ letterSpacing: "-1px", lineHeight: "1.1" }}>
                Ne manquez plus jamais <span className="text-primary">une prise</span> ou <span className="text-primary">une mesure</span>.
              </h1>
              <p className="lead text-secondary mb-5 fs-5" style={{ lineHeight: "1.7" }}>
                Remember sécurise votre quotidien en automatisant le rappel de vos médicaments et le suivi de vos constantes (tension, glycémie). Enregistrez votre progrès et partagez-le facilement.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                <Link to="/login" className="btn btn-primary btn-lg rounded-pill px-5 py-3 shadow fw-bold transition-all hover-lift">
                  Commencer gratuitement <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <button className="btn btn-outline-light btn-lg rounded-pill px-4 py-3 text-secondary border-secondary-subtle fw-medium">
                  <i className="bi bi-play-circle me-2"></i>Voir démo
                </button>
              </div>
            </div>
            {/* Image/Illustration */}
            <div className="col-lg-6 text-center animate__animated animate__fadeInRight">
              <div className="position-relative d-inline-block">
                {/* Image Placeholder (remplacer par ./images/hero-health.png) */}
                <img 
                  src="/images/image.png" 
                  alt="Suivi santé intelligent" 
                  className="img-fluid position-relative z-1"
                  style={{ maxWidth: "100%", height: "auto" }} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION CHIFFRES CLÉS (Preuve de concept) --- */}
      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <div className="row g-4">
            <div className="col-6 col-md-3 border-end border-white border-opacity-25">
              <h2 className="fw-bold display-5">100%</h2>
              <p className="mb-0 opacity-75 fw-medium">Sécurisé & Privé</p>
            </div>
            <div className="col-6 col-md-3 border-end border-white border-opacity-25">
              <h2 className="fw-bold display-5">+10k</h2>
              <p className="mb-0 opacity-75 fw-medium">Utilisateurs actifs</p>
            </div>
            <div className="col-6 col-md-3 border-end border-white border-opacity-25">
              <h2 className="fw-bold display-5">24/7</h2>
              <p className="mb-0 opacity-75 fw-medium">Alertes actives</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="fw-bold display-5">98%</h2>
              <p className="mb-0 opacity-75 fw-medium">Score d'observance</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION FONCTIONNALITÉS (Services réécrits) --- */}
      <section id="services" className="container py-5 my-5">
        <div className="text-center mb-5 pb-3 animate__animated animate__fadeInUp">
          <span className="text-primary fw-bold text-uppercase small" style={{ letterSpacing: "2px" }}>Fonctionnalités</span>
          <h2 className="fw-bold text-dark display-5 mt-2">Tout pour votre tranquillité d'esprit</h2>
          <p className="text-secondary lead w-75 mx-auto mt-3">Une solution complète pour gérer votre protocole de soin et suivre vos progrès en temps réel.</p>
        </div>
        
        <div className="row g-4 justify-content-center">
          {[
            { icon: "bi-capsule text-primary", title: "Rappels de Médicaments", text: "Alertes intelligentes pour chaque prise, évitant les oublis dangereux." },
            { icon: "bi-activity text-success", title: "Suivi des Mesures", text: "Enregistrez tension, glycémie et constantes pour un suivi précis." },
            { icon: "bi-graph-up-arrow text-warning", title: "Enregistrement du Progrès", text: "Visualisez l'historique et l'impact de vos traitements sur votre santé." },
            { icon: "bi-file-earmark-pdf text-danger", title: "Rapports Exportables", text: "Générez des PDF détaillés pour faciliter le dialogue avec votre médecin." },
            { icon: "bi-box-seam text-info", title: "Gestion des Stocks", text: "Soyez alerté avant la fin de vos boîtes de médicaments." },
            { icon: "bi-people text-secondary", title: "Mode Aidant", text: "Partagez l'accès pour rassurer vos proches ou votre infirmier." }
          ].map((item, i) => (
            <div className="col-md-6 col-lg-4 animate__animated animate__fadeInUp" key={i} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 transition-all hover-lift bg-light-subtle">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-white rounded-4 p-3 shadow-sm me-3">
                    <i className={`bi ${item.icon} fs-2`}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-0">{item.title}</h5>
                </div>
                <p className="text-secondary mb-0 fw-medium fs-6">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION TÉMOIGNAGES (Social Proof) AMÉLIORÉE --- */}
      <section className="py-5 bg-light-subtle" style={{ backgroundColor: "#f8fbff" }}>
        <div className="container py-5 text-center">
          <i className="bi bi-quote text-primary opacity-25" style={{ fontSize: "6rem" }}></i>
          <h2 className="fw-bold text-dark mb-5 mt-n4">Ils nous font confiance</h2>
          <div className="w-75 mx-auto text-dark lead p-4 bg-white rounded-4 shadow-sm italic fw-medium" style={{ lineHeight: "1.8" }}>
            "Remember a changé ma vie. Je ne stresse plus à l'idée d'oublier ma tension ou mes pilules. Le rapport PDF est génial pour mon cardiologue. C'est simple, sécurisé et gratuit. Je recommande !"
          </div>
          <div className="d-flex align-items-center justify-content-center mt-4">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Utilisateur" className="rounded-circle me-3 shadow-sm" style={{ width: "60px" }} />
            <div className="text-start">
              <h6 className="fw-bold mb-0">Marie L.</h6>
              <small className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i>Utilisatrice depuis 6 mois</small>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION APPEL À L'ACTION FINAL --- */}
      <section className="container py-5 my-5 text-center bg-primary rounded-4 shadow-lg text-white animate__animated animate__pulse">
        <div className="py-4">
          <h2 className="fw-bold display-5 mb-3">Prêt à simplifier votre suivi santé ?</h2>
          <p className="lead opacity-75 w-75 mx-auto mb-5 fw-medium">Rejoignez des milliers d'utilisateurs qui gèrent sereinement leur santé au quotidien. Pas de carte bancaire requise.</p>
          <Link to="/login" className="btn btn-light btn-lg rounded-pill px-5 py-3 fw-bold text-primary shadow hover-lift">
            Créer mon compte Remember
          </Link>
        </div>
      </section>

      {/* --- FOOTER AMÉLIORÉ --- */}
      <footer className="bg-dark text-white-50 py-5 mt-5">
        <div className="container py-3">
          <div className="row g-4">
            <div className="col-md-4 mb-4 mb-md-0 text-center text-md-start">
              <Link className="navbar-brand fw-bold text-white fs-3 mb-2 d-block" to="/">
                <i className="bi bi-heart-pulse-fill me-2"></i>REMEMBER
              </Link>
              <p className="small pe-md-4">Votre partenaire de confiance pour un suivi médical rigoureux et serein au quotidien.</p>
              <div className="d-flex gap-3 justify-content-center justify-content-md-start fs-5 mt-3">
                <i className="bi bi-facebook text-white-50 hover-text-white transition-all"></i>
                <i className="bi bi-twitter-x text-white-50 hover-text-white transition-all"></i>
                <i className="bi bi-linkedin text-white-50 hover-text-white transition-all"></i>
              </div>
            </div>

            <div className="col-md-4 text-center">
              <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: "1px" }}>Liens rapides</h6>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><Link to="/" className="text-white-50 text-decoration-none hover-text-white">Accueil</Link></li>
              </ul>
            </div>

            <div className="col-md-4 text-center text-md-end">
              <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: "1px" }}>Contact</h6>
              <p className="small mb-1"><i className="bi bi-envelope me-2"></i>support@remember.health</p>
              <p className="small mb-1"><i className="bi bi-telephone me-2"></i>+212 600 000 000</p>
              <p className="small"><i className="bi bi-geo-alt me-2"></i>Casablanca, Maroc</p>
            </div>
          </div>
          
          <hr className="my-4 border-white border-opacity-10" />
          
          <div className="row small opacity-50">
            <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
              &copy; 2026 Remember Health. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Acceuil;