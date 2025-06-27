// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbDoJACjubeyLoazNeKbWK-j0c9VrsoJE",
  authDomain: "novel-noted.firebaseapp.com",
  projectId: "novel-noted",
  storageBucket: "novel-noted.firebasestorage.app",
  messagingSenderId: "775283674805",
  appId: "1:775283674805:web:8237edd3261ace507ef8fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// For development, you can uncomment this to use the Firestore emulator
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch (error) {
//     console.log('Firestore emulator already connected');
//   }
// }

export default app; 