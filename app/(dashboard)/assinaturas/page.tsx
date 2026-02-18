"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Crown, Check, Plus } from "lucide-react";

export default function AssinaturasPage() {
  const plans = [
    {
      name: "Clube da Escova",
      price: 149.9,
      frequency: "Mensal",
      features: [
        "4 Escovas no mês",
        "1 Hidratação Profunda",
        "10% OFF em produtos",
      ],
      color: "bg-purple-100 text-purple-700",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
    },
    {
      name: "Manicure Vip",
      price: 89.9,
      frequency: "Mensal",
      features: [
        "Mão toda semana (4x)",
        "Pé quinzenal (2x)",
        "Esmalte importado grátis",
      ],
      color: "bg-pink-100 text-pink-700",
      buttonColor: "bg-pink-500 hover:bg-pink-600",
    },
    {
      name: "Rainha do Cronograma",
      price: 299.9,
      frequency: "Mensal",
      features: [
        "4 Tratamentos (H/N/R)",
        "Escova inclusa",
        "Análise Capilar Mensal",
      ],
      color: "bg-amber-100 text-amber-700",
      buttonColor: "bg-amber-500 hover:bg-amber-600",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Clube de Assinaturas" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 font-outfit">
                Planos Ativos
              </h2>
              <p className="text-gray-500 text-sm">
                Crie recorrência e garanta faturamento fixo todo mês.
              </p>
            </div>
            <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-md shadow-purple-200">
              <Plus size={18} />
              Novo Plano
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 ${plan.color} rounded-bl-[100px] -mr-8 -mt-8 opacity-20 transition-opacity group-hover:opacity-30`}
                ></div>

                <div className="relative z-10">
                  <Crown className="w-10 h-10 text-[var(--primary)] mb-4" />
                  <h3 className="text-2xl font-bold font-outfit text-gray-800">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-bold text-[var(--primary)]">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      /{plan.frequency}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <Check size={12} />
                      </div>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full mt-8 py-3 rounded-xl text-white font-bold transition-colors ${plan.buttonColor}`}
                >
                  Editar Plano
                </button>
              </div>
            ))}
          </div>

          {/* AI Suggestion Box */}
          <div className="mt-12 bg-linear-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Crown size={200} />
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4">
                SUGESTÃO DA IA
              </div>
              <h3 className="text-2xl font-bold font-outfit mb-3">
                Crie um plano "Ilimitado"
              </h3>
              <p className="text-purple-100 mb-6">
                Analisando seu histórico, clientes que fazem pé e mão a cada 15
                dias gastam em média R$ 180. Ofereça um plano "Mãos e Pés
                Ilimitados" por R$ 199,90. Você aumenta o ticket médio e garante
                a visita frequente (abrindo chance para vender hidratações).
              </p>
              <button className="bg-white text-[var(--primary)] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                Criar este Plano
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
