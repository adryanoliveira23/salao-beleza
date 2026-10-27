"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  useSalonData,
  SalonSubscriptionPlan,
} from "@/contexts/SalonDataContext";
import {
  Crown,
  Check,
  Plus,
  Trash2,
  Edit3,
  X,
  Users,
  AlertTriangle,
} from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useToast } from "@/contexts/ToastContext";

export default function AssinaturasPage() {
  const {
    subscriptionPlans,
    addSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
  } = useSalonData();

  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SalonSubscriptionPlan | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(149.9);
  const [frequency, setFrequency] = useState<"Mensal" | "Trimestral" | "Semestral">("Mensal");
  const [featuresText, setFeaturesText] = useState("");
  const [subscribersCount, setSubscribersCount] = useState(0);

  // Estado para confirmação de exclusão
  const [planToDelete, setPlanToDelete] = useState<SalonSubscriptionPlan | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const openCreate = () => {
    setEditingPlan(null);
    setName("");
    setPrice(149.9);
    setFrequency("Mensal");
    setFeaturesText("");
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

    if (!name.trim()) {
      toast.error("Informe o nome do clube");
      return;
    }

    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, {
          name: name.trim(),
          price: Number(price),
          frequency,
          features,
          subscribersCount: Number(subscribersCount),
        });
        toast.success("Clube de assinatura atualizado com sucesso!");
      } else {
        await addSubscriptionPlan({
          name: name.trim(),
          price: Number(price),
          frequency,
          features,
          subscribersCount: Number(subscribersCount),
          active: true,
        });
        toast.success("Novo clube de assinatura criado!");
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Erro ao salvar clube de assinatura.");
    }
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteSubscriptionPlan(planToDelete.id);
      toast.info(`Clube "${planToDelete.name}" removido com sucesso.`);
      setPlanToDelete(null);
    } catch {
      toast.error("Erro ao remover o clube.");
    }
  };

  const confirmDeleteAll = async () => {
    try {
      for (const plan of subscriptionPlans) {
        await deleteSubscriptionPlan(plan.id);
      }
      toast.info("Todos os clubes foram removidos.");
      setIsDeletingAll(false);
    } catch {
      toast.error("Erro ao remover clubes.");
    }
  };

  const totalMRR = subscriptionPlans.reduce(
    (sum, p) => sum + p.price * (p.subscribersCount || 0),
    0,
  );

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F5] dark:bg-[#151419] text-[#221A1D] dark:text-[#F4EEF1] transition-colors duration-200 font-sans">
      <Header title="Clubes de Assinatura" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Superior com Estatísticas e Ações */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1C1A22] p-5 sm:p-6 rounded-3xl border border-[#EDE6E1] dark:border-white/[0.08] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#E27D9A] flex items-center justify-center">
                  <Crown size={18} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1]">
                  Clubes & Planos Recorrentes
                </h2>
              </div>
              <p className="text-stone-500 dark:text-[#A0949C] text-xs sm:text-sm mt-1">
                Gerencie planos mensais personalizados para garantir receita previsível no seu salão.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/10 text-left md:text-right flex-1 md:flex-initial">
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block tracking-wider">
                  Receita Recorrente (MRR)
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  R$ {totalMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                </span>
              </div>

              {subscriptionPlans.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDeletingAll(true)}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Remover todos os clubes cadastrados"
                >
                  <Trash2 size={15} />
                  <span>Remover Todos</span>
                </button>
              )}

              <button
                type="button"
                onClick={openCreate}
                className="bg-[#7E1639] hover:bg-[#9E204A] text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs font-semibold text-xs sm:text-sm cursor-pointer flex-1 md:flex-initial"
              >
                <Plus size={16} />
                <span>Criar Novo Clube</span>
              </button>
            </div>
          </div>

          {/* Grid de Clubes Reais */}
          {subscriptionPlans.length === 0 ? (
            /* Estado Vazio Limpo (Sem modelos falsos hardcoded) */
            <div className="bg-white dark:bg-[#1C1A22] rounded-3xl p-10 sm:p-14 text-center border border-dashed border-[#EDE6E1] dark:border-white/[0.12] max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/20 dark:text-[#E27D9A] flex items-center justify-center mx-auto mb-4">
                <Crown size={32} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                Nenhum clube de assinatura ativo
              </h3>
              <p className="text-stone-500 dark:text-[#A0949C] text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
                Você pode criar planos exclusivos de assinatura (como pacotes de escova, manicure ou hidratação recorrente) para suas clientes.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-6 inline-flex items-center gap-2 bg-[#7E1639] hover:bg-[#9E204A] text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Criar Meu Primeiro Clube</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-[#1C1A22] rounded-3xl p-6 shadow-xs border border-[#EDE6E1] dark:border-white/[0.08] flex flex-col justify-between hover:border-[#7E1639]/40 dark:hover:border-[#E27D9A]/40 transition-all group"
                >
                  <div>
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#E27D9A]">
                        <Crown size={22} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(plan)}
                          className="p-2 rounded-xl text-stone-400 hover:text-[#7E1639] dark:hover:text-[#E27D9A] hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title="Editar clube"
                          aria-label="Editar clube"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanToDelete(plan)}
                          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Remover clube"
                          aria-label="Remover clube"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Nome e Preço */}
                    <h3 className="text-lg font-bold text-[#221A1D] dark:text-[#F4EEF1] mt-4">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#7E1639] dark:text-[#E27D9A] tabular-nums">
                        R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-stone-500 dark:text-[#A0949C] text-xs">
                        /{plan.frequency}
                      </span>
                    </div>

                    {/* Benefícios Inclusos */}
                    <div className="mt-4 space-y-2 border-t border-stone-100 dark:border-white/[0.06] pt-3.5">
                      {plan.features.length > 0 ? (
                        plan.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} />
                            </div>
                            <span className="text-xs text-stone-700 dark:text-stone-300 leading-tight">
                              {feat}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-400 italic">Nenhum benefício detalhado.</p>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card com Assinantes e Botão Dedicado de Remoção */}
                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-white/[0.06] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-500 dark:text-[#A0949C] flex items-center gap-1.5 tabular-nums">
                        <Users size={14} className="text-[#7E1639] dark:text-[#E27D9A]" />
                        <span>{plan.subscribersCount || 0} assinantes ativas</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSubscriptionPlan(plan.id, {
                            subscribersCount: (plan.subscribersCount || 0) + 1,
                          })
                        }
                        className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] hover:underline cursor-pointer"
                      >
                        +1 Assinante
                      </button>
                    </div>

                    {/* Botão Explícito de Remoção em Todos os Clubes */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] hover:bg-stone-200/80 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanToDelete(plan)}
                        className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title={`Remover clube ${plan.name}`}
                      >
                        <Trash2 size={13} />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1A22] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-[#EDE6E1] dark:border-white/[0.12] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#E27D9A] flex items-center justify-center">
                  <Crown size={16} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                  {editingPlan ? "Editar Clube" : "Novo Clube de Assinatura"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 tracking-wider">
                  Nome do Clube *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] bg-[#FAF7F5] dark:bg-[#151419] text-sm text-[#221A1D] dark:text-[#F4EEF1] focus:outline-none focus:ring-1 focus:ring-[#7E1639]"
                  placeholder="Ex: Clube Vip da Escova"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 tracking-wider">
                    Valor (R$) *
                  </label>
                  <CurrencyInput
                    value={price}
                    onChangeValue={setPrice}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] bg-[#FAF7F5] dark:bg-[#151419] text-sm font-bold text-[#7E1639] dark:text-[#E27D9A] focus:outline-none focus:ring-1 focus:ring-[#7E1639]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 tracking-wider">
                    Ciclo de Cobrança
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as typeof frequency)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] bg-[#FAF7F5] dark:bg-[#151419] text-sm text-[#221A1D] dark:text-[#F4EEF1] focus:outline-none focus:ring-1 focus:ring-[#7E1639]"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 tracking-wider">
                  Benefícios Inclusos (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] bg-[#FAF7F5] dark:bg-[#151419] text-xs sm:text-sm text-[#221A1D] dark:text-[#F4EEF1] focus:outline-none focus:ring-1 focus:ring-[#7E1639] resize-none"
                  placeholder="Ex: 4 Escovas no mês&#10;1 Hidratação profunda&#10;10% OFF em produtos"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 tracking-wider">
                  Assinantes Iniciais
                </label>
                <input
                  type="number"
                  min="0"
                  value={subscribersCount}
                  onChange={(e) => setSubscribersCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] bg-[#FAF7F5] dark:bg-[#151419] text-sm text-[#221A1D] dark:text-[#F4EEF1] focus:outline-none focus:ring-1 focus:ring-[#7E1639]"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-3">
                {editingPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = editingPlan;
                      setIsModalOpen(false);
                      setPlanToDelete(target);
                    }}
                    className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Excluir este clube"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#7E1639] hover:bg-[#9E204A] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingPlan ? "Salvar Alterações" : "Criar Clube"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de 1 Clube */}
      {planToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1A22] rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl border border-[#EDE6E1] dark:border-white/[0.12] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-[#221A1D] dark:text-[#F4EEF1]">
              Remover Clube de Assinatura?
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#A0949C] mt-1.5 leading-relaxed">
              Tem certeza que deseja remover o clube <strong>&ldquo;{planToDelete.name}&rdquo;</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Todos os Clubes */}
      {isDeletingAll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1A22] rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl border border-[#EDE6E1] dark:border-white/[0.12] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-[#221A1D] dark:text-[#F4EEF1]">
              Remover Todos os Clubes?
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#A0949C] mt-1.5 leading-relaxed">
              Todos os {subscriptionPlans.length} clubes de assinatura serão excluídos permanentemente. Deseja continuar?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setIsDeletingAll(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EDE6E1] dark:border-white/[0.12] text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Remover Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
