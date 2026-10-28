"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Receipt,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useFinance, VariableCost } from "@/contexts/FinanceContext";
import { CurrencyInput } from "@/components/CurrencyInput";

export default function CustosPage() {
  const {
    fixedCosts,
    addFixedCost,
    deleteFixedCost,
    toggleFixedCostPaid,
    variableCosts,
    addVariableCost,
    deleteVariableCost,
  } = useFinance();

  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);

  // Fixed Cost Form
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dayDue, setDayDue] = useState("");

  // Variable Cost Form
  const [varName, setVarName] = useState("");
  const [varAmount, setVarAmount] = useState<number>(0);
  const [varDate, setVarDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [varCategory, setVarCategory] =
    useState<VariableCost["category"]>("product");

  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount <= 0 || !dayDue) return;

    await addFixedCost({
      name,
      amount,
      dayDue: Number(dayDue),
    });

    setName("");
    setAmount(0);
    setDayDue("");
    setIsFixedModalOpen(false);
  };

  const handleAddVariableCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varName || varAmount <= 0) return;

    await addVariableCost({
      name: varName,
      amount: varAmount,
      date: varDate,
      category: varCategory,
    });

    setVarName("");
    setVarAmount(0);
    setIsVariableModalOpen(false);
  };

  const totalFixed = fixedCosts.reduce((acc, c) => acc + c.amount, 0);
  const totalFixedPaid = fixedCosts
    .filter((c) => c.paid)
    .reduce((acc, c) => acc + c.amount, 0);
  const totalVariable = variableCosts.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)]">
      <Header title="Gestão de Custos e Despesas" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl shadow-xs border border-[var(--card-border)] flex items-center justify-between">
            <div>
              <p className="text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
                Total Despesas Fixas
              </p>
              <h3 className="text-2xl font-bold text-[var(--foreground)] tabular-nums mt-1">
                R$ {totalFixed.toFixed(2)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl shadow-xs border border-[var(--card-border)] flex items-center justify-between">
            <div>
              <p className="text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
                Fixas Pagas no Mês
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                R$ {totalFixedPaid.toFixed(2)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl shadow-xs border border-[var(--card-border)] flex items-center justify-between">
            <div>
              <p className="text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
                Despesas Variáveis & Extras
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                R$ {totalVariable.toFixed(2)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </div>
        </div>

        {/* Fixed Costs Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
                Despesas Fixas Mensais (Aluguel, Luz, Internet, Contador)
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Clique no círculo para marcar como paga no mês atual
              </p>
            </div>
            <button
              onClick={() => setIsFixedModalOpen(true)}
              className="bg-[#7e1639] hover:bg-[#64112e] text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-xs font-bold shadow-xs w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              Nova Despesa Fixa
            </button>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xs border border-[var(--card-border)] overflow-hidden">
            {fixedCosts.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)] text-xs">
                Nenhuma despesa fixa cadastrada. Adicione aluguel, energia e
                internet para calcular seu lucro real.
              </div>
            ) : (
              <div className="divide-y divide-[var(--card-border)]">
                {fixedCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="p-4 md:p-5 flex items-center justify-between hover:bg-[var(--surface-hover)] transition"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleFixedCostPaid(cost.id, !cost.paid)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition cursor-pointer ${
                          cost.paid
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-stone-300 dark:border-stone-600 text-transparent hover:border-emerald-500"
                        }`}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <div>
                        <h4
                          className={`font-bold text-sm text-[var(--foreground)] ${
                            cost.paid ? "line-through opacity-50" : ""
                          }`}
                        >
                          {cost.name}
                        </h4>
                        <p className="text-xs text-[var(--muted)]">
                          Vencimento todo dia {cost.dayDue}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-[var(--foreground)] tabular-nums">
                        R$ {cost.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => deleteFixedCost(cost.id)}
                        className="text-stone-400 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-500/10 cursor-pointer"
                        title="Excluir despesa fixa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variable Costs Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
                Despesas Variáveis (Produtos, Manutenção, Marketing, Impostos)
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Gastos pontuais do dia a dia do salão
              </p>
            </div>
            <button
              onClick={() => setIsVariableModalOpen(true)}
              className="bg-[var(--card-bg)] border border-[#7e1639] text-[#7e1639] dark:text-[#e27d9a] px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--primary-light)] transition text-xs font-bold w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              Nova Despesa Variável
            </button>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xs border border-[var(--card-border)] overflow-hidden">
            {variableCosts.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)] text-xs">
                Nenhuma despesa variável registrada neste período.
              </div>
            ) : (
              <div className="divide-y divide-[var(--card-border)]">
                {variableCosts.map((vc) => {
                  const catLabels: Record<string, string> = {
                    product: "Produtos & Insumos",
                    maintenance: "Manutenção",
                    marketing: "Marketing & Divulgação",
                    tax: "Impostos & Taxas",
                    other: "Outros",
                  };
                  return (
                    <div
                      key={vc.id}
                      className="p-4 md:p-5 flex items-center justify-between hover:bg-[var(--surface-hover)] transition"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-[var(--foreground)]">
                          {vc.name}
                        </h4>
                        <p className="text-xs text-[var(--muted)]">
                          {catLabels[vc.category] || vc.category} •{" "}
                          {vc.date.split("-").reverse().join("/")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-amber-600 dark:text-amber-400 tabular-nums">
                          R$ {vc.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteVariableCost(vc.id)}
                          className="text-stone-400 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-500/10 cursor-pointer"
                          title="Excluir despesa variável"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Fixed Cost Modal */}
      {isFixedModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Adicionar Despesa Fixa
              </h3>
              <button
                onClick={() => setIsFixedModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleAddFixedCost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Nome da Despesa
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aluguel do Espaço"
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7e1639]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Valor (R$) *
                  </label>
                  <CurrencyInput
                    value={amount}
                    onChangeValue={setAmount}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3.5 py-2.5 outline-none font-bold text-[#7e1639] dark:text-[#e27d9a] focus:border-[#7e1639]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayDue}
                    onChange={(e) => setDayDue(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7e1639]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7e1639] hover:bg-[#64112e] text-white font-bold py-3 rounded-xl mt-2 transition cursor-pointer shadow-xs"
              >
                Salvar Despesa Fixa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Variable Cost Modal */}
      {isVariableModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Adicionar Despesa Variável
              </h3>
              <button
                onClick={() => setIsVariableModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form
              onSubmit={handleAddVariableCost}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Descrição do Gasto
                </label>
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Ex: Reposição de esmaltes e acetona"
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7e1639]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Valor (R$) *
                  </label>
                  <CurrencyInput
                    value={varAmount}
                    onChangeValue={setVarAmount}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3.5 py-2.5 outline-none font-bold text-[#7e1639] dark:text-[#e27d9a] focus:border-[#7e1639]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={varDate}
                    onChange={(e) => setVarDate(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7e1639]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Categoria
                </label>
                <select
                  value={varCategory}
                  onChange={(e) =>
                    setVarCategory(e.target.value as VariableCost["category"])
                  }
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7e1639]"
                >
                  <option value="product">Produtos & Insumos</option>
                  <option value="maintenance">Manutenção & Equipamentos</option>
                  <option value="marketing">Marketing & Anúncios</option>
                  <option value="tax">Impostos & Taxas</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7e1639] hover:bg-[#64112e] text-white font-bold py-3 rounded-xl mt-2 transition cursor-pointer shadow-xs"
              >
                Salvar Despesa Variável
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
