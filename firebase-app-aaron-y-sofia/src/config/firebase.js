import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración directa de Firebase - CORREGIDA
const firebaseConfig = {
  apiKey: "AIzaSyDuoMv2Yhy9ObBKsMudpjq-FVnzSUwf7Q0",
  authDomain: "firebase-app-20230406-y-20230106.firebaseapp.com",
  projectId: "firebase-app-20230406-y-20230106",
  storageBucket: "firebase-app-20230406-y-20230106.appspot.com",
  messagingSenderId: "636152997394",
  appId: "1:636152997394:web:8a6e7b4bc95ed61f5fdacb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);

// Verificación de inicialización
if (!app) {
  console.error('Error: Firebase app no se inicializó');
}
if (!database) {
  console.error('Error: Firestore database no se inicializó');
}

console.log('Firebase inicializado:', !!app);
console.log('Database inicializado:', !!database);
console.log("Configuración Firebase:", firebaseConfig);

export { database };