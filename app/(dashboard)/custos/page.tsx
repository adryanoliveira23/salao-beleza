"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Header } from "@/components/Header";
import { useFinance } from "@/contexts/FinanceContext";

export default function CustosPage() {
  const { fixedCosts, addFixedCost, toggleFixedCostPaid } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dayDue, setDayDue] = useState("");

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dayDue) return;

    addFixedCost({
      name,
      amount: Number(amount),
      dayDue: Number(dayDue),
    });

    setName("");
    setAmount("");
    setDayDue("");
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Gestão de Custos" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Despesas Fixas</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  R${" "}
                  {fixedCosts.reduce((acc, c) => acc + c.amount, 0).toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <DollarSign />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Já Pago este Mês</p>
                <h3 className="text-2xl font-bold text-green-600">
                  R${" "}
                  {fixedCosts
                    .filter((c) => c.paid)
                    .reduce((acc, c) => acc + c.amount, 0)
                    .toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-outfit">
              Despesas Recorrentes
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-md shadow-purple-200"
            >
              <Plus size={18} />
              Nova Despesa
            </button>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {fixedCosts.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={24} />
                </div>
                <p>Nenhuma despesa cadastrada.</p>
                <p className="text-sm">
                  Adicione aluguel, luz, internet para começar a controlar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {fixedCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleFixedCostPaid(cost.id, !cost.paid)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${cost.paid ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent hover:border-green-400"}`}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <div>
                        <h4
                          className={`font-semibold text-gray-800 ${cost.paid ? "line-through text-gray-400" : ""}`}
                        >
                          {cost.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Vence dia {cost.dayDue}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="font-bold text-gray-800">
                        R$ {cost.amount.toFixed(2)}
                      </span>
                      <button className="text-gray-300 hover:text-red-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Cost Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-outfit">
                Adicionar Despesa
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAddCost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Despesa
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aluguel do Salão"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      R$
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayDue}
                    onChange={(e) => setDayDue(e.target.value)}
                    placeholder="Dia"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-3 rounded-xl mt-4 transition-colors shadow-lg shadow-purple-200/50"
              >
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
