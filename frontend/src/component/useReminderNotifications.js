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

const shouldTakeToday = (entity) => {
  const today      = new Date();
  const JOURS      = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const jourNom    = JOURS[today.getDay()];
  const dayOfMonth = today.getDate();
  switch (entity.frequency_type) {
    case 'daily':        return true;
    case 'weekly':       return Array.isArray(entity.frequency_days) && entity.frequency_days.includes(jourNom);
    case 'monthly':
    case 'every2months':
    case 'quarterly':    return dayOfMonth === (entity.frequency_days?.day ?? 1);
    default:             return true;
  }
};

export const useReminderNotifications = (onNotify) => {
  const notifiedRef  = useRef(new Set());
  const dataRef      = useRef(null);
  const takeTimesRef = useRef({});

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${BASE}/api/dashboard-data`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        params:  { date: new Date().toISOString().split('T')[0] },
      });

      const newData  = res.data;
      const todayKey = new Date().toDateString();

      // ✅ Détecter heures modifiées → reset clé pour re-notifier
      (newData.measures ?? []).forEach(mes => {
        (mes.takes ?? []).forEach(take => {
          const ref     = `mes-take-${take.id}`;
          const oldTime = takeTimesRef.current[ref];
          const newTime = (take.take_time ?? '').substring(0, 5);
          if (oldTime !== undefined && oldTime !== newTime) {
            notifiedRef.current.delete(`mes-${mes.id}-${take.id}-${todayKey}`);
            console.log(`🔄 Heure mesure modifiée ${mes.disease_name}: ${oldTime}→${newTime}`);
          }
          takeTimesRef.current[ref] = newTime;
        });
      });

      (newData.medications ?? []).forEach(med => {
        (med.takes ?? []).forEach(take => {
          const ref     = `med-take-${take.id}`;
          const oldTime = takeTimesRef.current[ref];
          const newTime = (take.take_time ?? '').substring(0, 5);
          if (oldTime !== undefined && oldTime !== newTime) {
            notifiedRef.current.delete(`med-${take.id}-${todayKey}`);
            console.log(`🔄 Heure méd modifiée ${med.medication_name}: ${oldTime}→${newTime}`);
          }
          takeTimesRef.current[ref] = newTime;
        });
      });

      dataRef.current = newData;
    } catch (err) {
      console.error('❌ Erreur fetchData:', err.message);
    }
  }, []);

  const checkReminders = useCallback((isStartup = false) => {
    const data = dataRef.current;
    if (!data) return;

    const current    = nowHHMM();
    const currentMin = toMinutes(current);
    const todayKey   = new Date().toDateString();

    // ── Médicaments ──────────────────────────────────────────────────────
    (data.medications ?? []).forEach(med => {
      if (!shouldTakeToday(med)) return;

      (med.takes ?? []).forEach(take => {
        const takeTime = (take.take_time ?? '').substring(0, 5);
        const takeMin  = toMinutes(takeTime);
        const diff     = currentMin - takeMin;
        const key      = `med-${take.id}-${todayKey}`;

        if (isStartup) {
          // Déjà fait → bloquer silencieusement
          if (take.status === 'done') {
            notifiedRef.current.add(key);
            return;
          }
          // Heure future → ne pas bloquer, sera notifié en temps réel
          if (diff < 0) return;

          // ✅ Heure passée + pas encore pris → afficher au chargement
          if (notifiedRef.current.has(key)) return;
          notifiedRef.current.add(key);

          onNotify({
            id:       key,
            type:     'med',
            takeId:   take.id,
            name:     med.medication_name,
            subtext:  `${take.dose ?? 1} ${take.unit ?? 'Pill(s)'}`,
            color:    med.reminder_color ?? '#4e73df',
            time:     takeTime,
            unit:     take.unit ?? '',
            isMissed: true,
          });
          return;
        }

        // ── Temps réel : fenêtre 5 min ────────────────────────────────
        if (diff < 0 || diff > 5) return;
        if (take.status === 'done') return;
        if (notifiedRef.current.has(key)) return;
        notifiedRef.current.add(key);

        console.log('💊 Notification médicament:', med.medication_name, 'à', takeTime);

        if (Notification.permission === 'granted') {
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
          isMissed: false,
        });
      });
    });

    // ── Mesures ──────────────────────────────────────────────────────────
    (data.measures ?? []).forEach(mes => {
      if (!shouldTakeToday(mes)) return;

      (mes.takes ?? []).forEach(take => {
        const takeTime = (take.take_time ?? '').substring(0, 5);
        const takeMin  = toMinutes(takeTime);
        const diff     = currentMin - takeMin;
        const key      = `mes-${mes.id}-${take.id ?? takeTime}-${todayKey}`;

        if (isStartup) {
          // Déjà fait → bloquer silencieusement
          if (take.status === 'done') {
            notifiedRef.current.add(key);
            return;
          }
          // Heure future → ne pas bloquer
          if (diff < 0) return;

          // ✅ Heure passée + pas encore saisi → afficher au chargement
          if (notifiedRef.current.has(key)) return;
          notifiedRef.current.add(key);

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
            isMissed: true,
          });
          return;
        }

        // ── Temps réel : fenêtre 5 min ────────────────────────────────
        if (diff < 0 || diff > 5) return;
        if (notifiedRef.current.has(key)) return;
        notifiedRef.current.add(key);

        console.log('📋 Notification mesure:', mes.disease_name, 'à', takeTime);

        if (Notification.permission === 'granted') {
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
          isMissed: false,
        });
      });
    });

  }, [onNotify]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    fetchData().then(() => {
      checkReminders(true);
    });

    const checkInterval = setInterval(() => checkReminders(false), 30_000);
    const fetchInterval = setInterval(() => fetchData(), 60_000);

    return () => {
      clearInterval(checkInterval);
      clearInterval(fetchInterval);
    };
  }, [checkReminders, fetchData]);
};