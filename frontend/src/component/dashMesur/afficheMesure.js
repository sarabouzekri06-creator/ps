import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import MesureService from '../services/mesureService';

import MesureChart from './MesureChart';
import PdfModal from './pdfModel'; // ✅ import du composant séparé
import {
    SaisieModal, DeleteModal,
    EditResultModal, DeleteResultModal,
    EditNoteModal, DeleteNoteModal,
    getMeta,
} from './model';

const parseVal = (val) => {
    if (!val) return null;
    const str = String(val);
    return parseFloat(str.includes('/') ? str.split('/')[0] : str);
};

const chunkData = (arr, freq) => {
    let chunkSize;
    switch (freq?.label) {
        case 'Quotidien':    chunkSize = 14; break;
        case 'Hebdomadaire': chunkSize = 8;  break;
        case 'Mensuel':      chunkSize = 6;  break;
        case 'Bimestriel':   chunkSize = 4;  break;
        case 'Trimestriel':  chunkSize = 4;  break;
        default:             chunkSize = 14; break;
    }
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) chunks.push(arr.slice(i, i + chunkSize));
    return chunks;
};

const MesureDashboard = () => {
    const [mesuresData,       setMesuresData]       = useState([]);
    const [activeTab,         setActiveTab]         = useState(null);
    const [loading,           setLoading]           = useState(true);
    const [saisieModal,       setSaisieModal]       = useState(null);
    const [deleteModal,       setDeleteModal]       = useState(null);
    const [editResultModal,   setEditResultModal]   = useState(null);
    const [deleteResultModal, setDeleteResultModal] = useState(null);
    const [editNoteModal,     setEditNoteModal]     = useState(null);
    const [deleteNoteModal,   setDeleteNoteModal]   = useState(null);
    const [openMenuIdx,       setOpenMenuIdx]       = useState(null);
    const [periodIndex,       setPeriodIndex]       = useState(0);
    const [pdfModalOpen,      setPdfModalOpen]      = useState(false); // ✅

    useEffect(() => {
        const close = () => setOpenMenuIdx(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    const fetchHealthData = useCallback(async () => {
        try {
            const res = await MesureService.getStats();
            setMesuresData(res.data);
            setActiveTab(prev => prev ?? (res.data[0]?.id ?? null));
        } catch (err) {
            console.error('Erreur:', err);
            toast.error('Impossible de charger les mesures');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHealthData(); }, [fetchHealthData]);

    // Détecter si on vient d'une notification push
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const takeId = params.get('take_id');
  const action = params.get('action');

  if (takeId && action === 'saisir') {
    // Attendre que les données soient chargées puis ouvrir le modal
    if (mesuresData.length > 0) {
      setSaisieModal(mesuresData[0]); // ouvre le premier par défaut
    }
  }
}, [mesuresData]);

    const refreshAndKeepTab = useCallback(async () => {
        const currentTab = activeTab;
        setActiveTab(null);
        await fetchHealthData();
        setActiveTab(currentTab);
    }, [activeTab, fetchHealthData]);

    const handleSave = useCallback(async (measureId, value, note) => {
        await MesureService.saveResult(measureId, value, note);
        toast.success('Valeur enregistrée !');
        await refreshAndKeepTab();
    }, [refreshAndKeepTab]);

    const handleDelete = useCallback(async (measureId) => {
        await MesureService.delete(measureId);
        toast.success('Mesure supprimée');
        setMesuresData(prev => {
            const remaining = prev.filter(m => m.id !== measureId);
            setActiveTab(curr => curr === measureId ? (remaining[0]?.id ?? null) : curr);
            return remaining;
        });
    }, []);

    const handleUpdateResult = useCallback(async (resultId, value, note) => {
        await MesureService.updateResult(resultId, value, note);
        toast.success('Valeur mise à jour !');
        await refreshAndKeepTab();
    }, [refreshAndKeepTab]);

    const handleDeleteResult = useCallback(async (resultId) => {
        await MesureService.deleteResult(resultId);
        toast.success('Valeur supprimée');
        await refreshAndKeepTab();
    }, [refreshAndKeepTab]);

    const handleUpdateNote = useCallback(async (resultId, currentValeur, newNote) => {
        await MesureService.updateResult(resultId, currentValeur, newNote);
        toast.success('Note mise à jour !');
        await refreshAndKeepTab();
    }, [refreshAndKeepTab]);

    const handleDeleteNote = useCallback(async (resultId, currentValeur) => {
        await MesureService.updateResult(resultId, currentValeur, '');
        toast.success('Note supprimée');
        await refreshAndKeepTab();
    }, [refreshAndKeepTab]);

    const selectedMesure = mesuresData.find(m => m.id === activeTab);

    const allHistory = useMemo(() =>
        selectedMesure ? [...(selectedMesure.history || [])].reverse() : [],
    [selectedMesure]);

    const freqLabel = {
        'daily':        { label: 'Quotidien',    icon: 'bi-calendar-day',   color: '#1cc88a' },
        'weekly':       { label: 'Hebdomadaire', icon: 'bi-calendar-week',  color: '#4e73df' },
        'monthly':      { label: 'Mensuel',      icon: 'bi-calendar-month', color: '#f6a935' },
        'every2months': { label: 'Bimestriel',   icon: 'bi-calendar2',      color: '#e74a3b' },
        'quarterly':    { label: 'Trimestriel',  icon: 'bi-calendar3',      color: '#6f42c1' },
    }[selectedMesure?.frequencyType] ?? null;

    const periods       = useMemo(() => chunkData(allHistory, freqLabel), [allHistory, freqLabel]);
    const safePeriodIdx = Math.min(periodIndex, Math.max(0, periods.length - 1));
    const chartData     = periods[safePeriodIdx] ?? [];

    const todayStr  = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const todayData = selectedMesure
        ? (selectedMesure.history || []).filter(h => h.day?.startsWith(todayStr)).reverse()
        : [];

    const nextTake = (() => {
        if (!selectedMesure?.takes?.length) return null;
        const nowTime = new Date().toTimeString().substring(0, 5);
        const sorted  = [...selectedMesure.takes].sort((a, b) => (a.take_time || '').localeCompare(b.take_time || ''));
        return sorted.find(t => (t.take_time || '').substring(0, 5) >= nowTime) ?? sorted[0];
    })();

    const allAlertes = useMemo(() => allHistory.filter(h =>
        (selectedMesure?.maxTarget && h.valeur > selectedMesure.maxTarget) ||
        (selectedMesure?.minTarget && h.valeur < selectedMesure.minTarget)
    ), [allHistory, selectedMesure]);

    const alertesPeriode = chartData.filter(h =>
        (selectedMesure?.maxTarget && h.valeur > selectedMesure.maxTarget) ||
        (selectedMesure?.minTarget && h.valeur < selectedMesure.minTarget)
    );

    const moyenneVal = chartData.length
        ? (chartData.reduce((acc, curr) => acc + (parseFloat(curr.valeur) || 0), 0) / chartData.length).toFixed(2)
        : '—';

    const lastVal     = selectedMesure?.currentValue;
    const parsedLast  = parseVal(lastVal);
    const isAbove     = !!(selectedMesure?.maxTarget && parsedLast !== null && parsedLast > selectedMesure.maxTarget);
    const isBelow     = !!(selectedMesure?.minTarget && parsedLast !== null && parsedLast < selectedMesure.minTarget);
    const accentColor = selectedMesure?.color ?? '#4e73df';

    const periodLabelText = freqLabel?.label === 'Mensuel'      ? 'mois'
                          : freqLabel?.label === 'Trimestriel'  ? 'trimestres'
                          : freqLabel?.label === 'Annuel'       ? 'ans'
                          : freqLabel?.label === 'Hebdomadaire' ? 'semaines'
                          : '2 sem.';

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="text-center">
                <div className="spinner-border text-danger mb-3" role="status" />
                <p className="fw-bold text-muted">Chargement du rapport de santé…</p>
            </div>
        </div>
    );

    if (mesuresData.length === 0) return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-muted">
            <i className="bi bi-activity" style={{ fontSize: 56, opacity: 0.15 }} />
            <p className="mt-3 fw-bold fs-5">Aucune mesure configurée.</p>
            <p className="small">Ajoutez une mesure depuis le formulaire.</p>
        </div>
    );

    return (
        <div className="container-fluid py-4 min-vh-100"
            style={{ backgroundColor: '#f8f9fa', fontFamily: "'Inter', sans-serif" }}>
            <Toaster position="top-right" />
            <div className="container-xl">

                {/* HEADER */}
                <header className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                        <h2 className="fw-bold text-dark mb-0">Rapport de Santé</h2>
                        <p className="text-secondary small mb-0">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                        {nextTake && (
                            <div onClick={() => setSaisieModal(selectedMesure)}
                                className="bg-white shadow-sm rounded-pill px-4 py-2 fw-bold border d-inline-flex align-items-center gap-2"
                                style={{ cursor: 'pointer', color: accentColor }}>
                                <i className="bi bi-clock me-1" />
                                {(nextTake.take_time || '').substring(0, 5)}
                                <i className="bi bi-plus-circle ms-2" />
                            </div>
                        )}

                        {/* ✅ Bouton PDF */}
                        <button
                            onClick={() => setPdfModalOpen(true)}
                            className="d-inline-flex align-items-center gap-2 fw-bold"
                            style={{
                                border: 'none', borderRadius: 99, padding: '9px 20px',
                                background: '#fff', color: '#ef4444', cursor: 'pointer',
                                fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}>
                            <i className="bi bi-file-earmark-medical" style={{ fontSize: 16 }} />
                            Exporter PDF
                        </button>

                        
                    </div>
                </header>

                {/* BANNIÈRE ALERTE */}
                {selectedMesure && (isAbove || isBelow) && (
                    <div className="alert alert-danger d-flex align-items-center gap-3 rounded-4 border-0 shadow-sm mb-4" role="alert">
                        <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white flex-shrink-0"
                            style={{ width: 40, height: 40 }}>
                            <i className="bi bi-exclamation-triangle-fill" />
                        </div>
                        <div>
                            <strong>Valeur critique — {selectedMesure.name}</strong>
                            <p className="mb-0 small">
                                Dernière valeur : <strong>{lastVal} {selectedMesure.unit}</strong> —
                                {isAbove
                                    ? ` au-dessus du max (${selectedMesure.maxTarget})`
                                    : ` en-dessous du min (${selectedMesure.minTarget})`}.
                            </p>
                        </div>
                    </div>
                )}

                {/* ONGLETS */}
                <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
                    {mesuresData.map(m => {
                        const meta     = getMeta(m.name);
                        const isActive = activeTab === m.id;
                        const lastH    = (m.history || []).slice(-1)[0];
                        const hasAlert = lastH && (
                            (m.maxTarget && lastH.valeur > m.maxTarget) ||
                            (m.minTarget && lastH.valeur < m.minTarget)
                        );
                        return (
                            <div key={m.id} className="position-relative flex-shrink-0">
                                <button
                                    onClick={() => { setActiveTab(m.id); setPeriodIndex(0); }}
                                    className={`btn rounded-4 px-4 py-3 shadow-sm border-0 text-start ${isActive ? 'text-white' : 'bg-white text-dark'}`}
                                    style={{ minWidth: 180, background: isActive ? meta.color : undefined }}>
                                    <small className={`d-block mb-1 ${isActive ? 'opacity-75' : 'text-muted'}`}>Suivi de</small>
                                    <div className="fw-bold d-flex align-items-center gap-2">
                                        {m.name}
                                        {hasAlert && <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.55rem' }}>!</span>}
                                    </div>
                                    <div className={`small mt-1 ${isActive ? 'opacity-75' : 'text-muted'}`}>
                                        {m.currentValue ? `${m.currentValue} ${m.unit ?? ''}` : 'Aucune donnée'}
                                    </div>
                                </button>
                                <button
                                    className="position-absolute top-0 end-0 btn btn-sm p-0 d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm border-0"
                                    style={{ width: 20, height: 20, transform: 'translate(30%, -30%)', zIndex: 1 }}
                                    onClick={e => { e.stopPropagation(); setDeleteModal(m); }}>
                                    <i className="bi bi-x text-danger" style={{ fontSize: 11 }} />
                                </button>
                            </div>
                        );
                    })}
                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center flex-shrink-0 d-flex flex-column align-items-center justify-content-center"
                        style={{ minWidth: 110, cursor: 'pointer', background: `${accentColor}12` }}>
                        <a href='/Mesure'>
                            <i className="bi bi-plus-circle fs-4 mb-1" style={{ color: accentColor }} />
                        </a>
                    </div>
                </div>

                {selectedMesure && (
                    <>
                        {/* STATS RAPIDES */}
                        <div className="row g-3 mb-4">
                            {[
                                { label: 'Total mesures',   val: allHistory.length,   icon: 'bi-clipboard-data',      color: accentColor },
                                { label: 'Alertes totales', val: allAlertes.length,   icon: 'bi-exclamation-octagon', color: allAlertes.length > 0 ? '#e74a3b' : '#1cc88a' },
                                { label: 'Dernière valeur', val: `${lastVal ?? '—'} ${selectedMesure.unit ?? ''}`, icon: 'bi-activity', color: isAbove || isBelow ? '#e74a3b' : '#1cc88a' },
                                freqLabel ? { label: 'Fréquence', val: freqLabel.label, icon: freqLabel.icon, color: freqLabel.color } : null,
                            ].filter(Boolean).map((card, i) => (
                                <div className="col-6 col-md-3" key={i}>
                                    <div className="card border-0 shadow-sm rounded-4 p-3 h-100"
                                        style={{ borderLeft: `4px solid ${card.color}` }}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: 14 }} />
                                            <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>{card.label}</small>
                                        </div>
                                        <h4 className="fw-bold mb-0" style={{ color: card.color, fontSize: '1.4rem' }}>{card.val}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TIMELINE DU JOUR */}
                        <section className="mb-4">
                            <h6 className="text-uppercase text-muted small fw-bold mb-3">
                                Mesures d'aujourd'hui
                                <span className="ms-2 fw-normal text-dark">({selectedMesure.unit})</span>
                            </h6>
                            <div className="d-flex gap-3 overflow-auto pb-2">
                                {todayData.length === 0 && (
                                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center flex-shrink-0 d-flex align-items-center justify-content-center"
                                        style={{ minWidth: 140, minHeight: 100 }}>
                                        <i className="bi bi-dash-circle text-muted d-block mb-1" />
                                        <span className="text-muted small">Aucune mesure</span>
                                    </div>
                                )}
                                {todayData.map((m, i) => {
                                    const isAlert = m.valeur > (selectedMesure.maxTarget ?? Infinity)
                                        || (selectedMesure.minTarget && m.valeur < selectedMesure.minTarget);
                                    return (
                                        <div key={i}
                                            className="card border-0 shadow-sm rounded-4 p-3 text-center flex-shrink-0 position-relative"
                                            style={{ minWidth: 130, borderTop: `3px solid ${isAlert ? '#dc3545' : accentColor}`, overflow: 'visible' }}>
                                            <div className="position-absolute" style={{ top: 6, right: 6, zIndex: 10 }}>
                                                <button className="btn btn-link text-muted p-0 border-0"
                                                    style={{ boxShadow: 'none', lineHeight: 1, fontSize: 14 }}
                                                    onClick={e => { e.stopPropagation(); setOpenMenuIdx(openMenuIdx === i ? null : i); }}>
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                                {openMenuIdx === i && (
                                                    <div className="bg-white shadow rounded-3 border py-1"
                                                        style={{ position: 'absolute', right: 0, top: '100%', minWidth: 130, zIndex: 1000, fontSize: '0.82rem' }}
                                                        onClick={e => e.stopPropagation()}>
                                                        <button className="dropdown-item py-2 d-flex align-items-center gap-2"
                                                            onClick={() => { setEditResultModal({ result: m, mesure: selectedMesure }); setOpenMenuIdx(null); }}>
                                                            <i className="bi bi-pencil text-primary" style={{ fontSize: 12 }}></i> Modifier
                                                        </button>
                                                        <hr className="dropdown-divider my-0" />
                                                        <button className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                                                            onClick={() => { setDeleteResultModal({ result: m, mesure: selectedMesure }); setOpenMenuIdx(null); }}>
                                                            <i className="bi bi-trash3" style={{ fontSize: 12 }}></i> Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-muted small d-block mb-1 fw-bold">{m.time}</span>
                                            <h4 className="fw-bold mb-1" style={{ color: isAlert ? '#dc3545' : accentColor }}>{m.valeur}</h4>
                                            {m.note && <span className="text-muted d-block text-truncate" style={{ fontSize: '0.7rem' }}>{m.note}</span>}
                                            {isAlert && <span className="badge bg-danger mt-1 rounded-pill" style={{ fontSize: '0.6rem' }}>Alerte</span>}
                                        </div>
                                    );
                                })}
                                <div onClick={() => setSaisieModal(selectedMesure)}
                                    className="card border-0 shadow-sm rounded-4 p-3 text-center flex-shrink-0 d-flex flex-column align-items-center justify-content-center"
                                    style={{ minWidth: 110, cursor: 'pointer', background: `${accentColor}12` }}>
                                    <i className="bi bi-plus-circle fs-4 mb-1" style={{ color: accentColor }} />
                                    <span className="fw-bold small" style={{ color: accentColor }}>Saisir</span>
                                </div>
                            </div>
                        </section>

                        {/* GRAPHIQUE */}
                        <MesureChart
                            selectedMesure={selectedMesure}
                            chartData={chartData}
                            periods={periods}
                            safePeriodIdx={safePeriodIdx}
                            freqLabel={freqLabel}
                            alertesPeriode={alertesPeriode}
                            accentColor={accentColor}
                            periodLabelText={periodLabelText}
                            setPeriodIndex={setPeriodIndex}
                        />

                        {/* BAS */}
                        <div className="row g-4">
                            <div className="col-md-7">
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                    <h5 className="fw-bold mb-4">
                                        Notes — Période {safePeriodIdx + 1}
                                        <span className="badge bg-secondary ms-2 rounded-pill">
                                            {chartData.filter(h => h.note && h.note.trim() !== '').length}
                                        </span>
                                    </h5>
                                    <div className="d-flex flex-column gap-2 pe-1" style={{ maxHeight: 320, overflowY: 'auto' }}>
                                        {chartData.filter(h => h.note && h.note.trim() !== '').length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                <i className="bi bi-chat-left-text fs-2 d-block mb-2 opacity-25" />
                                                Aucune note pour cette période.
                                            </div>
                                        ) : (
                                            chartData.filter(h => h.note && h.note.trim() !== '').map((item, i) => (
                                                <div key={i} className="d-flex justify-content-between align-items-start p-3 mb-1 rounded-3 bg-white border">
                                                    <div className="d-flex align-items-start gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                                                        <span className="badge rounded-pill px-2 py-1 text-white fw-bold flex-shrink-0"
                                                            style={{ background: accentColor, fontSize: '0.9rem' }}>
                                                            {item.valeur} {selectedMesure.unit}
                                                        </span>
                                                        <small className="text-muted text-break">{item.note}</small>
                                                    </div>
                                                    <div className="d-flex flex-column align-items-end gap-1 ms-2 flex-shrink-0">
                                                        <div className="text-end text-muted small">{item.time} · {item.day}</div>
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-sm btn-link text-primary p-0"
                                                                onClick={() => setEditNoteModal({ result: item, mesure: selectedMesure })}>
                                                                <i className="bi bi-pencil" style={{ fontSize: 12 }}></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-link text-danger p-0"
                                                                onClick={() => setDeleteNoteModal({ result: item, mesure: selectedMesure })}>
                                                                <i className="bi bi-trash3" style={{ fontSize: 12 }}></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-5">
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100 d-flex flex-column"
                                    style={{ background: '#1a1d2e', color: '#fff' }}>
                                    <h6 className="small text-uppercase fw-bold mb-4" style={{ opacity: 0.5 }}>Stats — Période {safePeriodIdx + 1}</h6>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="fs-5 fw-medium">Moyenne</span>
                                            <div className="text-end">
                                                <span className="display-6 fw-bold text-info">{moyenneVal}</span>
                                                <span className="ms-2 small" style={{ opacity: 0.5 }}>{selectedMesure.unit}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="fs-5 fw-medium">Dernière</span>
                                            <div className="text-end">
                                                <span className={`display-6 fw-bold ${isAbove ? 'text-danger' : isBelow ? 'text-warning' : 'text-white'}`}>
                                                    {lastVal ?? '—'}
                                                </span>
                                                <span className="ms-2 small" style={{ opacity: 0.5 }}>{selectedMesure.unit}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="fs-5 fw-medium">Alertes période</span>
                                            <span className={`display-6 fw-bold ${alertesPeriode.length > 0 ? 'text-danger' : 'text-white'}`}>
                                                {alertesPeriode.length}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-4"
                                            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                                            <span className="small fw-medium" style={{ opacity: 0.6 }}>Total alertes</span>
                                            <span className={`fw-bold fs-5 ${allAlertes.length > 0 ? 'text-danger' : 'text-white'}`}>
                                                {allAlertes.length}
                                            </span>
                                        </div>
                                        {(isAbove || isBelow) && (
                                            <div className={`rounded-3 p-2 mb-2 d-flex align-items-center gap-2 ${isAbove ? 'bg-danger' : 'bg-warning'} bg-opacity-25`}>
                                                <i className={`bi ${isAbove ? 'bi-arrow-up-circle-fill text-danger' : 'bi-arrow-down-circle-fill text-warning'}`} />
                                                <small className="fw-bold">
                                                    {isAbove
                                                        ? `Au-dessus du max (${selectedMesure.maxTarget})`
                                                        : `En-dessous du min (${selectedMesure.minTarget})`}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-3 mt-2 d-flex align-items-center gap-3"
                                        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <i className="bi bi-info-circle fs-5 text-info flex-shrink-0" />
                                        <p className="mb-0 small fw-medium" style={{ opacity: 0.6 }}>
                                            {chartData.length} mesure{chartData.length !== 1 ? 's' : ''} cette période · {allHistory.length} au total
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* MODALS */}
            {saisieModal       && <SaisieModal        mesure={saisieModal}                    onClose={() => setSaisieModal(null)}       onSave={handleSave}            />}
            {deleteModal       && <DeleteModal         mesure={deleteModal}                    onClose={() => setDeleteModal(null)}       onConfirm={handleDelete}       />}
            {editResultModal   && <EditResultModal     result={editResultModal.result}   mesure={editResultModal.mesure}   onClose={() => setEditResultModal(null)}   onSave={handleUpdateResult}    />}
            {deleteResultModal && <DeleteResultModal   result={deleteResultModal.result} mesure={deleteResultModal.mesure} onClose={() => setDeleteResultModal(null)} onConfirm={handleDeleteResult} />}
            {editNoteModal     && <EditNoteModal       result={editNoteModal.result}     mesure={editNoteModal.mesure}     onClose={() => setEditNoteModal(null)}     onSave={handleUpdateNote}      />}
            {deleteNoteModal   && <DeleteNoteModal     result={deleteNoteModal.result}   mesure={deleteNoteModal.mesure}   onClose={() => setDeleteNoteModal(null)}   onConfirm={handleDeleteNote}   />}

            {/* ✅ Modal PDF */}
            {pdfModalOpen && (
                <PdfModal
                    mesuresData={mesuresData}
                    patientName="Sara"
                    onClose={() => setPdfModalOpen(false)}
                />
            )}
        </div>
    );
};

export default MesureDashboard;