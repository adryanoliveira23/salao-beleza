"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

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
  status: "pending" | "confirmed";
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
  /** Receita de agendamentos excluídos por data (para não reduzir Receita Hoje ao excluir) */
  realizedRevenueByDate?: Record<string, number>;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const defaultData: SalonData = {
  clients: [],
  services: [],
  professionals: [],
  appointments: [],
  realizedRevenueByDate: {},
};

function loadFromStorage(): SalonData {
  if (typeof window === "undefined") return defaultData;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let data = JSON.parse(stored);
      data.realizedRevenueByDate = data.realizedRevenueByDate || {};
      const clients = data.clients || [];
      let appointments = data.appointments || [];
      const needsMigration = appointments.some((a: Appointment) => !a.clientId);
      if (needsMigration && clients.length > 0) {
        appointments = appointments.map((apt: Appointment) => {
          if (apt.clientId) return apt;
          const match = clients.find(
            (c: Client) =>
              (c.phone ?? "").replace(/\D/g, "") === (apt.clientPhone ?? "").replace(/\D/g, "") ||
              ((c.email ?? "").toLowerCase() === (apt.clientEmail ?? "").toLowerCase() && (c.email ?? "").length > 0) ||
              (c.name ?? "").toLowerCase().trim() === (apt.clientName ?? "").toLowerCase().trim()
          );
          return match ? { ...apt, clientId: match.id } : apt;
        });
        data = { ...data, appointments };
        saveToStorage(data);
      }
      return data;
    }
    saveToStorage(defaultData);
    return defaultData;
  } catch (e) {
    console.error("Failed to load salon data:", e);
  }
  return defaultData;
}

