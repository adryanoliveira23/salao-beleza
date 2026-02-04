"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, MessageCircle, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useSalonData();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const formatPhoneForWhatsApp = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length >= 10 && numbers.length <= 11) {
      return `55${numbers}`;
    }
    return numbers;
  };

  const openWhatsApp = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${formattedPhone}?text=${encodedMessage}`,
      "_blank",
    );
  };

  return (
    <>
      <Header title="Clientes" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-4 md:px-5 py-3 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] w-full sm:max-w-[400px]">
            <Search size={20} className="text-[#666] shrink-0" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 border-none outline-none text-sm font-sans"
            />
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-[#FF6B9D]/30 w-full sm:w-auto"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            Novo Cliente
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 md:gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex justify-center">
                <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C73866] flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-lg font-bold font-serif text-[#2d1b2e] mb-2">
                  {client.name}
                </h4>
                <div className="flex flex-col gap-1 text-[13px] text-[#666]">
                  <span>{client.phone}</span>
                  <span>{client.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-[#f0f0f0]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold font-serif text-[#FF6B9D]">
                    {client.visits}
                  </span>
                  <span className="text-xs text-[#666]">Visitas</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold font-serif text-[#FF6B9D]">
                    R$ {client.totalSpent}
                  </span>
                  <span className="text-xs text-[#666]">Gasto Total</span>
                </div>
              </div>

              <div className="text-xs text-[#999] text-center">
                Última visita:{" "}
                {client.lastVisit
                  ? new Date(client.lastVisit).toLocaleDateString("pt-BR")
                  : "-"}
              </div>

              <div className="flex gap-2 justify-end mt-auto">
                <button
                  className="text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#128C7E] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                  title="Mensagem WhatsApp"
                  onClick={() =>
                    openWhatsApp(client.phone, `Olá ${client.name}!`)
                  }
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  className="text-[#666] hover:bg-[#FF6B9D]/10 hover:text-[#FF6B9D] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                  title="Editar cliente"
                  onClick={() => {
                    setEditingId(client.id);
                    setShowModal(true);
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="text-[#666] hover:bg-[#dc2626]/10 hover:text-[#dc2626] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                  title="Excluir cliente"
                  onClick={() => setDeletingId(client.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredClients.length === 0 && (
          <p className="text-[#666] text-center py-12">
            {search
              ? "Nenhum cliente encontrado."
              : "Nenhum cliente cadastrado. Adicione o primeiro!"}
          </p>
        )}
      </div>

      {showModal && (
        <ClientModal
          client={
            editingId ? clients.find((c) => c.id === editingId) : undefined
          }
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
          onSave={(data) => {
            if (editingId) {
              updateClient(editingId, data);
            } else {
              addClient(data);
            }
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}

      {deletingId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white rounded-[24px] w-[90%] max-w-[400px] shadow-2xl p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold font-serif text-[#2d1b2e] mb-2">
              Excluir cliente
            </h3>
            <p className="text-[#666] mb-6">
              Tem certeza que deseja excluir este cliente? Esta ação não pode
              ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#f0f0f0] text-[#666] hover:bg-[#f5f5f5]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteClient(deletingId);
                  setDeletingId(null);
                }}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#dc2626] text-white hover:bg-[#b91c1c]"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client?: { id: string; name: string; phone: string; email: string };
  onClose: () => void;
  onSave: (data: { name: string; phone: string; email: string }) => void;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");

  useEffect(() => {
    setName(client?.name ?? "");
    setPhone(client?.phone ?? "");
    setEmail(client?.email ?? "");
  }, [client]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ name, phone, email });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div
        className="bg-white rounded-[24px] w-[90%] max-w-[500px] shadow-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
            {client ? "Editar Cliente" : "Novo Cliente"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
              Nome
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
              Telefone
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#FF6B9D] text-[#FF6B9D] hover:bg-[#fff0f5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white hover:shadow-lg"
            >
              {client ? "Salvar alterações" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
