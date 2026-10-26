"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  useSalonData,
  SalonSubscriptionPlan,
} from "@/contexts/SalonDataContext";
import { Crown, Check, Plus, Trash2, Edit2, X, Users } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";

export default function AssinaturasPage() {
  const {
    subscriptionPlans,
    addSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
  } = useSalonData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SalonSubscriptionPlan | null>(
    null,
  );
  const [name, setName] = useState("");
  const [price, setPrice] = useState(149.9);
  const [frequency, setFrequency] = useState<
    "Mensal" | "Trimestral" | "Semestral"
  >("Mensal");
  const [featuresText, setFeaturesText] = useState(
    "4 Escovas no mês\n1 Hidratação Profunda\n10% OFF em produtos",
  );
  const [subscribersCount, setSubscribersCount] = useState(0);

  const openCreate = (preset?: {
    name: string;
    price: number;
    frequency: "Mensal" | "Trimestral" | "Semestral";
    features: string[];
  }) => {
    setEditingPlan(null);
    setName(preset?.name || "");
    setPrice(preset?.price || 149.9);
    setFrequency(preset?.frequency || "Mensal");
    setFeaturesText(
      preset
        ? preset.features.join("\n")
        : "4 Escovas no mês\n1 Hidratação Profunda\n10% OFF em produtos",
    );
    setSubscribersCount(0);
    setIsModalOpen(true);
  };

  const openEdit = (plan: SalonSubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setFrequency(plan.frequency);
    setFeaturesText(plan.features.join("\n"));
    setSubscribersCount(plan.subscribersCount || 0);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const features = featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPlan) {
      await updateSubscriptionPlan(editingPlan.id, {
        name,
        price: Number(price),
        frequency,
        features,
        subscribersCount: Number(subscribersCount),
      });
    } else {
      await addSubscriptionPlan({
        name,
        price: Number(price),
        frequency,
        features,
        subscribersCount: Number(subscribersCount),
        active: true,
      });
    }
    setIsModalOpen(false);
  };

  const totalMRR = subscriptionPlans.reduce(
    (sum, p) => sum + p.price * (p.subscribersCount || 0),
    0,
  );

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Clubes & Pacotes de Assinatura Recorrente" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Clubes de Assinatura do Seu Salão
              </h2>
              <p className="text-[var(--muted)] text-sm">
                Crie pacotes mensais recorrentes (ex: Clube da Escova, Unhas Ilimitadas) e garanta receita previsível.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-left md:text-right flex-1 md:flex-initial">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                  Receita Recorrente (MRR)
                </span>
                <span className="text-sm font-bold text-emerald-600 tabular-nums">
                  R$ {totalMRR.toFixed(2)}/mês
                </span>
              </div>
              <button
                onClick={() => openCreate()}
                className="bg-[var(--primary)] text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--primary-dark)] transition-all shadow-sm font-semibold text-sm cursor-pointer flex-1 md:flex-initial"
              >
                <Plus size={18} />
                Criar Novo Clube
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-xs border border-[var(--card-border)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
                      <Crown size={24} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteSubscriptionPlan(plan.id)}
                        className="p-2 rounded-xl text-[var(--muted)] hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[var(--foreground)] mt-4">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-bold text-[var(--primary)] tabular-nums">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-[var(--muted)] text-sm">
                      /{plan.frequency}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                        <span className="text-sm text-[var(--foreground)]">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5 tabular-nums">
                    <Users size={14} /> {plan.subscribersCount || 0} assinantes
                    ativas
                  </span>
                  <button
                    onClick={() =>
                      updateSubscriptionPlan(plan.id, {
                        subscribersCount: (plan.subscribersCount || 0) + 1,
                      })
                    }
                    className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    +1 Assinante
                  </button>
                </div>
              </div>
            ))}

            {/* Template Card */}
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-xs border border-dashed border-[var(--primary)]/50 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Crown className="w-9 h-9 text-[var(--primary)]" />
                  <span className="bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                    Modelo Pronto
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Clube da Escova
                </h3>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl font-bold text-[var(--primary)] tabular-nums">
                    R$ 149,90
                  </span>
                  <span className="text-[var(--muted)] text-xs">/Mensal</span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                  <p>✓ 4 Escovas no mês (Seg a Qui)</p>
                  <p>✓ 1 Hidratação Profunda</p>
                  <p>✓ 10% OFF em produtos Home Care</p>
                </div>
              </div>

              <button
                onClick={() =>
                  openCreate({
                    name: "Clube da Escova",
                    price: 149.9,
                    frequency: "Mensal",
                    features: [
                      "4 Escovas no mês (Seg a Qui)",
                      "1 Hidratação Profunda",
                      "10% OFF em produtos Home Care",
                    ],
                  })
                }
                className="w-full mt-6 py-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-bold text-xs hover:bg-[var(--primary)] hover:text-white transition-all cursor-pointer"
              >
                Usar este Modelo
              </button>
            </div>
          </div>

          {/* AI Suggestion Box */}
          <div className="bg-gradient-to-r from-[#b83b6b] to-[#88234b] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3">
                SUGESTÃO INTELIGENTE DE RECORRÊNCIA
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Crie o plano &quot;Mãos e Pés Sempre Lindos&quot;
              </h3>
              <p className="text-white/90 text-sm mb-6">
                Clientes que fazem manicure a cada 15 dias adoram previsibilidade. Ofereça 4 mãos + 2 pés mensais com prioridade na agenda por R$ 189,90 e fidelize suas clientes o ano inteiro.
              </p>
              <button
                onClick={() =>
                  openCreate({
                    name: "Mãos e Pés Sempre Lindos",
                    price: 189.9,
                    frequency: "Mensal",
                    features: [
                      "4 Manicures completas no mês",
                      "2 Pedicures completas no mês",
                      "Prioridade de horário na agenda",
                    ],
                  })
                }
                className="bg-white text-[#88234b] px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer w-full sm:w-auto"
              >
                Criar este Plano com 1 Clique
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                {editingPlan ? "Editar Clube" : "Novo Clube de Assinatura"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  placeholder="Ex: Clube VIP Sobrancelhas & Cílios"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Valor (R$) *
                  </label>
                  <CurrencyInput
                    value={price}
                    onChangeValue={setPrice}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm font-bold text-rose-600 dark:text-rose-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Ciclo
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as typeof frequency)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Benefícios Inclusos (1 por linha)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Quantidade de Assinantes Ativas
                </label>
                <input
                  type="number"
                  min="0"
                  value={subscribersCount}
                  onChange={(e) => setSubscribersCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--card-border)] text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold"
                >
                  Salvar Clube
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
