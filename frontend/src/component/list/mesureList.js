import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MesureService from '../services/mesureService';
import '../list.css';

/* ── helpers ── */
const freqLabel = (type, details) => {
  if (type === 'daily')        return { icon: 'bi-arrow-repeat',    text: 'Tous les jours' };
  if (type === 'weekly') {
    const days = Array.isArray(details) ? details : (details ? Object.values(details) : []);
    return { icon: 'bi-calendar-week',  text: days.length ? days.join(', ') : 'Hebdomadaire' };
  }
  if (type === 'monthly')      return { icon: 'bi-calendar-month',  text: details?.day ? `Le ${details.day} de chaque mois` : 'Mensuel' };
  if (type === 'every2months') return { icon: 'bi-calendar2-month', text: details?.day ? `Le ${details.day}, tous les 2 mois` : 'Tous les 2 mois' };
  if (type === 'quarterly')    return { icon: 'bi-calendar-check',  text: details?.day ? `Le ${details.day}, tous les 3 mois` : 'Trimestriel' };
  return { icon: 'bi-calendar', text: type ?? '—' };
};

const severityConfig = (s) => ({
  Low:      { label: 'Légère',  color: '#1cc88a', icon: 'bi-activity' },
  Moderate: { label: 'Modérée', color: '#f6c23e', icon: 'bi-activity' },
  High:     { label: 'Sévère',  color: '#e74a3b', icon: 'bi-exclamation-circle' },
}[s] ?? { label: s, color: '#4e73df', icon: 'bi-activity' });

