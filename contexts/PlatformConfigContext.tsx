"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { db, firebaseConfig } from "@/app/lib/firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

// Helper to create user without logging out the current user (if ever needed to interact as admin)
// Although for this panel the 'admin' isn't a firebase user, so main auth wouldn't affect it much,
// but it keeps the main app auth state clean if we were to merge contexts.
const createAuthUser = async (email: string, password?: string) => {
  // 1. Initialize a secondary app
  const appName = "secondaryApp-" + new Date().getTime();
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const pass = password || Math.random().toString(36).slice(-8) + "Aa1!";
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      pass,
    );
    return {
      user: userCredential.user,
      password: pass,
    };
  } finally {
    // Cleanup
    await deleteApp(secondaryApp);
  }
};

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
  avatar_url?: string;
  username?: string;
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

  const loadData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true);
    try {
      // Load Config
      const configRef = doc(db, "platform_config", "general");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setConfig({
          ...defaultConfig,
          ...(configSnap.data() as Partial<PlatformConfig>),
        });
      }

      // Load Users
      const usersRef = collection(db, "profiles");
      // Getting all profiles. In a real app with many users, pagination is needed.
      const usersSnap = await getDocs(usersRef);
      const loadedUsers: PlatformUser[] = [];

      usersSnap.forEach((userDoc: QueryDocumentSnapshot<DocumentData>) => {
        const data = userDoc.data();
        loadedUsers.push({
          id: userDoc.id,
          email: data.email || "",
          name: data.name || "Sem Nome",
          salonName: data.salon_name || "",
          plan: (data.plan as PlanType) || "essencial",
          status: (data.status as PlatformUser["status"]) || "active",
          createdAt: data.created_at || new Date().toISOString(),
          lastLogin: data.last_login,
          avatar_url: data.avatar_url,
          username: data.username,
        });
      });

      setUsers(loadedUsers);
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
        await setDoc(doc(db, "platform_config", "general"), newConfig, {
          merge: true,
        });
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
        // 1. Create Auth User
        const { user: authUser, password } = await createAuthUser(
          userData.email,
          userData.password,
        );

        // 2. Create Profile Doc
        const createdAt = new Date().toISOString();
        const newUser: PlatformUser = {
          id: authUser.uid,
          name: userData.name,
          email: userData.email,
          salonName: userData.salonName,
          plan: userData.plan,
          status: userData.status,
          createdAt: createdAt,
          tempPassword: password,
        };

        // Firestore data mapping (snake_case generally preferable for DB but keeping it consistent with what we see)
        // Previous files showed 'salon_name', 'created_at'. Let's stick to that.
        await setDoc(doc(db, "profiles", authUser.uid), {
          id: authUser.uid,
          email: userData.email,
          name: userData.name,
          salon_name: userData.salonName,
          plan: userData.plan,
          status: userData.status,
          created_at: createdAt,
          // Add other fields as necessary
        });

        setUsers((prev) => [...prev, newUser]);

        alert(`Usuário criado!\nEmail: ${userData.email}\nSenha: ${password}`);
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
        // Map updates to DB format
        const dbUpdates: Partial<DocumentData> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.salonName) dbUpdates.salon_name = updates.salonName;
        if (updates.plan) dbUpdates.plan = updates.plan;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.email) dbUpdates.email = updates.email; // Note: This doesn't update Auth email!

        await updateDoc(doc(db, "profiles", id), dbUpdates);
      } catch (e) {
        console.error("Failed to update user:", e);
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        alert("Erro ao atualizar usuário: " + message);
        loadData(); // Revert
      }
    },
    [loadData],
  );

  const deleteUser = React.useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Tem certeza que deseja excluir o PERFIL deste usuário? (A conta de login permanecerá ativa até exclusão manual no console Firebase)",
        )
      )
        return;

      setUsers((prev) => prev.filter((u) => u.id !== id)); // Optimistic
      try {
        await deleteDoc(doc(db, "profiles", id));
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
    loadData(true);
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