function saveToStorage(data: SalonData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save salon data:", e);
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface SalonDataContextType extends SalonData {
  realizedRevenueByDate: Record<string, number>;
  addClient: (client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent">) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addService: (service: Omit<Service, "id">) => Service;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addProfessional: (professional: Omit<Professional, "id" | "color"> & { color?: string }) => Professional;
  updateProfessional: (id: string, professional: Partial<Professional>) => void;
  addAppointment: (appointment: Omit<Appointment, "id">) => Appointment;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  refreshFromStorage: () => void;
  clearAllData: () => void;
}

const SalonDataContext = createContext<SalonDataContextType | undefined>(
  undefined
);

export function SalonDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SalonData>(defaultData);

  const refreshFromStorage = useCallback(() => {
    setData(loadFromStorage());
  }, []);

  const clearAllData = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultData);
  }, []);

  useEffect(() => {
    setData(loadFromStorage());
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persist = useCallback((newData: SalonData) => {
    setData(newData);
    saveToStorage(newData);
  }, []);

  const addClient = useCallback(
    (
      client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent">
    ): Client => {
      const newClient: Client = {
        ...client,
        id: generateId(),
        visits: 0,
        lastVisit: "",
        totalSpent: 0,
      };
      const newData = {
        ...data,
        clients: [...data.clients, newClient],
      };
      persist(newData);
      return newClient;
    },
    [data, persist]
  );

  const updateClient = useCallback(
    (id: string, updates: Partial<Client>) => {
      const newData = {
        ...data,
        clients: data.clients.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      };
      persist(newData);
    },
    [data, persist]
  );

  const deleteClient = useCallback(
    (id: string) => {
      const client = data.clients.find((c) => c.id === id);
      const phoneNorm = client?.phone.replace(/\D/g, "") ?? "";
      const emailRaw = (client?.email ?? "").toLowerCase().trim();
      const emailNorm = emailRaw && emailRaw !== "não informado" ? emailRaw : "";
      const clientNameNorm = (client?.name ?? "").toLowerCase().trim();
      const newData = {
        ...data,
        clients: data.clients.filter((c) => c.id !== id),
        appointments: data.appointments.filter((apt) => {
          if (apt.clientId === id) return false;
          const aptPhone = (apt.clientPhone ?? "").replace(/\D/g, "");
          const aptEmailRaw = (apt.clientEmail ?? "").toLowerCase().trim();
          const aptEmail = aptEmailRaw && aptEmailRaw !== "não informado" ? aptEmailRaw : "";
          const aptName = (apt.clientName ?? "").toLowerCase().trim();
          const matchByPhone = phoneNorm.length >= 10 && aptPhone === phoneNorm;
          const matchByEmail = emailNorm.length > 0 && aptEmail === emailNorm;
          const matchByName = clientNameNorm.length > 0 && aptName === clientNameNorm;
          return !matchByPhone && !matchByEmail && !matchByName;
        }),
      };
      persist(newData);
    },
    [data, persist]
  );

  const addService = useCallback(
    (service: Omit<Service, "id">): Service => {
      const newService: Service = {
        ...service,
        id: generateId(),
      };
      const newData = {
        ...data,
        services: [...data.services, newService],
      };
      persist(newData);
      return newService;
    },
    [data, persist]
  );

  const updateService = useCallback(
    (id: string, updates: Partial<Service>) => {
      const newData = {
        ...data,
        services: data.services.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      };
      persist(newData);
    },
    [data, persist]
  );

  const deleteService = useCallback(
    (id: string) => {
      const newData = {
        ...data,
        services: data.services.filter((s) => s.id !== id),
      };
      persist(newData);
    },
    [data, persist]
  );

  const addProfessional = useCallback(
    (professional: Omit<Professional, "id" | "color"> & { color?: string }): Professional => {
      const colors = ["#FF6B9D", "#C77DFF", "#4ECDC4", "#10b981", "#f59e0b"];
      const newProfessional: Professional = {
        ...professional,
        id: generateId(),
        color: professional.color || colors[data.professionals.length % colors.length],
      };
      const newData = {
        ...data,
        professionals: [...data.professionals, newProfessional],
      };
      persist(newData);
      return newProfessional;
    },
    [data, persist]
  );

  const updateProfessional = useCallback(
    (id: string, updates: Partial<Professional>) => {
      const newData = {
        ...data,
        professionals: data.professionals.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      };
      persist(newData);
    },
    [data, persist]
  );

  const addAppointment = useCallback(
    (appointment: Omit<Appointment, "id">): Appointment => {
      let newData = { ...data };
      const existingClient = data.clients.find(
        (c) =>
          c.email === appointment.clientEmail ||
          c.phone.replace(/\D/g, "") === appointment.clientPhone.replace(/\D/g, "")
      );
      let clientId: string;
      if (!existingClient) {
        const newClient: Client = {
          id: generateId(),
          name: appointment.clientName,
          phone: appointment.clientPhone,
          email: appointment.clientEmail,
          visits: 1,
          lastVisit: appointment.date,
          totalSpent: appointment.price,
        };
        clientId = newClient.id;
        newData = {
          ...newData,
          clients: [...newData.clients, newClient],
        };
      } else {
        clientId = existingClient.id;
        newData = {
          ...newData,
          clients: newData.clients.map((c) =>
            c.id === existingClient.id
              ? {
                  ...c,
                  visits: c.visits + 1,
                  lastVisit: appointment.date,
                  totalSpent: c.totalSpent + appointment.price,
                }
              : c
          ),
        };
      }
      const newAppointment: Appointment = {
        ...appointment,
        id: generateId(),
        clientId,
      };
      newData = {
        ...newData,
        appointments: [...newData.appointments, newAppointment],
      };
      persist(newData);
      return newAppointment;
    },
    [data, persist]
  );

  const updateAppointment = useCallback(
    (id: string, updates: Partial<Appointment>) => {
      const newData = {
        ...data,
        appointments: data.appointments.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      };
      persist(newData);
    },
    [data, persist]
  );

  const deleteAppointment = useCallback(
    (id: string) => {
      const apt = data.appointments.find((a) => a.id === id);
      const realized = { ...(data.realizedRevenueByDate || {}) };
      if (apt) {
        realized[apt.date] = (realized[apt.date] || 0) + apt.price;
      }
      const newData = {
        ...data,
        appointments: data.appointments.filter((a) => a.id !== id),
        realizedRevenueByDate: realized,
      };
      persist(newData);
    },
    [data, persist]
  );

  const value: SalonDataContextType = {
    ...data,
    realizedRevenueByDate: data.realizedRevenueByDate || {},
    addClient,
    updateClient,
    deleteClient,
    addService,
    updateService,
    deleteService,
    addProfessional,
    updateProfessional,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refreshFromStorage,
    clearAllData,
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

export function getSalonDataFromStorage(): SalonData {
  return loadFromStorage();
}

export function saveAppointmentToStorage(appointment: Omit<Appointment, "id">) {
  const data = loadFromStorage();
  const existingClient = data.clients.find(
    (c) =>
      c.email === appointment.clientEmail ||
      c.phone.replace(/\D/g, "") === appointment.clientPhone.replace(/\D/g, "")
  );
  let newData = { ...data };
  let clientId: string;
  if (!existingClient) {
    const newClient: Client = {
      id: generateId(),
      name: appointment.clientName,
      phone: appointment.clientPhone,
      email: appointment.clientEmail,
      visits: 1,
      lastVisit: appointment.date,
      totalSpent: appointment.price,
    };
    clientId = newClient.id;
    newData = {
      ...newData,
      clients: [...newData.clients, newClient],
    };
  } else {
    clientId = existingClient.id;
    newData = {
      ...newData,
      clients: newData.clients.map((c) =>
        c.id === existingClient.id
          ? {
              ...c,
              visits: c.visits + 1,
              lastVisit: appointment.date,
              totalSpent: c.totalSpent + appointment.price,
            }
          : c
      ),
    };
  }
  const newAppointment: Appointment = {
    ...appointment,
    id: generateId(),
    clientId,
  };
  newData = {
    ...newData,
    appointments: [...newData.appointments, newAppointment],
  };
  saveToStorage(newData);
  return newAppointment;
}
