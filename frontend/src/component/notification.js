import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './notification.css'; // Assure-toi d'avoir ce fichier

const Notification = () => {
  const [notifications] = useState([
    {
      id: 1,
      type: 'Reminder',
      icon: 'bi-alarm',
      color: '#c1f3c1', // Vert pâle
      time: '23 min',
      isUnread: true,
      text: 'Doctor appointment today at 6:30pm, need to pick up files on the way.',
      actions: ['Mark as done', 'Update']
    },
    {
      id: 2,
      type: 'Tip',
      icon: 'bi-heart',
      color: '#ffe0d0', // Orange pâle
      time: '2 hr',
      isUnread: true,
      text: 'We\'ve prepared your weekly health tip to help you improve your mood.',
      actions: ['Open weekly tips']
    },
    {
      id: 3,
      type: 'Entry',
      icon: 'bi-card-list',
      color: '#d0f0ff', // Bleu pâle
      time: '1 dy',
      isUnread: false,
      text: 'Track your weight and help us customize your weekly health tip for you.',
      actions: ['Add weight entry']
    },
    {
      id: 4,
      type: 'Reminder',
      icon: 'bi-file-earmark-medical',
      color: '#e0d0ff', // Violet pâle
      time: '1 wk',
      isUnread: false,
      text: 'Reminder: Scheduled blood test tomorrow at 8:00 AM, fasting required.',
      actions: ['View', 'Update']
    }
  ]);

  return (
    /* FOND GRIS CLAIR AVEC GRADIENT LÉGER EN HAUT */
    <div className="container-fluid min-vh-100 bg-notif-gradient py-4">
      <div className="container bg-white rounded-5 shadow-lg p-5">
        
        {/* HEADER : Titre + Icône de paramètres */}
        <header className="mb-5 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-1px' }}>Notifications</h1>
            <p className="text-secondary small mb-0">Your recent updates and reminders</p>
          </div>
          <button className="btn btn-outline-secondary rounded-circle px-3 py-2 border-0 bg-light-purple text-purple shadow-sm">
            <i className="bi bi-gear-wide-connected h5 mb-0"></i>
          </button>
        </header>

        {/* SECTION DES CARTES DE NOTIFICATIONS (Desktop) */}
        <section>
          {notifications.map((notif) => (
            <div key={notif.id} className="card border-0 rounded-4 mb-4 p-4 shadow-sm position-relative">
              
              {/* Point rouge pour "Non lu" à gauche */}
              {notif.isUnread && (
                <div className="unread-dot position-absolute top-0 start-0 m-2"></div>
              )}
              
              <div className="d-flex align-items-start">
                {/* 1. L'icône de type (Stylisée comme l'image) */}
                <div className="notif-icon-box rounded-3 me-4 d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: notif.color, border: '2px dashed #ddd' }}>
                  <i className={`bi ${notif.icon} h4 mb-0`}></i>
                </div>
                
                {/* 2. Le contenu central */}
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    {/* Titre dynamique selon le type (comme l'image) */}
                    <h5 className="fw-bold text-dark mb-0">
                      {notif.type === 'Tip' ? 'Your weekly health tip is ready!' : notif.type === 'Reminder' ? 'Reminder!' : 'It\'s time to enter your weight'}
                    </h5>
                    {/* Heure à droite */}
                    <span className="small text-muted flex-shrink-0">{notif.time}</span>
                  </div>
                  
                  {/* Texte principal */}
                  <p className="notif-text text-secondary mb-3 fs-6 lh-base">
                    {notif.text}
                  </p>
                  
                  {/* Actions à gauche (comme l'image) */}
                  <div className="notif-actions d-flex gap-3">
                    {notif.actions.map(action => (
                      <button key={action} className="btn-link text-primary fw-bold small p-0 m-0 border-0 bg-transparent">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
};

export default Notification;