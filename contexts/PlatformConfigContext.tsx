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
  getFirestore,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const createAuthUserAndProfile = async (
  userData: {
    email: string;
    password?: string;
    name: string;
    salonName?: string;
    phone?: string;
    plan: string;
    status: string;
    trialEndsAt?: string;
  },
) => {
  const appName = "secondaryApp-" + new Date().getTime();
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  try {
    const pass = userData.password || Math.random().toString(36).slice(-8) + "Aa1!";
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email,
      pass,
    );
    const authUser = userCredential.user;
    const createdAt = new Date().toISOString();

    // Usa o secondaryDb ANTES de deletar o secondaryApp, garantindo que request.auth.uid == authUser.uid nas regras do Firestore!
    await setDoc(doc(secondaryDb, "profiles", authUser.uid), {
      id: authUser.uid,
      email: userData.email,
      name: userData.name,
      salon_name: userData.salonName || userData.name || "Meu Salão",
      phone: userData.phone || null,
      plan: userData.plan,
      status: userData.status,
      created_at: createdAt,
      trial_ends_at: userData.trialEndsAt || null,
    });

    return {
      user: authUser,
      password: pass,
      createdAt,
    };
  } finally {
    await deleteApp(secondaryApp);
  }
};

export type PlanType = "essencial" | "profissional" | "premium" | "enterprise";

export interface PlanInfo {
  name: string;
  price: number;
  description: string;
  maxProfessionals: number;
  trialDays: number;
  features: string[];
}

export const PLANS: Record<PlanType, PlanInfo> = {
  essencial: {
    name: "Essencial",
    price: 49.9,
    description: "Para profissionais autônomas (manicures, designers, maquiadoras)",
    maxProfessionals: 1,
    trialDays: 7,
    features: [
      "1 Profissional",
      "Agenda Inteligente (Diária/Semanal/Mensal)",
      "Página Pública de Agendamento Online",
      "Cadastro e Ficha de Clientes",
      "Controle Financeiro Básico",
    ],
  },
  profissional: {
    name: "Profissional",
    price: 89.9,
    description: "Para salões com equipe pequena, comissões e estoque",
    maxProfessionals: 5,
    trialDays: 7,
    features: [
      "Até 5 Profissionais",
      "Cálculo Automático de Comissões & Contratos PDF",
      "Controle de Estoque e Baixa Automática",
      "Lembretes e Confirmação via WhatsApp",
      "Relatórios Financeiros e de Produtividade",
    ],
  },
  premium: {
    name: "Premium",
    price: 149.9,
    description: "Para salões completos com IA no WhatsApp, Marketing e BI",
    maxProfessionals: 25,
    trialDays: 14,
    features: [
      "Profissionais Ilimitadas (até 25)",
      "Integração Completa WhatsApp + Assistente IA 24h",
      "Campanhas de Marketing, Cupons e Fidelidade",
      "Clubes de Assinatura Recorrente",
      "Inteligência de Negócio (BI) + Exportação PDF/CSV",
    ],
  },
  enterprise: {
    name: "Premium",
    price: 149.9,
    description: "Plano completo legada/enterprise",
    maxProfessionals: 50,
    trialDays: 14,
    features: ["Acesso Completo"],
  },
};

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  salonName?: string;
  phone?: string;
  plan: PlanType;
  status: "active" | "trial" | "inactive" | "suspended";
  createdAt: string;
  trialEndsAt?: string;
  lastLogin?: string;
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
  defaultTrialDays: number;
  planPrices: {
    essencial: number;
    profissional: number;
    premium: number;
  };
  planLimits: {
    essencial: number;
    profissional: number;
    premium: number;
  };
}

