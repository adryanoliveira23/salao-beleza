"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  limit,
} from "firebase/firestore";
import {
  Scissors,
  Clock,
  User,
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Droplet,
  Wind,
  Eye,
  Flower2,
  CalendarDays,
  ShieldCheck,
  Heart,
  AlertCircle,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { soundEffects } from "@/lib/soundEffects";
import { useToast } from "@/contexts/ToastContext";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  bufferTime?: number;
  price: number;
  category: string;
  onlineBookingEnabled?: boolean;
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface ExistingAppointment {
  id?: string;
  date: string;
  time: string;
  duration: number;
  professionalId?: string;
  status?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  price?: number;
  createdAt?: string;
}

const SLOT_START = 8;
const SLOT_END = 20;
const SLOT_INTERVAL = 30;

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = SLOT_START; h < SLOT_END; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function parseTimeToMinutes(time: string): number {
  const [h, m] = (time || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits[2] === "9") {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  return days[d.getDay()] || "";
}

function formatDuration(minutes: number): string {
  if (!minutes) return "1h 00min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (h > 0) return `${h}h 00min`;
  return `${m}min`;
}

function formatSlugToTitle(slug: string): string {
  if (!slug) return "Espaço de Beleza";
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("corte") || n.includes("cabelo")) return Scissors;
  if (n.includes("escova") || n.includes("penteado")) return Wind;
  if (n.includes("color") || n.includes("mecha") || n.includes("tintura")) return Droplet;
  if (n.includes("hidrat") || n.includes("nutri") || n.includes("reconstr")) return Droplet;
  if (n.includes("manicure") || n.includes("pedicure") || n.includes("unha")) return Sparkles;
  if (n.includes("sobrancelha") || n.includes("cilio") || n.includes("olhar")) return Eye;
  return Flower2;
}

export default function AgendarPage() {
  const params = useParams();
  const username = params?.username as string;
  const toast = useToast();

  // Adaptador de Tema Light / Dark Completo
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mountedTheme, setMountedTheme] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("bellamais_booking_theme");
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialDark = savedTheme ? savedTheme === "dark" : prefersDark;

      setIsDark(initialDark);
      setMountedTheme(true);

      if (initialDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.style.colorScheme = "light";
      }
    }
  }, []);

  const handleToggleTheme = () => {
    soundEffects.playPop();
    setIsDark((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
          document.documentElement.setAttribute("data-theme", "dark");
          document.documentElement.style.colorScheme = "dark";
          localStorage.setItem("bellamais_booking_theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.setAttribute("data-theme", "light");
          document.documentElement.style.colorScheme = "light";
          localStorage.setItem("bellamais_booking_theme", "light");
        }
      }
      return next;
    });
  };

  // Dados do Salão (100% Reais do Firestore)
  const [salonUserId, setSalonUserId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState<string>(() =>
    formatSlugToTitle(username),
  );
  const [salonAddress, setSalonAddress] = useState<string>("");
  const [salonPhone, setSalonPhone] = useState<string>("");
  const [bookingRules, setBookingRules] = useState<{
    requireDeposit?: boolean;
    depositPercent?: number;
    pixKey?: string;
  }>({});

  // Serviços e Agendamentos (Apenas dados reais, ZERO mock fallbacks)
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<
    ExistingAppointment[]
  >([]);

  // Filtro de Categoria
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Modal rápido de Meus Agendamentos
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [clientAppointments, setClientAppointments] = useState<
    ExistingAppointment[]
  >([]);
  const [loadingClientAppointments, setLoadingClientAppointments] =
    useState(false);
  const [clientPhoneSaved, setClientPhoneSaved] = useState<string>("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Calendário
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split("T")[0], [today]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Formulário do Agendamento
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    serviceId: "",
    professionalId: "",
    date: todayStr,
    time: "",
    observations: "",
  });

  const [submittedData, setSubmittedData] = useState<{
    clientName: string;
    serviceName: string;
    professionalName: string;
    date: string;
    time: string;
    price: number;
    duration: number;
    depositAmount: number;
    clientPhone?: string;
  } | null>(null);

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Controle de Etapas (Wizard Guiado)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const goToStep = (step: 1 | 2 | 3) => {
    soundEffects.playPop();
    setFormError("");
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Recupera dados salvos do cliente no navegador
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("bellamais_client_phone") || "";
      const savedName = localStorage.getItem("bellamais_client_name") || "";
      if (savedPhone) {
        setClientPhoneSaved(savedPhone);
        setLookupPhone(savedPhone);
        setForm((prev) => ({
          ...prev,
          clientPhone: savedPhone,
          clientName: prev.clientName || savedName,
        }));
      }
    }
  }, []);

  // 1. Carregar Dados Reais do Perfil do Salão
  useEffect(() => {
    async function fetchSalonUser() {
      if (!username) return;
      try {
        const cleanUser = decodeURIComponent(username).trim().toLowerCase();
        let targetDoc = null;

        // Busca por username
        try {
          const q = query(
            collection(db, "profiles"),
            where("username", "==", cleanUser),
            limit(1),
          );
          const snap = await getDocs(q);
          if (!snap.empty) targetDoc = snap.docs[0];
        } catch (e) {
          console.warn("Username query note:", e);
        }

        // Busca alternativa por ID direto
        if (!targetDoc && cleanUser.length >= 15) {
          try {
            const directSnap = await getDoc(doc(db, "profiles", cleanUser));
            if (directSnap.exists()) targetDoc = directSnap;
          } catch (e) {
            console.warn("Direct ID query note:", e);
          }
        }

        if (targetDoc) {
          const data = targetDoc.data();
          const targetUserId = data.userId || targetDoc.id;
          setSalonUserId(targetUserId);
          setSalonName(data.salon_name || formatSlugToTitle(username));
          setSalonAddress(data.address || "");
          setSalonPhone(data.phone || "");
          setBookingRules(data.bookingRules || {});
        } else {
          setSalonName(formatSlugToTitle(username));
          setLoadingServices(false);
        }
      } catch (err) {
        console.warn("Salon fetch note:", err);
        setSalonName(formatSlugToTitle(username));
        setLoadingServices(false);
      }
    }
    fetchSalonUser();
  }, [username]);

  // 2. Carregar Apenas Serviços Reais do Salão (Sem Mock Data)
  useEffect(() => {
    if (!salonUserId) return;

    async function fetchSalonServices() {
      setLoadingServices(true);
      try {
        const qServices = query(
          collection(db, "services"),
          where("userId", "==", salonUserId),
        );
        const sSnap = await getDocs(qServices);
        const sData = sSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Service, "id">) }))
          .filter((s) => s.onlineBookingEnabled !== false);

        setServices(sData);
        if (sData.length > 0) {
          setForm((prev) => ({
            ...prev,
            serviceId: prev.serviceId && sData.some((s) => s.id === prev.serviceId)
              ? prev.serviceId
              : sData[0].id,
          }));
        } else {
          setForm((prev) => ({ ...prev, serviceId: "" }));
        }

        // Profissionais Reais
        const qProfs = query(
          collection(db, "professionals"),
          where("userId", "==", salonUserId),
        );
        const pSnap = await getDocs(qProfs);
        const pData = pSnap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Professional, "id">),
          }))
          .filter((p: any) => p.active !== false);

        setProfessionals(pData);
        if (pData.length > 0) {
          setForm((prev) => ({ ...prev, professionalId: pData[0].id }));
        }
      } catch (e) {
        console.warn("Services query note:", e);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchSalonServices();
  }, [salonUserId]);

  // 3. Carregar Agendamentos Reais para Validar Conflitos na Data
  useEffect(() => {
    if (!salonUserId || !form.date) return;

    async function fetchAppointments() {
      try {
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", salonUserId),
          where("date", "==", form.date),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ExistingAppointment),
        }));
        setExistingAppointments(data);
      } catch (e) {
        console.warn("Appointments query note:", e);
      }
    }
    fetchAppointments();
  }, [salonUserId, form.date]);

  // Procedimento Selecionado
  const selectedService = useMemo(
    () => services.find((s) => s.id === form.serviceId) || null,
    [services, form.serviceId],
  );

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === form.professionalId),
    [professionals, form.professionalId],
  );

  // Categorias Reais
  const categories = useMemo(() => {
    if (services.length === 0) return [];
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category && s.category.trim()) set.add(s.category.trim());
    });
    return ["Todos", ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "Todos") return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Horários Ocupados (Prevenção de Sobreposição em Tempo Real)
  const occupiedSlots = useMemo(() => {
    const occupied = new Set<string>();
    const neededDuration =
      (selectedService?.duration || 30) + (selectedService?.bufferTime || 0);

    for (const slot of TIME_SLOTS) {
      const slotStart = parseTimeToMinutes(slot);
      const slotEnd = slotStart + neededDuration;

      for (const apt of existingAppointments) {
        if (apt.status === "cancelled" || apt.status === "no_show") continue;
        if (apt.date !== form.date) continue;
        if (
          form.professionalId &&
          apt.professionalId &&
          apt.professionalId !== form.professionalId
        ) {
          continue;
        }
        const aptStart = parseTimeToMinutes(apt.time);
        const aptEnd = aptStart + (apt.duration || 45);
        if (slotStart < aptEnd && slotEnd > aptStart) {
          occupied.add(slot);
        }
      }
    }
    return occupied;
  }, [existingAppointments, form.date, form.professionalId, selectedService]);

  // Calendário
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
    ).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: "",
        dayNum: 0,
        isCurrentMonth: false,
        isPast: true,
        isSelected: false,
        isToday: false,
      });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(currentYear, currentMonth, day, 23, 59, 59);
      const isPast = dateObj < today && dateStr !== todayStr;
      const isSelected = form.date === dateStr;
      const isToday = dateStr === todayStr;

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isPast,
        isSelected,
        isToday,
      });
    }

    return days;
  }, [currentYear, currentMonth, today, todayStr, form.date]);

  const handlePrevMonth = () => {
    soundEffects.playPop();
    if (
      currentYear === today.getFullYear() &&
      currentMonth <= today.getMonth()
    ) {
      return;
    }
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    soundEffects.playPop();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Buscar Agendamentos da Cliente pelo WhatsApp (Sem Cadastro)
  const fetchClientAppointments = useCallback(
    async (phoneToSearch?: string) => {
      const targetPhone = phoneToSearch || lookupPhone || clientPhoneSaved;
      const cleanDigits = targetPhone.replace(/\D/g, "");
      if (cleanDigits.length < 10) return;

      setLoadingClientAppointments(true);
      try {
        if (!salonUserId) {
          setClientAppointments([]);
          return;
        }

        const qAppointments = query(
          collection(db, "appointments"),
          where("userId", "==", salonUserId),
        );
        const snap = await getDocs(qAppointments);

        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as ExistingAppointment) }))
          .filter((apt) => {
            const aptDigits = (apt.clientPhone || "").replace(/\D/g, "");
            return (
              aptDigits === cleanDigits ||
              (aptDigits.endsWith(cleanDigits) && cleanDigits.length >= 8)
            );
          })
          .sort(
            (a, b) =>
              new Date(`${b.date}T${b.time || "00:00"}`).getTime() -
              new Date(`${a.date}T${a.time || "00:00"}`).getTime(),
          );

        setClientAppointments(list);
        if (typeof window !== "undefined") {
          localStorage.setItem("bellamais_client_phone", targetPhone);
        }
        setClientPhoneSaved(targetPhone);
      } catch (err) {
        console.warn("Client appointments note:", err);
      } finally {
        setLoadingClientAppointments(false);
      }
    },
    [salonUserId, lookupPhone, clientPhoneSaved],
  );

  // Cancelar Agendamento pela Cliente
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    setCancellingId(appointmentId);
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: "client",
      });
      soundEffects.playClick();
      setClientAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: "cancelled" } : a,
        ),
      );
      if (salonUserId && form.date) {
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", salonUserId),
          where("date", "==", form.date),
        );
        const snap = await getDocs(q);
        setExistingAppointments(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as ExistingAppointment),
          })),
        );
      }
    } catch (err) {
      console.error("Erro ao cancelar:", err);
      toast.error(
        "Não foi possível cancelar o agendamento no momento. Tente novamente.",
        "Erro ao Cancelar"
      );
    } finally {
      setCancellingId(null);
    }
  };

  // Enviar Agendamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedService) {
      setFormError("Por favor, selecione um procedimento disponível.");
      goToStep(1);
      return;
    }

    if (!form.date || !form.time) {
      setFormError("Selecione a data e o horário desejado.");
      goToStep(2);
      return;
    }

    if (occupiedSlots.has(form.time)) {
      setFormError(
        "Este horário foi reservado instantes atrás. Por favor, escolha outro horário.",
      );
      goToStep(2);
      return;
    }

    if (!form.clientName.trim()) {
      setFormError("Informe o seu nome completo.");
      return;
    }

    const phoneDigits = form.clientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setFormError("Informe seu WhatsApp completo com DDD.");
      return;
    }

    setSubmitting(true);

    try {
      const depositAmount =
        bookingRules.requireDeposit && bookingRules.depositPercent
          ? (selectedService.price * bookingRules.depositPercent) / 100
          : 0;

      const isConfirmedAuto = depositAmount === 0;
      const appointmentStatus = isConfirmedAuto ? "confirmed" : "pending";
      const professionalName = selectedProfessional?.name || "Equipe do Salão";
      const clientFirstName = form.clientName.trim().split(" ")[0] || "Cliente";
      const dateFormatted = formatDateBR(form.date);

      // 1. Gravação no Gestor do Salão (Agenda Inteligente & Dashboard)
      if (salonUserId) {
        try {
          await addDoc(collection(db, "appointments"), {
            userId: salonUserId,
            serviceId: selectedService.id,
            professionalId: form.professionalId || "equipe",
            date: form.date,
            time: form.time,
            duration: selectedService.duration,
            price: selectedService.price,
            depositAmount,
            depositPaid: false,
            status: appointmentStatus,
            origin: "online",
            clientName: form.clientName.trim(),
            clientPhone: form.clientPhone.trim(),
            serviceName: selectedService.name,
            professionalName,
            observations: form.observations.trim(),
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Direct appointment record note:", dbErr);
        }

        // 2. Sincroniza / Cadastra Cliente no Painel de Clientes do Salão
        try {
          const qClient = query(
            collection(db, "clients"),
            where("userId", "==", salonUserId),
            where("phone", "==", form.clientPhone.trim()),
            limit(1),
          );
          const clientSnap = await getDocs(qClient);
          if (clientSnap.empty) {
            await addDoc(collection(db, "clients"), {
              userId: salonUserId,
              name: form.clientName.trim(),
              phone: form.clientPhone.trim(),
              origin: "Agendamento Online",
              visits: 1,
              lastVisit: form.date,
              totalSpent: selectedService.price,
              createdAt: new Date().toISOString(),
            });
          } else {
            const existingDoc = clientSnap.docs[0];
            const currentVisits = Number(existingDoc.data().visits) || 0;
            const currentSpent = Number(existingDoc.data().totalSpent) || 0;
            await updateDoc(doc(db, "clients", existingDoc.id), {
              lastVisit: form.date,
              visits: currentVisits + 1,
              totalSpent: currentSpent + selectedService.price,
            });
          }
        } catch (clientErr) {
          console.warn("Client sync note:", clientErr);
        }
      }

      // 3. Montagem da Mensagem Automática pelo Robô Master BellaMais
      const cleanSalonPhone = (salonPhone || "").replace(/\D/g, "");
      const formattedSalonPhone = cleanSalonPhone.length <= 11 ? `55${cleanSalonPhone}` : cleanSalonPhone;

      let autoWhatsAppMessage =
        `Olá, ${clientFirstName}! 💖 Seu agendamento foi realizado com sucesso!\n\n` +
        `💅 *Serviço:* ${selectedService.name}\n` +
        `📅 *Data:* ${dateFormatted} (${getDayOfWeekName(form.date)}) às ${form.time}\n` +
        (professionalName && !professionalName.toLowerCase().includes("qualquer") && !professionalName.toLowerCase().includes("equipe")
          ? `👩‍🦰 *Profissional:* ${professionalName}\n`
          : "") +
        `📍 *Salão:* ${salonName}\n` +
        (salonAddress ? `🏢 *Endereço:* ${salonAddress}\n` : "");

      if (depositAmount > 0 && bookingRules.pixKey) {
        autoWhatsAppMessage +=
          `\n🔑 *Sinal de Reserva:* R$ ${depositAmount.toFixed(2)}\n` +
          `Chave PIX: ${bookingRules.pixKey}\n`;
      }

      autoWhatsAppMessage +=
        `\n──────────────────────\n` +
        `🤖 *Mensagem automática de confirmação.*\n` +
        `💬 *Dúvidas ou atendimento com o salão:*\n` +
        (salonPhone ? `Fale direto pelo WhatsApp: *${salonPhone}*\n👉 wa.me/${formattedSalonPhone}\n` : `Fale direto com a equipe do salão: *${salonName}*\n`) +
        `──────────────────────\n` +
        `Agradecemos pela preferência!`;

      // 4. Disparo Automático pelo WhatsApp para a Cliente
      try {
        fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toPhone: form.clientPhone,
            messageText: autoWhatsAppMessage,
            salonUserId: salonUserId,
          }),
        }).catch((err) => console.warn("Auto WhatsApp send background note:", err));
      } catch (waErr) {
        console.warn("Auto WhatsApp send trigger note:", waErr);
      }

      // 5. Alerta Automático para o WhatsApp da Proprietária do Salão
      if (salonPhone) {
        try {
          const salonAlertMsg =
            `🔔 *Novo Agendamento Confirmado no ${salonName}!* ✨\n\n` +
            `• *Cliente:* ${form.clientName}\n` +
            `• *WhatsApp:* ${form.clientPhone}\n` +
            `• *Procedimento:* ${selectedService.name}\n` +
            `• *Data:* ${dateFormatted} às *${form.time}*\n` +
            `• *Profissional:* ${professionalName}\n` +
            `• *Valor:* R$ ${selectedService.price.toFixed(2)}\n\n` +
            `O horário já foi lançado e garantido na sua Agenda!`;

          fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toPhone: salonPhone,
              messageText: salonAlertMsg,
              salonUserId: salonUserId,
            }),
          }).catch((err) => console.warn("Salon alert background note:", err));
        } catch (alertErr) {
          console.warn("Salon alert trigger note:", alertErr);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("bellamais_client_phone", form.clientPhone);
        localStorage.setItem("bellamais_client_name", form.clientName);
      }
      setClientPhoneSaved(form.clientPhone);

      soundEffects.playSparkle();

      setSubmittedData({
        clientName: form.clientName,
        serviceName: selectedService.name,
        professionalName,
        date: form.date,
        time: form.time,
        price: selectedService.price,
        duration: selectedService.duration,
        depositAmount,
        clientPhone: form.clientPhone,
      });
    } catch (err) {
      console.error(err);
      setFormError("Erro ao processar reserva. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const cleanSalonPhone = salonPhone.replace(/\D/g, "");
  const waTarget =
    cleanSalonPhone.length >= 10
      ? cleanSalonPhone.length <= 11
        ? `55${cleanSalonPhone}`
        : cleanSalonPhone
      : "";

  // TELA DE SUCESSO / COMPROVANTE DIGITAL COM SUPORTE LIGHT & DARK
  if (submittedData) {
    const waMsg = encodeURIComponent(
      `Olá! Reservei meu horário no *${salonName}*:\n\n` +
        `• *Cliente:* ${submittedData.clientName}\n` +
        `• *Procedimento:* ${submittedData.serviceName}\n` +
        `• *Data:* ${formatDateBR(submittedData.date)} às *${submittedData.time}*\n` +
        `• *Valor:* R$ ${submittedData.price.toFixed(2)}\n\n` +
        `Agradeço e aguardo a confirmação! ✨`,
    );

    return (
      <div className="bookingPage min-h-screen bg-[#faf8f7] dark:bg-[#0d0f17] text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden font-sans">
        {/* Auras sutis de iluminação em modo escuro */}
        <div className="hidden dark:block absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="hidden dark:block absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white dark:bg-[#161922] rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 max-w-lg w-full text-center border border-stone-200/80 dark:border-zinc-700/60 space-y-5 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold mb-2">
              <Sparkles size={13} /> Horário Reservado!
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">
              Agendamento Confirmado!
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
              Sua solicitação no <strong>{salonName}</strong> foi registrada com sucesso.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-300 font-medium">Procedimento:</span>
              <strong className="text-zinc-900 dark:text-white">
                {submittedData.serviceName}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-300 font-medium">Profissional:</span>
              <strong className="text-zinc-900 dark:text-white">
                {submittedData.professionalName}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-zinc-300 font-medium">Data e Horário:</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 font-bold">
                {formatDateBR(submittedData.date)} às {submittedData.time}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-200/80 dark:border-zinc-700/60">
              <span className="text-zinc-500 dark:text-zinc-300 font-medium">Valor Total:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-base font-extrabold">
                R$ {submittedData.price.toFixed(2)}
              </strong>
            </div>
          </div>

          {submittedData.depositAmount > 0 && bookingRules.pixKey && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-left space-y-2">
              <strong className="text-amber-900 dark:text-amber-300 block">
                Sinal de Reserva: R$ {submittedData.depositAmount.toFixed(2)}
              </strong>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={bookingRules.pixKey}
                  className="flex-1 p-2 bg-white dark:bg-zinc-800/80 rounded-lg border border-amber-200 dark:border-amber-800 font-mono text-[11px] text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(bookingRules.pixKey || "");
                    soundEffects.playSuccess();
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                >
                  {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirmação enviada no WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">
              Mensagem de confirmação enviada com sucesso para o seu WhatsApp!
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {waTarget && (
              <a
                href={`https://wa.me/${waTarget}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEffects.playClick()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1ea952] hover:brightness-105 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(37,211,102,0.35)] transition cursor-pointer"
              >
                <MessageCircle size={18} />
                Abrir Conversa com o Salão no WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setSubmittedData(null);
                setForm((prev) => ({ ...prev, time: "", serviceId: "" }));
                goToStep(1);
              }}
              className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline block mx-auto pt-2 cursor-pointer"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bookingPage min-h-screen bg-[#faf8f7] dark:bg-[#0d0f17] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200 relative overflow-hidden">
      {/* Auras Sutis de Fundo: Profundidade sem poluição visual */}
      <div className="hidden dark:block absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="hidden dark:block absolute top-1/3 -right-40 w-[450px] h-[450px] bg-gradient-to-bl from-indigo-500/8 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 1. HEADER LIMPO E ELEGANTE */}
      <header className="bg-white/95 dark:bg-[#12141c]/90 dark:backdrop-blur-md border-b border-stone-200/80 dark:border-zinc-800 sticky top-0 z-40 shadow-xs dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo e Identificação do Salão */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#fff0f5] dark:bg-rose-500/15 border border-rose-200/70 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 dark:shadow-[0_0_15px_rgba(244,63,94,0.2)] shrink-0">
              <Scissors size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white leading-none truncate font-sans">
                {salonName}
              </h1>
              {salonAddress ? (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-300 flex items-center gap-1 mt-1 truncate max-w-[280px]">
                  <MapPin size={11} className="text-rose-500 dark:text-rose-400 shrink-0" />
                  {salonAddress}
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-300 block mt-1">
                  Atendimento com horário marcado
                </span>
              )}
            </div>
          </div>

          {/* Ações: Adaptador de Tema Light/Dark, Meus Agendamentos, WhatsApp */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Adaptador Light / Dark */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-stone-200 dark:border-zinc-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
              aria-label="Alternar tema claro/escuro"
            >
              {isDark ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-zinc-600" />
              )}
            </button>

            {/* Consulta rápida de agendamentos */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                setShowLookupModal(true);
                if (clientPhoneSaved) {
                  fetchClientAppointments(clientPhoneSaved);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-stone-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs"
            >
              <Search size={14} className="text-rose-500 dark:text-rose-400" />
              <span className="hidden sm:inline">Meus Agendamentos</span>
              <span className="sm:hidden">Meus Horários</span>
            </button>

            {/* Link Direto WhatsApp */}
            {waTarget && (
              <a
                href={`https://wa.me/${waTarget}?text=${encodeURIComponent(
                  `Olá! Gostaria de tirar uma dúvida sobre procedimentos e horários no ${salonName}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEffects.playClick()}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition shadow-[0_2px_10px_rgba(37,211,102,0.3)]"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 2. BARRA DE PROGRESSO DOS PASSOS (STEPPER RESPONSIVO & INTUITIVO) */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-5 pb-2 relative z-10">
        <div className="bg-white/90 dark:bg-[#161922]/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-stone-200/80 dark:border-zinc-800 shadow-xs dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between relative">
            {/* Linha conectora de progresso */}
            <div className="absolute left-[14%] right-[14%] top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 dark:bg-zinc-800 -z-0">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                style={{
                  width:
                    currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                }}
              />
            </div>

            {/* Passo 1: Procedimento */}
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 relative z-10 group cursor-pointer"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all shadow-xs ${
                  currentStep === 1
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white ring-4 ring-rose-500/20 scale-105"
                    : form.serviceId
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700"
                }`}
              >
                {form.serviceId && currentStep !== 1 ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  "1"
                )}
              </div>
              <div className="text-center sm:text-left">
                <span
                  className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                    currentStep === 1
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Procedimento
                </span>
                <span className="hidden sm:block text-[10px] text-zinc-500 dark:text-zinc-300">
                  {selectedService ? selectedService.name : "Escolha o serviço"}
                </span>
              </div>
            </button>

            {/* Passo 2: Data & Horário */}
            <button
              type="button"
              onClick={() => {
                if (form.serviceId) goToStep(2);
              }}
              disabled={!form.serviceId}
              className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 relative z-10 group ${
                !form.serviceId ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all shadow-xs ${
                  currentStep === 2
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white ring-4 ring-rose-500/20 scale-105"
                    : form.time
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700"
                }`}
              >
                {form.time && currentStep > 2 ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  "2"
                )}
              </div>
              <div className="text-center sm:text-left">
                <span
                  className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                    currentStep === 2
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Data & Horário
                </span>
                <span className="hidden sm:block text-[10px] text-zinc-500 dark:text-zinc-300">
                  {form.time
                    ? `${formatDateBR(form.date)} às ${form.time}`
                    : "Selecione o horário"}
                </span>
              </div>
            </button>

            {/* Passo 3: Confirmação & Seus Dados */}
            <button
              type="button"
              onClick={() => {
                if (form.serviceId && form.time) goToStep(3);
              }}
              disabled={!form.serviceId || !form.time}
              className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 relative z-10 group ${
                !form.serviceId || !form.time
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all shadow-xs ${
                  currentStep === 3
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white ring-4 ring-rose-500/20 scale-105"
                    : "bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700"
                }`}
              >
                3
              </div>
              <div className="text-center sm:text-left">
                <span
                  className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                    currentStep === 3
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Confirmação
                </span>
                <span className="hidden sm:block text-[10px] text-zinc-500 dark:text-zinc-300">
                  Seus dados & Reserva
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. FLUXO PRINCIPAL: WIZARD PASSO A PASSO GUIADO */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-5 pb-32 sm:pb-16 relative z-10">
        <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs">
              <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 1: ESCOLHA DO PROCEDIMENTO                             */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80 dark:border-zinc-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    1. Escolha o Procedimento
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">
                    Selecione o serviço que deseja realizar no salão.
                  </p>
                </div>

                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-3 py-1.5 rounded-full w-fit">
                  {filteredServices.length} {filteredServices.length === 1 ? "disponível" : "disponíveis"}
                </span>
              </div>

              {/* Categorias Reais */}
              {categories.length > 2 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        soundEffects.playPop();
                        setSelectedCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[0_2px_10px_rgba(244,63,94,0.35)]"
                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-stone-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de Procedimentos */}
              {loadingServices ? (
                <div className="py-16 text-center space-y-3 bg-white dark:bg-[#161922] rounded-3xl border border-stone-200/80 dark:border-zinc-800">
                  <Loader2 size={28} className="animate-spin text-rose-500 dark:text-rose-400 mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-300">
                    Carregando procedimentos do salão...
                  </p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-stone-200 dark:border-zinc-700/80 bg-white dark:bg-[#161922] space-y-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                    <Scissors size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      Nenhum procedimento encontrado
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed">
                      Não há procedimentos com agendamento online nesta categoria.
                    </p>
                  </div>
                  {waTarget && (
                    <a
                      href={`https://wa.me/${waTarget}?text=${encodeURIComponent(
                        `Olá! Gostaria de consultar os procedimentos e valores disponíveis no ${salonName}.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1ea952] hover:brightness-105 text-white text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <MessageCircle size={16} />
                      Consultar no WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredServices.map((s) => {
                    const isSelected = form.serviceId === s.id;
                    const SrvIcon = getCategoryIcon(s.name);

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          soundEffects.playClick();
                          setForm((f) => ({ ...f, serviceId: s.id }));
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                          isSelected
                            ? "border-rose-500 dark:border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 shadow-[0_4px_20px_rgba(244,63,94,0.25)] scale-[1.01]"
                            : "border-stone-200/80 dark:border-zinc-700/60 bg-white dark:bg-[#161922] hover:border-rose-400 dark:hover:border-rose-400/70 hover:bg-rose-50/30 dark:hover:bg-zinc-800/80 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs"
                                : "bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-stone-200/60 dark:border-zinc-700"
                            }`}
                          >
                            <SrvIcon size={20} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white block truncate">
                              {s.name}
                            </span>
                            {s.description && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                {s.description}
                              </p>
                            )}
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1 font-medium">
                              <Clock size={12} className="text-rose-500 dark:text-rose-400" />
                              {formatDuration(s.duration)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                            R$ {s.price.toFixed(2)}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-rose-500 border-rose-500 text-white shadow-xs"
                                : "border-stone-300 dark:border-zinc-600 bg-stone-50 dark:bg-zinc-800"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Barra de Ação Desktop do Passo 1 */}
              <div className="hidden sm:flex items-center justify-between p-4 bg-white dark:bg-[#161922] rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xs">
                <div>
                  {selectedService ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Selecionado:</span>
                      <strong className="text-sm text-zinc-900 dark:text-white">
                        {selectedService.name}
                      </strong>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                        R$ {selectedService.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Selecione um procedimento acima para prosseguir.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!form.serviceId}
                  onClick={() => goToStep(2)}
                  className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
                    form.serviceId
                      ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35)] active:scale-95"
                      : "bg-stone-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300 cursor-not-allowed"
                  }`}
                >
                  <span>Continuar para Horários</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 2: DATA & HORÁRIO                                      */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Topo do Passo 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-zinc-800">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer mb-1"
                  >
                    <ChevronLeft size={14} /> Voltar para Procedimentos
                  </button>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    2. Selecione a Data e Horário
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                    Escolha o dia ideal e o horário de sua preferência.
                  </p>
                </div>

                {/* Resumo compacto do procedimento escolhido */}
                {selectedService && (
                  <div className="p-3 sm:px-4 rounded-2xl bg-white dark:bg-[#161922] border border-stone-200/80 dark:border-zinc-800 flex items-center justify-between sm:justify-start gap-4 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-300 uppercase tracking-wider font-bold block">
                        Procedimento
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                        {selectedService.name}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                        R$ {selectedService.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-[10px] text-rose-500 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Alterar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grade 2 Colunas: Calendário (Esq) + Horários (Dir) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Coluna Calendário */}
                <div className="lg:col-span-7 bg-white dark:bg-[#161922] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800 shadow-xs dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={18} className="text-rose-500 dark:text-rose-400" />
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        Selecione o Dia
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-3 py-1 rounded-full">
                      {formatDateBR(form.date)}
                    </span>
                  </div>

                  {/* Mês Navegação */}
                  <div className="flex items-center justify-between pb-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-zinc-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center justify-center cursor-pointer shadow-2xs"
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white capitalize tracking-wide">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-zinc-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center justify-center cursor-pointer shadow-2xs"
                      aria-label="Próximo mês"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Dias da Semana */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {WEEK_DAYS.map((d) => (
                      <span key={d} className="py-1">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Grade de Dias do Mês */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                    {calendarDays.map((cd, idx) => {
                      if (!cd.isCurrentMonth) {
                        return <div key={idx} className="h-10 w-10 sm:h-11 sm:w-11 mx-auto" />;
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={cd.isPast}
                          onClick={() => {
                            soundEffects.playClick();
                            setForm((f) => ({
                              ...f,
                              date: cd.dateStr,
                              time: "",
                            }));
                          }}
                          className={`h-10 w-10 sm:h-11 sm:w-11 mx-auto rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center transition cursor-pointer ${
                            cd.isSelected
                              ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-[0_4px_16px_rgba(244,63,94,0.5)] scale-105"
                              : cd.isPast
                                ? "text-zinc-400/40 dark:text-zinc-600/50 line-through cursor-not-allowed opacity-30"
                                : "text-zinc-800 dark:text-zinc-100 font-bold bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/80 dark:border-zinc-700/60 hover:border-rose-400 dark:hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 shadow-2xs"
                          }`}
                        >
                          {cd.dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Coluna Horários */}
                <div className="lg:col-span-5 bg-white dark:bg-[#161922] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800 shadow-xs dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-rose-500 dark:text-rose-400" />
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        Horários Livres
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {getDayOfWeekName(form.date)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Toque em um horário disponível para reservar:
                  </p>

                  {/* Grade de Horários */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {TIME_SLOTS.map((slot) => {
                      const isOccupied = occupiedSlots.has(slot);
                      const isSelected = form.time === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => {
                            soundEffects.playClick();
                            setForm((f) => ({ ...f, time: slot }));
                          }}
                          className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition text-center cursor-pointer border ${
                            isOccupied
                              ? "bg-stone-100 dark:bg-zinc-900/40 border-transparent text-zinc-400 dark:text-zinc-600 line-through cursor-not-allowed opacity-30"
                              : isSelected
                                ? "bg-gradient-to-r from-rose-500 to-pink-500 border-transparent text-white font-black shadow-[0_2px_12px_rgba(244,63,94,0.45)] scale-105"
                                : "bg-white dark:bg-zinc-800/80 border border-stone-200/80 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-100 hover:border-rose-400 dark:hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 shadow-2xs"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumo do Horário Selecionado */}
                  <div className="pt-2">
                    {form.time ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span className="font-semibold">Horário selecionado:</span>
                        <strong className="font-black text-sm">{form.time}</strong>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                        Nenhum horário selecionado ainda
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Ação Desktop do Passo 2 */}
              <div className="hidden sm:flex items-center justify-between p-4 bg-white dark:bg-[#161922] rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Voltar para Procedimentos</span>
                </button>

                <button
                  type="button"
                  disabled={!form.time}
                  onClick={() => goToStep(3)}
                  className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
                    form.time
                      ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35)] active:scale-95"
                      : "bg-stone-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300 cursor-not-allowed"
                  }`}
                >
                  <span>Continuar para Confirmação</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 3: SEUS DADOS & CONFIRMAÇÃO                            */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Topo do Passo 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-zinc-800">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer mb-1"
                  >
                    <ChevronLeft size={14} /> Voltar para Horários
                  </button>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    3. Finalize seu Agendamento
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                    Confira os detalhes e preencha seus dados de contato.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 w-fit">
                  <ShieldCheck size={14} /> Agendamento Seguro
                </span>
              </div>

              {/* Grade 2 Colunas: Voucher de Resumo (Esq) + Formulário do Cliente (Dir) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Voucher de Resumo da Reserva */}
                <div className="lg:col-span-5 bg-white dark:bg-[#161922] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800 shadow-xs dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-rose-500 dark:text-rose-400" />
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        Resumo da Reserva
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-1 rounded-full">
                      {salonName}
                    </span>
                  </div>

                  {selectedService && (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-300 uppercase tracking-wider font-bold block">
                            Procedimento
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white text-base">
                            {selectedService.name}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-rose-500" />
                            {formatDuration(selectedService.duration)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="text-xs text-rose-500 dark:text-rose-400 hover:underline font-bold cursor-pointer shrink-0"
                        >
                          Alterar
                        </button>
                      </div>

                      <div className="pt-3 border-t border-stone-200/80 dark:border-zinc-700/60 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 dark:text-zinc-400">Data marcada:</span>
                          <strong className="text-zinc-900 dark:text-white">
                            {formatDateBR(form.date)} ({getDayOfWeekName(form.date)})
                          </strong>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 dark:text-zinc-400">Horário:</span>
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 font-extrabold text-xs">
                            {form.time}
                          </span>
                        </div>

                        {selectedProfessional && (
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 dark:text-zinc-400">Profissional:</span>
                            <strong className="text-zinc-900 dark:text-white">
                              {selectedProfessional.name}
                            </strong>
                          </div>
                        )}

                        {salonAddress && (
                          <div className="flex justify-between items-start gap-2 pt-1">
                            <span className="text-zinc-500 dark:text-zinc-400 shrink-0">Local:</span>
                            <span className="text-zinc-800 dark:text-zinc-200 text-right">
                              {salonAddress}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-stone-200/80 dark:border-zinc-700/60 flex justify-between items-center">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Valor Total:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black text-xl">
                          R$ {selectedService.price.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Selos de Benefício */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5">
                    <p className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Horário lançado automaticamente na agenda do salão
                    </p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Comprovante enviado instantaneamente no seu WhatsApp
                    </p>
                  </div>
                </div>

                {/* Formulário do Cliente */}
                <div className="lg:col-span-7 bg-white dark:bg-[#161922] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800 shadow-xs dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-rose-500 dark:text-rose-400" />
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        Seus Dados de Contato
                      </h3>
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-300">
                      * Campos obrigatórios
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Seu Nome Completo *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Ex: Maria Eduarda Silva"
                          value={form.clientName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, clientName: e.target.value }))
                          }
                          className="w-full py-3 sm:py-3.5 pl-10 pr-3 rounded-xl border border-stone-200/80 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/80 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition shadow-2xs"
                        />
                        <User
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 dark:text-rose-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        WhatsApp para Confirmação *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="(00) 90000-0000"
                          value={form.clientPhone}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              clientPhone: formatPhone(e.target.value),
                            }))
                          }
                          maxLength={16}
                          className="w-full py-3 sm:py-3.5 pl-10 pr-3 rounded-xl border border-stone-200/80 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/80 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition shadow-2xs"
                        />
                        <Phone
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 dark:text-rose-400"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Enviaremos o comprovante e os lembretes de atendimento para este número.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Observações ou Preferências (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Primeira vez no salão, prefiro tintura sem amônia..."
                        value={form.observations}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, observations: e.target.value }))
                        }
                        className="w-full p-3 sm:p-3.5 rounded-xl border border-stone-200/80 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/80 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition resize-none shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Botão de Finalização */}
                  <div className="pt-3 space-y-3">
                    <button
                      type="submit"
                      disabled={submitting || !form.serviceId || !form.time}
                      className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-wide transition flex items-center justify-center gap-2.5 border cursor-pointer ${
                        submitting || !form.serviceId || !form.time
                          ? "bg-stone-200 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border-stone-300 dark:border-zinc-700/60 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white border-rose-400/30 shadow-[0_4px_25px_rgba(244,63,94,0.45)] active:scale-[0.99]"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white" />
                          <span className="text-white">Confirmando seu agendamento...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-white font-extrabold">Confirmar Agendamento</span>
                          <CheckCircle2 size={18} className="text-white" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                      ✓ Sem necessidade de login ou senha. Receba seu comprovante em instantes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* 4. BARRA FLUTUANTE INFERIOR EXCLUSIVA MOBILE (1-THUMB NAVIGATION COM SAFE-AREA) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#12141c]/95 backdrop-blur-md border-t border-stone-200 dark:border-zinc-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.15)]">
        {currentStep === 1 && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-300 block truncate">
                {selectedService ? selectedService.name : "Nenhum selecionado"}
              </span>
              <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {selectedService ? `R$ ${selectedService.price.toFixed(2)}` : "Escolha o serviço"}
              </strong>
            </div>
            <button
              type="button"
              disabled={!form.serviceId}
              onClick={() => goToStep(2)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                form.serviceId
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md active:scale-95 cursor-pointer"
                  : "bg-stone-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300 cursor-not-allowed"
              }`}
            >
              <span>Continuar</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
            >
              ← Voltar
            </button>
            <div className="min-w-0 text-center flex-1">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-300 block truncate">
                {formatDateBR(form.date)}
              </span>
              <strong className="text-xs font-black text-zinc-900 dark:text-white">
                {form.time ? form.time : "Selecione a hora"}
              </strong>
            </div>
            <button
              type="button"
              disabled={!form.time}
              onClick={() => goToStep(3)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                form.time
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md active:scale-95 cursor-pointer"
                  : "bg-stone-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300 cursor-not-allowed"
              }`}
            >
              <span>Continuar</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="px-3.5 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition shrink-0 cursor-pointer"
            >
              ← Voltar
            </button>
            <button
              type="button"
              disabled={
                submitting ||
                !form.clientName.trim() ||
                form.clientPhone.replace(/\D/g, "").length < 10
              }
              onClick={() => {
                const formEl = document.getElementById("booking-form") as HTMLFormElement;
                if (formEl) formEl.requestSubmit();
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                submitting ||
                !form.clientName.trim() ||
                form.clientPhone.replace(/\D/g, "").length < 10
                  ? "bg-stone-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md active:scale-95"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Agendamento</span>
                  <CheckCircle2 size={15} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL: MEUS AGENDAMENTOS (ACESSO SEM SENHA) */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161922] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200/80 dark:border-zinc-700/60 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-700/50">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-rose-500 dark:text-rose-400" />
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                  Consultar Meus Horários
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLookupModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition border border-transparent dark:border-zinc-700/50"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Informe seu WhatsApp para ver o histórico e status dos seus agendamentos:
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  placeholder="(00) 90000-0000"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(formatPhone(e.target.value))}
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-stone-200/80 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/80 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-rose-500 dark:focus:border-rose-400"
                />
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 dark:text-rose-400"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  fetchClientAppointments(lookupPhone);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:brightness-110 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Buscar
              </button>
            </div>

            <div className="max-h-[260px] overflow-y-auto space-y-2 pt-2">
              {loadingClientAppointments ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-300 text-center py-4 animate-pulse">
                  Localizando...
                </p>
              ) : clientAppointments.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-300 text-center py-4">
                  Nenhum agendamento ativo encontrado para este número.
                </p>
              ) : (
                clientAppointments.map((apt) => {
                  const isCancelled = apt.status === "cancelled";
                  return (
                    <div
                      key={apt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        isCancelled
                          ? "bg-stone-50 dark:bg-zinc-900/40 border-stone-200 dark:border-zinc-800 opacity-50"
                          : "bg-white dark:bg-zinc-800/80 border-stone-200/80 dark:border-zinc-700/60"
                      }`}
                    >
                      <div>
                        <strong className="text-zinc-900 dark:text-white block">
                          {apt.serviceName}
                        </strong>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-300">
                          {formatDateBR(apt.date)} às {apt.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? "bg-stone-200 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                          }`}
                        >
                          {isCancelled ? "Cancelado" : "Reservado"}
                        </span>

                        {!isCancelled && apt.id && (
                          <button
                            type="button"
                            disabled={cancellingId === apt.id}
                            onClick={() => handleCancelAppointment(apt.id!)}
                            className="text-[11px] text-red-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            {cancellingId === apt.id ? "..." : "Cancelar"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER DISCRETO */}
      <footer className="border-t border-stone-200/80 dark:border-zinc-800 mt-12 py-8 bg-white dark:bg-[#12141c] text-center text-xs text-zinc-500 dark:text-zinc-300 transition-colors duration-200 relative z-10 font-sans">
        <div className="max-w-[1320px] mx-auto px-4 space-y-2">
          <p className="font-bold text-sm text-zinc-900 dark:text-white font-sans">
            {salonName}
          </p>
          {salonPhone && <p>Atendimento: {salonPhone}</p>}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-400 pt-2">
            © {new Date().getFullYear()} {salonName} • Agendamento Online BellaMais
          </p>
        </div>
      </footer>
    </div>
  );
}
