import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Acceuil         from './component/acceuil';
import Dashboard       from './component/dash';
import Insc            from './component/insc';
import Login           from './component/login';
import Navbar          from './component/navbar';
import Profile         from './component/profil';
import Medicament      from './component/medicament';
import Notification    from './component/notification';
import Mesure          from './component/mesure';
import MedicationList  from './component/listmedi';
import MesureDashboard from './component/dashMesur/afficheMesure';
import Type            from './component/type';
import EditMedication  from './component/editmadicament';
import EditMesure      from './component/editMesure';

// ✅ Système de notifications globales
import GlobalReminderToast from './component/GlobalReminderToast';

function App() {
  return (
    <BrowserRouter>
      {/* Toaster pour les alertes succès/erreur */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* ✅ Notifications globales — visible sur toutes les pages */}
      <GlobalReminderToast />

      {/* Navbar visible partout */}
      <Navbar />

      <Routes>
        <Route path='/acceuil'              element={<Acceuil />} />
        <Route path='/login'                element={<Login />} />
        <Route path='/inscrire'             element={<Insc />} />
        <Route path='/dashboard'            element={<Dashboard />} />
        <Route path='/type'                 element={<Type />} />
        <Route path='/Profile'              element={<Profile />} />
        <Route path='/medicament'           element={<Medicament />} />
        <Route path='/MesureDashboard'      element={<MesureDashboard />} />
        <Route path='/Mesure'               element={<Mesure />} />
        <Route path='/MedicationList'       element={<MedicationList />} />
        <Route path='/Notification'         element={<Notification />} />
        <Route path='/Medicament/:id/edit'  element={<EditMedication />} />
        <Route path='/Mesure/:id/edit'      element={<EditMesure />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;