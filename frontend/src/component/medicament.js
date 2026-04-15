import React, { useState } from 'react';
import "./med.css"
import axios from "axios";

const Medication = () => {
  // 1. ÉTAT DU FORMULAIRE (SANS MALADIE CHRONIQUE)
  const [formData, setFormData] = useState({
    medicationName: "Solgar",
    startDay: "2026-03-28",
    duration: "1 course",
    numberOfDays: 30,
    frequencyType: "daily",
    selectedDays: [],
    dayOfMonth: 1,
    monthOfYear: "Janvier",
    icon: "capsule",
    comment: "After meal",
    takes: [], 
    unit: "mg",
    instruction: "After meal",
    reminderColor: "#4e73df",
    currentStock: 30,
    lowStockAlert: 5,
    totale: [],
    medicationImage: null
  });

  const [showModal, setShowModal] = useState(false);
  const [tempTake, setTempTake] = useState({ 
    time: "09:00", 
    dose: 1, 
    type: "Pill(s)" 
  });

  // --- FONCTIONS DE GESTION ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, medicationImage: URL.createObjectURL(file) });
    }
  };

  const toggleDay = (day) => {
    const days = formData.selectedDays.includes(day)
      ? formData.selectedDays.filter(d => d !== day)
      : [...formData.selectedDays, day];
    setFormData({ ...formData, selectedDays: days });
  };

  const confirmAddTake = (closeAfter = false) => {
    if (tempTake.dose <= 0) return alert("La dose doit être supérieure à 0");
    setFormData(prev => ({
      ...prev,
      takes: [...prev.takes, { ...tempTake, id: Date.now() }]
    }));
    setTempTake({ time: "12:00", dose: 1, type: "Pill(s)" });
    if (closeAfter) setShowModal(false);
  };

  const removeTake = (id) => {
    setFormData({
      ...formData,
      takes: formData.takes.filter(t => t.id !== id)
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 1. Sécurité : Vérifier si le tableau 'takes' contient des données
  if (formData.takes.length === 0) {
    alert("Veuillez ajouter au moins une heure de prise (Add Take) avant d'enregistrer.");
    return;
  }

  const token = localStorage.getItem('token'); 

  const payload = {
      ...formData,
      frequency_details: formData.frequencyType === 'weekly' 
          ? formData.selectedDays 
          : { day: formData.dayOfMonth, month: formData.monthOfYear }
  };

  console.log("Données envoyées à Laravel :", payload); // Pour vérifier le contenu de 'takes'

  try {
      const response = await axios.post('http://127.0.0.1:8000/api/medications', payload, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
          }
      });
      alert("Médicament enregistré avec succès !");
  } catch (error) {
      console.log("Erreur détaillée:", error.response?.data);
      // Affiche l'erreur de validation précise (ex: quel champ manque)
      alert("Erreur de validation : " + JSON.stringify(error.response?.data.errors));
  }
};
  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            
            <div className="bg-white p-4 border-bottom d-flex align-items-center">
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle me-3">
                <i className="bi bi-chevron-left"></i>
              </button>
              <h3 className="mb-0 fw-bold text-dark">Add medication</h3>
            </div>

            <form onSubmit={handleSubmit} className="card-body p-4 p-md-5 bg-white">
              <div className="row g-5">
                
                {/* COLONNE GAUCHE */}
                <div className="col-md-6">

                  {/* CHAMP PHOTO */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">PHOTO DU MÉDICAMENT</label>
                    <div 
                      className="border rounded-4 d-flex align-items-center justify-content-center bg-light"
                      style={{ height: '50px', width:'100px', cursor: 'pointer', overflow: 'hidden' }}
                      onClick={() => document.getElementById('photoInput').click()}
                    >
                      {formData.medicationImage ? (
                        <img src={formData.medicationImage} alt="Preview" className="w-100 h-100" style={{objectFit: 'cover'}} />
                      ) : (
                        <i className="bi bi-camera text-muted fs-2"></i>
                      )}
                    </div>
                    <input type="file" id="photoInput" className="d-none " accept="image/*" onChange={handleImageChange} />
                  </div>

                  {/* CHAMPS MÉDICAMENTS */}
                  <div>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small">MEDICATION NAME</label>
                      <input type="text" name="medicationName" className="form-control form-control-lg bg-light border-0" value={formData.medicationName} onChange={handleChange} />
                    </div>

                    <div className="col-sm-6 mt-4">
                      <label className="form-label fw-bold text-secondary small">STOCK ACTUEL</label>
                      <input type="number" name="currentStock" className="form-control bg-light border-0" value={formData.currentStock} onChange={handleChange} />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                      <label className="fw-bold text-secondary small mb-0">DOSAGE & SCHEDULE</label>
                      <button type="button" className="btn btn-sm btn-primary rounded-pill shadow-sm" onClick={() => setShowModal(true)}>
                        <i className="bi bi-plus-lg me-1"></i> Add Take
                      </button>
                    </div>

                    {formData.takes.map((take, index) => (
                      <div key={take.id} className="p-3 mb-3 rounded-4 bg-light border d-flex justify-content-between align-items-center">
                        <div>
                          <span className="badge bg-primary rounded-pill me-2">Take {index + 1}</span>
                          <span className="fw-bold">{take.time}</span> — <span className="text-muted">{take.dose} {take.type}</span>
                        </div>
                        <button type="button" onClick={() => removeTake(take.id)} className="btn btn-link text-danger p-0"><i className="bi bi-trash"></i></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLONNE DROITE */}
                <div className="col-md-6">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold text-secondary small">FREQUENCY</label>
                      <select name="frequencyType" className="form-select bg-light border-0" value={formData.frequencyType} onChange={handleChange}>
                        <option value="daily">Every day</option>
                        <option value="weekly">Specific days (Weekly)</option>
                        <option value="monthly">Monthly</option>
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
                      <label className="form-label fw-bold text-secondary small">START DAY</label>
                      <input type="date" name="startDay" className="form-control bg-light border-0" value={formData.startDay} onChange={handleChange} />
                    </div>
                    
                    <div className="col-sm-6 mt-3">
                      <label className="form-label fw-bold text-secondary small">NUMBER OF DAYS</label>
                      <div className="input-group bg-light rounded-3 border">
                        <button className="btn border-0 text-primary fw-bold" type="button" onClick={() => setFormData({...formData, numberOfDays: Math.max(1, formData.numberOfDays - 1)})}>-</button>
                        <input type="text" className="form-control bg-light border-0 text-center fw-bold" value={formData.numberOfDays} readOnly />
                        <button className="btn border-0 text-primary fw-bold" type="button" onClick={() => setFormData({...formData, numberOfDays: formData.numberOfDays + 1})}>+</button>
                      </div>
                    </div>

                    <div className="col-sm-6 mt-4">
                      <label className="form-label fw-bold text-secondary small">COULEUR RAPPEL</label>
                      <input type="color" name="reminderColor" className="form-control form-control-color w-50 border-0 bg-transparent" value={formData.reminderColor} onChange={handleChange} />
                    </div>

                    <div className="col-md-6 mt-4">
                      <label className="form-label fw-bold text-secondary small">INSTRUCTIONS</label>
                      <div className="d-flex gap-2">
                        {['Before meal', 'During meal', 'After meal'].map((inst) => (
                          <button key={inst} type="button" 
                            onClick={() => setFormData({...formData, instruction: inst})}
                            className={`btn btn-sm rounded-pill flex-grow-1 ${formData.instruction === inst ? 'btn-dark' : 'btn-outline-secondary opacity-75'}`}>
                            {inst === 'Before meal' ? 'Avant' : inst === 'During meal' ? 'Pendant' : 'Après'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="form-label fw-bold text-secondary small">COMMENT</label>
                    <textarea name="comment" className="form-control bg-light border-0" rows="2" value={formData.comment} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>

              <div className="text-center mt-5">
                <button type="submit" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg">Save Medication</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- MODALE D'AJOUT --- */}
      {showModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-0 p-4 pb-0">
                  <h5 className="fw-bold m-0 text-primary">Nouvelle Prise</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="small text-muted mb-1 fw-bold">Heure</label>
                      <input type="time" className="form-control bg-light border-0" value={tempTake.time} onChange={(e) => setTempTake({...tempTake, time: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="small text-muted mb-1 fw-bold">Dose</label>
                      <div className="input-group bg-light rounded-3 border">
                        <button type="button" className="btn border-0 text-primary" onClick={() => setTempTake({...tempTake, dose: Math.max(0, tempTake.dose - 0.25)})}>-</button>
                        <input type="text" className="form-control bg-light border-0 text-center fw-bold" value={tempTake.dose} readOnly />
                        <button type="button" className="btn border-0 text-primary" onClick={() => setTempTake({...tempTake, dose: tempTake.dose + 0.25})}>+</button>
                      </div>
                    </div>
                    
                    <div className="col-12 mt-3 text-start">
                      <label className="small text-muted mb-2 d-block fw-bold text-uppercase">Unité de mesure</label>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {['Pills', 'mg', 'ml', 'Drops'].map((u) => (
                          <button
                            key={u}
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 shadow-sm ${
                              tempTake.type === u 
                                ? 'btn-primary border-primary' 
                                : 'btn-outline-secondary border-opacity-25 text-muted'
                            }`}
                            onClick={() => setTempTake({ ...tempTake, type: u })}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-12 text-start">
                      <label className="small text-muted mb-1 fw-bold">Forme</label>
                      <select className="form-select bg-light border-0" value={tempTake.type} onChange={(e) => setTempTake({...tempTake, type: e.target.value})}>
                        <option>Pill(s)</option>
                        <option>Injection</option>
                        <option>Cuillère</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 d-flex gap-2">
                  <button type="button" className="btn btn-outline-primary rounded-pill flex-grow-1 fw-bold" onClick={() => confirmAddTake(false)}>
                    <i className="bi bi-plus-lg me-1"></i> Autre
                  </button>
                  <button type="button" className="btn btn-primary rounded-pill flex-grow-1 fw-bold" onClick={() => confirmAddTake(true)}>Terminer</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowModal(false)}></div>
        </>
      )}
    </div>
  );
};

export default Medication;