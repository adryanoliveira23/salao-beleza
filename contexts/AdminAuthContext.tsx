"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const ADMIN_ACCESS_KEY = "Adiel&Adryan2026@!";
const ADMIN_SESSION_KEY = "admin_session";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (accessKey: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Inicializar sempre como false para evitar diferenças de hidratação
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Verificar se há sessão válida ao carregar (apenas no cliente, após hidratação)
    let isAuth = false;
    if (typeof window !== "undefined") {
      const session = localStorage.getItem(ADMIN_SESSION_KEY);
      if (session === "authenticated") {
        isAuth = true;
      }
    }
    setTimeout(() => {
      setState({ isAuthenticated: isAuth, isLoading: false });
    }, 0);
  }, []);

  const login = (accessKey: string): boolean => {
    if (accessKey === ADMIN_ACCESS_KEY) {
      setState((prev) => ({ ...prev, isAuthenticated: true }));
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  };

  const value = React.useMemo(
    () => ({
      isAuthenticated: state.isAuthenticated,
      login,
      logout,
      isLoading: state.isLoading,
    }),
    [state.isAuthenticated, state.isLoading],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