const defaultConfig: PlatformConfig = {
  revenueRate: 0,
  minRevenueRate: 0,
  maxRevenueRate: 30,
  platformFee: 0,
  maintenanceMode: false,
  allowNewSignups: true,
  defaultPlan: "profissional",
  defaultTrialDays: 7,
  planPrices: {
    essencial: 49.9,
    profissional: 89.9,
    premium: 149.9,
  },
  planLimits: {
    essencial: 1,
    profissional: 5,
    premium: 25,
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
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = React.useCallback(async (isRefresh = false) => {
    if (!isAdminAuthenticated) {
      setIsLoading(false);
      return;
    }
    if (isRefresh) setIsLoading(true);
    try {
      // Load Config (gracefully fallback to localStorage / defaultConfig if Firestore rules restrict unauthenticated reads)
      try {
        const configRef = doc(db, "platform_config", "general");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data() as Partial<PlatformConfig>;
          setConfig({
            ...defaultConfig,
            ...data,
            planPrices: {
              ...defaultConfig.planPrices,
              ...(data.planPrices || {}),
            },
            planLimits: {
              ...defaultConfig.planLimits,
              ...(data.planLimits || {}),
            },
          });
        } else if (typeof window !== "undefined") {
          const cached = localStorage.getItem("agendly_platform_config");
          if (cached) setConfig({ ...defaultConfig, ...JSON.parse(cached) });
        }
      } catch {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("agendly_platform_config");
          if (cached) setConfig({ ...defaultConfig, ...JSON.parse(cached) });
        }
      }

      // Load Users
      try {
        const usersRef = collection(db, "profiles");
        const usersSnap = await getDocs(usersRef);
        const loadedUsers: PlatformUser[] = [];

        usersSnap.forEach((userDoc: QueryDocumentSnapshot<DocumentData>) => {
          const data = userDoc.data();
          loadedUsers.push({
            id: userDoc.id,
            email: data.email || "",
            name: data.name || "Sem Nome",
            salonName: data.salon_name || "",
            phone: data.phone || data.whatsapp || "",
            plan: (data.plan as PlanType) || "essencial",
            status: (data.status as PlatformUser["status"]) || "active",
            createdAt: data.created_at || new Date().toISOString(),
            trialEndsAt: data.trial_ends_at,
            lastLogin: data.last_login,
            avatar_url: data.avatar_url,
            username: data.username,
          });
        });

        // Merge with locally cached admin users if any
        if (typeof window !== "undefined") {
          const cachedStr = localStorage.getItem("agendly_admin_users_cache");
          if (cachedStr) {
            const cachedList: PlatformUser[] = JSON.parse(cachedStr);
            cachedList.forEach((cu) => {
              if (!loadedUsers.some((lu) => lu.id === cu.id)) {
                loadedUsers.push(cu);
              }
            });
          }
          localStorage.setItem("agendly_admin_users_cache", JSON.stringify(loadedUsers));
        }

        setUsers(loadedUsers);
      } catch {
        if (typeof window !== "undefined") {
          const cachedStr = localStorage.getItem("agendly_admin_users_cache");
          if (cachedStr) {
            try {
              setUsers(JSON.parse(cachedStr));
            } catch {}
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateConfig = React.useCallback(
    async (updates: Partial<PlatformConfig>) => {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      if (typeof window !== "undefined") {
        localStorage.setItem("agendly_platform_config", JSON.stringify(newConfig));
      }
      try {
        await setDoc(doc(db, "platform_config", "general"), newConfig, {
          merge: true,
        });
      } catch {
        // Persistido em localStorage caso as regras do Firestore bloqueiem escrita sem sessão Firebase Auth
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
        const { user: authUser, password, createdAt } = await createAuthUserAndProfile({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          salonName: userData.salonName,
          plan: userData.plan,
          status: userData.status,
          trialEndsAt: userData.trialEndsAt,
        });

        const newUser: PlatformUser = {
          id: authUser.uid,
          name: userData.name,
          email: userData.email,
          salonName: userData.salonName,
          plan: userData.plan,
          status: userData.status,
          createdAt,
          trialEndsAt: userData.trialEndsAt,
          tempPassword: password,
        };

        setUsers((prev) => {
          const updated = [...prev, newUser];
          if (typeof window !== "undefined") {
            localStorage.setItem("agendly_admin_users_cache", JSON.stringify(updated));
          }
          return updated;
        });
        alert(`Salão criado com sucesso!\nEmail: ${userData.email}\nSenha: ${password}`);
      } catch (e) {
        console.error("Failed to add user:", e);
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        alert("Erro ao criar usuário: " + message);
      }
    },
    [],
  );

  const updateUser = React.useCallback(
    async (id: string, updates: Partial<PlatformUser>) => {
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
        if (typeof window !== "undefined") {
          localStorage.setItem("agendly_admin_users_cache", JSON.stringify(next));
        }
        return next;
      });
      try {
        const dbUpdates: Partial<DocumentData> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.salonName !== undefined) dbUpdates.salon_name = updates.salonName;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.plan) dbUpdates.plan = updates.plan;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.trialEndsAt !== undefined) dbUpdates.trial_ends_at = updates.trialEndsAt;

        await updateDoc(doc(db, "profiles", id), dbUpdates);
      } catch {
        // Atualizado na sessão/cache local caso a regra do Firestore exija o token do próprio usuário
      }
    },
    [],
  );

  const deleteUser = React.useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir o perfil deste salão?")) return;
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem("agendly_admin_users_cache", JSON.stringify(next));
        }
        return next;
      });
      try {
        await deleteDoc(doc(db, "profiles", id));
      } catch {
        // Removido na lista local caso a regra do Firestore restrinja deleção sem token
      }
    },
    [],
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
