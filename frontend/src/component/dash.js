import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://127.0.0.1:8000';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const toHHMM = (t = '') => t.substring(0, 5);

const isPast = (timeStr) => {
    const [h, m] = toHHMM(timeStr).split(':').map(Number);
    const now = new Date();
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
};

const compareTime = (a, b) => (a.take_time || '').localeCompare(b.take_time || '');

const shouldTakeOnDate = (med, dateStr) => {
    const date    = new Date(dateStr + 'T00:00:00');
    const JOURS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const jourNom = JOURS[date.getDay()];
    switch (med.frequency_type) {
        case 'daily':   return true;
        case 'weekly':  return Array.isArray(med.frequency_days) && med.frequency_days.includes(jourNom);
        case 'monthly': return date.getDate() === (med.frequency_days?.day ?? 1);
        default:        return true;
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

const computeObservance = (medications) => {
    let total = 0, done = 0;
    medications.forEach(med => (med.takes || []).forEach(take => {
        total++;
        if (take.status === 'done') done++;
    }));
    if (total === 0) return '—';
    return Math.round((done / total) * 100) + '%';
};

const Dashboard = () => {
    const navigate = useNavigate();
    const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [weekOffset,     setWeekOffset]     = useState(0);
    const [activeFullDate, setActiveFullDate] = useState(todayISO);

    // ✅ Cache par date : { "2026-05-01": { medications: [...] } }
    // Chaque date a ses propres données fetchées avec ?date=
    const [dateCache,  setDateCache]  = useState({});
    const [loadingDate, setLoadingDate] = useState(null); // date en cours de chargement

    const [fabOpen,  setFabOpen]  = useState(false);

    const weekDays = useMemo(() => buildWeek(weekOffset), [weekOffset]);

    // ── Fetch pour une date précise ───────────────────────────────────────
    const fetchForDate = useCallback(async (dateStr, force = false) => {
        if (!force && dateCache[dateStr]) return; // déjà en cache

        setLoadingDate(dateStr);
        try {
            const res = await axios.get(`${API}/api/dashboard-data`, {
                headers: authHeaders(),
                params:  { date: dateStr }, // ✅ envoie toujours ?date=
            });
            setDateCache(prev => ({ ...prev, [dateStr]: res.data }));
        } catch (err) {
            console.error('Erreur dashboard:', err.response);
            toast.error('Impossible de charger les données');
        } finally {
            setLoadingDate(null);
        }
    }, [dateCache]);

    // Fetch aujourd'hui au montage
    useEffect(() => {
        fetchForDate(todayISO, true);
        if (Notification.permission === 'default') Notification.requestPermission();
    }, []);

    // Fetch quand on change de date
    useEffect(() => {
        fetchForDate(activeFullDate);
    }, [activeFullDate]);

    // ── Données du jour actif ─────────────────────────────────────────────
    const isToday    = activeFullDate === todayISO;
    const isPastDate = activeFullDate < todayISO;
    const isFutureDate = activeFullDate > todayISO;

    const activeDateData = dateCache[activeFullDate];
    const todayData      = dateCache[todayISO] ?? { medications: [], appointments: [] };

    // Takes pour le jour affiché
    const takesForActiveDate = useMemo(() => {
        if (!activeDateData) return [];

        // Pour les jours futurs : même médicaments mais status toujours 'pending'
        const meds = isFutureDate
            ? (activeDateData.medications || []).map(med => ({
                ...med,
                takes: (med.takes || []).map(take => ({ ...take, status: 'pending' })),
              }))
            : (activeDateData.medications || []);

        return meds
            .filter(med => shouldTakeOnDate(med, activeFullDate))
            .flatMap(med =>
                (med.takes || []).map(take => ({ ...take, med }))
            )
            .sort(compareTime);
    }, [activeDateData, activeFullDate, isFutureDate]);

    // Stats du jour actif
    const activeDayStats = useMemo(() => {
        const total  = takesForActiveDate.length;
        const done   = takesForActiveDate.filter(t => t.status === 'done').length;
        const missed = isPastDate ? takesForActiveDate.filter(t => t.status !== 'done').length : 0;
        const pct    = total === 0 ? null : Math.round((done / total) * 100);
        return { total, done, missed, pct };
    }, [takesForActiveDate, isPastDate]);

    // Takes d'aujourd'hui pour les notifications temps réel
    const takesToday = useMemo(() => {
        return (todayData.medications || [])
            .filter(med => shouldTakeOnDate(med, todayISO))
            .flatMap(med => (med.takes || []).map(take => ({ ...take, med })));
    }, [todayData, todayISO]);

    // WeekStats pour les % dans le calendrier
    const weekStats = useMemo(() => {
        const result = {};
        weekDays.forEach(d => {
            if (d.fullDate > todayISO) return;
            const cached = dateCache[d.fullDate];
            if (!cached) return;
            const takes = (cached.medications || [])
                .filter(med => shouldTakeOnDate(med, d.fullDate))
                .flatMap(med => med.takes || []);
            const total = takes.length;
            const done  = takes.filter(t => t.status === 'done').length;
            result[d.fullDate] = {
                total,
                done,
                pct: total === 0 ? null : Math.round((done / total) * 100),
            };
        });
        return result;
    }, [weekDays, dateCache, todayISO]);

    const lowStocks  = useMemo(() => (todayData.medications || []).filter(m => m.current_stock <= (m.low_stock_alert ?? 5)), [todayData]);
    const observance = useMemo(() => computeObservance(todayData.medications || []), [todayData]);
    const lastTension = todayData.lastTension ?? '—';

    const stats = useMemo(() => [
        { title: 'Observance',  val: observance,                          sub: 'Taux de prises réel', icon: 'graph-up-arrow',       color: '#4e73df', bg: '#eef2ff' },
        { title: 'Alertes',     val: lowStocks.length,                    sub: 'Stocks à renouveler', icon: 'exclamation-triangle', color: '#e74a3b', bg: '#fff5f5' },
        { title: 'Traitements', val: (todayData.medications || []).length, sub: 'Médicaments actifs',  icon: 'capsule',              color: '#1cc88a', bg: '#eafaf1' },
        { title: 'Tension',     val: lastTension,                          sub: 'Dernière mesure',     icon: 'heart-pulse',          color: '#6f42c1', bg: '#f5f0ff' },
    ], [observance, lowStocks.length, todayData, lastTension]);

    // ── Marquer comme fait ────────────────────────────────────────────────
    const markAsDone = useCallback(async (type, id, toastId = null) => {
        const url = type === 'measure' ? `/api/measures/${id}/done` : `/api/takes/${id}/done`;
        try {
            await axios.post(`${API}${url}`, {}, { headers: authHeaders() });
            toast.success("C'est enregistré !", { id: 'success-action' });
            if (toastId) toast.dismiss(toastId);
            // ✅ Recharge UNIQUEMENT aujourd'hui avec force=true
            fetchForDate(todayISO, true);
        } catch {
            toast.error('Erreur serveur.');
        }
    }, [fetchForDate, todayISO]);

   

    // Notifications temps réel
   
    const isLoadingActive = loadingDate === activeFullDate;
    const appointments    = todayData.appointments ?? [];

    if (!dateCache[todayISO]) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="fw-bold text-muted">Chargement de votre espace santé…</p>
            </div>
        </div>
    );

    return (
        <div className="container-fluid min-vh-100 bg-light py-4 px-xl-5" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* HEADER */}
            <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Bonjour, Sara <span className="ms-1">👋</span></h2>
                    <p className="text-muted mb-0 fw-medium">
                        <i className="bi bi-calendar3 me-2" />
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <button className="btn bg-white shadow-sm rounded-pill px-4 py-2 border-0 fw-bold text-secondary">
                        <i className="bi bi-file-earmark-pdf me-2 text-danger" /> Export PDF
                    </button>
                    <div className="position-relative">
                        <input className="form-control border-0 shadow-sm ps-5 rounded-pill" placeholder="Rechercher…" style={{ width: 250 }} />
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    </div>
                </div>
            </header>

            {/* CALENDRIER */}
            <section className="mb-5">
                <div className="card border-0 shadow-sm rounded-4 p-2 bg-white">
                    <div className="d-flex align-items-center gap-1">
                        <button className="btn btn-sm btn-light rounded-circle flex-shrink-0" style={{ width: 34, height: 34 }}
                            onClick={() => setWeekOffset(w => w - 1)}>
                            <i className="bi bi-chevron-left" />
                        </button>
                        <div className="d-flex flex-grow-1">
                            {weekDays.map((d, i) => {
                                const isTodayDay = d.fullDate === todayISO;
                                const isActive   = d.fullDate === activeFullDate;
                                const isFuture   = d.fullDate > todayISO;
                                const ds         = weekStats[d.fullDate];
                                const pctColor   = ds?.pct === 100 ? '#1cc88a' : ds?.pct >= 50 ? '#f6a935' : '#e74a3b';

                                return (
                                    <div key={i} onClick={() => setActiveFullDate(d.fullDate)}
                                        className="p-2 rounded-4 flex-grow-1 text-center position-relative"
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: isActive ? '#4e73df' : 'transparent',
                                            color: isActive ? '#fff' : isFuture ? '#adb5bd' : '#6c757d',
                                            transition: 'background 0.2s',
                                        }}>
                                        <small className="d-block text-uppercase fw-bold mb-1" style={{ fontSize: '0.6rem', opacity: 0.65 }}>{d.day}</small>
                                        <span className="fs-6 fw-bold">{d.date}</span>
                                        {!isFuture && ds?.total > 0 && (
                                            <div style={{ fontSize: '0.55rem', fontWeight: 700, marginTop: 2, color: isActive ? 'rgba(255,255,255,0.85)' : pctColor }}>
                                                {ds.pct}%
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

            {/* STATS */}
            <section className="row g-4 mb-5">
                {stats.map((card, i) => (
                    <div className="col-sm-6 col-xl-3" key={i}>
                        <div className="card border-0 shadow-sm h-100 rounded-4 p-4 border-start border-4" style={{ borderColor: card.color }}>
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: card.bg, color: card.color }}>
                                    <i className={`bi bi-${card.icon} fs-4`} />
                                </div>
                                <div>
                                    <h6 className="text-muted mb-0 small fw-bold">{card.title}</h6>
                                    <h3 className="fw-bold mb-0">{card.val}</h3>
                                    <small className="text-muted">{card.sub}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <div className="row g-4">
                {/* RAPPELS */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">

                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 className="fw-bold text-dark mb-1">
                                    <i className="bi bi-bell-fill text-primary me-2" />
                                    Rappels
                                    <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.85rem' }}>
                                        — {isToday
                                            ? "Aujourd'hui"
                                            : new Date(activeFullDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                </h5>
                                {activeDayStats.total > 0 && (
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <span className="d-flex align-items-center gap-1">
                                            <span className="badge bg-success rounded-pill">{activeDayStats.done}</span>
                                            <small className="text-muted">pris</small>
                                        </span>
                                        {isPastDate && (
                                            <span className="d-flex align-items-center gap-1">
                                                <span className="badge bg-danger rounded-pill">{activeDayStats.missed}</span>
                                                <small className="text-muted">manqués</small>
                                            </span>
                                        )}
                                        <span className="d-flex align-items-center gap-1">
                                            <span className="badge bg-secondary rounded-pill">{activeDayStats.total}</span>
                                            <small className="text-muted">total</small>
                                        </span>
                                        {activeDayStats.pct !== null && (
                                            <span className="fw-bold small" style={{
                                                color: activeDayStats.pct === 100 ? '#1cc88a' : activeDayStats.pct >= 50 ? '#f6a935' : '#e74a3b'
                                            }}>
                                                {activeDayStats.pct}% observance
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="badge bg-primary rounded-pill flex-shrink-0 ms-2">
                                {takesForActiveDate.length} prise{takesForActiveDate.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {activeDayStats.total > 0 && (
                            <div className="mb-4">
                                <div className="progress rounded-pill" style={{ height: 6 }}>
                                    <div className="progress-bar rounded-pill" style={{
                                        width: `${activeDayStats.pct}%`,
                                        background: activeDayStats.pct === 100 ? '#1cc88a' : activeDayStats.pct >= 50 ? '#f6a935' : '#e74a3b',
                                        transition: 'width 0.5s',
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Spinner chargement */}
                        {isLoadingActive ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" />
                                <p className="small text-muted mt-2">Chargement...</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {takesForActiveDate.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-check2-all fs-2 text-success d-block mb-2" />
                                        Aucun rappel pour cette journée
                                    </div>
                                ) : (
                                    takesForActiveDate.map((take, j) => {
                                        const isDone   = take.status === 'done';
                                        const isMissed = isPastDate && !isDone;
                                        const isLate   = !isDone && isToday && isPast(take.take_time);

                                        const bgColor   = isDone ? '#f0faf5' : isMissed ? '#fff5f5' : isLate ? '#fff8f0' : '#f8f9fc';
                                        const iconColor = isDone ? 'text-success' : isMissed ? 'text-danger' : isLate ? 'text-warning' : 'text-primary';

                                        return (
                                            <div key={`${take.med?.id}-${j}`}
                                                className="list-group-item border-0 px-0 mb-3 d-flex align-items-center p-2 rounded-3"
                                                style={{ backgroundColor: bgColor, opacity: isDone ? 0.8 : 1, transition: 'all 0.3s' }}>

                                                <div className={`rounded-4 p-2 me-3 bg-white shadow-sm d-flex align-items-center justify-content-center ${iconColor}`}
                                                    style={{ width: 52, height: 52, flexShrink: 0 }}>
                                                    {take.med?.image
                                                        ? <img src={`${API}/storage/${take.med.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                                                        : <i className="bi bi-capsule fs-5" />
                                                    }
                                                </div>

                                                <div className="flex-grow-1 overflow-hidden">
                                                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2 text-truncate">
                                                        {take.med?.medication_name}
                                                        {isDone   && <span className="badge bg-success flex-shrink-0"           style={{ fontSize: '0.6rem' }}>✓ Pris</span>}
                                                        {isMissed && <span className="badge bg-danger flex-shrink-0"            style={{ fontSize: '0.6rem' }}>✗ Manqué</span>}
                                                        {isLate   && <span className="badge bg-warning text-dark flex-shrink-0" style={{ fontSize: '0.6rem' }}>En retard</span>}
                                                    </h6>
                                                    <small className="text-muted">
                                                        <i className="bi bi-clock me-1" />{toHHMM(take.take_time)} — {take.dose} {take.unit}
                                                    </small>
                                                </div>

                                                {isToday ? (
                                                    <button onClick={() => !isDone && markAsDone('medication', take.id)}
                                                        disabled={isDone}
                                                        className={`btn btn-sm rounded-pill px-3 fw-bold flex-shrink-0 ${isDone ? 'btn-success' : isLate ? 'btn-warning text-dark' : 'btn-outline-primary'}`}>
                                                        {isDone ? '✓ Fait' : 'Pris'}
                                                    </button>
                                                ) : isPastDate ? (
                                                    <span className={`badge rounded-pill flex-shrink-0 ${isDone ? 'bg-success' : 'bg-danger'}`}>
                                                        {isDone ? '✓ Pris' : '✗ Manqué'}
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-muted rounded-pill flex-shrink-0 border">À venir</span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* STOCKS + RDV */}
                <div className="col-lg-5">
                    <div className="d-flex flex-column gap-4">
                        {lowStocks.length > 0 && (
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-danger">
                                <h5 className="fw-bold text-danger mb-3">
                                    <i className="bi bi-exclamation-octagon-fill me-2" />Stocks Critiques
                                </h5>
                                {lowStocks.map((med, i) => {
                                    const initial = med.initial_stock ?? (med.low_stock_alert ?? 5) * 6;
                                    const pct = Math.min((med.current_stock / initial) * 100, 100);
                                    return (
                                        <div key={i} className="mb-3 p-2 rounded-3" style={{ backgroundColor: '#fff5f5' }}>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="fw-bold small">{med.medication_name}</span>
                                                <span className="badge bg-danger">{med.current_stock} restants</span>
                                            </div>
                                            <div className="progress" style={{ height: 6 }}>
                                                <div className="progress-bar bg-danger" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <h5 className="fw-bold mb-4">
                                <i className="bi bi-calendar-check-fill text-primary me-2" />Prochains RDV
                            </h5>
                            {appointments.length === 0 ? (
                                <div className="text-center text-muted py-3">
                                    <i className="bi bi-calendar-x d-block fs-3 mb-2 opacity-25" />
                                    Aucun rendez-vous à venir
                                </div>
                            ) : (
                                appointments.map((rdv, i) => (
                                    <div key={i} className="d-flex align-items-center p-3 rounded-4 mb-2" style={{ backgroundColor: '#f8f9fc' }}>
                                        <div className="rounded-circle p-3 bg-white text-primary shadow-sm me-3">
                                            <i className={`bi bi-${rdv.icon ?? 'hospital'}`} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-0 fw-bold small">{rdv.doctor}</h6>
                                            <small className="text-muted">{rdv.specialty}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className="d-block fw-bold text-primary small">{rdv.date}</span>
                                            <small className="text-muted">{rdv.time}</small>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB */}
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
                            <span className="rounded-circle d-flex align-items-center justify-content-center bg-danger text-white" style={{ width: 28, height: 28 }}>
                                <i className="bi bi-heart-pulse" style={{ fontSize: 12 }} />
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
        </div>
    );
};

export default Dashboard;