import React, { useState, useEffect } from 'react';
import './list.css';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Récupérer les données depuis Laravel au chargement
  useEffect(() => {
    const fetchMedications = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/medications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedications(response.data); // On stocke les médicaments du backend
      } catch (error) {
        console.error("Erreur lors de la récupération:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  // 2. Fonction pour basculer le statut (API Patch)
  const toggleNotification = async (id) => {
    const token = localStorage.getItem('token');
    try {
      // On prévient le backend du changement (is_active)
      await axios.patch(`http://127.0.0.1:8000/api/medications/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mise à jour locale pour l'interface
      setMedications(medications.map(med => 
        med.id === id ? { ...med, is_active: !med.is_active } : med
      ));
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  if (loading) return <div className="text-center py-5">Loading your medications...</div>;

  return (
    <div className="container-fluid py-5 medication-list-bg min-vh-100">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bold text-dark mb-1">My Medications</h2>
            <p className="text-secondary">Manage your daily intake and alerts</p>
          </div>
          <Link to={"/Medicament"} className='btn btn-primary rounded-pill px-4 shadow-sm text-white text-decoration-none'>
            <i className="bi bi-plus-lg me-2"></i>Add New
          </Link>
        </div>

        <div className="row g-4">
          {medications.length === 0 ? (
            <p className="text-center text-muted">No medications found. Click "Add New" to start.</p>
          ) : (
            medications.map((med) => (
              <div key={med.id} className="col-12 col-md-6 col-lg-4">
                <div className={`card med-card border-0 shadow-sm rounded-4 overflow-hidden ${!med.is_active ? 'disabled-med' : ''}`}>
                  
                  <div style={{ height: '6px', backgroundColor: med.is_active ? med.reminder_color : '#d1d3e2' }}></div>
                  
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        <div className="med-icon-container me-3">
                          <div className="med-placeholder">
                            <i className="bi bi-capsule text-primary fs-4"></i>
                          </div>
                        </div>
                        <div>
                          <h5 className="fw-bold mb-0 text-truncate" style={{maxWidth: '150px'}}>{med.medication_name}</h5>
                          <span className="badge bg-light text-primary border">{med.frequency_type}</span>
                        </div>
                      </div>
                      
                      <div className="form-check form-switch p-0 m-0">
                        <input 
                          className="form-check-input ms-0 custom-switch" 
                          type="checkbox" 
                          checked={med.is_active}
                          onChange={() => toggleNotification(med.id)}
                        />
                      </div>
                    </div>

                    <div className={`notification-box p-3 rounded-3 mb-3 ${!med.is_active ? 'box-off' : ''}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i className={`bi ${med.is_active ? 'bi-bell-fill text-warning' : 'bi-bell-slash text-muted'} me-2`}></i>
                          <span className="small fw-bold">{med.is_active ? 'NEXT DOSE' : 'PAUSED'}</span>
                        </div>
                        <span className={`h5 mb-0 fw-bold ${med.is_active ? 'text-primary' : 'text-muted'}`}>
                          {/* On prend l'heure de la première prise si elle existe */}
                          {med.takes && med.takes.length > 0 ? med.takes[0].take_time : '--:--'}
                        </span>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="small text-muted">Dosage</div>
                        <div className="fw-bold text-dark">
                            {med.takes && med.takes.length > 0 ? `${med.takes[0].dose} ${med.takes[0].unit}` : 'N/A'}
                        </div>
                      </div>
                      <div className="col-6 text-end">
                        <div className="small text-muted">Stock</div>
                        <div className={`fw-bold ${med.current_stock < med.low_stock_alert ? 'text-danger' : 'text-dark'}`}>
                          {med.current_stock} left
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn text-dark btn-sm border">
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-danger btn-sm px-3 flex-grow-1">X</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationList;