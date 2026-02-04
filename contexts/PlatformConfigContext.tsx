"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getAdminData,
  createPlatformUser,
  updatePlatformUser as updatePlatformUserAction,
  deletePlatformUser as deletePlatformUserAction,
  updatePlatformConfig,
} from "@/app/actions/admin";

// Removed unused context variable
// const PlatformConfigContext = createContext<PlatformConfigContextType | undefined>(undefined);
// Wait, I need to keep the Context creation but the lint said 'values' or something.
// The lint said 'PLATFORM_CONFIG_KEY' is unused.
const ADMIN_ACCESS_KEY = "Adiel&Adryan2026@!";

export type PlanType = "essencial" | "profissional" | "enterprise";

export interface PlanInfo {
  name: string;
  price: number;
  description: string;
  features?: string[];
}

export const PLANS: Record<PlanType, PlanInfo> = {
  essencial: {
    name: "Essencial",
    price: 49.9,
    description: "Para profissionais autônomos",
  },
  profissional: {
    name: "Profissional",
    price: 97.4,
    description: "Para salões em crescimento",
  },
  enterprise: {
    name: "Enterprise",
    price: 198.75,
    description: "Para grandes redes e spas",
  },
};

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin?: string;
  // Extras
  tempPassword?: string;
}

export interface PlatformConfig {
  revenueRate: number;
  minRevenueRate: number;
  maxRevenueRate: number;
  platformFee: number;
  maintenanceMode: boolean;
  allowNewSignups: boolean;
  defaultPlan: PlanType;
  planPrices: {
    essencial: number;
    profissional: number;
    enterprise: number;
  };
}

const defaultConfig: PlatformConfig = {
  revenueRate: 10,
  minRevenueRate: 5,
  maxRevenueRate: 30,
  platformFee: 0,
  maintenanceMode: false,
  allowNewSignups: true,
  defaultPlan: "essencial",
  planPrices: {
    essencial: 49.9,
    profissional: 97.4,
    enterprise: 198.75,
  },
};

interface PlatformConfigContextType {
  config: PlatformConfig;
  users: PlatformUser[];
  updateConfig: (updates: Partial<PlatformConfig>) => void;
  addUser: (
    user: Omit<PlatformUser, "id" | "createdAt" | "lastLogin">,
  ) => Promise<void>;
  updateUser: (id: string, updates: Partial<PlatformUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => void;
  isLoading: boolean;
}

const PlatformConfigContext = createContext<
  PlatformConfigContextType | undefined
>(undefined);

export function PlatformConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Assuming existing admin key logic - in a real app, AdminAuthProvider should provide this key or token
      // For now we use the hardcoded constant as we are inside the 'Admin Area' context logically
      const data = await getAdminData(ADMIN_ACCESS_KEY);

      if (data.config) {
        setConfig({ ...defaultConfig, ...data.config });
      }

      if (data.users) {
        // Map DB profiles to PlatformUser
        const mappedUsers: PlatformUser[] = (data.users || []).map(
          (u: {
            id: string;
            email: string;
            name: string;
            plan: PlanType;
            status: PlatformUser["status"];
            created_at: string;
            last_sign_in_at?: string;
          }) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            plan: u.plan,
            status: u.status,
            createdAt: u.created_at,
            lastLogin: u.last_sign_in_at,
          }),
        );
        setUsers(mappedUsers);
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateConfig = async (updates: Partial<PlatformConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig); // Optimistic update
    try {
      await updatePlatformConfig(ADMIN_ACCESS_KEY, newConfig);
    } catch (e) {
      console.error("Failed to sync config:", e);
      // Revert?
    }
  };

  const addUser = async (
    userData: Omit<PlatformUser, "id" | "createdAt" | "lastLogin">,
  ) => {
    try {
      const result = await createPlatformUser(ADMIN_ACCESS_KEY, userData);

      const newUser: PlatformUser = {
        ...userData,
        id: result.id,
        createdAt: result.createdAt,
        tempPassword: result.tempPassword,
      };

      setUsers((prev) => [...prev, newUser]);

      if (result.tempPassword) {
        alert(
          `Usuário criado!\nEmail: ${userData.email}\nSenha Temporária: ${result.tempPassword}`,
        );
      }
    } catch (e) {
      console.error("Failed to add user:", e);
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      alert("Erro ao criar usuário: " + message);
      throw e;
    }
  };

  const updateUser = async (id: string, updates: Partial<PlatformUser>) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, ...updates } : u))); // Optimistic
    try {
      await updatePlatformUserAction(ADMIN_ACCESS_KEY, id, updates);
    } catch (e) {
      console.error("Failed to update user:", e);
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      alert("Erro ao atualizar usuário: " + message);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário da Supabase?"))
      return;

    setUsers(users.filter((u) => u.id !== id)); // Optimistic
    try {
      await deletePlatformUserAction(ADMIN_ACCESS_KEY, id);
    } catch (e) {
      console.error("Failed to delete user:", e);
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      alert("Erro ao excluir usuário: " + message);
      loadData(); // Revert
    }
  };

  const refreshUsers = () => {
    loadData();
  };

  return (
    <PlatformConfigContext.Provider
      value={{
        config,
        users,
        updateConfig,
        addUser,
        updateUser,
        deleteUser,
        refreshUsers,
        isLoading,
      }}
    >
      {children}
    </PlatformConfigContext.Provider>
  );
}

export function usePlatformConfig() {
  const context = useContext(PlatformConfigContext);
  if (context === undefined) {
    throw new Error(
      "usePlatformConfig must be used within a PlatformConfigProvider",
    );
  }
  return context;
}
