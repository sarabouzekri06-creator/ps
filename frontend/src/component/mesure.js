import React, { useState } from 'react';
import axios from "axios";

const Mesure = () => {
  // 1. ÉTAT DU FORMULAIRE (Spécifique aux Mesures)
  const [formData, setFormData] = useState({
    diseaseName: "",
    severity: "Moderate",
    startDay: "2026-03-28",
    numberOfDays: 30,
    frequencyType: "daily",
    selectedDays: [],
    dayOfMonth: 1,
    monthOfYear: "Janvier",
    instruction: "After meal",
    reminderColor: "#4e73df",
    comment: "Suivi de routine",
  });

  // --- FONCTIONS DE GESTION ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleDay = (day) => {
    const days = formData.selectedDays.includes(day)
      ? formData.selectedDays.filter(d => d !== day)
      : [...formData.selectedDays, day];
    setFormData({ ...formData, selectedDays: days });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  try {
   const response = await axios.post('http://127.0.0.1:8000/api/measures', formData, {
    headers: { 
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json', // Force Laravel à répondre en JSON propre
        'Content-Type': 'application/json'
    }
});
    alert("Mesure configurée avec succès !");
    // Optionnel : rediriger vers la liste
  } catch (error) {
    console.error("Erreur lors de l'enregistrement:", error.response);
    alert("Erreur technique lors de l'enregistrement.");
  }
};

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-white p-4 border-bottom d-flex align-items-center">
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle me-3">
                <i className="bi bi-chevron-left"></i>
              </button>
              <h3 className="mb-0 fw-bold text-dark">Noter une mesure</h3>
            </div>

            <form onSubmit={handleSubmit} className="card-body p-4 p-md-5 bg-white">
              <div className="row g-5">
                
                {/* COLONNE GAUCHE : Identification de la mesure */}
                <div className="col-md-6">
                  <div className="mb-4 p-4 rounded-4 border bg-white shadow-sm">
                    <label className="fw-bold text-dark mb-3 d-block">DÉTAILS DE LA MESURE</label>
                    
                    <input 
                      type="text" 
                      name="diseaseName" 
                      className="form-control bg-light border-0 mb-3 py-2" 
                      placeholder="Nom (ex: Tension, Glycémie, Poids...)" 
                      value={formData.diseaseName} 
                      onChange={handleChange} 
                      required
                    />
                    
                    <label className="small text-muted mb-2 d-block fw-bold text-uppercase">Importance de l'alerte</label>
                    <div className="d-flex gap-2 mb-4">
                      {[
                        { id: 'Low', label: 'Légère', color: 'success' },
                        { id: 'Moderate', label: 'Modérée', color: 'warning' },
                        { id: 'High', label: 'Sévère', color: 'danger' }
                      ].map((level) => (
                        <button
                          key={level.id}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 shadow-sm fw-bold  ${
                            formData.severity === level.id ? `btn-${level.color} text-white` : `bg-light text-muted`
                          }`}
                          onClick={() => setFormData({ ...formData, severity: level.id })}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>

                   
                </div>

                  <div className="mt-4">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Instructions / Moment</label>
                    <div className="d-flex gap-2">
                      {['Before meal', 'During meal', 'After meal'].map((inst) => (
                        <button key={inst} type="button" 
                          onClick={() => setFormData({...formData, instruction: inst})}
                          className={`btn btn-sm rounded-pill flex-grow-1 ${formData.instruction === inst ? 'btn-primary' : 'btn-outline-secondary opacity-75'}`}>
                          {inst === 'Before meal' ? 'Avant' : inst === 'During meal' ? 'Pendant' : 'Après'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLONNE DROITE : Planification */}
                <div className="col-md-6">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold text-secondary small text-uppercase">Fréquence du suivi</label>
                      <select name="frequencyType" className="form-select bg-light border-0 py-2" value={formData.frequencyType} onChange={handleChange}>
                        <option value="daily">Chaque jour</option>
                        <option value="weekly">Jours spécifiques</option>
                        <option value="monthly">Une fois par mois</option>
                      </select>
                    </div>

                    {formData.frequencyType === 'weekly' && (
                      <div className="col-12 py-2">
                        <div className="d-flex flex-wrap gap-2">
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                            <button key={day} type="button" onClick={() => toggleDay(day)}
                              className={`btn btn-sm rounded-pill px-3 ${formData.selectedDays.includes(day) ? 'btn-primary' : 'btn-outline-secondary'}`}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.frequencyType === 'monthly' && (
                      <div className="col-12">
                        <div className="row g-2">
                          <div className="col-7">
                            <select name="monthOfYear" className="form-select bg-light border-0" value={formData.monthOfYear} onChange={handleChange}>
                              {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div className="col-5">
                            <input type="number" name="dayOfMonth" className="form-control bg-light border-0 text-center" min="1" max="31" value={formData.dayOfMonth} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-sm-6 mt-3">
                      <label className="form-label fw-bold text-secondary small text-uppercase">Date de début</label>
                      <input type="date" name="startDay" className="form-control bg-light border-0" value={formData.startDay} onChange={handleChange} />
                    </div>
                    
                    <div className="col-sm-6 mt-3">
                      <label className="form-label fw-bold text-secondary small text-uppercase">Durée (jours)</label>
                      <div className="input-group bg-light rounded-3 border">
                        <button className="btn border-0 text-primary fw-bold" type="button" onClick={() => setFormData({...formData, numberOfDays: Math.max(1, formData.numberOfDays - 1)})}>-</button>
                        <input type="text" className="form-control bg-light border-0 text-center fw-bold" value={formData.numberOfDays} readOnly />
                        <button className="btn border-0 text-primary fw-bold" type="button" onClick={() => setFormData({...formData, numberOfDays: formData.numberOfDays + 1})}>+</button>
                      </div>
                    </div>

                    <div className="col-sm-12 mt-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase d-block">Couleur du rappel sur le calendrier</label>
                      <input type="color" name="reminderColor" className="form-control form-control-color w-25 border-0 bg-transparent" value={formData.reminderColor} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Notes / Commentaires</label>
                    <textarea name="comment" className="form-control bg-light border-0 rounded-3" rows="3" value={formData.comment} onChange={handleChange} placeholder="Ajoutez une note..."></textarea>
                  </div>
                </div>
              </div>

              <div className="text-center mt-5">
                <button type="submit" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg text-uppercase" style={{letterSpacing: '1px'}}>
                  Enregistrer la mesure
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mesure;