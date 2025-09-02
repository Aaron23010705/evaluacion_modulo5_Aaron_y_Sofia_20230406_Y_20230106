import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDuoMv2Yhy9ObBKsMudpjq-FVnzSUwf7Q0",
  authDomain: "firebase-app-20230406-y-20230106.firebaseapp.com",
  projectId: "firebase-app-20230406-y-20230106",
  storageBucket: "firebase-app-20230406-y-20230106.appspot.com",
  messagingSenderId: "636152997394",
  appId: "1:636152997394:web:8a6e7b4bc95ed61f5fdacb"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const database = getFirestore(app);

export { auth, database };