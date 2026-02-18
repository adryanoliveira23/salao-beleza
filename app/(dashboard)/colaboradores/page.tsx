"use client";

import React, { useState } from "react";
import { Plus, Trash2, FileText, User, Scissors } from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function ColaboradoresPage() {
  const { professionals, addProfessional, deleteProfessional } = useSalonData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [commission, setCommission] = useState("");

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty) return;

    await addProfessional({
      name,
      specialty,
      commission: Number(commission) || 0,
    });

    setName("");
    setSpecialty("");
    setCommission("");
    setIsModalOpen(false);
  };

  const handleGenerateContract = (professionalName: string) => {
    // Mock contract generation for now - ideally use jsPDF
    const contractText = `
    CONTRATO DE PARCERIA - SALÃO PARCEIRO
    
    ENTRE:
    SALÃO PRO (Salão-Parceiro)
    e
    ${professionalName} (Profissional-Parceiro)
    
    1. O Profissional-Parceiro atuará com autonomia...
    2. A cota-parte (comissão) será paga conforme combinado...
    3. Este contrato segue a Lei do Salão Parceiro (Lei 13.352/2016).
    
    Data: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([contractText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Contrato_${professionalName.replace(/\s+/g, "_")}.txt`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Gestão de Colaboradores" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Action Row */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-outfit">
              Time de Especialistas
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-md shadow-purple-200"
            >
              <Plus size={18} />
              Novo Profissional
            </button>
          </div>

          {/* Professionals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {professionals.length === 0 ? (
              <div className="col-span-full p-10 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
                <User size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhum profissional cadastrado.</p>
              </div>
            ) : (
              professionals.map((prof) => (
                <div
                  key={prof.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: prof.color || "#820AD1" }}
                      >
                        {prof.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{prof.name}</h3>
                        <p className="text-sm text-gray-500">
                          {prof.specialty}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteProfessional(prof.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-sm text-gray-600">Comissão</span>
                      <span className="font-bold text-[var(--primary)]">
                        {prof.commission}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleGenerateContract(prof.name)}
                      className="w-full border border-gray-200 text-gray-600 hover:border-[var(--primary)] hover:text-[var(--primary)] py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-sm"
                    >
                      <FileText size={16} />
                      Gerar Contrato
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold font-outfit mb-6">
              Novo Profissional
            </h3>

            <form onSubmit={handleAddProfessional} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade
                </label>
                <div className="relative">
                  <Scissors
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Cabeleireira, Manicure"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comissão (%)
                </label>
                <input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="Ex: 50"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[var(--primary)] text-white font-bold py-3 rounded-xl hover:bg-[var(--primary-dark)] transition-colors shadow-lg shadow-purple-200/50"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
