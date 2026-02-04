"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Calendar,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const { appointments, professionals, clients, services, addAppointment, deleteAppointment, refreshFromStorage } =
    useSalonData();

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  const selectedDateStr = useMemo(() => {
    const d = selectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [selectedDate]);

  const appointmentsForDate = useMemo(
    () => appointments.filter((apt) => apt.date === selectedDateStr),
    [appointments, selectedDateStr]
  );

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <>
      <Header title="Agenda" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col gap-4 md:gap-6">
        <div className="bg-white rounded-[16px] md:rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 flex flex-col overflow-hidden min-h-[400px] h-[calc(100vh-120px)] md:h-[calc(100vh-140px)]">
          {/* Agenda Controls Header */}
          <div className="p-4 md:p-6 border-b border-[#f0f0f0] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4 bg-white z-10">
            <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4 bg-[#fafafa] p-1.5 rounded-xl border border-[#f0f0f0]">
              <button
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-[#666] hover:text-[#FF6B9D] transition-all shrink-0"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2 px-2 min-w-0">
                <Calendar size={18} className="text-[#FF6B9D] shrink-0" />
                <span className="font-bold text-[#2d1b2e] text-sm md:text-base text-center capitalize truncate">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <button
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-[#666] hover:text-[#FF6B9D] transition-all shrink-0"
                onClick={() => changeDate(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-[#FF6B9D] hover:bg-[#C73866] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base shadow-[0_4px_14px_rgba(255,107,157,0.4)] hover:shadow-[0_6px_20px_rgba(255,107,157,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              Novo Agendamento
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1 relative -mx-4 md:mx-0 px-4 md:px-0">
            <div className="min-w-[600px] md:min-w-[800px] h-full flex flex-col">
              {professionals.length > 0 || appointmentsForDate.length > 0 ? (
                <>
                  <div
                    className="grid bg-[#fafafa] border-b-2 border-[#f0f0f0] sticky top-0 z-20 shadow-sm"
                    style={{
                      gridTemplateColumns: `80px ${
                        professionals.length > 0
                          ? professionals.map(() => "1fr").join(" ") + (appointmentsForDate.some((a) => a.professionalId === "a-definir") ? " 1fr" : "")
                          : appointmentsForDate.some((a) => a.professionalId === "a-definir")
                            ? "1fr"
                            : "1fr"
                      }`,
                    }}
                  >
                    <div className="p-5 border-r border-[#f0f0f0]"></div>
                    {professionals.length > 0 ? (
                      professionals.map((prof) => (
                        <div
                          key={prof.id}
                          className="p-5 text-center border-r border-[#f0f0f0] border-t-4"
                          style={{ borderTopColor: prof.color }}
                        >
                          <div className="font-bold text-[#2d1b2e] mb-1">
                            {prof.name}
                          </div>
                          <div className="text-[13px] text-[#666]">
                            {prof.specialty}
                          </div>
                        </div>
                      ))
                    ) : null}
                    {appointmentsForDate.some((a) => a.professionalId === "a-definir") && (
                      <div className="p-5 text-center border-r border-[#f0f0f0] border-t-4 border-t-[#FF6B9D]">
                        <div className="font-bold text-[#2d1b2e] mb-1">
                          A definir
                        </div>
                        <div className="text-[13px] text-[#666]">
                          Agendamentos online
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    {[...Array(12)].map((_, idx) => {
                      const hour = idx + 8;
                      const cols = professionals.length > 0 ? professionals : [];
                      const hasADefinir = appointmentsForDate.some((a) => a.professionalId === "a-definir");
                      return (
                        <div
                          key={idx}
                          className="grid min-h-[80px] border-b border-[#f0f0f0]"
                          style={{
                            gridTemplateColumns: `80px ${cols.map(() => "1fr").join(" ")}${hasADefinir ? " 1fr" : ""}`,
                          }}
                        >
                          <div className="p-4 font-semibold text-[#666] bg-[#fafafa] border-r border-[#f0f0f0] flex items-start">
                            {hour}:00
                          </div>
                          {cols.map((prof) => (
                            <div
                              key={prof.id}
                              className="p-2 relative border-r border-[#f5f5f5]"
                            >
                              {appointmentsForDate
                                .filter(
                                  (apt) =>
                                    apt.professionalId === prof.id &&
                                    apt.time.startsWith(`${hour}:`)
                                )
                                .map((apt) => (
                                  <div
                                    key={apt.id}
                                    className="p-3 rounded-lg border-l-4 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-300 absolute w-[calc(100%-16px)] z-10 group flex flex-col justify-between"
                                    style={{
                                      backgroundColor: prof.color + "20",
                                      borderLeftColor: prof.color,
                                      height: `${(apt.duration / 30) * 40}px`,
                                    }}
                                  >
                                    <div>
                                      <div className="font-bold text-sm mb-1">
                                        {apt.clientName}
                                      </div>
                                      <div className="text-xs text-[#666] mb-1">
                                        {apt.serviceName}
                                      </div>
                                      <div className="text-[11px] text-[#999]">
                                        {apt.time} - {apt.duration}min
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteAppointment(apt.id);
                                      }}
                                      className="mt-1 self-end p-1 rounded hover:bg-red-100 text-[#dc2626] transition-all"
                                      title="Excluir agendamento"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          ))}
                          {hasADefinir && (
                            <div className="p-2 relative border-r border-[#f5f5f5]">
                              {appointmentsForDate
.filter(
                                    (apt) =>
                                      apt.professionalId === "a-definir" &&
                                      apt.time.startsWith(`${hour}:`)
                                  )
                                  .map((apt) => (
                                    <div
                                      key={apt.id}
                                      className="p-3 rounded-lg border-l-4 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-300 absolute w-[calc(100%-16px)] z-10 bg-[#FF6B9D]/20 border-l-[#FF6B9D] group flex flex-col justify-between"
                                    >
                                      <div>
                                        <div className="font-bold text-sm mb-1">
                                          {apt.clientName}
                                        </div>
                                        <div className="text-xs text-[#666] mb-1">
                                          {apt.serviceName}
                                        </div>
                                        <div className="text-[11px] text-[#999]">
                                          {apt.time} - {apt.duration}min
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteAppointment(apt.id);
                                        }}
                                        className="mt-1 self-end p-1 rounded hover:bg-red-100 text-[#dc2626] transition-all"
                                        title="Excluir agendamento"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-[#666]">
                  <Calendar size={48} className="mb-4 opacity-30" />
                  <p className="text-center">
                    Adicione profissionais e serviços nas respectivas páginas para
                    começar a usar a agenda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AgendaModal
          clients={clients}
          services={services}
          professionals={professionals}
          selectedDate={selectedDateStr}
          onClose={() => setShowModal(false)}
          onSave={(apt) => {
            addAppointment(apt);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function AgendaModal({
  clients,
  services,
  professionals,
  selectedDate,
  onClose,
  onSave,
}: {
  clients: { id: string; name: string; phone: string; email: string }[];
  services: { id: string; name: string; duration: number; price: number }[];
  professionals: { id: string; name: string }[];
  selectedDate: string;
  onClose: () => void;
  onSave: (apt: {
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
  }) => void;
}) {
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [time, setTime] = useState("09:00");

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedService = services.find((s) => s.id === serviceId);
  const selectedProfessional = professionals.find((p) => p.id === professionalId);

  const canSubmit = clients.length > 0 && services.length > 0 && professionals.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedClient || !selectedService || !selectedProfessional) return;
    onSave({
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      clientEmail: selectedClient.email,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      date: selectedDate,
      time,
      duration: selectedService.duration,
      price: selectedService.price,
      status: "pending",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] animate-in fade-in duration-300">
      <div
        className="bg-white rounded-[24px] w-[90%] max-w-[600px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 border-b border-[#f0f0f0] flex justify-between items-center">
          <h3 className="text-[22px] font-bold font-serif text-[#2d1b2e]">
            Novo Agendamento
          </h3>
          <button
            className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          {!canSubmit && (
            <div className="mx-7 mt-4 p-4 bg-[#fef3c7] text-[#92400e] rounded-xl text-sm">
              Adicione clientes, serviços e profissionais nas respectivas páginas para criar agendamentos.
            </div>
          )}
          <div className="p-7 overflow-y-auto grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 col-span-2">
              <label className="font-semibold text-[#2d1b2e] text-sm">
                Cliente
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] focus:ring-4 focus:ring-[#FF6B9D]/10 transition-all"
              >
                <option value="">Selecione...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="font-semibold text-[#2d1b2e] text-sm">
                Serviço
              </label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] focus:ring-4 focus:ring-[#FF6B9D]/10 transition-all"
              >
                <option value="">Selecione...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - R$ {s.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="font-semibold text-[#2d1b2e] text-sm">
                Profissional
              </label>
              <select
                required
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] focus:ring-4 focus:ring-[#FF6B9D]/10 transition-all"
              >
                <option value="">Selecione...</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[#2d1b2e] text-sm">
                Horário
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] focus:ring-4 focus:ring-[#FF6B9D]/10 transition-all"
              />
            </div>
          </div>
          <div className="p-5 border-t border-[#f0f0f0] flex gap-3 justify-end">
            <button
              type="button"
              className="bg-white text-[#FF6B9D] border-2 border-[#FF6B9D] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#fff0f5] transition-all"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Check size={18} />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
