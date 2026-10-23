"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { jsPDF } from "jspdf";
import {
  FileSpreadsheet,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Award,
  Sparkles,
} from "lucide-react";

export default function RelatoriosPage() {
  const { profile } = useAuth();
  const { appointments, clients, services, professionals, campaigns } =
    useSalonData();
  const { transactions, fixedCosts, variableCosts, financialHealth } = useFinance();

  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayMonth = `${todayStr.slice(0, 7)}-01`;

  const [startDate, setStartDate] = useState(firstDayMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [profFilter, setProfFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      if (profFilter !== "all" && String(a.professionalId) !== profFilter)
        return false;
      if (serviceFilter !== "all" && String(a.serviceId) !== serviceFilter)
        return false;
      return true;
    });
  }, [appointments, startDate, endDate, profFilter, serviceFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (profFilter !== "all" && String(t.professionalId) !== profFilter)
        return false;
      return true;
    });
  }, [transactions, startDate, endDate, profFilter]);

  const metrics = useMemo(() => {
    const completed = filteredAppointments.filter(
      (a) => a.status === "completed",
    );
    const cancelled = filteredAppointments.filter(
      (a) => a.status === "cancelled",
    );
    const noShow = filteredAppointments.filter((a) => a.status === "no_show");

    let apptRevenue = 0;
    let totalCommission = 0;
    let totalEstimatedServiceCost = 0;

    const serviceRanking: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};
    const profRanking: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};

    completed.forEach((a) => {
      const svc = services.find((s) => String(s.id) === String(a.serviceId));
      const prof = professionals.find(
        (p) => String(p.id) === String(a.professionalId),
      );
      const price = a.price ?? svc?.price ?? 0;
      const commRate = svc?.commissionRate ?? prof?.commission ?? 0;
      const comm = (price * commRate) / 100;
      const estCost = svc?.costPrice ?? 0;

      apptRevenue += price;
      totalCommission += comm;
      totalEstimatedServiceCost += estCost;

      const sKey = a.serviceName || svc?.name || "Serviço";
      if (!serviceRanking[sKey])
        serviceRanking[sKey] = { name: sKey, count: 0, revenue: 0 };
      serviceRanking[sKey].count += 1;
      serviceRanking[sKey].revenue += price;

      const pKey = a.professionalName || prof?.name || "Profissional";
      if (!profRanking[pKey])
        profRanking[pKey] = { name: pKey, count: 0, revenue: 0 };
      profRanking[pKey].count += 1;
      profRanking[pKey].revenue += price;
    });

    const manualIncome = filteredTransactions
      .filter((t) => t.type === "income" && !t.appointmentId)
      .reduce((s, t) => s + t.amount, 0);

    const manualExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const grossRevenue = apptRevenue + manualIncome;
    const totalVariable = variableCosts.reduce((s, v) => s + v.amount, 0);
    const totalFixed = financialHealth.totalFixedCosts;
    const totalExpenses =
      totalFixed +
      totalVariable +
      manualExpense +
      totalCommission +
      totalEstimatedServiceCost;

    const netProfit = grossRevenue - totalExpenses;
    const avgTicket = completed.length > 0 ? apptRevenue / completed.length : 0;

    // Occupancy rate estimate (based on 8 slots/day per professional)
    const daysCount =
      Math.max(
        1,
        Math.round(
          (new Date(endDate + "T12:00:00").getTime() -
            new Date(startDate + "T12:00:00").getTime()) /
            86400000,
        ) + 1,
      );
    const totalCapacity = Math.max(1, professionals.length * daysCount * 8);
    const occupancyRate = Math.min(
      100,
      Math.round((filteredAppointments.length / totalCapacity) * 100),
    );

    const newClientsCount = clients.filter((c) => (c.visits || 0) <= 1).length;
    const recurringClientsCount = clients.filter(
      (c) => (c.visits || 0) > 1,
    ).length;
    const retentionRate =
      clients.length > 0
        ? Math.round((recurringClientsCount / clients.length) * 100)
        : 0;

    // Expenses by category
    const expensesByCategory: Record<string, number> = {
      "Custos Fixos (Estrutura)": totalFixed,
      "Comissões de Profissionais": totalCommission,
      "Insumos Estimados de Serviços": totalEstimatedServiceCost,
    };
    fixedCosts.forEach((f) => {
      expensesByCategory[f.category || "Fixo"] =
        (expensesByCategory[f.category || "Fixo"] || 0) + f.amount;
    });
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        expensesByCategory[t.category] =
          (expensesByCategory[t.category] || 0) + t.amount;
      });

    return {
      grossRevenue,
      totalExpenses,
      netProfit,
      avgTicket,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      noShowCount: noShow.length,
      occupancyRate,
      newClientsCount,
      recurringClientsCount,
      retentionRate,
      topServices: Object.values(serviceRanking).sort(
        (a, b) => b.revenue - a.revenue,
      ),
      topProfessionals: Object.values(profRanking).sort(
        (a, b) => b.revenue - a.revenue,
      ),
      expensesByCategory: Object.entries(expensesByCategory).filter(
        ([, val]) => val > 0,
      ),
    };
  }, [
    filteredAppointments,
    filteredTransactions,
    services,
    professionals,
    clients,
    fixedCosts,
    variableCosts,
    financialHealth.totalFixedCosts,
    startDate,
    endDate,
  ]);

  const exportCSV = () => {
    const headers = [
      "Data",
      "Cliente",
      "Servico",
      "Profissional",
      "Status",
      "Valor (R$)",
    ];
    const rows = filteredAppointments.map((a) => [
      a.date,
      `"${a.clientName}"`,
      `"${a.serviceName}"`,
      `"${a.professionalName || ""}"`,
      a.status,
      (a.price || 0).toFixed(2),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `relatorio_salao_${startDate}_a_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      `RELATÓRIO GERENCIAL — ${(profile?.salon_name || "SALÃO").toUpperCase()}`,
      105,
      y,
      { align: "center" },
    );
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${startDate} até ${endDate}`, 105, y, {
      align: "center",
    });
    y += 14;

    const lines = [
      `Faturamento Bruto no Período: R$ ${metrics.grossRevenue.toFixed(2)}`,
      `Despesas, Custos e Comissões: R$ ${metrics.totalExpenses.toFixed(2)}`,
      `Lucro Líquido Estimado: R$ ${metrics.netProfit.toFixed(2)}`,
      `Ticket Médio por Atendimento: R$ ${metrics.avgTicket.toFixed(2)}`,
      `Atendimentos Concluídos: ${metrics.completedCount}`,
      `Cancelamentos: ${metrics.cancelledCount} | Faltas (No-show): ${metrics.noShowCount}`,
      `Taxa de Ocupação Estimada: ${metrics.occupancyRate}%`,
      `Taxa de Retenção de Clientes: ${metrics.retentionRate}% (${metrics.recurringClientsCount} recorrentes / ${metrics.newClientsCount} novas)`,
    ];

    lines.forEach((l) => {
      doc.text(l, 20, y);
      y += 7;
    });

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("SERVIÇOS MAIS VENDIDOS:", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    metrics.topServices.slice(0, 6).forEach((s, idx) => {
      doc.text(
        `${idx + 1}. ${s.name} — ${s.count}x (R$ ${s.revenue.toFixed(2)})`,
        24,
        y,
      );
      y += 6;
    });

    doc.save(`relatorio_bi_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Relatórios & Inteligência de Negócio (BI)" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Filters & Export Bar */}
        <div className="bg-[var(--card-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--muted)] mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--muted)] mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--muted)] mb-1">
                Profissional
              </label>
              <select
                value={profFilter}
                onChange={(e) => setProfFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs font-medium"
              >
                <option value="all">Todas as Profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--muted)] mb-1">
                Serviço
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs font-medium"
              >
                <option value="all">Todos os Serviços</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCSV}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-gray-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              Exportar CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText size={16} />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Main BI KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Faturamento Bruto
              </span>
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              R$ {metrics.grossRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 tabular-nums">
              Ticket Médio: R$ {metrics.avgTicket.toFixed(2)}
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Lucro Líquido Real
              </span>
              <TrendingUp size={18} className="text-[var(--primary)]" />
            </div>
            <p
              className={`text-2xl font-bold tabular-nums ${
                metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              R$ {metrics.netProfit.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 tabular-nums">
              Descontando custos e comissões (R${" "}
              {metrics.totalExpenses.toFixed(2)})
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Ocupação & Faltas
              </span>
              <Calendar size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {metrics.occupancyRate}% ocupação
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 tabular-nums">
              {metrics.cancelledCount} cancelados • {metrics.noShowCount} faltas
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Retenção de Clientes
              </span>
              <Users size={18} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {metrics.retentionRate}% recorrentes
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 tabular-nums">
              {metrics.newClientsCount} novas • {metrics.recurringClientsCount}{" "}
              fiéis
            </p>
          </div>
        </div>

        {/* Rankings & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Services */}
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
            <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--primary)]" />
              Serviços Mais Vendidos
            </h3>
            {metrics.topServices.length === 0 ? (
              <p className="text-xs text-[var(--muted)] py-6 text-center">
                Sem serviços concluídos neste filtro.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.topServices.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]"
                  >
                    <div>
                      <p className="font-bold text-sm text-[var(--foreground)]">
                        {i + 1}. {s.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] tabular-nums">
                        {s.count} atendimentos realizados
                      </p>
                    </div>
                    <span className="font-bold text-sm text-emerald-600 tabular-nums">
                      R$ {s.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Professionals */}
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
            <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              Profissionais com Maior Faturamento
            </h3>
            {metrics.topProfessionals.length === 0 ? (
              <p className="text-xs text-[var(--muted)] py-6 text-center">
                Sem atendimentos concluídos neste filtro.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.topProfessionals.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]"
                  >
                    <div>
                      <p className="font-bold text-sm text-[var(--foreground)]">
                        {i + 1}. {p.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] tabular-nums">
                        {p.count} procedimentos concluídos
                      </p>
                    </div>
                    <span className="font-bold text-sm text-[var(--primary)] tabular-nums">
                      R$ {p.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses by Category & Campaigns */}
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                Despesas por Categoria
              </h3>
              <div className="space-y-2.5">
                {metrics.expensesByCategory.map(([cat, val]) => (
                  <div
                    key={cat}
                    className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[var(--background)]"
                  >
                    <span className="font-medium text-[var(--foreground)]">
                      {cat}
                    </span>
                    <span className="font-bold text-rose-600 tabular-nums">
                      R$ {val.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--card-border)]">
              <h4 className="font-bold text-sm text-[var(--foreground)] mb-2">
                Desempenho de Campanhas ({campaigns.length})
              </h4>
              <p className="text-xs text-[var(--muted)]">
                Total de alcances promocionais consentidos:{" "}
                <strong className="tabular-nums">
                  {campaigns.reduce((s, c) => s + (c.sentCount || 0), 0)} envios
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
