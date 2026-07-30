import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AuthUser } from "../lib/types";
import { authService } from "../services/auth.service";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, mdp: string) => Promise<AuthUser>;
  signup: (data: {
    nomClient: string;
    prenomClient: string;
    emailClient: string;
    telephoneClient: string;
    adresseClient: string;
    villeClient: string;
    motDePasse: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getSession());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (loginVal: string, mdp: string) => {
    setLoading(true);
    try {
      const u = await authService.login(loginVal, mdp);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (data: {
      nomClient: string;
      prenomClient: string;
      emailClient: string;
      telephoneClient: string;
      adresseClient: string;
      villeClient: string;
      motDePasse: string;
    }) => {
      setLoading(true);
      try {
        const u = await authService.signup(data);
        setUser(u);
        return u;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, isAdmin: authService.isAdmin(user) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
