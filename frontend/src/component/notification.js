import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './notification.css';

const BASE = 'http://127.0.0.1:8000';
const tkn  = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${tkn()}`, Accept: 'application/json' });

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const timeAgo = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const then = new Date(); then.setHours(h, m, 0, 0);
  const diff = Math.floor((new Date() - then) / 60000);
  if (diff < 1)  return 'maintenant';
  if (diff < 60) return `${diff} min`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24)  return `${hrs} hr`;
  return `${Math.floor(hrs / 24)} jr`;
};

const isPast = (t) => t < nowHHMM();

const offsetToDate = (offset) => {
  const d = new Date(); d.setDate(d.getDate() + offset); return d;
};
const offsetToDateStr = (offset) => {
  const d = offsetToDate(offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const todayStr = offsetToDateStr(0);
const ALL_OFFSETS = [0, -1, -2, -3];

const dateLabel = (offset) => {
  if (offset ===  0) return "Aujourd'hui";
  if (offset === -1) return 'Hier';
  const d = offsetToDate(offset);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const shouldTakeOnDate = (entity, dateStr) => {
  const date    = new Date(dateStr + 'T00:00:00');
  const JOURS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const jourNom = JOURS[date.getDay()];
  switch (entity.frequency_type) {
    case 'daily':   return true;
    case 'weekly':  return Array.isArray(entity.frequency_days) && entity.frequency_days.includes(jourNom);
    case 'monthly': return date.getDate() === (entity.frequency_days?.day ?? 1);
    default:        return true;
  }
};

const pctColor = (pct) =>
  pct === 100 ? '#1cc88a' : pct >= 50 ? '#f6a935' : '#e74a3b';

const measureColor = (severity) => {
  if (severity === 'High')     return '#e74a3b';
  if (severity === 'Moderate') return '#f6a623';
  return '#1cc88a';
};

const Notification = () => {
  const [dateCache,    setDateCache]    = useState({});
  const [loadingSet,   setLoadingSet]   = useState(new Set());
  const [saisieModal,  setSaisieModal]  = useState(null); // { itemId, name, unit }
  const [saisieValue,  setSaisieValue]  = useState('');
  const [saisieNote,   setSaisieNote]   = useState('');
  const [saving,       setSaving]       = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchForDate = useCallback(async (dateStr, force = false) => {
    if (!force && dateCache[dateStr]) return;
    setLoadingSet(p => new Set([...p, dateStr]));
    try {
      const res = await axios.get(`${BASE}/api/dashboard-data`, {
        headers: hdrs(), params: { date: dateStr },
      });
      setDateCache(prev => ({ ...prev, [dateStr]: res.data }));
    } catch (e) { console.error(e); }
    finally {
      setLoadingSet(p => { const s = new Set(p); s.delete(dateStr); return s; });
    }
  }, [dateCache]);

  useEffect(() => {
    ALL_OFFSETS.forEach(offset => fetchForDate(offsetToDateStr(offset), offset === 0));
  }, []);

  // ── Marquer médicament comme pris ────────────────────────────────────
  const markMedDone = async (takeId) => {
    try {
      await axios.post(`${BASE}/api/takes/${takeId}/done`, {}, { headers: hdrs() });
    } catch (e) { console.error(e); }
    fetchForDate(todayStr, true);
  };

  // ── Ouvrir modal saisie mesure ────────────────────────────────────────
  const openSaisie = (notif) => {
    setSaisieModal({ itemId: notif.itemId, name: notif.name, unit: notif.unit });
    setSaisieValue('');
    setSaisieNote('');
  };

  // ── Sauvegarder la valeur mesure ──────────────────────────────────────
  const saveMeasure = async () => {
    if (!saisieValue.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${BASE}/api/measures/result`, {
        measure_id: saisieModal.itemId,
        value:      saisieValue,
        note:       saisieNote,
      }, { headers: hdrs() });
      setSaisieModal(null);
      fetchForDate(todayStr, true);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la saisie');
    } finally {
      setSaving(false);
    }
  };

  // ── Construire les items d'un jour ────────────────────────────────────
  const buildItems = (data, dateStr, isToday) => {
    if (!data) return [];
    const items = [];

    // Médicaments
    (data.medications ?? [])
      .filter(med => shouldTakeOnDate(med, dateStr))
      .forEach(med => {
        (med.takes ?? []).forEach(take => {
          const time   = (take.take_time ?? '00:00').substring(0, 5);
          const isDone = take.status === 'done';
          const isLate = !isDone && (!isToday || isPast(time));
          if (isToday && isDone) return;
          items.push({
            id:      `med-${take.id}-${dateStr}`,
            takeId:  take.id,
            type:    'med',
            name:    med.medication_name,
            unit:    take.unit ?? 'Pill(s)',
            subtext: `${take.dose ?? 1} ${take.unit ?? 'Pill(s)'}`,
            time, color: med.reminder_color ?? '#4e73df',
            imgPath: med.medication_image ?? null,
            isDone, isLate,
          });
        });
      });

    // Mesures
    (data.measures ?? [])
      .filter(mes => shouldTakeOnDate(mes, dateStr))
      .forEach(mes => {
        (mes.takes ?? []).forEach(take => {
          const time      = (take.take_time ?? '00:00').substring(0, 5);
          const dateShort = new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          const isDone    = (mes.history ?? []).some(h => h.day === dateShort);
          const isLate    = !isDone && (!isToday || isPast(time));
          if (isToday && isDone) return;
          items.push({
            id:      `mes-${take.id ?? mes.id}-${time}-${dateStr}`,
            takeId:  take.id,
            itemId:  mes.id,
            type:    'measure',
            name:    mes.disease_name,
            unit:    mes.unit ?? '',
            subtext: `${take.label ?? 'Mesure'}${mes.unit ? ' · ' + mes.unit : ''} · ${
              mes.severity === 'High' ? 'Sévère' :
              mes.severity === 'Moderate' ? 'Modérée' : 'Légère'
            }`,
            time, color: measureColor(mes.severity),
            imgPath: null,
            isDone, isLate,
          });
        });
      });

    return items.sort((a, b) => a.time.localeCompare(b.time));
  };

  // ── Groupes ───────────────────────────────────────────────────────────
  const groups = ALL_OFFSETS.map(offset => {
    const dateStr  = offsetToDateStr(offset);
    const isToday  = offset === 0;
    const data     = dateCache[dateStr];
    const items    = buildItems(data, dateStr, isToday);
    const allItems = data ? buildItems(data, dateStr, false) : [];
    const done     = allItems.filter(i => i.isDone).length;
    const total    = allItems.length;
    const pending  = isToday ? items.length : 0;
    const missed   = !isToday ? items.filter(i => !i.isDone).length : 0;
    const pct      = total === 0 ? null : Math.round((done / total) * 100);
    return {
      offset, dateStr, isToday,
      label: dateLabel(offset),
      items, done, total, pending, missed, pct,
      isLoading: loadingSet.has(dateStr),
    };
  });

  const todayGroup    = groups[0];
  const historyGroups = groups.slice(1);

  return (
    <div className="nf-page">
      <div className="nf-container">

        {/* ══ HEADER ══ */}
        <div className="nf-header">
          <div>
            <h1 className="nf-title">Notifications</h1>
            <p className="nf-subtitle">
              {todayGroup.pending} rappel{todayGroup.pending !== 1 ? 's' : ''} restant{todayGroup.pending !== 1 ? 's' : ''} aujourd'hui
            </p>
          </div>
          <button className="nf-gear"><i className="bi bi-gear"></i></button>
        </div>

        {/* ══ AUJOURD'HUI ══ */}
        <div className="nf-section-label nf-section-today">
          <span><i className="bi bi-bell-fill me-2"></i>Aujourd'hui</span>
          {todayGroup.pending > 0 && (
            <span className="nf-count-badge">{todayGroup.pending} à prendre</span>
          )}
        </div>

        {todayGroup.isLoading && <div className="nf-loading"><div className="nf-spinner"></div></div>}

        {!todayGroup.isLoading && todayGroup.items.length === 0 && (
          <div className="nf-empty">
            <div className="nf-empty-circle">
              <i className="bi bi-check-circle-fill"></i>
              <span className="nf-zzz">z z z</span>
            </div>
            <h3 className="nf-empty-title">Tout est à jour !</h3>
            <p className="nf-empty-sub">Tous vos rappels du jour ont été pris.</p>
          </div>
        )}

        {!todayGroup.isLoading && todayGroup.items.map((notif, idx) => (
          <NfCard
            key={notif.id}
            notif={notif}
            idx={idx}
            isToday={true}
            isPastDay={false}
            onMedDone={markMedDone}
            onMeasureSaisie={openSaisie}
          />
        ))}

        {/* ══ HISTORIQUE ══ */}
        <div className="nf-section-label nf-section-history" style={{ marginTop: '1.5rem' }}>
          <span><i className="bi bi-clock-history me-2"></i>Historique récent</span>
        </div>

        {historyGroups.map(group => (
          <div key={group.dateStr} style={{ marginBottom: '1.25rem' }}>
            <div className="nf-group-header">
              <span className="nf-group-label">{group.label}</span>
              <div className="nf-group-stats">
                {group.total > 0 && (
                  <>
                    <span style={{ color: '#1cc88a', fontWeight: 600, fontSize: 12 }}>
                      {group.done} fait{group.done > 1 ? 's' : ''}
                    </span>
                    {group.missed > 0 && (
                      <span style={{ color: '#e74a3b', fontWeight: 600, fontSize: 12 }}>
                        {group.missed} manqué{group.missed > 1 ? 's' : ''}
                      </span>
                    )}
                    {group.pct !== null && (
                      <span className="nf-pct-badge"
                        style={{ background: `${pctColor(group.pct)}18`, color: pctColor(group.pct) }}>
                        {group.pct}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {group.total > 0 && (
              <div className="nf-progress-track">
                <div className="nf-progress-fill"
                  style={{ width: `${group.pct}%`, background: pctColor(group.pct) }} />
              </div>
            )}

            {group.isLoading && <div className="nf-loading"><div className="nf-spinner"></div></div>}
            {!group.isLoading && group.items.length === 0 && (
              <div className="nf-empty-day">Aucun rappel ce jour</div>
            )}
            {!group.isLoading && group.items.map((notif, idx) => (
              <NfCard
                key={notif.id}
                notif={notif}
                idx={idx}
                isToday={false}
                isPastDay={true}
                onMedDone={null}
                onMeasureSaisie={null}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ══ MODAL SAISIE MESURE ══ */}
      {saisieModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={e => e.target === e.currentTarget && setSaisieModal(null)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div style={{ height: 5, background: '#4e73df' }} />
              <div className="modal-header border-0 p-4 pb-2">
                <div>
                  <h5 className="fw-bold mb-0">Saisir — {saisieModal.name}</h5>
                  <small className="text-muted">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </small>
                </div>
                <button className="btn-close ms-auto" onClick={() => setSaisieModal(null)} />
              </div>
              <div className="modal-body px-4 pb-2">
                <label className="form-label fw-bold small text-uppercase text-muted">Valeur mesurée</label>
                <input
                  className="form-control form-control-lg bg-light border-0 rounded-3 mb-3"
                  type="number"
                  placeholder={saisieModal.unit ? `ex: 1.2 ${saisieModal.unit}` : 'ex: 120'}
                  value={saisieValue}
                  onChange={e => setSaisieValue(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveMeasure()}
                />
                <label className="form-label fw-bold small text-uppercase text-muted">Note (optionnelle)</label>
                <textarea
                  className="form-control bg-light border-0 rounded-3"
                  rows={2}
                  placeholder="Ex : à jeun, après exercice…"
                  value={saisieNote}
                  onChange={e => setSaisieNote(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              <div className="modal-footer border-0 px-4 pb-4 gap-2">
                <button className="btn btn-light rounded-pill flex-grow-1 fw-bold"
                  onClick={() => setSaisieModal(null)}>Annuler</button>
                <button className="btn btn-primary rounded-pill flex-grow-1 fw-bold"
                  onClick={saveMeasure}
                  disabled={!saisieValue.trim() || saving}>
                  {saving
                    ? <><i className="bi bi-hourglass-split me-1" />Enregistrement…</>
                    : <><i className="bi bi-check2-circle me-1" />Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Card réutilisable ── */
const NfCard = ({ notif, idx, isToday, isPastDay, onMedDone, onMeasureSaisie }) => {
  const icon = notif.type === 'med' ? 'bi-capsule' : 'bi-clipboard2-pulse';
  const imgUrl = notif.imgPath
    ? (notif.imgPath.startsWith('http') ? notif.imgPath : `${BASE}/storage/${notif.imgPath}`)
    : null;

  return (
    <div
      className={`nf-card ${notif.isLate && !notif.isDone ? 'nf-card-late' : ''} ${notif.isDone ? 'nf-card-done' : ''}`}
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      {!notif.isDone && (
        <span className="nf-dot" style={{ background: notif.isLate ? '#e74a3b' : notif.color }} />
      )}

      {/* Icône */}
      <div className="nf-icon" style={{ background: `${notif.color}20` }}>
        {imgUrl ? (
          <>
            <img src={imgUrl} alt=""
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <i className={`bi ${icon}`} style={{ color: notif.color, display: 'none' }} />
          </>
        ) : (
          <i className={`bi ${icon}`} style={{ color: notif.color }} />
        )}
      </div>

      {/* Contenu */}
      <div className="nf-content">
        <div className="nf-row">
          <span className="nf-name">{notif.name}</span>
          <span className={`nf-time ${notif.isLate && !notif.isDone ? 'nf-time-late' : ''}`}>
            {notif.isDone
              ? <span style={{ color: '#1cc88a' }}>Fait ✓</span>
              : isToday && isPast(notif.time) ? timeAgo(notif.time) : notif.time}
          </span>
        </div>

        <p className="nf-sub">
          {notif.subtext}
          {notif.isLate && !notif.isDone && <span className="nf-badge nf-badge-late">En retard</span>}
          {isPastDay && notif.isDone  && <span className="nf-badge nf-badge-done">Fait</span>}
          {isPastDay && !notif.isDone && <span className="nf-badge nf-badge-missed">Manqué</span>}
        </p>

        <div className="nf-actions">
          {isToday && !notif.isDone && (
            <>
              {notif.type === 'med' ? (
                <button className="nf-btn-done" onClick={() => onMedDone(notif.takeId)}>
                  <i className="bi bi-check2 me-1" />Marquer comme pris
                </button>
              ) : (
                <button className="nf-btn-done" onClick={() => onMeasureSaisie(notif)}>
                  <i className="bi bi-pencil me-1" />Saisir la mesure
                </button>
              )}
              <span className="nf-sep">·</span>
              {/* Plus tard — masque la carte jusqu'au prochain rechargement */}
              <button className="nf-btn-skip"
                onClick={() => {
                  // On retire visuellement l'item du cache local sans appel API
                  const el = document.getElementById(`nf-card-${notif.id}`);
                  if (el) el.style.display = 'none';
                }}>
                Plus tard
              </button>
            </>
          )}
          {notif.isDone && (
            <span className="nf-done-label">
              <i className="bi bi-check-circle-fill me-1" />Complété
            </span>
          )}
          {isPastDay && !notif.isDone && (
            <span className="nf-missed-label">
              <i className="bi bi-x-circle me-1" />Non effectué
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;