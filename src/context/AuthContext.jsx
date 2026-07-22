import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { loadAllCareerStats, saveAllCareerStats } from '../utils/statsStorage';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Load stats from cloud or initialize if missing
        const statsRef = ref(db, `users/${user.uid}/stats`);
        try {
          const snapshot = await get(statsRef);
          if (snapshot.exists()) {
            saveAllCareerStats(snapshot.val()); // load from cloud to local
          } else {
            const localStats = loadAllCareerStats();
            if (user.displayName) localStats.player.name = user.displayName;
            await set(statsRef, localStats);
            saveAllCareerStats(localStats);
          }
        } catch (e) {
          console.error("Error syncing stats", e);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Initialize stats
    const localStats = loadAllCareerStats();
    localStats.player.name = name;
    await set(ref(db, `users/${userCredential.user.uid}/stats`), localStats);
    saveAllCareerStats(localStats);
    return userCredential;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
