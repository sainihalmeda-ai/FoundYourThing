import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearToken,
  fetchMe,
  getToken,
  loginUser,
  refreshSession,
  registerUser,
  saveToken,
} from "../api/auth";
import { getSessionExpiresAt } from "../lib/tokenStorage";
import { SESSION_DURATION_MS, SESSION_WARN_MS } from "../constants/config";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Epoch ms when the current session ends. */
  sessionExpiresAt: number | null;
  /** Milliseconds remaining in the session. */
  remainingMs: number;
  /** True when under the warning threshold and session still active. */
  isExpiringSoon: boolean;
  login: (vtuId: string, password: string) => Promise<void>;
  register: (payload: {
    vtu_id: string;
    full_name: string;
    department: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  /** Extend session by another 10 minutes (Continue). */
  continueSession: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (accessToken: string, profile: User) => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    await saveToken(accessToken, expiresAt);
    setToken(accessToken);
    setUser(profile);
    setSessionExpiresAt(expiresAt);
    setRemainingMs(SESSION_DURATION_MS);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
    setSessionExpiresAt(null);
    setRemainingMs(0);
  }, []);

  const refreshProfile = useCallback(async () => {
    const stored = await getToken();
    const expiresAt = await getSessionExpiresAt();
    if (!stored) {
      setUser(null);
      setToken(null);
      setSessionExpiresAt(null);
      return;
    }

    if (expiresAt && expiresAt <= Date.now()) {
      await clearToken();
      setUser(null);
      setToken(null);
      setSessionExpiresAt(null);
      return;
    }

    const profile = await fetchMe(stored);
    setToken(stored);
    setUser(profile);
    setSessionExpiresAt(expiresAt ?? Date.now() + SESSION_DURATION_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safety = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    (async () => {
      try {
        await refreshProfile();
      } catch {
        await clearToken();
        setUser(null);
        setToken(null);
        setSessionExpiresAt(null);
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(safety);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, [refreshProfile]);

  // Tick the countdown every second while logged in.
  useEffect(() => {
    if (!token || !sessionExpiresAt) {
      setRemainingMs(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, sessionExpiresAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        logout();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [token, sessionExpiresAt, logout]);

  const login = useCallback(
    async (vtuId: string, password: string) => {
      const result = await loginUser(vtuId, password);
      // Prefer /me so full_name is available for Home greeting.
      try {
        const profile = await fetchMe(result.access_token);
        await applySession(result.access_token, profile);
      } catch {
        await applySession(result.access_token, result.user);
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: {
      vtu_id: string;
      full_name: string;
      department: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      const result = await registerUser(payload);
      try {
        const profile = await fetchMe(result.access_token);
        await applySession(result.access_token, profile);
      } catch {
        await applySession(result.access_token, result.user);
      }
    },
    [applySession],
  );

  const continueSession = useCallback(async () => {
    if (!token) return;
    const result = await refreshSession(token);
    await applySession(result.access_token, result.user);
  }, [token, applySession]);

  const isExpiringSoon =
    Boolean(token) && remainingMs > 0 && remainingMs <= SESSION_WARN_MS;

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      sessionExpiresAt,
      remainingMs,
      isExpiringSoon,
      login,
      register,
      continueSession,
      logout,
      refreshProfile,
    }),
    [
      user,
      token,
      loading,
      sessionExpiresAt,
      remainingMs,
      isExpiringSoon,
      login,
      register,
      continueSession,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
