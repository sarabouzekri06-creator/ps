import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://localhost:8000/api/login", {
      email: email,
      password: password
    });

    // TRÈS IMPORTANT : Stocker le token pour les futures requêtes
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      // Rediriger vers le profil
      window.location.href = "/profile"; 
    }
  } catch (error) {
    console.error("Erreur de connexion", error);
  }
};

  return (
    // Utilisation de min-vh-100 pour s'assurer que le fond couvre tout même si le contenu dépasse
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ backgroundColor: "#f4f7fe" }}>
      
      {/* Modification : maxWidth augmenté à 1150px et suppression du w-75 pour laisser le max-width gérer */}
      <div className="row w-100 shadow-lg border-0 bg-white rounded-4 overflow-hidden mx-2" style={{ maxWidth: "1150px" }}>

        {/* CÔTÉ GAUCHE : IMAGE PLUS LARGE */}
        <div
          className="col-md-6 d-none d-md-flex flex-column justify-content-end p-5 position-relative text-white"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.85)), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "650px", // Hauteur augmentée pour une carte plus imposante
          }}
        >
          <div className="position-relative mb-4">
            <h1 className="fw-bold display-4 mb-3" style={{ letterSpacing: "-1.5px" }}>REMEMBER</h1>
            <p className="lead fs-4 opacity-90" style={{ lineHeight: "1.6" }}>
              Simplifiez la gestion de vos traitements. <br/>
              Votre santé mérite une attention de chaque instant.
            </p>
          </div>
        </div>

        {/* CÔTÉ DROIT : FORMULAIRE PLUS AÉRÉ */}
        <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center bg-white">
          <div className="mb-5">
            <h2 className="fw-bold text-dark display-6 mb-2">Welcome Back</h2>
            <p className="text-muted fs-5">Heureux de vous revoir !</p>
          </div>

          {error && (
            <div className="alert alert-danger border-0 rounded-3 py-3 d-flex align-items-center mb-4 shadow-sm">
              <i className="bi bi-exclamation-circle-fill me-3 fs-5"></i>
              <span className="fw-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-100">
            <div className="mb-4">
              <label className="form-label small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: "1px" }}>Email Address</label>
              <input
                type="email"
                className="form-control form-control-lg border-0 bg-light rounded-3 shadow-none"
                placeholder="nom@exemple.com"
                required
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: "15px 20px", fontSize: "1.1rem" }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: "1px" }}>Password</label>
              <input
                type="password"
                className="form-control form-control-lg border-0 bg-light rounded-3 shadow-none"
                placeholder="Votre mot de passe"
                required
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: "15px 20px", fontSize: "1.1rem" }}
              />
            </div>

            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-primary btn-lg rounded-3 fw-bold shadow transition-all border-0 py-3"
                      style={{ background: "linear-gradient(45deg, #0d6efd, #0b5ed7)", fontSize: "1.1rem" }}>
                Accéder à mon espace
              </button>
            </div>

            <div className="text-center mt-5 pt-4 border-top">
              <p className="text-muted">
                Nouveau sur Remember ?{" "}
                <Link to={'/inscrire'} className="text-primary text-decoration-none fw-bold ms-2 px-2 py-1 rounded hover-bg-light">
                  Créer un compte
                </Link>
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Login;