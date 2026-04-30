'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { getCurrentUser, login, signup, logout } from '@/lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface UseAuth extends AuthState {
  login: (email: string, password: string) => { error?: string };
  signup: (name: string, email: string, password: string) => { error?: string };
  logout: () => void;
}

export function useAuth(): UseAuth {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    setState({ user: getCurrentUser(), loading: false });
  }, []);

  const handleLogin = useCallback((email: string, password: string) => {
    const result = login(email, password);
    if ('error' in result) return { error: result.error };
    setState({ user: result.user, loading: false });
    return {};
  }, []);

  const handleSignup = useCallback(
    (name: string, email: string, password: string) => {
      const result = signup(name, email, password);
      if ('error' in result) return { error: result.error };
      setState({ user: result.user, loading: false });
      return {};
    },
    []
  );

  const handleLogout = useCallback(() => {
    logout();
    setState({ user: null, loading: false });
  }, []);

  return {
    ...state,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };
}
