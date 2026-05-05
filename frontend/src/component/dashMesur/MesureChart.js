import {
    AreaChart, Area, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, LabelList
} from 'recharts';

// ─── Dot alerte (AreaChart) ───────────────────────────────────────────────────
const AlertDot = (props) => {
    const { cx, cy, payload, maxTarget, minTarget, stroke } = props;
    const isAlert = (maxTarget && payload.valeur > maxTarget) || (minTarget && payload.valeur < minTarget);
    if (!isAlert) return <circle cx={cx} cy={cy} r={3.5} fill={stroke} />;
    return (
        <g>
            <circle cx={cx} cy={cy} r={7} fill="#ff4d4f" opacity={0.2} />
            <circle cx={cx} cy={cy} r={4} fill="#ff4d4f" />
        </g>
    );
};

// ─── Tooltip commun ───────────────────────────────────────────────────────────
const tooltipStyle = { background: '#1a1d2e', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13 };

const makeFormatter = (mesure) => (val) => {
    const isAlertVal = (mesure.maxTarget && val > mesure.maxTarget) ||
        (mesure.minTarget && val < mesure.minTarget);
    return [`${val} ${mesure.unit ?? ''} ${isAlertVal ? '⚠️' : ''}`, mesure.name];
};

// ─── Graphique Mensuel / Bimestriel / Trimestriel : BarChart + cartes récap ───
const MonthlyChart = ({ chartData, selectedMesure, accentColor }) => {
    const prev = (i) => chartData[i - 1]?.valeur ?? null;
    return (
        <div>
            {/* Barres */}
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip contentStyle={tooltipStyle} formatter={makeFormatter(selectedMesure)} />
                        {selectedMesure.maxTarget && (
                            <ReferenceLine y={selectedMesure.maxTarget} stroke="#ff4d4f" strokeDasharray="5 5"
                                label={{ position: 'right', value: 'Max', fill: '#ff4d4f', fontSize: 11 }} />
                        )}
                        {selectedMesure.minTarget && (
                            <ReferenceLine y={selectedMesure.minTarget} stroke="#f6a935" strokeDasharray="5 5"
                                label={{ position: 'right', value: 'Min', fill: '#f6a935', fontSize: 11 }} />
                        )}
                        <Bar dataKey="valeur" radius={[6, 6, 0, 0]}>
                            <LabelList dataKey="valeur" position="top" style={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
                            {chartData.map((entry, i) => {
                                const isAlert = (selectedMesure.maxTarget && entry.valeur > selectedMesure.maxTarget) ||
                                    (selectedMesure.minTarget && entry.valeur < selectedMesure.minTarget);
                                return <Cell key={i} fill={isAlert ? '#ff4d4f' : accentColor} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Cartes récap */}
            <div className="d-flex gap-2 mt-3 overflow-auto pb-1">
                {chartData.map((item, i) => {
                    const diffNum = prev(i) !== null ? item.valeur - prev(i) : null;
                    const diff    = diffNum !== null ? diffNum.toFixed(1) : null;
                    const isAlert = (selectedMesure.maxTarget && item.valeur > selectedMesure.maxTarget) ||
                        (selectedMesure.minTarget && item.valeur < selectedMesure.minTarget);
                    const isUp = diffNum > 0;
                    return (
                        <div key={i} className="flex-shrink-0 rounded-3 p-3 text-center"
                            style={{ minWidth: 90, background: isAlert ? '#fff1f0' : '#f8f9fa', border: `1.5px solid ${isAlert ? '#ff4d4f' : '#e9ecef'}` }}>
                            <div className="small text-muted fw-bold mb-1">{item.day}</div>
                            <div className="fw-bold" style={{ fontSize: '1.1rem', color: isAlert ? '#ff4d4f' : accentColor }}>
                                {item.valeur}
                            </div>
                            <div className="small" style={{ color: isAlert ? '#ff4d4f' : '#6b7280' }}>
                                {selectedMesure.unit}
                            </div>
                            {diff !== null && (
                                <div className="small mt-1 fw-bold" style={{ color: isUp ? '#e74a3b' : '#1cc88a' }}>
                                    {isUp ? '↑' : '↓'} {Math.abs(diff)}
                                </div>
                            )}
                            {isAlert && <div className="badge bg-danger mt-1 rounded-pill" style={{ fontSize: '0.55rem' }}>Alerte</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Graphique Quotidien / Hebdomadaire : AreaChart ───────────────────────────
const DefaultChart = ({ chartData, selectedMesure, accentColor }) => (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={accentColor} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} formatter={makeFormatter(selectedMesure)} />
                {selectedMesure.maxTarget && (
                    <ReferenceLine y={selectedMesure.maxTarget} stroke="#ff4d4f" strokeDasharray="5 5"
                        label={{ position: 'right', value: 'Max', fill: '#ff4d4f', fontSize: 11 }} />
                )}
                {selectedMesure.minTarget && (
                    <ReferenceLine y={selectedMesure.minTarget} stroke="#f6a935" strokeDasharray="5 5"
                        label={{ position: 'right', value: 'Min', fill: '#f6a935', fontSize: 11 }} />
                )}
                <Area type="monotone" dataKey="valeur"
                    stroke={accentColor} strokeWidth={3} fill="url(#grad)"
                    dot={(props) => <AlertDot {...props} maxTarget={selectedMesure.maxTarget} minTarget={selectedMesure.minTarget} stroke={accentColor} />}
                    activeDot={{ r: 6, fill: accentColor, strokeWidth: 0 }} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
const MesureChart = ({ selectedMesure, chartData, periods, safePeriodIdx, freqLabel, alertesPeriode, accentColor, periodLabelText, setPeriodIndex }) => (
    <section className="mb-4">
        <div className="card border-0 shadow-sm rounded-4 p-4">

            {/* Navigation périodes */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h5 className="fw-bold mb-0 text-dark">Évolution : {selectedMesure.name}</h5>
                    {freqLabel && (
                        <span className="badge rounded-pill mt-1" style={{ background: freqLabel.color, fontSize: '0.7rem' }}>
                            <i className={`bi ${freqLabel.icon} me-1`} />{freqLabel.label}
                        </span>
                    )}
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-light rounded-circle"
                        disabled={safePeriodIdx === 0}
                        onClick={() => setPeriodIndex(w => Math.max(0, w - 1))}>
                        <i className="bi bi-chevron-left" />
                    </button>
                    <span className="small fw-bold text-muted px-1" style={{ whiteSpace: 'nowrap' }}>
                        {periods.length === 0 ? 'Aucune donnée' : `Période ${safePeriodIdx + 1}/${periods.length} (${periodLabelText})`}
                        {chartData.length > 0 && (
                            <span className="ms-2 fw-normal">{chartData[0]?.day} → {chartData[chartData.length - 1]?.day}</span>
                        )}
                    </span>
                    <button className="btn btn-sm btn-light rounded-circle"
                        disabled={safePeriodIdx >= periods.length - 1}
                        onClick={() => setPeriodIndex(w => Math.min(periods.length - 1, w + 1))}>
                        <i className="bi bi-chevron-right" />
                    </button>
                    {safePeriodIdx !== periods.length - 1 && periods.length > 0 && (
                        <button className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => setPeriodIndex(periods.length - 1)}>
                            Actuelle
                        </button>
                    )}
                </div>
            </div>

            {/* Alerte période */}
            {alertesPeriode.length > 0 && (
                <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-3" style={{ background: '#fdecea', fontSize: 13 }}>
                    <i className="bi bi-exclamation-circle-fill text-danger" />
                    <span className="text-danger fw-bold">{alertesPeriode.length} alerte{alertesPeriode.length > 1 ? 's' : ''} cette période</span>
                </div>
            )}

            {/* Graphique selon fréquence */}
            {chartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                    <i className="bi bi-bar-chart d-block fs-2 mb-2 opacity-25" />
                    Aucune donnée pour cette période
                </div>
            ) : ['Mensuel', 'Bimestriel', 'Trimestriel'].includes(freqLabel?.label) ? (
                <MonthlyChart chartData={chartData} selectedMesure={selectedMesure} accentColor={accentColor} />
            ) : (
                <DefaultChart chartData={chartData} selectedMesure={selectedMesure} accentColor={accentColor} />
            )}
        </div>
    </section>
);

export default MesureChart;