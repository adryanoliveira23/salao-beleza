"use client";

import React, { useState } from "react";
import { Plus, Edit2, Settings, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Professionals() {
  const { professionals, addProfessional } = useSalonData();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Header title="Equipe de Profissionais" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col gap-4 md:gap-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-[#FF6B9D]/30 w-full sm:w-auto justify-center"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            Adicionar Profissional
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 md:gap-6">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="bg-white rounded-[16px] md:rounded-[20px] p-5 md:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-center gap-4 relative overflow-hidden group"
            >
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: prof.color }}
              ></div>

              <div
                className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md mb-2"
                style={{ backgroundColor: prof.color }}
              >
                {prof.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
                  {prof.name}
                </h3>
                <span className="text-sm text-[#666]">{prof.specialty}</span>
              </div>

              <div className="mt-2 text-sm text-[#666] bg-[#fafafa] px-4 py-2 rounded-lg">
                Comissão:{" "}
                <strong style={{ color: prof.color }}>
                  {prof.commission}%
                </strong>
              </div>

              <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[#666] hover:bg-[#FF6B9D]/10 hover:text-[#FF6B9D] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer">
                  <Edit2 size={16} />
                </button>
                <button className="text-[#666] hover:bg-[#FF6B9D]/10 hover:text-[#FF6B9D] p-2 rounded-lg transition-all duration-300 flex items-center justify-center bg-transparent border-none cursor-pointer">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {professionals.length === 0 && (
          <p className="text-[#666] text-center py-12">
            Nenhum profissional cadastrado. Adicione para começar a receber agendamentos!
          </p>
        )}
      </div>

      {showModal && (
        <ProfessionalModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function ProfessionalModal({ onClose }: { onClose: () => void }) {
  const { addProfessional } = useSalonData();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("Cabeleireira");
  const [commission, setCommission] = useState(40);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProfessional({ name, specialty, commission });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div
        className="bg-white rounded-[24px] w-[90%] max-w-[500px] shadow-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
            Adicionar Profissional
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
              Especialidade
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
            >
              <option value="Cabeleireira">Cabeleireira</option>
              <option value="Colorista">Colorista</option>
              <option value="Manicure">Manicure</option>
              <option value="Esteticista">Esteticista</option>
              <option value="Barbeiro">Barbeiro</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-sm text-[#2d1b2e] mb-1">
              Comissão (%)
            </label>
            <input
              type="number"
              required
              min={0}
              max={100}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D]"
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
