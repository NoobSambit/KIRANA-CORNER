import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCxjjcwSAMty6DRAFrkZPFVx-mX8e9WoBI",
  authDomain: "kiranaconnect-1dae6.firebaseapp.com",
  projectId: "kiranaconnect-1dae6",
  storageBucket: "kiranaconnect-1dae6.firebasestorage.app",
  messagingSenderId: "587642159939",
  appId: "1:587642159939:web:1dae6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);