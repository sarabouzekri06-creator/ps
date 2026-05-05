import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const BASE = 'http://127.0.0.1:8000';

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const toMinutes = (t) => {
  const [h, m] = (t ?? '00:00').split(':').map(Number);
  return h * 60 + m;
};

// ── Vérifier si le rappel doit avoir lieu aujourd'hui ─────────────────────────
const shouldTakeToday = (entity) => {
  const today      = new Date();
  const JOURS      = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const jourNom    = JOURS[today.getDay()];
  const dayOfMonth = today.getDate();

  switch (entity.frequency_type) {
    case 'daily':
      return true;
    case 'weekly':
      return Array.isArray(entity.frequency_days) && entity.frequency_days.includes(jourNom);
    case 'monthly':
      return dayOfMonth === (entity.frequency_days?.day ?? 1);
    case 'every2months':
    case 'quarterly':
      return dayOfMonth === (entity.frequency_days?.day ?? 1);
    default:
      return true;
  }
};

export const useReminderNotifications = (onNotify) => {
  const notifiedRef = useRef(new Set());
  const dataRef     = useRef(null);

  // ── Vérifier les rappels ──────────────────────────────────────────────
  const checkReminders = useCallback((isStartup = false) => {
    const data = dataRef.current;
    if (!data) return;

    const current    = nowHHMM();
    const currentMin = toMinutes(current);
    const todayKey   = new Date().toDateString();

    console.log('🔍 Vérification à :', current, isStartup ? '(démarrage)' : '');

    // ── Médicaments ──────────────────────────────────────────────────────
    (data.medications ?? []).forEach(med => {

      // ✅ Ignorer si ce médicament n'est pas prévu aujourd'hui
      if (!shouldTakeToday(med)) return;

      (med.takes ?? []).forEach(take => {
        if (take.status === 'done') return;

        const takeTime = (take.take_time ?? '').substring(0, 5);
        const takeMin  = toMinutes(takeTime);
        const diff     = currentMin - takeMin;

        if (isStartup) {
          if (diff < 0) return; // heure future → ignorer
        } else {
          if (diff < 0 || diff > 2) return; // fenêtre 2 min
        }

        const key = `med-${take.id}-${todayKey}`;
        if (notifiedRef.current.has(key)) return;
        notifiedRef.current.add(key);

        console.log('💊 Rappel médicament:', med.medication_name, 'à', takeTime);

        if (!isStartup && Notification.permission === 'granted') {
          new Notification(`💊 ${med.medication_name}`, {
            body: `C'est l'heure de prendre ${take.dose ?? 1} ${take.unit ?? 'comprimé(s)'}`,
            icon: '/favicon.ico',
          });
        }

        onNotify({
          id:       key,
          type:     'med',
          takeId:   take.id,
          name:     med.medication_name,
          subtext:  `${take.dose ?? 1} ${take.unit ?? 'Pill(s)'}`,
          color:    med.reminder_color ?? '#4e73df',
          time:     takeTime,
          unit:     take.unit ?? '',
          isMissed: isStartup && diff > 2,
        });
      });
    });

    // ── Mesures ──────────────────────────────────────────────────────────
    (data.measures ?? []).forEach(mes => {

      // ✅ Ignorer si cette mesure n'est pas prévue aujourd'hui
      if (!shouldTakeToday(mes)) return;

      (mes.takes ?? []).forEach(take => {
        if (take.status === 'done') return;

        const takeTime = (take.take_time ?? '').substring(0, 5);
        const takeMin  = toMinutes(takeTime);
        const diff     = currentMin - takeMin;

        if (isStartup) {
          if (diff < 0) return;
        } else {
          if (diff < 0 || diff > 2) return;
        }

        const key = `mes-${mes.id}-${take.id ?? takeTime}-${todayKey}`;
        if (notifiedRef.current.has(key)) return;
        notifiedRef.current.add(key);

        console.log('📋 Rappel mesure:', mes.disease_name, 'à', takeTime);

        if (!isStartup && Notification.permission === 'granted') {
          new Notification(`📋 ${mes.disease_name}`, {
            body: `C'est l'heure de mesurer — ${take.label ?? mes.disease_name}`,
            icon: '/favicon.ico',
          });
        }

        onNotify({
          id:       key,
          type:     'measure',
          takeId:   take.id,
          itemId:   mes.id,
          name:     mes.disease_name,
          subtext:  `${take.label ?? 'Mesure'} · ${mes.unit ?? ''}`,
          color:    mes.severity === 'High' ? '#e74a3b' : mes.severity === 'Moderate' ? '#f6a623' : '#1cc88a',
          time:     takeTime,
          unit:     mes.unit ?? '',
          isMissed: isStartup && diff > 2,
        });
      });
    });

  }, [onNotify]);

  // ── Démarrer le système ───────────────────────────────────────────────
  useEffect(() => {

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const today = new Date().toISOString().split('T')[0];

    // Charger les données puis faire la vérification de démarrage
    axios.get(`${BASE}/api/dashboard-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:        'application/json',
      },
      params: { date: today },
    })
    .then(res => {
      dataRef.current = res.data;
      console.log('✅ Données chargées au démarrage');
      // ✅ Affiche tous les rappels passés non pris du jour
      checkReminders(true);
    })
    .catch(err => {
      console.error('❌ Erreur:', err);
    });

    // Vérifier toutes les 10 secondes (temps réel)
    const checkInterval = setInterval(() => {
      checkReminders(false);
    }, 10000);

    // Recharger les données toutes les 5 minutes
    const fetchInterval = setInterval(() => {
      const t = localStorage.getItem('token');
      if (!t) return;
      axios.get(`${BASE}/api/dashboard-data`, {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
        params:  { date: new Date().toISOString().split('T')[0] },
      })
      .then(res => {
        dataRef.current = res.data;
        console.log('🔄 Données rechargées');
      })
      .catch(err => console.error(err));
    }, 300000);

    return () => {
      clearInterval(checkInterval);
      clearInterval(fetchInterval);
    };
  }, [checkReminders]);
};