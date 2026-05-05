import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ModalSaisie = ({ measureId, measureName, onClose }) => {
  const [value, setValue] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // On envoie la donnée à l'API Laravel
      await axios.post('http://127.0.0.1:8000/api/measures/results', {
        measure_id: measureId,
        value: value,
        note: "Saisie rapide via notification"
      });

      toast.success(`Valeur enregistrée pour ${measureName} !`);
      onClose(); // Ferme le modal après succès
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-custom">
        <h3 className="mb-3">Noter ma mesure</h3>
        <p className="text-muted">Quelle est votre valeur pour : <strong>{measureName}</strong> ?</p>
        
        <form onSubmit={handleSave}>
          <input 
            type="number" 
            step="0.01"
            className="form-control form-control-lg mb-3 text-center"
            placeholder="0.00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            autoFocus
          />
          
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">
              Enregistrer
            </button>
            <button type="button" onClick={onClose} className="btn btn-light w-100 py-2">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalSaisie;