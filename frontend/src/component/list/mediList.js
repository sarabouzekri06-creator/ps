import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MedicationService from '../services/medicationService';
import '../list.css';

const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');

  // Modal réapprovisionnement
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty,   setRestockQty]   = useState('');
  const [restocking,   setRestocking]   = useState(false);

  React.useEffect(() => {
    MedicationService.getAll()
      .then(res => setMedications(res.data))
      .catch(err => console.error('Erreur fetch medications:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleNotification = async (id) => {
    try {
      await MedicationService.toggle(id);
      setMedications(prev =>
        prev.map(med => med.id === id ? { ...med, is_active: !med.is_active } : med)
      );
    } catch {
      alert('Erreur lors du changement de statut');
    }
  };

  const deleteMedication = async (id) => {
    if (!window.confirm('Supprimer ce médicament ?')) return;
    setDeletingId(id);
    try {
      await MedicationService.delete(id);
      setMedications(prev => prev.filter(med => med.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const openRestock = (e, med) => {
    e.stopPropagation();
    setRestockModal({ med });
    setRestockQty('');
  };

  const confirmRestock = async () => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) return;
    setRestocking(true);
    try {
      await MedicationService.restock(restockModal.med.id, qty);
      setMedications(prev =>
        prev.map(m =>
          m.id === restockModal.med.id
            ? { ...m, current_stock: (m.current_stock ?? 0) + qty }
            : m
        )
      );
      setRestockModal(null);
    } catch {
      alert('Erreur lors du réapprovisionnement');
    } finally {
      setRestocking(false);
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
    const now  = new Date().toTimeString().substring(0, 5);
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
      <header className="ml-header">
        <div className="ml-header-text">
          <h1>Mes Médicaments</h1>
          <p>{medications.length} traitement{medications.length !== 1 ? 's' : ''} enregistré{medications.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/Medicament" className="ml-btn-add">
          <i className="bi bi-plus-lg"></i> Ajouter
        </Link>
      </header>

      <div className="ml-controls">
        <div className="ml-search">
          <i className="bi bi-search"></i>
          <input
            placeholder="Rechercher un médicament..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
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
              <i className={`bi ${f.icon}`}></i> {f.label}
            </button>
          ))}
        </div>
      </div>

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

                    {/* Avatar simple — sans bouton */}
                    <div
                      className="ml-med-avatar"
                      style={{ borderColor: med.is_active ? color : '#d1d3e2' }}
                    >
                      {med.medication_image
                        ? <img src={`http://127.0.0.1:8000/storage/${med.medication_image}`} alt={med.medication_name} />
                        : <i className="bi bi-capsule" style={{ color }}></i>
                      }
                    </div>

                    

                    <div className="ml-med-info">
                      <h3 className="ml-med-name">{med.medication_name}</h3>
                      <div className="ml-med-tags">
                        {/* <span className="ml-tag" style={{ background: `${color}18`, color }}> */}
                          {/* <i className="bi bi-arrow-repeat me-1"></i>{freqLabel(med.frequency_type)} */}

                           {isLow && (
                          <button
                            onClick={(e) => openRestock(e, med)}
                            style={{
                              background: '#fff0ee',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#e74a3b',
                              borderRadius: 99,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <i className="bi bi-arrow-repeat " style={{ fontSize: 11 }}></i>
                          </button>
                        )}
                        {/* </span> */}
                        {med.unit && <span className="ml-tag ml-tag-gray">{med.unit}</span>}


                      </div>
                    </div>

                    <label className="ml-switch">
                      <input type="checkbox" checked={!!med.is_active} onChange={() => toggleNotification(med.id)} />
                      <span className="ml-switch-track" style={{ '--sw-color': color }}></span>
                    </label>
                  </div>

                  <div className={`ml-next-dose ${!med.is_active ? 'ml-next-paused' : ''}`}
                    style={{ background: med.is_active ? `${color}12` : '#f4f5f7', borderColor: med.is_active ? `${color}30` : '#e0e3eb' }}>
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

                  {/* ✅ Section stock — seul point d'entrée pour le modal */}
                  <div className="ml-stock">
                    <div className="ml-stock-header">
                      <span>Stock</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`ml-stock-val ${isLow ? 'low' : ''}`}>
                          {med.current_stock} restants
                        </span>
                       
                      </div>
                    </div>
                    <div className="ml-progress-track">
                      <div
                        className={`ml-progress-bar ${isLow ? 'low' : ''}`}
                        style={{ width: `${pct}%`, background: isLow ? '#e74a3b' : color }}
                      ></div>
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
                    <button
                      className="ml-btn-delete"
                      onClick={() => deleteMedication(med.id)}
                      disabled={deletingId === med.id}
                    >
                      {deletingId === med.id
                        ? <><i className="bi bi-hourglass-split"></i> Suppression...</>
                        : <><i className="bi bi-trash3"></i> Supprimer</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL RÉAPPROVISIONNEMENT */}
      {restockModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
          }}
          onClick={() => setRestockModal(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20,
              width: 400, maxWidth: '92vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div style={{ background: '#e74a3b', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-arrow-clockwise" style={{ color: '#fff', fontSize: 20 }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 }}>Réapprovisionner</h3>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                    {restockModal.med.medication_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRestockModal(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            {/* Corps modal */}
            <div style={{ padding: '24px' }}>

              {/* Stock actuel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px solid #fecaca' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Stock actuel</span>
                <span style={{ fontWeight: 700, color: '#e74a3b', fontSize: 15 }}>
                  {restockModal.med.current_stock} unité{restockModal.med.current_stock !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Input quantité */}
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                Quantité à ajouter
              </label>
              <input
                type="number"
                min="1"
                placeholder="ex: 30"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmRestock()}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', fontSize: 16, fontWeight: 600,
                  outline: 'none', background: '#f8f9fb', color: '#0f172a',
                  marginBottom: 16, boxSizing: 'border-box',
                }}
              />

              {/* Aperçu nouveau stock */}
              {restockQty && parseInt(restockQty) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Nouveau stock après ajout</span>
                  <span style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
                    {(restockModal.med.current_stock ?? 0) + parseInt(restockQty)} unités
                  </span>
                </div>
              )}

              {/* Raccourcis quantités */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {[7, 14, 28, 30, 60, 90].map(q => (
                  <button
                    key={q}
                    onClick={() => setRestockQty(String(q))}
                    style={{
                      flex: 1, minWidth: 44,
                      border: `1.5px solid ${restockQty === String(q) ? '#e74a3b' : '#e2e8f0'}`,
                      borderRadius: 10, padding: '7px 4px',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: restockQty === String(q) ? '#fff0ee' : '#fff',
                      color: restockQty === String(q) ? '#e74a3b' : '#475569',
                      transition: 'all 0.15s',
                    }}
                  >
                    +{q}
                  </button>
                ))}
              </div>

              {/* Boutons action */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setRestockModal(null)}
                  style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#64748b' }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmRestock}
                  disabled={restocking || !restockQty || parseInt(restockQty) <= 0}
                  style={{
                    flex: 2, border: 'none', borderRadius: 12, padding: '11px',
                    fontSize: 13, fontWeight: 700,
                    cursor: restocking || !restockQty || parseInt(restockQty) <= 0 ? 'not-allowed' : 'pointer',
                    background: !restockQty || parseInt(restockQty) <= 0 ? '#e2e8f0' : '#e74a3b',
                    color: !restockQty || parseInt(restockQty) <= 0 ? '#94a3b8' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: restocking ? 0.8 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {restocking ? (
                    <>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}></span>
                      Enregistrement…
                    </>
                  ) : (
                    <><i className="bi bi-check2-circle"></i> Confirmer</>
                  )}
                </button>
              </div>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
    </>
  );
};

export default MedicationList;