import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://127.0.0.1:8000';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const toHHMM = (t = '') => t.substring(0, 5);
const ITEMS_PER_PAGE = 5;

const isPast = (timeStr) => {
    const [h, m] = toHHMM(timeStr).split(':').map(Number);
    const now = new Date();
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
};

const isFutureTime = (timeStr) => {
    const [h, m] = toHHMM(timeStr).split(':').map(Number);
    const now = new Date();
    return now.getHours() < h || (now.getHours() === h && now.getMinutes() < m);
};

const compareTime = (a, b) => (a.take_time || '').localeCompare(b.take_time || '');

const shouldTakeOnDate = (entity, dateStr) => {
    const date       = new Date(dateStr + 'T00:00:00');
    const JOURS      = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const jourNom    = JOURS[date.getDay()];
    const dayOfMonth = date.getDate();
    const month      = date.getMonth();
    const fd         = entity.frequency_days ?? {};
    const targetDay  = fd?.day ?? 1;
    const startMonth = entity.start_day
        ? new Date(entity.start_day + 'T00:00:00').getMonth()
        : 0;

    switch (entity.frequency_type) {
        case 'daily':        return true;
        case 'weekly':       return Array.isArray(fd)
            ? fd.includes(jourNom)
            : (Array.isArray(entity.frequency_days) && entity.frequency_days.includes(jourNom));
        case 'monthly':      return dayOfMonth === targetDay;
        case 'every2months': return dayOfMonth === targetDay && ((month - startMonth) % 2 + 2) % 2 === 0;
        case 'quarterly':    return dayOfMonth === targetDay && ((month - startMonth) % 3 + 3) % 3 === 0;
        default:             return true;
    }
};

const buildWeek = (offsetWeeks = 0) => {
    const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();
    const dow   = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + 1 + offsetWeeks * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            day:        JOURS[d.getDay()],
            date:       String(d.getDate()).padStart(2, '0'),
            fullDate:   d.toISOString().split('T')[0],
            monthLabel: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        };
    });
};

const pctColor = (pct) => pct === 100 ? '#1cc88a' : pct >= 50 ? '#f6a935' : '#e74a3b';
const sevColor = (s)   => s === 'High' ? '#e74a3b' : s === 'Moderate' ? '#f6a935' : '#1cc88a';

