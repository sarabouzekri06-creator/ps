import { useState, useEffect } from "react";
import axios from "axios";
import "./profil.css";

const API = "http://localhost:8000/api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export default function Profile() {
  const [user, setUser] = useState({
    nom: "", prenom: "", email: "", age: "", maladies: "",
    telephone: "", notification: "patient",
  });
  const [telephone, setTelephone] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Responsable 2 state
  const [resp2, setResp2] = useState(null); // { id, telephone, is_active }
  const [showResp2Form, setShowResp2Form] = useState(false);
  const [resp2Phone, setResp2Phone] = useState("");
  const [editingResp2, setEditingResp2] = useState(false);
  const [savingResp2, setSavingResp2] = useState(false);

  const [pushStatus, setPushStatus] = useState("idle");

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") setPushStatus("enabled");
      if (Notification.permission === "denied") setPushStatus("denied");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/user`, config).then(({ data }) => {
      const u = data.user || data;
      setUser({
        nom: u.nom || "",
        prenom: u.prenom || "",
        email: u.email || "",
        age: u.age || "",
        maladies: u.maladies || "",
        telephone: u.telephone || "",
        notification: u.notification_type || "patient",
      });
      if (u.profile_image)
        setProfileImage(`http://localhost:8000/storage/${u.profile_image}`);
      if (u.is_profile_complete) {
        setSaved(true);
        setTelephone(u.telephone || "");
      }
      // Responsable 2 (remplaçant)
      if (data.responsable2) {
        setResp2(data.responsable2);
      }
    }).catch(console.error);
  }, [token]);

  const testNotif = async () => {
    try {
      await axios.get(`${API}/test-notif`, config);
      alert("✅ Test envoyé !");
    } catch (err) {
      alert("❌ Erreur : " + (err.response?.data?.message || "Erreur serveur"));
    }
  };

  const handleLogout = async () => {
  try {
    await axios.post(`${API}/logout`, {}, config);
  } catch (err) {
    console.error(err);
  } finally {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
};

  const activatePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Votre navigateur ne supporte pas les notifications push.");
      return;
    }
    setPushStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await new Promise((resolve) => {
        if (reg.active) { resolve(); return; }
        const worker = reg.installing || reg.waiting;
        if (worker) {
          worker.addEventListener("statechange", function () {
            if (this.state === "activated") resolve();
          });
        } else {
          navigator.serviceWorker.ready.then(() => resolve());
        }
      });
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushStatus("denied"); return; }
      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidKey) { alert("❌ Clé VAPID manquante dans .env"); setPushStatus("idle"); return; }
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      await axios.post(`${API}/push/subscribe`, {
        email: user.email,
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")))),
        },
      }, config);
      setPushStatus("enabled");
      alert("✅ Notifications push activées !");
    } catch (err) {
      console.error("Erreur détaillée :", err);
      alert("❌ Erreur : " + err.message);
      setPushStatus("idle");
    }
  };

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
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
    if (!telephone) { setShowModal(true); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("nom", user.nom);
    fd.append("prenom", user.prenom);
    fd.append("age", user.age);
    fd.append("maladies", user.maladies);
    fd.append("telephone", telephone);
    fd.append("notificationType", user.notification);
    fd.append("contactAlerte", user.email);
    if (imageFile) fd.append("image", imageFile);
    try {
      await axios.post(`${API}/user/update`, fd, {
        headers: { ...config.headers, "Content-Type": "multipart/form-data" },
      });
      setSaved(true);
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Problème serveur"));
    } finally { setSaving(false); }
  };

  // ── Responsable 2 handlers ──
  const handleAddResp2 = async (e) => {
    e.preventDefault();
    if (!resp2Phone.trim()) return;
    setSavingResp2(true);
    try {
      const { data } = await axios.post(`${API}/responsables`, {
        telephone_responsable: resp2Phone,
        ordre: 2,
      }, config);
      setResp2(data);
      setResp2Phone("");
      setShowResp2Form(false);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'ajout");
    } finally { setSavingResp2(false); }
  };

  const handleUpdateResp2 = async (e) => {
    e.preventDefault();
    if (!resp2Phone.trim()) return;
    setSavingResp2(true);
    try {
      const { data } = await axios.patch(`${API}/responsables/${resp2.id}`, {
        telephone_responsable: resp2Phone,
      }, config);
      setResp2(data);
      setResp2Phone("");
      setEditingResp2(false);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la modification");
    } finally { setSavingResp2(false); }
  };

  const handleDeleteResp2 = async () => {
    if (!window.confirm("Supprimer le responsable remplaçant ?")) return;
    try {
      await axios.delete(`${API}/responsables/${resp2.id}`, config);
      setResp2(null);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const handleToggleResp2 = async () => {
    try {
      const { data } = await axios.patch(`${API}/responsables/${resp2.id}/toggle`, {}, config);
      setResp2(data);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const startEditResp2 = () => {
    setResp2Phone(resp2?.telephone || "");
    setEditingResp2(true);
  };

  const initials =
    `${user.nom?.charAt(0) ?? ""}${user.prenom?.charAt(0) ?? ""}`.toUpperCase() || "?";

  const modalLabel =
    user.notification === "patient"
      ? { title: "Votre numéro WhatsApp", sub: "Vous recevrez les notifications sur WhatsApp." }
      : { title: "Votre numéro WhatsApp (responsable)", sub: "En tant que responsable, entrez votre propre numéro WhatsApp." };

  const pushBtnStyle = {
    marginTop: 10, border: `1.5px solid ${pushStatus === "denied" ? "#ef4444" : "#4361ee"}`,
    borderRadius: 12, padding: "8px 16px",
    background: pushStatus === "enabled" ? "#eff2ff" : "#fff",
    color: pushStatus === "denied" ? "#ef4444" : "#4361ee",
    cursor: pushStatus === "enabled" || pushStatus === "loading" ? "default" : "pointer",
    fontSize: 13, fontWeight: 600, width: "100%",
    opacity: pushStatus === "loading" ? 0.7 : 1,
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
            {telephone     && <div className="pf-stat"><div className="pf-stat-label">WhatsApp</div><div className="pf-stat-val">{telephone}</div></div>}

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

            {saved && (
              <button onClick={activatePush} style={pushBtnStyle}>
                {pushStatus === "loading" && <span>⏳ Activation…</span>}
                {pushStatus === "enabled" && <><i className="bi bi-bell-fill me-2" />Push activées ✅</>}
                {pushStatus === "denied"  && <><i className="bi bi-bell-slash me-2" />Bloquées</>}
                {pushStatus === "idle"    && <><i className="bi bi-bell me-2" />Activer les notifications</>}
              </button>
            )}

            {pushStatus === "denied" && (
              <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6, textAlign: "center" }}>
                Autorisez dans les paramètres du navigateur
              </p>
            )}

            {saved && (
              <button onClick={testNotif} style={{
                marginTop: 10, border: "1.5px solid #25d366", borderRadius: 12,
                padding: "8px 16px", background: "#f0fdf4", color: "#25d366",
                cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%",
              }}>
                <i className="bi bi-whatsapp me-2" />Tester WhatsApp
              </button>
              
            )}

            <button onClick={handleLogout} style={{
  marginTop: 10, border: "1.5px solid #ef4444", borderRadius: 12,
  padding: "8px 16px", background: "#fff1f2", color: "#ef4444",
  cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%",
}}>
  <i className="bi bi-box-arrow-right me-2" />Déconnexion
</button>
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
                    { label: "Email",              val: user.email, full: true },
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

                {/* ── Notification contact ── */}
                <div className="pf-info-label" style={{ marginBottom: 10 }}>Contact de notification</div>
                <div className="pf-notif-box">
                  <div className="pf-notif-icon">
                    <i className={`bi ${user.notification === "patient" ? "bi-person-fill" : "bi-people-fill"}`} />
                  </div>
                  <div>
                    <div className="pf-radio-text">
                      {user.notification === "patient" ? "Patient" : "Responsable"}
                    </div>
                    <div className="pf-radio-sub">
                      <i className="bi bi-whatsapp me-1" style={{ color: "#25d366" }} />
                      {telephone || "—"}
                    </div>
                  </div>
                </div>

                {/* ── Section Responsable 2 (visible seulement en mode responsable) ── */}
                {user.notification === "responsable" && (
                  <div style={{ marginTop: 20 }}>
                    <div className="pf-divider" />

                    {/* Header section */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div className="pf-info-label" style={{ marginBottom: 2 }}>
                          Responsable remplaçant
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          Si vous êtes indisponible, ce responsable prendra le relais
                        </div>
                      </div>
                    </div>

                    {/* Responsable 2 — affiché */}
                    {resp2 && !editingResp2 && (
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderRadius: 12, marginBottom: 8,
                        background: resp2.is_active ? "#f0fdf4" : "#fafafa",
                        border: `1.5px solid ${resp2.is_active ? "#10b981" : "#e2e8f0"}`,
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                            👥 Remplaçant
                            <span style={{
                              marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 20,
                              background: resp2.is_active ? "#dcfce7" : "#fee2e2",
                              color: resp2.is_active ? "#10b981" : "#ef4444",
                            }}>
                              {resp2.is_active ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                            <i className="bi bi-whatsapp" style={{ color: "#25d366" }} />
                            {resp2.telephone || resp2.telephone_responsable || "—"}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6 }}>
                          {/* Activer / Désactiver */}
                          <button onClick={handleToggleResp2} title={resp2.is_active ? "Désactiver" : "Activer"} style={{
                            border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12,
                            background: resp2.is_active ? "#fee2e2" : "#dcfce7",
                            color: resp2.is_active ? "#ef4444" : "#10b981",
                          }}>
                            <i className={`bi ${resp2.is_active ? "bi-pause-fill" : "bi-play-fill"}`} />
                          </button>
                          {/* Modifier */}
                          <button onClick={startEditResp2} title="Modifier le numéro" style={{
                            border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12,
                            background: "#eff2ff", color: "#4361ee",
                          }}>
                            <i className="bi bi-pencil-fill" />
                          </button>
                          {/* Supprimer */}
                          <button onClick={handleDeleteResp2} title="Supprimer" style={{
                            border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12,
                            background: "#fff1f2", color: "#ef4444",
                          }}>
                            <i className="bi bi-trash-fill" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formulaire modification responsable 2 */}
                    {resp2 && editingResp2 && (
                      <div style={{
                        padding: "14px 16px", borderRadius: 12, marginBottom: 8,
                        background: "#f8fafc", border: "1.5px solid #4361ee",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#4361ee" }}>
                          <i className="bi bi-pencil me-2" />Modifier le numéro du remplaçant
                        </div>
                        <form onSubmit={handleUpdateResp2}>
                          <div className="pf-field" style={{ marginBottom: 10 }}>
                            <label>
                              <i className="bi bi-whatsapp me-1" style={{ color: "#25d366" }} />
                              Nouveau numéro WhatsApp
                            </label>
                            <input
                              className="pf-input" type="tel" required autoFocus
                              placeholder="+212600000000"
                              value={resp2Phone}
                              onChange={(e) => setResp2Phone(e.target.value)}
                            />
                            <small style={{ color: "#94a3b8", fontSize: 11 }}>
                              Format international : +212XXXXXXXXX
                            </small>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="submit" className="pf-submit" style={{ flex: 1 }} disabled={savingResp2}>
                              {savingResp2
                                ? <><div className="pf-spinner" /> Enregistrement…</>
                                : <><i className="bi bi-check2" /> Enregistrer</>}
                            </button>
                            <button type="button" onClick={() => { setEditingResp2(false); setResp2Phone(""); }} style={{
                              border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 16px",
                              background: "#fff", cursor: "pointer", color: "#64748b", fontSize: 13,
                            }}>Annuler</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Bouton ajouter responsable 2 */}
                    {!resp2 && !showResp2Form && (
                      <button onClick={() => { setShowResp2Form(true); setResp2Phone(""); }} style={{
                        border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: "12px 16px",
                        width: "100%", background: "transparent", cursor: "pointer",
                        fontSize: 13, color: "#64748b", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8,
                      }}>
                        <i className="bi bi-plus-circle" style={{ fontSize: 16 }} />
                        Ajouter un responsable remplaçant
                      </button>
                    )}

                    {/* Formulaire ajout responsable 2 */}
                    {!resp2 && showResp2Form && (
                      <div style={{
                        padding: "14px 16px", borderRadius: 12,
                        background: "#f8fafc", border: "1.5px solid #4361ee",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#4361ee" }}>
                          <i className="bi bi-person-plus me-2" />Ajouter un remplaçant
                        </div>
                        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                          Si vous êtes occupé ou loin de votre patient, ce responsable recevra les alertes à votre place.
                        </p>
                        <form onSubmit={handleAddResp2}>
                          <div className="pf-field" style={{ marginBottom: 10 }}>
                            <label>
                              <i className="bi bi-whatsapp me-1" style={{ color: "#25d366" }} />
                              Numéro WhatsApp du remplaçant
                            </label>
                            <input
                              className="pf-input" type="tel" required autoFocus
                              placeholder="+212600000000"
                              value={resp2Phone}
                              onChange={(e) => setResp2Phone(e.target.value)}
                            />
                            <small style={{ color: "#94a3b8", fontSize: 11 }}>
                              Format international : +212XXXXXXXXX
                            </small>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="submit" className="pf-submit" style={{ flex: 1 }} disabled={savingResp2}>
                              {savingResp2
                                ? <><div className="pf-spinner" /> Ajout…</>
                                : <><i className="bi bi-check2" /> Ajouter</>}
                            </button>
                            <button type="button" onClick={() => { setShowResp2Form(false); setResp2Phone(""); }} style={{
                              border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 16px",
                              background: "#fff", cursor: "pointer", color: "#64748b", fontSize: 13,
                            }}>Annuler</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ── FORMULAIRE EDITION ── */
              <form onSubmit={handleSave} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="pf-grid" style={{ flex: 1 }}>
                  {[
                    { name: "nom",      label: "Nom",               placeholder: "Dupont",           type: "text"   },
                    { name: "prenom",   label: "Prénom",            placeholder: "Marie",            type: "text"   },
                    { name: "email",    label: "Email",             placeholder: "marie@exemple.com",type: "email", full: true },
                    { name: "age",      label: "Âge",               placeholder: "42",               type: "number" },
                    { name: "maladies", label: "Condition médicale",placeholder: "Diabète…",         type: "text"   },
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

                  {/* ── Type de notification ── */}
                  <div className="pf-full">
                    <div className="pf-info-label" style={{ marginBottom: 10 }}>Type de notification</div>
                    <div className="pf-notif-group">
                      {[
                        { val: "patient",     icon: "bi-person-fill", label: "Patient",     sub: "Notifications pour moi" },
                        { val: "responsable", icon: "bi-people-fill", label: "Responsable", sub: "Je surveille un proche" },
                      ].map((opt) => (
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

      {/* ── MODAL TELEPHONE WHATSAPP ── */}
      {showModal && (
        <div className="pf-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="pf-modal-title">{modalLabel.title}</h4>
            <p className="pf-modal-sub">{modalLabel.sub}</p>
            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div className="pf-field" style={{ marginBottom: 16 }}>
                <label>
                  <i className="bi bi-whatsapp me-1" style={{ color: "#25d366" }} />
                  {user.notification === "responsable" ? "Votre numéro WhatsApp" : "Numéro WhatsApp"}
                </label>
                <input
                  className="pf-input" type="tel" required autoFocus
                  placeholder="+212600000000"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
                <small style={{ color: "#94a3b8", fontSize: 11 }}>
                  Format international : +212XXXXXXXXX
                </small>
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