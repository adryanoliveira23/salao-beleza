"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Gift,
  Ticket,
  Award,
  Send,
  Sparkles,
  Clock,
  Star,
  UserPlus,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from "lucide-react";

export default function MarketingPage() {
  const { profile } = useAuth();
  const {
    clients,
    coupons,
    campaigns,
    addCoupon,
    deleteCoupon,
    addCampaign,
    updateClient,
  } = useSalonData();

  const [activeTab, setActiveTab] = useState<
    "return_list" | "campaigns" | "coupons" | "loyalty"
  >("return_list");

  // Coupon Modal
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(15);
  const [couponType, setCouponType] = useState<"percent" | "fixed">("percent");
  const [couponValidUntil, setCouponValidUntil] = useState("");

  // Campaign Form
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSegment, setCampaignSegment] = useState<
    "birthdays" | "inactive" | "vip" | "idle_slots" | "all_consented"
  >("inactive");
  const [campaignMessage, setCampaignMessage] = useState(
    "Oi {nome}! Sentimos sua falta aqui no salão ✨ Reservamos um mimo especial de 15% OFF para seu retorno essa semana. Vamos agendar seu horário? (Responda PARAR para não receber promoções)",
  );

  // Consented clients only (LGPD compliance)
  const consentedClients = useMemo(
    () => clients.filter((c) => c.marketingConsent !== false),
    [clients],
  );

  // Birthday clients this month
  const currentMonth = new Date().getMonth() + 1;
  const birthdayClients = useMemo(() => {
    return clients.filter((c) => {
      if (!c.birthDate) return false;
      const parts = c.birthDate.split("-");
      const month = Number(parts[1]);
      return month === currentMonth;
    });
  }, [clients, currentMonth]);

  // Clients needing to return (inactive > 30 days or nextReturnDate reached)
  const returnList = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return clients.filter((c) => {
      if (c.nextReturnDate && c.nextReturnDate <= todayStr) return true;
      if (!c.lastVisit || c.lastVisit === "Nunca") return false;
      const last = new Date(c.lastVisit + "T12:00:00");
      if (isNaN(last.getTime())) return false;
      const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 30;
    });
  }, [clients]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await addCoupon({
      code: couponCode.toUpperCase().replace(/\s+/g, ""),
      discountType: couponType,
      discountValue: Number(couponDiscount),
      validUntil:
        couponValidUntil ||
        new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      active: true,
    });
    setCouponCode("");
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetList = consentedClients;
    if (campaignSegment === "birthdays") {
      targetList = birthdayClients.filter((c) => c.marketingConsent !== false);
    } else if (campaignSegment === "inactive") {
      targetList = returnList.filter((c) => c.marketingConsent !== false);
    } else if (campaignSegment === "vip") {
      targetList = consentedClients.filter((c) => (c.visits || 0) >= 5);
    }

    await addCampaign({
      name: campaignTitle || `Campanha ${campaignSegment}`,
      type:
        campaignSegment === "birthdays"
          ? "birthday"
          : campaignSegment === "inactive"
            ? "inactive"
            : campaignSegment === "idle_slots"
              ? "promo"
              : "review",
      targetAudience: campaignSegment,
      messageTemplate: campaignMessage,
      sentCount: targetList.length,
      conversionCount: 0,
      status: "sent",
    });
    setCampaignTitle("");
  };

  const openWhatsAppDirect = (
    phone: string,
    name: string,
    template: string,
  ) => {
    const clean = phone.replace(/\D/g, "");
    const fullPhone = clean.startsWith("55") ? clean : `55${clean}`;
    const text = template
      .replace(/\{nome\}/gi, name.split(" ")[0])
      .replace(/\{salao\}/gi, profile?.salon_name || "nosso salão");
    window.open(
      `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Marketing, Fidelização & Retorno" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* LGPD Notice Banner */}
        <div className="bg-[var(--card-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">
                Conformidade LGPD & Regras do WhatsApp Ativas
              </h4>
              <p className="text-xs text-[var(--muted)]">
                Apenas clientes com consentimento ativo (
                {consentedClients.length} de {clients.length}) são incluídas em divulgações promocionais.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] w-fit shrink-0">
            {returnList.length} clientes prontas para retorno
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] w-full md:w-fit gap-1 no-scrollbar">
          {[
            {
              id: "return_list",
              label: "Retorno & Aniversários",
              icon: Clock,
            },
            {
              id: "campaigns",
              label: "Campanhas & Horários Ociosos",
              icon: Send,
            },
            { id: "coupons", label: "Cupons de Desconto", icon: Ticket },
            {
              id: "loyalty",
              label: "Fidelidade & Indicação",
              icon: Award,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: RETURN LIST & BIRTHDAYS */}
        {activeTab === "return_list" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Return List */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Clock size={18} className="text-[var(--primary)]" />
                    Lista de Clientes que Precisam Retornar
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Clientes sem visita há +30 dias ou com data provável de retorno atingida
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 tabular-nums">
                  {returnList.length}
                </span>
              </div>

              {returnList.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-8 text-center">
                  Nenhuma cliente pendente de retorno no momento.
                </p>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {returnList.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-sm text-[var(--foreground)]">
                          {c.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          Última visita: {c.lastVisit || "Não registrada"} •
                          Retorno: {c.nextReturnDate || "Sugerido agora"}
                        </p>
                      </div>
                      {c.marketingConsent !== false ? (
                        <button
                          onClick={() =>
                            openWhatsAppDirect(
                              c.phone,
                              c.name,
                              "Oi {nome}! Tudo bem? Já está chegando o período de manutenção do seu procedimento aqui no {salao} ✨ Vamos garantir seu horário dessa semana?",
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          Chamar no WhatsApp
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400">
                          Opt-out LGPD
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Birthdays of the Month */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Gift size={18} className="text-rose-500" />
                    Aniversariantes do Mês
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Envie um presente ou desconto especial de aniversário
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 tabular-nums">
                  {birthdayClients.length}
                </span>
              </div>

              {birthdayClients.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-8 text-center">
                  Nenhuma aniversariante cadastrada neste mês.
                </p>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {birthdayClients.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-sm text-[var(--foreground)]">
                          🎂 {c.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          Nascimento: {c.birthDate} • {c.phone}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          openWhatsAppDirect(
                            c.phone,
                            c.name,
                            "Parabéns, {nome}! 🎂✨ Equipe {salao} deseja muitas felicidades! Preparamos um presente especial para você comemorar ficando ainda mais linda este mês. Vamos agendar?",
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Gift size={13} />
                        Enviar Presente
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CAMPAIGNS & IDLE HOURS */}
        {activeTab === "campaigns" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--primary)]" />
                Criar Campanha Segmentada (Com Consentimento)
              </h3>
              <form onSubmit={handleSaveCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Nome da Campanha *
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Ex: Terça & Quarta Glam - Horários Ociosos"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Público-Alvo
                  </label>
                  <select
                    value={campaignSegment}
                    onChange={(e) =>
                      setCampaignSegment(
                        e.target.value as typeof campaignSegment,
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  >
                    <option value="inactive">
                      Clientes Inativas (+30 dias sem visita)
                    </option>
                    <option value="idle_slots">
                      Promoção para Horários Ociosos da Semana
                    </option>
                    <option value="birthdays">Aniversariantes do Mês</option>
                    <option value="vip">Clientes VIP (+5 visitas)</option>
                    <option value="all_consented">
                      Todas com Opt-in Promocional ({consentedClients.length})
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Mensagem (Use {"{nome}"} para personalizar)
                  </label>
                  <textarea
                    rows={4}
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  Registrar Campanha Autorizada
                </button>
              </form>
            </div>

            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold text-[var(--foreground)] mb-4">
                Histórico de Campanhas & Conversões
              </h3>
              {campaigns.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-8 text-center">
                  Nenhuma campanha registrada ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-[var(--foreground)]">
                          {camp.name}
                        </h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 tabular-nums">
                          {camp.sentCount} elegíveis
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                        {camp.messageTemplate}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-2">
                        Criada em{" "}
                        {new Date(camp.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DISCOUNT COUPONS */}
        {activeTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Plus size={18} className="text-[var(--primary)]" />
                Novo Cupom de Desconto
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ex: GLOW15, NIVER20"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm uppercase font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Tipo
                    </label>
                    <select
                      value={couponType}
                      onChange={(e) =>
                        setCouponType(e.target.value as "percent" | "fixed")
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    >
                      <option value="percent">Percentual (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Desconto
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={couponDiscount}
                      onChange={(e) => setCouponDiscount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Válido Até
                  </label>
                  <input
                    type="date"
                    value={couponValidUntil}
                    onChange={(e) => setCouponValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-sm cursor-pointer"
                >
                  Criar Cupom
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold text-[var(--foreground)] mb-4">
                Cupons Ativos no Salão
              </h3>
              {coupons.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-8 text-center">
                  Nenhum cupom criado ainda.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border-2 border-dashed border-[var(--primary)]/40 bg-[var(--primary-light)]/20 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-lg font-black text-[var(--primary)] tracking-wider">
                          {c.code}
                        </span>
                        <p className="text-xs font-semibold text-[var(--foreground)]">
                          {c.discountType === "fixed"
                            ? `R$ ${c.discountValue.toFixed(2)} OFF`
                            : `${c.discountValue}% de desconto`}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] flex items-center gap-1 mt-1">
                          <Calendar size={11} /> Válido até {c.validUntil} •{" "}
                          {c.usageCount} usos
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LOYALTY, RETURN CARDS & REFERRALS */}
        {activeTab === "loyalty" && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
            <div className="mb-6">
              <h3 className="font-bold text-[var(--foreground)] text-lg">
                Cartão Fidelidade (10 Visitas = Prêmio) & Indicação de Amigas
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Acompanhe os pontos automáticos por visita, adicione selos de indicação e solicite avaliações.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-xs text-[var(--muted)] uppercase">
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Visitas</th>
                    <th className="py-3">Cartão Retorno (10 selos)</th>
                    <th className="py-3">Pontos Fidelidade</th>
                    <th className="py-3 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const stamps = (c.visits || 0) % 10;
                    const points = c.loyaltyPoints ?? (c.visits || 0) * 10;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--card-border)]/60"
                      >
                        <td className="py-3 font-bold text-[var(--foreground)]">
                          {c.name}
                        </td>
                        <td className="py-3 tabular-nums">
                          {c.visits || 0} visitas
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                                  i < stamps
                                    ? "bg-[var(--primary)] text-white"
                                    : "bg-gray-200 text-gray-400"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 font-bold text-[var(--primary)] tabular-nums">
                          {points} pts
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() =>
                              updateClient(c.id, {
                                loyaltyPoints: points + 20,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer"
                            title="Bonificar por indicar uma amiga"
                          >
                            <UserPlus size={12} className="inline mr-1" />
                            +20 pts Indicação
                          </button>
                          <button
                            onClick={() =>
                              openWhatsAppDirect(
                                c.phone,
                                c.name,
                                "Oi {nome}! Obrigada pela visita no {salao} 💖 Como foi sua experiência hoje? Sua avaliação é super importante para nós!",
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold cursor-pointer"
                          >
                            <Star size={12} className="inline mr-1" />
                            Pedir Avaliação
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
