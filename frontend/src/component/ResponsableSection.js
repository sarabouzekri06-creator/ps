import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ResponsableSection({ patientId, token }) {
    const [responsables, setResponsables]   = useState([]);
    const [newEmail,     setNewEmail]       = useState('');
    const [showForm,     setShowForm]       = useState(false);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        axios.get('http://localhost:8000/api/responsables', config)
             .then(r => setResponsables(r.data))
             .catch(console.error);
    }, []);

    const toggle = async (id) => {
        const { data } = await axios.patch(
            `http://localhost:8000/api/responsables/${id}`, {}, config
        );
        setResponsables(prev => prev.map(r => r.id === id ? data : r));
    };

    const addResponsable = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(
                'http://localhost:8000/api/responsables',
                { email_responsable: newEmail },
                config
            );
            setResponsables(prev => [...prev, data]);
            setNewEmail('');
            setShowForm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    return (
        <div>
            {responsables.map(r => (
                <div key={r.id} style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '10px 14px',
                    borderRadius:   10,
                    marginBottom:   8,
                    background:     r.is_active ? '#f0fdf4' : '#fafafa',
                    border:         `1.5px solid ${r.is_active ? '#10b981' : '#e2e8f0'}`,
                }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {r.ordre === 1 ? '👤 Principal' : '👥 Remplaçant'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                            {r.email_responsable}
                        </div>
                    </div>
                    <button
                        onClick={() => toggle(r.id)}
                        style={{
                            border:       'none',
                            borderRadius: 8,
                            padding:      '6px 14px',
                            fontSize:     12,
                            fontWeight:   600,
                            cursor:       'pointer',
                            background:   r.is_active ? '#fee2e2' : '#dcfce7',
                            color:        r.is_active ? '#ef4444' : '#10b981',
                        }}
                    >
                        {r.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                </div>
            ))}

            {responsables.length < 2 && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        border:       '1.5px dashed #cbd5e1',
                        borderRadius: 10,
                        padding:      '10px 16px',
                        width:        '100%',
                        background:   'transparent',
                        cursor:       'pointer',
                        fontSize:     13,
                        color:        '#64748b',
                        marginTop:    6,
                    }}
                >
                    <i className="bi bi-plus-circle me-2" />
                    Ajouter un responsable remplaçant
                </button>
            )}

            {showForm && (
                <form onSubmit={addResponsable} style={{ marginTop: 10 }}>
                    <input
                        type="email"
                        required
                        placeholder="email@exemple.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="pf-input"
                        style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="pf-submit" style={{ flex: 1 }}>
                            Ajouter
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            style={{
                                border: '1.5px solid #e2e8f0', borderRadius: 12,
                                padding: '10px 16px', background: '#fff',
                                cursor: 'pointer', color: '#64748b',
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}