/* ── Modal Détail Mesure ── */
const MesureDetailModal = ({ mes, onClose }) => {
  if (!mes) return null;
  const sev   = severityConfig(mes.severity);
  const color = sev.color;
  const freq  = freqLabel(mes.frequency_type, mes.frequency_details);
  const takesCount = mes.takes?.length ?? 0;

  const elapsed = mes.start_day && mes.number_of_days
    ? Math.max(0, Math.floor((new Date() - new Date(mes.start_day)) / 86400000))
    : null;
  const isDone = elapsed !== null && elapsed >= (mes.number_of_days ?? Infinity);
  const pct    = elapsed !== null ? Math.min((elapsed / mes.number_of_days) * 100, 100) : null;

  return (
    <div className="mdl-overlay" onClick={onClose}>
      <div className="mdl-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mdl-header" style={{ background: color }}>
          <div className="mdl-header-left">
            <div className="mdl-header-avatar">
              <i className={`bi ${sev.icon}`} />
            </div>
            <div>
              <h2 className="mdl-title">{mes.disease_name}</h2>
              <span className={`mdl-status-badge ${mes.is_active ? 'active' : 'paused'}`}>
                <i className={`bi ${mes.is_active ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'}`} />
                {mes.is_active ? 'Active' : 'En pause'}
              </span>
            </div>
          </div>
          <button className="mdl-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className="mdl-body">

          {/* Fréquence */}
          <div className="mdl-section">
            <div className="mdl-section-title" style={{ color }}>
              <i className={`bi ${freq.icon}`} /> Fréquence
            </div>
            <div className="mdl-section-value">{freq.text}</div>
          </div>

          {/* Horaires */}
          <div className="mdl-section">
            <div className="mdl-section-title" style={{ color }}>
              <i className="bi bi-clock" /> Horaires — {takesCount} mesure{takesCount > 1 ? 's' : ''}/jour
            </div>
            <div className="mdl-chips-row">
              {mes.takes?.map((t, i) => (
                <div key={i} className="mdl-chip" style={{ background:`${color}15`, borderColor:`${color}50`, color }}>
                  <span className="mdl-chip-time">{t.take_time?.substring(0,5)}</span>
                  {t.label && <span className="mdl-chip-dose">{t.label}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Sévérité + unité */}
          <div className="mdl-row-2">
            <div className="mdl-section" style={{ flex: 1 }}>
              <div className="mdl-section-title" style={{ color }}>
                <i className="bi bi-heart-pulse" /> Sévérité
              </div>
              <span style={{ background:`${color}20`, color, padding:'3px 12px', borderRadius:20, fontSize:13, fontWeight:700 }}>
                {sev.label}
              </span>
            </div>
            {mes.unit && (
              <div className="mdl-section" style={{ flex: 1 }}>
                <div className="mdl-section-title" style={{ color }}>
                  <i className="bi bi-rulers" /> Unité
                </div>
                <div className="mdl-section-value">{mes.unit}</div>
              </div>
            )}
          </div>

          {/* Cibles min/max */}
          {(mes.min_target || mes.max_target) && (
            <div className="mdl-row-2">
              {mes.min_target && (
                <div className="mdl-section" style={{ flex: 1 }}>
                  <div className="mdl-section-title" style={{ color }}>
                    <i className="bi bi-arrow-down-circle" /> Cible min
                  </div>
                  <div className="mdl-section-value">{mes.min_target} {mes.unit}</div>
                </div>
              )}
              {mes.max_target && (
                <div className="mdl-section" style={{ flex: 1 }}>
                  <div className="mdl-section-title" style={{ color }}>
                    <i className="bi bi-arrow-up-circle" /> Cible max
                  </div>
                  <div className="mdl-section-value">{mes.max_target} {mes.unit}</div>
                </div>
              )}
            </div>
          )}

          {/* Progression */}
         

          {/* Commentaire */}
          {mes.comment && (
            <div className="mdl-section mdl-comment">
              <div className="mdl-section-title" style={{ color:'#b45309' }}>
                <i className="bi bi-chat-left-text" /> Commentaire
              </div>
              <div className="mdl-comment-text">"{mes.comment}"</div>
            </div>
          )}
        </div>

        <div className="mdl-footer">
          <Link to={`/Mesure/${mes.id}/edit`} className="mdl-btn-edit" style={{ background: color }}>
            <i className="bi bi-pencil" /> Modifier
          </Link>
          <button className="mdl-btn-close" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const MesureList = () => {
  const [mesures, setMesures]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [detailMes, setDetailMes]   = useState(null);

  useEffect(() => {
    MesureService.getAll()
      .then(res => setMesures(res.data))
      .catch(err => console.error("Erreur fetch mesures:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleMesure = async (id) => {
    try {
      await MesureService.toggle(id);
      setMesures(prev => prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m));
    } catch { alert("Erreur lors du changement de statut"); }
  };

  const deleteMesure = async (id) => {
    if (!window.confirm("Supprimer cette mesure ?")) return;
    setDeletingId(id);
    try {
      await MesureService.delete(id);
      setMesures(prev => prev.filter(m => m.id !== id));
      if (detailMes?.id === id) setDetailMes(null);
    } catch { alert("Erreur lors de la suppression"); }
    finally { setDeletingId(null); }
  };

  const filtered = mesures
    .filter(m => {
      if (filter === 'active') return m.is_active;
      if (filter === 'paused') return !m.is_active;
      return true;
    })
    .filter(m => m.disease_name?.toLowerCase().includes(search.toLowerCase()));

  const nextTakeTime = (mesure) => {
    if (!mesure.takes?.length) return null;
    const sorted = [...mesure.takes].sort((a, b) => a.take_time.localeCompare(b.take_time));
    const now  = new Date().toTimeString().substring(0, 5);
    const next = sorted.find(t => t.take_time >= now) ?? sorted[0];
    return next.take_time.substring(0, 5);
  };

  if (loading) return (
    <div className="ml-loading"><div className="ml-spinner"></div><p>Chargement des mesures...</p></div>
  );

  return (
    <>
      <header className="ml-header">
        <div className="ml-header-text">
          <h1>Mes Mesures</h1>
          <p>{mesures.length} mesure{mesures.length !== 1 ? 's' : ''} enregistrée{mesures.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/Mesure" className="ml-btn-add"><i className="bi bi-plus-lg"></i> Ajouter</Link>
      </header>

      <div className="ml-controls">
        <div className="ml-search">
          <i className="bi bi-search"></i>
          <input placeholder="Rechercher une mesure..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
        </div>
        <div className="ml-filters">
          {[
            { key: 'all',    label: 'Toutes',   icon: 'bi-grid' },
            { key: 'active', label: 'Actives',  icon: 'bi-check-circle' },
            { key: 'paused', label: 'En pause', icon: 'bi-pause-circle' },
          ].map(f => (
            <button key={f.key} className={`ml-filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              <i className={`bi ${f.icon}`}></i> {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-stats">
        <div className="ml-stat"><span className="ml-stat-val">{mesures.filter(m => m.is_active).length}</span><span className="ml-stat-lbl">Actives</span></div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat"><span className="ml-stat-val">{mesures.filter(m => !m.is_active).length}</span><span className="ml-stat-lbl">En pause</span></div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat ml-stat-danger">
          <span className="ml-stat-val">{mesures.filter(m => m.severity === 'High').length}</span>
          <span className="ml-stat-lbl">Sévères</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ml-empty">
          <i className="bi bi-clipboard2-pulse"></i>
          <p>{search ? `Aucun résultat pour "${search}"` : 'Aucune mesure dans cette catégorie'}</p>
        </div>
      ) : (
        <div className="ml-grid">
          {filtered.map((mes, idx) => {
            const sev   = severityConfig(mes.severity);
            const color = sev.color;
            const next  = nextTakeTime(mes);

            const elapsed = mes.start_day && mes.number_of_days
              ? Math.max(0, Math.floor((new Date() - new Date(mes.start_day)) / 86400000)) : null;
            const isDone = elapsed !== null && elapsed >= mes.number_of_days;

            return (
              <div key={mes.id}
                className={`ml-card ${!mes.is_active ? 'ml-card-paused' : ''} ${deletingId === mes.id ? 'ml-card-deleting' : ''}`}
                style={{ '--accent': color, animationDelay: `${idx * 60}ms` }}>
                <div className="ml-card-stripe" style={{ background: mes.is_active ? color : '#d1d3e2' }}></div>
                {mes.severity === 'High' && <div className="ml-badge-low"><i className="bi bi-exclamation-circle-fill"></i> Sévérité haute</div>}

                <div className="ml-card-body">
                  <div className="ml-card-top">
                    <div className="ml-med-avatar" style={{ borderColor: mes.is_active ? color : '#d1d3e2' }}>
                      <i className={`bi ${sev.icon}`} style={{ color }}></i>
                    </div>
                    <div className="ml-med-info">
                      <h3 className="ml-med-name">{mes.disease_name}</h3>
                      <div className="ml-med-tags">
                        <span className="ml-tag" style={{ background:`${color}18`, color }}>{sev.label}</span>
                        {mes.unit && <span className="ml-tag ml-tag-gray">{mes.unit}</span>}
                      </div>
                    </div>
                    <label className="ml-switch">
                      <input type="checkbox" checked={!!mes.is_active} onChange={() => toggleMesure(mes.id)} />
                      <span className="ml-switch-track" style={{ '--sw-color': color }}></span>
                    </label>
                  </div>

                  <div className={`ml-next-dose ${!mes.is_active ? 'ml-next-paused' : ''}`}
                    style={{ background: mes.is_active ? `${color}12` : '#f4f5f7', borderColor: mes.is_active ? `${color}30` : '#e0e3eb' }}>
                    <div className="ml-next-left">
                      <i className={`bi ${mes.is_active ? 'bi-bell-fill' : 'bi-bell-slash'}`} style={{ color: mes.is_active ? color : '#adb5bd' }}></i>
                      <span>{mes.is_active ? 'Prochaine mesure' : 'En pause'}</span>
                    </div>
                    <strong style={{ color: mes.is_active ? color : '#adb5bd' }}>{mes.is_active && next ? next : '—'}</strong>
                  </div>

                  {elapsed !== null && (
                    <div className="ml-stock">
                      <div className="ml-stock-header">
                        <span>Progression</span>
                        <span className={`ml-stock-val ${isDone ? 'low' : ''}`}>
                          {isDone ? 'Terminé' : `${elapsed}/${mes.number_of_days} jours`}
                        </span>
                      </div>
                      <div className="ml-progress-track">
                        <div className={`ml-progress-bar ${isDone ? 'low' : ''}`}
                          style={{ width:`${Math.min((elapsed/mes.number_of_days)*100,100)}%`, background: isDone ? '#e74a3b' : color }}></div>
                      </div>
                    </div>
                  )}

                  {/* Bouton voir détails → modal */}
                  <button className="ml-btn-detail" style={{ color, borderColor:`${color}50` }} onClick={() => setDetailMes(mes)}>
                    <i className="bi bi-eye"></i> Voir les détails
                  </button>

                  <div className="ml-actions">
                    <Link to={`/Mesure/${mes.id}/edit`} className="ml-btn-edit"><i className="bi bi-pencil"></i> Modifier</Link>
                    <button className="ml-btn-delete" onClick={() => deleteMesure(mes.id)} disabled={deletingId === mes.id}>
                      {deletingId === mes.id ? <><i className="bi bi-hourglass-split"></i> Suppression...</> : <><i className="bi bi-trash3"></i> Supprimer</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal détails */}
      <MesureDetailModal mes={detailMes} onClose={() => setDetailMes(null)} />
    </>
  );
};

export default MesureList;