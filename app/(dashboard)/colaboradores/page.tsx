"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/app/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import { Plus, Trash2, FileText, User, Users } from "lucide-react";
import { Header } from "@/components/Header";

interface Employee {
  id: string;
  name: string;
  role: string;
  commission: number;
  pixKey: string;
  cpf: string;
  email?: string;
  phone?: string;
}

export default function ColaboradoresPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "Cabeleireiro(a)",
    commission: 30, // Default 30%
    pixKey: "",
    cpf: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "employees"),
      where("ownerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Employee[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Employee, "id">),
      }));
      setEmployees(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, "employees"), {
        ...formData,
        commission: Number(formData.commission),
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        role: "Cabeleireiro(a)",
        commission: 30,
        pixKey: "",
        cpf: "",
        email: "",
        phone: "",
      });
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Erro ao adicionar colaborador.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este colaborador?")) {
      try {
        await deleteDoc(doc(db, "employees", id));
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const generateContract = (employee: Employee) => {
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATO DE PARCERIA - SALÃO PARCEIRO", 105, y, {
      align: "center",
    });
    y += 20;

    // Body
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const text = `
    Pelo presente instrumento particular de contrato de parceria, de um lado [NOME DO SEU SALÃO], pessoa jurídica de direito privado, doravante denominado SALÃO-PARCEIRO.

    E de outro lado, ${employee.name.toUpperCase()}, inscrito(a) no CPF sob o nº ${employee.cpf}, doravante denominado(a) PROFISSIONAL-PARCEIRO.

    Têm entre si justo e contratado o seguinte:

    CLÁUSULA PRIMEIRA - DO OBJETO
    O presente contrato tem por objeto a celebração de parceria entre as partes para o desempenho das atividades de ${employee.role}, nas dependências do SALÃO-PARCEIRO, nos termos da Lei nº 13.352/2016.

    CLÁUSULA SEGUNDA - DA PARTILHA DE RECEITAS (COMISSÃO)
    Pela parceria ora firmada, o SALÃO-PARCEIRO reterá a título de aluguel de bens móveis, utensílios, despesas operacionais, tributos e encargos locatícios, o percentual correspondente, cabendo ao PROFISSIONAL-PARCEIRO a cota-parte de ${employee.commission}% (por cento) sobre o valor bruto dos serviços prestados.

    CLÁUSULA TERCEIRA - DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO
    As partes declaram expressamente que a presente relação jurídica não configura vínculo empregatício de qualquer natureza, sendo regida pela Lei do Salão Parceiro. O PROFISSIONAL-PARCEIRO possui total autonomia na execução de seus serviços, não estando sujeito a controle de jornada ou subordinação hierárquica.

    CLÁUSULA QUARTA - DOS PAGAMENTOS
    Os repasses da cota-parte devida ao PROFISSIONAL-PARCEIRO serão realizados através de transferência bancária para a Chave PIX: ${employee.pixKey}.

    CLÁUSULA SEXTA - DA CONFIDENCIALIDADE E NÃO CONCORRÊNCIA
    O PROFISSIONAL-PARCEIRO compromete-se a manter sigilo sobre as técnicas, fórmulas e dados de clientes do SALÃO-PARCEIRO, comprometendo-se também a não desviar clientela para atendimento próprio fora das dependências do salão durante a vigência deste contrato.

    E, por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.

    __________________, _____ de ___________________ de ________.
    `;

    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, y);

    y += splitText.length * 5 + 30;

    // Signatures
    doc.line(20, y, 90, y);
    doc.text("SALÃO-PARCEIRO", 55, y + 5, { align: "center" });

    doc.line(110, y, 180, y);
    doc.text("PROFISSIONAL-PARCEIRO", 145, y + 5, { align: "center" });

    doc.save(
      `contrato_${employee.name.replace(/\s+/g, "_").toLowerCase()}.pdf`,
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Colaboradores" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-outfit">
                Equipe & Parceiros
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Gerencie sua equipe e contratos de parceria
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-sm font-medium"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Novo Colaborador</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-1">
                Nenhum colaborador ainda
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Adicione sua equipe para gerar contratos.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[var(--primary)] font-bold text-sm hover:underline"
              >
                Adicionar agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-[var(--primary-light)] p-3 rounded-2xl text-[var(--primary)]">
                      <User size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateContract(emp)}
                        className="text-gray-400 hover:text-[var(--primary)] p-2 rounded-full hover:bg-gray-50 transition"
                        title="Gerar Contrato"
                      >
                        <FileText size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                        title="Excluir"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {emp.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{emp.role}</p>

                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Comissão</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                        {emp.commission}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">CPF</span>
                      <span className="text-gray-600">{emp.cpf}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Chave PIX</span>
                      <span className="text-gray-600 truncate max-w-[120px]">
                        {emp.pixKey}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-center">
                    <button
                      onClick={() => generateContract(emp)}
                      className="text-sm font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <FileText size={16} /> Baixar Contrato
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 font-outfit">
                  Novo Colaborador
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] outline-none transition-all"
                      placeholder="Ex: Maria Silva"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Cargo/Função
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] outline-none bg-white"
                      >
                        <option>Cabeleireiro(a)</option>
                        <option>Manicure</option>
                        <option>Maquiador(a)</option>
                        <option>Esteticista</option>
                        <option>Recepcionista</option>
                        <option>Auxiliar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Comissão (%)
                      </label>
                      <input
                        type="number"
                        name="commission"
                        required
                        min="0"
                        max="100"
                        value={formData.commission}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] outline-none"
                        placeholder="30"
                      />
                      <p className="text-[10px] text-gray-400 mt-1 italic">
                        {formData.role === "Cabeleireiro(a)"
                          ? "Sugestão mercado: 30-50%"
                          : formData.role === "Manicure"
                            ? "Sugestão mercado: 40-60%"
                            : formData.role === "Maquiador(a)"
                              ? "Sugestão mercado: 30-50%"
                              : "Sugestão mercado: 30%"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        name="cpf"
                        required
                        value={formData.cpf}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] outline-none"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Chave PIX
                      </label>
                      <input
                        type="text"
                        name="pixKey"
                        required
                        value={formData.pixKey}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] outline-none"
                        placeholder="Chave para pagamentos"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-dark)] transition-colors shadow-lg shadow-[var(--primary-light)]"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
