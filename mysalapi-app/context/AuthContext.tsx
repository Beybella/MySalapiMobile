import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  resetInactivityTimer: () => void;
  pinVerified: boolean;
  setPinVerified: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  resetInactivityTimer: () => {},
  pinVerified: false,
  setPinVerified: () => {},
});

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so AppState listener always sees the latest session value
  const sessionRef = useRef<Session | null>(null);

  const signOut = async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    await supabase.auth.signOut();
    setSession(null);
    sessionRef.current = null;
    setPinVerified(false);
  };

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      signOut();
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 5000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        setSession(s);
        sessionRef.current = s;
        setLoading(false);
        if (s) resetInactivityTimer();
      }
    }).catch(() => {
      if (!resolved) { resolved = true; clearTimeout(timeout); setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      sessionRef.current = s;
      setLoading(false);
      if (s) {
        resetInactivityTimer();
      } else {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      }
    });

    // Use sessionRef so this always sees the current session, not the stale closure value
    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && sessionRef.current) {
        resetInactivityTimer();
      }
    });

    return () => {
      clearTimeout(timeout);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, resetInactivityTimer, pinVerified, setPinVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
