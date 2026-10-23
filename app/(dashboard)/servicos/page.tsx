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
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData, Service } from "@/contexts/SalonDataContext";

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
    <>
      <Header title="Serviços, Combos e Preços" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-5 max-w-[1440px] w-full mx-auto">
        {/* Top Controls */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xs border border-[#f2e6ea] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="flex items-center gap-3 bg-[#faf6f2] px-4 py-2.5 rounded-2xl border border-[#f2e6ea] flex-1 max-w-md">
              <Search size={18} className="text-[#b83b6b] shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar serviço, combo ou tratamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsComboDefault(true);
                  setShowModal(true);
                }}
                className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#fdf8e7] text-[#c59b27] border border-[#c59b27]/40 text-xs md:text-sm font-bold flex items-center gap-1.5 hover:brightness-95 transition"
              >
                <Sparkles size={16} /> Novo Combo / Pacote
              </button>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsComboDefault(false);
                  setShowModal(true);
                }}
                className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b83b6b] to-[#88234b] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-95 transition"
              >
                <Plus size={18} /> Novo Serviço
              </button>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === "all"
                  ? "bg-[#b83b6b] text-white"
                  : "bg-[#faf6f2] text-[#6e5a65]"
              }`}
            >
              Todos ({services.length})
            </button>
            <button
              onClick={() => setSelectedCategory("combos")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === "combos"
                  ? "bg-[#c59b27] text-white"
                  : "bg-[#fdf8e7] text-[#c59b27]"
              }`}
            >
              Combos & Pacotes ({services.filter((s) => s.isCombo).length})
            </button>
            {BEAUTY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                  selectedCategory === cat
                    ? "bg-[#b83b6b] text-white"
                    : "bg-[#faf6f2] text-[#6e5a65] hover:bg-[#fff0f5]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Table / Cards */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-[#f2e6ea] overflow-x-auto">
          <table className="w-full border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[#faf6f2] border-b border-[#f2e6ea]">
                <th className="p-4 text-left font-bold text-[#6e5a65] text-xs uppercase tracking-wider">
                  Serviço & Descrição
                </th>
                <th className="p-4 text-left font-bold text-[#6e5a65] text-xs uppercase tracking-wider">
                  Categoria
                </th>
                <th className="p-4 text-left font-bold text-[#6e5a65] text-xs uppercase tracking-wider">
                  Duração / Intervalo
                </th>
                <th className="p-4 text-left font-bold text-[#6e5a65] text-xs uppercase tracking-wider">
                  Preço / Custo / Comissão
                </th>
                <th className="p-4 text-left font-bold text-[#6e5a65] text-xs uppercase tracking-wider">
                  Online & Equipe
                </th>
                <th className="p-4 text-right font-bold text-[#6e5a65] text-xs uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e6ea]">
              {filteredServices.map((service) => {
                const enabledCount = service.enabledProfessionals?.length || 0;
                const netMargin =
                  service.price -
                  (service.costPrice || 0) -
                  service.price * ((service.commissionRate || 0) / 100);

                return (
                  <tr
                    key={service.id}
                    className="hover:bg-[#faf6f2]/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {service.photoUrl ? (
                          <img
                            src={service.photoUrl}
                            alt={service.name}
                            className="w-11 h-11 rounded-xl object-cover border border-[#f2e6ea] shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#fff0f5] text-[#b83b6b] flex items-center justify-center shrink-0">
                            {service.isCombo ? (
                              <Sparkles size={18} />
                            ) : (
                              <Scissors size={18} />
                            )}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#2d1b2e]">
                              {service.name}
                            </span>
                            {service.isCombo && (
                              <span className="px-2 py-0.5 rounded-full bg-[#fdf8e7] text-[#c59b27] text-[10px] font-bold">
                                Combo / {service.packageSessions || 1}x
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-xs text-[#6e5a65] line-clamp-1 max-w-xs">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-[#fff0f5] text-[#88234b] text-xs font-semibold">
                        {service.category}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-[#2d1b2e]">
                      <div className="font-bold flex items-center gap-1">
                        <Clock size={13} className="text-[#b83b6b]" />
                        {service.duration} min
                      </div>
                      {(service.bufferTime || 0) > 0 && (
                        <span className="text-[11px] text-[#6e5a65]">
                          +{service.bufferTime} min intervalo
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-sm text-[#0ca678]">
                        R$ {service.price.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-[#6e5a65]">
                        Custo: R$ {(service.costPrice || 0).toFixed(2)} • Com.:{" "}
                        {service.commissionRate ?? "Padrão"}
                        {service.commissionRate !== undefined ? "%" : ""}
                      </div>
                      <div className="text-[10px] text-[#b83b6b] font-semibold">
                        Lucro est.: R$ {Math.max(0, netMargin).toFixed(2)}
                      </div>
                    </td>

                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Globe
                          size={13}
                          className={
                            service.onlineBookingEnabled !== false
                              ? "text-[#0ca678]"
                              : "text-gray-400"
                          }
                        />
                        <span
                          className={
                            service.onlineBookingEnabled !== false
                              ? "font-semibold text-[#0ca678]"
                              : "text-gray-400"
                          }
                        >
                          {service.onlineBookingEnabled !== false
                            ? "Visível Online"
                            : "Apenas Interno"}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6e5a65]">
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
                          className="p-2 rounded-xl text-[#6e5a65] hover:bg-[#fff0f5] hover:text-[#b83b6b] transition"
                          title="Editar serviço"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="p-2 rounded-xl text-[#6e5a65] hover:bg-red-50 hover:text-red-600 transition"
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

          {filteredServices.length === 0 && (
            <div className="text-center py-12 px-4">
              <p className="text-[#2d1b2e] font-bold mb-1">
                Nenhum serviço cadastrado nesta visualização.
              </p>
              <p className="text-[#6e5a65] text-xs">
                Clique em &quot;Novo Serviço&quot; ou &quot;Novo Combo&quot;
                para cadastrar seu menu de beleza.
              </p>
            </div>
          )}
        </div>
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
    </>
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
  const [photoUrl, setPhotoUrl] = useState(service?.photoUrl ?? "");
  const [category, setCategory] = useState(
    service?.category ??
      (isComboDefault ? "Combos e Pacotes" : "Corte e escova"),
  );
  const [duration, setDuration] = useState(service?.duration ?? 45);
  const [bufferTime, setBufferTime] = useState(service?.bufferTime ?? 10);
  const [price, setPrice] = useState(service?.price ?? 80);
  const [costPrice, setCostPrice] = useState(service?.costPrice ?? 10);
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
      photoUrl,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#f2e6ea]">
          <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
            {service
              ? "Editar Serviço / Combo"
              : isCombo
                ? "Novo Combo ou Pacote Promocional"
                : "Novo Serviço de Beleza"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Nome do Serviço ou Combo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
                placeholder="Ex: Corte + Escova + Hidratação"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              >
                {BEAUTY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Descrição para a Cliente
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
                placeholder="Ex: Inclui lavagem especial e finalização"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                URL da Foto (Opcional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm font-bold text-[#0ca678]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Custo Est. (R$)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Comissão (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="Padrão"
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Duração (min) *
              </label>
              <input
                type="number"
                required
                min={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#2d1b2e] block mb-1">
                Intervalo (min)
              </label>
              <input
                type="number"
                min={0}
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className="w-full p-2.5 border border-[#f2e6ea] rounded-xl text-sm"
                title="Tempo de preparação/limpeza após o atendimento"
              />
            </div>
          </div>

          {/* Profissionais Habilitadas */}
          <div className="p-3.5 rounded-2xl bg-[#faf6f2] border border-[#f2e6ea]">
            <label className="text-xs font-bold text-[#2d1b2e] block mb-2">
              Profissionais Habilitadas (deixe desmarcado para habilitar todas)
            </label>
            <div className="flex flex-wrap gap-2">
              {professionals.map((p) => {
                const selected = enabledProfessionals.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProf(p.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      selected
                        ? "bg-[#b83b6b] text-white border-[#b83b6b]"
                        : "bg-white text-[#6e5a65] border-[#f2e6ea]"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
              {professionals.length === 0 && (
                <span className="text-xs text-[#6e5a65]">
                  Todas as profissionais do salão estarão habilitadas.
                </span>
              )}
            </div>
          </div>

          {/* Baixa Automática de Produtos do Estoque */}
          {products.length > 0 && (
            <div className="p-3.5 rounded-2xl border border-[#f2e6ea]">
              <label className="text-xs font-bold text-[#2d1b2e] block mb-2">
                Baixa Automática de Produtos no Estoque ao Concluir
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 p-2 border border-[#f2e6ea] rounded-xl text-xs"
                >
                  <option value="">Selecionar produto do estoque...</option>
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
                  className="w-20 p-2 border border-[#f2e6ea] rounded-xl text-xs"
                  placeholder="Qtd"
                />
                <button
                  type="button"
                  onClick={handleAddUsedProduct}
                  className="px-3 py-2 rounded-xl bg-[#b83b6b] text-white text-xs font-bold"
                >
                  Vincular
                </button>
              </div>
              {usedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {usedProducts.map((up) => {
                    const pObj = products.find((p) => p.id === up.productId);
                    return (
                      <span
                        key={up.productId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fff0f5] text-[#88234b] text-[11px] font-semibold"
                      >
                        {pObj?.name || "Produto"}: {up.quantity} {pObj?.unit}
                        <button
                          type="button"
                          onClick={() =>
                            setUsedProducts((prev) =>
                              prev.filter((i) => i.productId !== up.productId),
                            )
                          }
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

          {/* Toggles Online & Combo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#faf6f2] border border-[#f2e6ea] cursor-pointer">
              <input
                type="checkbox"
                checked={onlineBookingEnabled}
                onChange={(e) => setOnlineBookingEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#b83b6b]"
              />
              <span className="text-xs font-bold text-[#2d1b2e]">
                Disponível para Agendamento Online & WhatsApp
              </span>
            </label>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fdf8e7] border border-[#c59b27]/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCombo}
                  onChange={(e) => setIsCombo(e.target.checked)}
                  className="w-4 h-4 accent-[#c59b27]"
                />
                <span className="text-xs font-bold text-[#2d1b2e]">
                  É um Combo / Pacote
                </span>
              </label>
              {isCombo && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[#6e5a65]">Sessões:</span>
                  <input
                    type="number"
                    min={1}
                    value={packageSessions}
                    onChange={(e) => setPackageSessions(Number(e.target.value))}
                    className="w-14 p-1 rounded-lg bg-white border border-[#c59b27]/40 text-xs font-bold text-center"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#f2e6ea]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#b83b6b] text-[#b83b6b] text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#b83b6b] to-[#88234b] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Salvar Serviço
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
