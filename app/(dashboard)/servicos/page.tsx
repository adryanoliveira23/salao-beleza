"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Scissors,
  Sparkles,
  Globe,
  Clock,
  Users,
  Search,
  Check,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData, Service } from "@/contexts/SalonDataContext";
import { CurrencyInput } from "@/components/CurrencyInput";

export const BEAUTY_CATEGORIES = [
  "Corte e escova",
  "Coloração e tratamentos capilares",
  "Manicure e pedicure",
  "Alongamento de unhas",
  "Design de sobrancelhas",
  "Extensão de cílios",
  "Maquiagem",
  "Depilação",
  "Limpeza de pele",
  "Massagens e estética",
  "Combos e Pacotes",
] as const;

export default function Services() {
  const {
    services,
    professionals,
    products,
    addService,
    updateService,
    deleteService,
  } = useSalonData();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isComboDefault, setIsComboDefault] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategoriesMobile, setShowAllCategoriesMobile] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of services) {
      if (s.category) {
        counts[s.category] = (counts[s.category] || 0) + 1;
      }
    }
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (selectedCategory === "all") return true;
      if (selectedCategory === "combos") return Boolean(s.isCombo);
      return s.category === selectedCategory;
    });
  }, [services, search, selectedCategory]);

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)]">
      <Header title="Serviços, Combos e Preços" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-5 max-w-[1440px] w-full mx-auto">
        {/* Top Controls */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-3 sm:p-5 shadow-xs border border-[var(--card-border)] flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[var(--background)] px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] flex-1 max-w-md">
              <Search size={18} className="text-[#7e1639] dark:text-[#e27d9a] shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar serviço ou combo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsComboDefault(true);
                  setShowModal(true);
                }}
                className="justify-center px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Sparkles size={16} className="shrink-0" />
                <span className="truncate">Novo Combo</span>
              </button>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsComboDefault(false);
                  setShowModal(true);
                }}
                className="justify-center px-4 py-2.5 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus size={18} className="shrink-0" />
                <span className="truncate">Novo Serviço</span>
              </button>
            </div>
          </div>

          {/* Categories Filter (Em grade flexível para nunca cortar o texto) */}
          <div className="pt-2 border-t border-[var(--card-border)]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs ${
                  selectedCategory === "all"
                    ? "bg-[#7e1639] text-white"
                    : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]"
                }`}
              >
                Todos ({services.length})
              </button>
              <button
                onClick={() => setSelectedCategory("combos")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs ${
                  selectedCategory === "combos"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                Combos & Pacotes ({services.filter((s) => s.isCombo).length})
              </button>

              {BEAUTY_CATEGORIES.filter((c) => c !== "Combos e Pacotes").map((cat, idx) => {
                const count = categoryCounts[cat] || 0;
                const isSelected = selectedCategory === cat;
                // No mobile, se não estiver expandido e índice >= 4 e não selecionado, recolhe
                const hideOnMobile = !showAllCategoriesMobile && idx >= 4 && !isSelected;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs ${
                      hideOnMobile ? "hidden sm:inline-flex" : "inline-flex"
                    } items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#7e1639] text-white"
                        : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]"
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[var(--card-bg)] text-[var(--muted)]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Botão de Expandir / Recolher no Mobile */}
              <button
                type="button"
                onClick={() => setShowAllCategoriesMobile((prev) => !prev)}
                className="sm:hidden px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--surface-hover)] text-[#7e1639] dark:text-[#e27d9a] border border-[var(--card-border)] hover:bg-[var(--card-bg)] transition cursor-pointer inline-flex items-center gap-1"
              >
                <span>{showAllCategoriesMobile ? "Menos filtros" : "+ Mais categorias"}</span>
                {showAllCategoriesMobile ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── MOBILE VIEW: CARDS RESPONSIVOS (OCULTO EM DESKTOP) ─── */}
        <div className="md:hidden space-y-3">
          {filteredServices.map((service) => {
            const enabledCount = service.enabledProfessionals?.length || 0;
            const netMargin =
              service.price -
              (service.costPrice || 0) -
              service.price * ((service.commissionRate || 0) / 100);

            return (
              <div
                key={service.id}
                className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xs flex flex-col gap-3"
              >
                {/* Header do Card Mobile: Ícone + Título + Badges + Ações */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] flex items-center justify-center shrink-0 shadow-2xs">
                      {service.isCombo ? <Sparkles size={18} /> : <Scissors size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-[var(--foreground)] tracking-tight">
                          {service.name}
                        </h3>
                        {service.isCombo && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            Combo {service.packageSessions || 1}x
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] text-[10px] font-bold">
                          {service.category}
                        </span>
                        {service.duration ? (
                          <span className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-medium">
                            <Clock size={11} className="text-[#7e1639] dark:text-[#e27d9a]" />
                            {service.duration} min
                            {(service.bufferTime || 0) > 0 && ` (+${service.bufferTime}m)`}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas (Editar / Excluir) */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => {
                        setEditingService(service);
                        setShowModal(true);
                      }}
                      className="p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[#7e1639] dark:hover:text-[#e27d9a] transition cursor-pointer"
                      title="Editar serviço"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="p-2 rounded-xl text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                      title="Excluir serviço"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {service.description && (
                  <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed bg-[var(--background)] p-2.5 rounded-xl border border-[var(--card-border)]">
                    {service.description}
                  </p>
                )}

                {/* Rodapé do Card Mobile: Preço + Lucro Estimado + Disponibilidade */}
                <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                      Preço de Venda
                    </span>
                    <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                      R$ {service.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] block tabular-nums">
                      Lucro est.: R$ {Math.max(0, netMargin).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-0.5">
                      <Globe
                        size={12}
                        className={
                          service.onlineBookingEnabled !== false
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-stone-400"
                        }
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          service.onlineBookingEnabled !== false
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-stone-400"
                        }`}
                      >
                        {service.onlineBookingEnabled !== false ? "Online & WhatsApp" : "Apenas Interno"}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] block">
                      {enabledCount === 0
                        ? "Todas as profissionais"
                        : `${enabledCount} prof. habilitada(s)`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── DESKTOP VIEW: TABELA COMPLETA (OCULTA EM TELAS MENORES QUE MD) ─── */}
        <div className="hidden md:block bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-xs border border-[var(--card-border)] overflow-x-auto">
          <table className="w-full border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[var(--surface-hover)] border-b border-[var(--card-border)]">
                <th className="p-4 text-left font-bold text-[var(--muted)] text-xs uppercase tracking-wider">
                  Serviço & Descrição
                </th>
                <th className="p-4 text-left font-bold text-[var(--muted)] text-xs uppercase tracking-wider">
                  Categoria
                </th>
                <th className="p-4 text-left font-bold text-[var(--muted)] text-xs uppercase tracking-wider">
                  Duração / Intervalo
                </th>
                <th className="p-4 text-left font-bold text-[var(--muted)] text-xs uppercase tracking-wider">
                  Preço / Custo / Comissão
                </th>
                <th className="p-4 text-left font-bold text-[var(--muted)] text-xs uppercase tracking-wider">
                  Online & Equipe
                </th>
                <th className="p-4 text-right font-bold text-[var(--muted)] text-xs uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredServices.map((service) => {
                const enabledCount = service.enabledProfessionals?.length || 0;
                const netMargin =
                  service.price -
                  (service.costPrice || 0) -
                  service.price * ((service.commissionRate || 0) / 100);

                return (
                  <tr
                    key={service.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] flex items-center justify-center shrink-0">
                          {service.isCombo ? (
                            <Sparkles size={18} />
                          ) : (
                            <Scissors size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--foreground)]">
                              {service.name}
                            </span>
                            {service.isCombo && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                Combo / {service.packageSessions || 1}x
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-xs text-[var(--muted)] line-clamp-1 max-w-xs">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] text-xs font-semibold">
                        {service.category}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-[var(--foreground)]">
                      <div className="font-bold flex items-center gap-1">
                        <Clock size={13} className="text-[#7e1639] dark:text-[#e27d9a]" />
                        {service.duration} min
                      </div>
                      {(service.bufferTime || 0) > 0 && (
                        <span className="text-[11px] text-[var(--muted)]">
                          +{service.bufferTime} min intervalo
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                        R$ {service.price.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] tabular-nums">
                        Custo: R$ {(service.costPrice || 0).toFixed(2)} • Com.:{" "}
                        {service.commissionRate ?? "Padrão"}
                        {service.commissionRate !== undefined ? "%" : ""}
                      </div>
                      <div className="text-[10px] text-[#7e1639] dark:text-[#e27d9a] font-semibold tabular-nums">
                        Lucro est.: R$ {Math.max(0, netMargin).toFixed(2)}
                      </div>
                    </td>

                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Globe
                          size={13}
                          className={
                            service.onlineBookingEnabled !== false
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-stone-400"
                          }
                        />
                        <span
                          className={
                            service.onlineBookingEnabled !== false
                              ? "font-semibold text-emerald-600 dark:text-emerald-400"
                              : "text-stone-400"
                          }
                        >
                          {service.onlineBookingEnabled !== false
                            ? "Visível Online"
                            : "Apenas Interno"}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted)]">
                        {enabledCount === 0
                          ? "Todas as profissionais"
                          : `${enabledCount} prof. habilitada(s)`}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingService(service);
                            setShowModal(true);
                          }}
                          className="p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[#7e1639] dark:hover:text-[#e27d9a] transition cursor-pointer"
                          title="Editar serviço"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="p-2 rounded-xl text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                          title="Excluir serviço"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Estado Vazio (visível em mobile e desktop) */}
        {filteredServices.length === 0 && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-8 border border-[var(--card-border)] text-center shadow-xs">
            <p className="text-[var(--foreground)] font-bold mb-1">
              Nenhum serviço cadastrado nesta visualização.
            </p>
            <p className="text-[var(--muted)] text-xs">
              Clique em &quot;Novo Serviço&quot; ou &quot;Novo Combo&quot;
              para cadastrar seu menu de beleza.
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal
          service={editingService}
          isComboDefault={isComboDefault}
          professionals={professionals}
          products={products}
          onClose={() => {
            setShowModal(false);
            setEditingService(null);
          }}
          onSave={async (data) => {
            if (editingService) {
              await updateService(editingService.id, data);
            } else {
              await addService(data);
            }
            setShowModal(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}

function ServiceModal({
  service,
  isComboDefault,
  professionals,
  products,
  onClose,
  onSave,
}: {
  service: Service | null;
  isComboDefault: boolean;
  professionals: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; unit: string }>;
  onClose: () => void;
  onSave: (data: Omit<Service, "id">) => Promise<void>;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [category, setCategory] = useState(
    service?.category ??
      (isComboDefault ? "Combos e Pacotes" : "Corte e escova"),
  );
  const [duration, setDuration] = useState<number | string>(
    service?.duration !== undefined ? service.duration : 45,
  );
  const [bufferTime, setBufferTime] = useState<number | string>(
    service?.bufferTime !== undefined ? service.bufferTime : "",
  );
  const [price, setPrice] = useState(service?.price ?? 80);
  const [costPrice, setCostPrice] = useState<number>(service?.costPrice ?? 0);
  const [commissionRate, setCommissionRate] = useState<string>(
    service?.commissionRate !== undefined ? String(service.commissionRate) : "",
  );
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(
    service?.onlineBookingEnabled !== undefined
      ? service.onlineBookingEnabled
      : true,
  );
  const [isCombo, setIsCombo] = useState(service?.isCombo ?? isComboDefault);
  const [packageSessions, setPackageSessions] = useState(
    service?.packageSessions ?? 1,
  );
  const [enabledProfessionals, setEnabledProfessionals] = useState<string[]>(
    service?.enabledProfessionals ?? [],
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProdQty, setSelectedProdQty] = useState(1);
  const [usedProducts, setUsedProducts] = useState<
    Array<{ productId: string; quantity: number }>
  >(service?.usedProducts ?? []);

  const toggleProf = (id: string) => {
    setEnabledProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleAddUsedProduct = () => {
    if (!selectedProductId) return;
    setUsedProducts((prev) => [
      ...prev.filter((p) => p.productId !== selectedProductId),
      { productId: selectedProductId, quantity: Number(selectedProdQty) || 1 },
    ]);
    setSelectedProductId("");
    setSelectedProdQty(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      description,
      category,
      duration: Number(duration) || 45,
      bufferTime: Number(bufferTime) || 0,
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      commissionRate:
        commissionRate !== "" ? Number(commissionRate) : undefined,
      onlineBookingEnabled,
      isCombo,
      packageSessions: Number(packageSessions) || 1,
      enabledProfessionals,
      usedProducts,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] sm:bg-black/60 sm:backdrop-blur-xs flex flex-col sm:items-center sm:justify-center sm:p-4">
      <div
        className="bg-[var(--card-bg)] w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:rounded-2xl sm:border sm:border-[var(--card-border)] sm:shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Top App Bar (sm:hidden) */}
        <div className="sm:hidden h-14 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 flex items-center justify-between shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] active:text-[var(--foreground)] -ml-1 p-1.5 rounded-lg active:bg-[var(--surface-hover)] transition cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>
          <h2 className="text-sm font-bold text-[var(--foreground)] truncate max-w-[180px]">
            {service ? "Editar Serviço" : isCombo ? "Novo Combo" : "Novo Serviço"}
          </h2>
          <button
            type="submit"
            form="service-form"
            className="px-3.5 py-1.5 rounded-xl bg-[#7e1639] text-white text-xs font-bold active:scale-95 transition shadow-xs cursor-pointer"
          >
            Salvar
          </button>
        </div>

        {/* Desktop Header (hidden sm:flex) */}
        <div className="hidden sm:flex bg-[var(--card-bg)] px-5 py-3.5 border-b border-[var(--card-border)] items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">
              {service
                ? "Editar Serviço"
                : isCombo
                  ? "Novo Combo / Pacote Promocional"
                  : "Novo Serviço de Beleza"}
            </h3>
            <p className="text-xs text-[var(--muted)]">Preencha as informações do serviço</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-full text-[var(--muted)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário com Corpo Rolável */}
        <form
          id="service-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-24 sm:pb-5 custom-scrollbar bg-[var(--background)] sm:bg-[var(--card-bg)]">
            {/* Bloco 1: Identificação */}
            <div className="bg-[var(--card-bg)] sm:bg-[var(--background)] p-3.5 sm:p-4 rounded-2xl border border-[var(--card-border)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <Scissors size={14} className="text-[#7e1639] dark:text-[#e27d9a]" />
                <span>Dados do Serviço</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Nome do Serviço ou Combo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                  placeholder="Ex: Corte + Escova + Hidratação"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                  >
                    {BEAUTY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      Descrição para a Cliente
                    </label>
                    <span className="text-[10px] text-[var(--muted)]">Opcional</span>
                  </div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                    placeholder="Ex: Inclui lavagem especial"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Precificação & Tempo */}
            <div className="bg-[var(--card-bg)] sm:bg-[var(--background)] p-3.5 sm:p-4 rounded-2xl border border-[var(--card-border)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <Clock size={14} className="text-[#7e1639] dark:text-[#e27d9a]" />
                <span>Preço & Agenda</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Preço (R$) *
                  </label>
                  <CurrencyInput
                    value={price}
                    onChangeValue={(val) => setPrice(val)}
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:border-[#7e1639] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Duração
                    <span className="text-[10px] font-normal text-[var(--muted)] ml-1">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="45 min"
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1 truncate">
                    Custo Estoque
                    <span className="text-[10px] font-normal text-[var(--muted)] ml-1">(opcional)</span>
                  </label>
                  <CurrencyInput
                    value={costPrice}
                    onChangeValue={(val) => setCostPrice(val)}
                    placeholder="R$ 0,00"
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Comissão (%)
                    <span className="text-[10px] font-normal text-[var(--muted)] ml-1">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="Padrão"
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Intervalo (min)
                    <span className="text-[10px] font-normal text-[var(--muted)] ml-1">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={bufferTime}
                    onChange={(e) =>
                      setBufferTime(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="10 min"
                    className="w-full h-10 px-3 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                    title="Tempo de preparação ou limpeza após o atendimento"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Configurações & Disponibilidade */}
            <div className="bg-[var(--card-bg)] sm:bg-[var(--background)] p-3.5 sm:p-4 rounded-2xl border border-[var(--card-border)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <Globe size={14} className="text-[#7e1639] dark:text-[#e27d9a]" />
                <span>Canais & Formato</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Agendamento Online & WhatsApp
                  </span>
                  <input
                    type="checkbox"
                    checked={onlineBookingEnabled}
                    onChange={(e) => setOnlineBookingEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#7e1639] cursor-pointer"
                  />
                </label>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isCombo}
                      onChange={(e) => setIsCombo(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                      É um Combo / Pacote
                    </span>
                  </label>
                  {isCombo && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Sessões:</span>
                      <input
                        type="number"
                        min={1}
                        value={packageSessions}
                        onChange={(e) => setPackageSessions(Number(e.target.value))}
                        className="w-12 h-7 rounded-lg bg-[var(--card-bg)] border border-amber-500/40 text-xs font-bold text-center text-[var(--foreground)]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bloco 4: Profissionais */}
            <div className="bg-[var(--card-bg)] sm:bg-[var(--background)] p-3.5 sm:p-4 rounded-2xl border border-[var(--card-border)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  <Users size={14} className="text-[#7e1639] dark:text-[#e27d9a]" />
                  <span>Profissionais Habilitadas</span>
                </div>
                <span className="text-[10px] text-[var(--muted)] font-medium">
                  {enabledProfessionals.length === 0
                    ? "Todas habilitadas"
                    : `${enabledProfessionals.length} de ${professionals.length}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                {professionals.map((p) => {
                  const selected = enabledProfessionals.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProf(p.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        selected
                          ? "bg-[#7e1639] text-white border-[#7e1639]"
                          : "bg-[var(--background)] sm:bg-[var(--card-bg)] text-[var(--muted)] border-[var(--card-border)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
                {professionals.length === 0 && (
                  <span className="text-xs text-[var(--muted)]">
                    Todas as profissionais do salão estarão habilitadas.
                  </span>
                )}
              </div>
            </div>

            {/* Bloco 5: Baixa de Estoque (se houver produtos) */}
            {products.length > 0 && (
              <div className="bg-[var(--card-bg)] sm:bg-[var(--background)] p-3.5 sm:p-4 rounded-2xl border border-[var(--card-border)] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <Package size={14} className="text-[#7e1639] dark:text-[#e27d9a]" />
                    <span>Baixa de Estoque</span>
                  </div>
                  <span className="text-[10px] text-[var(--muted)]">Opcional</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 h-9 px-2.5 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs outline-none"
                  >
                    <option value="">Selecionar produto...</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={selectedProdQty}
                    onChange={(e) => setSelectedProdQty(Number(e.target.value))}
                    className="w-16 h-9 bg-[var(--background)] sm:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs outline-none text-center"
                    placeholder="Qtd"
                  />
                  <button
                    type="button"
                    onClick={handleAddUsedProduct}
                    className="px-3 h-9 rounded-xl bg-[#7e1639] text-white text-xs font-bold cursor-pointer hover:bg-[#64112e] shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
                {usedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {usedProducts.map((up) => {
                      const pObj = products.find((p) => p.id === up.productId);
                      return (
                        <span
                          key={up.productId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] text-[11px] font-semibold"
                        >
                          {pObj?.name || "Produto"}: {up.quantity} {pObj?.unit}
                          <button
                            type="button"
                            onClick={() =>
                              setUsedProducts((prev) =>
                                prev.filter((i) => i.productId !== up.productId),
                              )
                            }
                            className="hover:opacity-75 cursor-pointer ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Footer (hidden sm:flex) */}
          <div className="hidden sm:flex bg-[var(--card-bg)] px-5 py-3 border-t border-[var(--card-border)] items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-bold cursor-pointer transition text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs font-bold shadow-xs cursor-pointer transition text-center"
            >
              Salvar Serviço
            </button>
          </div>

          {/* Mobile Bottom Bar (sm:hidden) */}
          <div className="sm:hidden fixed bottom-0 inset-x-0 p-3 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--card-border)] z-20">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#7e1639] active:bg-[#64112e] text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} />
              Salvar Serviço
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
