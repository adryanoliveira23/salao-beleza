"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useFinance, FinanceSettings } from "@/contexts/FinanceContext";
import { Save, Target, PieChart, Wallet } from "lucide-react";

export default function MetasPage() {
  const { settings, updateSettings } = useFinance();
  const [formData, setFormData] = useState<FinanceSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert("Configurações salvas com sucesso!");
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Configuração de Metas" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Meta Principal */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-3 rounded-xl text-[var(--primary)]">
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-outfit text-gray-800">
                    Objetivo Financeiro
                  </h2>
                  <p className="text-sm text-gray-500">
                    Defina onde você quer chegar este mês.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta de Faturamento Mensal (R$)
                  </label>
                  <input
                    type="number"
                    name="monthlyGoal"
                    value={formData.monthlyGoal}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)] text-lg font-bold text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Distribuição Inteligente */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <PieChart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-outfit text-gray-800">
                    Distribuição Inteligente
                  </h2>
                  <p className="text-sm text-gray-500">
                    Como o sistema deve separar seu dinheiro automaticamente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Impostos (Simples/MEI) %
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa Média Cartão %
                  </label>
                  <input
                    type="number"
                    name="cardFeeRate"
                    value={formData.cardFeeRate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reserva Manutenção/Depreciação %
                  </label>
                  <input
                    type="number"
                    name="reinvestmentRate"
                    value={formData.reinvestmentRate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ex: Compra de equipamentos, reformas.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fundo de Emergência %
                  </label>
                  <input
                    type="number"
                    name="emergencyFundRate"
                    value={formData.emergencyFundRate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Salário da dona */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-xl text-green-600">
                  <Wallet size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-outfit text-gray-800">
                    Seu Salário (Pró-labore)
                  </h2>
                  <p className="text-sm text-gray-500">
                    Quanto você pode retirar do lucro líquido.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retirada Fixa Mensal (R$)
                  </label>
                  <input
                    type="number"
                    name="ownerSalaryFixed"
                    value={formData.ownerSalaryFixed}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentual do Lucro Líquido %
                  </label>
                  <input
                    type="number"
                    name="ownerSalaryPercent"
                    value={formData.ownerSalaryPercent}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Isso define o valor "Pode Retirar" no Dashboard.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-4 rounded-xl text-lg shadow-xl shadow-purple-200 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Salvar Configurações
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