const SaisieModal = ({ mesure, onClose, onSave }) => {
    const [value,  setValue]  = useState('');
    const [note,   setNote]   = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!value.trim()) return;
        setSaving(true);
        try { await onSave(mesure.id, value, note); onClose(); }
        finally { setSaving(false); }
    };

    const color = sevColor(mesure.severity);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: 400, maxWidth: '92vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ height: 4, background: color }} />
                <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Saisir — {mesure.disease_name}</h3>
                            {mesure.unit && <small style={{ color: '#94a3b8' }}>Unité : {mesure.unit}</small>}
                        </div>
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 18 }}>×</button>
                    </div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Valeur mesurée</label>
                    <input
                        type="number"
                        placeholder={mesure.unit ? `ex: 1.2 ${mesure.unit}` : 'ex: 120'}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, fontWeight: 600, outline: 'none', background: '#f8f9fb', marginBottom: 12, boxSizing: 'border-box' }}
                    />
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Note (optionnelle)</label>
                    <textarea
                        placeholder="Ex : à jeun, après exercice…"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'none', background: '#f8f9fb', marginBottom: 16, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#64748b' }}>Annuler</button>
                        <button onClick={handleSave} disabled={!value.trim() || saving}
                            style={{ flex: 2, border: 'none', borderRadius: 12, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: color, color: '#fff', opacity: saving ? 0.7 : 1 }}>
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Modal confirmation notification push ──────────────────────────────────────
const NotifModal = ({ notifModal, onClose, onConfirmer, onSaisir }) => {
    const isMed = notifModal.type === 'medicament';
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff', borderRadius: 20, padding: 32,
                width: 340, maxWidth: '90vw', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {isMed ? '💊' : '📊'}
                </div>
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>
                    {isMed ? 'Avez-vous pris votre médicament ?' : 'Avez-vous fait votre mesure ?'}
                </h4>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                    {isMed
                        ? 'Confirmez la prise pour mettre à jour votre suivi.'
                        : 'Voulez-vous saisir votre mesure maintenant ?'}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12,
                            padding: '12px 0', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', background: '#fff', color: '#64748b'
                        }}>
                        ⏰ Plus tard
                    </button>
                    <button
                        onClick={isMed ? onConfirmer : onSaisir}
                        style={{
                            flex: 2, border: 'none', borderRadius: 12,
                            padding: '12px 0', fontSize: 14, fontWeight: 700,
                            cursor: 'pointer',
                            background: isMed ? '#1cc88a' : '#4e73df',
                            color: '#fff'
                        }}>
                        {isMed ? '✅ Oui, pris !' : '📝 Saisir maintenant'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [weekOffset,     setWeekOffset]     = useState(0);
    const [activeFullDate, setActiveFullDate] = useState(todayISO);
    const [dateCache,      setDateCache]      = useState({});
    const [loadingDate,    setLoadingDate]    = useState(null);
    const [fabOpen,        setFabOpen]        = useState(false);
    const [saisieModal,    setSaisieModal]    = useState(null);
    const [activeTab,      setActiveTab]      = useState('all');
    const [page,           setPage]           = useState(1);
    const [notifModal,     setNotifModal]     = useState(null);

    const [userCreatedAt, setUserCreatedAt] = useState(
        () => localStorage.getItem('user_created_at') ?? null
    );

    const weekDays = useMemo(() => buildWeek(weekOffset), [weekOffset]);

    const minWeekOffset = useMemo(() => {
        if (!userCreatedAt) return 0;
        const created = new Date(userCreatedAt + 'T00:00:00');
        const diffMs  = new Date() - created;
        return -Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    }, [userCreatedAt]);

    const fetchForDate = useCallback(async (dateStr, force = false) => {
        if (!force && dateCache[dateStr]) return;
        setLoadingDate(dateStr);
        try {
            const res = await axios.get(`${API}/api/dashboard-data`, {
                headers: authHeaders(),
                params:  { date: dateStr },
            });
            setDateCache(prev => ({ ...prev, [dateStr]: res.data }));
            if (res.data.user_created_at) {
                localStorage.setItem('user_created_at', res.data.user_created_at);
                setUserCreatedAt(res.data.user_created_at);
            }
        } catch (err) {
            console.error('Erreur dashboard:', err);
            toast.error('Impossible de charger les données');
        } finally {
            setLoadingDate(null);
        }
    }, [dateCache]);

    useEffect(() => {
        fetchForDate(todayISO, true);
        if (Notification.permission === 'default') Notification.requestPermission();
    }, []);

    useEffect(() => { fetchForDate(activeFullDate); }, [activeFullDate]);
    useEffect(() => { setPage(1); }, [activeFullDate, activeTab]);

    useEffect(() => {
        const handler = () => fetchForDate(todayISO, true);
        window.addEventListener('reminder-done', handler);
        return () => window.removeEventListener('reminder-done', handler);
    }, [fetchForDate, todayISO]);

    // ── UN SEUL useEffect pour les notifications push ─────────────────────────
    useEffect(() => {
        // Cas 1 : site était FERMÉ → URL contient take_id
        const params = new URLSearchParams(window.location.search);
        const takeId = params.get('take_id');
        const type   = params.get('type');
        if (takeId && type) {
            setNotifModal({ takeId, type });
            window.history.replaceState({}, '', '/');
        }

        // Cas 2 : site était OUVERT → recevoir message du service worker
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'NOTIF_CLICK') {
                const urlParams = new URLSearchParams(event.data.url.split('?')[1]);
                const tid = urlParams.get('take_id');
                const typ = urlParams.get('type');
                if (tid && typ) {
                    setNotifModal({ takeId: tid, type: typ });
                }
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, []);

    // ── Confirmer la prise depuis le modal ────────────────────────────────────
    const handleConfirmerPrise = async () => {
        try {
            await axios.post(
                `${API}/api/medicaments/${notifModal.takeId}/confirmer`,
                {},
                { headers: authHeaders() }
            );
            toast.success('✅ Prise confirmée !');
            fetchForDate(todayISO, true);
        } catch {
            toast.error('Erreur serveur');
        }
        setNotifModal(null);
    };

    // ── Ouvrir le modal saisie mesure ─────────────────────────────────────────
    const handleSaisirMesure = async () => {
        try {
            const res = await axios.get(
                `${API}/api/measure-take/${notifModal.takeId}`,
                { headers: authHeaders() }
            );
            setSaisieModal(res.data);
        } catch {
            toast.error('Erreur serveur');
        }
        setNotifModal(null);
    };

    const isToday      = activeFullDate === todayISO;
    const isPastDate   = activeFullDate < todayISO;
    const isFutureDate = activeFullDate > todayISO;

    const activeDateData = dateCache[activeFullDate];
    const todayData      = dateCache[todayISO] ?? { medications: [], measures: [] };

    const medTakes = useMemo(() => {
        if (!activeDateData) return [];
        const meds = isFutureDate
            ? (activeDateData.medications || []).map(m => ({ ...m, takes: (m.takes || []).map(t => ({ ...t, status: 'pending' })) }))
            : (activeDateData.medications || []);
        return meds
            .filter(med => shouldTakeOnDate(med, activeFullDate))
            .flatMap(med => (med.takes || []).map(take => ({
                ...take,
                _type:  'med',
                _name:  med.medication_name,
                _image: med.image,
                _color: med.reminder_color ?? '#4e73df',
                _med:   med,
            })))
            .sort(compareTime);
    }, [activeDateData, activeFullDate, isFutureDate]);

    const measureTakes = useMemo(() => {
        if (!activeDateData) return [];
        const measures = isFutureDate
            ? (activeDateData.measures || []).map(m => ({ ...m, takes: (m.takes || []).map(t => ({ ...t, status: 'pending' })) }))
            : (activeDateData.measures || []);
        return measures
            .filter(mes => shouldTakeOnDate({
                frequency_type: mes.frequency_type,
                frequency_days: mes.frequency_days,
                start_day:      mes.start_day,
            }, activeFullDate))
            .flatMap(mes => (mes.takes || []).map(take => ({
                ...take,
                _type:     'measure',
                _name:     mes.disease_name,
                _color:    sevColor(mes.severity),
                _severity: mes.severity,
                _unit:     mes.unit,
                _mes:      mes,
            })))
            .sort(compareTime);
    }, [activeDateData, activeFullDate, isFutureDate]);

    const allTakes = useMemo(() => {
        const combined = [...medTakes, ...measureTakes].sort(compareTime);
        if (activeTab === 'med')     return combined.filter(t => t._type === 'med');
        if (activeTab === 'measure') return combined.filter(t => t._type === 'measure');
        return combined;
    }, [medTakes, measureTakes, activeTab]);

    const totalPages = Math.ceil(allTakes.length / ITEMS_PER_PAGE);
    const pagedTakes = allTakes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const activeDayStats = useMemo(() => {
        const combined = [...medTakes, ...measureTakes];
        const total    = combined.length;
        const done     = combined.filter(t => t.status === 'done').length;
        const missed   = isPastDate ? combined.filter(t => t.status !== 'done').length : 0;
        const pct      = total === 0 ? null : Math.round((done / total) * 100);
        return { total, done, missed, pct };
    }, [medTakes, measureTakes, isPastDate]);

    const observance = useMemo(() => {
        const medT = (todayData.medications || [])
            .filter(m => shouldTakeOnDate(m, todayISO))
            .flatMap(m => m.takes || []);
        const mesT = (todayData.measures || [])
            .filter(m => shouldTakeOnDate({ frequency_type: m.frequency_type, frequency_days: m.frequency_days, start_day: m.start_day }, todayISO))
            .flatMap(m => m.takes || []);
        const all   = [...medT, ...mesT];
        const total = all.length;
        if (total === 0) return '—';
        return Math.round((all.filter(t => t.status === 'done').length / total) * 100) + '%';
    }, [todayData, todayISO]);

    const weekStats = useMemo(() => {
        const result = {};
        weekDays.forEach(d => {
            if (d.fullDate > todayISO) return;
            const cached = dateCache[d.fullDate];
            if (!cached) return;
            const medTk = (cached.medications || []).filter(m => shouldTakeOnDate(m, d.fullDate)).flatMap(m => m.takes || []);
            const mesTk = (cached.measures   || []).filter(m => shouldTakeOnDate({ frequency_type: m.frequency_type, frequency_days: m.frequency_days, start_day: m.start_day }, d.fullDate)).flatMap(m => m.takes || []);
            const all   = [...medTk, ...mesTk];
            if (all.length === 0) return;
            result[d.fullDate] = {
                total: all.length,
                done:  all.filter(t => t.status === 'done').length,
                pct:   Math.round((all.filter(t => t.status === 'done').length / all.length) * 100),
            };
        });
        return result;
    }, [weekDays, dateCache, todayISO]);

    const lowStocks = useMemo(() =>
        (todayData.medications || []).filter(m => m.current_stock <= (m.low_stock_alert ?? 5)),
    [todayData]);

    const statCards = useMemo(() => [
        { title: 'Observance',  val: observance,                            sub: "Méds + Mesures aujourd'hui", icon: 'graph-up-arrow',       color: '#4e73df', bg: '#eef2ff' },
        { title: 'Médicaments', val: (todayData.medications || []).length,   sub: 'Traitements actifs',         icon: 'capsule',              color: '#1cc88a', bg: '#eafaf1' },
        { title: 'Mesures',     val: (todayData.measures    || []).length,   sub: 'Suivis configurés',          icon: 'clipboard2-pulse',     color: '#6f42c1', bg: '#f5f0ff' },
        { title: 'Stocks bas',  val: lowStocks.length,                       sub: 'À renouveler',               icon: 'exclamation-triangle', color: '#e74a3b', bg: '#fff5f5' },
    ], [observance, todayData, lowStocks]);

    const markTakeDoneInCache = useCallback((takeId) => {
        setDateCache(prev => {
            const cached = prev[todayISO];
            if (!cached) return prev;
            const updateTakes = (list) =>
                (list || []).map(entity => ({
                    ...entity,
                    takes: (entity.takes || []).map(t =>
                        t.id === takeId ? { ...t, status: 'done' } : t
                    ),
                }));
            return {
                ...prev,
                [todayISO]: {
                    ...cached,
                    medications: updateTakes(cached.medications),
                    measures:    updateTakes(cached.measures),
                },
            };
        });
    }, [todayISO]);

    const markMedDone = useCallback(async (takeId) => {
        markTakeDoneInCache(takeId);
        try {
            await axios.post(`${API}/api/takes/${takeId}/done`, {}, { headers: authHeaders() });
            toast.success("C'est enregistré !", { id: 'med-done' });
        } catch {
            toast.error('Erreur serveur.');
            fetchForDate(todayISO, true);
        }
    }, [fetchForDate, todayISO, markTakeDoneInCache]);

    const saveMeasure = useCallback(async (measureId, value, note) => {
        await axios.post(`${API}/api/measures/result`, { measure_id: measureId, value, note }, { headers: authHeaders() });
        toast.success("Mesure enregistrée !", { id: 'mes-done' });
    }, []);

    const isLoadingActive = loadingDate === activeFullDate;

    if (!dateCache[todayISO]) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="fw-bold text-muted">Chargement de votre espace santé…</p>
            </div>
        </div>
    );

    const dateLabel = isToday
        ? "Aujourd'hui"
        : new Date(activeFullDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="container-fluid min-vh-100 bg-light py-4 px-xl-5" style={{ fontFamily: "'Inter', sans-serif" }}>

            <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Bonjour 👋</h2>
                    <p className="text-muted mb-0 fw-medium">
                        <i className="bi bi-calendar3 me-2" />
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </header>

            <section className="mb-4">
                <div className="card border-0 shadow-sm rounded-4 p-2 bg-white">
                    <div className="d-flex align-items-center gap-1">
                        <button
                            className="btn btn-sm btn-light rounded-circle flex-shrink-0"
                            style={{ width: 34, height: 34 }}
                            onClick={() => setWeekOffset(w => Math.max(w - 1, minWeekOffset))}
                            disabled={weekOffset <= minWeekOffset}>
                            <i className="bi bi-chevron-left" />
                        </button>
                        <div className="d-flex flex-grow-1">
                            {weekDays.map((d, i) => {
                                const isTodayDay = d.fullDate === todayISO;
                                const isActive   = d.fullDate === activeFullDate;
                                const isFuture   = d.fullDate > todayISO;
                                const ds         = weekStats[d.fullDate];
                                const pc         = ds?.pct ?? null;
                                return (
                                    <div key={i} onClick={() => setActiveFullDate(d.fullDate)}
                                        className="p-2 rounded-4 flex-grow-1 text-center position-relative"
                                        style={{ cursor: 'pointer', backgroundColor: isActive ? '#4e73df' : 'transparent', color: isActive ? '#fff' : isFuture ? '#adb5bd' : '#6c757d', transition: 'background 0.2s' }}>
                                        <small className="d-block text-uppercase fw-bold mb-1" style={{ fontSize: '0.6rem', opacity: 0.65 }}>{d.day}</small>
                                        <span className="fs-6 fw-bold">{d.date}</span>
                                        {!isFuture && pc !== null && (
                                            <div style={{ fontSize: '0.55rem', fontWeight: 700, marginTop: 2, color: isActive ? 'rgba(255,255,255,0.85)' : pctColor(pc) }}>
                                                {pc}%
                                            </div>
                                        )}
                                        {isTodayDay && (
                                            <span className="position-absolute start-50 translate-middle-x"
                                                style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: isActive ? '#fff' : '#4e73df', display: 'block', bottom: 3 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button className="btn btn-sm btn-light rounded-circle flex-shrink-0" style={{ width: 34, height: 34 }}
                            onClick={() => setWeekOffset(w => w + 1)}>
                            <i className="bi bi-chevron-right" />
                        </button>
                    </div>
                    <p className="text-center text-muted mb-0 mt-1" style={{ fontSize: '0.7rem' }}>
                        {weekDays[0]?.monthLabel} — {weekDays[6]?.monthLabel}
                        {weekOffset === 0 && <span className="ms-2 badge bg-primary rounded-pill" style={{ fontSize: '0.6rem' }}>Cette semaine</span>}
                    </p>
                </div>
            </section>

            <section className="row g-3 mb-4">
                {statCards.map((card, i) => (
                    <div className="col-6 col-xl-3" key={i}>
                        <div className="card border-0 shadow-sm h-100 rounded-4 p-3 border-start border-4" style={{ borderColor: card.color }}>
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle p-2 me-3 flex-shrink-0" style={{ backgroundColor: card.bg, color: card.color }}>
                                    <i className={`bi bi-${card.icon} fs-5`} />
                                </div>
                                <div className="overflow-hidden">
                                    <h6 className="text-muted mb-0 small fw-bold text-truncate">{card.title}</h6>
                                    <h4 className="fw-bold mb-0">{card.val}</h4>
                                    <small className="text-muted text-truncate d-block">{card.sub}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold text-dark mb-1">
                                    <i className="bi bi-bell-fill text-primary me-2" />
                                    Rappels
                                    <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                        — {dateLabel}
                                    </span>
                                </h5>
                                {activeDayStats.total > 0 && (
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span className="badge bg-success rounded-pill">{activeDayStats.done} pris</span>
                                        {isPastDate && <span className="badge bg-danger rounded-pill">{activeDayStats.missed} manqués</span>}
                                        <span className="badge bg-secondary rounded-pill">{activeDayStats.total} total</span>
                                    </div>
                                )}
                            </div>
                            <span className="badge bg-primary rounded-pill">
                                {allTakes.length} rappel{allTakes.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {activeDayStats.total > 0 && (
                            <div className="mb-3">
                                <div className="progress rounded-pill" style={{ height: 5 }}>
                                    <div className="progress-bar rounded-pill" style={{
                                        width: `${activeDayStats.pct ?? 0}%`,
                                        background: pctColor(activeDayStats.pct ?? 0),
                                        transition: 'width 0.5s',
                                    }} />
                                </div>
                            </div>
                        )}

                        <div className="d-flex gap-2 mb-3 flex-wrap">
                            {[
                                { key: 'all',     label: 'Tous',        icon: 'bi-grid',             count: medTakes.length + measureTakes.length },
                                { key: 'med',     label: 'Médicaments', icon: 'bi-capsule',          count: medTakes.length },
                                { key: 'measure', label: 'Mesures',     icon: 'bi-clipboard2-pulse', count: measureTakes.length },
                            ].map(tab => (
                                <button key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="btn btn-sm rounded-pill d-flex align-items-center gap-1"
                                    style={{
                                        background: activeTab === tab.key ? '#4e73df' : '#f1f5f9',
                                        color:      activeTab === tab.key ? '#fff'    : '#64748b',
                                        border:     'none', fontWeight: 600, fontSize: 12, padding: '5px 14px', transition: 'all 0.15s',
                                    }}>
                                    <i className={`bi ${tab.icon}`} />
                                    {tab.label}
                                    <span style={{
                                        background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                        color: activeTab === tab.key ? '#fff' : '#64748b',
                                        borderRadius: 99, fontSize: 10, padding: '1px 7px', fontWeight: 700,
                                    }}>{tab.count}</span>
                                </button>
                            ))}
                        </div>

                        {isLoadingActive ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" />
                                <p className="small text-muted mt-2">Chargement...</p>
                            </div>
                        ) : allTakes.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-check2-all fs-2 text-success d-block mb-2" />
                                Aucun rappel pour cette journée
                            </div>
                        ) : (
                            <>
                                <div className="d-flex flex-column gap-2">
                                    {pagedTakes.map((take, j) => {
                                        const isMes       = take._type === 'measure';
                                        const isFuture    = isToday && isFutureTime(take.take_time);
                                        const isDone      = isFuture ? false : take.status === 'done';
                                        const isMissed    = isPastDate && !isDone;
                                        const isLate      = !isDone && isToday && !isMes && isPast(take.take_time);

                                        const bgColor = isDone   ? '#f0faf5'
                                                      : isMissed ? '#fff5f5'
                                                      : isLate   ? '#fff8f0'
                                                      : '#f8f9fc';

                                        const borderColor = isDone   ? '#1cc88a'
                                                          : isMissed ? '#e74a3b'
                                                          : isLate   ? '#f6a935'
                                                          : take._color;

                                        return (
                                            <div key={`${take.id}-${j}`}
                                                className="d-flex align-items-center p-2 rounded-3 gap-3"
                                                style={{ backgroundColor: bgColor, borderLeft: `3px solid ${borderColor}`, opacity: isDone ? 0.75 : 1, transition: 'all 0.2s' }}>

                                                <div className="d-flex align-items-center justify-content-center rounded-3 bg-white shadow-sm flex-shrink-0"
                                                    style={{ width: 44, height: 44, border: `1.5px solid ${take._color}22` }}>
                                                    {!isMes && take._image
                                                        ? <img src={`${API}/storage/${take._image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                                                        : <i className={`bi ${isMes ? 'bi-clipboard2-pulse' : 'bi-capsule'} fs-5`} style={{ color: take._color }} />
                                                    }
                                                </div>

                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <h6 className="mb-0 fw-bold text-truncate" style={{ fontSize: 14 }}>{take._name}</h6>
                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${take._color}18`, color: take._color }}>
                                                            {isMes ? 'Mesure' : 'Méd.'}
                                                        </span>
                                                        {isDone   && <span className="badge bg-success"           style={{ fontSize: '0.6rem' }}>✓ Fait</span>}
                                                        {isMissed && <span className="badge bg-danger"            style={{ fontSize: '0.6rem' }}>✗ Manqué</span>}
                                                        {isLate   && <span className="badge bg-warning text-dark" style={{ fontSize: '0.6rem' }}>En retard</span>}
                                                        {isFuture && !isDone && <span className="badge bg-light text-muted border" style={{ fontSize: '0.6rem' }}>À venir</span>}
                                                    </div>
                                                    <small className="text-muted">
                                                        <i className="bi bi-clock me-1" />{toHHMM(take.take_time)}
                                                        {!isMes && <> — {take.dose} {take.unit}</>}
                                                        {isMes  && take._unit && <> — {take._unit}</>}
                                                    </small>
                                                </div>

                                                {isToday && !isDone ? (
                                                    isFuture ? (
                                                        <span className="badge bg-light text-muted rounded-pill flex-shrink-0 border" style={{ fontSize: 11 }}>
                                                            <i className="bi bi-clock me-1" />{toHHMM(take.take_time)}
                                                        </span>
                                                    ) : isMes ? (
                                                        <button
                                                            onClick={() => setSaisieModal(take._mes)}
                                                            className="btn btn-sm rounded-pill px-3 fw-bold flex-shrink-0"
                                                            style={{ background: take._color, color: '#fff', border: 'none', fontSize: 12 }}>
                                                            <i className="bi bi-pencil me-1" />Saisir
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => markMedDone(take.id)}
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold flex-shrink-0"
                                                            style={{ fontSize: 12 }}>
                                                            Pris
                                                        </button>
                                                    )
                                                ) : isDone ? (
                                                    <span className="badge bg-success rounded-pill flex-shrink-0">✓ Fait</span>
                                                ) : isPastDate ? (
                                                    <span className="badge rounded-pill flex-shrink-0 bg-danger">✗ Manqué</span>
                                                ) : (
                                                    <span className="badge bg-light text-muted rounded-pill flex-shrink-0 border">À venir</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {totalPages > 1 && (
                                    <div className="d-flex align-items-center justify-content-between mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <small className="text-muted">
                                            {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, allTakes.length)} sur {allTakes.length} rappels
                                        </small>
                                        <div className="d-flex gap-2 align-items-center">
                                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                                className="btn btn-sm btn-light rounded-circle"
                                                style={{ width: 32, height: 32, padding: 0, opacity: page === 1 ? 0.4 : 1 }}>
                                                <i className="bi bi-chevron-left" style={{ fontSize: 12 }} />
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button key={p} onClick={() => setPage(p)}
                                                    className="btn btn-sm rounded-circle"
                                                    style={{
                                                        width: 32, height: 32, padding: 0,
                                                        background: page === p ? '#4e73df' : '#f1f5f9',
                                                        color:      page === p ? '#fff'    : '#64748b',
                                                        border: 'none', fontWeight: page === p ? 700 : 400, fontSize: 13,
                                                    }}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                                className="btn btn-sm btn-light rounded-circle"
                                                style={{ width: 32, height: 32, padding: 0, opacity: page === totalPages ? 0.4 : 1 }}>
                                                <i className="bi bi-chevron-right" style={{ fontSize: 12 }} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="d-flex flex-column gap-4">
                        {lowStocks.length > 0 && (
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-danger">
                                <h6 className="fw-bold text-danger mb-3">
                                    <i className="bi bi-exclamation-octagon-fill me-2" />Stocks Critiques
                                </h6>
                                {lowStocks.map((med, i) => {
                                    const initial = med.initial_stock ?? (med.low_stock_alert ?? 5) * 6;
                                    const pct     = Math.min((med.current_stock / initial) * 100, 100);
                                    return (
                                        <div key={i} className="mb-3 p-2 rounded-3" style={{ backgroundColor: '#fff5f5' }}>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="fw-bold small text-truncate">{med.medication_name}</span>
                                                <span className="badge bg-danger flex-shrink-0 ms-2">{med.current_stock} restants</span>
                                            </div>
                                            <div className="progress" style={{ height: 5 }}>
                                                <div className="progress-bar bg-danger" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-bar-chart-fill text-primary me-2" />Résumé — {dateLabel}
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                {[
                                    { label: 'Médicaments', val: medTakes.length,     done: medTakes.filter(t => t.status === 'done').length,     color: '#4e73df' },
                                    { label: 'Mesures',     val: measureTakes.length, done: measureTakes.filter(t => t.status === 'done').length, color: '#6f42c1' },
                                ].map((row, i) => (
                                    <div key={i} className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle flex-shrink-0" style={{ width: 8, height: 8, background: row.color }} />
                                        <span className="flex-grow-1 small fw-medium">{row.label}</span>
                                        <span className="small text-muted">{row.done}/{row.val}</span>
                                        <div style={{ width: 60, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: row.val > 0 ? `${Math.round((row.done / row.val) * 100)}%` : '0%', background: row.color, borderRadius: 99, transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {activeDayStats.pct !== null && (
                                <div className="mt-3 p-3 rounded-3 text-center" style={{ background: `${pctColor(activeDayStats.pct)}12` }}>
                                    <div className="fw-bold" style={{ fontSize: 28, color: pctColor(activeDayStats.pct) }}>{activeDayStats.pct}%</div>
                                    <small className="text-muted">observance du jour</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="position-fixed" style={{ bottom: 30, right: 30, zIndex: 1050 }}>
                {fabOpen && (
                    <div className="d-flex flex-column gap-2 mb-3 align-items-end">
                        <button onClick={() => { navigate('/Medicament'); setFabOpen(false); }}
                            className="btn bg-white shadow rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 border-0">
                            <span className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white" style={{ width: 28, height: 28 }}>
                                <i className="bi bi-capsule" style={{ fontSize: 12 }} />
                            </span>
                            Ajouter un médicament
                        </button>
                        <button onClick={() => { navigate('/Mesure'); setFabOpen(false); }}
                            className="btn bg-white shadow rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 border-0">
                            <span className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: '#6f42c1' }}>
                                <i className="bi bi-clipboard2-pulse" style={{ fontSize: 12 }} />
                            </span>
                            Ajouter une mesure
                        </button>
                    </div>
                )}
                <button onClick={() => setFabOpen(o => !o)}
                    className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                    style={{ width: 60, height: 60, fontSize: 22, transition: 'transform 0.2s', transform: fabOpen ? 'rotate(45deg)' : 'rotate(0)' }}>
                    <i className="bi bi-plus-lg" />
                </button>
            </div>

            {/* Modal saisie mesure */}
            {saisieModal && (
                <SaisieModal
                    mesure={saisieModal}
                    onClose={() => setSaisieModal(null)}
                    onSave={saveMeasure}
                />
            )}

            {/* Modal confirmation notification push */}
            {notifModal && (
                <NotifModal
                    notifModal={notifModal}
                    onClose={() => setNotifModal(null)}
                    onConfirmer={handleConfirmerPrise}
                    onSaisir={handleSaisirMesure}
                />
            )}
        </div>
    );
};

export default Dashboard;