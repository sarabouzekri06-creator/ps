// import logo from './logo.svg';
import './App.css';
// import Conn from './component/a';
// import Info from './component/info';
import Acceuil from './component/acceuil';
import Dashboard from './component/dash';
import Insc from './component/insc';
import Login from './component/login';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import PatientProfile from './component/profil';
import Navbar from './component/navbar';
import Type from './component/type';
import Profile from './component/profil';
import Medicament from './component/medicament';
import Notification from './component/notification';
import Mesure from './component/mesure';
import MedicationList from './component/listmedi';
import MesureDashboard from './component/afficheMesure';


function App() {
  return (
   <BrowserRouter>
   <Navbar></Navbar>
   <Routes>
    <Route path='/acceuil' element={<Acceuil/>}/>
    <Route path='/login' element={<Login/>}/>
    <Route path='/inscrire' element={<Insc/>}/>
    <Route path='/dashboard' element={<Dashboard/>}/>
    <Route path='/patient' element={<PatientProfile/>}/>
    <Route path='/type' element={<Type/>}/>
    <Route path='/Profile' element={<Profile/>}/>
    <Route path='/medicament' element={<Medicament/>}/>
    <Route path='/MesureDashboard' element={<MesureDashboard/>}/>
    <Route path='/Mesure' element={<Mesure/>}/>
    <Route path='/MedicationList' element={<MedicationList/>}/>
    <Route path='/Notification' element={<Notification/>}/>
   </Routes>
   </BrowserRouter>
    
  );
}

export default App;
