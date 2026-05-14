import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getMeta } from './model';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

const parseNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val);
    const n = parseFloat(str.includes('/') ? str.split('/')[0] : str);
    return isNaN(n) ? null : n;
};

const hex2rgb = (hex) => {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
};

const tendency = (history) => {
    if (history.length < 3) return { label: 'Insuffisant', icon: '—', color: [150, 150, 150] };
    const vals = history.map(h => parseNum(h.valeur)).filter(v => v !== null);
    if (vals.length < 3) return { label: 'Insuffisant', icon: '—', color: [150, 150, 150] };
    const half = Math.floor(vals.length / 2);
    const avg1 = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const avg2 = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
    const diff = avg2 - avg1;
    if (Math.abs(diff) < 1) return { label: 'Stable',   icon: '→', color: [0, 180, 120] };
    if (diff > 0)           return { label: 'En hausse', icon: '↑', color: [230, 80,  80] };
    return                         { label: 'En baisse', icon: '↓', color: [67,  97, 238] };
};

// ─────────────────────────────────────────────────────────────────────────────
// Génération complète du PDF — tableau uniquement
// ─────────────────────────────────────────────────────────────────────────────

const generateMedicalPdf = async (mesuresData, selectedIds, patientName = 'Patient') => {

    const chosen = mesuresData.filter(m => selectedIds.includes(m.id));
    const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W      = 210;
    const margin = 14;

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // ── Page de couverture ──────────────────────────────────────────────────
    // Fond bleu foncé
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 297, 'F');

    // Bande accent
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, 6, 297, 'F');

    // Logo / Titre app
    doc.setTextColor(67, 97, 238);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('REMEMBER', 20, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de Santé', 20, 75);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(patientName, 20, 88);

    doc.setFontSize(10);
    doc.text(`Généré le ${today}`, 20, 100);

    // Séparateur
    doc.setDrawColor(67, 97, 238);
    doc.setLineWidth(0.5);
    doc.line(20, 110, W - 20, 110);

    // Résumé global
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Contenu du rapport', 20, 125);

    chosen.forEach((mesure, i) => {
        const history    = [...(mesure.history || [])].reverse();
        const alertCount = history.filter(h =>
            (mesure.maxTarget && parseNum(h.valeur) > mesure.maxTarget) ||
            (mesure.minTarget && parseNum(h.valeur) < mesure.minTarget)
        ).length;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`${i + 1}.  ${mesure.name}`, 24, 136 + i * 10);

        doc.setTextColor(255, 255, 255);
        doc.text(`${history.length} mesures`, 100, 136 + i * 10);

        if (alertCount > 0) {
            doc.setTextColor(239, 68, 68);
            doc.text(`${alertCount} alertes`, 145, 136 + i * 10);
        } else {
            doc.setTextColor(0, 196, 140);
            doc.text('OK', 145, 136 + i * 10);
        }
    });

    // Pied de couverture
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Ce document est confidentiel. Généré par l\'application Remember.', W / 2, 280, { align: 'center' });

    // ── Une page par mesure ─────────────────────────────────────────────────
    chosen.forEach((mesure) => {
        doc.addPage();

        const history   = [...(mesure.history || [])].reverse();
        const unit      = mesure.unit ?? '';
        const color     = mesure.color ?? '#4361ee';
        const accentRgb = hex2rgb(color);

        let y = 0;

        // ── En-tête de page ─────────────────────────────────────────────────
        // Barre latérale couleur
        doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
        doc.rect(0, 0, 5, 297, 'F');

        // Header fond
        doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
        doc.rect(5, 0, W - 5, 28, 'F');

        // Titre mesure
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(mesure.name, margin, 12);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(`Unité : ${unit}   ·   ${history.length} mesures au total   ·   ${today}`, margin, 21);

        // App name à droite
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('REMEMBER', W - margin, 10, { align: 'right' });
        doc.setFontSize(7);
        doc.text('Rapport de santé', W - margin, 17, { align: 'right' });

        y = 35;

        // ── Objectifs cibles ────────────────────────────────────────────────
        if (mesure.maxTarget || mesure.minTarget) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            const targets = [];
            if (mesure.maxTarget) targets.push(`Maximum cible : ${mesure.maxTarget} ${unit}`);
            if (mesure.minTarget) targets.push(`Minimum cible : ${mesure.minTarget} ${unit}`);
            doc.text(`Cibles thérapeutiques — ${targets.join('   ·   ')}`, margin, y + 4);
            y += 10;
        }

        // ── Titre section tableau ───────────────────────────────────────────
        doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
        doc.rect(margin, y, 2.5, 6, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Historique détaillé', margin + 5, y + 5);
        y += 9;

        // ── Tableau historique ──────────────────────────────────────────────
        const tableRows = history.slice(0, 50).map(h => {
            const v       = parseNum(h.valeur);
            const isAlert = v !== null && (
                (mesure.maxTarget && v > mesure.maxTarget) ||
                (mesure.minTarget && v < mesure.minTarget)
            );
            return {
                date:   h.day  ?? '—',
                time:   h.time ?? '—',
                value:  `${h.valeur ?? '—'} ${unit}`,
                status: isAlert ? '⚠ Alerte' : '✓ Normal',
                note:   h.note ? h.note.substring(0, 40) : '—',
                _alert: isAlert,
            };
        });

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Date', 'Heure', 'Valeur', 'Statut', 'Note']],
            body: tableRows.map(r => [r.date, r.time, r.value, r.status, r.note]),
            theme: 'grid',
            styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                font: 'helvetica',
                textColor: [30, 30, 30],
                lineColor: [220, 220, 230],
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: accentRgb,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            columnStyles: {
                0: { cellWidth: 22, halign: 'center' },
                1: { cellWidth: 18, halign: 'center' },
                2: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
                3: { cellWidth: 24, halign: 'center' },
                4: { cellWidth: 'auto' },
            },
            alternateRowStyles: {
                fillColor: [248, 249, 251],
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    const row = tableRows[data.row.index];
                    if (row?._alert) {
                        data.cell.styles.textColor = [220, 50, 50];
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [0, 150, 100];
                    }
                }
                if (data.section === 'body' && data.column.index === 2) {
                    const row = tableRows[data.row.index];
                    if (row?._alert) {
                        data.cell.styles.textColor = [220, 50, 50];
                    } else {
                        data.cell.styles.textColor = accentRgb;
                    }
                }
            },
        });

        // Si > 50 entrées
        if (history.length > 50) {
            const afterY = doc.lastAutoTable.finalY + 4;
            doc.setFontSize(7.5);
            doc.setTextColor(160, 160, 160);
            doc.text(`… et ${history.length - 50} mesures supplémentaires non affichées.`, margin, afterY);
        }

        // ── Pied de page ────────────────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
            `Remember · Rapport confidentiel · ${mesure.name} · Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${totalPages}`,
            W / 2, 292, { align: 'center' }
        );
        doc.setDrawColor(220, 220, 230);
        doc.setLineWidth(0.2);
        doc.line(margin, 289, W - margin, 289);
    });

    // Numéroter toutes les pages
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
            `Remember · Page ${p} / ${total}`,
            W / 2, 292, { align: 'center' }
        );
    }

    doc.save(`rapport-sante-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant Modal
// ─────────────────────────────────────────────────────────────────────────────

const PdfModal = ({ mesuresData, onClose, patientName = 'Patient' }) => {
    const [selected,   setSelected]   = useState(() => Object.fromEntries(mesuresData.map(m => [m.id, true])));
    const [generating, setGenerating] = useState(false);

    const toggle     = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
    const allChecked = Object.values(selected).every(Boolean);
    const toggleAll  = () => setSelected(Object.fromEntries(mesuresData.map(m => [m.id, !allChecked])));
    const nbSelected = Object.values(selected).filter(Boolean).length;

    const handleGenerate = async () => {
        const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k));
        if (ids.length === 0) { toast.error('Sélectionnez au moins une mesure'); return; }
        setGenerating(true);
        try {
            await generateMedicalPdf(mesuresData, ids, patientName);
            toast.success('PDF généré avec succès !');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de la génération du PDF');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: 20, width: 520, maxWidth: '95vw',
                boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', maxHeight: '90vh',
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #4361ee)', padding: '22px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-file-earmark-medical" style={{ color: '#fff', fontSize: 18 }} />
                                </div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>Exporter en PDF</h3>
                            </div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                                Rapport médical avec historique détaillé
                            </p>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
                            width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <i className="bi bi-x" />
                        </button>
                    </div>

                    {/* Aperçu contenu PDF */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        {[
                            { icon: 'bi-table',          label: 'Tableau historique' },
                            { icon: 'bi-chat-left-text', label: 'Cibles thérapeutiques' },
                        ].map((item, i) => (
                            <span key={i} style={{
                                background: 'rgba(255,255,255,0.15)', color: '#fff',
                                borderRadius: 99, fontSize: 11, padding: '4px 10px',
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}>
                                <i className={`bi ${item.icon}`} style={{ fontSize: 11 }} />
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Barre sélection */}
                <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                        <strong style={{ color: '#0f172a' }}>{nbSelected}</strong> / {mesuresData.length} mesure{nbSelected > 1 ? 's' : ''} sélectionnée{nbSelected > 1 ? 's' : ''}
                    </span>
                    <button onClick={toggleAll} style={{
                        border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '5px 14px',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: '#fff', color: '#475569',
                    }}>
                        {allChecked ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                </div>

                {/* Liste mesures */}
                <div style={{ padding: '12px 24px', overflowY: 'auto', flex: 1 }}>
                    {mesuresData.map(m => {
                        const meta    = getMeta(m.name);
                        const checked = selected[m.id];
                        const history = m.history || [];
                        const alerts  = history.filter(h => {
                            const v = parseNum(h.valeur);
                            return v !== null && (
                                (m.maxTarget && v > m.maxTarget) ||
                                (m.minTarget && v < m.minTarget)
                            );
                        }).length;
                        const vals  = history.map(h => parseNum(h.valeur)).filter(v => v !== null);
                        const avgV  = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
                        const tend  = tendency(history.slice().reverse());

                        return (
                            <div key={m.id} onClick={() => toggle(m.id)} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 16px', borderRadius: 14, marginBottom: 10,
                                cursor: 'pointer',
                                background: checked ? `${m.color ?? '#4361ee'}0d` : '#f8f9fb',
                                border: `1.5px solid ${checked ? (m.color ?? '#4361ee') : '#e2e8f0'}`,
                                transition: 'all 0.15s',
                            }}>
                                {/* Checkbox */}
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                    background: checked ? (m.color ?? '#4361ee') : '#fff',
                                    border: `2px solid ${checked ? (m.color ?? '#4361ee') : '#cbd5e1'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}>
                                    {checked && <i className="bi bi-check" style={{ color: '#fff', fontSize: 13 }} />}
                                </div>

                                {/* Icône */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                    background: `${m.color ?? '#4361ee'}18`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <i className={`bi ${meta.icon ?? 'bi-activity'}`} style={{ color: m.color ?? '#4361ee', fontSize: 18 }} />
                                </div>

                                {/* Infos */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', gap: 10 }}>
                                        <span>{history.length} entrée{history.length !== 1 ? 's' : ''}</span>
                                        {avgV && <span>Moy. {avgV} {m.unit}</span>}
                                        <span style={{ color: tend.color ? `rgb(${tend.color.join(',')})` : undefined }}>
                                            {tend.icon} {tend.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                                    {m.currentValue && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            color: m.color ?? '#4361ee',
                                            background: `${m.color ?? '#4361ee'}15`,
                                            padding: '2px 9px', borderRadius: 99,
                                        }}>
                                            {m.currentValue} {m.unit}
                                        </span>
                                    )}
                                    {alerts > 0 && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', padding: '2px 9px', borderRadius: 99 }}>
                                            {alerts} alerte{alerts > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fafafa' }}>
                    <button onClick={onClose} style={{
                        border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 20px',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#64748b',
                    }}>
                        Annuler
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || nbSelected === 0}
                        style={{
                            border: 'none', borderRadius: 12, padding: '10px 24px',
                            fontSize: 13, fontWeight: 700,
                            cursor: generating || nbSelected === 0 ? 'not-allowed' : 'pointer',
                            background: nbSelected === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #1e3a8a, #4361ee)',
                            color: nbSelected === 0 ? '#94a3b8' : '#fff',
                            display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'opacity 0.15s',
                            opacity: generating ? 0.8 : 1,
                        }}>
                        {generating ? (
                            <>
                                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Génération en cours…
                            </>
                        ) : (
                            <>
                                <i className="bi bi-download" />
                                Télécharger le PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
};

export default PdfModal;