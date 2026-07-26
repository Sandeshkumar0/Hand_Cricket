import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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
export const analytics = getAnalytics(app);
export const db = getDatabase(app);
export const auth = getAuth(app);