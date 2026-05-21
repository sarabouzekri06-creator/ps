import { useState, useEffect } from "react";
import axios from "axios";
import "./profil.css";

const API = "http://localhost:8000/api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

export default function Profile() {
  const [user, setUser] = useState({
    nom: "", prenom: "", email: "", age: "", maladies: "", notification: "patient"
  });
  const [contactEmail,  setContactEmail]  = useState("");
  const [showModal,     setShowModal]     = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [profileImage,  setProfileImage]  = useState(null);
  const [imageFile,     setImageFile]     = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [responsables,  setResponsables]  = useState([]);
  const [showRespForm,  setShowRespForm]  = useState(false);
  const [newRespEmail,  setNewRespEmail]  = useState("");
  const [pushStatus,    setPushStatus]    = useState('idle');

  const token  = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // ── Vérifier permission push au chargement ─────────────────────
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setPushStatus('enabled');
      if (Notification.permission === 'denied')  setPushStatus('denied');
    }
  }, []);

  // ── Charger le profil ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/user`, config).then(({ data }) => {
      const u = data.user || data;
      setUser({
        nom:          u.nom               || "",
        prenom:       u.prenom            || "",
        email:        u.email             || "",
        age:          u.age               || "",
        maladies:     u.maladies          || "",
        notification: u.notification_type || "patient",
      });
      if (u.profile_image)
        setProfileImage(`http://localhost:8000/storage/${u.profile_image}`);
      if (u.is_profile_complete) {
        setSaved(true);
        setContactEmail(u.contact_alerte_email || "");
      }
      if (data.responsables) {
        setResponsables(data.responsables);
      }
    }).catch(console.error);
  }, [token]);

  // ── Test email ─────────────────────────────────────────────────
  const testNotif = async () => {
    try {
      await axios.get(`${API}/test-notif`, config);
      alert("✅ Notif envoyée ! Vérifie ton email : " + contactEmail);
    } catch (err) {
      alert("❌ Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  // ── Activer push notifications ─────────────────────────────────
  const activatePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Votre navigateur ne supporte pas les notifications push.');
      return;
    }

    setPushStatus('loading');
    try {
      console.log("1. Enregistrement du SW...");

      // Enregistrer le service worker
      const reg = await navigator.serviceWorker.register('/sw.js');

      // Attendre que le SW soit vraiment actif (correction du bug)
      await new Promise((resolve) => {
        if (reg.active) {
          // Déjà actif
          resolve();
        } else {
          // En cours d'installation ou en attente
          const worker = reg.installing || reg.waiting;
          if (worker) {
            worker.addEventListener('statechange', function() {
              if (this.state === 'activated') resolve();
            });
          } else {
            // Attendre que le SW soit prêt
            navigator.serviceWorker.ready.then(() => resolve());
          }
        }
      });

      console.log("2. Demande de permission...");
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPushStatus('denied');
        console.warn("Permission refusée par l'utilisateur");
        return;
      }

      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      console.log("3. Clé VAPID récupérée :", vapidKey);

      if (!vapidKey) {
        alert('❌ Clé VAPID manquante dans .env');
        setPushStatus('idle');
        return;
      }

      console.log("4. Tentative d'abonnement...");

      // Récupérer l'abonnement existant ou en créer un nouveau
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      console.log("5. Abonnement réussi :", sub);

      const emailPourNotif = user.notification === 'patient' ? user.email : contactEmail;

      console.log("6. Envoi au serveur backend...");
      await axios.post(`${API}/push/subscribe`, {
        email: emailPourNotif,
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
          auth:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
        },
      }, config);

      setPushStatus('enabled');
      alert('✅ Notifications push activées !');

    } catch (err) {
      console.error('Erreur détaillée :', err);
      alert('❌ Erreur : ' + err.message);
      setPushStatus('idle');
    }
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleChange      = (e) => setUser({ ...user, [e.target.name]: e.target.value });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setProfileImage(URL.createObjectURL(file)); }
  };
  const handleRadioChange = (e) => {
    setUser({ ...user, notification: e.target.value });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!contactEmail) { setShowModal(true); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("nom",              user.nom);
    fd.append("prenom",           user.prenom);
    fd.append("age",              user.age);
    fd.append("maladies",         user.maladies);
    fd.append("notificationType", user.notification);
    fd.append("contactAlerte",    contactEmail);
    if (imageFile) fd.append("image", imageFile);
    try {
      await axios.post(`${API}/user/update`, fd, {
        headers: { ...config.headers, "Content-Type": "multipart/form-data" }
      });
      setSaved(true);
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Problème serveur"));
    } finally { setSaving(false); }
  };

  const toggleResponsable = async (id) => {
    const { data } = await axios.patch(`${API}/responsables/${id}`, {}, config);
    setResponsables(prev => prev.map(r => r.id === id ? data : r));
  };

  const addResponsable = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${API}/responsables`,
        { email_responsable: newRespEmail },
        config
      );
      setResponsables(prev => [...prev, data]);
      setNewRespEmail("");
      setShowRespForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const initials = `${user.nom?.charAt(0) ?? ""}${user.prenom?.charAt(0) ?? ""}`.toUpperCase() || "?";

  const modalLabel = user.notification === "patient"
    ? { title: "Votre email", sub: "Les notifications vous seront envoyées.", placeholder: "votre@email.com" }
    : { title: "Votre email", sub: "Vous recevrez les notifications de votre patient.", placeholder: "responsable@email.com" };

  const pushBtnStyle = {
    marginTop:    10,
    border:       `1.5px solid ${pushStatus === 'denied' ? '#ef4444' : '#4361ee'}`,
    borderRadius: 12,
    padding:      '8px 16px',
    background:   pushStatus === 'enabled' ? '#eff2ff' : '#fff',
    color:        pushStatus === 'denied'  ? '#ef4444' : '#4361ee',
    cursor:       pushStatus === 'enabled' || pushStatus === 'loading' ? 'default' : 'pointer',
    fontSize:     13,
    fontWeight:   600,
    width:        '100%',
    opacity:      pushStatus === 'loading' ? 0.7 : 1,
  };

  return (
    <>
      <div className="pf-root">
        <div className="pf-card">

          {/* ── SIDEBAR ── */}
          <div className="pf-sidebar">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar">
                {profileImage
                  ? <img src={profileImage} alt="profil" />
                  : <span className="pf-avatar-initials">{initials}</span>}
              </div>
              {!saved && (
                <label className="pf-avatar-upload" htmlFor="fileInput" title="Changer la photo">
                  <i className="bi bi-camera-fill" />
                  <input type="file" id="fileInput" className="d-none" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>

            <h2 className="pf-sidebar-name">
              {user.nom || user.prenom ? `${user.nom} ${user.prenom}` : "Mon Profil"}
            </h2>
            <p className="pf-sidebar-email">{user.email || "email@exemple.com"}</p>

            {user.age      && <div className="pf-stat"><div className="pf-stat-label">Âge</div><div className="pf-stat-val">{user.age} ans</div></div>}
            {user.maladies && <div className="pf-stat"><div className="pf-stat-label">Condition</div><div className="pf-stat-val">{user.maladies}</div></div>}

            {saved && (
              <div className="pf-notif-badge">
                <i className={`bi ${user.notification === "patient" ? "bi-person-fill" : "bi-people-fill"}`} />
                {user.notification === "patient" ? "Mode Patient" : "Mode Responsable"}
              </div>
            )}

            {saved && (
              <button className="pf-btn-outline" onClick={() => setSaved(false)}>
                <i className="bi bi-pencil me-2" />Modifier
              </button>
            )}

            {/* ── Push Notifications ── */}
            {saved && (
              <button onClick={activatePush} style={pushBtnStyle}>
                {pushStatus === 'loading' && <span>⏳ Activation…</span>}
                {pushStatus === 'enabled' && <><i className="bi bi-bell-fill me-2" />Push activées ✅</>}
                {pushStatus === 'denied'  && <><i className="bi bi-bell-slash me-2" />Bloquées</>}
                {pushStatus === 'idle'    && <><i className="bi bi-bell me-2" />Activer les notifications</>}
              </button>
            )}

            {pushStatus === 'denied' && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6, textAlign: 'center' }}>
                Autorisez dans les paramètres du navigateur
              </p>
            )}

            {/* ── Test email ── */}
            {saved && (
              <button onClick={testNotif} style={{
                marginTop: 10, border: "1.5px solid #10b981", borderRadius: 12,
                padding: "8px 16px", background: "#f0fdf4", color: "#10b981",
                cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%",
              }}>
                <i className="bi bi-envelope me-2" />Tester l'email
              </button>
            )}
          </div>

          {/* ── MAIN ── */}
          <div className="pf-main">
            <h3 className="pf-main-title">{saved ? "Informations du profil" : "Compléter le profil"}</h3>

            {saved ? (
              <div>
                <div className="pf-info-grid">
                  {[
                    { label: "Nom",               val: user.nom },
                    { label: "Prénom",             val: user.prenom },
                    { label: "Email",              val: user.email,                     full: true },
                    { label: "Âge",                val: user.age ? `${user.age} ans` : "—" },
                    { label: "Condition médicale", val: user.maladies },
                  ].map(({ label, val, full }) => (
                    <div key={label} className={`pf-info-item ${full ? "pf-info-full" : ""}`}>
                      <div className="pf-info-label">{label}</div>
                      <div className="pf-info-val">{val || "—"}</div>
                    </div>
                  ))}
                </div>

                <div className="pf-divider" />

                <div className="pf-info-label" style={{ marginBottom: 10 }}>Contact de notification</div>
                <div className="pf-notif-box">
                  <div className="pf-notif-icon">
                    <i className={`bi ${user.notification === "patient" ? "bi-person-fill" : "bi-people-fill"}`} />
                  </div>
                  <div>
                    <div className="pf-radio-text">{user.notification === "patient" ? "Patient" : "Responsable"}</div>
                    <div className="pf-radio-sub">{contactEmail || "—"}</div>
                  </div>
                </div>

                {user.notification === "responsable" && (
                  <div style={{ marginTop: 20 }}>
                    <div className="pf-divider" />
                    <div className="pf-info-label" style={{ marginBottom: 10 }}>Gestion des responsables</div>

                    {responsables.map(r => (
                      <div key={r.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 10, marginBottom: 8,
                        background: r.is_active ? "#f0fdf4" : "#fafafa",
                        border: `1.5px solid ${r.is_active ? "#10b981" : "#e2e8f0"}`,
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {r.ordre === 1 ? "👤 Principal" : "👥 Remplaçant"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{r.email_responsable}</div>
                        </div>
                        <button onClick={() => toggleResponsable(r.id)} style={{
                          border: "none", borderRadius: 8, padding: "6px 14px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: r.is_active ? "#fee2e2" : "#dcfce7",
                          color: r.is_active ? "#ef4444" : "#10b981",
                        }}>
                          {r.is_active ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    ))}

                    {responsables.length < 2 && !showRespForm && (
                      <button onClick={() => setShowRespForm(true)} style={{
                        border: "1.5px dashed #cbd5e1", borderRadius: 10, padding: "10px 16px",
                        width: "100%", background: "transparent", cursor: "pointer",
                        fontSize: 13, color: "#64748b", marginTop: 6,
                      }}>
                        <i className="bi bi-plus-circle me-2" />Ajouter un responsable remplaçant
                      </button>
                    )}

                    {showRespForm && (
                      <form onSubmit={addResponsable} style={{ marginTop: 10 }}>
                        <input
                          type="email" required placeholder="email@exemple.com"
                          value={newRespEmail} onChange={e => setNewRespEmail(e.target.value)}
                          className="pf-input" style={{ marginBottom: 8 }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="submit" className="pf-submit" style={{ flex: 1 }}>Ajouter</button>
                          <button type="button" onClick={() => setShowRespForm(false)} style={{
                            border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 16px",
                            background: "#fff", cursor: "pointer", color: "#64748b",
                          }}>Annuler</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSave} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="pf-grid" style={{ flex: 1 }}>
                  {[
                    { name: "nom",      label: "Nom",               placeholder: "Dupont",            type: "text"            },
                    { name: "prenom",   label: "Prénom",            placeholder: "Marie",             type: "text"            },
                    { name: "email",    label: "Email",             placeholder: "marie@exemple.com", type: "email", full: true },
                    { name: "age",      label: "Âge",               placeholder: "42",                type: "number"          },
                    { name: "maladies", label: "Condition médicale", placeholder: "Diabète…",         type: "text"            },
                  ].map(({ name, label, placeholder, type, full }) => (
                    <div key={name} className={`pf-field ${full ? "pf-full" : ""}`}>
                      <label>{label}</label>
                      <input
                        className="pf-input" type={type} name={name}
                        value={user[name]} onChange={handleChange}
                        placeholder={placeholder} required
                        {...(name === "age" ? { min: "1" } : {})}
                      />
                    </div>
                  ))}

                  <div className="pf-full">
                    <div className="pf-info-label" style={{ marginBottom: 10 }}>Type de notification</div>
                    <div className="pf-notif-group">
                      {[
                        { val: "patient",     icon: "bi-person-fill", label: "Patient",     sub: "Notifications pour moi" },
                        { val: "responsable", icon: "bi-people-fill", label: "Responsable", sub: "Pour un proche" },
                      ].map(opt => (
                        <label key={opt.val} className={`pf-radio-card ${user.notification === opt.val ? "active" : ""}`}>
                          <input type="radio" value={opt.val} checked={user.notification === opt.val}
                            onChange={handleRadioChange} className="d-none" />
                          <div className={`pf-radio-dot ${user.notification === opt.val ? "checked" : ""}`} />
                          <div>
                            <div className="pf-radio-text">
                              <i className={`bi ${opt.icon} me-1`} style={{ color: "var(--pf-accent)" }} />
                              {opt.label}
                            </div>
                            <div className="pf-radio-sub">{opt.sub}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pf-divider" />
                <button type="submit" className="pf-submit" disabled={saving}>
                  {saving
                    ? <><div className="pf-spinner" /> Enregistrement…</>
                    : <><i className="bi bi-check2-circle" /> Enregistrer le profil</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL EMAIL ── */}
      {showModal && (
        <div className="pf-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <h4 className="pf-modal-title">{modalLabel.title}</h4>
            <p className="pf-modal-sub">{modalLabel.sub}</p>
            <form onSubmit={e => { e.preventDefault(); setShowModal(false); }}>
              <div className="pf-field" style={{ marginBottom: 16 }}>
                <label>Email</label>
                <input
                  className="pf-input" type="email" required autoFocus
                  placeholder={modalLabel.placeholder}
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="pf-submit">
                <i className="bi bi-check2" /> Valider
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}