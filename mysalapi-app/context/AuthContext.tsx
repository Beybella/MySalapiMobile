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
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  resetInactivityTimer: () => {},
});

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      // Auto sign out after 15 minutes of inactivity
      signOut();
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        setSession(session);
        setLoading(false);
        if (session) resetInactivityTimer();
      }
    }).catch(() => {
      if (!resolved) { resolved = true; clearTimeout(timeout); setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) resetInactivityTimer();
      else if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    });

    // Reset timer when app comes to foreground
    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && session) resetInactivityTimer();
    });

    return () => {
      clearTimeout(timeout);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, resetInactivityTimer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
