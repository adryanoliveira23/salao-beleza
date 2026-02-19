"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Crown, Check, Plus } from "lucide-react";

export default function AssinaturasPage() {
  const examplePlan = {
    name: "Clube da Escova (Exemplo)",
    price: 149.9,
    frequency: "Mensal",
    features: [
      "4 Escovas no mês",
      "1 Hidratação Profunda",
      "10% OFF em produtos",
    ],
    color: "bg-purple-100 text-purple-700",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Meus Planos de Assinatura" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 font-outfit">
                Seus Planos
              </h2>
              <p className="text-gray-500 text-sm">
                Crie seus próprios clubes e fidelize suas clientes com
                recorrência.
              </p>
            </div>
            <button className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-all shadow-lg shadow-purple-200 active:scale-95">
              <Plus size={20} />
              Criar Novo Plano
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Empty State / Instruction */}
            <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white rounded-3xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-[var(--primary)] mb-4">
                <Plus size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Ainda não há planos próprios
              </h3>
              <p className="text-gray-500 max-w-sm mb-6">
                Você ainda não criou nenhum plano de assinatura personalizado
                para o seu salão.
              </p>
              <button className="text-[var(--primary)] font-bold hover:underline">
                Começar agora
              </button>
            </div>

            {/* Template Example */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--primary-light)] relative overflow-hidden group border-opacity-50">
              <div className="absolute top-4 right-4 z-20">
                <span className="bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Template Exemplo
                </span>
              </div>

              <div
                className={`absolute top-0 right-0 w-32 h-32 ${examplePlan.color} rounded-bl-[100px] -mr-8 -mt-8 opacity-20`}
              ></div>

              <div className="relative z-10">
                <Crown className="w-10 h-10 text-[var(--primary)] mb-4" />
                <h3 className="text-2xl font-bold font-outfit text-gray-800">
                  {examplePlan.name}
                </h3>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-3xl font-bold text-[var(--primary)]">
                    R$ {examplePlan.price.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    /{examplePlan.frequency}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {examplePlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Check size={12} />
                    </div>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled
                className="w-full mt-8 py-3 rounded-xl bg-gray-100 text-gray-400 font-bold cursor-not-allowed"
              >
                Usar como Base
              </button>
            </div>
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
                Crie um plano &quot;Ilimitado&quot;
              </h3>
              <p className="text-purple-100 mb-6">
                Analisando seu histórico, clientes que fazem pé e mão a cada 15
                dias gastam em média R$ 180. Ofereça um plano &quot;Mãos e Pés
                Ilimitados&quot; por R$ 199,90. Você aumenta o ticket médio e
                garante a visita frequente (abrindo chance para vender
                hidratações).
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
