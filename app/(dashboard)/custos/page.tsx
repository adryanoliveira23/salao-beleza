"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Receipt,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useFinance, VariableCost } from "@/contexts/FinanceContext";

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
  const [amount, setAmount] = useState("");
  const [dayDue, setDayDue] = useState("");

  // Variable Cost Form
  const [varName, setVarName] = useState("");
  const [varAmount, setVarAmount] = useState("");
  const [varDate, setVarDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [varCategory, setVarCategory] =
    useState<VariableCost["category"]>("product");

  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dayDue) return;

    await addFixedCost({
      name,
      amount: Number(amount),
      dayDue: Number(dayDue),
    });

    setName("");
    setAmount("");
    setDayDue("");
    setIsFixedModalOpen(false);
  };

  const handleAddVariableCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varName || !varAmount) return;

    await addVariableCost({
      name: varName,
      amount: Number(varAmount),
      date: varDate,
      category: varCategory,
    });

    setVarName("");
    setVarAmount("");
    setIsVariableModalOpen(false);
  };

  const totalFixed = fixedCosts.reduce((acc, c) => acc + c.amount, 0);
  const totalFixedPaid = fixedCosts
    .filter((c) => c.paid)
    .reduce((acc, c) => acc + c.amount, 0);
  const totalVariable = variableCosts.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="flex flex-col min-h-full bg-[#faf6f2] dark:bg-[#161016]">
      <Header title="Gestão de Custos e Despesas" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#f2e6ea] flex items-center justify-between">
            <div>
              <p className="text-[#6e5a65] text-xs font-semibold">
                Total Despesas Fixas
              </p>
              <h3 className="text-2xl font-bold text-[#2d1b2e]">
                R$ {totalFixed.toFixed(2)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <DollarSign size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#f2e6ea] flex items-center justify-between">
            <div>
              <p className="text-[#6e5a65] text-xs font-semibold">
                Fixas Pagas no Mês
              </p>
              <h3 className="text-2xl font-bold text-[#0ca678]">
                R$ {totalFixedPaid.toFixed(2)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#0ca678]">
              <CheckCircle size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#f2e6ea] flex items-center justify-between">
            <div>
              <p className="text-[#6e5a65] text-xs font-semibold">
                Despesas Variáveis e Extras
              </p>
              <h3 className="text-2xl font-bold text-orange-600">
                R$ {totalVariable.toFixed(2)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <Receipt size={20} />
            </div>
          </div>
        </div>

        {/* Fixed Costs Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#2d1b2e]">
                Despesas Fixas Mensais (Aluguel, Luz, Internet, Contador)
              </h2>
              <p className="text-xs text-[#6e5a65]">
                Clique no círculo para marcar como paga no mês atual
              </p>
            </div>
            <button
              onClick={() => setIsFixedModalOpen(true)}
              className="bg-[#b83b6b] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#88234b] transition text-xs font-bold shadow-xs"
            >
              <Plus size={16} />
              Nova Despesa Fixa
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-[#f2e6ea] overflow-hidden">
            {fixedCosts.length === 0 ? (
              <div className="p-8 text-center text-[#6e5a65] text-xs">
                Nenhuma despesa fixa cadastrada. Adicione aluguel, energia e
                internet para calcular seu lucro real.
              </div>
            ) : (
              <div className="divide-y divide-[#f2e6ea]">
                {fixedCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="p-4 md:p-5 flex items-center justify-between hover:bg-[#faf6f2]/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleFixedCostPaid(cost.id, !cost.paid)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                          cost.paid
                            ? "bg-[#0ca678] border-[#0ca678] text-white"
                            : "border-gray-300 text-transparent hover:border-[#0ca678]"
                        }`}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <div>
                        <h4
                          className={`font-bold text-sm text-[#2d1b2e] ${
                            cost.paid ? "line-through opacity-50" : ""
                          }`}
                        >
                          {cost.name}
                        </h4>
                        <p className="text-xs text-[#6e5a65]">
                          Vencimento todo dia {cost.dayDue}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-[#2d1b2e]">
                        R$ {cost.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => deleteFixedCost(cost.id)}
                        className="text-gray-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50"
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#2d1b2e]">
                Despesas Variáveis (Produtos, Manutenção, Marketing, Impostos)
              </h2>
              <p className="text-xs text-[#6e5a65]">
                Gastos pontuais do dia a dia do salão
              </p>
            </div>
            <button
              onClick={() => setIsVariableModalOpen(true)}
              className="bg-white border border-[#b83b6b] text-[#b83b6b] px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#fff0f5] transition text-xs font-bold"
            >
              <Plus size={16} />
              Nova Despesa Variável
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-[#f2e6ea] overflow-hidden">
            {variableCosts.length === 0 ? (
              <div className="p-8 text-center text-[#6e5a65] text-xs">
                Nenhuma despesa variável registrada neste período.
              </div>
            ) : (
              <div className="divide-y divide-[#f2e6ea]">
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
                      className="p-4 md:p-5 flex items-center justify-between hover:bg-[#faf6f2]/50 transition"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-[#2d1b2e]">
                          {vc.name}
                        </h4>
                        <p className="text-xs text-[#6e5a65]">
                          {catLabels[vc.category] || vc.category} •{" "}
                          {vc.date.split("-").reverse().join("/")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-orange-600">
                          R$ {vc.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteVariableCost(vc.id)}
                          className="text-gray-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-serif text-[#2d1b2e]">
                Adicionar Despesa Fixa
              </h3>
              <button
                onClick={() => setIsFixedModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleAddFixedCost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2d1b2e] mb-1">
                  Nome da Despesa
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aluguel do Espaço"
                  className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2d1b2e] mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2d1b2e] mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayDue}
                    onChange={(e) => setDayDue(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#b83b6b] hover:bg-[#88234b] text-white font-bold py-3 rounded-xl mt-2 transition"
              >
                Salvar Despesa Fixa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Variable Cost Modal */}
      {isVariableModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-serif text-[#2d1b2e]">
                Adicionar Despesa Variável
              </h3>
              <button
                onClick={() => setIsVariableModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form
              onSubmit={handleAddVariableCost}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#2d1b2e] mb-1">
                  Descrição do Gasto
                </label>
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Ex: Reposição de esmaltes e acetona"
                  className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2d1b2e] mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={varAmount}
                    onChange={(e) => setVarAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2d1b2e] mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={varDate}
                    onChange={(e) => setVarDate(e.target.value)}
                    className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-[#2d1b2e] mb-1">
                  Categoria
                </label>
                <select
                  value={varCategory}
                  onChange={(e) =>
                    setVarCategory(e.target.value as VariableCost["category"])
                  }
                  className="w-full border border-[#f2e6ea] rounded-xl px-3.5 py-2.5 outline-none"
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
                className="w-full bg-[#b83b6b] hover:bg-[#88234b] text-white font-bold py-3 rounded-xl mt-2 transition"
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
