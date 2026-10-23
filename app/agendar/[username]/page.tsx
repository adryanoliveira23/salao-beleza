"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "firebase/firestore";
import {
  Scissors,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  bufferTime?: number;
  price: number;
  category: string;
  onlineBookingEnabled?: boolean;
  enabledProfessionals?: string[];
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface ExistingAppointment {
  date: string;
  time: string;
  duration: number;
  professionalId?: string;
  status?: string;
}

const SLOT_START = 8;
const SLOT_END = 19;
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

export default function AgendarPage() {
  const params = useParams();
  const username = params?.username as string;

  const [salonUserId, setSalonUserId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState<string>("");
  const [salonAddress, setSalonAddress] = useState<string>("");
  const [salonPhone, setSalonPhone] = useState<string>("");
  const [bookingRules, setBookingRules] = useState<{
    requireDeposit?: boolean;
    depositPercent?: number;
    pixKey?: string;
    cancellationPolicyText?: string;
  }>({});
  const [loadingSalon, setLoadingSalon] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<
    ExistingAppointment[]
  >([]);

  const [submittedData, setSubmittedData] = useState<{
    clientName: string;
    serviceName: string;
    professionalName: string;
    date: string;
    time: string;
    price: number;
    depositAmount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [copiedPix, setCopiedPix] = useState(false);

  const today = useMemo(() => new Date(), []);
  const minDateStr = today.toISOString().split("T")[0];

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceId: "",
    professionalId: "",
    date: minDateStr,
    time: "",
    observations: "",
    marketingConsent: true,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // 1. Load Salon Profile by Username
  useEffect(() => {
    async function fetchSalonUser() {
      if (!username) return;
      setLoadingSalon(true);
      try {
        const q = query(
          collection(db, "profiles"),
          where("username", "==", username),
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          setSalonUserId(docSnap.id);
          setSalonName(data.salon_name || "Espaço de Beleza");
          setSalonAddress(data.address || "");
          setSalonPhone(data.phone || "");
          setBookingRules(data.bookingRules || {});
        } else {
          setError("Salão não encontrado.");
        }
      } catch (e) {
        console.error("Error fetching salon:", e);
        setError("Erro ao carregar salão.");
      }
      setLoadingSalon(false);
    }
    fetchSalonUser();
  }, [username]);

  // 2. Load Services & Professionals
  useEffect(() => {
    if (!salonUserId) return;

    async function fetchData() {
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

        const qProfs = query(
          collection(db, "professionals"),
          where("userId", "==", salonUserId),
        );
        const pSnap = await getDocs(qProfs);
        const pData = pSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Professional, "id">),
        }));
        setProfessionals(pData);
        if (pData.length > 0) {
          setForm((prev) => ({ ...prev, professionalId: pData[0].id }));
        }
      } catch (e) {
        console.error("Error fetching services/professionals:", e);
      }
    }
    fetchData();
  }, [salonUserId]);

  // 3. Load Appointments for Selected Date
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
        const data = snap.docs.map((d) => d.data() as ExistingAppointment);
        setExistingAppointments(data);
      } catch (e) {
        console.error("Error fetching appointments:", e);
      }
    }
    fetchAppointments();
  }, [salonUserId, form.date]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedProfessional = professionals.find(
    (p) => p.id === form.professionalId,
  );

  // Check occupied slots for the selected professional AND service duration
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
        // Filter by selected professional so two clients cannot book the same time for the same professional
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

  const depositRequiredAmount = useMemo(() => {
    if (!selectedService || !bookingRules.requireDeposit) return 0;
    const pct = bookingRules.depositPercent || 30;
    return (selectedService.price * pct) / 100;
  }, [selectedService, bookingRules]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!salonUserId || !selectedService) {
      setError("Selecione um serviço válido.");
      return;
    }

    if (!form.clientName.trim()) {
      setError("Informe seu nome completo.");
      return;
    }

    const phoneDigits = form.clientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }

    if (!form.date || !form.time) {
      setError("Escolha a data e o horário desejado.");
      return;
    }

    if (occupiedSlots.has(form.time)) {
      setError(
        "Este horário acabou de ser reservado por outra cliente. Por favor, escolha outro horário.",
      );
      return;
    }

    try {
      // Double-check in real time on Firestore to prevent race condition
      const qCheck = query(
        collection(db, "appointments"),
        where("userId", "==", salonUserId),
        where("date", "==", form.date),
      );
      const snapCheck = await getDocs(qCheck);
      const newStart = parseTimeToMinutes(form.time);
      const newEnd =
        newStart +
        selectedService.duration +
        (selectedService.bufferTime || 0);

      const hasConflict = snapCheck.docs.some((docItem) => {
        const d = docItem.data();
        if (d.status === "cancelled" || d.status === "no_show") return false;
        if (
          form.professionalId &&
          d.professionalId &&
          d.professionalId !== form.professionalId
        ) {
          return false;
        }
        const aStart = parseTimeToMinutes(d.time);
        const aEnd = aStart + (Number(d.duration) || 45);
        return newStart < aEnd && newEnd > aStart;
      });

      if (hasConflict) {
        setError(
          "Este horário já foi reservado para esta profissional. Selecione outro horário.",
        );
        return;
      }

      // Find or create Client in CRM
      let clientId: string | null = null;
      const qClient = query(
        collection(db, "clients"),
        where("userId", "==", salonUserId),
        where("phone", "==", form.clientPhone),
      );
      const clientSnap = await getDocs(qClient);
      if (!clientSnap.empty) {
        clientId = clientSnap.docs[0].id;
      } else {
        const newClientRef = await addDoc(collection(db, "clients"), {
          userId: salonUserId,
          name: form.clientName,
          phone: form.clientPhone,
          email: form.clientEmail || "",
          visits: 1,
          lastVisit: form.date,
          totalSpent: selectedService.price,
          origin: "Agendamento Online",
          marketingConsent: form.marketingConsent,
          tags: ["Nova"],
        });
        clientId = newClientRef.id;
      }

      await addDoc(collection(db, "appointments"), {
        userId: salonUserId,
        clientId,
        serviceId: selectedService.id,
        professionalId: form.professionalId || "a-definir",
        date: form.date,
        time: form.time,
        duration: selectedService.duration,
        price: selectedService.price,
        depositAmount: depositRequiredAmount,
        depositPaid: false,
        status: "pending",
        origin: "online",
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail,
        serviceName: selectedService.name,
        professionalName: selectedProfessional?.name || "Equipe do Salão",
        observations: form.observations,
        createdAt: new Date().toISOString(),
      });

      setSubmittedData({
        clientName: form.clientName,
        serviceName: selectedService.name,
        professionalName: selectedProfessional?.name || "Equipe do Salão",
        date: form.date,
        time: form.time,
        price: selectedService.price,
        depositAmount: depositRequiredAmount,
      });
    } catch (err) {
      console.error(err);
      setError("Erro ao confirmar agendamento. Tente novamente.");
    }
  };

  if (loadingSalon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6f2]">
        <p className="text-[#b83b6b] font-semibold animate-pulse">
          Carregando agenda online...
        </p>
      </div>
    );
  }

  if (error === "Salão não encontrado.") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6f2] p-4">
        <div className="bg-white rounded-3xl p-8 shadow-md text-center max-w-md">
          <h1 className="text-2xl font-bold font-serif text-[#2d1b2e] mb-2">
            Salão não encontrado
          </h1>
          <p className="text-sm text-[#6e5a65]">
            Verifique o link de agendamento e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  if (submittedData) {
    const cleanSalonPhone = salonPhone.replace(/\D/g, "");
    const waTarget =
      cleanSalonPhone.length >= 10
        ? cleanSalonPhone.length <= 11
          ? `55${cleanSalonPhone}`
          : cleanSalonPhone
        : "";
    const waMsg = encodeURIComponent(
      `Olá! Acabei de reservar meu agendamento online em *${salonName}*:\n• *Cliente:* ${submittedData.clientName}\n• *Serviço:* ${submittedData.serviceName}\n• *Profissional:* ${submittedData.professionalName}\n• *Data:* ${submittedData.date.split("-").reverse().join("/")} às *${submittedData.time}*`,
    );

    return (
      <div className="min-h-screen bg-[#faf6f2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-[#f2e6ea] space-y-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#0ca678]">
            <CheckCircle2 size={34} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-[#2d1b2e]">
              Horário Reservado! ✨
            </h1>
            <p className="text-xs text-[#6e5a65] mt-1">
              Seu agendamento em <strong>{salonName}</strong> foi registrado com
              sucesso.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#faf6f2] text-left text-xs space-y-1.5 border border-[#f2e6ea]">
            <div className="flex justify-between">
              <span className="text-[#6e5a65]">Serviço:</span>
              <strong className="text-[#2d1b2e]">
                {submittedData.serviceName}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6e5a65]">Profissional:</span>
              <strong className="text-[#2d1b2e]">
                {submittedData.professionalName}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6e5a65]">Data e Horário:</span>
              <strong className="text-[#b83b6b]">
                {submittedData.date.split("-").reverse().join("/")} às{" "}
                {submittedData.time}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6e5a65]">Valor Total:</span>
              <strong className="text-[#0ca678]">
                R$ {submittedData.price.toFixed(2)}
              </strong>
            </div>
          </div>

          {submittedData.depositAmount > 0 && bookingRules.pixKey && (
            <div className="p-4 rounded-2xl bg-[#fdf8e7] border border-[#c59b27]/40 text-xs text-left space-y-2">
              <p className="font-bold text-[#2d1b2e]">
                Pagamento de Sinal (R$ {submittedData.depositAmount.toFixed(2)})
              </p>
              <p className="text-[#6e5a65]">
                Copie a chave PIX abaixo para garantir sua reserva antecipada:
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={bookingRules.pixKey}
                  className="flex-1 p-2 rounded-lg bg-white border border-[#c59b27]/30 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(bookingRules.pixKey || "");
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#c59b27] text-white font-bold"
                >
                  {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          <a
            href={`https://wa.me/${waTarget}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#128C7E] transition"
          >
            <MessageCircle size={18} />
            Receber Comprovante / Confirmar pelo WhatsApp
          </a>

          <button
            onClick={() => setSubmittedData(null)}
            className="text-xs font-bold text-[#b83b6b] hover:underline block mx-auto"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#88234b] to-[#b83b6b] text-white py-10 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3 border border-white/20">
          <Scissors size={26} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-serif">
          {salonName}
        </h1>
        {salonAddress && (
          <p className="text-xs text-white/80 mt-1 flex items-center justify-center gap-1">
            <MapPin size={13} /> {salonAddress}
          </p>
        )}
        <p className="text-xs text-[#f3d078] font-semibold mt-2">
          Agendamento Online 24h em Tempo Real
        </p>
      </div>

      <main className="max-w-2xl mx-auto p-4 md:p-6 -mt-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-lg border border-[#f2e6ea] p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* Passo 1 & 2: Serviços, Preços e Duração */}
          <div className="space-y-3">
            <h3 className="font-bold font-serif text-base text-[#2d1b2e]">
              1. Escolha o Serviço
            </h3>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    !selectedCategory
                      ? "bg-[#b83b6b] text-white"
                      : "bg-[#faf6f2] text-[#6e5a65]"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      selectedCategory === cat
                        ? "bg-[#b83b6b] text-white"
                        : "bg-[#faf6f2] text-[#6e5a65]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {filteredServices.map((s) => {
                const isSelected = form.serviceId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setForm((f) => ({ ...f, serviceId: s.id }))}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? "border-[#b83b6b] bg-[#fff0f5]/50"
                        : "border-[#f2e6ea] hover:border-[#b83b6b]/40"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-[#2d1b2e] block">
                        {s.name}
                      </span>
                      <span className="text-xs text-[#6e5a65] flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {s.duration} min{" "}
                        {s.description ? `• ${s.description}` : ""}
                      </span>
                    </div>
                    <span className="font-bold text-sm text-[#0ca678] shrink-0">
                      R$ {s.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Passo 3: Escolher uma Profissional */}
          {professionals.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#f2e6ea]">
              <h3 className="font-bold font-serif text-base text-[#2d1b2e]">
                2. Escolha a Profissional
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {professionals.map((p) => {
                  const isSelected = form.professionalId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, professionalId: p.id, time: "" }))
                      }
                      className={`p-3 rounded-2xl border-2 text-left transition ${
                        isSelected
                          ? "border-[#b83b6b] bg-[#fff0f5]/50"
                          : "border-[#f2e6ea]"
                      }`}
                    >
                      <span className="font-bold text-xs text-[#2d1b2e] block">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-[#6e5a65]">
                        {p.specialty}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Passo 4: Data e Horários Disponíveis em Tempo Real */}
          <div className="space-y-3 pt-4 border-t border-[#f2e6ea]">
            <h3 className="font-bold font-serif text-base text-[#2d1b2e]">
              3. Data e Horário Disponível
            </h3>
            <input
              type="date"
              required
              min={minDateStr}
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value, time: "" }))
              }
              className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
            />

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isOccupied = occupiedSlots.has(slot);
                const isSelected = form.time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isOccupied}
                    onClick={() =>
                      !isOccupied && setForm((f) => ({ ...f, time: slot }))
                    }
                    className={`py-2.5 rounded-xl text-xs font-bold transition ${
                      isOccupied
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                        : isSelected
                          ? "bg-[#b83b6b] text-white shadow-sm"
                          : "bg-[#faf6f2] text-[#2d1b2e] hover:bg-[#fff0f5]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passo 5: Dados da Cliente */}
          <div className="space-y-3 pt-4 border-t border-[#f2e6ea]">
            <h3 className="font-bold font-serif text-base text-[#2d1b2e]">
              4. Seus Dados para Confirmação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Seu nome completo *"
                value={form.clientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientName: e.target.value }))
                }
                className="p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              />
              <input
                type="tel"
                required
                placeholder="WhatsApp (00) 90000-0000 *"
                value={form.clientPhone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    clientPhone: formatPhone(e.target.value),
                  }))
                }
                maxLength={16}
                className="p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              />
            </div>

            <textarea
              rows={2}
              placeholder="Alguma observação ou preferência para seu atendimento? (Opcional)"
              value={form.observations}
              onChange={(e) =>
                setForm((f) => ({ ...f, observations: e.target.value }))
              }
              className="w-full p-3 border border-[#f2e6ea] rounded-xl text-xs outline-none focus:border-[#b83b6b] resize-none"
            />

            {depositRequiredAmount > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#fdf8e7] border border-[#c59b27]/40 text-xs">
                <strong className="text-[#2d1b2e] block">
                  Política de Sinal do Salão:
                </strong>
                <span className="text-[#6e5a65]">
                  Este atendimento solicita um sinal antecipado de{" "}
                  <strong>R$ {depositRequiredAmount.toFixed(2)}</strong> (
                  {bookingRules.depositPercent}%). Os dados para PIX serão
                  exibidos na próxima tela.
                </span>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-[#6e5a65] cursor-pointer">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, marketingConsent: e.target.checked }))
                }
                className="w-4 h-4 accent-[#b83b6b]"
              />
              Autorizo o recebimento de confirmações, lembretes e novidades pelo
              WhatsApp.
            </label>
          </div>

          <button
            type="submit"
            disabled={!form.serviceId || !form.time}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-[#b83b6b] to-[#88234b] text-white font-bold text-sm shadow-lg hover:opacity-95 transition disabled:opacity-50"
          >
            Confirmar Reserva de Horário
          </button>
        </form>
      </main>
    </div>
  );
}
