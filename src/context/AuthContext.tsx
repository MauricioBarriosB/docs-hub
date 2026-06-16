import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { loginRequest, logoutRequest, registerRequest } from '@/api/auth';
import { tokenStore } from '@/api/tokenStore';
import type { AuthSession, LoginRequest, RegisterRequest, User } from '@/api/types';
import { STORAGE_KEYS, readPersisted, removePersisted, writePersisted } from '@/lib/storage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = `${STORAGE_KEYS.authSession}-user`;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore the cached user immediately so guarded routes resolve on first paint;
  // the token store hydrates from localStorage in parallel.
  const [user, setUser] = useState<User | null>(() =>
    readPersisted<User | null>(USER_KEY, null),
  );

  const applySession = useCallback((session: AuthSession) => {
    tokenStore.set({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    setUser(session.user);
    writePersisted(USER_KEY, session.user);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    removePersisted(USER_KEY);
  }, []);

  // If the client clears tokens (refresh failed → 401), drop the user too.
  useEffect(() => {
    tokenStore.subscribe((tokens) => {
      if (!tokens) {
        setUser(null);
        removePersisted(USER_KEY);
      }
    });
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await loginRequest(payload);
      applySession(session);
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const session = await registerRequest(payload);
      applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    // Fire-and-forget server revocation; clear local state regardless.
    void logoutRequest().catch(() => undefined);
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
