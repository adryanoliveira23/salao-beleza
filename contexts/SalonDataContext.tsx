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
  setDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate?: string;
  cpf?: string;
  preferredProfessionalId?: string;
  preferences?: string;
  observations?: string;
  hairType?: string;
  skinType?: string;
  allergies?: string;
  visits: number;
  lastVisit: string;
  nextReturnDate?: string;
  totalSpent: number;
  origin?: string;
  marketingConsent?: boolean;
  tags?: string[];
  loyaltyPoints?: number;
  referredBy?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  duration: number;
  bufferTime?: number; // Intervalo entre atendimentos (min)
  price: number;
  costPrice: number;
  commissionRate?: number; // Comissão específica do serviço (%)
  category: string;
  enabledProfessionals?: string[]; // Vazio = todas habilitadas
  onlineBookingEnabled?: boolean;
  isCombo?: boolean;
  comboServices?: string[];
  packageSessions?: number;
  usedProducts?: Array<{ productId: string; quantity: number }>;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  commission: number;
  fixedSalary?: number;
  monthlyGoal?: number;
  color: string;
  phone?: string;
  email?: string;
  cpf?: string;
  pixKey?: string;
  permissions?: "owner" | "professional" | "receptionist";
  workingDays?: string[];
  startTime?: string;
  endTime?: string;
  active?: boolean;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentMethodType =
  | "pix"
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "link_pagamento";

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
  discount?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  paymentMethod?: PaymentMethodType;
  paymentStatus?: "pending" | "partial" | "paid" | "refunded";
  commissionPaid?: boolean;
  status: AppointmentStatus;
  origin?: "manual" | "whatsapp" | "online";
  hairType?: string;
  skinType?: string;
  allergies?: string;
  observations?: string;
  rating?: number;
}

export interface ScheduleBlock {
  id: string;
  professionalId: string; // ID ou "all"
  professionalName: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  reason: "folga" | "almoco" | "ferias" | "feriado" | "bloqueio";
  notes?: string;
}

export interface WaitlistEntry {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  professionalId?: string;
  professionalName?: string;
  desiredDate: string;
  desiredPeriod: "manha" | "tarde" | "noite" | "qualquer";
  notes?: string;
  status: "waiting" | "notified" | "scheduled" | "cancelled";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category:
    | "Tintas e Químicos"
    | "Esmaltes e Unhas"
    | "Cosméticos e Tratamentos"
    | "Descartáveis"
    | "Revenda";
  quantity: number;
  minQuantity: number;
  unit: "un" | "ml" | "g" | "kit";
  costPrice: number;
  salePrice: number;
  supplier?: string;
  expirationDate?: string;
  isForSale: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "service_deduction" | "sale";
  quantity: number;
  unitCost: number;
  reason: string;
  date: string;
  appointmentId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minSpend?: number;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
}

export interface SalonSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  frequency: "Mensal" | "Trimestral" | "Semestral";
  features: string[];
  subscribersCount: number;
  active: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type:
    | "birthday"
    | "inactive"
    | "promo"
    | "return_card"
    | "referral"
    | "review";
  messageTemplate: string;
  targetAudience: string;
  sentCount: number;
  conversionCount: number;
  createdAt: string;
  status: "active" | "sent" | "draft";
}

export interface SalonData {
  clients: Client[];
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  scheduleBlocks: ScheduleBlock[];
  waitlist: WaitlistEntry[];
  products: Product[];
  stockMovements: StockMovement[];
  coupons: Coupon[];
  subscriptionPlans: SalonSubscriptionPlan[];
  campaigns: MarketingCampaign[];
  realizedRevenueByDate?: Record<string, number>;
}

const defaultData: SalonData = {
  clients: [],
  services: [],
  professionals: [],
  appointments: [],
  scheduleBlocks: [],
  waitlist: [],
  products: [],
  stockMovements: [],
  coupons: [],
  subscriptionPlans: [],
  campaigns: [],
  realizedRevenueByDate: {},
};

