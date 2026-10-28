"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import {
  useFinance,
  CustomFund,
  FinancialTransaction,
} from "@/contexts/FinanceContext";
import { useSalonData } from "@/contexts/SalonDataContext";
import { CurrencyInput } from "@/components/CurrencyInput";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Wallet,
  Settings2,
  Plus,
  Trash2,
  X,
  Coins,
  Download,
  CheckCircle2,
  RotateCcw,
  Users,
  Calendar,
  CreditCard,
} from "lucide-react";

export default function CaixaPage() {
  const {
    financialHealth,
    isLoading,
    settings,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    dailyClosings,
    closeDailyCash,
    addCustomFund,
    removeCustomFund,
    updateCustomFund,
  } = useFinance();

  const { appointments, professionals, services } = useSalonData();

  const [activeTab, setActiveTab] = useState<
    "fluxo" | "lancamentos" | "profissionais" | "fechamento"
  >("fluxo");
  const [showManageFundsModal, setShowManageFundsModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txDefaultType, setTxDefaultType] = useState<"income" | "expense">(
    "income",
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // Unified Cash Flow Ledger combining appointments + manual transactions
  const ledgerItems = useMemo(() => {
    const items: Array<{
      id: string;
      source: "appointment" | "manual";
      type: "income" | "expense";
      description: string;
      category: string;
      amount: number;
      discount: number;
      depositAmount: number;
      paymentMethod: string;
      status: string;
      date: string;
      professionalName?: string;
    }> = [];

    appointments.forEach((apt) => {
      if (apt.status === "cancelled" || apt.status === "no_show") return;
      if (!apt.date?.startsWith(selectedMonth)) return;
      items.push({
        id: apt.id,
        source: "appointment",
        type: "income",
        description: `${apt.serviceName} — ${apt.clientName}`,
        category: "Atendimento",
        amount: apt.price || 0,
        discount: apt.discount || 0,
        depositAmount: apt.depositAmount || 0,
        paymentMethod: apt.paymentMethod || "pix",
        status:
          apt.status === "completed"
            ? "paid"
            : apt.depositPaid
              ? "partial"
              : apt.paymentStatus || "pending",
        date: apt.date,
        professionalName: apt.professionalName,
      });
    });

    transactions.forEach((tx) => {
      if (!tx.date?.startsWith(selectedMonth)) return;
      items.push({
        id: tx.id,
        source: "manual",
        type: tx.type,
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        discount: tx.discount || 0,
        depositAmount: tx.depositAmount || 0,
        paymentMethod: tx.paymentMethod,
        status: tx.status,
        date: tx.date,
        professionalName: tx.professionalName,
      });
    });

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, transactions, selectedMonth]);

  // Results separated by professional
  const resultsByProfessional = useMemo(() => {
    return professionals.map((prof) => {
      const profApts = appointments.filter(
        (a) =>
          a.professionalId === prof.id &&
          a.date?.startsWith(selectedMonth) &&
          (a.status === "confirmed" || a.status === "completed"),
      );
      const grossRevenue = profApts.reduce(
        (acc, a) => acc + Math.max(0, a.price - (a.discount || 0)),
        0,
      );
      let productCost = 0;
      let commissionTotal = 0;
      profApts.forEach((a) => {
        const srv = services.find((s) => s.id === a.serviceId);
        const net = Math.max(0, a.price - (a.discount || 0));
        productCost += srv?.costPrice || 0;
        const rate =
          srv?.commissionRate !== undefined && srv?.commissionRate !== null
            ? srv.commissionRate
            : prof.commission;
        commissionTotal += net * (rate / 100);
      });
      const salonNet = grossRevenue - productCost - commissionTotal;
      return {
        prof,
        count: profApts.length,
        grossRevenue,
        productCost,
        commissionTotal,
        salonNet,
      };
    });
  }, [professionals, appointments, services, selectedMonth]);

  // Payment method breakdown today
  const todayBreakdown = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const byMethod = {
      pix: 0,
      dinheiro: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      outro: 0,
    };
    let incomeToday = 0;
    let expenseToday = 0;

    ledgerItems
      .filter((i) => i.date === today && i.status !== "refunded")
      .forEach((i) => {
        const net = Math.max(0, i.amount - i.discount);
        if (i.type === "income") {
          incomeToday += net;
          const m = (i.paymentMethod || "pix") as keyof typeof byMethod;
          if (byMethod[m] !== undefined) byMethod[m] += net;
          else byMethod.outro += net;
        } else {
          expenseToday += net;
        }
      });

    return { today, byMethod, incomeToday, expenseToday };
  }, [ledgerItems]);

  const exportFinancialCSV = () => {
    const headers = [
      "Data",
      "Tipo",
      "Descricao",
      "Categoria",
      "Profissional",
      "Forma Pagamento",
      "Valor Bruto",
      "Desconto",
      "Sinal",
      "Valor Liquido",
      "Status",
    ];
    const rows = ledgerItems.map((i) => [
      i.date,
      i.type === "income" ? "Receita" : "Despesa",
      `"${i.description}"`,
      `"${i.category}"`,
      `"${i.professionalName || "-"}"`,
      i.paymentMethod,
      i.amount.toFixed(2),
      i.discount.toFixed(2),
      i.depositAmount.toFixed(2),
      Math.max(0, i.amount - i.discount).toFixed(2),
      i.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${selectedMonth}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e1639] dark:border-[#e27d9a]"></div>
      </div>
    );
  }

  const {
    dailyRevenue,
    monthlyRevenue,
    estimatedNetProfit,
    expensesPaidToday,
    accountsReceivable,
    billsDueToday,
    safeToWithdraw,
    fundsAccumulated,
  } = financialHealth;

  const totalReservas = Object.values(fundsAccumulated).reduce(
    (a, b) => a + b,
    0,
  );
  const funds = settings.customFunds || [];

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)]">
      <Header title="Financeiro Completo & Fluxo de Caixa" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
        {/* Top Action Bar */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-4 md:p-5 shadow-xs border border-[var(--card-border)] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex overflow-x-auto items-center gap-2 pb-1 no-scrollbar w-full lg:w-auto">
            {(
              [
                { id: "fluxo", label: "Visão Geral & Caixinhas" },
                { id: "lancamentos", label: "Receitas, Despesas & Sinais" },
                { id: "profissionais", label: "Resultado por Profissional" },
                { id: "fechamento", label: "Fechamento Diário" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#7e1639] text-white shadow-xs"
                    : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] text-xs font-bold text-[var(--foreground)]"
            />
            <button
              onClick={exportFinancialCSV}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--card-border)] text-xs font-bold flex items-center gap-1.5 hover:bg-[var(--primary-light)]"
            >
              <Download size={15} /> Exportar CSV
            </button>
            <button
              onClick={() => {
                setTxDefaultType("income");
                setShowTxModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0ca678] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} /> + Receita
            </button>
            <button
              onClick={() => {
                setTxDefaultType("expense");
                setShowTxModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} /> - Despesa
            </button>
          </div>
        </div>

        {/* Summary KPI Strip (Faturamento vs Despesas vs Lucro Real) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xs">
            <span className="text-xs text-[var(--muted)] block mb-1">
              Faturamento Mensal Bruto
            </span>
            <span className="text-xl font-bold text-[var(--foreground)]">
              R$ {monthlyRevenue.toFixed(2)}
            </span>
            <span className="text-[11px] text-[#0ca678] block mt-0.5">
              Hoje: R$ {dailyRevenue.toFixed(2)}
            </span>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xs">
            <span className="text-xs text-[var(--muted)] block mb-1">
              Despesas + Custos Mês
            </span>
            <span className="text-xl font-bold text-red-600">
              R${" "}
              {(
                financialHealth.totalFixedCosts +
                financialHealth.totalVariableCosts +
                financialHealth.totalProductCosts
              ).toFixed(2)}
            </span>
            <span className="text-[11px] text-[var(--muted)] block mt-0.5">
              Pagas hoje: R$ {expensesPaidToday.toFixed(2)}
            </span>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xs">
            <span className="text-xs text-[var(--muted)] block mb-1">
              Contas a Receber / Sinais
            </span>
            <span className="text-xl font-bold text-blue-600">
              R$ {accountsReceivable.toFixed(2)}
            </span>
            <span className="text-[11px] text-[var(--muted)] block mt-0.5">
              Pendentes de quitação
            </span>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xs">
            <span className="text-xs text-[var(--muted)] block mb-1">
              Contas a Pagar Hoje
            </span>
            <span className="text-xl font-bold text-amber-600">
              R$ {billsDueToday.toFixed(2)}
            </span>
            <span className="text-[11px] text-[var(--muted)] block mt-0.5">
              Semana: R$ {financialHealth.billsDueThisWeek.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#fdf8e7] rounded-2xl p-4 border border-[#c59b27]/40 shadow-xs">
            <span className="text-xs font-bold text-[#c59b27] block mb-1">
              Lucro Líquido Real (Est.)
            </span>
            <span className="text-xl font-bold text-[var(--foreground)]">
              R$ {estimatedNetProfit.toFixed(2)}
            </span>
            <span className="text-[10px] text-[var(--muted)] block mt-0.5">
              Já descontando custos e comissões
            </span>
          </div>
        </div>

        {/* TAB 1: VISÃO GERAL & CAIXINHAS */}
        {activeTab === "fluxo" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-[#e6fcf5] rounded-2xl p-5 border border-[#c3fae8] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0ca678] text-white p-3 rounded-xl">
                    <ArrowDownCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#087f5b] text-base">
                      Entrada Total Hoje
                    </h3>
                    <p className="text-[#20c997] text-xs font-medium">
                      Receitas realizadas hoje
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#087f5b]">
                  R$ {dailyRevenue.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#fff5f5] rounded-2xl p-5 border border-[#ffe3e3] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#e03131] text-white p-3 rounded-xl">
                    <ArrowUpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#c92a2a] text-base">
                      Despesas Pagas Hoje
                    </h3>
                    <p className="text-[#fa5252] text-xs font-medium">
                      Saídas registradas na data de hoje
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#c92a2a]">
                  R$ {expensesPaidToday.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#f3f0ff] rounded-2xl p-5 border border-[#e5dbff] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#845ef7] text-white p-3 rounded-xl">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#5f3dc4] text-base">
                      Total Acumulado em Reservas
                    </h3>
                    <p className="text-[#7950f2] text-xs font-medium">
                      Caixinhas de segurança do salão
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#5f3dc4]">
                  R$ {totalReservas.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-sans font-bold tracking-tight text-[var(--foreground)]">
                  Caixinhas & Fundos do Salão
                </h3>
                <button
                  onClick={() => setShowManageFundsModal(true)}
                  className="text-xs font-bold text-[#7e1639] dark:text-[#e27d9a] flex items-center gap-1 hover:underline"
                >
                  <Settings2 size={14} /> Gerenciar Caixinhas
                </button>
              </div>

              {funds.map((fund) => {
                if (!fund.enabled) return null;
                const amount = fundsAccumulated[fund.id] || 0;
                return (
                  <div
                    key={fund.id}
                    className="rounded-2xl p-5 bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-sm text-[var(--foreground)] block">
                        {fund.name}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        Reserva automática de {fund.percentage}% do faturamento
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[#7e1639] dark:text-[#e27d9a]">
                      R$ {amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}

              <div className="bg-[var(--primary-light)] rounded-2xl p-5 border border-[#7e1639] dark:border-[#e27d9a]/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#88234b] font-bold text-sm">
                    <Coins size={18} />
                    Pró-Labore / Retirada Segura
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Livre para você retirar sem afetar as contas do salão
                  </p>
                </div>
                <span className="text-2xl font-bold text-[#88234b]">
                  R$ {safeToWithdraw.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LANÇAMENTOS (RECEITAS, DESPESAS, SINAIS, REEMBOLSOS) */}
        {activeTab === "lancamentos" && (
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-xs">
            <div className="p-4 md:p-5 border-b border-[var(--card-border)] flex justify-between items-center">
              <h3 className="font-bold font-sans font-bold tracking-tight text-[var(--foreground)]">
                Extrato Detalhado de Receitas e Despesas ({ledgerItems.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--muted)] uppercase">
                    <th className="p-3.5 text-left">Data</th>
                    <th className="p-3.5 text-left">Descrição / Categoria</th>
                    <th className="p-3.5 text-left">Pagamento</th>
                    <th className="p-3.5 text-left">Bruto / Desconto / Sinal</th>
                    <th className="p-3.5 text-left">Líquido</th>
                    <th className="p-3.5 text-left">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {ledgerItems.map((item) => {
                    const net = Math.max(0, item.amount - item.discount);
                    return (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)]/50">
                        <td className="p-3.5 font-medium text-[var(--foreground)]">
                          {item.date.split("-").reverse().join("/")}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-[var(--foreground)] block">
                            {item.description}
                          </span>
                          <span className="text-[var(--muted)]">
                            {item.category}{" "}
                            {item.professionalName
                              ? `• Prof. ${item.professionalName}`
                              : ""}
                          </span>
                        </td>
                        <td className="p-3.5 uppercase font-semibold text-[var(--muted)]">
                          {item.paymentMethod.replace("_", " ")}
                        </td>
                        <td className="p-3.5 text-[var(--muted)]">
                          R$ {item.amount.toFixed(2)}
                          {item.discount > 0 && (
                            <span className="text-amber-600 ml-1">
                              (-R$ {item.discount.toFixed(2)} desc.)
                            </span>
                          )}
                          {item.depositAmount > 0 && (
                            <span className="text-blue-600 ml-1">
                              (Sinal R$ {item.depositAmount.toFixed(2)})
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-3.5 font-bold text-sm ${
                            item.type === "income"
                              ? "text-[#0ca678]"
                              : "text-red-600"
                          }`}
                        >
                          {item.type === "income" ? "+" : "-"} R${" "}
                          {net.toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "partial"
                                  ? "bg-blue-50 text-blue-700"
                                  : item.status === "refunded"
                                    ? "bg-gray-200 text-gray-700 line-through"
                                    : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.status === "paid"
                              ? "Pago"
                              : item.status === "partial"
                                ? "Sinal Parcial"
                                : item.status === "refunded"
                                  ? "Reembolsado"
                                  : "A receber/pagar"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {item.source === "manual" && (
                            <div className="flex justify-end gap-1">
                              {item.status !== "paid" && (
                                <button
                                  onClick={() =>
                                    updateTransaction(item.id, {
                                      status: "paid",
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                  title="Marcar como Pago"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                              )}
                              {item.status !== "refunded" && (
                                <button
                                  onClick={() =>
                                    updateTransaction(item.id, {
                                      status: "refunded",
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                                  title="Registrar Reembolso / Estorno"
                                >
                                  <RotateCcw size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteTransaction(item.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                title="Excluir lançamento"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {ledgerItems.length === 0 && (
                <p className="text-center py-10 text-xs text-[var(--muted)]">
                  Nenhum lançamento registrado neste mês.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RESULTADO POR PROFISSIONAL */}
        {activeTab === "profissionais" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resultsByProfessional.map((r) => (
              <div
                key={r.prof.id}
                className="bg-[var(--card-bg)] rounded-2xl p-5 border border-[var(--card-border)] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold font-sans font-bold tracking-tight text-base text-[var(--foreground)]">
                      {r.prof.name}
                    </h4>
                    <span className="text-xs text-[var(--muted)]">
                      {r.prof.specialty} • {r.count} atendimentos no mês
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] text-xs font-bold">
                    {r.prof.commission}% com.
                  </span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-[var(--card-border)] text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Faturamento Bruto:</span>
                    <strong className="text-[var(--foreground)]">
                      R$ {r.grossRevenue.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Custo de Produtos:</span>
                    <strong className="text-orange-600">
                      - R$ {r.productCost.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">
                      Comissão da Profissional:
                    </span>
                    <strong className="text-blue-600">
                      - R$ {r.commissionTotal.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--card-border)] text-sm">
                    <span className="font-bold text-[var(--foreground)]">
                      Resultado Líquido p/ Salão:
                    </span>
                    <strong className="text-[#0ca678]">
                      R$ {r.salonNet.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: FECHAMENTO DIÁRIO DE CAIXA */}
        {activeTab === "fechamento" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
              <h3 className="font-bold font-sans font-bold tracking-tight text-lg text-[var(--foreground)]">
                Conferência e Fechamento de Hoje (
                {todayBreakdown.today.split("-").reverse().join("/")})
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
                  <span className="text-[var(--muted)] block">Recebido em PIX</span>
                  <strong className="text-base text-[var(--foreground)]">
                    R$ {todayBreakdown.byMethod.pix.toFixed(2)}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
                  <span className="text-[var(--muted)] block">
                    Recebido em Cartão Crédito
                  </span>
                  <strong className="text-base text-[var(--foreground)]">
                    R$ {todayBreakdown.byMethod.cartao_credito.toFixed(2)}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
                  <span className="text-[var(--muted)] block">
                    Recebido em Cartão Débito
                  </span>
                  <strong className="text-base text-[var(--foreground)]">
                    R$ {todayBreakdown.byMethod.cartao_debito.toFixed(2)}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
                  <span className="text-[var(--muted)] block">
                    Recebido em Dinheiro
                  </span>
                  <strong className="text-base text-[var(--foreground)]">
                    R$ {todayBreakdown.byMethod.dinheiro.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#e6fcf5] border border-[#c3fae8] flex justify-between items-center">
                <span className="font-bold text-sm text-[#087f5b]">
                  Saldo Líquido do Dia (Entradas - Saídas):
                </span>
                <span className="text-xl font-bold text-[#087f5b]">
                  R${" "}
                  {(
                    todayBreakdown.incomeToday - todayBreakdown.expenseToday
                  ).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() =>
                  closeDailyCash({
                    date: todayBreakdown.today,
                    totalIncome: todayBreakdown.incomeToday,
                    totalExpense: todayBreakdown.expenseToday,
                    netBalance:
                      todayBreakdown.incomeToday - todayBreakdown.expenseToday,
                    byMethod: todayBreakdown.byMethod,
                  })
                }
                className="w-full py-3 rounded-xl bg-linear-to-r from-[#b83b6b] to-[#88234b] text-white font-bold text-xs shadow-md"
              >
                Registrar Fechamento Diário de Caixa
              </button>
            </div>

            <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold font-sans font-bold tracking-tight text-lg text-[var(--foreground)] mb-4">
                Histórico de Fechamentos Diários ({dailyClosings.length})
              </h3>
              {dailyClosings.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-8 text-center">
                  Nenhum fechamento diário salvo ainda.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {dailyClosings.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl border border-[var(--card-border)] flex justify-between items-center text-xs bg-[#fffcf9]"
                    >
                      <div>
                        <span className="font-bold text-[var(--foreground)] block">
                          Dia {c.date.split("-").reverse().join("/")}
                        </span>
                        <span className="text-[var(--muted)]">
                          Entradas: R$ {c.totalIncome.toFixed(2)} • Saídas: R${" "}
                          {c.totalExpense.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-[#0ca678]">
                        Saldo: R$ {c.netBalance.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo Lançamento (Receita / Despesa / Sinal / Desconto) */}
      {showTxModal && (
        <TransactionModal
          defaultType={txDefaultType}
          professionals={professionals}
          onClose={() => setShowTxModal(false)}
          onSave={async (tx) => {
            await addTransaction(tx);
            setShowTxModal(false);
          }}
        />
      )}

      {showManageFundsModal && (
        <ManageFundsModal
          funds={funds}
          onClose={() => setShowManageFundsModal(false)}
          onAdd={addCustomFund}
          onUpdate={updateCustomFund}
          onRemove={removeCustomFund}
        />
      )}
    </div>
  );
}

function TransactionModal({
  defaultType,
  professionals,
  onClose,
  onSave,
}: {
  defaultType: "income" | "expense";
  professionals: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (tx: Omit<FinancialTransaction, "id">) => Promise<void>;
}) {
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(
    defaultType === "income" ? "Venda de Produto" : "Insumos / Produtos",
  );
  const [amount, setAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "pix" | "dinheiro" | "cartao_credito" | "cartao_debito" | "outro"
  >("pix");
  const [status, setStatus] = useState<
    "paid" | "pending" | "partial" | "refunded"
  >("paid");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [professionalId, setProfessionalId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prof = professionals.find((p) => p.id === professionalId);
    await onSave({
      type,
      description,
      category,
      amount: Number(amount) || 0,
      discount: Number(discount) || 0,
      depositAmount: Number(depositAmount) || 0,
      paymentMethod,
      status,
      date,
      professionalId: prof?.id,
      professionalName: prof?.name,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-sans font-bold tracking-tight text-[var(--foreground)]">
            {type === "income"
              ? "Registrar Nova Receita / Entrada"
              : "Registrar Nova Despesa / Saída"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface-hover)] rounded-xl">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 rounded-lg font-bold ${
                type === "income"
                  ? "bg-[#0ca678] text-white"
                  : "text-[var(--muted)]"
              }`}
            >
              Receita (Entrada)
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 rounded-lg font-bold ${
                type === "expense" ? "bg-red-600 text-white" : "text-[var(--muted)]"
              }`}
            >
              Despesa (Saída)
            </button>
          </div>

          <div>
            <label className="font-bold text-[var(--foreground)] block mb-1">
              Descrição *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Venda de Kit Home Care / Compra de Esmaltes"
              className="w-full p-2.5 border border-[var(--card-border)] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Valor Bruto (R$) *
              </label>
              <CurrencyInput
                value={amount}
                onChangeValue={setAmount}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Desconto (R$)
              </label>
              <CurrencyInput
                value={discount}
                onChangeValue={setDiscount}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl text-amber-600 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Sinal Pago (R$)
              </label>
              <CurrencyInput
                value={depositAmount}
                onChangeValue={setDepositAmount}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl text-blue-600 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl"
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl"
              >
                <option value="paid">Pago / Recebido</option>
                <option value="partial">Sinal / Pagamento Parcial</option>
                <option value="pending">Conta a Pagar / Receber</option>
              </select>
            </div>
          </div>

          {type === "income" && professionals.length > 0 && (
            <div>
              <label className="font-bold text-[var(--foreground)] block mb-1">
                Vincular Profissional (Opcional)
              </label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full p-2.5 border border-[var(--card-border)] rounded-xl"
              >
                <option value="">Receita geral do salão</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#7e1639] text-white font-bold"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageFundsModal({
  funds,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
}: {
  funds: CustomFund[];
  onClose: () => void;
  onAdd: (f: Omit<CustomFund, "id">) => void;
  onUpdate: (id: string, f: Partial<CustomFund>) => void;
  onRemove: (id: string) => void;
}) {
  const [newFundName, setNewFundName] = useState("");
  const [newFundPercent, setNewFundPercent] = useState(5);
  const [newFundColor, setNewFundColor] = useState("emerald");

  const handleAdd = () => {
    if (!newFundName) return;
    onAdd({
      name: newFundName,
      percentage: newFundPercent,
      color: newFundColor,
      enabled: true,
    });
    setNewFundName("");
    setNewFundPercent(5);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-sans font-bold tracking-tight text-[var(--foreground)]">
            Gerenciar Caixinhas de Reserva
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {funds.map((fund) => (
            <div
              key={fund.id}
              className="flex items-center gap-3 p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--card-border)]"
            >
              <input
                className="font-bold text-xs text-[var(--foreground)] bg-transparent outline-none flex-1"
                value={fund.name}
                onChange={(e) => onUpdate(fund.id, { name: e.target.value })}
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="w-14 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-1 text-center text-xs font-bold"
                  value={fund.percentage}
                  onChange={(e) =>
                    onUpdate(fund.id, { percentage: Number(e.target.value) })
                  }
                />
                <span className="text-xs text-[var(--muted)]">%</span>
              </div>
              <button
                onClick={() => onRemove(fund.id)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--card-border)] pt-4 space-y-3">
          <h4 className="font-bold text-xs text-[var(--muted)] uppercase">
            Nova Caixinha
          </h4>
          <div className="flex gap-2">
            <input
              placeholder="Nome (ex: Reforma do Salão)"
              className="flex-1 p-2.5 bg-[var(--surface-hover)] rounded-xl text-xs outline-none border border-[var(--card-border)]"
              value={newFundName}
              onChange={(e) => setNewFundName(e.target.value)}
            />
            <input
              type="number"
              placeholder="%"
              className="w-20 p-2.5 bg-[var(--surface-hover)] rounded-xl text-xs outline-none border border-[var(--card-border)]"
              value={newFundPercent}
              onChange={(e) => setNewFundPercent(Number(e.target.value))}
            />
            <button
              onClick={handleAdd}
              disabled={!newFundName}
              className="px-4 py-2.5 bg-[#7e1639] text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
