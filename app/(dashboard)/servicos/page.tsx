"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Services() {
  const { services, addService, updateService, deleteService } = useSalonData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <Header title="Catálogo de Serviços" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col gap-4 md:gap-6">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-[#FF6B9D]/30 w-full sm:w-auto justify-center"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            Novo Serviço
          </button>
        </div>

        <div className="bg-white rounded-[16px] md:rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className="p-3 md:p-4 text-left font-semibold text-[#666] text-xs md:text-sm uppercase tracking-wider">
                  Serviço
                </th>
                <th className="p-3 md:p-4 text-left font-semibold text-[#666] text-xs md:text-sm uppercase tracking-wider">
                  Categoria
                </th>
                <th className="p-3 md:p-4 text-left font-semibold text-[#666] text-xs md:text-sm uppercase tracking-wider">
                  Duração
                </th>
                <th className="p-3 md:p-4 text-left font-semibold text-[#666] text-xs md:text-sm uppercase tracking-wider">
                  Preço
                </th>
                <th className="p-3 md:p-4 text-left font-semibold text-[#666] text-xs md:text-sm uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="border-t border-[#f5f5f5] hover:bg-[#fafafa] transition-colors"
                >
                  <td className="p-4 md:p-6 font-semibold text-[#2d1b2e] text-sm md:text-base">
                    {service.name}
                  </td>
                  <td className="p-4 md:p-6">
                    <span className="bg-[#fef3c7] text-[#92400e] px-3 py-1.5 rounded-full text-xs font-semibold">
                      {service.category}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 text-sm md:text-base">
                    {service.duration} min
                  </td>
                  <td className="p-4 md:p-6 font-bold font-serif text-[#10b981] text-sm md:text-base">
                    R$ {service.price.toFixed(2)}
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(service.id);
                          setShowModal(true);
                        }}
                        className="text-[#666] hover:bg-[#FF6B9D]/10 hover:text-[#FF6B9D] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="text-[#666] hover:bg-[#dc2626]/10 hover:text-[#dc2626] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {services.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-[#666] font-medium mb-2">
              Nenhum serviço cadastrado.
            </p>
            <p className="text-[#999] text-sm">
              Clique em &quot;Novo Serviço&quot; para adicionar. Os serviços
              aparecerão automaticamente no link de agendamento.
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal
          service={
            editingId ? services.find((s) => s.id === editingId) : undefined
          }
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
          onSave={(data) => {
            if (editingId) {
              updateService(editingId, data);
            } else {
              addService(data);
            }
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}
    </>
  );
}

function ServiceModal({
  service,
  onClose,
  onSave,
}: {
  service?: { name: string; duration: number; price: number; category: string };
  onClose: () => void;
  onSave: (data: {
    name: string;
    duration: number;
    price: number;
    category: string;
  }) => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [duration, setDuration] = useState(service?.duration ?? 45);
  const [price, setPrice] = useState(service?.price ?? 0);
  const [category, setCategory] = useState(service?.category ?? "Cabelo");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ name, duration, price, category });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div
        className="bg-white rounded-[24px] w-[90%] max-w-[500px] shadow-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
            {service ? "Editar Serviço" : "Novo Serviço"}
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
              Nome do Serviço
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
              placeholder="Ex: Corte + Escova"
            />
          </div>
          <div>
            <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
            >
              <option value="Cabelo">Cabelo</option>
              <option value="Unhas">Unhas</option>
              <option value="Estética">Estética</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
                Duração (min)
              </label>
              <input
                type="number"
                required
                min={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
                Preço (R$)
              </label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
              />
            </div>
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
