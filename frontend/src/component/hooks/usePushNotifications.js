import { useState, useEffect } from 'react';
import axios from 'axios';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

export const usePushNotifications = () => {
    const [status, setStatus] = useState('idle'); // idle | loading | enabled | denied

    useEffect(() => {
        if (Notification.permission === 'granted') setStatus('enabled');
        if (Notification.permission === 'denied')  setStatus('denied');
    }, []);

    const activate = async (email) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Votre navigateur ne supporte pas les notifications push');
            return;
        }
        setStatus('loading');
        try {
            const token = localStorage.getItem('token');

            // 1. Enregistrer sw.js
            const reg  = await navigator.serviceWorker.register('/sw.js');

            // 2. Demander permission
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') { setStatus('denied'); return; }

            // 3. S'abonner
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly:      true,
                applicationServerKey: urlBase64ToUint8Array(
                    import.meta.env.VITE_VAPID_PUBLIC_KEY
                ),
            });

            // 4. Envoyer abonnement au backend avec l'email
            await axios.post(
                'http://localhost:8000/api/push/subscribe',
                {
                    email,
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode(
                            ...new Uint8Array(sub.getKey('p256dh'))
                        )),
                        auth: btoa(String.fromCharCode(
                            ...new Uint8Array(sub.getKey('auth'))
                        )),
                    },
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStatus('enabled');
        } catch (err) {
            console.error('Push error:', err);
            setStatus('idle');
        }
    };

    return { status, activate };
};