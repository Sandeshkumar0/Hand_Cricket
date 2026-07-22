// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD36fDZ3QyNcLsVewVhr1qkFzDUPWtuYsQ",
  authDomain: "hand-cricket-f9e44.firebaseapp.com",
  databaseURL: "https://hand-cricket-f9e44-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hand-cricket-f9e44",
  storageBucket: "hand-cricket-f9e44.firebasestorage.app",
  messagingSenderId: "430359067764",
  appId: "1:430359067764:web:d5c21bddcf44f08b8b6521",
  measurementId: "G-Y0ZF3QDZ66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);
export const auth = getAuth(app);