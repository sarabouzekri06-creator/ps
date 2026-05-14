import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import "../med.css";
import MesureService from '../services/mesureService';

const Mesure = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    diseaseName:   "",
    severity:      "Moderate",
    frequencyType: "daily",
    selectedDays:  [],
    dayOfMonth:    1,
    comment:       "",
    unit:          "",
    maxTarget:     "",
    minTarget:     "",
  });

  const [takes, setTakes]           = useState([{ take_time: "08:00", label: "Matin" }]);
  const [submitting, setSubmitting] = useState(false);

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

  const addTake    = () => setTakes([...takes, { take_time: "12:00", label: "" }]);
  const removeTake = (i) => setTakes(takes.filter((_, idx) => idx !== i));
  const updateTake = (i, field, val) => {
    const t = [...takes];
    t[i][field] = val;
    setTakes(t);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.diseaseName.trim()) return alert("Veuillez saisir le nom de la mesure.");
    setSubmitting(true);

    const payload = { ...formData, takes };

    try {
      await MesureService.create(payload);
      alert("Mesure configurée avec succès !");
      navigate('/MedicationList');
    } catch (error) {
      console.error("Erreur:", error.response);
      alert(error.response?.data?.message || "Erreur technique.");
    } finally {
      setSubmitting(false);
    }
  };

  const SEVERITY = [
    { id: 'Low',      label: 'Légère',  cls: 'btn-success' },
    { id: 'Moderate', label: 'Modérée', cls: 'btn-warning' },
    { id: 'High',     label: 'Sévère',  cls: 'btn-danger'  },
  ];

  return (
    <div className="container-fluid py-5 med-page-bg min-vh-100">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="card med-card border-0 shadow-lg rounded-4 overflow-hidden">

            {/* Header */}
            <div className="med-card-header">
              <button type="button" className="med-back-btn" onClick={() => navigate(-1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <h3>Noter une mesure</h3>
            </div>

            <form onSubmit={handleSubmit} className="card-body p-4 p-md-5 bg-white">
              <div className="row g-5">

                {/* COLONNE GAUCHE */}
                <div className="col-md-6">

                  {/* Nom */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">NOM DE LA MESURE</label>
                    <input
                      type="text"
                      name="diseaseName"
                      className="form-control form-control-lg bg-light border-0"
                      placeholder="Ex: Tension, Glycémie..."
                      value={formData.diseaseName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Unité */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">UNITÉ</label>
                    <input
                      type="text"
                      name="unit"
                      className="form-control form-control-lg bg-light border-0"
                      placeholder="Ex: mmHg, g/L, kg..."
                      value={formData.unit}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Valeurs cibles */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">VALEURS CIBLES (ALERTES)</label>
                    <div className="d-flex gap-2">
                      <div className="flex-grow-1">
                        <label className="form-label small text-muted mb-1">Valeur max</label>
                        <input
                          type="number"
                          name="maxTarget"
                          className="form-control bg-light border-0"
                          placeholder="Ex: 14"
                          value={formData.maxTarget}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <label className="form-label small text-muted mb-1">Valeur min</label>
                        <input
                          type="number"
                          name="minTarget"
                          className="form-control bg-light border-0"
                          placeholder="Ex: 8"
                          value={formData.minTarget}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <small className="text-muted">Une alerte s'affichera si la valeur dépasse ces seuils.</small>
                  </div>

                  {/* Sévérité */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">SÉVÉRITÉ</label>
                    <div className="d-flex gap-2">
                      {SEVERITY.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 flex-grow-1 fw-bold ${formData.severity === s.id ? s.cls + ' text-white' : 'bg-light text-muted'}`}
                          onClick={() => setFormData({ ...formData, severity: s.id })}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heures des mesures */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="fw-bold text-secondary small mb-0">HEURES DES MESURES</label>
                    <button type="button" className="btn btn-sm btn-primary rounded-pill shadow-sm" onClick={addTake}>
                      <i className="bi bi-plus-lg me-1"></i> Ajouter
                    </button>
                  </div>

                  {takes.map((take, i) => (
                    <div key={i} className="take-item-card mb-2">
                      <div className="d-flex gap-2 flex-grow-1 align-items-center">
                        <input
                          type="time"
                          className="form-control bg-light border-0"
                          value={take.take_time}
                          onChange={e => updateTake(i, 'take_time', e.target.value)}
                          style={{ maxWidth: 130 }}
                        />
                        <input
                          type="text"
                          className="form-control bg-light border-0"
                          placeholder="Label (ex: Matin)"
                          value={take.label}
                          onChange={e => updateTake(i, 'label', e.target.value)}
                        />
                      </div>
                      {takes.length > 1 && (
                        <button type="button" className="btn btn-link text-danger p-0 ms-2" onClick={() => removeTake(i)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* COLONNE DROITE */}
                <div className="col-md-6">
                  <div className="row g-3">

                    {/* Fréquence */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-secondary small">FRÉQUENCE DU SUIVI</label>
                      <select name="frequencyType" className="form-select bg-light border-0"
                        value={formData.frequencyType} onChange={handleChange}>
                        <option value="daily">Chaque jour</option>
                        <option value="weekly">Jours spécifiques</option>
                        <option value="monthly">Une fois par mois</option>
                        <option value="every2months">Tous les 2 mois</option>
                        <option value="quarterly">Tous les 3 mois</option>
                      </select>
                    </div>

                    {/* Jours spécifiques */}
                    {formData.frequencyType === 'weekly' && (
                      <div className="col-12 py-2">
                        <div className="d-flex flex-wrap gap-2">
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                            <button key={day} type="button" onClick={() => toggleDay(day)}
                              className={`btn btn-sm rounded-pill px-3 ${formData.selectedDays.includes(day) ? 'btn-primary' : 'btn-outline-secondary'}`}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Jour du mois */}
                    {(formData.frequencyType === 'monthly' ||
                      formData.frequencyType === 'every2months' ||
                      formData.frequencyType === 'quarterly') && (
                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary small">JOUR DE LA MESURE</label>
                        <input
                          type="number"
                          name="dayOfMonth"
                          className="form-control bg-light border-0 text-center"
                          min="1" max="31"
                          value={formData.dayOfMonth}
                          onChange={handleChange}
                          placeholder="Ex: 15"
                        />
                        <small className="text-muted">
                          {formData.frequencyType === 'monthly'     && 'La mesure sera faite ce jour, chaque mois.'}
                          {formData.frequencyType === 'every2months' && 'La mesure sera faite ce jour, tous les 2 mois.'}
                          {formData.frequencyType === 'quarterly'    && 'La mesure sera faite ce jour, tous les 3 mois.'}
                        </small>
                      </div>
                    )}
                  </div>

                  {/* Commentaire */}
                  <div className="mt-4">
                    <label className="form-label fw-bold text-secondary small">NOTES / COMMENTAIRES</label>
                    <textarea
                      name="comment"
                      className="form-control bg-light border-0"
                      rows="3"
                      placeholder="Ajoutez une note..."
                      value={formData.comment}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="text-center mt-5">
                <button type="submit" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg"
                  disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement...</>
                    : <><i className="bi bi-check-lg me-2"></i>Enregistrer la mesure</>
                  }
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