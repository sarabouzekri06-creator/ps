// Import des fonctions nécessaires
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ta configuration récupérée sur la console
const firebaseConfig = {
  apiKey: "AIzaSyAYvcQh-XnKbzZT_ZsAyZzHUeBo9PgJ38g",
  authDomain: "remember-9b1b7.firebaseapp.com",
  projectId: "remember-9b1b7",
  storageBucket: "remember-9b1b7.firebasestorage.app",
  messagingSenderId: "822623590956",
  appId: "1:822623590956:web:eaa3383c5db5e939d20f89"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// On exporte les services pour les utiliser dans tes pages Login, Insc et Medicament
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;