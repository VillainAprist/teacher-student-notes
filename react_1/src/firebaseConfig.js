// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdW6H5vDlL8losXV631yzaDhMajw2Bis8",
  authDomain: "backendversion2.firebaseapp.com",
  projectId: "backendversion2",
  storageBucket: "backendversion2.appspot.com", // corregido
  messagingSenderId: "1035905530348",
  appId: "1:1035905530348:web:3caabd8b557a7fcb13a8c9",
  measurementId: "G-03F252RD04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;