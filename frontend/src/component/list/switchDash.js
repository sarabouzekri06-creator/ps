import React, { useState } from 'react';

import MedicationList   from './mediList';
import MesureList from './mesureList';
import '../list.css';

const HealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('medications');

  return (
    <div className="ml-page">
      <div className="hd-tab-switcher">
        <button
          className={`hd-tab-btn ${activeTab === 'medications' ? 'hd-tab-active' : ''}`}
          onClick={() => setActiveTab('medications')}
        >
          <i className="bi bi-capsule-pill"></i> Médicaments
        </button>
        <button
          className={`hd-tab-btn ${activeTab === 'mesures' ? 'hd-tab-active' : ''}`}
          onClick={() => setActiveTab('mesures')}
        >
          <i className="bi bi-clipboard2-pulse"></i> Mesures
        </button>
      </div>

      {activeTab === 'medications' ? <MedicationList /> : <MesureList />}
    </div>
  );
};

export default HealthDashboard;