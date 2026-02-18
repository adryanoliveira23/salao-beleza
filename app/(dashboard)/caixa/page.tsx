"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { useFinance, CustomFund } from "@/contexts/FinanceContext";
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
} from "lucide-react";

export default function CaixaPage() {
  const {
    financialHealth,
    isLoading,
    settings,
    addCustomFund,
    removeCustomFund,
    updateCustomFund,
  } = useFinance();
  const [showManageModal, setShowManageModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#820ad1]"></div>
      </div>
    );
  }

  const { dailyRevenue, billsDueToday, safeToWithdraw, fundsAccumulated } =
    financialHealth;

  const expensesPaidToday = 0;
  const totalReservas = Object.values(fundsAccumulated).reduce(
    (a, b) => a + b,
    0,
  );

  // Default funds mapping if customFunds is empty (fallback)
  const funds = settings.customFunds || [];

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Caixa Diário" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <button
              onClick={() => setShowManageModal(true)}
              className="flex items-center justify-center gap-2 bg-white text-[var(--primary)] border border-[var(--primary)] px-4 py-2 rounded-xl font-semibold hover:bg-purple-50 transition-colors w-full md:w-auto"
            >
              <Settings2 size={18} />
              Gerenciar Caixas
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Flow Cards */}
            <div className="space-y-4">
              {/* Entrada Total */}
              <div className="bg-[#e6fcf5] rounded-2xl p-6 border border-[#c3fae8] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0ca678] text-white p-3 rounded-xl">
                    <ArrowDownCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#087f5b] text-lg">
                      Entrada Total
                    </h3>
                    <p className="text-[#20c997] text-sm font-medium">
                      Faturamento do dia
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#087f5b]">
                  R$ {dailyRevenue.toFixed(2)}
                </span>
              </div>

              {/* Despesas Pagas */}
              <div className="bg-[#fff5f5] rounded-2xl p-6 border border-[#ffe3e3] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-[#e03131] text-white p-3 rounded-xl">
                    <ArrowUpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#c92a2a] text-lg">
                      Despesas Pagas
                    </h3>
                    <p className="text-[#ffa8a8] text-sm font-medium">Gastos</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#c92a2a]">
                  R$ {expensesPaidToday.toFixed(2)}
                </span>
              </div>

              {/* Contas a Pagar */}
              <div className="bg-[#fff9db] rounded-2xl p-6 border border-[#ffec99] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-[#f08c00] text-white p-3 rounded-xl">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#d9480f] text-lg">
                      Contas a Pagar
                    </h3>
                    <p className="text-[#fd7e14] text-sm font-medium">
                      Compromissos hoje
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#d9480f]">
                  R$ {billsDueToday.toFixed(2)}
                </span>
              </div>

              {/* Total de Reservas */}
              <div className="bg-[#f3f0ff] rounded-2xl p-6 border border-[#e5dbff] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-[#845ef7] text-white p-3 rounded-xl">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#5f3dc4] text-lg">
                      Total de Reservas
                    </h3>
                    <p className="text-[#7950f2] text-sm font-medium">
                      Fundos de segurança
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#5f3dc4]">
                  R$ {totalReservas.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Right Column: Funds Details */}
            <div className="space-y-4">
              {funds.map((fund) => {
                if (!fund.enabled) return null;
                const amount = fundsAccumulated[fund.id] || 0;

                // Dynamic styling based on fund color
                // Using a map or inline styles for simplicity with user-defined colors
                const colorMap: Record<
                  string,
                  {
                    bg: string;
                    border: string;
                    text: string;
                    sub: string;
                    bar: string;
                  }
                > = {
                  emerald: {
                    bg: "#e6fcf5",
                    border: "#c3fae8",
                    text: "#087f5b",
                    sub: "#20c997",
                    bar: "#0ca678",
                  },
                  orange: {
                    bg: "#fff4e6",
                    border: "#ffe8cc",
                    text: "#d9480f",
                    sub: "#fd7e14",
                    bar: "#f76707",
                  },
                  blue: {
                    bg: "#e7f5ff",
                    border: "#d0ebff",
                    text: "#1864ab",
                    sub: "#228be6",
                    bar: "#1c7ed6",
                  },
                  red: {
                    bg: "#fff5f5",
                    border: "#ffe3e3",
                    text: "#c92a2a",
                    sub: "#fa5252",
                    bar: "#e03131",
                  },
                  violet: {
                    bg: "#f3f0ff",
                    border: "#e5dbff",
                    text: "#5f3dc4",
                    sub: "#7950f2",
                    bar: "#7048e8",
                  },
                };

                const theme = colorMap[fund.color] || colorMap.blue;

                return (
                  <div
                    key={fund.id}
                    className="rounded-2xl p-6 shadow-sm border"
                    style={{
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="flex items-center gap-2 font-bold"
                        style={{ color: theme.text }}
                      >
                        <Wallet size={20} />
                        {fund.name}
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-bold bg-white/50"
                        style={{ color: theme.text }}
                      >
                        {fund.percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p
                          className="text-xs mb-1"
                          style={{ color: theme.sub }}
                        >
                          Acumulado
                        </p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: theme.text }}
                        >
                          R$ {amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-white/50 h-2 rounded-full mt-4 overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: "45%", backgroundColor: theme.bar }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* Lucro Seguro (Fixed) */}
              <div className="bg-[#f8f0fc] rounded-2xl p-6 border border-[#eebefa] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-[#862e9c] font-bold">
                    <Coins size={20} />
                    Lucro Seguro (Para Retirada)
                  </div>
                  <span className="text-xs bg-[#e599f7] text-[#862e9c] px-2 py-1 rounded-full font-bold">
                    Livre
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-[#be4bdb] mb-1">Disponível</p>
                    <p className="text-2xl font-bold text-[#862e9c]">
                      R$ {safeToWithdraw.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-[#f3d9fa] h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-[#be4bdb] h-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showManageModal && (
        <ManageFundsModal
          funds={funds}
          onClose={() => setShowManageModal(false)}
          onAdd={addCustomFund}
          onUpdate={updateCustomFund}
          onRemove={removeCustomFund}
        />
      )}
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
  const [newFundColor, setNewFundColor] = useState("blue");

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Gerenciar Caixas / Fundos
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {funds.map((fund) => (
            <div
              key={fund.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div
                className={`w-4 h-4 rounded-full bg-${fund.color}-500 shrink-0`}
              ></div>
              <div className="flex-1">
                <input
                  className="font-bold text-gray-700 bg-transparent outline-none w-full"
                  value={fund.name}
                  onChange={(e) => onUpdate(fund.id, { name: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">%</span>
                <input
                  type="number"
                  className="w-12 bg-white border border-gray-200 rounded p-1 text-center font-bold"
                  value={fund.percentage}
                  onChange={(e) =>
                    onUpdate(fund.id, { percentage: Number(e.target.value) })
                  }
                />
              </div>
              <button
                onClick={() => onRemove(fund.id)}
                className="text-red-400 hover:text-red-600 p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-bold text-sm text-gray-500 mb-4">
            ADICIONAR NOVO CAIXA
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nome do Fundo (ex: Marketing)"
              className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none"
              value={newFundName}
              onChange={(e) => setNewFundName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="%"
                className="w-20 p-3 bg-gray-50 rounded-xl border-none outline-none"
                value={newFundPercent}
                onChange={(e) => setNewFundPercent(Number(e.target.value))}
              />
              <select
                className="flex-1 p-3 bg-gray-50 rounded-xl border-none outline-none"
                value={newFundColor}
                onChange={(e) => setNewFundColor(e.target.value)}
              >
                <option value="emerald">Verde</option>
                <option value="blue">Azul</option>
                <option value="orange">Laranja</option>
                <option value="red">Vermelho</option>
                <option value="violet">Roxo</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newFundName}
            className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            Criar Caixa
          </button>
        </div>
      </div>
    </div>
  );
}