interface SalonDataContextType extends SalonData {
  loading: boolean;
  addClient: (
    client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent"> & {
      visits?: number;
      lastVisit?: string;
      totalSpent?: number;
    },
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
  addScheduleBlock: (
    block: Omit<ScheduleBlock, "id">,
  ) => Promise<ScheduleBlock | null>;
  deleteScheduleBlock: (id: string) => Promise<void>;
  addWaitlistEntry: (
    entry: Omit<WaitlistEntry, "id" | "createdAt">,
  ) => Promise<WaitlistEntry | null>;
  updateWaitlistEntry: (
    id: string,
    updates: Partial<WaitlistEntry>,
  ) => Promise<void>;
  deleteWaitlistEntry: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  registerStockMovement: (
    movement: Omit<StockMovement, "id" | "date"> & { date?: string },
  ) => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, "id" | "usageCount">) => Promise<void>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  addSubscriptionPlan: (
    plan: Omit<SalonSubscriptionPlan, "id">,
  ) => Promise<void>;
  updateSubscriptionPlan: (
    id: string,
    updates: Partial<SalonSubscriptionPlan>,
  ) => Promise<void>;
  deleteSubscriptionPlan: (id: string) => Promise<void>;
  addCampaign: (
    campaign: Omit<MarketingCampaign, "id" | "createdAt">,
  ) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
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

  const saveExtrasToFirestore = useCallback(
    async (
      partialExtras: Partial<{
        scheduleBlocks: ScheduleBlock[];
        waitlist: WaitlistEntry[];
        products: Product[];
        stockMovements: StockMovement[];
        coupons: Coupon[];
        subscriptionPlans: SalonSubscriptionPlan[];
        campaigns: MarketingCampaign[];
      }>,
    ) => {
      if (!user) return;
      if (typeof window !== "undefined") {
        try {
          const prev = JSON.parse(
            localStorage.getItem(`agendly_extras_${user.uid}`) || "{}",
          );
          localStorage.setItem(
            `agendly_extras_${user.uid}`,
            JSON.stringify({ ...prev, ...partialExtras }),
          );
        } catch {}
      }
      try {
        const extrasRef = doc(db, "salon_extras", user.uid);
        await setDoc(extrasRef, partialExtras, { merge: true });
      } catch {
        // Fallback local já salvo acima caso as regras do Firestore bloqueiem a coleção salon_extras
      }
    },
    [user],
  );

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
      const qLegacyEmployees = query(
        collection(db, "employees"),
        where("ownerId", "==", user.uid),
      );
      const qClients = query(
        collection(db, "clients"),
        where("userId", "==", user.uid),
      );
      const qAppointments = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
      );
      const extrasRef = doc(db, "salon_extras", user.uid);

      const [
        servicesSnap,
        professionalsSnap,
        employeesSnap,
        clientsSnap,
        appointmentsSnap,
        extrasSnap,
      ] = await Promise.all([
        getDocs(qServices).catch(() => ({ docs: [] })),
        getDocs(qProfessionals).catch(() => ({ docs: [] })),
        getDocs(qLegacyEmployees).catch(() => ({ docs: [] })),
        getDocs(qClients).catch(() => ({ docs: [] })),
        getDocs(qAppointments).catch(() => ({ docs: [] })),
        getDoc(extrasRef).catch(() => null),
      ]);

      const services = servicesSnap.docs.map((docItem) => {
        const d = docItem.data();
        return {
          id: docItem.id,
          name: d.name || "",
          description: d.description || "",
          photoUrl: d.photoUrl || "",
          duration: Number(d.duration) || 45,
          bufferTime: Number(d.bufferTime) || 0,
          price: Number(d.price) || 0,
          costPrice: Number(d.costPrice) || 0,
          commissionRate:
            d.commissionRate !== undefined ? Number(d.commissionRate) : undefined,
          category: d.category || "Cabelo",
          enabledProfessionals: d.enabledProfessionals || [],
          onlineBookingEnabled:
            d.onlineBookingEnabled !== undefined ? d.onlineBookingEnabled : true,
          isCombo: d.isCombo || false,
          comboServices: d.comboServices || [],
          packageSessions: d.packageSessions || 1,
          usedProducts: d.usedProducts || [],
        } as Service;
      });

      const profMap = new Map<string, Professional>();
      const palette = [
        "#B83B6B",
        "#C59B27",
        "#88234B",
        "#0CA678",
        "#7048E8",
        "#D9480F",
      ];

      professionalsSnap.docs.forEach((docItem, idx) => {
        const d = docItem.data();
        profMap.set(docItem.id, {
          id: docItem.id,
          name: d.name || "",
          specialty: d.specialty || d.role || "Cabeleireira",
          commission: Number(d.commission) ?? 40,
          fixedSalary: Number(d.fixedSalary) || 0,
          monthlyGoal: Number(d.monthlyGoal) || 5000,
          color: d.color || palette[idx % palette.length],
          phone: d.phone || "",
          email: d.email || "",
          cpf: d.cpf || "",
          pixKey: d.pixKey || "",
          permissions: d.permissions || "professional",
          workingDays: d.workingDays || [
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ],
          startTime: d.startTime || "09:00",
          endTime: d.endTime || "19:00",
          active: d.active !== undefined ? d.active : true,
        });
      });

      // Merge any legacy employees that were only in "employees" collection
      employeesSnap.docs.forEach((docItem, idx) => {
        const d = docItem.data();
        const existingByName = Array.from(profMap.values()).find(
          (p) => p.name.toLowerCase() === (d.name || "").toLowerCase(),
        );
        if (!existingByName && !profMap.has(docItem.id)) {
          profMap.set(docItem.id, {
            id: docItem.id,
            name: d.name || "",
            specialty: d.role || "Profissional",
            commission: Number(d.commission) ?? 30,
            fixedSalary: Number(d.fixedSalary) || 0,
            monthlyGoal: Number(d.monthlyGoal) || 5000,
            color: d.color || palette[(profMap.size + idx) % palette.length],
            phone: d.phone || "",
            email: d.email || "",
            cpf: d.cpf || "",
            pixKey: d.pixKey || "",
            permissions: d.permissions || "professional",
            workingDays: [
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ],
            startTime: "09:00",
            endTime: "19:00",
            active: true,
          });
        }
      });

      const professionals = Array.from(profMap.values());

      const clients = clientsSnap.docs.map((docItem) => {
        const d = docItem.data();
        return {
          id: docItem.id,
          name: d.name || "",
          phone: d.phone || "",
          email: d.email || "",
          birthDate: d.birthDate || "",
          cpf: d.cpf || "",
          preferredProfessionalId: d.preferredProfessionalId || "",
          preferences: d.preferences || "",
          observations: d.observations || "",
          hairType: d.hairType || "",
          skinType: d.skinType || "",
          allergies: d.allergies || "",
          visits: Number(d.visits) || 0,
          lastVisit: d.lastVisit || "",
          nextReturnDate: d.nextReturnDate || "",
          totalSpent: Number(d.totalSpent) || 0,
          origin: d.origin || "WhatsApp",
          marketingConsent:
            d.marketingConsent !== undefined ? d.marketingConsent : true,
          tags: d.tags || [],
          loyaltyPoints: Number(d.loyaltyPoints) || 0,
          referredBy: d.referredBy || "",
        } as Client;
      });

      const appointments = appointmentsSnap.docs.map((docItem) => {
        const d = docItem.data();
        return {
          id: docItem.id,
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
          duration: Number(d.duration) || 45,
          price: Number(d.price) || 0,
          discount: Number(d.discount) || 0,
          depositAmount: Number(d.depositAmount) || 0,
          depositPaid: Boolean(d.depositPaid),
          paymentMethod: d.paymentMethod || "pix",
          paymentStatus: d.paymentStatus || "pending",
          commissionPaid: Boolean(d.commissionPaid),
          status: (d.status as AppointmentStatus) || "pending",
          origin: d.origin || "manual",
          hairType: d.hairType,
          skinType: d.skinType,
          allergies: d.allergies,
          observations: d.observations,
          rating: d.rating,
        } as Appointment;
      });

      const realizedRevenueByDate: Record<string, number> = {};
      appointments.forEach((apt) => {
        if (
          apt.date &&
          (apt.status === "confirmed" || apt.status === "completed")
        ) {
          const netPrice = Math.max(0, apt.price - (apt.discount || 0));
          realizedRevenueByDate[apt.date] =
            (realizedRevenueByDate[apt.date] || 0) + netPrice;
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let localExtras: Record<string, any> = {};
      if (typeof window !== "undefined") {
        try {
          localExtras = JSON.parse(
            localStorage.getItem(`agendly_extras_${user.uid}`) || "{}",
          );
        } catch {}
      }
      const extrasData =
        extrasSnap && extrasSnap.exists() ? extrasSnap.data() : localExtras;

      setData({
        services,
        professionals,
        clients,
        appointments,
        scheduleBlocks: extrasData.scheduleBlocks || [],
        waitlist: extrasData.waitlist || [],
        products: extrasData.products || [],
        stockMovements: extrasData.stockMovements || [],
        coupons: extrasData.coupons || [],
        subscriptionPlans: extrasData.subscriptionPlans || [],
        campaigns: extrasData.campaigns || [],
        realizedRevenueByDate,
      });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err?.code !== "permission-denied") {
        console.warn("Notice fetching salon data:", err?.message || error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client Actions
  const addClient = async (
    client: Omit<Client, "id" | "visits" | "lastVisit" | "totalSpent"> & {
      visits?: number;
      lastVisit?: string;
      totalSpent?: number;
    },
  ) => {
    if (!user) return null;
    try {
      const payload = {
        userId: user.uid,
        name: client.name,
        phone: client.phone || "",
        email: client.email || "",
        birthDate: client.birthDate || "",
        cpf: client.cpf || "",
        preferredProfessionalId: client.preferredProfessionalId || "",
        preferences: client.preferences || "",
        observations: client.observations || "",
        hairType: client.hairType || "",
        skinType: client.skinType || "",
        allergies: client.allergies || "",
        visits: client.visits ?? 0,
        lastVisit: client.lastVisit ?? "",
        nextReturnDate: client.nextReturnDate || "",
        totalSpent: client.totalSpent ?? 0,
        origin: client.origin || "WhatsApp",
        marketingConsent:
          client.marketingConsent !== undefined
            ? client.marketingConsent
            : true,
        tags: client.tags || ["Nova"],
        loyaltyPoints: client.loyaltyPoints ?? 0,
        referredBy: client.referredBy || "",
      };

      const docRef = await addDoc(collection(db, "clients"), payload);
      const newClient: Client = { id: docRef.id, ...payload };
      await fetchData();
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
      await fetchData();
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      await fetchData();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  // Service Actions
  const addService = async (service: Omit<Service, "id">) => {
    if (!user) return null;
    try {
      const payload = {
        userId: user.uid,
        name: service.name,
        description: service.description || "",
        photoUrl: service.photoUrl || "",
        duration: Number(service.duration) || 45,
        bufferTime: Number(service.bufferTime) || 0,
        price: Number(service.price) || 0,
        costPrice: Number(service.costPrice) || 0,
        commissionRate:
          service.commissionRate !== undefined
            ? Number(service.commissionRate)
            : null,
        category: service.category || "Cabelo",
        enabledProfessionals: service.enabledProfessionals || [],
        onlineBookingEnabled:
          service.onlineBookingEnabled !== undefined
            ? service.onlineBookingEnabled
            : true,
        isCombo: Boolean(service.isCombo),
        comboServices: service.comboServices || [],
        packageSessions: Number(service.packageSessions) || 1,
        usedProducts: service.usedProducts || [],
      };
      const docRef = await addDoc(collection(db, "services"), payload);
      await fetchData();
      return {
        id: docRef.id,
        ...service,
        category: service.category || "Cabelo",
      };
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
      await fetchData();
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "services", id));
      await fetchData();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  // Professional Actions
  const addProfessional = async (
    professional: Omit<Professional, "id" | "color"> & { color?: string },
  ) => {
    if (!user) return null;
    const colors = [
      "#B83B6B",
      "#C59B27",
      "#88234B",
      "#0CA678",
      "#7048E8",
      "#D9480F",
    ];
    const color =
      professional.color || colors[Math.floor(Math.random() * colors.length)];

    try {
      const payload = {
        userId: user.uid,
        name: professional.name,
        specialty: professional.specialty,
        commission: Number(professional.commission) || 0,
        fixedSalary: Number(professional.fixedSalary) || 0,
        monthlyGoal: Number(professional.monthlyGoal) || 5000,
        color,
        phone: professional.phone || "",
        email: professional.email || "",
        cpf: professional.cpf || "",
        pixKey: professional.pixKey || "",
        permissions: professional.permissions || "professional",
        workingDays: professional.workingDays || [
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
        startTime: professional.startTime || "09:00",
        endTime: professional.endTime || "19:00",
        active: professional.active !== undefined ? professional.active : true,
      };
      const docRef = await addDoc(collection(db, "professionals"), payload);
      await fetchData();
      return {
        id: docRef.id,
        ...payload,
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
      await setDoc(profRef, { ...updates, userId: user.uid }, { merge: true });
      await fetchData();
    } catch (error) {
      console.error("Error updating professional:", error);
    }
  };

  const deleteProfessional = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "professionals", id));
      try {
        await deleteDoc(doc(db, "employees", id));
      } catch {
        // Ignore if not in legacy employees
      }
      await fetchData();
    } catch (error) {
      console.error("Error deleting professional:", error);
    }
  };

  // Appointment Actions
  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    if (!user) return null;

    let clientId = appointment.clientId;

    if (!clientId && appointment.clientPhone) {
      try {
        const q = query(
          collection(db, "clients"),
          where("userId", "==", user.uid),
          where("phone", "==", appointment.clientPhone),
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          clientId = querySnapshot.docs[0].id;
        } else {
          const nextReturn = new Date(appointment.date);
          nextReturn.setDate(nextReturn.getDate() + 21);
          const newClientRef = await addDoc(collection(db, "clients"), {
            userId: user.uid,
            name: appointment.clientName,
            phone: appointment.clientPhone,
            email: appointment.clientEmail || "",
            visits: 1,
            lastVisit: appointment.date,
            nextReturnDate: nextReturn.toISOString().split("T")[0],
            totalSpent: appointment.price,
            origin:
              appointment.origin === "whatsapp"
                ? "WhatsApp"
                : appointment.origin === "online"
                  ? "Agendamento Online"
                  : "Salão",
            marketingConsent: true,
            tags: ["Nova"],
            loyaltyPoints: Math.floor(appointment.price / 10),
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
        clientId: clientId || null,
        serviceId: appointment.serviceId,
        professionalId: appointment.professionalId,
        date: appointment.date,
        time: appointment.time,
        duration: Number(appointment.duration) || 45,
        price: Number(appointment.price) || 0,
        discount: Number(appointment.discount) || 0,
        depositAmount: Number(appointment.depositAmount) || 0,
        depositPaid: Boolean(appointment.depositPaid),
        paymentMethod: appointment.paymentMethod || "pix",
        paymentStatus: appointment.paymentStatus || "pending",
        commissionPaid: Boolean(appointment.commissionPaid),
        status: appointment.status || "confirmed",
        origin: appointment.origin || "manual",
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail || "",
        serviceName: appointment.serviceName,
        professionalName: appointment.professionalName,
        hairType: appointment.hairType || "",
        skinType: appointment.skinType || "",
        allergies: appointment.allergies || "",
        observations: appointment.observations || "",
      });

      await fetchData();
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
      const existingApt = data.appointments.find((a) => a.id === id);
      const aptRef = doc(db, "appointments", id);
      await updateDoc(aptRef, { ...updates });

      // When transitioning to completed, update client stats & deduct used products from stock
      if (
        updates.status === "completed" &&
        existingApt &&
        existingApt.status !== "completed"
      ) {
        if (existingApt.clientId) {
          const clientObj = data.clients.find(
            (c) => c.id === existingApt.clientId,
          );
          if (clientObj) {
            const netPaid = Math.max(
              0,
              (updates.price ?? existingApt.price) -
                (updates.discount ?? existingApt.discount ?? 0),
            );
            const newVisits = (clientObj.visits || 0) + 1;
            const newSpent = (clientObj.totalSpent || 0) + netPaid;
            const newPoints =
              (clientObj.loyaltyPoints || 0) + Math.floor(netPaid / 10);
            const nextReturn = new Date(existingApt.date);
            nextReturn.setDate(nextReturn.getDate() + 21);

            const updatedTags = new Set(clientObj.tags || []);
            if (newVisits >= 3) {
              updatedTags.delete("Nova");
              updatedTags.add("Frequente");
            }
            if (newSpent >= 1000 || newVisits >= 10) {
              updatedTags.add("VIP");
            }

            await updateDoc(doc(db, "clients", clientObj.id), {
              visits: newVisits,
              lastVisit: existingApt.date,
              nextReturnDate: nextReturn.toISOString().split("T")[0],
              totalSpent: newSpent,
              loyaltyPoints: newPoints,
              tags: Array.from(updatedTags),
            });
          }
        }

        // Deduct products linked to service if any
        const serviceObj = data.services.find(
          (s) => s.id === existingApt.serviceId,
        );
        if (serviceObj?.usedProducts && serviceObj.usedProducts.length > 0) {
          let updatedProducts = [...data.products];
          const newMovements: StockMovement[] = [...data.stockMovements];

          serviceObj.usedProducts.forEach((up) => {
            const pIdx = updatedProducts.findIndex(
              (p) => p.id === up.productId,
            );
            if (pIdx >= 0) {
              const prod = updatedProducts[pIdx];
              updatedProducts[pIdx] = {
                ...prod,
                quantity: Math.max(0, prod.quantity - up.quantity),
              };
              newMovements.unshift({
                id: crypto.randomUUID(),
                productId: prod.id,
                productName: prod.name,
                type: "service_deduction",
                quantity: up.quantity,
                unitCost: prod.costPrice,
                reason: `Baixa automática: ${serviceObj.name} (${existingApt.clientName})`,
                date: new Date().toISOString().split("T")[0],
                appointmentId: id,
              });
            }
          });

          await saveExtrasToFirestore({
            products: updatedProducts,
            stockMovements: newMovements,
          });
        }
      }

      await fetchData();
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "appointments", id));
      await fetchData();
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  // Schedule Blocks
  const addScheduleBlock = async (block: Omit<ScheduleBlock, "id">) => {
    const newBlock: ScheduleBlock = { ...block, id: crypto.randomUUID() };
    const updated = [...data.scheduleBlocks, newBlock];
    setData((prev) => ({ ...prev, scheduleBlocks: updated }));
    await saveExtrasToFirestore({ scheduleBlocks: updated });
    return newBlock;
  };

  const deleteScheduleBlock = async (id: string) => {
    const updated = data.scheduleBlocks.filter((b) => b.id !== id);
    setData((prev) => ({ ...prev, scheduleBlocks: updated }));
    await saveExtrasToFirestore({ scheduleBlocks: updated });
  };

  // Waitlist
  const addWaitlistEntry = async (
    entry: Omit<WaitlistEntry, "id" | "createdAt">,
  ) => {
    const newEntry: WaitlistEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...data.waitlist];
    setData((prev) => ({ ...prev, waitlist: updated }));
    await saveExtrasToFirestore({ waitlist: updated });
    return newEntry;
  };

  const updateWaitlistEntry = async (
    id: string,
    updates: Partial<WaitlistEntry>,
  ) => {
    const updated = data.waitlist.map((w) =>
      w.id === id ? { ...w, ...updates } : w,
    );
    setData((prev) => ({ ...prev, waitlist: updated }));
    await saveExtrasToFirestore({ waitlist: updated });
  };

  const deleteWaitlistEntry = async (id: string) => {
    const updated = data.waitlist.filter((w) => w.id !== id);
    setData((prev) => ({ ...prev, waitlist: updated }));
    await saveExtrasToFirestore({ waitlist: updated });
  };

  // Inventory / Products
  const addProduct = async (product: Omit<Product, "id">) => {
    const newProduct: Product = { ...product, id: crypto.randomUUID() };
    const updated = [...data.products, newProduct];
    const initialMovement: StockMovement = {
      id: crypto.randomUUID(),
      productId: newProduct.id,
      productName: newProduct.name,
      type: "in",
      quantity: newProduct.quantity,
      unitCost: newProduct.costPrice,
      reason: "Estoque inicial",
      date: new Date().toISOString().split("T")[0],
    };
    const updatedMovements = [initialMovement, ...data.stockMovements];
    setData((prev) => ({
      ...prev,
      products: updated,
      stockMovements: updatedMovements,
    }));
    await saveExtrasToFirestore({
      products: updated,
      stockMovements: updatedMovements,
    });
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = data.products.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    setData((prev) => ({ ...prev, products: updated }));
    await saveExtrasToFirestore({ products: updated });
  };

  const deleteProduct = async (id: string) => {
    const updated = data.products.filter((p) => p.id !== id);
    setData((prev) => ({ ...prev, products: updated }));
    await saveExtrasToFirestore({ products: updated });
  };

  const registerStockMovement = async (
    movement: Omit<StockMovement, "id" | "date"> & { date?: string },
  ) => {
    const newMovement: StockMovement = {
      ...movement,
      id: crypto.randomUUID(),
      date: movement.date || new Date().toISOString().split("T")[0],
    };
    const updatedProducts = data.products.map((p) => {
      if (p.id !== movement.productId) return p;
      const delta =
        movement.type === "in" ? movement.quantity : -movement.quantity;
      return { ...p, quantity: Math.max(0, p.quantity + delta) };
    });
    const updatedMovements = [newMovement, ...data.stockMovements];
    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      stockMovements: updatedMovements,
    }));
    await saveExtrasToFirestore({
      products: updatedProducts,
      stockMovements: updatedMovements,
    });
  };

  // Coupons, Subscriptions, Campaigns
  const addCoupon = async (coupon: Omit<Coupon, "id" | "usageCount">) => {
    const newCoupon: Coupon = {
      ...coupon,
      id: crypto.randomUUID(),
      usageCount: 0,
    };
    const updated = [...data.coupons, newCoupon];
    setData((prev) => ({ ...prev, coupons: updated }));
    await saveExtrasToFirestore({ coupons: updated });
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>) => {
    const updated = data.coupons.map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );
    setData((prev) => ({ ...prev, coupons: updated }));
    await saveExtrasToFirestore({ coupons: updated });
  };

  const deleteCoupon = async (id: string) => {
    const updated = data.coupons.filter((c) => c.id !== id);
    setData((prev) => ({ ...prev, coupons: updated }));
    await saveExtrasToFirestore({ coupons: updated });
  };

  const addSubscriptionPlan = async (
    plan: Omit<SalonSubscriptionPlan, "id">,
  ) => {
    const newPlan: SalonSubscriptionPlan = {
      ...plan,
      id: crypto.randomUUID(),
    };
    const updated = [...data.subscriptionPlans, newPlan];
    setData((prev) => ({ ...prev, subscriptionPlans: updated }));
    await saveExtrasToFirestore({ subscriptionPlans: updated });
  };

  const updateSubscriptionPlan = async (
    id: string,
    updates: Partial<SalonSubscriptionPlan>,
  ) => {
    const updated = data.subscriptionPlans.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    setData((prev) => ({ ...prev, subscriptionPlans: updated }));
    await saveExtrasToFirestore({ subscriptionPlans: updated });
  };

  const deleteSubscriptionPlan = async (id: string) => {
    const updated = data.subscriptionPlans.filter((p) => p.id !== id);
    setData((prev) => ({ ...prev, subscriptionPlans: updated }));
    await saveExtrasToFirestore({ subscriptionPlans: updated });
  };

  const addCampaign = async (
    campaign: Omit<MarketingCampaign, "id" | "createdAt">,
  ) => {
    const newCampaign: MarketingCampaign = {
      ...campaign,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newCampaign, ...data.campaigns];
    setData((prev) => ({ ...prev, campaigns: updated }));
    await saveExtrasToFirestore({ campaigns: updated });
  };

  const deleteCampaign = async (id: string) => {
    const updated = data.campaigns.filter((c) => c.id !== id);
    setData((prev) => ({ ...prev, campaigns: updated }));
    await saveExtrasToFirestore({ campaigns: updated });
  };

  const refreshFromStorage = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearAllData = async () => {
    if (!user) return;
    try {
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
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
          operationCount++;
        });
      }

      if (operationCount > 0) {
        await batch.commit();
      }
      await setDoc(doc(db, "salon_extras", user.uid), {
        scheduleBlocks: [],
        waitlist: [],
        products: [],
        stockMovements: [],
        coupons: [],
        subscriptionPlans: [],
        campaigns: [],
      });
      await fetchData();
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
    addScheduleBlock,
    deleteScheduleBlock,
    addWaitlistEntry,
    updateWaitlistEntry,
    deleteWaitlistEntry,
    addProduct,
    updateProduct,
    deleteProduct,
    registerStockMovement,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    addSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    addCampaign,
    deleteCampaign,
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
