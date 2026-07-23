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
  registerUser,
  saveToken,
} from "../api/auth";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (vtuId: string, password: string) => Promise<void>;
  register: (payload: {
    vtu_id: string;
    full_name: string;
    department: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = await getToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      return;
    }
    const profile = await fetchMe(stored);
    setToken(stored);
    setUser(profile);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
      } catch {
        await clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const login = useCallback(async (vtuId: string, password: string) => {
    const result = await loginUser(vtuId, password);
    await saveToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

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
      await saveToken(result.access_token);
      setToken(result.access_token);
      setUser(result.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshProfile }),
    [user, token, loading, login, register, logout, refreshProfile],
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
