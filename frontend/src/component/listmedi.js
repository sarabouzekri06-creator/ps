import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './list.css';

/* ══════════════════════════════════════════════
   MEDICATION LIST (unchanged logic)
══════════════════════════════════════════════ */
const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');

  useEffect(() => {
    const fetchMedications = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/medications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedications(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedications();
  }, []);

  const toggleNotification = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/medications/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedications(prev =>
        prev.map(med => med.id === id ? { ...med, is_active: !med.is_active } : med)
      );
    } catch {
      alert("Erreur lors du changement de statut");
    }
  };

  const deleteMedication = async (id) => {
    if (!window.confirm("Supprimer ce médicament ?")) return;
    const token = localStorage.getItem('token');
    setDeletingId(id);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/medications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedications(prev => prev.filter(med => med.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = medications
    .filter(med => {
      if (filter === 'active') return med.is_active;
      if (filter === 'paused') return !med.is_active;
      if (filter === 'low')    return med.current_stock < (med.low_stock_alert ?? 5);
      return true;
    })
    .filter(med => med.medication_name.toLowerCase().includes(search.toLowerCase()));

  const stockPct = (med) => {
    const alert = med.low_stock_alert ?? 5;
    const total = alert * 6;
    return Math.min((med.current_stock / total) * 100, 100);
  };

  const freqLabel = (f) => ({
    daily: 'Quotidien', weekly: 'Hebdo', monthly: 'Mensuel'
  }[f] ?? f);

  const nextTakeTime = (med) => {
    if (!med.takes || med.takes.length === 0) return null;
    const sorted = [...med.takes].sort((a, b) => a.take_time.localeCompare(b.take_time));
    const now = new Date().toTimeString().substring(0, 5);
    const next = sorted.find(t => t.take_time >= now) ?? sorted[0];
    return next.take_time.substring(0, 5);
  };

  if (loading) return (
    <div className="ml-loading">
      <div className="ml-spinner"></div>
      <p>Chargement des médicaments...</p>
    </div>
  );

  return (
    <>
      {/* HEADER */}
      <header className="ml-header">
        <div className="ml-header-text">
          <h1>Mes Médicaments</h1>
          <p>{medications.length} traitement{medications.length !== 1 ? 's' : ''} enregistré{medications.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/Medicament" className="ml-btn-add">
          <i className="bi bi-plus-lg"></i>
          Ajouter
        </Link>
      </header>

      {/* RECHERCHE + FILTRES */}
      <div className="ml-controls">
        <div className="ml-search">
          <i className="bi bi-search"></i>
          <input
            placeholder="Rechercher un médicament..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
        <div className="ml-filters">
          {[
            { key: 'all',    label: 'Tous',      icon: 'bi-grid' },
            { key: 'active', label: 'Actifs',    icon: 'bi-check-circle' },
            { key: 'paused', label: 'En pause',  icon: 'bi-pause-circle' },
            { key: 'low',    label: 'Stock bas', icon: 'bi-exclamation-triangle' },
          ].map(f => (
            <button
              key={f.key}
              className={`ml-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              <i className={`bi ${f.icon}`}></i>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="ml-stats">
        <div className="ml-stat">
          <span className="ml-stat-val">{medications.filter(m => m.is_active).length}</span>
          <span className="ml-stat-lbl">Actifs</span>
        </div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat">
          <span className="ml-stat-val">{medications.filter(m => !m.is_active).length}</span>
          <span className="ml-stat-lbl">En pause</span>
        </div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat ml-stat-danger">
          <span className="ml-stat-val">{medications.filter(m => m.current_stock < (m.low_stock_alert ?? 5)).length}</span>
          <span className="ml-stat-lbl">Stock bas</span>
        </div>
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div className="ml-empty">
          <i className="bi bi-capsule"></i>
          <p>{search ? `Aucun résultat pour "${search}"` : 'Aucun médicament dans cette catégorie'}</p>
        </div>
      ) : (
        <div className="ml-grid">
          {filtered.map((med, idx) => {
            const isLow      = med.current_stock < (med.low_stock_alert ?? 5);
            const pct        = stockPct(med);
            const next       = nextTakeTime(med);
            const color      = med.reminder_color ?? '#4e73df';
            const takesCount = med.takes?.length ?? 0;

            return (
              <div
                key={med.id}
                className={`ml-card ${!med.is_active ? 'ml-card-paused' : ''} ${deletingId === med.id ? 'ml-card-deleting' : ''}`}
                style={{ '--accent': color, animationDelay: `${idx * 60}ms` }}
              >
                <div className="ml-card-stripe" style={{ background: med.is_active ? color : '#d1d3e2' }}></div>

                {isLow && (
                  <div className="ml-badge-low">
                    <i className="bi bi-exclamation-triangle-fill"></i> Stock critique
                  </div>
                )}

                <div className="ml-card-body">
                  <div className="ml-card-top">
                    <div className="ml-med-avatar" style={{ borderColor: med.is_active ? color : '#d1d3e2' }}>
                      {med.medication_image ? (
                        <img src={`http://127.0.0.1:8000/storage/${med.medication_image}`} alt={med.medication_name} />
                      ) : (
                        <i className="bi bi-capsule" style={{ color }}></i>
                      )}
                    </div>
                    <div className="ml-med-info">
                      <h3 className="ml-med-name">{med.medication_name}</h3>
                      <div className="ml-med-tags">
                        <span className="ml-tag" style={{ background: `${color}18`, color }}>
                          <i className="bi bi-arrow-repeat me-1"></i>{freqLabel(med.frequency_type)}
                        </span>
                        {med.unit && <span className="ml-tag ml-tag-gray">{med.unit}</span>}
                      </div>
                    </div>
                    <label className="ml-switch" title={med.is_active ? 'Mettre en pause' : 'Activer'}>
                      <input type="checkbox" checked={!!med.is_active} onChange={() => toggleNotification(med.id)} />
                      <span className="ml-switch-track" style={{ '--sw-color': color }}></span>
                    </label>
                  </div>

                  <div
                    className={`ml-next-dose ${!med.is_active ? 'ml-next-paused' : ''}`}
                    style={{ background: med.is_active ? `${color}12` : '#f4f5f7', borderColor: med.is_active ? `${color}30` : '#e0e3eb' }}
                  >
                    <div className="ml-next-left">
                      <i className={`bi ${med.is_active ? 'bi-bell-fill' : 'bi-bell-slash'}`} style={{ color: med.is_active ? color : '#adb5bd' }}></i>
                      <span>{med.is_active ? 'Prochaine prise' : 'En pause'}</span>
                    </div>
                    <strong style={{ color: med.is_active ? color : '#adb5bd' }}>
                      {med.is_active && next ? next : '—'}
                    </strong>
                  </div>

                  <div className="ml-card-meta">
                    <div className="ml-meta-item">
                      <i className="bi bi-clock-history"></i>
                      <span>{takesCount} prise{takesCount !== 1 ? 's' : ''}/jour</span>
                    </div>
                    {med.takes?.[0] && (
                      <div className="ml-meta-item">
                        <i className="bi bi-capsule"></i>
                        <span>{med.takes[0].dose} {med.takes[0].unit ?? med.unit}</span>
                      </div>
                    )}
                    {med.instruction && (
                      <div className="ml-meta-item">
                        <i className="bi bi-info-circle"></i>
                        <span>
                          {med.instruction === 'Before meal' ? 'Avant repas' :
                           med.instruction === 'During meal' ? 'Pendant repas' :
                           med.instruction === 'After meal'  ? 'Après repas' : med.instruction}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="ml-stock">
                    <div className="ml-stock-header">
                      <span>Stock</span>
                      <span className={`ml-stock-val ${isLow ? 'low' : ''}`}>{med.current_stock} restants</span>
                    </div>
                    <div className="ml-progress-track">
                      <div className={`ml-progress-bar ${isLow ? 'low' : ''}`} style={{ width: `${pct}%`, background: isLow ? '#e74a3b' : color }}></div>
                    </div>
                  </div>

                  {med.comment && (
                    <div className="ml-comment">
                      <i className="bi bi-chat-left-text"></i>
                      <span>{med.comment}</span>
                    </div>
                  )}

                  <div className="ml-actions">
                    <Link to={`/Medicament/${med.id}/edit`} className="ml-btn-edit">
                      <i className="bi bi-pencil"></i> Modifier
                    </Link>
                    <button className="ml-btn-delete" onClick={() => deleteMedication(med.id)} disabled={deletingId === med.id}>
                      {deletingId === med.id
                        ? <><i className="bi bi-hourglass-split"></i> Suppression...</>
                        : <><i className="bi bi-trash3"></i> Supprimer</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════
   MESURE LIST (same logic as MedicationList)
══════════════════════════════════════════════ */
const MesureList = () => {
  const [mesures, setMesures]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all'); // all | active | paused

  // ── 1. FETCH ──────────────────────────────────
  useEffect(() => {
    const fetchMesures = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/measures', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMesures(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des mesures:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMesures();
  }, []);

  // ── 2. TOGGLE ACTIF / PAUSE ───────────────────
  const toggleMesure = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/measures/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMesures(prev =>
        prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m)
      );
    } catch {
      alert("Erreur lors du changement de statut");
    }
  };

  // ── 3. SUPPRIMER ──────────────────────────────
  const deleteMesure = async (id) => {
    if (!window.confirm("Supprimer cette mesure ?")) return;
    const token = localStorage.getItem('token');
    setDeletingId(id);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/measures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMesures(prev => prev.filter(m => m.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  // ── 4. FILTRAGE + RECHERCHE ───────────────────
  const filtered = mesures
    .filter(m => {
      if (filter === 'active') return m.is_active;
      if (filter === 'paused') return !m.is_active;
      return true;
    })
    .filter(m => m.disease_name?.toLowerCase().includes(search.toLowerCase()));

  // ── HELPERS ───────────────────────────────────
  const freqLabel = (f) => ({
    daily: 'Quotidien', weekly: 'Hebdo', monthly: 'Mensuel'
  }[f] ?? f);

  const severityConfig = (s) => ({
    Low:      { label: 'Légère',  color: '#1cc88a', icon: 'bi-activity' },
    Moderate: { label: 'Modérée', color: '#f6c23e', icon: 'bi-activity' },
    High:     { label: 'Sévère',  color: '#e74a3b', icon: 'bi-exclamation-circle' },
  }[s] ?? { label: s, color: '#4e73df', icon: 'bi-activity' });

  const nextTakeTime = (mesure) => {
    if (!mesure.takes || mesure.takes.length === 0) return null;
    const sorted = [...mesure.takes].sort((a, b) => a.take_time.localeCompare(b.take_time));
    const now  = new Date().toTimeString().substring(0, 5);
    const next = sorted.find(t => t.take_time >= now) ?? sorted[0];
    return next.take_time.substring(0, 5);
  };

  // Couleur principale selon sévérité
  const colorFor = (m) => severityConfig(m.severity).color;

  if (loading) return (
    <div className="ml-loading">
      <div className="ml-spinner"></div>
      <p>Chargement des mesures...</p>
    </div>
  );

  return (
    <>
      {/* HEADER */}
      <header className="ml-header">
        <div className="ml-header-text">
          <h1>Mes Mesures</h1>
          <p>{mesures.length} mesure{mesures.length !== 1 ? 's' : ''} enregistrée{mesures.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/Mesure" className="ml-btn-add">
          <i className="bi bi-plus-lg"></i>
          Ajouter
        </Link>
      </header>

      {/* RECHERCHE + FILTRES */}
      <div className="ml-controls">
        <div className="ml-search">
          <i className="bi bi-search"></i>
          <input
            placeholder="Rechercher une mesure..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
        <div className="ml-filters">
          {[
            { key: 'all',    label: 'Toutes',   icon: 'bi-grid' },
            { key: 'active', label: 'Actives',  icon: 'bi-check-circle' },
            { key: 'paused', label: 'En pause', icon: 'bi-pause-circle' },
          ].map(f => (
            <button
              key={f.key}
              className={`ml-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              <i className={`bi ${f.icon}`}></i>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="ml-stats">
        <div className="ml-stat">
          <span className="ml-stat-val">{mesures.filter(m => m.is_active).length}</span>
          <span className="ml-stat-lbl">Actives</span>
        </div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat">
          <span className="ml-stat-val">{mesures.filter(m => !m.is_active).length}</span>
          <span className="ml-stat-lbl">En pause</span>
        </div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat ml-stat-danger">
          <span className="ml-stat-val">{mesures.filter(m => m.severity === 'High').length}</span>
          <span className="ml-stat-lbl">Sévères</span>
        </div>
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div className="ml-empty">
          <i className="bi bi-clipboard2-pulse"></i>
          <p>{search ? `Aucun résultat pour "${search}"` : 'Aucune mesure dans cette catégorie'}</p>
        </div>
      ) : (
        <div className="ml-grid">
          {filtered.map((mes, idx) => {
            const sev        = severityConfig(mes.severity);
            const color      = colorFor(mes);
            const next       = nextTakeTime(mes);
            const takesCount = mes.takes?.length ?? 0;

            return (
              <div
                key={mes.id}
                className={`ml-card ${!mes.is_active ? 'ml-card-paused' : ''} ${deletingId === mes.id ? 'ml-card-deleting' : ''}`}
                style={{ '--accent': color, animationDelay: `${idx * 60}ms` }}
              >
                {/* Bande couleur top */}
                <div className="ml-card-stripe" style={{ background: mes.is_active ? color : '#d1d3e2' }}></div>

                {/* BADGE sévérité haute */}
                {mes.severity === 'High' && (
                  <div className="ml-badge-low">
                    <i className="bi bi-exclamation-circle-fill"></i> Sévérité haute
                  </div>
                )}

                <div className="ml-card-body">

                  {/* LIGNE HAUTE : icône + nom + switch */}
                  <div className="ml-card-top">
                    <div className="ml-med-avatar" style={{ borderColor: mes.is_active ? color : '#d1d3e2' }}>
                      <i className={`bi ${sev.icon}`} style={{ color }}></i>
                    </div>
                    <div className="ml-med-info">
                      <h3 className="ml-med-name">{mes.disease_name}</h3>
                      <div className="ml-med-tags">
                        <span className="ml-tag" style={{ background: `${color}18`, color }}>
                          <i className="bi bi-arrow-repeat me-1"></i>{freqLabel(mes.frequency_type)}
                        </span>
                        <span className="ml-tag" style={{ background: `${color}18`, color }}>
                          {sev.label}
                        </span>
                      </div>
                    </div>
                    <label className="ml-switch" title={mes.is_active ? 'Mettre en pause' : 'Activer'}>
                      <input
                        type="checkbox"
                        checked={!!mes.is_active}
                        onChange={() => toggleMesure(mes.id)}
                      />
                      <span className="ml-switch-track" style={{ '--sw-color': color }}></span>
                    </label>
                  </div>

                  {/* PROCHAINE MESURE */}
                  <div
                    className={`ml-next-dose ${!mes.is_active ? 'ml-next-paused' : ''}`}
                    style={{ background: mes.is_active ? `${color}12` : '#f4f5f7', borderColor: mes.is_active ? `${color}30` : '#e0e3eb' }}
                  >
                    <div className="ml-next-left">
                      <i className={`bi ${mes.is_active ? 'bi-bell-fill' : 'bi-bell-slash'}`} style={{ color: mes.is_active ? color : '#adb5bd' }}></i>
                      <span>{mes.is_active ? 'Prochaine mesure' : 'En pause'}</span>
                    </div>
                    <strong style={{ color: mes.is_active ? color : '#adb5bd' }}>
                      {mes.is_active && next ? next : '—'}
                    </strong>
                  </div>

                  {/* INFOS */}
                  <div className="ml-card-meta">
                    <div className="ml-meta-item">
                      <i className="bi bi-clock-history"></i>
                      <span>{takesCount} mesure{takesCount !== 1 ? 's' : ''}/jour</span>
                    </div>
                    {mes.start_day && (
                      <div className="ml-meta-item">
                        <i className="bi bi-calendar-event"></i>
                        <span>Début : {new Date(mes.start_day).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {mes.number_of_days && (
                      <div className="ml-meta-item">
                        <i className="bi bi-hourglass-split"></i>
                        <span>{mes.number_of_days} jours</span>
                      </div>
                    )}
                  </div>

                  {/* BARRE DE PROGRESSION (durée écoulée) */}
                  {mes.start_day && mes.number_of_days && (() => {
                    const start    = new Date(mes.start_day);
                    const today    = new Date();
                    const elapsed  = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
                    const pct      = Math.min((elapsed / mes.number_of_days) * 100, 100);
                    const isDone   = pct >= 100;
                    return (
                      <div className="ml-stock">
                        <div className="ml-stock-header">
                          <span>Progression</span>
                          <span className={`ml-stock-val ${isDone ? 'low' : ''}`}>
                            {isDone ? 'Terminé' : `${elapsed}/${mes.number_of_days} jours`}
                          </span>
                        </div>
                        <div className="ml-progress-track">
                          <div
                            className={`ml-progress-bar ${isDone ? 'low' : ''}`}
                            style={{ width: `${pct}%`, background: isDone ? '#e74a3b' : color }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* COMMENTAIRE */}
                  {mes.comment && (
                    <div className="ml-comment">
                      <i className="bi bi-chat-left-text"></i>
                      <span>{mes.comment}</span>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="ml-actions">
                    <Link to={`/Mesure/${mes.id}/edit`} className="ml-btn-edit">
                      <i className="bi bi-pencil"></i> Modifier
                    </Link>
                    <button
                      className="ml-btn-delete"
                      onClick={() => deleteMesure(mes.id)}
                      disabled={deletingId === mes.id}
                    >
                      {deletingId === mes.id
                        ? <><i className="bi bi-hourglass-split"></i> Suppression...</>
                        : <><i className="bi bi-trash3"></i> Supprimer</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════
   CONTENEUR PRINCIPAL avec les 2 boutons en haut
══════════════════════════════════════════════ */
const HealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('medications'); // 'medications' | 'mesures'

  return (
    <div className="ml-page">

      {/* ── TAB SWITCHER ── */}
      <div className="hd-tab-switcher">
        <button
          className={`hd-tab-btn ${activeTab === 'medications' ? 'hd-tab-active' : ''}`}
          onClick={() => setActiveTab('medications')}
        >
          <i className="bi bi-capsule-pill"></i>
          Médicaments
        </button>
        <button
          className={`hd-tab-btn ${activeTab === 'mesures' ? 'hd-tab-active' : ''}`}
          onClick={() => setActiveTab('mesures')}
        >
          <i className="bi bi-clipboard2-pulse"></i>
          Mesures
        </button>
      </div>

      {/* ── CONTENU SELON L'ONGLET ACTIF ── */}
      {activeTab === 'medications' ? <MedicationList /> : <MesureList />}

    </div>
  );
};

export default HealthDashboard;