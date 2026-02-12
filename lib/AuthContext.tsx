'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';

import { auth, googleProvider, isEmailAllowed } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set auth persistence:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser?.email && !isEmailAllowed(nextUser.email)) {
        firebaseSignOut(auth);
        setUser(null);
      } else {
        setUser(nextUser);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence);
    const isMobileBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isMobileBrowser) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);

      if (!result.user.email || !isEmailAllowed(result.user.email)) {
        await firebaseSignOut(auth);
        throw new Error('Email của bạn không nằm trong danh sách được phép.');
      }
    } catch (error: any) {
      const code = String(error?.code || '');
      const shouldFallbackToRedirect =
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment';

      if (shouldFallbackToRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
