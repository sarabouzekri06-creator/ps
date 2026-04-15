import { useState, useEffect } from "react";
import axios from "axios";

export default function Profile() {
  const [user, setUser] = useState({
    nom: "",
    prenom: "",
    email: "",
    age: "",
    maladies: "",
    notification: "" // Initialisé pour éviter le NULL en SQL
  });

  const [patientEmail, setPatientEmail] = useState("");
  const [responsable, setResponsable] = useState({ email: "", telephone: "" });
  const [showModalPatient, setShowModalPatient] = useState(false);
  const [showModalResp, setShowModalResp] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileImage, setProfileImage] = useState("https://via.placeholder.com/150");
  const [imageFile, setImageFile] = useState(null); // Pour stocker le fichier réel

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/user", config);
        const data = response.data;
        
        setUser({
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: data.email || "",
          age: data.age || "",
          maladies: data.maladies || "",
          notification: data.notification_type || "patient"
        });

        // Affichage de l'image si elle existe sur le serveur
        if (data.profile_image) {
          setProfileImage(`http://localhost:8000/storage/${data.profile_image}`);
        }

        if (data.is_profile_complete) {
          setSaved(true);
          if (data.notification_type === "patient") {
            setPatientEmail(data.contact_alerte_email || "");
          } else {
            setResponsable({ email: data.contact_alerte_email || "", telephone: "" });
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      }
    };
    if (token) loadUserData();
  }, [token]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // On garde le fichier pour l'envoi
      setProfileImage(URL.createObjectURL(file)); // Aperçu local
    }
  };

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setUser({ ...user, notification: value });
    if (value === "patient") setShowModalPatient(true);
    else setShowModalResp(true);
  };

  const savePatient = (e) => {
    e.preventDefault();
    setShowModalPatient(false);
  };

  const saveResponsable = (e) => {
    e.preventDefault();
    setShowModalResp(false);
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    
    const alerteEmail = user.notification === "patient" ? patientEmail : responsable.email;

    if (!alerteEmail) {
      alert("Veuillez compléter l'email de notification !");
      user.notification === "patient" ? setShowModalPatient(true) : setShowModalResp(true);
      return; 
    }

    // Utilisation de FormData pour envoyer l'image et les textes ensemble
    const formData = new FormData();
    formData.append("nom", user.nom);
    formData.append("prenom", user.prenom);
    formData.append("age", user.age);
    formData.append("maladies", user.maladies);
    formData.append("notificationType", user.notification);
    formData.append("contactAlerte", alerteEmail);
    
    if (imageFile) {
      formData.append("image", imageFile); // 'image' doit correspondre au $request->file('image') de Laravel
    }

    try {
      // On écrase le config pour ajouter le multipart/form-data
      const multipartConfig = {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      };

      await axios.post("http://localhost:8000/api/user/update", formData, multipartConfig);
      
      setSaved(true);
      alert("Profil enregistré avec succès !");
    } catch (error) {
      console.error("Erreur Laravel:", error.response?.data);
      alert("Erreur : " + (error.response?.data?.error_message || "Problème serveur"));
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light p-5">
      <div className="card shadow-lg p-4" style={{ width: "850px", borderRadius: "20px", border: "none" }}>
        <div className="row">
          
          <div className="col-md-4 text-center border-end pe-4 d-flex flex-column align-items-center justify-content-center">
            <div className="position-relative mb-3">
              <div 
                className="rounded-circle overflow-hidden shadow-sm border border-4 border-white" 
                style={{ width: "150px", height: "150px", backgroundColor: "#f8f9fa" }}
              >
                <img src={profileImage} className="w-100 h-100" style={{ objectFit: "cover" }} alt="Profil" />
              </div>
              <label 
                htmlFor="fileInput" 
                className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{ width: "40px", height: "40px", cursor: "pointer", border: "3px solid white" }}
              >
                <span className="text-white fw-bold fs-4">+</span>
                <input type="file" id="fileInput" className="d-none" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <h5 className="text-primary mb-1 fw-bold">{user.nom || "Nom"} {user.prenom || "Prénom"}</h5>
            <p className="text-muted small mb-3">{user.email || "email@exemple.com"}</p>
            {saved && (
              <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => setSaved(false)}>
                Modifier le profil
              </button>
            )}
          </div>

          <div className="col-md-8 ps-4">
            <h4 className="mb-4 fw-bold text-dark">{saved ? "Détails du Profil" : "Compléter les Informations"}</h4>

            {saved ? (
              <div className="animate__animated animate__fadeIn">
                <p><strong>Nom :</strong> {user.nom}</p>
                <p><strong>Prénom :</strong> {user.prenom}</p>
                <p><strong>Email :</strong> {user.email}</p>
                <p><strong>Âge :</strong> {user.age} ans</p>
                <p><strong>Maladies :</strong> {user.maladies}</p>
                <div className="p-3 bg-light border rounded-4">
                  <h6 className="fw-bold text-primary">Destinataire :</h6>
                  {user.notification === "patient" ? <p className="mb-0">Email Patient : {patientEmail}</p> : <p className="mb-0">Email responsable : {responsable.email}</p>}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAll} className="row g-3">
                <div className="col-md-6">
                  <input type="text" name="nom" value={user.nom} onChange={handleChange} className="form-control rounded-3" placeholder="Nom" required />
                </div>
                <div className="col-md-6">
                  <input type="text" name="prenom" value={user.prenom} onChange={handleChange} className="form-control rounded-3" placeholder="Prénom" required />
                </div>
                <div className="col-12">
                  <input type="email" name="email" value={user.email} onChange={handleChange} className="form-control rounded-3" placeholder="Email" required />
                </div>
                <div className="col-md-6">
                  <input type="number" name="age" value={user.age} onChange={handleChange} className="form-control rounded-3" placeholder="Âge" required min="1" />
                </div>
                <div className="col-md-6">
                  <input type="text" name="maladies" value={user.maladies} onChange={handleChange} className="form-control rounded-3" placeholder="Maladies" required />
                </div>

                <div className="col-12">
                  <p className="mb-2 fw-bold text-secondary small text-uppercase">Notifications :</p>
                  <div className="d-flex gap-4">
                    <label className="form-check-label">
                      <input type="radio" value="patient" checked={user.notification === "patient"} onChange={handleRadioChange} className="form-check-input me-2" /> 
                      Patient
                    </label>
                    <label className="form-check-label">
                      <input type="radio" value="responsable" checked={user.notification === "responsable"} onChange={handleRadioChange} className="form-check-input me-2" /> 
                      Responsable
                    </label>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <button type="submit" className="btn btn-success w-100 py-3 fw-bold shadow-sm rounded-3 text-uppercase" style={{ letterSpacing: "1px" }}>
                    ENREGISTRER LES MODIFICATIONS
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PATIENT */}
      {showModalPatient && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content border-0 shadow-lg rounded-4 p-4" onSubmit={savePatient}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Email du Patient</h5>
                <button type="button" className="btn-close" onClick={() => setShowModalPatient(false)}></button>
              </div>
              <input type="email" required className="form-control mb-3 py-2" placeholder="Email obligatoire" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} />
              <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">Valider</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESPONSABLE */}
      {showModalResp && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content border-0 shadow-lg rounded-4 p-4" onSubmit={saveResponsable}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Infos Responsable</h5>
                <button type="button" className="btn-close" onClick={() => setShowModalResp(false)}></button>
              </div>
              <input type="email" required placeholder="Email" className="form-control mb-3 py-2" value={responsable.email} onChange={(e) => setResponsable({...responsable, email: e.target.value})} />
              <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">Valider</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}