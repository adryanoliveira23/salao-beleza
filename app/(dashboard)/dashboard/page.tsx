"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Dashboard() {
  const router = useRouter();
  const {
    appointments,
    clients,
    deleteAppointment,
    realizedRevenueByDate = {},
    refreshFromStorage,
  } = useSalonData();

  const formatPhoneForWhatsApp = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length >= 10 && numbers.length <= 11) {
      return `55${numbers}`;
    }
    return numbers;
  };

  const openWhatsApp = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${formattedPhone}?text=${encodedMessage}`,
      "_blank",
    );
  };

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const thisMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const todayAppointmentsList = useMemo(
    () => appointments.filter((apt) => apt.date === today),
    [appointments, today],
  );

  const todayRevenue = useMemo(
    () =>
      todayAppointmentsList.reduce((sum, apt) => sum + apt.price, 0) +
      (realizedRevenueByDate[today] || 0),
    [todayAppointmentsList, realizedRevenueByDate, today],
  );

  const monthlyAppointments = useMemo(
    () => appointments.filter((apt) => apt.date.startsWith(thisMonth)),
    [appointments, thisMonth],
  );

  const monthlyRevenue = useMemo(() => {
    const fromAppointments = monthlyAppointments.reduce(
      (sum, apt) => sum + apt.price,
      0,
    );
    const fromRealized = Object.entries(realizedRevenueByDate).reduce(
      (sum, [date, value]) => (date.startsWith(thisMonth) ? sum + value : sum),
      0,
    );
    return fromAppointments + fromRealized;
  }, [monthlyAppointments, realizedRevenueByDate, thisMonth]);

  const pendingCount = useMemo(
    () =>
      todayAppointmentsList.filter((apt) => apt.status === "pending").length,
    [todayAppointmentsList],
  );

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((apt) => {
      counts[apt.serviceName] = (counts[apt.serviceName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [appointments]);

  const maxServiceCount = Math.max(...serviceCounts.map((s) => s.count), 1);

  return (
    <>
      <Header title="Visão Geral" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 2xl:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 2xl:p-7 flex gap-3 md:gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#D45D79]/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 bg-linear-to-br from-[#10b981] to-[#059669] text-white">
              <DollarSign size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <span className="text-xs md:text-[13px] text-[#666] font-medium">
                Receita Hoje
              </span>
              <span className="text-2xl md:text-[28px] font-semibold font-display text-[#2d1b2e] truncate">
                R$ {todayRevenue.toFixed(2)}
              </span>
              <span className="text-[12px] font-semibold text-[#10b981]">
                {todayAppointmentsList.length} agendamento(s)
              </span>
            </div>
          </div>

          {/* Appointments Card */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-7 flex gap-3 md:gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#D45D79]/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 bg-linear-to-br from-[#FF6B9D] to-[#C73866] text-white">
              <Calendar size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <span className="text-xs md:text-[13px] text-[#666] font-medium">
                Agendamentos Hoje
              </span>
              <span className="text-2xl md:text-[28px] font-semibold font-display text-[#2d1b2e]">
                {todayAppointmentsList.length}
              </span>
              <span className="text-[12px] font-semibold text-[#f59e0b]">
                {pendingCount} pendente(s)
              </span>
            </div>
          </div>

          {/* Clients Card */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-7 flex gap-3 md:gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#D45D79]/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 bg-linear-to-br from-[#3b82f6] to-[#2563eb] text-white">
              <Users size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <span className="text-xs md:text-[13px] text-[#666] font-medium">
                Total de Clientes
              </span>
              <span className="text-2xl md:text-[28px] font-semibold font-display text-[#2d1b2e]">
                {clients.length}
              </span>
              <span className="text-[12px] font-semibold text-[#10b981]">
                Cadastradas
              </span>
            </div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-7 flex gap-3 md:gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#D45D79]/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 bg-linear-to-br from-[#f59e0b] to-[#d97706] text-white">
              <TrendingUp size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <span className="text-xs md:text-[13px] text-[#666] font-medium">
                Receita Mensal
              </span>
              <span className="text-2xl md:text-[28px] font-semibold font-display text-[#2d1b2e] truncate">
                R$ {monthlyRevenue.toLocaleString()}
              </span>
              <span className="text-[12px] font-semibold text-[#10b981]">
                {monthlyAppointments.length} agendamento(s)
              </span>
            </div>
          </div>

          {/* Appointments Today List */}
          <div className="col-span-1 2xl:col-span-2 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 2xl:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#D45D79]/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold font-display text-[#2d1b2e]">
                Próximos Agendamentos
              </h3>
              <button
                className="bg-white text-[#FF6B9D] border-2 border-[#FF6B9D] px-4 py-2 rounded-xl font-semibold text-sm cursor-pointer hover:bg-[#fff0f5] transition-all duration-300 font-sans w-fit"
                onClick={() => router.push("/agenda")}
              >
                Ver Todos
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {todayAppointmentsList.slice(0, 4).map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 md:p-4 bg-[#fafafa] rounded-xl border-l-4 border-[#FF6B9D]"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[#FF6B9D] shrink-0">
                    <Clock size={16} />
                    {apt.time}
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-[#2d1b2e] truncate">
                      {apt.clientName}
                    </span>
                    <span className="text-xs md:text-[13px] text-[#666] truncate">
                      {apt.serviceName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs md:text-[13px] text-[#666] shrink-0">
                      {apt.professionalName}
                    </span>
                    <div className="flex gap-2 shrink-0 items-center">
                      <button
                        className="text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#128C7E] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                        title="Confirmar via WhatsApp"
                        onClick={() =>
                          openWhatsApp(
                            apt.clientPhone,
                            `Olá ${apt.clientName}, confirmando seu agendamento de ${apt.serviceName} para hoje às ${apt.time}.`,
                          )
                        }
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button
                        className="text-[#dc2626] hover:bg-[#dc2626]/10 p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                        title="Excluir agendamento"
                        onClick={() => deleteAppointment(apt.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                      <span
                        className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-semibold shrink-0
                      ${apt.status === "confirmed" ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fef3c7] text-[#92400e]"}`}
                      >
                        {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {todayAppointmentsList.length === 0 && (
                <p className="text-[#666] text-sm py-4 text-center">
                  Nenhum agendamento para hoje. Compartilhe seu link de
                  agendamento com suas clientes!
                </p>
              )}
            </div>
          </div>

          {/* Top Services Chart */}
          <div className="col-span-1 2xl:col-span-2 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 2xl:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#D45D79]/10">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold font-display text-[#2d1b2e]">
                Serviços Mais Populares
              </h3>
            </div>
            <div className="flex flex-col gap-5">
              {serviceCounts.length > 0 ? (
                serviceCounts.map((service) => (
                  <div key={service.name} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#2d1b2e]">
                        {service.name}
                      </span>
                      <span className="font-semibold text-[#FF6B9D]">
                        {service.count}
                      </span>
                    </div>
                    <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#FF6B9D] to-[#C73866] rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${(service.count / maxServiceCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#666] text-sm py-4 text-center">
                  Nenhum serviço agendado ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
