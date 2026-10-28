"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  X,
  Upload,
  Download,
  FileText,
  Calendar,
  Tag,
  Heart,
  ShieldCheck,
  Cake,
  Clock,
  Award,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData, Client } from "@/contexts/SalonDataContext";
import { useToast } from "@/contexts/ToastContext";

const AVAILABLE_TAGS = [
  "Nova",
  "Frequente",
  "VIP",
  "Inativa",
  "Aniversariante",
] as const;

export default function Clients() {
  const {
    clients,
    appointments,
    professionals,
    addClient,
    updateClient,
    deleteClient,
  } = useSalonData();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;

  // Compute dynamic tags (e.g. Aniversariante, Inativa > 45 days, VIP, Frequente, Nova)
  const enrichedClients = useMemo(() => {
    const now = new Date();
    return clients.map((c) => {
      const tags = new Set<string>(c.tags || []);
      if ((c.visits || 0) <= 1) tags.add("Nova");
      if ((c.visits || 0) >= 3) {
        tags.delete("Nova");
        tags.add("Frequente");
      }
      if ((c.totalSpent || 0) >= 800 || (c.visits || 0) >= 8) {
        tags.add("VIP");
      }
      if (c.birthDate) {
        const m = Number(c.birthDate.split("-")[1]);
        if (m === currentMonth) tags.add("Aniversariante");
      }
      if (c.lastVisit) {
        const diffDays =
          (now.getTime() - new Date(c.lastVisit).getTime()) /
          (1000 * 60 * 60 * 24);
        if (diffDays > 45) tags.add("Inativa");
      }
      return {
        ...c,
        computedTags: Array.from(tags),
      };
    });
  }, [clients, currentMonth]);

  const filteredClients = useMemo(() => {
    return enrichedClients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || "").includes(search) ||
        (c.observations || "").toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedTag === "all") return true;
      return c.computedTags.includes(selectedTag);
    });
  }, [enrichedClients, search, selectedTag]);

  const openWhatsApp = (phone: string, message: string) => {
    const numbers = (phone || "").replace(/\D/g, "");
    const formatted =
      numbers.length >= 10 && numbers.length <= 11 ? `55${numbers}` : numbers;
    window.open(
      `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const exportClientsCSV = () => {
    const headers = [
      "Nome",
      "Telefone",
      "Email",
      "Nascimento",
      "Visitas",
      "Total Gasto",
      "Ultima Visita",
      "Retorno Provavel",
      "Origem",
      "Consentimento LGPD",
    ];
    const rows = enrichedClients.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ""}"`,
      `"${c.birthDate || ""}"`,
      c.visits || 0,
      (c.totalSpent || 0).toFixed(2),
      `"${c.lastVisit || ""}"`,
      `"${c.nextReturnDate || ""}"`,
      `"${c.origin || "WhatsApp"}"`,
      c.marketingConsent !== false ? "Sim" : "Nao",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_salao_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)]">
      <Header title="Clientes & Ficha Completa" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-5 max-w-[1440px] w-full mx-auto">
        {/* Top Controls & Segmentation */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-4 md:p-6 shadow-xs border border-[var(--card-border)] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="flex items-center gap-3 bg-[var(--background)] px-4 py-2.5 rounded-xl border border-[var(--card-border)] flex-1 max-w-md">
              <Search size={18} className="text-[#7e1639] dark:text-[#e27d9a] shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar por nome, telefone, e-mail ou observação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={exportClientsCSV}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--card-border)] text-xs font-bold flex items-center gap-1.5 hover:bg-[var(--primary-light)] transition cursor-pointer"
              >
                <Download size={16} /> Exportar CSV (LGPD)
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-[var(--card-bg)] text-[#7e1639] dark:text-[#e27d9a] border border-[#7e1639] text-xs font-bold flex items-center gap-1.5 hover:bg-[var(--primary-light)] transition cursor-pointer"
              >
                <Upload size={16} /> Importar Lista
              </button>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setShowModal(true);
                }}
                className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Plus size={18} /> Nova Cliente
              </button>
            </div>
          </div>

          {/* Segment Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold text-[var(--muted)] flex items-center gap-1 shrink-0">
              <Tag size={14} className="text-[#7e1639] dark:text-[#e27d9a]" /> Segmentar:
            </span>
            <button
              onClick={() => setSelectedTag("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedTag === "all"
                  ? "bg-[#7e1639] text-white"
                  : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]"
              }`}
            >
              Todas ({enrichedClients.length})
            </button>
            {AVAILABLE_TAGS.map((tag) => {
              const count = enrichedClients.filter((c) =>
                c.computedTags.includes(tag),
              ).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedTag === tag
                      ? "bg-[#7e1639] text-white"
                      : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]"
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const prefProf = professionals.find(
              (p) => p.id === client.preferredProfessionalId,
            );
            const tagColors: Record<string, string> = {
              VIP: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
              Frequente: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
              Nova: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
              Inativa: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
              Aniversariante: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
            };

            return (
              <div
                key={client.id}
                className="bg-[var(--card-bg)] rounded-2xl p-5 shadow-xs border border-[var(--card-border)] hover:border-[#7e1639]/40 transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#7e1639] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                        {client.name
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[var(--foreground)] tracking-tight">
                          {client.name}
                        </h4>
                        <p className="text-xs text-[var(--muted)]">{client.phone}</p>
                        {client.birthDate && (
                          <p className="text-[11px] text-[#7e1639] dark:text-[#e27d9a] flex items-center gap-1 mt-0.5 font-medium">
                            <Cake size={11} /> Nasc:{" "}
                            {client.birthDate.split("-").reverse().join("/")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
                      {client.computedTags.map((t) => (
                        <span
                          key={t}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            tagColors[t] ||
                            "bg-[var(--surface-hover)] text-[var(--muted)] border-[var(--card-border)]"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-xl bg-[var(--surface-hover)] text-center">
                    <div>
                      <span className="text-sm font-bold text-[var(--foreground)] block tabular-nums">
                        {client.visits || 0}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">Visitas</span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                        R$ {(client.totalSpent || 0).toFixed(0)}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        Total Gasto
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block tabular-nums">
                        {client.loyaltyPoints || 0} pts
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        Fidelidade
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-[var(--muted)]">
                    <div className="flex justify-between">
                      <span>Última visita:</span>
                      <strong className="text-[var(--foreground)]">
                        {client.lastVisit
                          ? client.lastVisit.split("-").reverse().join("/")
                          : "Sem registro"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Retorno provável:</span>
                      <strong className="text-[#7e1639] dark:text-[#e27d9a]">
                        {client.nextReturnDate
                          ? client.nextReturnDate.split("-").reverse().join("/")
                          : "Calcular na visita"}
                      </strong>
                    </div>
                    {prefProf && (
                      <div className="flex justify-between">
                        <span>Profissional preferida:</span>
                        <strong className="text-[var(--foreground)]">
                          {prefProf.name}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Origem:</span>
                      <strong className="text-[var(--foreground)]">
                        {client.origin || "WhatsApp"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingClient(client)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
                  >
                    <FileText size={14} /> Ficha & Histórico
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        openWhatsApp(
                          client.phone,
                          `Olá ${client.name}! Tudo bem? Aqui é do salão! ✨`,
                        )
                      }
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-500/10 transition cursor-pointer"
                      title="Conversar no WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setShowModal(true);
                      }}
                      className="p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[#7e1639] dark:hover:text-[#e27d9a] transition cursor-pointer"
                      title="Editar Ficha"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingId(client.id)}
                      className="p-2 rounded-xl text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                      title="Excluir dados (LGPD)"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-12 text-center border border-[var(--card-border)]">
            <p className="text-[var(--foreground)] font-bold">
              Nenhuma cliente encontrada neste filtro.
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Cadastre uma nova cliente ou altere os filtros de busca.
            </p>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Ficha Completa */}
      {showModal && (
        <ClientFormModal
          client={editingClient}
          professionals={professionals}
          onClose={() => {
            setShowModal(false);
            setEditingClient(null);
          }}
          onSave={async (data) => {
            if (editingClient) {
              await updateClient(editingClient.id, data);
            } else {
              await addClient(data);
            }
            setShowModal(false);
            setEditingClient(null);
          }}
        />
      )}

      {/* Modal Visualizar Ficha Completa + Histórico de Agendamentos e Pagamentos */}
      {viewingClient && (
        <ClientHistoryModal
          client={viewingClient}
          appointments={appointments.filter(
            (a) =>
              a.clientId === viewingClient.id ||
              a.clientPhone === viewingClient.phone ||
              a.clientName.toLowerCase() === viewingClient.name.toLowerCase(),
          )}
          professionals={professionals}
          onClose={() => setViewingClient(null)}
          onEdit={() => {
            const c = viewingClient;
            setViewingClient(null);
            setEditingClient(c);
            setShowModal(true);
          }}
        />
      )}

      {/* Modal Importar CSV */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={async (newClients) => {
            for (const c of newClients) {
              await addClient(c);
            }
            setShowImportModal(false);
          }}
        />
      )}

      {/* Confirmação de Exclusão LGPD */}
      {deletingId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-3xl w-full max-w-md shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
              Exclusão de Dados Pessoais (LGPD)
            </h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              Tem certeza que deseja excluir permanentemente a ficha desta
              cliente conforme a solicitação de titularidade (LGPD)?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteClient(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white cursor-pointer hover:bg-red-700 transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientFormModal({
  client,
  professionals,
  onClose,
  onSave,
}: {
  client: Client | null;
  professionals: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (data: Partial<Client> & { name: string; phone: string; email: string }) => Promise<void>;
}) {
  const [name, setName] = useState(client?.name || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [email, setEmail] = useState(client?.email || "");
  const [birthDate, setBirthDate] = useState(client?.birthDate || "");
  const [cpf, setCpf] = useState(client?.cpf || "");
  const [origin, setOrigin] = useState(client?.origin || "WhatsApp");
  const [preferredProfessionalId, setPreferredProfessionalId] = useState(
    client?.preferredProfessionalId || "",
  );
  const [nextReturnDate, setNextReturnDate] = useState(
    client?.nextReturnDate || "",
  );
  const [hairType, setHairType] = useState(client?.hairType || "");
  const [skinType, setSkinType] = useState(client?.skinType || "");
  const [allergies, setAllergies] = useState(client?.allergies || "");
  const [preferences, setPreferences] = useState(client?.preferences || "");
  const [observations, setObservations] = useState(client?.observations || "");
  const [marketingConsent, setMarketingConsent] = useState(
    client?.marketingConsent !== undefined ? client.marketingConsent : true,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    client?.tags || ["Nova"],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      phone,
      email,
      birthDate,
      cpf,
      origin,
      preferredProfessionalId,
      nextReturnDate,
      hairType,
      skinType,
      allergies,
      preferences,
      observations,
      marketingConsent,
      tags: selectedTags,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-3xl w-full max-w-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--card-border)]">
          <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            {client ? "Editar Ficha da Cliente" : "Nova Ficha de Cliente"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                placeholder="Nome da cliente"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                placeholder="(00) 90000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Origem da Cliente
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Indicação">Indicação de Amiga</option>
                <option value="Agendamento Online">Link Online</option>
                <option value="Google">Google / Maps</option>
                <option value="Passante">Fachada / Passante</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Profissional Preferida
              </label>
              <select
                value={preferredProfessionalId}
                onChange={(e) => setPreferredProfessionalId(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
              >
                <option value="">Sem preferência fixa</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Data Provável de Retorno
              </label>
              <input
                type="date"
                value={nextReturnDate}
                onChange={(e) => setNextReturnDate(e.target.value)}
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-sm focus:border-[#7e1639] outline-none"
              />
            </div>
          </div>

          {/* Anamnese e Preferências */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)]">
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Tipo de Cabelo
              </label>
              <input
                type="text"
                value={hairType}
                onChange={(e) => setHairType(e.target.value)}
                placeholder="Ex: Ondulado, com mechas"
                className="w-full p-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Tipo de Pele / Unhas
              </label>
              <input
                type="text"
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                placeholder="Ex: Sensível, cutícula fina"
                className="w-full p-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Alergias / Restrições
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Ex: Amônia, esmalte comum"
                className="w-full p-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Preferências de Atendimento
              </label>
              <textarea
                rows={2}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Ex: Gosta de café sem açúcar, prefere horários pela manhã..."
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs resize-none outline-none focus:border-[#7e1639]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                Observações Técnicas (Fórmulas / Coloração)
              </label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Tinta 7.1 + OX 20vol na raiz..."
                className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs resize-none outline-none focus:border-[#7e1639]"
              />
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
              Etiquetas da Cliente
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                    selectedTags.includes(tag)
                      ? "bg-[#7e1639] text-white border-[#7e1639]"
                      : "bg-[var(--surface-hover)] text-[var(--muted)] border-[var(--card-border)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Consentimento LGPD */}
          <div className="p-3.5 rounded-2xl bg-[var(--primary-light)]/40 border border-[var(--card-border)] flex items-center gap-3">
            <input
              type="checkbox"
              id="lgpdConsent"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="w-4 h-4 accent-[#7e1639]"
            />
            <label htmlFor="lgpdConsent" className="text-xs text-[var(--foreground)]">
              <strong>Consentimento LGPD:</strong> A cliente autoriza o envio de
              lembretes de agendamento, pesquisas de satisfação e campanhas
              promocionais pelo WhatsApp.
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs font-bold shadow-xs cursor-pointer transition"
            >
              Salvar Ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientHistoryModal({
  client,
  appointments,
  professionals,
  onClose,
  onEdit,
}: {
  client: Client;
  appointments: any[];
  professionals: Array<{ id: string; name: string }>;
  onClose: () => void;
  onEdit: () => void;
}) {
  const prefProf = professionals.find(
    (p) => p.id === client.preferredProfessionalId,
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-3xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-[var(--card-border)]">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Ficha Completa: {client.name}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {client.phone} • {client.email || "Sem e-mail"} • Origem:{" "}
              {client.origin || "WhatsApp"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-xl bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Edit2 size={13} /> Editar
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
            <span className="text-[11px] text-[var(--muted)] block">
              Total Gasto
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              R$ {(client.totalSpent || 0).toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
            <span className="text-[11px] text-[var(--muted)] block">Visitas</span>
            <span className="text-base font-bold text-[var(--foreground)] tabular-nums">
              {client.visits || 0} atendimentos
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
            <span className="text-[11px] text-[var(--muted)] block">
              Profissional Pref.
            </span>
            <span className="text-xs font-bold text-[var(--foreground)]">
              {prefProf?.name || "Qualquer"}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--surface-hover)]">
            <span className="text-[11px] text-[var(--muted)] block">
              Consentimento LGPD
            </span>
            <span className="text-xs font-bold text-[#7e1639] dark:text-[#e27d9a]">
              {client.marketingConsent !== false ? "Autorizado" : "Restrito"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3.5 rounded-2xl border border-[var(--card-border)] bg-[var(--background)]">
            <h4 className="font-bold text-[var(--foreground)] mb-1">
              Preferências & Anamnese
            </h4>
            <p className="text-[var(--muted)]">
              <strong>Cabelo/Pele:</strong> {client.hairType || "-"}{" "}
              {client.skinType ? `/ ${client.skinType}` : ""}
            </p>
            <p className="text-[var(--muted)]">
              <strong>Alergias:</strong> {client.allergies || "Nenhuma relatada"}
            </p>
            <p className="text-[var(--muted)]">
              <strong>Preferências:</strong>{" "}
              {client.preferences || "Sem observações"}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl border border-[var(--card-border)] bg-[var(--background)]">
            <h4 className="font-bold text-[var(--foreground)] mb-1">
              Observações Importantes / Fórmulas
            </h4>
            <p className="text-[var(--muted)]">
              {client.observations ||
                "Nenhuma fórmula ou observação técnica registrada ainda."}
            </p>
          </div>
        </div>

        <h4 className="font-bold text-sm text-[var(--foreground)] mb-3">
          Histórico de Agendamentos, Serviços e Pagamentos (
          {appointments.length})
        </h4>
        {appointments.length === 0 ? (
          <p className="text-xs text-[var(--muted)] py-6 text-center bg-[var(--surface-hover)] rounded-2xl">
            Nenhum atendimento encontrado no histórico desta cliente.
          </p>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar">
            {appointments
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl border border-[var(--card-border)] flex items-center justify-between text-xs bg-[var(--background)]"
                >
                  <div>
                    <span className="font-bold text-[var(--foreground)]">
                      {apt.date.split("-").reverse().join("/")} às {apt.time} —{" "}
                      {apt.serviceName}
                    </span>
                    <p className="text-[var(--muted)]">
                      Profissional: {apt.professionalName} • Pgto:{" "}
                      {(apt.paymentMethod || "pix").toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                      R$ {Number(apt.price || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] uppercase">
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (
    data: Array<{ name: string; phone: string; email: string }>,
  ) => void;
}) {
  const [text, setText] = useState("");
  const toast = useToast();

  const handleImport = () => {
    const lines = text.split("\n");
    const parsed = lines
      .map((line) => {
        const parts = line.split(",");
        if (parts.length < 2) return null;
        return {
          name: parts[0]?.trim(),
          phone: parts[1]?.trim(),
          email: parts[2]?.trim() || "",
        };
      })
      .filter(Boolean) as Array<{ name: string; phone: string; email: string }>;

    if (parsed.length === 0) {
      toast.warning("Use o formato: Nome, Telefone, Email (um por linha)", "Formato Inválido");
      return;
    }
    onImport(parsed);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-3xl w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            Importar Clientes (CSV)
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">
          Cole abaixo sua lista no formato:{" "}
          <strong>Nome, Telefone, Email</strong>
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-36 p-3 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-xl text-xs font-mono outline-none focus:border-[#7e1639]"
          placeholder="Maria Silva, 11999999999, maria@email.com"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs font-bold cursor-pointer shadow-xs transition"
          >
            Importar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
