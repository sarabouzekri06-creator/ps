import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useReminderNotifications } from './useReminderNotifications';

const BASE = 'http://127.0.0.1:8000';
const tkn  = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${tkn()}`, Accept: 'application/json' });

// ─── Modal saisie mesure ──────────────────────────────────────────────────────
const SaisieModal = ({ notif, onClose, onSaved }) => {
  const [value,  setValue]  = useState('');
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!value.trim()) return;
    setSaving(true);
    axios.post(`${BASE}/api/measures/result`, {
      measure_id: notif.itemId,
      value,
      note,
    }, { headers: hdrs() })
    .then(() => {
      onSaved(notif.id);
      onClose();
    })
    .catch(() => alert('Erreur lors de la saisie'))
    .finally(() => setSaving(false));
  };

  return (
    <div className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div style={{ height: 5, background: notif.color }} />
          <div className="modal-header border-0 p-4 pb-2">
            <div>
              <h5 className="fw-bold mb-0">
                <i className="bi bi-clipboard2-pulse me-2" style={{ color: notif.color }} />
                {notif.name}
              </h5>
              <small className="text-muted">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </small>
            </div>
            <button className="btn-close ms-auto" onClick={onClose} />
          </div>
          <div className="modal-body px-4 pb-2">
            <label className="form-label fw-bold small text-uppercase text-muted">Valeur mesurée</label>
            <input
              className="form-control form-control-lg bg-light border-0 rounded-3 mb-3"
              type="number"
              placeholder={notif.unit ? `ex: 1.2 ${notif.unit}` : 'ex: 120'}
              value={value}
              onChange={e => setValue(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <label className="form-label fw-bold small text-uppercase text-muted">Note (optionnelle)</label>
            <textarea
              className="form-control bg-light border-0 rounded-3"
              rows={2}
              placeholder="Ex : à jeun, après exercice…"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
          <div className="modal-footer border-0 px-4 pb-4 gap-2">
            <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>
              Plus tard
            </button>
            <button
              className="btn rounded-pill flex-grow-1 fw-bold text-white"
              style={{ background: notif.color }}
              onClick={handleSave}
              disabled={!value.trim() || saving}>
              {saving
                ? <><i className="bi bi-hourglass-split me-1" />Enregistrement…</>
                : <><i className="bi bi-check2-circle me-1" />Enregistrer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Toast card ───────────────────────────────────────────────────────────────
const ToastCard = ({ notif, onDismiss, onMedDone, onMeasureOpen }) => (
  <div style={{
    background:   '#fff',
    borderRadius: 16,
    boxShadow:    '0 8px 32px rgba(0,0,0,0.15)',
    padding:      '14px 16px',
    minWidth:     320,
    maxWidth:     360,
    borderLeft:   `4px solid ${notif.isMissed ? '#e74a3b' : notif.color}`,
    marginBottom: 10,
    animation:    'slideIn 0.3s ease',
  }}>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      {/* Icône */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: `${notif.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`bi ${notif.type === 'med' ? 'bi-capsule' : 'bi-clipboard2-pulse'}`}
          style={{ color: notif.color, fontSize: 15 }} />
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1d2e' }}>{notif.name}</span>
          {/* Badge En retard */}
          {notif.isMissed && (
            <span style={{
              background: '#e74a3b', color: '#fff',
              borderRadius: 20, padding: '1px 8px',
              fontSize: 10, fontWeight: 700,
            }}>En retard</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {notif.subtext} · {notif.time}
        </div>
      </div>

      {/* Fermer */}
      <button
        onClick={() => onDismiss(notif.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: 0 }}>
        <i className="bi bi-x" />
      </button>
    </div>

    {/* Actions */}
    <div style={{ display: 'flex', gap: 8 }}>
      {notif.type === 'med' ? (
        <button
          onClick={() => onMedDone(notif)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 20,
            background: notif.color, color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
          }}>
          <i className="bi bi-check2 me-1" />Pris
        </button>
      ) : (
        <button
          onClick={() => onMeasureOpen(notif)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 20,
            background: notif.color, color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
          }}>
          <i className="bi bi-pencil me-1" />Saisir
        </button>
      )}
      <button
        onClick={() => onDismiss(notif.id)}
        style={{
          padding: '7px 16px', borderRadius: 20,
          background: '#f3f4f6', color: '#6b7280',
          border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>
        Plus tard
      </button>
    </div>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
const GlobalReminderToast = () => {
  const [toasts,      setToasts]      = useState([]);
  const [saisieNotif, setSaisieNotif] = useState(null);

  // Ajouter un toast
  const addToast = useCallback((notif) => {
    setToasts(prev => {
      if (prev.find(t => t.id === notif.id)) return prev;
      return [...prev, notif];
    });
  }, []);

  useReminderNotifications(addToast);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

 const handleMedDone = useCallback((notif) => {
    axios.post(`${BASE}/api/takes/${notif.takeId}/done`, {}, { headers: hdrs() })
    .then(() => {
        dismissToast(notif.id);
        // ✅ Émettre un event pour rafraîchir tous les composants
        window.dispatchEvent(new CustomEvent('reminder-done', {
            detail: { type: 'med', takeId: notif.takeId }
        }));
    })
    .catch(e => console.error(e));
}, [dismissToast]);
  const handleMeasureOpen = useCallback((notif) => {
    setSaisieNotif(notif);
  }, []);

  const handleMeasureSaved = useCallback((id) => {
    dismissToast(id);
    // ✅ Émettre un event pour rafraîchir
    window.dispatchEvent(new CustomEvent('reminder-done', {
        detail: { type: 'measure' }
    }));
}, [dismissToast]);

  if (toasts.length === 0 && !saisieNotif) return null;

  return (
    <>
      {/* ── Zone toasts — coin bas droit ── */}
      <div style={{
        position:       'fixed',
        bottom:         24,
        right:          24,
        zIndex:         9998,
        display:        'flex',
        flexDirection:  'column-reverse',
        maxHeight:      '80vh',
        overflowY:      'auto',
      }}>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(120%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {toasts.map(notif => (
          <ToastCard
            key={notif.id}
            notif={notif}
            onDismiss={dismissToast}
            onMedDone={handleMedDone}
            onMeasureOpen={handleMeasureOpen}
          />
        ))}
      </div>

      {/* ── Modal saisie mesure ── */}
      {saisieNotif && (
        <SaisieModal
          notif={saisieNotif}
          onClose={() => setSaisieNotif(null)}
          onSaved={handleMeasureSaved}
        />
      )}
    </>
  );
};

export default GlobalReminderToast;