import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Insc = () => {
  // 1. États pour stocker les données du formulaire
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState(""); // Pour afficher les erreurs
  
  const navigate = useNavigate();

  // 2. Fonction de soumission
const handleRegister = async (e) => {
  e.preventDefault();
  
  try {
    const response = await axios.post("http://localhost:8000/api/register", {
      email: email,
      password: password,
      password_confirmation: confirmPass // Important pour Laravel
    });

    // On stocke le jeton de connexion (Token) dans le navigateur
    localStorage.setItem("userToken", response.data.token);
    
    alert("Compte créé avec succès !");
    navigate("/login"); // Direction le profil pour remplir le nom, l'age, etc.
  }  catch (err) {
  // On vérifie si le serveur a renvoyé une erreur précise (ex: email déjà pris)
  // Sinon, on affiche un message d'erreur général (ex: serveur éteint)
  const message = err.response?.data?.message || "Impossible de contacter le serveur. Vérifiez qu'il est lancé.";
  setError("Erreur : " + message);
  console.error(err);
}
};

  return (
    <div className="container vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-5 shadow w-50 border-0">
        <h2 className="text-center mb-4 fw-bold">S'inscrire</h2>

        {/* Affichage de l'erreur si elle existe */}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label">Nom complet</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              onChange={(e) => setNom(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              required 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Mot de passe</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Confirmer le mot de passe</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 shadow-sm py-2 mt-2">
            Créer mon compte
          </button>

          <p className="text-center mt-3">
            Déjà un compte ? <Link to={"/login"} className="text-decoration-none">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Insc;