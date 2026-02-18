"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  Sparkles,
  Target,
  Zap,
  MapPin,
  TrendingUp,
  Calculator,
} from "lucide-react";

export default function IAConsultoraPage() {
  const [activeTab, setActiveTab] = useState<"strategy" | "pricing">(
    "strategy",
  );

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="IA Consultora" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab("strategy")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "strategy" ? "bg-[var(--primary)] text-white shadow-lg shadow-purple-200" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <Sparkles size={18} />
              Estratégia do Dia
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "pricing" ? "bg-[var(--primary)] text-white shadow-lg shadow-purple-200" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <Calculator size={18} />
              Calculadora de Preço
            </button>
          </div>

          {activeTab === "strategy" ? (
            <div className="space-y-6">
              {/* Hero Insight */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[var(--primary)] font-bold mb-2">
                    <Zap className="fill-current" />
                    <span>ANÁLISE DIÁRIA</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 font-outfit mb-4">
                    Hoje é um dia de{" "}
                    <span className="text-green-500">Oportunidade Baixa</span>
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Terças-feiras costumam ter 40% menos movimento. Para bater a
                    meta de R$ 800,00 hoje, você precisa de uma estratégia de
                    atração.
                  </p>
                  <div className="mt-6 bg-purple-50 rounded-2xl p-5 border border-purple-100">
                    <h4 className="font-bold text-[var(--primary)] mb-2">
                      Sugestão de Ação:
                    </h4>
                    <p className="text-gray-700">
                      Envie uma mensagem para clientes que fizeram mechas há 45
                      dias:
                      <span className="italic block mt-2 text-gray-500">
                        "Oi [Nome], faz tempo que não te vejo! Que tal hidratar
                        essas mechas hoje com 20% OFF? Tenho horário às 15h!"
                      </span>
                    </p>
                    <button className="mt-4 bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#128C7E] transition-colors">
                      Disparar no WhatsApp
                    </button>
                  </div>
                </div>
                <div className="w-full md:w-1/3 bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <Target size={48} className="text-[var(--primary)] mb-4" />
                  <span className="text-gray-500 text-sm">Meta do Dia</span>
                  <strong className="text-3xl text-gray-800 my-2">
                    R$ 800,00
                  </strong>
                  <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[var(--primary)] h-full w-[35%]"></div>
                  </div>
                  <span className="text-xs text-gray-400 mt-2">
                    35% atingido (R$ 280,00)
                  </span>
                </div>
              </div>

              {/* Upsell Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-green-500" />
                    Oportunidades de Upsell
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-xs font-bold">
                        1
                      </div>
                      <p className="text-sm text-gray-600">
                        Cliente <strong>Maria Silva</strong> vem para{" "}
                        <strong>Escova</strong>. Ofereça{" "}
                        <strong>Ampola de Vitaminas</strong> por +R$ 20,00.
                      </p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-xs font-bold">
                        2
                      </div>
                      <p className="text-sm text-gray-600">
                        Cliente <strong>Joana</strong> faz sempre pé e mão.
                        Sugira <strong>Spa dos Pés</strong> hoje.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="text-orange-500" />
                    Inteligência de Região
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Seus preços de corte estão <strong>15% abaixo</strong> da
                    média do bairro (Jardins).
                  </p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500">Seu Preço (Corte)</p>
                      <p className="font-bold text-gray-800">R$ 60,00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Média Concorrência
                      </p>
                      <p className="font-bold text-gray-800">R$ 85,00</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("pricing")}
                    className="w-full text-[var(--primary)] text-sm font-bold mt-4 hover:underline"
                  >
                    Recalcular meus preços
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 font-outfit mb-6">
                Calculadora de Preço Inteligente
              </h2>
              <form className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custo do Produto (R$)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Ex: 15,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo Gasto (min)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Ex: 60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comissão do Profissional (%)
                  </label>
                  <input
                    type="range"
                    className="w-full accent-[var(--primary)]"
                    min="0"
                    max="100"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro / Perfil de Público
                  </label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--primary)]">
                    <option>Popular (Foco em Volume)</option>
                    <option>Médio (Residencial/Comercial)</option>
                    <option>Alto Padrão (Luxo/Exclusividade)</option>
                  </select>
                </div>

                <div className="p-6 bg-gray-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Preço Sugerido</p>
                    <h3 className="text-3xl font-bold text-green-400">
                      R$ 149,90
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Margem de Lucro</p>
                    <p className="font-bold">32%</p>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
