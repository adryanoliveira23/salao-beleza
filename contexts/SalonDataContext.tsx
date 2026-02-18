"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/app/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  DocumentData,
} from "firebase/firestore";

const STORAGE_KEY = "agendly_salon_data";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  commission: number;
  color: string;
}

export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: "pending" | "confirmed" | "cancelled";
  hairType?: string;
  skinType?: string;
  allergies?: string;
  observations?: string;
}

export interface SalonData {
  clients: Client[];
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  realizedRevenueByDate?: Record<string, number>;
}

const defaultData: SalonData = {
  clients: [],
  services: [],
  professionals: [],
  appointments: [],
  realizedRevenueByDate: {},
};

interface SalonDataContextType extends SalonData {
  loading: boolean;
  addClient: (
    client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent">,
  ) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addService: (service: Omit<Service, "id">) => Promise<Service | null>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addProfessional: (
    professional: Omit<Professional, "id" | "color"> & { color?: string },
  ) => Promise<Professional | null>;
  updateProfessional: (
    id: string,
    professional: Partial<Professional>,
  ) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  addAppointment: (
    appointment: Omit<Appointment, "id">,
  ) => Promise<Appointment | null>;
  updateAppointment: (
    id: string,
    appointment: Partial<Appointment>,
  ) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  refreshFromStorage: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const SalonDataContext = createContext<SalonDataContextType | undefined>(
  undefined,
);

export function SalonDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<SalonData>(defaultData);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(defaultData);
      return;
    }

    setLoading(true);
    try {
      const qServices = query(
        collection(db, "services"),
        where("userId", "==", user.uid),
      );
      const qProfessionals = query(
        collection(db, "professionals"),
        where("userId", "==", user.uid),
      );
      const qClients = query(
        collection(db, "clients"),
        where("userId", "==", user.uid),
      );
      const qAppointments = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
      );

      const [servicesSnap, professionalsSnap, clientsSnap, appointmentsSnap] =
        await Promise.all([
          getDocs(qServices),
          getDocs(qProfessionals),
          getDocs(qClients),
          getDocs(qAppointments),
        ]);

      const services = servicesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        category: doc.data().category || "",
      })) as Service[];

      const professionals = professionalsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        specialty: doc.data().specialty || "",
        color: doc.data().color || "#FF6B9D",
      })) as Professional[];

      const clients = clientsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        phone: doc.data().phone || "",
        email: doc.data().email || "",
        visits: doc.data().visits || 0,
        lastVisit: doc.data().lastVisit || "",
        totalSpent: doc.data().totalSpent || 0,
      })) as Client[];

      const appointments = appointmentsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          clientId: d.clientId,
          clientName: d.clientName || "",
          clientPhone: d.clientPhone || "",
          clientEmail: d.clientEmail || "",
          serviceId: d.serviceId || "",
          serviceName: d.serviceName || "",
          professionalId: d.professionalId || "",
          professionalName: d.professionalName || "",
          date: d.date,
          time: d.time,
          duration: d.duration,
          price: d.price,
          status: d.status as "pending" | "confirmed" | "cancelled",
          hairType: d.hairType,
          skinType: d.skinType,
          allergies: d.allergies,
          observations: d.observations,
        } as Appointment;
      });

      const realizedRevenueByDate: Record<string, number> = {};
      appointments.forEach((apt) => {
        if (apt.date) {
          realizedRevenueByDate[apt.date] =
            (realizedRevenueByDate[apt.date] || 0) + apt.price;
        }
      });

      setData({
        services,
        professionals,
        clients,
        appointments,
        realizedRevenueByDate,
      });
    } catch (error) {
      console.error("Error fetching salon data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Retrieve initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Migration from LocalStorage (if needed, removed Supabase migration logic)
  // Logic simplified: if no data found in Firestore, check LocalStorage and migrate once.
  useEffect(() => {
    const checkAndMigrate = async () => {
      if (!user) return;
      // Verify if we have services to decide if migration is needed
      // This is a simple check, redundant if fetchData runs first, but kept separate for logic isolation
      // Actually, let's skip complex migration logic for now unless requested,
      // or just put a simple console log placeholder.
      // The user said "remove supabase", so Supabase migration logic is gone.
      // LocalStorage to Firestore migration could be implemented here if needed.
    };
    checkAndMigrate();
  }, [user]);

  const addClient = async (
    client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent">,
  ) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, "clients"), {
        userId: user.uid,
        name: client.name,
        phone: client.phone,
        email: client.email,
        visits: 0,
        lastVisit: null,
        totalSpent: 0,
      });

      const newClient = {
        id: docRef.id,
        name: client.name,
        phone: client.phone || "",
        email: client.email || "",
        visits: 0,
        lastVisit: "",
        totalSpent: 0,
      };

      // Optimistic or refresh
      fetchData();
      return newClient;
    } catch (error) {
      console.error("Error adding client:", error);
      return null;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!user) return;
    try {
      const clientRef = doc(db, "clients", id);
      await updateDoc(clientRef, { ...updates });
      fetchData();
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const addService = async (service: Omit<Service, "id">) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, "services"), {
        userId: user.uid,
        name: service.name,
        duration: service.duration,
        price: service.price,
        category: service.category,
      });
      fetchData();
      return { id: docRef.id, ...service, category: service.category || "" };
    } catch (error) {
      console.error("Error adding service:", error);
      return null;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    if (!user) return;
    try {
      const serviceRef = doc(db, "services", id);
      await updateDoc(serviceRef, { ...updates });
      fetchData();
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "services", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const addProfessional = async (
    professional: Omit<Professional, "id" | "color"> & { color?: string },
  ) => {
    if (!user) return null;
    const colors = ["#FF6B9D", "#C77DFF", "#4ECDC4", "#10b981", "#f59e0b"];
    const color =
      professional.color || colors[Math.floor(Math.random() * colors.length)];

    try {
      const docRef = await addDoc(collection(db, "professionals"), {
        userId: user.uid,
        name: professional.name,
        specialty: professional.specialty,
        commission: professional.commission,
        color: color,
      });
      fetchData();
      return {
        id: docRef.id,
        name: professional.name,
        specialty: professional.specialty,
        commission: professional.commission,
        color: color,
      };
    } catch (error) {
      console.error("Error adding professional:", error);
      return null;
    }
  };

  const updateProfessional = async (
    id: string,
    updates: Partial<Professional>,
  ) => {
    if (!user) return;
    try {
      const profRef = doc(db, "professionals", id);
      await updateDoc(profRef, { ...updates });
      fetchData();
    } catch (error) {
      console.error("Error updating professional:", error);
    }
  };

  const deleteProfessional = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "professionals", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting professional:", error);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    if (!user) return null;

    let clientId = appointment.clientId;

    // Logic to find client by phone (if no ID)
    if (!clientId) {
      try {
        // Query by phone
        const q = query(
          collection(db, "clients"),
          where("userId", "==", user.uid),
          where("phone", "==", appointment.clientPhone), // Note: Firestore is case-sensitive and exact match usually
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          clientId = querySnapshot.docs[0].id;
        } else {
          // Create new client
          const newClientRef = await addDoc(collection(db, "clients"), {
            userId: user.uid,
            name: appointment.clientName,
            phone: appointment.clientPhone,
            email: appointment.clientEmail,
            visits: 1,
            lastVisit: appointment.date,
            totalSpent: appointment.price,
          });
          clientId = newClientRef.id;
        }
      } catch (e) {
        console.error("Error finding/creating client:", e);
      }
    }

    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        clientId,
        serviceId: appointment.serviceId,
        professionalId: appointment.professionalId,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        price: appointment.price,
        status: appointment.status,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        serviceName: appointment.serviceName,
        professionalName: appointment.professionalName,
        hairType: appointment.hairType,
        skinType: appointment.skinType,
        allergies: appointment.allergies,
        observations: appointment.observations,
      });

      fetchData();
      return {
        id: docRef.id,
        ...appointment,
        clientId: clientId || undefined,
      };
    } catch (error) {
      console.error("Error adding appointment:", error);
      return null;
    }
  };

  const updateAppointment = async (
    id: string,
    updates: Partial<Appointment>,
  ) => {
    if (!user) return;
    try {
      const aptRef = doc(db, "appointments", id);
      await updateDoc(aptRef, { ...updates });
      fetchData();
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "appointments", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const refreshFromStorage = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearAllData = async () => {
    if (!user) return;
    // Batch delete not supported for simple "delete all", need to query and delete
    // For simplicity/safety, maybe just warn or do nothing, or iterate.
    // Implementing iteration for now.
    try {
      // This can be slow and expensive (reads + writes). Use with caution.
      const collections = [
        "appointments",
        "clients",
        "services",
        "professionals",
      ];
      const batch = writeBatch(db);

      let operationCount = 0;

      for (const colName of collections) {
        const q = query(
          collection(db, colName),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
          operationCount++;
        });
      }

      if (operationCount > 0) {
        await batch.commit();
      }
      fetchData();
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  const value: SalonDataContextType = {
    ...data,
    loading,
    refreshFromStorage,
    clearAllData,
    addClient,
    updateClient,
    deleteClient,
    addService,
    updateService,
    deleteService,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };

  return (
    <SalonDataContext.Provider value={value}>
      {children}
    </SalonDataContext.Provider>
  );
}

export function useSalonData() {
  const context = useContext(SalonDataContext);
  if (context === undefined) {
    throw new Error("useSalonData must be used within a SalonDataProvider");
  }
  return context;
}

// Keep these exports as fallbacks or deprecate
export function getSalonDataFromStorage(): SalonData {
  return defaultData; // No longer valid
}

export function saveAppointmentToStorage(appointment: Omit<Appointment, "id">) {
  console.warn(
    "saveAppointmentToStorage is deprecated. Use useSalonData hook.",
  );
  return null;
}
