"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Calendar as CalendarIcon,
  Trash2,
  Clock,
  Lock,
  ListTodo,
  Filter,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Edit2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { CurrencyInput } from "@/components/CurrencyInput";
import {
  useSalonData,
  Appointment,
  AppointmentStatus,
  PaymentMethodType,
} from "@/contexts/SalonDataContext";

function parseTimeToMinutes(t: string): number {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; badgeClass: string; borderClass: string }
> = {
  pending: {
    label: "Aguardando confirmação",
    badgeClass: "bg-amber-100 text-amber-800",
    borderClass: "border-l-amber-500",
  },
  confirmed: {
    label: "Confirmado",
    badgeClass: "bg-blue-100 text-blue-800",
    borderClass: "border-l-blue-500",
  },
  completed: {
    label: "Concluído",
    badgeClass: "bg-emerald-100 text-emerald-800",
    borderClass: "border-l-emerald-500",
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-red-100 text-red-800",
    borderClass: "border-l-red-500",
  },
  no_show: {
    label: "Não compareceu",
    badgeClass: "bg-gray-200 text-gray-800",
    borderClass: "border-l-gray-500",
  },
};

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [filterProfId, setFilterProfId] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [showAptModal, setShowAptModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const {
    appointments,
    professionals,
    clients,
    services,
    scheduleBlocks,
    waitlist,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addScheduleBlock,
    deleteScheduleBlock,
    addWaitlistEntry,
    updateWaitlistEntry,
    deleteWaitlistEntry,
    refreshFromStorage,
  } = useSalonData();

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  const formatDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const selectedDateStr = useMemo(
    () => formatDateStr(selectedDate),
    [selectedDate],
  );

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (filterProfId !== "all" && apt.professionalId !== filterProfId) {
        return false;
      }
      if (filterCategory !== "all") {
        const srv = services.find((s) => s.id === apt.serviceId);
        if ((srv?.category || "") !== filterCategory) return false;
      }
      return true;
    });
  }, [appointments, filterProfId, filterCategory, services]);

  const appointmentsForDate = useMemo(
    () => filteredAppointments.filter((apt) => apt.date === selectedDateStr),
    [filteredAppointments, selectedDateStr],
  );

  const blocksForDate = useMemo(
    () =>
      scheduleBlocks.filter(
        (b) =>
          b.date === selectedDateStr ||
          (b.endDate && b.date <= selectedDateStr && b.endDate >= selectedDateStr),
      ),
    [scheduleBlocks, selectedDateStr],
  );

  const visibleProfessionals = useMemo(() => {
    if (filterProfId === "all") return professionals;
    return professionals.filter((p) => p.id === filterProfId);
  }, [professionals, filterProfId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") newDate.setDate(newDate.getDate() + delta);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + delta * 7);
    else newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  // Week days helper
  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        dateObj: d,
        dateStr: formatDateStr(d),
        label: d.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
        }),
      };
    });
  }, [selectedDate]);

  // Month days helper
  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string }> = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, dateStr: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const str = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr: str });
    }
    return cells;
  }, [selectedDate]);

  const openWhatsAppConfirmation = (apt: Appointment) => {
    const digits = (apt.clientPhone || "").replace(/\D/g, "");
    if (!digits) return;
    const phone = digits.length <= 11 ? `55${digits}` : digits;
    const dateFmt = apt.date.split("-").reverse().join("/");
    const msg = encodeURIComponent(
      `Olá ${apt.clientName}! ✨ Passando para confirmar seu agendamento de *${apt.serviceName}* com *${apt.professionalName}* no dia *${dateFmt}* às *${apt.time}*. Podemos confirmar sua presença?`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <>
      <Header title="Agenda Inteligente" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4 max-w-[1440px] w-full mx-auto">
        {/* Top Action & Filter Bar */}
        <div className="bg-white rounded-3xl p-4 md:p-5 shadow-xs border border-[#f2e6ea] flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            {/* Date Navigation & View Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#faf6f2] p-1 rounded-xl border border-[#f2e6ea]">
                <button
                  onClick={() => changeDate(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#6e5a65] hover:text-[#b83b6b] transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 px-3">
                  <CalendarIcon size={16} className="text-[#b83b6b]" />
                  <span className="font-bold text-sm text-[#2d1b2e] capitalize">
                    {viewMode === "month"
                      ? selectedDate.toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })
                      : selectedDate.toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "long",
                        })}
                  </span>
                </div>
                <button
                  onClick={() => changeDate(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#6e5a65] hover:text-[#b83b6b] transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-2 rounded-xl bg-[#faf6f2] hover:bg-[#fff0f5] text-xs font-bold text-[#88234b] border border-[#f2e6ea] transition"
              >
                Hoje
              </button>

              {/* View Mode Switcher (Diária, Semanal, Mensal) */}
              <div className="flex bg-[#faf6f2] p-1 rounded-xl border border-[#f2e6ea]">
                {(
                  [
                    { id: "day", label: "Diária" },
                    { id: "week", label: "Semanal" },
                    { id: "month", label: "Mensal" },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      viewMode === v.id
                        ? "bg-[#b83b6b] text-white shadow-xs"
                        : "text-[#6e5a65] hover:text-[#2d1b2e]"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
              <button
                onClick={() => setShowWaitlistModal(true)}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-[#fdf8e7] text-[#c59b27] border border-[#c59b27]/30 text-xs font-bold flex items-center gap-1.5 hover:brightness-95 transition"
              >
                <ListTodo size={16} />
                Lista de Espera ({waitlist.filter((w) => w.status === "waiting").length})
              </button>

              <button
                onClick={() => setShowBlockModal(true)}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-[#faf6f2] text-[#6e5a65] border border-[#f2e6ea] text-xs font-bold flex items-center gap-1.5 hover:bg-gray-100 transition"
              >
                <Lock size={16} />
                Bloquear Horário
              </button>

              <button
                onClick={() => {
                  setEditingApt(null);
                  setShowAptModal(true);
                }}
                className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b83b6b] to-[#88234b] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-95 transition cursor-pointer"
              >
                <Plus size={18} />
                Novo Agendamento
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#f2e6ea] text-xs">
            <div className="flex items-center gap-1.5 text-[#6e5a65] font-semibold">
              <Filter size={14} className="text-[#b83b6b]" />
              <span>Filtros:</span>
            </div>

            <select
              value={filterProfId}
              onChange={(e) => setFilterProfId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#faf6f2] border border-[#f2e6ea] text-[#2d1b2e] font-medium outline-none"
            >
              <option value="all">Todas as Profissionais</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.specialty})
                </option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#faf6f2] border border-[#f2e6ea] text-[#2d1b2e] font-medium outline-none"
            >
              <option value="all">Todos os Tipos de Serviço</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Active Blocks Banner */}
            {blocksForDate.length > 0 && (
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {blocksForDate.map((blk) => (
                  <span
                    key={blk.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold"
                  >
                    <Lock size={11} />
                    {blk.professionalName}: {blk.reason.toUpperCase()} (
                    {blk.startTime}-{blk.endTime})
                    <button
                      onClick={() => deleteScheduleBlock(blk.id)}
                      className="hover:text-red-900 ml-1"
                      title="Remover bloqueio"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Calendar Body */}
        <div className="bg-white rounded-3xl shadow-xs border border-[#f2e6ea] overflow-hidden flex-1 flex flex-col min-h-[520px]">
          {/* VIEW 1: DAILY VIEW */}
          {viewMode === "day" && (
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <div className="min-w-[680px] h-full flex flex-col">
                {visibleProfessionals.length > 0 ||
                appointmentsForDate.length > 0 ? (
                  <>
                    <div
                      className="grid bg-[#faf6f2] border-b border-[#f2e6ea] sticky top-0 z-20"
                      style={{
                        gridTemplateColumns: `80px repeat(${Math.max(1, visibleProfessionals.length)}, minmax(180px, 1fr))`,
                      }}
                    >
                      <div className="p-4 border-r border-[#f2e6ea] text-center text-xs font-bold text-[#6e5a65]">
                        Horário
                      </div>
                      {visibleProfessionals.length > 0 ? (
                        visibleProfessionals.map((prof) => (
                          <div
                            key={prof.id}
                            className="p-4 text-center border-r border-[#f2e6ea] border-t-4"
                            style={{ borderTopColor: prof.color }}
                          >
                            <div className="font-bold text-sm text-[#2d1b2e]">
                              {prof.name}
                            </div>
                            <div className="text-xs text-[#6e5a65]">
                              {prof.specialty}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center border-t-4 border-t-[#b83b6b]">
                          <div className="font-bold text-sm text-[#2d1b2e]">
                            Agenda Geral
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="divide-y divide-[#f2e6ea]">
                      {Array.from({ length: 13 }, (_, idx) => {
                        const hour = idx + 8; // 08:00 to 20:00
                        const hourPrefix = `${String(hour).padStart(2, "0")}:`;
                        const cols =
                          visibleProfessionals.length > 0
                            ? visibleProfessionals
                            : [
                                {
                                  id: "default",
                                  name: "Salão",
                                  specialty: "",
                                  color: "#b83b6b",
                                },
                              ];

                        return (
                          <div
                            key={hour}
                            className="grid min-h-[88px]"
                            style={{
                              gridTemplateColumns: `80px repeat(${cols.length}, minmax(180px, 1fr))`,
                            }}
                          >
                            <div className="p-3 font-bold text-xs text-[#6e5a65] bg-[#faf6f2]/50 border-r border-[#f2e6ea] flex items-start justify-center">
                              {String(hour).padStart(2, "0")}:00
                            </div>

                            {cols.map((prof) => {
                              const slotApts = appointmentsForDate.filter(
                                (apt) => {
                                  const matchProf =
                                    prof.id === "default" ||
                                    apt.professionalId === prof.id ||
                                    (!apt.professionalId &&
                                      prof.id === cols[0].id);
                                  return (
                                    matchProf &&
                                    (apt.time.startsWith(hourPrefix) ||
                                      apt.time.startsWith(`${hour}:`))
                                  );
                                },
                              );

                              const slotBlocks = blocksForDate.filter(
                                (b) =>
                                  (b.professionalId === "all" ||
                                    b.professionalId === prof.id) &&
                                  parseTimeToMinutes(b.startTime) <=
                                    hour * 60 &&
                                  parseTimeToMinutes(b.endTime) > hour * 60,
                              );

                              return (
                                <div
                                  key={prof.id}
                                  className="p-1.5 border-r border-[#f2e6ea] relative flex flex-col gap-1.5"
                                >
                                  {slotBlocks.map((blk) => (
                                    <div
                                      key={blk.id}
                                      className="p-2 rounded-xl bg-gray-100 border border-dashed border-gray-300 text-xs text-gray-600 flex items-center justify-between"
                                    >
                                      <span className="font-semibold flex items-center gap-1">
                                        <Lock size={12} />{" "}
                                        {blk.reason.toUpperCase()}{" "}
                                        {blk.notes ? `- ${blk.notes}` : ""}
                                      </span>
                                    </div>
                                  ))}

                                  {slotApts.map((apt) => {
                                    const st =
                                      STATUS_CONFIG[apt.status] ||
                                      STATUS_CONFIG.pending;
                                    return (
                                      <div
                                        key={apt.id}
                                        onClick={() => {
                                          setEditingApt(apt);
                                          setShowAptModal(true);
                                        }}
                                        className={`p-2.5 rounded-xl border-l-4 ${st.borderClass} bg-[#fffcf9] border border-[#f2e6ea] shadow-2xs hover:shadow-md cursor-pointer transition flex flex-col justify-between gap-1`}
                                      >
                                        <div className="flex items-start justify-between gap-1">
                                          <div>
                                            <span className="font-bold text-xs text-[#2d1b2e] block">
                                              {apt.time} • {apt.clientName}
                                            </span>
                                            <span className="text-[11px] text-[#6e5a65] block">
                                              {apt.serviceName} ({apt.duration}
                                              min)
                                            </span>
                                          </div>
                                          <span
                                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${st.badgeClass}`}
                                          >
                                            {st.label}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-[#f2e6ea]/60 mt-1">
                                          <span className="text-[11px] font-bold text-[#0ca678]">
                                            R$ {apt.price.toFixed(2)}
                                            {apt.depositPaid && (
                                              <span className="ml-1 text-[9px] text-blue-600">
                                                (Sinal R${" "}
                                                {(apt.depositAmount || 0).toFixed(
                                                  0,
                                                )}
                                                )
                                              </span>
                                            )}
                                          </span>
                                          <div
                                            className="flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openWhatsAppConfirmation(apt)
                                              }
                                              className="p-1 rounded hover:bg-[#25D366]/15 text-[#087f5b]"
                                              title="Enviar confirmação WhatsApp"
                                            >
                                              <MessageCircle size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingApt(apt);
                                                setShowAptModal(true);
                                              }}
                                              className="p-1 rounded hover:bg-[#fff0f5] text-[#b83b6b]"
                                              title="Editar / Reagendar"
                                            >
                                              <Edit2 size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                deleteAppointment(apt.id)
                                              }
                                              className="p-1 rounded hover:bg-red-50 text-red-500"
                                              title="Excluir"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-[#6e5a65] p-6 text-center">
                    <CalendarIcon size={48} className="mb-3 text-[#b83b6b]/40" />
                    <p className="font-bold text-[#2d1b2e]">
                      Sua agenda está pronta para receber atendimentos!
                    </p>
                    <p className="text-xs max-w-md mt-1 mb-4">
                      Cadastre suas profissionais em Equipe & Comissões e seus
                      serviços em Serviços & Combos para organizar todos os
                      horários.
                    </p>
                    <button
                      onClick={() => {
                        setEditingApt(null);
                        setShowAptModal(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#b83b6b] text-white text-xs font-bold"
                    >
                      Criar Agendamento
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: WEEKLY VIEW */}
          {viewMode === "week" && (
            <div className="overflow-x-auto custom-scrollbar flex-1 p-4">
              <div className="grid grid-cols-7 gap-3 min-w-[840px]">
                {weekDays.map((wd) => {
                  const dayApts = filteredAppointments
                    .filter((a) => a.date === wd.dateStr)
                    .sort((a, b) => a.time.localeCompare(b.time));
                  const isSelected = wd.dateStr === selectedDateStr;

                  return (
                    <div
                      key={wd.dateStr}
                      className={`rounded-2xl border p-3 min-h-[420px] flex flex-col gap-2 ${
                        isSelected
                          ? "border-[#b83b6b] bg-[#fff0f5]/20"
                          : "border-[#f2e6ea] bg-[#faf6f2]/40"
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedDate(wd.dateObj);
                          setViewMode("day");
                        }}
                        className="text-center pb-2 border-b border-[#f2e6ea] cursor-pointer hover:text-[#b83b6b]"
                      >
                        <span className="text-xs font-bold uppercase block">
                          {wd.label}
                        </span>
                        <span className="text-[10px] text-[#6e5a65]">
                          {dayApts.length} agendamentos
                        </span>
                      </div>

                      <div className="space-y-2 flex-1">
                        {dayApts.map((apt) => {
                          const st =
                            STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                          return (
                            <div
                              key={apt.id}
                              onClick={() => {
                                setEditingApt(apt);
                                setShowAptModal(true);
                              }}
                              className={`p-2 rounded-xl bg-white border border-[#f2e6ea] border-l-4 ${st.borderClass} shadow-2xs cursor-pointer hover:shadow-md transition`}
                            >
                              <div className="font-bold text-xs text-[#2d1b2e]">
                                {apt.time} - {apt.clientName}
                              </div>
                              <div className="text-[11px] text-[#6e5a65] truncate">
                                {apt.serviceName}
                              </div>
                              <div className="text-[10px] text-[#b83b6b] font-semibold mt-0.5">
                                {apt.professionalName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: MONTHLY VIEW */}
          {viewMode === "month" && (
            <div className="p-4 flex-1">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#6e5a65] mb-2">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((cell, idx) => {
                  if (!cell.day) {
                    return (
                      <div
                        key={idx}
                        className="min-h-[90px] rounded-xl bg-gray-50/40"
                      />
                    );
                  }
                  const dayApts = filteredAppointments.filter(
                    (a) => a.date === cell.dateStr,
                  );
                  const isToday =
                    cell.dateStr === new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => {
                        const [y, m, d] = cell.dateStr.split("-").map(Number);
                        setSelectedDate(new Date(y, m - 1, d));
                        setViewMode("day");
                      }}
                      className={`min-h-[95px] p-2 rounded-2xl border cursor-pointer transition hover:border-[#b83b6b] flex flex-col justify-between ${
                        isToday
                          ? "border-[#b83b6b] bg-[#fff0f5]/40"
                          : "border-[#f2e6ea] bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-[#2d1b2e]">
                          {cell.day}
                        </span>
                        {dayApts.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#b83b6b] text-white text-[10px] font-bold">
                            {dayApts.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayApts.slice(0, 2).map((a) => (
                          <div
                            key={a.id}
                            className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#faf6f2] text-[#2d1b2e]"
                          >
                            {a.time} {a.clientName}
                          </div>
                        ))}
                        {dayApts.length > 2 && (
                          <div className="text-[9px] text-[#b83b6b] font-semibold">
                            +{dayApts.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit / Reschedule Appointment Modal */}
      {showAptModal && (
        <AppointmentModal
          appointment={editingApt}
          clients={clients}
          services={services}
          professionals={professionals}
          existingAppointments={appointments}
          scheduleBlocks={scheduleBlocks}
          selectedDate={selectedDateStr}
          onClose={() => {
            setShowAptModal(false);
            setEditingApt(null);
          }}
          onSave={async (aptData) => {
            if (editingApt) {
              await updateAppointment(editingApt.id, aptData);
            } else {
              await addAppointment(aptData);
            }
            setShowAptModal(false);
            setEditingApt(null);
          }}
        />
      )}

      {/* Block Time / Holiday / Vacation Modal */}
      {showBlockModal && (
        <BlockScheduleModal
          professionals={professionals}
          selectedDate={selectedDateStr}
          onClose={() => setShowBlockModal(false)}
          onSave={async (blk) => {
            await addScheduleBlock(blk);
            setShowBlockModal(false);
          }}
        />
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <WaitlistModal
          waitlist={waitlist}
          services={services}
          professionals={professionals}
          selectedDate={selectedDateStr}
          onClose={() => setShowWaitlistModal(false)}
          onAdd={addWaitlistEntry}
          onUpdate={updateWaitlistEntry}
          onDelete={deleteWaitlistEntry}
          onConvertToAppointment={async (entry) => {
            const srv = services.find((s) => s.id === entry.serviceId);
            await addAppointment({
              clientName: entry.clientName,
              clientPhone: entry.clientPhone,
              clientEmail: "",
              serviceId: entry.serviceId,
              serviceName: entry.serviceName,
              professionalId:
                entry.professionalId || professionals[0]?.id || "a-definir",
              professionalName:
                entry.professionalName || professionals[0]?.name || "A definir",
              date: entry.desiredDate,
              time: "10:00",
              duration: srv?.duration || 45,
              price: srv?.price || 0,
              status: "confirmed",
              origin: "whatsapp",
            });
            await updateWaitlistEntry(entry.id, { status: "scheduled" });
          }}
        />
      )}
    </>
  );
}

function AppointmentModal({
  appointment,
  clients,
  services,
  professionals,
  existingAppointments,
  scheduleBlocks,
  selectedDate,
  onClose,
  onSave,
}: {
  appointment: Appointment | null;
  clients: Array<{ id: string; name: string; phone: string; email: string }>;
  services: Array<{
    id: string;
    name: string;
    duration: number;
    bufferTime?: number;
    price: number;
  }>;
  professionals: Array<{ id: string; name: string }>;
  existingAppointments: Appointment[];
  scheduleBlocks: Array<{
    professionalId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
  selectedDate: string;
  onClose: () => void;
  onSave: (apt: Omit<Appointment, "id">) => Promise<void>;
}) {
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    appointment && !appointment.clientId ? "new" : "existing",
  );
  const [clientId, setClientId] = useState(appointment?.clientId || "");
  const [customClientName, setCustomClientName] = useState(
    appointment?.clientName || "",
  );
  const [customClientPhone, setCustomClientPhone] = useState(
    appointment?.clientPhone || "",
  );
  const [customClientEmail, setCustomClientEmail] = useState(
    appointment?.clientEmail || "",
  );

  const [serviceId, setServiceId] = useState(appointment?.serviceId || "");
  const [professionalId, setProfessionalId] = useState(
    appointment?.professionalId || professionals[0]?.id || "",
  );
  const [date, setDate] = useState(appointment?.date || selectedDate);
  const [time, setTime] = useState(appointment?.time || "09:00");
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status || "confirmed",
  );
  const [origin, setOrigin] = useState<"manual" | "whatsapp" | "online">(
    appointment?.origin || "manual",
  );
  const [depositAmount, setDepositAmount] = useState(
    appointment?.depositAmount || 0,
  );
  const [depositPaid, setDepositPaid] = useState(
    appointment?.depositPaid || false,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    appointment?.paymentMethod || "pix",
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "partial" | "paid" | "refunded"
  >(appointment?.paymentStatus || "pending");
  const [observations, setObservations] = useState(
    appointment?.observations || "",
  );
  const [conflictError, setConflictError] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedService = services.find((s) => s.id === serviceId);
  const selectedProfessional = professionals.find(
    (p) => p.id === professionalId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError("");

    const finalClientName =
      clientMode === "existing" ? selectedClient?.name : customClientName;
    const finalClientPhone =
      clientMode === "existing" ? selectedClient?.phone : customClientPhone;
    const finalClientEmail =
      clientMode === "existing" ? selectedClient?.email : customClientEmail;

    if (!finalClientName || !selectedService || !selectedProfessional) {
      setConflictError("Preencha cliente, serviço e profissional.");
      return;
    }

    const startMin = parseTimeToMinutes(time);
    const totalDuration =
      selectedService.duration + (selectedService.bufferTime || 0);
    const endMin = startMin + totalDuration;

    // Duplicate & Overlap Conflict Prevention
    if (status !== "cancelled" && status !== "no_show") {
      const hasAptConflict = existingAppointments.some((other) => {
        if (appointment && other.id === appointment.id) return false;
        if (other.status === "cancelled" || other.status === "no_show")
          return false;
        if (other.date !== date) return false;
        if (other.professionalId !== professionalId) return false;
        const oStart = parseTimeToMinutes(other.time);
        const oEnd = oStart + (other.duration || 45);
        return startMin < oEnd && endMin > oStart;
      });

      if (hasAptConflict) {
        setConflictError(
          `Conflito de agenda: ${selectedProfessional.name} já possui outro atendimento neste horário.`,
        );
        return;
      }

      const hasBlockConflict = scheduleBlocks.some((blk) => {
        if (blk.date !== date) return false;
        if (
          blk.professionalId !== "all" &&
          blk.professionalId !== professionalId
        )
          return false;
        const bStart = parseTimeToMinutes(blk.startTime);
        const bEnd = parseTimeToMinutes(blk.endTime);
        return startMin < bEnd && endMin > bStart;
      });

      if (hasBlockConflict) {
        setConflictError(
          `Horário bloqueado (${selectedProfessional.name} está em intervalo/folga neste período).`,
        );
        return;
      }
    }

    await onSave({
      clientId: clientMode === "existing" ? clientId : undefined,
      clientName: finalClientName,
      clientPhone: finalClientPhone || "",
      clientEmail: finalClientEmail || "",
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      date,
      time,
      duration: selectedService.duration,
      price: selectedService.price,
      depositAmount: Number(depositAmount) || 0,
      depositPaid,
      paymentMethod,
      paymentStatus:
        status === "completed"
          ? "paid"
          : depositPaid
            ? "partial"
            : paymentStatus,
      status,
      origin,
      observations,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#f2e6ea] flex justify-between items-center">
          <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
            {appointment
              ? "Detalhes / Reagendar Atendimento"
              : "Novo Agendamento"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 custom-scrollbar"
        >
          {conflictError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{conflictError}</span>
            </div>
          )}

          {/* Client Selector or Quick New Client */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-xs text-[#2d1b2e]">
                Cliente *
              </label>
              <button
                type="button"
                onClick={() =>
                  setClientMode(clientMode === "existing" ? "new" : "existing")
                }
                className="text-xs font-bold text-[#b83b6b] hover:underline"
              >
                {clientMode === "existing"
                  ? "+ Digitar cliente avulsa/nova"
                  : "Selecionar da lista"}
              </button>
            </div>

            {clientMode === "existing" ? (
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              >
                <option value="">Selecione a cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nome da cliente *"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp (00) 90000-0000 *"
                  value={customClientPhone}
                  onChange={(e) => setCustomClientPhone(e.target.value)}
                  className="p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Serviço *
              </label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              >
                <option value="">Selecione o serviço...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration}min) - R$ {s.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Profissional *
              </label>
              <select
                required
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              >
                <option value="">Selecione a profissional...</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time & Origin (Reagendamento com poucos cliques) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              />
            </div>
            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Horário *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              />
            </div>
            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Canal de Origem
              </label>
              <select
                value={origin}
                onChange={(e) =>
                  setOrigin(e.target.value as "manual" | "whatsapp" | "online")
                }
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              >
                <option value="manual">Manual / Recepção</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="online">Link Online</option>
              </select>
            </div>
          </div>

          {/* Status & Deposit / Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f2e6ea]">
            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Status do Atendimento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm font-semibold outline-none focus:border-[#b83b6b]"
              >
                <option value="pending">Aguardando confirmação</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Concluído (Lança no Caixa)</option>
                <option value="cancelled">Cancelado</option>
                <option value="no_show">Não compareceu (Falta)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethodType)
                }
                className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b]"
              >
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          {/* Sinal / Pagamento Antecipado */}
          <div className="p-3.5 rounded-2xl bg-[#faf6f2] border border-[#f2e6ea] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="depositPaid"
                checked={depositPaid}
                onChange={(e) => setDepositPaid(e.target.checked)}
                className="w-4 h-4 accent-[#b83b6b]"
              />
              <label
                htmlFor="depositPaid"
                className="text-xs font-bold text-[#2d1b2e]"
              >
                Sinal / Pagamento Antecipado Recebido
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6e5a65]">Valor Sinal:</span>
              <CurrencyInput
                value={depositAmount}
                onChangeValue={setDepositAmount}
                className="w-32 p-2 rounded-xl bg-white border border-[#f2e6ea] text-xs font-bold text-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-xs text-[#2d1b2e] block mb-1">
              Observações do Atendimento
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Preferências, fórmula de coloração, alergias..."
              className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm outline-none focus:border-[#b83b6b] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#f2e6ea] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#b83b6b] text-[#b83b6b] text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#b83b6b] to-[#88234b] text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Check size={16} />
              {appointment ? "Salvar Alterações" : "Confirmar Agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockScheduleModal({
  professionals,
  selectedDate,
  onClose,
  onSave,
}: {
  professionals: Array<{ id: string; name: string }>;
  selectedDate: string;
  onClose: () => void;
  onSave: (blk: {
    professionalId: string;
    professionalName: string;
    date: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    reason: "folga" | "almoco" | "ferias" | "feriado" | "bloqueio";
    notes?: string;
  }) => Promise<void>;
}) {
  const [professionalId, setProfessionalId] = useState("all");
  const [reason, setReason] = useState<
    "folga" | "almoco" | "ferias" | "feriado" | "bloqueio"
  >("folga");
  const [date, setDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("19:00");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profName =
      professionalId === "all"
        ? "Todo o Salão"
        : professionals.find((p) => p.id === professionalId)?.name ||
          "Profissional";
    await onSave({
      professionalId,
      professionalName: profName,
      date,
      endDate: endDate || date,
      startTime,
      endTime,
      reason,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-serif text-[#2d1b2e]">
            Bloquear Horário, Folga ou Férias
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
              Profissional
            </label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm"
            >
              <option value="all">Todo o Salão (Feriado / Recesso)</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
              Tipo de Bloqueio
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full p-3 border border-[#f2e6ea] rounded-xl text-sm"
            >
              <option value="folga">Folga</option>
              <option value="almoco">Intervalo / Almoço</option>
              <option value="ferias">Férias</option>
              <option value="feriado">Feriado</option>
              <option value="bloqueio">Compromisso / Bloqueio</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
                Hora Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
                Hora Fim
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2d1b2e] block mb-1">
              Motivo / Observação
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Curso de especialização"
              className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#b83b6b] text-white text-xs font-bold"
            >
              Confirmar Bloqueio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WaitlistModal({
  waitlist,
  services,
  professionals,
  selectedDate,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  onConvertToAppointment,
}: {
  waitlist: any[];
  services: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string }>;
  selectedDate: string;
  onClose: () => void;
  onAdd: (entry: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConvertToAppointment: (entry: any) => Promise<void>;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [desiredDate, setDesiredDate] = useState(selectedDate);
  const [desiredPeriod, setDesiredPeriod] = useState<
    "manha" | "tarde" | "noite" | "qualquer"
  >("qualquer");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;
    const srv = services.find((s) => s.id === serviceId);
    await onAdd({
      clientName,
      clientPhone,
      serviceId: srv?.id || "",
      serviceName: srv?.name || "Serviço",
      desiredDate,
      desiredPeriod,
      status: "waiting",
    });
    setClientName("");
    setClientPhone("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#2d1b2e]">
              Lista de Espera Inteligente
            </h3>
            <p className="text-xs text-[#6e5a65]">
              Clientes aguardando vaga para horários ocupados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3.5 rounded-2xl bg-[#faf6f2] border border-[#f2e6ea] mb-4"
        >
          <input
            type="text"
            required
            placeholder="Nome da cliente"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="p-2 rounded-xl bg-white border border-[#f2e6ea] text-xs"
          />
          <input
            type="tel"
            required
            placeholder="WhatsApp"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="p-2 rounded-xl bg-white border border-[#f2e6ea] text-xs"
          />
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="p-2 rounded-xl bg-white border border-[#f2e6ea] text-xs"
          >
            <option value="">Serviço...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={desiredDate}
            onChange={(e) => setDesiredDate(e.target.value)}
            className="p-2 rounded-xl bg-white border border-[#f2e6ea] text-xs"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-[#b83b6b] text-white text-xs font-bold"
          >
            + Adicionar
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {waitlist.length === 0 ? (
            <p className="text-center text-xs text-[#6e5a65] py-8">
              Nenhuma cliente na lista de espera no momento.
            </p>
          ) : (
            waitlist.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-2xl border border-[#f2e6ea] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#fffcf9]"
              >
                <div>
                  <span className="font-bold text-xs text-[#2d1b2e]">
                    {w.clientName} ({w.clientPhone})
                  </span>
                  <p className="text-[11px] text-[#6e5a65]">
                    Deseja: <strong>{w.serviceName}</strong> em{" "}
                    {w.desiredDate.split("-").reverse().join("/")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const clean = w.clientPhone.replace(/\D/g, "");
                      const num = clean.length <= 11 ? `55${clean}` : clean;
                      const msg = encodeURIComponent(
                        `Olá ${w.clientName}! Boas notícias: abriu uma vaga na nossa agenda para ${w.serviceName} no dia ${w.desiredDate.split("-").reverse().join("/")}. Deseja reservar? ✨`,
                      );
                      window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
                      onUpdate(w.id, { status: "notified" });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <MessageCircle size={12} /> Avisar Vaga
                  </button>
                  <button
                    onClick={() => onConvertToAppointment(w)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#b83b6b] text-white text-[11px] font-bold"
                  >
                    Agendar Agora
                  </button>
                  <button
                    onClick={() => onDelete(w.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
