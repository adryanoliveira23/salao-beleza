"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/app/lib/database.types";

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
  deleteProfessional: (id: string) => Promise<void>; // Added missing method
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
  const [loading, setLoading] = useState(false); // Changed to false initially to avoid flash if not logged in

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(defaultData);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        { data: services },
        { data: professionals },
        { data: clients },
        { data: appointments },
      ] = await Promise.all([
        supabase.from("services").select("*").eq("user_id", user.id),
        supabase.from("professionals").select("*").eq("user_id", user.id),
        supabase.from("clients").select("*").eq("user_id", user.id),
        supabase.from("appointments").select("*").eq("user_id", user.id),
      ]);

      const formattedAppointments = (appointments || []).map((apt) => ({
        id: apt.id,
        clientId: apt.client_id || undefined,
        clientName: apt.client_name || "",
        clientPhone: apt.client_phone || "",
        clientEmail: apt.client_email || "",
        serviceId: apt.service_id || "",
        serviceName: apt.service_name || "",
        professionalId: apt.professional_id || "",
        professionalName: apt.professional_name || "",
        date: apt.date,
        time: apt.time,
        duration: apt.duration,
        price: apt.price,
        status: apt.status as "pending" | "confirmed" | "cancelled",
        hairType: apt.hair_type || undefined,
        skinType: apt.skin_type || undefined,
        allergies: apt.allergies || undefined,
        observations: apt.observations || undefined,
      }));

      // Revenue calculation currently simplistic based on confirmed/pending appointments in memory for now
      // ideally this should be a separate query or aggregation
      const realizedRevenueByDate: Record<string, number> = {};
      formattedAppointments.forEach((apt) => {
        // Assuming all existing appointments count for now, or filter by status if needed
        if (apt.date) {
          realizedRevenueByDate[apt.date] =
            (realizedRevenueByDate[apt.date] || 0) + apt.price;
        }
      });

      setData({
        services: (services || []).map((s) => ({
          ...s,
          category: s.category || "",
        })),
        professionals: (professionals || []).map((p) => ({
          ...p,
          specialty: p.specialty || "",
          color: p.color || "#FF6B9D",
        })),
        clients: (clients || []).map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || "",
          email: c.email || "",
          visits: c.visits || 0,
          lastVisit: c.last_visit || "",
          totalSpent: c.total_spent || 0,
        })),
        appointments: formattedAppointments,
        realizedRevenueByDate,
      });
    } catch (error) {
      console.error("Error fetching salon data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Migration Logic
  useEffect(() => {
    const migrate = async () => {
      if (!user) return;

      // Check if Supabase has data
      const { count } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count === 0) {
        // Try to load from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            console.log("Migrating local data to Supabase...");
            const localData: SalonData = JSON.parse(stored);

            // Insert Clients
            const clientMap = new Map<string, string>(); // oldId -> newId
            for (const c of localData.clients) {
              const { data: newClient } = await supabase
                .from("clients")
                .insert({
                  user_id: user.id,
                  name: c.name,
                  phone: c.phone,
                  email: c.email,
                  visits: c.visits,
                  last_visit: c.lastVisit || null,
                  total_spent: c.totalSpent,
                })
                .select()
                .single();
              if (newClient) clientMap.set(c.id, newClient.id);
            }

            // Insert Services
            const serviceMap = new Map<string, string>();
            for (const s of localData.services) {
              const { data: newService } = await supabase
                .from("services")
                .insert({
                  user_id: user.id,
                  name: s.name,
                  duration: s.duration,
                  price: s.price,
                  category: s.category,
                })
                .select()
                .single();
              if (newService) serviceMap.set(s.id, newService.id);
            }

            // Insert Professionals
            const professionalMap = new Map<string, string>();
            for (const p of localData.professionals) {
              const { data: newProfessional } = await supabase
                .from("professionals")
                .insert({
                  user_id: user.id,
                  name: p.name,
                  specialty: p.specialty,
                  commission: p.commission,
                  color: p.color,
                })
                .select()
                .single();
              if (newProfessional)
                professionalMap.set(p.id, newProfessional.id);
            }

            // Insert Appointments
            for (const a of localData.appointments) {
              await supabase.from("appointments").insert({
                user_id: user.id,
                client_id: a.clientId ? clientMap.get(a.clientId) : null,
                service_id: serviceMap.get(a.serviceId),
                professional_id: professionalMap.get(a.professionalId),
                date: a.date,
                time: a.time,
                duration: a.duration,
                price: a.price,
                status: a.status,
                client_name: a.clientName,
                client_phone: a.clientPhone,
                client_email: a.clientEmail,
                service_name: a.serviceName,
                professional_name: a.professionalName,
                hair_type: a.hairType,
                skin_type: a.skinType,
                allergies: a.allergies,
                observations: a.observations,
              });
            }

            console.log("Migration complete!");
            fetchData(); // Refresh data
          } catch (e) {
            console.error("Migration failed:", e);
          }
        }
      }
    };

    migrate();
  }, [user, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addClient = async (
    client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent">,
  ) => {
    if (!user) return null;
    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        visits: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding client:", error);
      return null;
    }
    fetchData();
    return {
      id: newClient.id,
      name: newClient.name,
      phone: newClient.phone || "",
      email: newClient.email || "",
      visits: newClient.visits,
      lastVisit: newClient.last_visit || "",
      totalSpent: newClient.total_spent,
    };
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!user) return;
    const { error } = await supabase
      .from("clients")
      .update({
        name: updates.name,
        phone: updates.phone,
        email: updates.email,
        // visits and others usually updated via backend logic or separate calls
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) console.error("Error updating client:", error);
    fetchData();
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) console.error("Error deleting client:", error);
    fetchData();
  };

  const addService = async (service: Omit<Service, "id">) => {
    if (!user) return null;
    const { data: newService, error } = await supabase
      .from("services")
      .insert({
        user_id: user.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
        category: service.category,
      })
      .select()
      .single();

    if (error || !newService) {
      console.error("Error adding service:", error);
      return null;
    }
    fetchData();
    return { ...newService, category: newService.category || "" };
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    if (!user) return;
    const { error } = await supabase
      .from("services")
      .update({
        name: updates.name,
        duration: updates.duration,
        price: updates.price,
        category: updates.category,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) console.error("Error updating service:", error);
    fetchData();
  };

  const deleteService = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) console.error("Error deleting service:", error);
    fetchData();
  };

  const addProfessional = async (
    professional: Omit<Professional, "id" | "color"> & { color?: string },
  ) => {
    if (!user) return null;
    const colors = ["#FF6B9D", "#C77DFF", "#4ECDC4", "#10b981", "#f59e0b"];
    const color =
      professional.color || colors[Math.floor(Math.random() * colors.length)];

    const { data: newProf, error } = await supabase
      .from("professionals")
      .insert({
        user_id: user.id,
        name: professional.name,
        specialty: professional.specialty,
        commission: professional.commission,
        color: color,
      })
      .select()
      .single();

    if (error || !newProf) {
      console.error("Error adding professional:", error);
      return null;
    }

    fetchData();
    return {
      ...newProf,
      specialty: newProf.specialty || "",
      color: newProf.color || "",
    };
  };

  const updateProfessional = async (
    id: string,
    updates: Partial<Professional>,
  ) => {
    if (!user) return;
    const { error } = await supabase
      .from("professionals")
      .update({
        name: updates.name,
        specialty: updates.specialty,
        commission: updates.commission,
        color: updates.color,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) console.error("Error updating professional:", error);
    fetchData();
  };

  const deleteProfessional = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("professionals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) console.error("Error deleting professional:", error);
    fetchData();
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    if (!user) return null;

    // Find or create Client
    let clientId = appointment.clientId;

    if (!clientId) {
      // Try to find by phone
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .ilike("phone", appointment.clientPhone) // Simplistic match, ideally normalize
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
        // Update logic could go here (visits ++)
      } else {
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            name: appointment.clientName,
            phone: appointment.clientPhone,
            email: appointment.clientEmail,
            visits: 1,
            last_visit: appointment.date,
            total_spent: appointment.price,
          })
          .select()
          .single();
        if (newClient) clientId = newClient.id;
      }
    } else {
      // Update valid client stats if needed
    }

    const { data: newApt, error } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        client_id: clientId,
        service_id: appointment.serviceId,
        professional_id: appointment.professionalId,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        price: appointment.price,
        status: appointment.status,
        client_name: appointment.clientName,
        client_phone: appointment.clientPhone,
        client_email: appointment.clientEmail,
        service_name: appointment.serviceName,
        professional_name: appointment.professionalName,
        hair_type: appointment.hairType,
        skin_type: appointment.skinType,
        allergies: appointment.allergies,
        observations: appointment.observations,
      })
      .select()
      .single();

    if (error || !newApt) {
      console.error("Error adding appointment:", error);
      return null;
    }
    fetchData();

    // Mapped return
    return {
      id: newApt.id,
      clientId: newApt.client_id || undefined,
      clientName: newApt.client_name || "",
      clientPhone: newApt.client_phone || "",
      clientEmail: newApt.client_email || "",
      serviceId: newApt.service_id || "",
      serviceName: newApt.service_name || "",
      professionalId: newApt.professional_id || "",
      professionalName: newApt.professional_name || "",
      date: newApt.date,
      time: newApt.time,
      duration: newApt.duration,
      price: newApt.price,
      status: newApt.status as "pending" | "confirmed" | "cancelled",
      hairType: newApt.hair_type || undefined,
      skinType: newApt.skin_type || undefined,
      allergies: newApt.allergies || undefined,
      observations: newApt.observations || undefined,
    };
  };

  const updateAppointment = async (
    id: string,
    updates: Partial<Appointment>,
  ) => {
    if (!user) return;
    const { error } = await supabase
      .from("appointments")
      .update({
        date: updates.date,
        time: updates.time,
        status: updates.status,
        // Add other fields as necessary
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) console.error("Error updating appointment:", error);
    fetchData();
  };

  const deleteAppointment = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) console.error("Error deleting appointment:", error);
    fetchData();
  };

  const refreshFromStorage = useCallback(async () => {
    // Reusing this name to mean "refresh from server"
    await fetchData();
  }, [fetchData]);

  const clearAllData = async () => {
    if (!user) return;
    // Danger zone
    await supabase.from("appointments").delete().eq("user_id", user.id);
    await supabase.from("clients").delete().eq("user_id", user.id);
    await supabase.from("services").delete().eq("user_id", user.id);
    await supabase.from("professionals").delete().eq("user_id", user.id);
    fetchData();
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
    deleteProfessional, // Added back to context
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
  // This function is problematic now as it effectively needs to be async and usually used outside a component hook context (e.g. in standalone scripts)
  // For now, if code imports this, it will break if expecting storage.
  // We will need to update consumers to use the hook or direct supabase calls.
  console.warn(
    "saveAppointmentToStorage is deprecated. Use useSalonData hook.",
  );
  return null;
}
