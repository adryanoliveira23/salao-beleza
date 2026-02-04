"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import {
  useSalonData,
  saveAppointmentToStorage,
} from "@/contexts/SalonDataContext";

const SLOT_START = 8;
const SLOT_END = 18;
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
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) {
    return digits.length === 1 ? `(${digits}` : `(${digits})`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits[2] === "9") {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
}

export default function AgendarPage() {
  const { services, professionals, appointments, refreshFromStorage } =
    useSalonData();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
    hairType: "",
    skinType: "",
    allergies: "",
    observations: "",
  });

  const CATEGORIES = ["Cabelo", "Unhas", "Estética", "Outros"] as const;
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter((s) => {
      const cat = (s.category || "").toLowerCase();
      const sel = selectedCategory.toLowerCase();
      return (
        cat === sel ||
        ((sel === "unhas" || sel === "unha") &&
          (cat === "unhas" || cat === "unha"))
      );
    });
  }, [services, selectedCategory]);

  useEffect(() => {
    if (
      form.serviceId &&
      !filteredServices.some((s) => s.id === form.serviceId)
    ) {
      setForm((f) => ({ ...f, serviceId: "" }));
    }
  }, [filteredServices, form.serviceId]);

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedProfessional = professionals.find(
    (p) => p.id === form.professionalId,
  );

  const occupiedSlots = useMemo(() => {
    const occupied = new Set<string>();
    for (const apt of appointments) {
      if (apt.date !== form.date) continue;
      const startMin = parseTimeToMinutes(apt.time);
      const endMin = startMin + apt.duration;
      for (const slot of TIME_SLOTS) {
        const slotMin = parseTimeToMinutes(slot);
        if (slotMin >= startMin && slotMin < endMin) {
          occupied.add(slot);
        }
      }
    }
    return occupied;
  }, [appointments, form.date]);

  const selectedDateObj = useMemo(() => {
    if (!form.date) return null;
    const [y, m, d] = form.date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [form.date]);

  const isToday = useMemo(() => {
    if (!selectedDateObj) return false;
    return (
      selectedDateObj.getDate() === today.getDate() &&
      selectedDateObj.getMonth() === today.getMonth() &&
      selectedDateObj.getFullYear() === today.getFullYear()
    );
  }, [selectedDateObj, today]);

  const isTomorrow = useMemo(() => {
    if (!selectedDateObj) return false;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      selectedDateObj.getDate() === tomorrow.getDate() &&
      selectedDateObj.getMonth() === tomorrow.getMonth() &&
      selectedDateObj.getFullYear() === tomorrow.getFullYear()
    );
  }, [selectedDateObj, today]);

  const dateLabel = useMemo(() => {
    if (!selectedDateObj) return "";
    const weekday = selectedDateObj.toLocaleDateString("pt-BR", {
      weekday: "long",
    });
    const dayMonth = selectedDateObj.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    });
    if (isToday) return `Hoje - ${weekday}, ${dayMonth}`;
    if (isTomorrow) return `Amanhã - ${weekday}, ${dayMonth}`;
    return `${weekday}, ${dayMonth}`;
  }, [selectedDateObj, isToday, isTomorrow]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.clientName?.trim()) {
      setError("Preencha seu nome.");
      return;
    }

    const phoneDigits = form.clientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Preencha o WhatsApp com um número válido (DDD + número).");
      return;
    }

    if (!form.serviceId) {
      setError("Selecione o serviço.");
      return;
    }

    if (!form.date || !form.time) {
      setError("Selecione a data e o horário.");
      return;
    }

    if (!selectedService) {
      setError("Dados inválidos. Tente novamente.");
      return;
    }

    const professionalId = form.professionalId || "a-definir";
    const professionalName = selectedProfessional?.name || "A definir";

    if (professionals.length > 0 && !form.professionalId) {
      setError("Selecione o profissional.");
      return;
    }

    try {
      saveAppointmentToStorage({
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || "não informado",
        serviceId: form.serviceId,
        serviceName: selectedService.name,
        professionalId,
        professionalName,
        date: form.date,
        time: form.time,
        duration: selectedService.duration,
        price: selectedService.price,
        status: "pending",
        hairType: form.hairType || undefined,
        skinType: form.skinType || undefined,
        allergies: form.allergies || undefined,
        observations: form.observations || undefined,
      });
      refreshFromStorage();
      setSubmitted(true);
      setForm({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        serviceId: "",
        professionalId: "",
        date: minDateStr,
        time: "",
        hairType: "",
        skinType: "",
        allergies: "",
        observations: "",
      });
    } catch (err) {
      setError("Erro ao salvar. Tente novamente.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6 text-[#059669] text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-[#2d1b2e] mb-2 [font-family:var(--font-outfit)]">
            Agendamento realizado!
          </h1>
          <p className="text-[#666] mb-6">
            Seu agendamento foi enviado com sucesso. O salão entrará em contato
            para confirmar.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff]">
      <main className="max-w-2xl mx-auto p-4 md:p-8 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2d1b2e] mb-2 text-center [font-family:var(--font-outfit)]">
          Agende seu horário
        </h1>
        <p className="text-[#666] text-center mb-8 [font-family:var(--font-outfit)]">
          Preencha o formulário abaixo para agendar seu atendimento.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Bloco 1 – Data e dia da semana */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#2d1b2e] text-sm">
              Escolha o dia
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setForm((f) => ({
                    ...f,
                    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                  }));
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isToday
                    ? "bg-[#FF6B9D] text-white shadow-md"
                    : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setForm((f) => ({
                    ...f,
                    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                  }));
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isTomorrow
                    ? "bg-[#FF6B9D] text-white shadow-md"
                    : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
                }`}
              >
                Amanhã
              </button>
            </div>
            <input
              type="date"
              required
              min={minDateStr}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
            />
            {dateLabel && (
              <p className="text-[#FF6B9D] font-semibold text-sm">
                {dateLabel}
              </p>
            )}
          </div>

          {/* Bloco 2 – Horários */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#2d1b2e] text-sm">
              Escolha o horário
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isOccupied = occupiedSlots.has(slot);
                const isSelected = form.time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isOccupied}
                    title={isOccupied ? "Horário indisponível" : undefined}
                    onClick={() =>
                      !isOccupied && setForm((f) => ({ ...f, time: slot }))
                    }
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isOccupied
                        ? "bg-[#e5e5e5] text-[#9ca3af] cursor-not-allowed line-through border border-[#d4d4d4] opacity-75"
                        : isSelected
                          ? "bg-[#FF6B9D] text-white shadow-md"
                          : "bg-[#fafafa] border border-[#f0f0f0] text-[#2d1b2e] hover:border-[#FF6B9D] hover:bg-[#fff0f5]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloco 3 – Categoria e Serviços */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#2d1b2e] text-sm">
              Escolha a categoria
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !selectedCategory
                    ? "bg-[#FF6B9D] text-white shadow-md"
                    : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
                }`}
              >
                Todos
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-[#FF6B9D] text-white shadow-md"
                      : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {services.length === 0 ? (
              <div className="p-6 bg-[#fafafa] rounded-xl border-2 border-dashed border-[#f0f0f0] text-center">
                <p className="text-[#666] text-sm font-medium">
                  O salão ainda não configurou os serviços.
                </p>
                <p className="text-[#999] text-xs mt-1">
                  Entre em contato para agendar seu horário.
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <p className="text-[#999] text-sm py-2">
                Nenhum serviço nesta categoria. Selecione outra ou
                &quot;Todos&quot;.
              </p>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setServiceDropdownOpen((o) => !o)}
                  className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm text-left focus:outline-none focus:border-[#FF6B9D] bg-white flex items-center justify-between"
                >
                  <span
                    className={
                      form.serviceId ? "text-[#2d1b2e]" : "text-[#999]"
                    }
                  >
                    {form.serviceId
                      ? `${filteredServices.find((s) => s.id === form.serviceId)?.name} (${filteredServices.find((s) => s.id === form.serviceId)?.duration} min)`
                      : "Selecione o serviço"}
                  </span>
                  <span className="text-[#666]">▼</span>
                </button>
                {serviceDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setServiceDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 border-2 border-[#f0f0f0] rounded-xl bg-white shadow-lg z-20 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {filteredServices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, serviceId: s.id }));
                            setServiceDropdownOpen(false);
                          }}
                          className={`w-full p-3 text-left text-sm hover:bg-[#fff0f5] transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            form.serviceId === s.id
                              ? "bg-[#fff0f5] text-[#FF6B9D] font-medium"
                              : "text-[#2d1b2e]"
                          }`}
                        >
                          {s.name} ({s.duration} min)
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bloco 4 – Contatos */}
          <div className="space-y-4 border-t border-[#f0f0f0] pt-5">
            <h3 className="font-semibold text-[#2d1b2e] text-sm">Seus dados</h3>

            <div>
              <label className="block font-semibold text-[#2d1b2e] text-sm mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={form.clientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientName: e.target.value }))
                }
                className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2d1b2e] text-sm mb-1">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={form.clientPhone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    clientPhone: formatPhone(e.target.value),
                  }))
                }
                className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
                placeholder="(00) 00000-0000"
                maxLength={16}
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2d1b2e] text-sm mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientEmail: e.target.value }))
                }
                className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
                placeholder="seu@email.com"
              />
            </div>

            {professionals.length > 0 && (
              <div>
                <label className="block font-semibold text-[#2d1b2e] text-sm mb-1">
                  Profissional *
                </label>
                <select
                  required
                  value={form.professionalId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, professionalId: e.target.value }))
                  }
                  className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
                >
                  <option value="">Selecione o profissional</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="border-t border-[#f0f0f0] pt-5 mt-6">
              <h3 className="font-semibold text-[#2d1b2e] mb-4">
                Informações para o atendimento
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-[#666] text-sm mb-1">
                    Tipo de cabelo
                  </label>
                  <select
                    value={form.hairType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hairType: e.target.value }))
                    }
                    className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
                  >
                    <option value="">Selecione</option>
                    <option value="liso">Liso</option>
                    <option value="ondulado">Ondulado</option>
                    <option value="cacheado">Cacheado</option>
                    <option value="crespo">Crespo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#666] text-sm mb-1">
                    Tipo de pele
                  </label>
                  <select
                    value={form.skinType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, skinType: e.target.value }))
                    }
                    className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
                  >
                    <option value="">Selecione</option>
                    <option value="normal">Normal</option>
                    <option value="oleosa">Oleosa</option>
                    <option value="seca">Seca</option>
                    <option value="mista">Mista</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#666] text-sm mb-1">
                    Alergias
                  </label>
                  <textarea
                    value={form.allergies}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, allergies: e.target.value }))
                    }
                    rows={2}
                    className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] resize-none"
                    placeholder="Informe se possui alguma alergia a produtos..."
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#666] text-sm mb-1">
                    Observações
                  </label>
                  <textarea
                    value={form.observations}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, observations: e.target.value }))
                    }
                    rows={3}
                    className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] resize-none"
                    placeholder="Alguma informação adicional para o atendimento..."
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={services.length === 0}
            className="w-full mt-6 bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            Confirmar agendamento
          </button>
        </form>
      </main>
    </div>
  );
}
