import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  auth,
  googleProvider,
  rtdb,
  ref,
  get,
  set,
  update,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from '../lib/firebase';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authTimedOut: boolean;
  syncError: string | null;
  loginWithGoogle: () => Promise<void>;
  retrySync: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  upgradeUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to sync user profile to Firebase Realtime Database with a 3-attempt retry loop
async function syncUserProfileWithRetry(fbUser: any, retries = 3, delayMs = 800): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const userRef = ref(rtdb, `users/${fbUser.uid}`);
      const snapshot = await get(userRef);
      const now = new Date().toISOString();

      if (!snapshot.exists()) {
        await set(userRef, {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Zyricon User',
          email: fbUser.email,
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.email)}`,
          provider: 'google',
          role: 'USER',
          accountType: 'free',
          premium: false,
          premiumUntil: null,
          dailyChatLimit: 50,
          dailyChatsUsed: 0,
          createdAt: now,
          lastLogin: now,
          online: true,
        });
      } else {
        await update(userRef, {
          displayName: fbUser.displayName || snapshot.val()?.displayName,
          photoURL: fbUser.photoURL || snapshot.val()?.photoURL,
          lastLogin: now,
          online: true,
        });
      }
      return; // Success
    } catch (err) {
      console.warn(`[RTDB Sync Attempt ${attempt}/${retries} failed]:`, err);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authTimedOut, setAuthTimedOut] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Authenticate & Sync current Firebase user
  const processAuthenticatedUser = useCallback((fbUser: any) => {
    console.log('[AUTH] Processing authenticated user:', fbUser.uid);
    setSyncError(null);
    setAuthTimedOut(false);

    const now = new Date().toISOString();
    const baseUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Zyricon User',
      email: fbUser.email || '',
      avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.email || fbUser.uid)}`,
      role: 'USER',
      accountType: 'FREE',
      premium: false,
      premiumUntil: null,
      dailyChatLimit: 50,
      dailyChatsUsed: 0,
      totalChats: 0,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      isBanned: false,
    };

    // 1. Immediately establish base user and unblock UI loading screen
    setUser((prev) => prev || baseUser);
    setIsLoading(false);
    console.log('[AUTH] Loading state set to false (authenticated)');

    // 2. Perform background backend token exchange and RTDB profile sync asynchronously
    (async () => {
      try {
        console.log('[AUTH] Obtaining backend session token in background...');
        const data = await api.loginWithGoogle({
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });

        if (data?.token) {
          localStorage.setItem('nexus_auth_token', data.token);
        }
        if (data?.user) {
          setUser(data.user);
        }
        console.log('[AUTH] Backend session sync completed.');
      } catch (err) {
        console.error('[AUTH] Background token sync error (user remains logged in):', err);
      }

      try {
        console.log('[AUTH] Syncing RTDB profile in background...');
        await syncUserProfileWithRetry(fbUser);
        console.log('[AUTH] RTDB profile sync completed.');
      } catch (rtdbErr) {
        console.warn('[AUTH] Background RTDB sync warning (user remains logged in):', rtdbErr);
      }
    })();
  }, []);

  // Set up Firebase Auth State Listener & Safety Timeout
  useEffect(() => {
    let isSubscribed = true;
    console.log('[AUTH] Initializing Firebase Auth listener');

    // Defensive timeout to prevent infinite loading if SDK/network hangs
    // NOTE: This timeout does NOT fake auth state or clear user. It sets authTimedOut = true to offer a retry button.
    const safetyTimeout = setTimeout(() => {
      if (isSubscribed && isLoading) {
        console.warn('[AUTH] Safety timeout triggered (5s). Prompting user with retry UI.');
        setAuthTimedOut(true);
      }
    }, 5000);

    // Check redirect auth result if coming back from redirect login
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && isSubscribed) {
          console.log('[AUTH] Redirect result user found:', result.user.uid);
          processAuthenticatedUser(result.user);
        }
      })
      .catch((err) => {
        console.warn('[AUTH] Redirect auth error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!isSubscribed) return;
      clearTimeout(safetyTimeout);
      setAuthTimedOut(false);

      if (fbUser) {
        console.log('[AUTH] Auth state received: User logged in (', fbUser.uid, ')');
        processAuthenticatedUser(fbUser);
      } else {
        console.log('[AUTH] Auth state received: No user logged in');
        localStorage.removeItem('nexus_auth_token');
        setUser(null);
        setSyncError(null);
        setIsLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [processAuthenticatedUser]);

  const retrySync = async () => {
    if (auth.currentUser) {
      setIsLoading(true);
      processAuthenticatedUser(auth.currentUser);
    } else {
      window.location.reload();
    }
  };

  const loginWithGoogle = async () => {
    setSyncError(null);
    try {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // Fall back to redirect if popup was blocked or failed
        if (
          popupErr?.code === 'auth/popup-blocked' ||
          popupErr?.code === 'auth/cancelled-unsent-client-token'
        ) {
          console.warn('[Popup blocked/failed, falling back to redirect]:', popupErr);
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }
    } catch (err: any) {
      console.error('[Google Login Error]:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled.');
      } else if (err?.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked by your browser. Please allow popups.');
      } else if (err?.code === 'auth/network-request-failed') {
        throw new Error('Unable to connect. Check your internet connection and try again.');
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with a different credential.');
      }
      throw new Error(err?.message || 'Unable to sign in right now. Please try again.');
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await processAuthenticatedUser(auth.currentUser);
    } else {
      const token = localStorage.getItem('nexus_auth_token');
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
        } catch {
          localStorage.removeItem('nexus_auth_token');
          setUser(null);
        }
      }
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        const userRef = ref(rtdb, `users/${auth.currentUser.uid}`);
        await update(userRef, { online: false }).catch(() => {});
        await signOut(auth).catch(() => {});
      }
      await api.logout().catch(() => {});
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('nexus_auth_token');
      setUser(null);
      setSyncError(null);
      setIsLoading(false);
    }
  };

  const upgradeUser = async () => {
    const res = await api.upgradeUser();
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        authTimedOut,
        syncError,
        loginWithGoogle,
        retrySync,
        logout,
        refreshUser,
        upgradeUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

