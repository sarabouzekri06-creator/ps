import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages racine
import Acceuil              from './component/acceuil';
import Login                from './component/login';
import Insc                 from './component/insc';
import Info                 from './component/info';
import GlobalReminderToast  from './component/GlobalReminderToast';

// Medicament
import Medicament           from './component/medicament/medicament';
import EditMedication       from './component/medicament/editmadicament';
import Dashboard            from './component/medicament/dash';

// Mesure
import Mesure               from './component/mesure/mesure';
import EditMesure           from './component/mesure/editMesure';

// Lists (switcher)
import HealthDashboard      from './component/list/switchDash';

// Dashboard mesure
import MesureDashboard      from './component/dashMesur/afficheMesure';

// Notification
import Notification         from './component/notification';

import Navbar from './component/navbar'; // ou le bon chemin
import Profile         from './component/profil';
import Type            from './component/type';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <GlobalReminderToast />
 <Navbar />
      <Routes>
        <Route path='/'             element={<Acceuil />} />
        <Route path='/login'               element={<Login />} />
        <Route path='/inscrire'            element={<Insc />} />
        <Route path='/info'                element={<Info />} />
        <Route path='/dashboard'           element={<Dashboard />} />
        <Route path='/Medicament'          element={<Medicament />} />
        <Route path='/Medicament/:id/edit' element={<EditMedication />} />
        <Route path='/Mesure'              element={<Mesure />} />
        <Route path='/Mesure/:id/edit'     element={<EditMesure />} />
        <Route path='/MedicationList'      element={<HealthDashboard />} />
        <Route path='/MesureDashboard'     element={<MesureDashboard />} />
        <Route path='/Notification'        element={<Notification />} />

        <Route path='/type'                 element={<Type />} />
        <Route path='/Profile'              element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;