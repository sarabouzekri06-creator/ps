import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './mesure.css';

const MesureDashboard = () => {
  const [viewMode, setViewMode] = useState('Semaine');
  const [activeTab, setActiveTab] = useState(1);
  
  const nextNotification = {
    time: "22:00",
    label: "Mesure de soir",
    remaining: "4h 45min"
  };

  const [mesuresData] = useState([
    {
      id: 1,
      name: "Glycémie à jeun",
      currentValue: 1.15,
      unit: "g/L",
      color: "#4e73df",
      maxTarget: 1.10,
      history: [
        { day: '28/03', time: '19:00', valeur: 1.22, note: "Dîner riche" },
        { day: '28/03', time: '12:00', valeur: 1.05, note: "Repos" },
        { day: '28/03', time: '08:10', valeur: 1.15, note: "Écart alimentaire" },
        { day: '27/03', time: '09:00', valeur: 1.18, note: "Stress" },
        { day: '26/03', time: '08:00', valeur: 1.02, note: "Normal" },
        { day: '25/03', time: '08:30', valeur: 1.30, note: "Écart alimentaire" },
        { day: '24/03', time: '07:45', valeur: 0.88, note: "Sport" },
        { day: '21/03', time: '08:00', valeur: 1.40, note: "Ancienne donnée" },
      ]
    },
    {
      id: 2,
      name: "Tension Artérielle",
      currentValue: 13.5,
      unit: "mmHg",
      color: "#e74a3b",
      maxTarget: 14.0,
      history: [
        { day: '28/03', time: '18:00', valeur: 13.8, note: "Soir" },
        { day: '28/03', time: '10:00', valeur: 13.5, note: "Matin" },
        { day: '27/03', time: '10:00', valeur: 14.2, note: "Fatigue" },
        { day: '26/03', time: '10:00', valeur: 12.8, note: "Repos" },
      ]
    }
  ]);

  const selectedMesure = mesuresData.find(m => m.id === activeTab);

  // LOGIQUE DE FILTRAGE
  const allHistoryChronologique = [...selectedMesure.history].reverse();
  const chartData = viewMode === 'Semaine' ? allHistoryChronologique.slice(-7) : allHistoryChronologique.slice(-30);
  
  // On filtre les mesures du jour (28/03 ici pour l'exemple)
  const todayData = selectedMesure.history.filter(h => h.day === '28/03').reverse();
  
  const moyenneVal = (chartData.reduce((acc, curr) => acc + curr.valeur, 0) / (chartData.length || 1)).toFixed(2);
  const alertes = chartData.filter(h => h.valeur > selectedMesure.maxTarget);

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        
        {/* HEADER */}
        <header className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold text-dark mb-0">Rapport de Santé</h2>
            <p className="text-secondary small">Dimanche 29 Mars 2026</p>
          </div>
          <div className="bg-white shadow-sm rounded-pill px-4 py-2 fw-bold text-primary border">
             <i className="bi bi-calendar3 me-2"></i> Mars 2026
          </div>
        </header>

        {/* SÉLECTEUR DE TYPE DE MESURE */}
        <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
          {mesuresData.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`btn rounded-4 px-4 py-3 shadow-sm border-0 transition-all ${activeTab === m.id ? 'bg-primary text-white' : 'bg-white text-dark'}`}
              style={{ minWidth: '180px', textAlign: 'left' }}
            >
              <small className={`d-block mb-1 ${activeTab === m.id ? 'text-white-50' : 'text-muted'}`}>Suivi de</small>
              <div className="fw-bold">{m.name}</div>
            </button>
          ))}
        </div>

        {/* 1. TIMELINE DU JOUR (RÉINSTALLÉE) */}
        <section className="mb-4">
          <h6 className="text-uppercase text-muted small fw-bold mb-3">Mesures d'aujourd'hui ({selectedMesure.unit})</h6>
          <div className="d-flex gap-3 overflow-auto pb-2">
            {todayData.map((m, i) => (
              <div key={i} className="card border-0 shadow-sm rounded-4 p-3 text-center" style={{ minWidth: '130px' }}>
                <span className="text-muted small d-block mb-1">{m.time}</span>
                <h4 className="fw-bold mb-0" style={{color: m.valeur > selectedMesure.maxTarget ? '#dc3545' : selectedMesure.color}}>
                  {m.valeur}
                </h4>
              </div>
            ))}
            {/* PROCHAIN RAPPEL */}
            <div className="card border-secondary border-opacity-25 bg-white shadow-none rounded-4 p-3 text-center" style={{ minWidth: '130px', borderStyle: 'dashed', borderWidth: '2px' }}>
              <span className="text-muted small d-block mb-1 fw-bold">{nextNotification.time}</span>
              <span className="text-muted fw-bold small">À venir</span>
            </div>
          </div>
        </section>

        {/* 2. GRAPHE D'ÉVOLUTION */}
        <section className="mb-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-dark">Évolution : {selectedMesure.name}</h5>
              <div className="bg-light p-1 rounded-pill border">
                {['Semaine', 'Mois'].map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`btn btn-sm rounded-pill px-3 border-0 ${viewMode === mode ? 'bg-white shadow-sm fw-bold' : 'text-muted'}`}>{mode}</button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip />
                  <ReferenceLine y={selectedMesure.maxTarget} stroke="#ff4d4f" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="valeur" stroke={selectedMesure.color} strokeWidth={3} fillOpacity={0.1} fill={selectedMesure.color} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="row g-4">
          {/* 3. DÉTAILS DES PICS */}
          <div className="col-md-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4">Alertes {viewMode}</h5>
              <div className="custom-list-scroll pe-2" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {alertes.length > 0 ? alertes.slice().reverse().map((item, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center p-3 mb-2 rounded-3 bg-white border">
                    <div className="d-flex align-items-center">
                      <span className="badge rounded-pill px-2 py-1 me-3" style={{backgroundColor: selectedMesure.color, fontSize: '1rem'}}>{item.valeur}</span>
                      <span className="fw-bold text-dark">{item.note}</span>
                    </div>
                    <div className="text-end text-muted small">{item.time}<br/>{item.day}</div>
                  </div>
                )) : <div className="text-center py-5 text-muted">Aucune alerte sur cette période.</div>}
              </div>
            </div>
          </div>

          {/* 4. STATISTIQUES CLÉS */}
          <div className="col-md-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white h-100 d-flex flex-column">
              <h6 className="opacity-50 small text-uppercase fw-bold mb-4">Stats {viewMode}</h6>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-5">
                  <span className="fs-5 fw-medium">Moyenne</span>
                  <div className="text-end">
                    <span className="display-6 fw-bold mb-0 text-info">{moyenneVal}</span>
                    <span className="ms-2 opacity-50">{selectedMesure.unit}</span>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 fw-medium">Dernière</span>
                  <span className="display-6 fw-bold mb-0 text-white">{selectedMesure.currentValue}</span>
                </div>
              </div>
              <div className="mt-auto pt-4 border-top border-secondary border-opacity-50 text-info">
                <i className="bi bi-info-circle me-3 fs-4"></i>
                <p className="mb-0 fw-medium small">Moyenne calculée sur {chartData.length} jours.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MesureDashboard;








