import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MedicationService from '../services/medicationService';
import '../list.css';

/* ── helpers ── */
const freqLabel = (type, details) => {
  if (type === 'daily')   return { icon: 'bi-arrow-repeat',    text: 'Tous les jours' };
  if (type === 'weekly') {
    const days = Array.isArray(details) ? details : (details ? Object.values(details) : []);
    return { icon: 'bi-calendar-week', text: days.length ? days.join(', ') : 'Hebdomadaire' };
  }
  if (type === 'monthly') {
    const day = details?.day ?? details;
    return { icon: 'bi-calendar-month', text: day ? `Le ${day} de chaque mois` : 'Mensuel' };
  }
  return { icon: 'bi-calendar', text: type ?? '—' };
};



const instrLabel = (i) => ({
  'Before meal': 'Avant repas',
  'During meal': 'Pendant repas',
  'After meal':  'Après repas',
}[i] ?? i);

/* ── Modal Détail Médicament ── */
const MedDetailModal = ({ med, onClose }) => {
  if (!med) return null;
  const color      = med.reminder_color ?? '#4e73df';
  const freq       = freqLabel(med.frequency_type, med.frequency_details);
  const takesCount = med.takes?.length ?? 0;
  const totalDose  = med.takes?.reduce((s, t) => s + Number(t.dose ?? 1), 0) ?? 0;
  const isLow      = med.current_stock < (med.low_stock_alert ?? 5);

  const elapsed = med.notification?.start_day && med.notification?.number_of_days
    ? Math.max(0, Math.floor((new Date() - new Date(med.notification.start_day)) / 86400000))
    : null;
  const isDone = elapsed !== null && elapsed >= (med.notification?.number_of_days ?? Infinity);
  const pct    = elapsed !== null ? Math.min((elapsed / med.notification.number_of_days) * 100, 100) : null;


  
  return (
    <div className="mdl-overlay" onClick={onClose}>
      <div className="mdl-box" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="mdl-header" style={{ background: color }}>
          <div className="mdl-header-left">
            <div className="mdl-header-avatar">
              {med.medication_image
                ? <img src={`http://127.0.0.1:8000/storage/${med.medication_image}`} alt={med.medication_name} />
                : <i className="bi bi-capsule" />}
            </div>
            <div>
              <h2 className="mdl-title">{med.medication_name}</h2>
              <span className={`mdl-status-badge ${med.is_active ? 'active' : 'paused'}`}>
                <i className={`bi ${med.is_active ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'}`} />
                {med.is_active ? 'Actif' : 'En pause'}
              </span>
            </div>
          </div>
          <button className="mdl-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {/* ── Body ── */}
        <div className="mdl-body">

          {/* Fréquence */}
          <div className="mdl-section">
            <div className="mdl-section-title" style={{ color }}>
              <i className={`bi ${freq.icon}`} /> Type de traitement
            </div>
            <div className="mdl-section-value">{freq.text}</div>
          </div>

          {/* Prises */}
          <div className="mdl-section">
            <div className="mdl-section-title" style={{ color }}>
              <i className="bi bi-clock" /> Prises par jour — {takesCount} prise{takesCount > 1 ? 's' : ''}
            </div>
            <div className="mdl-chips-row">
              {med.takes?.map((t, i) => (
                <div key={i} className="mdl-chip" style={{ background: `${color}15`, borderColor: `${color}50`, color }}>
                  <span className="mdl-chip-time">{t.take_time?.substring(0, 5)}</span>
                  <span className="mdl-chip-dose">{t.dose} {t.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dose totale + stock */}
          <div className="mdl-row-2">
            <div className="mdl-section" style={{ flex: 1 }}>
              <div className="mdl-section-title" style={{ color }}>
                <i className="bi bi-capsule" /> Dose totale/jour
              </div>
              <div className="mdl-section-value">{totalDose} {med.takes?.[0]?.unit ?? med.unit ?? ''}</div>
            </div>
            <div className="mdl-section" style={{ flex: 1 }}>
              <div className="mdl-section-title" style={{ color: isLow ? '#e74a3b' : color }}>
                <i className="bi bi-box-seam" /> Stock restant
              </div>
              <div className="mdl-section-value" style={{ color: isLow ? '#e74a3b' : '#1e293b' }}>
                {med.current_stock} unités {isLow && <span className="mdl-low-badge">⚠ Bas</span>}
              </div>
            </div>
          </div>

          {/* Barre stock */}
          <div className="mdl-progress-wrap">
            <div className="mdl-progress-track">
              <div className="mdl-progress-bar" style={{
                width: `${Math.min((med.current_stock / ((med.low_stock_alert ?? 5) * 6)) * 100, 100)}%`,
                background: isLow ? '#e74a3b' : color
              }} />
            </div>
          </div>

          {/* Durée traitement */}
         
          {/* Instruction */}
          {med.instruction && (
            <div className="mdl-section">
              <div className="mdl-section-title" style={{ color }}>
                <i className="bi bi-info-circle" /> Instruction
              </div>
              <div className="mdl-section-value">{instrLabel(med.instruction)}</div>
            </div>
          )}

          {/* Commentaire */}
          {med.comment && (
            <div className="mdl-section mdl-comment">
              <div className="mdl-section-title" style={{ color: '#b45309' }}>
                <i className="bi bi-chat-left-text" /> Commentaire
              </div>
              <div className="mdl-comment-text">"{med.comment}"</div>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="mdl-footer">
          <Link to={`/Medicament/${med.id}/edit`} className="mdl-btn-edit" style={{ background: color }}>
            <i className="bi bi-pencil" /> Modifier
          </Link>
          <button className="mdl-btn-close" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [detailMed, setDetailMed]     = useState(null);

  const [restockModal, setRestockModal] = useState(null);
  const [restockQty,   setRestockQty]   = useState('');
  const [restocking,   setRestocking]   = useState(false);

 React.useEffect(() => {
  MedicationService.getAll()
    .then(res => {
      console.log('FULL RESPONSE:', res);  // ← voir toute la réponse
      console.log('DATA:', res.data);
      setMedications(res.data);
    })
    .catch(err => console.error('Erreur fetch medications:', err))
    .finally(() => setLoading(false));
}, []);

  const toggleNotification = async (id) => {
    try {
      await MedicationService.toggle(id);
      setMedications(prev => prev.map(med => med.id === id ? { ...med, is_active: !med.is_active } : med));
    } catch { alert('Erreur lors du changement de statut'); }
  };

  const deleteMedication = async (id) => {
    if (!window.confirm('Supprimer ce médicament ?')) return;
    setDeletingId(id);
    try {
      await MedicationService.delete(id);
      setMedications(prev => prev.filter(med => med.id !== id));
      if (detailMed?.id === id) setDetailMed(null);
    } catch { alert('Erreur lors de la suppression'); }
    finally { setDeletingId(null); }
  };

  const openRestock = (e, med) => { e.stopPropagation(); setRestockModal({ med }); setRestockQty(''); };

  const confirmRestock = async () => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) return;
    setRestocking(true);
    try {
      await MedicationService.restock(restockModal.med.id, qty);
      setMedications(prev => prev.map(m => m.id === restockModal.med.id ? { ...m, current_stock: (m.current_stock ?? 0) + qty } : m));
      setRestockModal(null);
    } catch { alert('Erreur lors du réapprovisionnement'); }
    finally { setRestocking(false); }
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
    return Math.min((med.current_stock / (alert * 6)) * 100, 100);
  };

  const nextTakeTime = (med) => {
    if (!med.takes?.length) return null;
    const sorted = [...med.takes].sort((a, b) => a.take_time.localeCompare(b.take_time));
    const now  = new Date().toTimeString().substring(0, 5);
    const next = sorted.find(t => t.take_time >= now) ?? sorted[0];
    return next.take_time.substring(0, 5);
  };

  if (loading) return (
    <div className="ml-loading"><div className="ml-spinner"></div><p>Chargement des médicaments...</p></div>
  );

  return (
    <>
      <header className="ml-header">
        <div className="ml-header-text">
          <h1>Mes Médicaments</h1>
          <p>{medications.length} traitement{medications.length !== 1 ? 's' : ''} enregistré{medications.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/Medicament" className="ml-btn-add"><i className="bi bi-plus-lg"></i> Ajouter</Link>
      </header>

      <div className="ml-controls">
        <div className="ml-search">
          <i className="bi bi-search"></i>
          <input placeholder="Rechercher un médicament..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
        </div>
        <div className="ml-filters">
          {[
            { key: 'all',    label: 'Tous',      icon: 'bi-grid' },
            { key: 'active', label: 'Actifs',    icon: 'bi-check-circle' },
            { key: 'paused', label: 'En pause',  icon: 'bi-pause-circle' },
            { key: 'low',    label: 'Stock bas', icon: 'bi-exclamation-triangle' },
          ].map(f => (
            <button key={f.key} className={`ml-filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              <i className={`bi ${f.icon}`}></i> {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-stats">
        <div className="ml-stat"><span className="ml-stat-val">{medications.filter(m => m.is_active).length}</span><span className="ml-stat-lbl">Actifs</span></div>
        <div className="ml-stat-divider"></div>
        <div className="ml-stat"><span className="ml-stat-val">{medications.filter(m => !m.is_active).length}</span><span className="ml-stat-lbl">En pause</span></div>
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
            const isLow  = med.current_stock < (med.low_stock_alert ?? 5);
            const pct    = stockPct(med);
            const next   = nextTakeTime(med);
            const color  = med.reminder_color ?? '#4e73df';

            return (
              <div key={med.id}
                className={`ml-card ${!med.is_active ? 'ml-card-paused' : ''} ${deletingId === med.id ? 'ml-card-deleting' : ''}`}
                style={{ '--accent': color, animationDelay: `${idx * 60}ms` }}>
                <div className="ml-card-stripe" style={{ background: med.is_active ? color : '#d1d3e2' }}></div>
                {isLow && <div className="ml-badge-low"><i className="bi bi-exclamation-triangle-fill"></i> Stock critique</div>}

                <div className="ml-card-body">
                  <div className="ml-card-top">
                    <div className="ml-med-avatar" style={{ borderColor: med.is_active ? color : '#d1d3e2' }}>
                      {med.medication_image
                        ? <img src={`http://127.0.0.1:8000/storage/${med.medication_image}`} alt={med.medication_name} />
                        : <i className="bi bi-capsule" style={{ color }}></i>}
                    </div>
                    <div className="ml-med-info">
                      <h3 className="ml-med-name">{med.medication_name}</h3>
                      <div className="ml-med-tags">
                        {isLow && (
                          <button onClick={(e) => openRestock(e, med)} style={{ background:'#fff0ee',border:'none',cursor:'pointer',color:'#e74a3b',borderRadius:99,display:'inline-flex',alignItems:'center',gap:4 }}>
                            <i className="bi bi-arrow-repeat" style={{ fontSize:11 }}></i>
                          </button>
                        )}
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
                    <strong style={{ color: med.is_active ? color : '#adb5bd' }}>{med.is_active && next ? next : '—'}</strong>
                  </div>

                  <div className="ml-stock">
                    <div className="ml-stock-header">
                      <span>Stock</span>
                      <span className={`ml-stock-val ${isLow ? 'low' : ''}`}>{med.current_stock} restants</span>
                    </div>
                    <div className="ml-progress-track">
                      <div className={`ml-progress-bar ${isLow ? 'low' : ''}`} style={{ width:`${pct}%`, background: isLow ? '#e74a3b' : color }}></div>
                    </div>
                  </div>

                  {/* Bouton voir détails → ouvre modal */}
                  <button className="ml-btn-detail" style={{ color, borderColor: `${color}50` }} onClick={() => setDetailMed(med)}>
                    <i className="bi bi-eye"></i> Voir les détails
                  </button>

                  <div className="ml-actions">
                    <Link to={`/Medicament/${med.id}/edit`} className="ml-btn-edit"><i className="bi bi-pencil"></i> Modifier</Link>
                    <button className="ml-btn-delete" onClick={() => deleteMedication(med.id)} disabled={deletingId === med.id}>
                      {deletingId === med.id ? <><i className="bi bi-hourglass-split"></i> Suppression...</> : <><i className="bi bi-trash3"></i> Supprimer</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal détails */}
      <MedDetailModal med={detailMed} onClose={() => setDetailMed(null)} />

      {/* Modal réapprovisionnement */}
      {restockModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={() => setRestockModal(null)}>
          <div style={{ background:'#fff',borderRadius:20,width:400,maxWidth:'92vw',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background:'#e74a3b',padding:'20px 24px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <i className="bi bi-arrow-clockwise" style={{ color:'#fff',fontSize:20 }}></i>
                </div>
                <div>
                  <h3 style={{ margin:0,color:'#fff',fontSize:16,fontWeight:700 }}>Réapprovisionner</h3>
                  <p style={{ margin:0,color:'rgba(255,255,255,0.75)',fontSize:12 }}>{restockModal.med.medication_name}</p>
                </div>
              </div>
              <button onClick={() => setRestockModal(null)} style={{ background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',color:'#fff',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div style={{ padding:'24px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff5f5',borderRadius:12,padding:'12px 16px',marginBottom:20,border:'1px solid #fecaca' }}>
                <span style={{ fontSize:13,color:'#64748b' }}>Stock actuel</span>
                <span style={{ fontWeight:700,color:'#e74a3b',fontSize:15 }}>{restockModal.med.current_stock} unités</span>
              </div>
              <label style={{ fontSize:12,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:8 }}>Quantité à ajouter</label>
              <input type="number" min="1" placeholder="ex: 30" value={restockQty} onChange={e => setRestockQty(e.target.value)} autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmRestock()}
                style={{ width:'100%',padding:'12px 16px',borderRadius:12,border:'1.5px solid #e2e8f0',fontSize:16,fontWeight:600,outline:'none',background:'#f8f9fb',color:'#0f172a',marginBottom:16,boxSizing:'border-box' }} />
              {restockQty && parseInt(restockQty) > 0 && (
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f0fdf4',borderRadius:12,padding:'12px 16px',marginBottom:20,border:'1px solid #bbf7d0' }}>
                  <span style={{ fontSize:13,color:'#64748b' }}>Nouveau stock</span>
                  <span style={{ fontWeight:700,color:'#059669',fontSize:15 }}>{(restockModal.med.current_stock ?? 0) + parseInt(restockQty)} unités</span>
                </div>
              )}
              <div style={{ display:'flex',gap:8,marginBottom:24,flexWrap:'wrap' }}>
                {[7,14,28,30,60,90].map(q => (
                  <button key={q} onClick={() => setRestockQty(String(q))} style={{
                    flex:1,minWidth:44,border:`1.5px solid ${restockQty===String(q)?'#e74a3b':'#e2e8f0'}`,borderRadius:10,padding:'7px 4px',
                    fontSize:13,fontWeight:600,cursor:'pointer',background:restockQty===String(q)?'#fff0ee':'#fff',
                    color:restockQty===String(q)?'#e74a3b':'#475569',transition:'all 0.15s',
                  }}>+{q}</button>
                ))}
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={() => setRestockModal(null)} style={{ flex:1,border:'1.5px solid #e2e8f0',borderRadius:12,padding:'11px',fontSize:13,fontWeight:600,cursor:'pointer',background:'#fff',color:'#64748b' }}>Annuler</button>
                <button onClick={confirmRestock} disabled={restocking || !restockQty || parseInt(restockQty)<=0}
                  style={{ flex:2,border:'none',borderRadius:12,padding:'11px',fontSize:13,fontWeight:700,
                    cursor:restocking||!restockQty||parseInt(restockQty)<=0?'not-allowed':'pointer',
                    background:!restockQty||parseInt(restockQty)<=0?'#e2e8f0':'#e74a3b',
                    color:!restockQty||parseInt(restockQty)<=0?'#94a3b8':'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:restocking?0.8:1 }}>
                  {restocking ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}></span>Enregistrement…</> : <><i className="bi bi-check2-circle"></i> Confirmer</>}
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