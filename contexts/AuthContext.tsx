"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";

export interface BusinessDayHours {
  open: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface BookingRules {
  minAdvanceHours: number;
  cancellationHours: number;
  lateToleranceMinutes: number;
  requireDeposit: boolean;
  depositPercent: number;
  pixKey?: string;
  cancellationPolicyText?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  salon_name?: string;
  username?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  instagram?: string;
  cnpj?: string;
  plan: "essencial" | "profissional" | "premium" | "enterprise";
  status: "active" | "inactive" | "suspended" | "trial";
  trialEndsAt?: string;
  role?: "owner" | "professional" | "receptionist";
  businessHours?: Record<string, BusinessDayHours>;
  holidays?: Array<{ id: string; date: string; name: string }>;
  bookingRules?: BookingRules;
  themeMode?: "light" | "dark";
  created_at?: string;
}

export const DEFAULT_BUSINESS_HOURS: Record<string, BusinessDayHours> = {
  monday: { open: false, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  tuesday: { open: true, start: "09:00", end: "19:00", breakStart: "12:00", breakEnd: "13:00" },
  wednesday: { open: true, start: "09:00", end: "19:00", breakStart: "12:00", breakEnd: "13:00" },
  thursday: { open: true, start: "09:00", end: "19:00", breakStart: "12:00", breakEnd: "13:00" },
  friday: { open: true, start: "09:00", end: "20:00", breakStart: "12:00", breakEnd: "13:00" },
  saturday: { open: true, start: "08:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  sunday: { open: false, start: "09:00", end: "14:00" },
};

export const DEFAULT_BOOKING_RULES: BookingRules = {
  minAdvanceHours: 2,
  cancellationHours: 24,
  lateToleranceMinutes: 15,
  requireDeposit: false,
  depositPercent: 30,
  pixKey: "",
  cancellationPolicyText: "Cancelamentos ou reagendamentos devem ser feitos com no mínimo 24h de antecedência.",
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  themeMode: "light" | "dark";
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<Profile>) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  themeMode: "light",
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfileData: async () => {},
  toggleThemeMode: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const applyThemeDOM = (mode: "light" | "dark") => {
    setThemeMode(mode);
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("agendly_theme_mode", mode);
  };

  // Apply saved theme on mount (default strictly to light unless user explicitly chose dark)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("agendly_theme_mode");
      applyThemeDOM(savedTheme === "dark" ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const profileRef = doc(db, "profiles", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              let currentUsername = (data.username || "").trim().toLowerCase();
              if (!currentUsername) {
                // Auto-gera um username único inicial baseado no nome do salão
                const baseName = data.salon_name || firebaseUser.displayName || "salao";
                const cleanSlug =
                  baseName
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, "") || "salao";
                currentUsername = cleanSlug;
                setDoc(profileRef, { username: cleanSlug }, { merge: true }).catch(() => {});
              }

              const loadedProfile: Profile = {
                id: docSnap.id,
                name: data.name || firebaseUser.displayName || "Profissional",
                email: data.email || firebaseUser.email || "",
                phone: data.phone || "",
                salon_name: data.salon_name || "Meu Espaço de Beleza",
                username: currentUsername,
                avatar_url: data.avatar_url || "",
                address: data.address || "",
                city: data.city || "",
                instagram: data.instagram || "",
                cnpj: data.cnpj || "",
                plan: data.plan || "profissional",
                status: data.status || "active",
                trialEndsAt: data.trialEndsAt,
                role: data.role || "owner",
                businessHours: data.businessHours || DEFAULT_BUSINESS_HOURS,
                holidays: data.holidays || [],
                bookingRules: {
                  ...DEFAULT_BOOKING_RULES,
                  ...(data.bookingRules || {}),
                },
                themeMode:
                  (typeof window !== "undefined" &&
                    (localStorage.getItem("agendly_theme_mode") as
                      | "light"
                      | "dark"
                      | null)) ||
                  data.themeMode ||
                  "light",
                created_at: data.created_at,
              };
              setProfile(loadedProfile);
              applyThemeDOM(
                loadedProfile.themeMode === "dark" ? "dark" : "light",
              );
            } else {
              // Initialize default profile if missing
              const initialUsername = (firebaseUser.displayName || "salao")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "") || "salao";

              const initialProfile: Profile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "Profissional",
                email: firebaseUser.email || "",
                salon_name: "Meu Espaço de Beleza",
                username: initialUsername,
                plan: "profissional",
                status: "active",
                role: "owner",
                businessHours: DEFAULT_BUSINESS_HOURS,
                holidays: [],
                bookingRules: DEFAULT_BOOKING_RULES,
                themeMode: "light",
                created_at: new Date().toISOString(),
              };
              setDoc(profileRef, initialProfile, { merge: true }).catch((e: unknown) => {
                const err = e as { code?: string; message?: string };
                if (err?.code !== "permission-denied") {
                  console.warn("Notice creating initial profile:", err?.message || e);
                }
              });
              setProfile(initialProfile);
            }
            setIsLoading(false);
          },
          (error) => {
            if (error?.code !== "permission-denied") {
              console.warn("AuthContext notice:", error?.message || error);
            }
            setIsLoading(false);
          },
        );
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const docRef = doc(db, "profiles", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as Profile);
      }
    } catch (error) {
      console.error("AuthContext: Error refreshing profile:", error);
    }
  };

  const updateProfileData = async (updates: Partial<Profile>) => {
    if (updates.themeMode) {
      applyThemeDOM(updates.themeMode);
    }
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    if (!user) return;
    try {
      const docRef = doc(db, "profiles", user.uid);
      await setDoc(docRef, { ...updates, id: user.uid }, { merge: true });
    } catch (error) {
      console.error("AuthContext: Error saving profile update:", error);
    }
  };

  const toggleThemeMode = async () => {
    const currentlyDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : themeMode === "dark";
    const nextMode: "light" | "dark" = currentlyDark ? "light" : "dark";
    await updateProfileData({ themeMode: nextMode });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    router.push("/login");
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        themeMode,
        isLoading,
        signOut,
        refreshProfile,
        updateProfileData,
        toggleThemeMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
