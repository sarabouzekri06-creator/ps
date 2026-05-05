import { useState } from 'react';
import toast from 'react-hot-toast';

const MEASURE_META = {
    tension:  { icon: 'bi-heart-pulse',  color: '#e74a3b' },
    glycémie: { icon: 'bi-droplet-fill', color: '#f6a935' },
    poids:    { icon: 'bi-person',        color: '#4e73df' },
    pouls:    { icon: 'bi-activity',      color: '#1cc88a' },
    default:  { icon: 'bi-activity',      color: '#6f42c1' },
};

export const getMeta = (name = '') => {
    const key = Object.keys(MEASURE_META).find(k => name.toLowerCase().includes(k));
    return MEASURE_META[key] ?? MEASURE_META.default;
};

// ─── Modal Saisie ─────────────────────────────────────────────────────────────
export const SaisieModal = ({ mesure, onClose, onSave }) => {
    const [value, setValue] = useState('');
    const [note, setNote]   = useState('');
    const [saving, setSaving] = useState(false);
    const meta = getMeta(mesure.name);
    const handleSave = async () => {
        if (!value.trim()) { toast.error('Saisissez une valeur'); return; }
        setSaving(true);
        try { await onSave(mesure.id, value, note); onClose(); }
        finally { setSaving(false); }
    };
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div style={{ height: 5, background: meta.color }} />
                    <div className="modal-header border-0 p-4 pb-2">
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                style={{ width: 44, height: 44, background: meta.color }}>
                                <i className={`bi ${meta.icon} fs-5`} />
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0">Saisir — {mesure.name}</h5>
                                <small className="text-muted">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</small>
                            </div>
                        </div>
                        <button className="btn-close ms-auto" onClick={onClose} />
                    </div>
                    <div className="modal-body px-4 pb-2">
                        <label className="form-label fw-bold small text-uppercase text-muted">Valeur mesurée</label>
                        <input className="form-control form-control-lg bg-light border-0 rounded-3 mb-1"
                            type="text" placeholder={mesure.unit ? `ex: 12 ${mesure.unit}` : 'ex: 12/8'}
                            value={value} onChange={e => setValue(e.target.value)}
                            autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        <p className="text-muted small mb-3">
                            <i className="bi bi-info-circle me-1" />
                            {mesure.instruction ?? `Unité : ${mesure.unit ?? '—'}`}
                            {mesure.maxTarget && <span className="ms-2 text-danger">· Max : {mesure.maxTarget} {mesure.unit}</span>}
                            {mesure.minTarget && <span className="ms-2 text-warning">· Min : {mesure.minTarget} {mesure.unit}</span>}
                        </p>
                        <label className="form-label fw-bold small text-uppercase text-muted">Note (optionnelle)</label>
                        <textarea className="form-control bg-light border-0 rounded-3" rows={2}
                            placeholder="Ex : à jeun, après exercice…" value={note}
                            onChange={e => setNote(e.target.value)} style={{ resize: 'none' }} />
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 gap-2">
                        <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>Annuler</button>
                        <button className="btn rounded-pill flex-grow-1 fw-bold text-white" style={{ background: meta.color }}
                            onClick={handleSave} disabled={!value.trim() || saving}>
                            {saving ? <><i className="bi bi-hourglass-split me-1" />Enregistrement…</> : <><i className="bi bi-check2-circle me-1" />Enregistrer</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Suppression mesure ─────────────────────────────────────────────────
export const DeleteModal = ({ mesure, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);
    const handleConfirm = async () => {
        setDeleting(true);
        try { await onConfirm(mesure.id); onClose(); }
        finally { setDeleting(false); }
    };
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div style={{ height: 5 }} className="bg-danger" />
                    <div className="modal-body text-center px-5 py-4">
                        <div className="rounded-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: 64, height: 64 }}>
                            <i className="bi bi-trash3-fill text-danger fs-4" />
                        </div>
                        <h5 className="fw-bold mb-2">Supprimer "{mesure.name}" ?</h5>
                        <p className="text-muted small">Toutes les données seront supprimées définitivement.</p>
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 gap-2">
                        <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>Annuler</button>
                        <button className="btn btn-danger rounded-pill flex-grow-1 fw-bold" onClick={handleConfirm} disabled={deleting}>
                            {deleting ? <><i className="bi bi-hourglass-split me-1" />Suppression…</> : <><i className="bi bi-trash3 me-1" />Supprimer définitivement</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Modifier valeur ────────────────────────────────────────────────────
export const EditResultModal = ({ result, mesure, onClose, onSave }) => {
    const [value, setValue] = useState(String(result.valeur ?? ''));
    const [note, setNote]   = useState(result.note ?? '');
    const [saving, setSaving] = useState(false);
    const meta = getMeta(mesure.name);
    const handleSave = async () => {
        if (!value.trim()) { toast.error('Saisissez une valeur'); return; }
        setSaving(true);
        try { await onSave(result.id, value, note); onClose(); }
        finally { setSaving(false); }
    };
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div style={{ height: 5, background: meta.color }} />
                    <div className="modal-header border-0 p-4 pb-2">
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                style={{ width: 44, height: 44, background: meta.color }}>
                                <i className={`bi ${meta.icon} fs-5`} />
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0">Modifier — {mesure.name}</h5>
                                <small className="text-muted">{result.day} à {result.time}</small>
                            </div>
                        </div>
                        <button className="btn-close ms-auto" onClick={onClose} />
                    </div>
                    <div className="modal-body px-4 pb-2">
                        <label className="form-label fw-bold small text-uppercase text-muted">Valeur mesurée</label>
                        <input className="form-control form-control-lg bg-light border-0 rounded-3 mb-3"
                            type="text" value={value} onChange={e => setValue(e.target.value)}
                            autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        <label className="form-label fw-bold small text-uppercase text-muted">Note (optionnelle)</label>
                        <textarea className="form-control bg-light border-0 rounded-3" rows={2}
                            value={note} onChange={e => setNote(e.target.value)}
                            style={{ resize: 'none' }} placeholder="Ex : à jeun, après exercice…" />
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 gap-2">
                        <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>Annuler</button>
                        <button className="btn rounded-pill flex-grow-1 fw-bold text-white" style={{ background: meta.color }}
                            onClick={handleSave} disabled={!value.trim() || saving}>
                            {saving ? <><i className="bi bi-hourglass-split me-1" />Enregistrement…</> : <><i className="bi bi-check2-circle me-1" />Mettre à jour</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Supprimer valeur ───────────────────────────────────────────────────
export const DeleteResultModal = ({ result, mesure, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);
    const handleConfirm = async () => {
        setDeleting(true);
        try { await onConfirm(result.id); onClose(); }
        finally { setDeleting(false); }
    };
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div style={{ height: 5 }} className="bg-danger" />
                    <div className="modal-body text-center px-5 py-4">
                        <div className="rounded-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: 64, height: 64 }}>
                            <i className="bi bi-trash3-fill text-danger fs-4" />
                        </div>
                        <h5 className="fw-bold mb-2">Supprimer cette valeur ?</h5>
                        <p className="text-muted small mb-1"><strong>{result.valeur} {mesure.unit}</strong> — {result.day} à {result.time}</p>
                        <p className="text-muted small">Cette action est irréversible.</p>
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 gap-2">
                        <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>Annuler</button>
                        <button className="btn btn-danger rounded-pill flex-grow-1 fw-bold" onClick={handleConfirm} disabled={deleting}>
                            {deleting ? <><i className="bi bi-hourglass-split me-1" />Suppression…</> : <><i className="bi bi-trash3 me-1" />Supprimer</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Modifier note ──────────────────────────────────────────────────────
export const EditNoteModal = ({ result, mesure, onClose, onSave }) => {
    const [note, setNote]     = useState(result.note ?? '');
    const [saving, setSaving] = useState(false);
    const meta = getMeta(mesure.name);
    const handleSave = async () => {
        setSaving(true);
        try { await onSave(result.id, result.valeur, note); onClose(); }
        finally { setSaving(false); }
    };
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div style={{ height: 5, background: meta.color }} />
                    <div className="modal-header border-0 p-4 pb-2">
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                style={{ width: 44, height: 44, background: meta.color }}>
                                <i className="bi bi-chat-left-text fs-5" />
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0">Modifier la note</h5>
                                <small className="text-muted">{result.valeur} {mesure.unit} — {result.day} à {result.time}</small>
                            </div>
                        </div>
                        <button className="btn-close ms-auto" onClick={onClose} />
                    </div>
                    <div className="modal-body px-4 pb-2">
                        <textarea className="form-control bg-light border-0 rounded-3" rows={3}
                            value={note} onChange={e => setNote(e.target.value)}
                            autoFocus style={{ resize: 'none' }} placeholder="Entrez votre note…" />
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 gap-2">
                        <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>Annuler</button>
                        <button className="btn rounded-pill flex-grow-1 fw-bold text-white" style={{ background: meta.color }}
                            onClick={handleSave} disabled={saving}>
                            {saving ? <><i className="bi bi-hourglass-split me-1" />Enregistrement…</> : <><i className="bi bi-check2-circle me-1" />Mettre à jour</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Supprimer note ─────────────────────────────────────────────────────
export const DeleteNoteModal = ({ result, mesure, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);
    const handleConfirm = async () => {
        setDeleting(true);
        try { await onConfirm(result.id, result.valeur); onClose(); }
        finally { setDeleting(false); }
    };
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div style={{ height: 5 }} className="bg-warning" />
                    <div className="modal-body text-center px-5 py-4">
                        <div className="rounded-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: 64, height: 64 }}>
                            <i className="bi bi-chat-left-text text-warning fs-4" />
                        </div>
                        <h5 className="fw-bold mb-2">Supprimer cette note ?</h5>
                        <p className="text-muted small mb-1 fst-italic">"{result.note}"</p>
                        <p className="text-muted small">La valeur <strong>{result.valeur} {mesure.unit}</strong> sera conservée.</p>
                    </div>
                    <div className="modal-footer border-0 px-4 pb-4 gap-2">
                        <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={onClose}>Annuler</button>
                        <button className="btn btn-warning rounded-pill flex-grow-1 fw-bold" onClick={handleConfirm} disabled={deleting}>
                            {deleting ? <><i className="bi bi-hourglass-split me-1" />Suppression…</> : <><i className="bi bi-trash3 me-1" />Supprimer la note</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};