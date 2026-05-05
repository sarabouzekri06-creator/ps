import React, { useState, useEffect } from 'react';
import "./med.css"
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const EditMedication = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    medicationName:      "",
    frequencyType:       "daily",
    selectedDays:        [],
    dayOfMonth:          1,
    icon:                "capsule",
    comment:             "",
    takes:               [],
    unit:                "mg",
    currentStock:        0,
    medicationImage:     null,
    medicationImageFile: null,
    isTemporary:         false,
    numberOfDays:        7,
  });

  const [showModal,   setShowModal]   = useState(false);
  const [editingTake, setEditingTake] = useState(null);
  const [tempTake,    setTempTake]    = useState({ time: "09:00", dose: 1, type: "Pill(s)" });

  // ── Charger le médicament ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://127.0.0.1:8000/api/medications/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(({ data }) => {
        const med = data.data ?? data;

        let selectedDays = [];
        let dayOfMonth   = 1;

        if (med.frequency_type === 'weekly' && Array.isArray(med.frequency_details)) {
          selectedDays = med.frequency_details;
        } else if (med.frequency_type === 'monthly' && med.frequency_details) {
          const details = typeof med.frequency_details === 'string'
            ? JSON.parse(med.frequency_details)
            : med.frequency_details;
          dayOfMonth = details.day ?? 1;
        }

        const isTemporary = med.number_of_days < 36500;

        setFormData({
          medicationName:      med.medication_name  ?? "",
          frequencyType:       med.frequency_type   ?? "daily",
          selectedDays,
          dayOfMonth,
          icon:                med.icon             ?? "capsule",
          comment:             med.comment          ?? "",
          takes: (med.takes ?? []).map(t => ({
            id:   t.id,
            time: t.take_time ?? t.time ?? "08:00",
            dose: t.dose ?? 1,
            type: t.unit ?? t.type ?? "Pill(s)",
          })),
          unit:                med.unit             ?? "mg",
          currentStock:        med.current_stock    ?? 0,
          medicationImage:     med.medication_image
            ? `http://127.0.0.1:8000/storage/${med.medication_image}`
            : null,
          medicationImageFile: null,
          isTemporary,
          numberOfDays:        isTemporary ? med.number_of_days : 7,
        });
      })
      .catch(err => {
        console.error(err);
        alert("Impossible de charger le médicament.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        medicationImage:     URL.createObjectURL(file),
        medicationImageFile: file,
      });
    }
  };

  const toggleDay = (day) => {
    const days = formData.selectedDays.includes(day)
      ? formData.selectedDays.filter(d => d !== day)
      : [...formData.selectedDays, day];
    setFormData({ ...formData, selectedDays: days });
  };

  // ── Modal prises ──
  const openAddTake = () => {
    setEditingTake(null);
    setTempTake({ time: "09:00", dose: 1, type: "Pill(s)" });
    setShowModal(true);
  };

  const openEditTake = (take) => {
    setEditingTake(take.id);
    setTempTake({ time: take.time, dose: take.dose, type: take.type });
    setShowModal(true);
  };

  const confirmTake = (closeAfter = false) => {
    if (tempTake.dose <= 0) return alert("La dose doit être supérieure à 0");
    if (editingTake !== null) {
      setFormData(prev => ({
        ...prev,
        takes: prev.takes.map(t => t.id === editingTake ? { ...t, ...tempTake } : t),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        takes: [...prev.takes, { ...tempTake, id: null }],
      }));
    }
    setTempTake({ time: "12:00", dose: 1, type: "Pill(s)" });
    setEditingTake(null);
    if (closeAfter) setShowModal(false);
  };

  const removeTake = (id) => {
    setFormData({ ...formData, takes: formData.takes.filter(t => t.id !== id) });
  };

  // ── Soumettre ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicationName.trim()) return alert("Veuillez saisir le nom du médicament.");
    if (formData.takes.length === 0)     return alert("Veuillez ajouter au moins une prise.");

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const form  = new FormData();

    form.append('_method',         'PUT');
    form.append('medication_name', formData.medicationName);
    form.append('start_day',       new Date().toISOString().split('T')[0]);
    form.append('number_of_days',  formData.isTemporary ? formData.numberOfDays : 36500);
    form.append('frequency_type',  formData.frequencyType);
    form.append('unit',            formData.unit);
    form.append('current_stock',   formData.currentStock);
    form.append('comment',         formData.comment);

    const freqDetails = formData.frequencyType === 'weekly'
      ? formData.selectedDays
      : { day: formData.dayOfMonth };
    form.append('frequency_details', JSON.stringify(freqDetails));

    if (formData.medicationImageFile) {
      form.append('medication_image', formData.medicationImageFile);
    }

    form.append('takes', JSON.stringify(
      formData.takes.map(t => ({
        id:        t.id   ?? null,
        take_time: t.time,
        dose:      t.dose,
        unit:      t.type,
      }))
    ));

    try {
      await axios.post(`http://127.0.0.1:8000/api/medications/${id}`, form, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      alert("Médicament mis à jour avec succès !");
      navigate('/MedicationList');
    } catch (error) {
      console.log("Erreur détaillée:", error.response?.data);
      alert("Erreur : " + JSON.stringify(error.response?.data?.errors ?? error.response?.data?.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="container-fluid py-5 med-page-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Chargement du médicament...</p>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-5 med-page-bg min-vh-100">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="card med-card border-0 shadow-lg rounded-4 overflow-hidden">

            <div className="med-card-header">
              <button type="button" className="med-back-btn" onClick={() => navigate(-1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <h3>Edit medication</h3>
            </div>

            <form onSubmit={handleSubmit} className="card-body p-4 p-md-5 bg-white">
              <div className="row g-5">

                {/* ── COLONNE GAUCHE ── */}
                <div className="col-md-6">

                  {/* Photo */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">PHOTO DU MÉDICAMENT</label>
                    <div
                      className="border rounded-4 d-flex align-items-center justify-content-center med-photo-box"
                      onClick={() => document.getElementById('photoInput').click()}>
                      {formData.medicationImage ? (
                        <img src={formData.medicationImage} alt="Preview" className="w-100 h-100"
                          style={{ objectFit: 'cover', borderRadius: 14 }} />
                      ) : (
                        <i className="bi bi-camera text-muted fs-4"></i>
                      )}
                    </div>
                    <input type="file" id="photoInput" className="d-none" accept="image/*" onChange={handleImageChange} />
                  </div>

                  {/* Nom */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">MEDICATION NAME</label>
                    <input type="text" name="medicationName"
                      className="form-control form-control-lg bg-light border-0"
                      placeholder="Ex: Metformine, Ramipril..."
                      value={formData.medicationName} onChange={handleChange} required />
                  </div>

                  {/* Stock */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">STOCK ACTUEL</label>
                    <input type="number" name="currentStock"
                      className="form-control bg-light border-0"
                      value={formData.currentStock} onChange={handleChange} />
                  </div>

                  {/* Prises */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="fw-bold text-secondary small mb-0">DOSAGE & SCHEDULE</label>
                    <button type="button" className="btn btn-sm btn-primary rounded-pill shadow-sm" onClick={openAddTake}>
                      <i className="bi bi-plus-lg me-1"></i> Add Take
                    </button>
                  </div>

                  {formData.takes.length === 0 && (
                    <div className="text-center py-3 text-muted small border rounded-3 mb-3" style={{ borderStyle: 'dashed' }}>
                      Aucune prise ajoutée
                    </div>
                  )}

                  {formData.takes.map((take, index) => (
                    <div key={take.id ?? index} className="take-item-card">
                      <div>
                        <span className="badge bg-primary rounded-pill me-2">Take {index + 1}</span>
                        <span className="fw-bold">{take.time}</span>
                        {' — '}
                        <span className="text-muted">{take.dose} {take.type}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-link text-primary p-0" onClick={() => openEditTake(take)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeTake(take.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── COLONNE DROITE ── */}
                <div className="col-md-6">
                  <div className="row g-3">

                    {/* Type de traitement */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-secondary small">TYPE DE TRAITEMENT</label>
                      <div className="d-flex gap-2">
                        <button type="button"
                          className={`btn rounded-pill flex-grow-1 fw-bold ${!formData.isTemporary ? 'btn-primary text-white' : 'bg-light text-muted'}`}
                          onClick={() => setFormData({ ...formData, isTemporary: false })}>
                          <i className="bi bi-infinity me-2" />À vie
                        </button>
                        <button type="button"
                          className={`btn rounded-pill flex-grow-1 fw-bold ${formData.isTemporary ? 'btn-warning text-white' : 'bg-light text-muted'}`}
                          onClick={() => setFormData({ ...formData, isTemporary: true })}>
                          <i className="bi bi-calendar-range me-2" />Temporaire
                        </button>
                      </div>
                    </div>

                    {/* Durée — seulement si temporaire */}
                    {formData.isTemporary && (
                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary small">DURÉE (JOURS)</label>
                        <div className="input-group bg-light rounded-3 border">
                          <button className="btn border-0 text-primary fw-bold" type="button"
                            onClick={() => setFormData({ ...formData, numberOfDays: Math.max(1, formData.numberOfDays - 1) })}>-</button>
                          <input type="text" className="form-control bg-light border-0 text-center fw-bold"
                            value={formData.numberOfDays} readOnly />
                          <button className="btn border-0 text-primary fw-bold" type="button"
                            onClick={() => setFormData({ ...formData, numberOfDays: formData.numberOfDays + 1 })}>+</button>
                        </div>
                        <small className="text-muted">Ex : antibiotique 7 jours, cortisone 10 jours...</small>
                      </div>
                    )}

                    {/* Fréquence */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-secondary small">FREQUENCY</label>
                      <select name="frequencyType" className="form-select bg-light border-0"
                        value={formData.frequencyType} onChange={handleChange}>
                        <option value="daily">Every day</option>
                        <option value="weekly">Specific days (Weekly)</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Jours spécifiques */}
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

                    {/* Jour du mois */}
                    {formData.frequencyType === 'monthly' && (
                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary small">JOUR DE LA PRISE</label>
                        <input type="number" name="dayOfMonth"
                          className="form-control bg-light border-0 text-center"
                          min="1" max="31"
                          value={formData.dayOfMonth} onChange={handleChange}
                          placeholder="Ex: 15" />
                        <small className="text-muted">La prise sera effectuée ce jour, chaque mois.</small>
                      </div>
                    )}
                  </div>

                  {/* Commentaire / Instruction */}
                  <div className="mt-4">
                    <label className="form-label fw-bold text-secondary small">COMMENTAIRE / INSTRUCTION</label>
                    <textarea name="comment" className="form-control bg-light border-0" rows="3"
                      placeholder="Ex: Avec repas, avaler avec un grand verre d'eau..."
                      value={formData.comment} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="text-center mt-5">
                <button type="submit" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg" disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement...</>
                    : <><i className="bi bi-check-lg me-2"></i>Update Medication</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Modal Add/Edit Take ── */}
      {showModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-0 p-4 pb-0">
                  <h5 className="fw-bold m-0 text-primary">
                    {editingTake !== null ? 'Modifier la prise' : 'Nouvelle Prise'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="small text-muted mb-1 fw-bold">Heure</label>
                      <input type="time" className="form-control bg-light border-0"
                        value={tempTake.time}
                        onChange={(e) => setTempTake({ ...tempTake, time: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="small text-muted mb-1 fw-bold">Dose</label>
                      <div className="input-group bg-light rounded-3 border">
                        <button type="button" className="btn border-0 text-primary"
                          onClick={() => setTempTake({ ...tempTake, dose: Math.max(0, tempTake.dose - 0.25) })}>-</button>
                        <input type="text" className="form-control bg-light border-0 text-center fw-bold"
                          value={tempTake.dose} readOnly />
                        <button type="button" className="btn border-0 text-primary"
                          onClick={() => setTempTake({ ...tempTake, dose: tempTake.dose + 0.25 })}>+</button>
                      </div>
                    </div>
                    <div className="col-12 mt-3">
                      <label className="small text-muted mb-2 d-block fw-bold text-uppercase">Unité de mesure</label>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {['Pills', 'mg', 'ml', 'Drops'].map((u) => (
                          <button key={u} type="button"
                            className={`btn btn-sm rounded-pill px-3 shadow-sm ${tempTake.type === u ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTempTake({ ...tempTake, type: u })}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="small text-muted mb-1 fw-bold">Forme</label>
                      <select className="form-select bg-light border-0" value={tempTake.type}
                        onChange={(e) => setTempTake({ ...tempTake, type: e.target.value })}>
                        <option>Pill(s)</option>
                        <option>Injection</option>
                        <option>Cuillère</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 d-flex gap-2">
                  {editingTake === null && (
                    <button type="button" className="btn btn-outline-primary rounded-pill flex-grow-1 fw-bold"
                      onClick={() => confirmTake(false)}>
                      <i className="bi bi-plus-lg me-1"></i> Autre
                    </button>
                  )}
                  <button type="button" className="btn btn-primary rounded-pill flex-grow-1 fw-bold"
                    onClick={() => confirmTake(true)}>
                    {editingTake !== null ? 'Mettre à jour' : 'Terminer'}
                  </button>
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

export default EditMedication;