"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  email: string;
  salon_name?: string;
  username?: string;
  avatar_url?: string;
  plan: "essencial" | "profissional" | "enterprise";
  status: "active" | "inactive" | "suspended";
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Set up real-time listener for profile
        const profileRef = doc(db, "profiles", firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile({ id: docSnap.id, ...docSnap.data() } as Profile);
            } else {
              setProfile(null);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error("AuthContext: Error fetching profile:", error);
            setIsLoading(false);
          },
        );
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    // Manually refresh profile if needed
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
      value={{ user, profile, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
