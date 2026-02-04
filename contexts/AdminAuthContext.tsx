"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ADMIN_ACCESS_KEY = "Adiel&Adryan2026@!";
const ADMIN_SESSION_KEY = "admin_session";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (accessKey: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Inicializar sempre como false para evitar diferenças de hidratação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há sessão válida ao carregar (apenas no cliente, após hidratação)
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (accessKey: string): boolean => {
    if (accessKey === ADMIN_ACCESS_KEY) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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
