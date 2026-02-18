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

export type PlanType = "essencial";

export interface PlanInfo {
  name: string;
  price: number;
  description: string;
  features?: string[];
}

export const PLANS: Record<PlanType, PlanInfo> = {
  essencial: {
    name: "Essencial",
    price: 48.79,
    description: "Para profissionais autônomos",
  },
};

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  salonName?: string;
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
    essencial: 48.79,
  },
};

interface PlatformConfigContextType {
  config: PlatformConfig;
  users: PlatformUser[];
  updateConfig: (updates: Partial<PlatformConfig>) => void;
  addUser: (
    user: Omit<PlatformUser, "id" | "createdAt" | "lastLogin"> & {
      password?: string;
    },
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

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Assuming existing admin key logic - in a real app, AdminAuthProvider should provide this key or token
      // For now we use the hardcoded constant as we are inside the 'Admin Area' context logically
      const data = await getAdminData(ADMIN_ACCESS_KEY);

      if (data.config) {
        setConfig({ ...defaultConfig, ...data.config });
      }

      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateConfig = React.useCallback(
    async (updates: Partial<PlatformConfig>) => {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig); // Optimistic update
      try {
        await updatePlatformConfig(ADMIN_ACCESS_KEY, newConfig);
      } catch (e) {
        console.error("Failed to sync config:", e);
        // Revert?
      }
    },
    [config],
  );

  const addUser = React.useCallback(
    async (
      userData: Omit<PlatformUser, "id" | "createdAt" | "lastLogin"> & {
        password?: string;
      },
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
            `Usuário criado!\nEmail: ${userData.email}\nSenha: ${result.tempPassword}`,
          );
        }
      } catch (e) {
        console.error("Failed to add user:", e);
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        alert("Erro ao criar usuário: " + message);
        throw e;
      }
    },
    [],
  );

  const updateUser = React.useCallback(
    async (id: string, updates: Partial<PlatformUser>) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      ); // Optimistic
      try {
        await updatePlatformUserAction(ADMIN_ACCESS_KEY, id, updates);
      } catch (e) {
        console.error("Failed to update user:", e);
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        alert("Erro ao atualizar usuário: " + message);
      }
    },
    [],
  );

  const deleteUser = React.useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir este usuário da Supabase?"))
        return;

      setUsers((prev) => prev.filter((u) => u.id !== id)); // Optimistic
      try {
        await deletePlatformUserAction(ADMIN_ACCESS_KEY, id);
      } catch (e) {
        console.error("Failed to delete user:", e);
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        alert("Erro ao excluir usuário: " + message);
        loadData(); // Revert
      }
    },
    [loadData],
  );

  const refreshUsers = React.useCallback(() => {
    loadData();
  }, [loadData]);

  const value = React.useMemo(
    () => ({
      config,
      users,
      updateConfig,
      addUser,
      updateUser,
      deleteUser,
      refreshUsers,
      isLoading,
    }),
    [
      config,
      users,
      isLoading,
      updateConfig,
      addUser,
      updateUser,
      deleteUser,
      refreshUsers,
    ],
  );

  return (
    <PlatformConfigContext.Provider value={value}>
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
