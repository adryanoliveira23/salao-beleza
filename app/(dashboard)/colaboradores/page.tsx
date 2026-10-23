"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { useSalonData, Professional } from "@/contexts/SalonDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { jsPDF } from "jspdf";
import {
  Plus,
  Trash2,
  FileText,
  Users,
  Edit2,
  X,
  CheckCircle2,
  Award,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  Calendar,
} from "lucide-react";

const SPECIALTIES = [
  "Cabeleireira",
  "Colorista",
  "Manicure & Pedicure",
  "Nail Designer",
  "Designer de Sobrancelhas",
  "Lash Designer (Cílios)",
  "Maquiadora",
  "Esteticista",
  "Depiladora",
  "Recepcionista",
  "Auxiliar",
];

const ROLES: {
  value: "owner" | "professional" | "receptionist";
  label: string;
  desc: string;
}[] = [
  {
    value: "owner",
    label: "Proprietária / Gerente",
    desc: "Acesso total ao sistema e financeiro",
  },
  {
    value: "professional",
    label: "Profissional / Parceira",
    desc: "Acesso à própria agenda e comissões",
  },
  {
    value: "receptionist",
    label: "Recepcionista",
    desc: "Acesso à agenda, clientes e caixa diário",
  },
];

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function ColaboradoresPage() {
  const { profile } = useAuth();
  const {
    professionals,
    appointments,
    services,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    updateAppointment,
  } = useSalonData();

  const [activeTab, setActiveTab] = useState<
    "team" | "commissions" | "productivity"
  >("team");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    specialty: "Cabeleireira",
    commission: 40,
    fixedSalary: 0,
    monthlyGoal: 5000,
    permissions: "professional" as "owner" | "professional" | "receptionist",
    cpf: "",
    pixKey: "",
    email: "",
    phone: "",
    startTime: "09:00",
    endTime: "19:00",
    workingDays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as string[],
    active: true,
  });

  const openCreateModal = () => {
    setEditingProf(null);
    setFormData({
      name: "",
      specialty: "Cabeleireira",
      commission: 40,
      fixedSalary: 0,
      monthlyGoal: 5000,
      permissions: "professional",
      cpf: "",
      pixKey: "",
      email: "",
      phone: "",
      startTime: "09:00",
      endTime: "19:00",
      workingDays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prof: Professional) => {
    setEditingProf(prof);
    setFormData({
      name: prof.name,
      specialty: prof.specialty || "Cabeleireira",
      commission: prof.commission ?? 40,
      fixedSalary: prof.fixedSalary ?? 0,
      monthlyGoal: prof.monthlyGoal ?? 5000,
      permissions: prof.permissions || "professional",
      cpf: prof.cpf || "",
      pixKey: prof.pixKey || "",
      email: prof.email || "",
      phone: prof.phone || "",
      startTime: prof.startTime || "09:00",
      endTime: prof.endTime || "19:00",
      workingDays: prof.workingDays || ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      active: prof.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      specialty: formData.specialty,
      commission: Number(formData.commission),
      fixedSalary: Number(formData.fixedSalary),
      monthlyGoal: Number(formData.monthlyGoal),
      permissions: formData.permissions,
      cpf: formData.cpf,
      pixKey: formData.pixKey,
      email: formData.email,
      phone: formData.phone,
      startTime: formData.startTime,
      endTime: formData.endTime,
      workingDays: formData.workingDays,
      active: formData.active,
    };

    if (editingProf) {
      await updateProfessional(editingProf.id, payload);
    } else {
      await addProfessional(payload);
    }
    setIsModalOpen(false);
  };

  const toggleWorkingDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  // Compute real productivity and commissions over completed/paid appointments
  const teamMetrics = useMemo(() => {
    return professionals.map((prof) => {
      const profAppts = appointments.filter(
        (a) =>
          String(a.professionalId) === String(prof.id) ||
          a.professionalName?.toLowerCase() === prof.name.toLowerCase(),
      );
      const completedAppts = profAppts.filter((a) => a.status === "completed");

      let totalRevenue = 0;
      let totalCommission = 0;
      let pendingCommission = 0;
      let paidCommission = 0;

      completedAppts.forEach((appt) => {
        const svc = services.find((s) => String(s.id) === String(appt.serviceId));
        const price = appt.price ?? svc?.price ?? 0;
        const commRate = svc?.commissionRate ?? prof.commission ?? 0;
        const commValue = (price * commRate) / 100;

        totalRevenue += price;
        totalCommission += commValue;
        if (appt.commissionPaid) {
          paidCommission += commValue;
        } else {
          pendingCommission += commValue;
        }
      });

      const goal = prof.monthlyGoal || 5000;
      const goalProgress =
        goal > 0 ? Math.min(100, Math.round((totalRevenue / goal) * 100)) : 0;

      return {
        prof,
        totalAppts: profAppts.length,
        completedCount: completedAppts.length,
        completedAppts,
        totalRevenue,
        totalCommission,
        pendingCommission,
        paidCommission,
        goal,
        goalProgress,
      };
    });
  }, [professionals, appointments, services]);

  const handlePayAllCommissions = async (profId: string | number) => {
    const metric = teamMetrics.find((m) => String(m.prof.id) === String(profId));
    if (!metric) return;
    const unpaid = metric.completedAppts.filter((a) => !a.commissionPaid);
    for (const appt of unpaid) {
      await updateAppointment(appt.id, { commissionPaid: true });
    }
  };

  const generateContract = (prof: Professional) => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(
      "CONTRATO DE PARCERIA — LEI DO SALÃO-PARCEIRO (LEI 13.352/2016)",
      105,
      y,
      { align: "center" },
    );
    y += 16;

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");

    const salonTitle = profile?.salon_name || "SALÃO DE BELEZA";
    const salonCnpj = profile?.cnpj
      ? `inscrito no CNPJ sob nº ${profile.cnpj}`
      : "pessoa jurídica/física";

    const text = `Pelo presente instrumento particular de contrato de parceria, de um lado ${salonTitle.toUpperCase()}, ${salonCnpj}, doravante denominado SALÃO-PARCEIRO.

E de outro lado, ${prof.name.toUpperCase()}, inscrito(a) no CPF sob o nº ${prof.cpf || "___.___.___-__"}, atuando na especialidade de ${prof.specialty}, doravante denominado(a) PROFISSIONAL-PARCEIRO(A).

CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem por objeto a celebração de parceria entre as partes para o desempenho das atividades de ${prof.specialty} nas dependências do SALÃO-PARCEIRO, nos termos da Lei Federal nº 13.352/2016.

CLÁUSULA SEGUNDA - DA COTA-PARTE E COMISSÃO
Pela parceria ora firmada, caberá ao PROFISSIONAL-PARCEIRO(A) a cota-parte de ${prof.commission}% (por cento) sobre o valor efetivamente pago pelos clientes nos serviços prestados${prof.fixedSalary ? `, acrescido de ajuda de custo/fixo mensal de R$ ${prof.fixedSalary.toFixed(2)}` : ""}. O percentual remanescente caberá ao SALÃO-PARCEIRO a título de retenção pelo uso do espaço, mobiliário, recepção, sistema de gestão e tributos.

CLÁUSULA TERCEIRA - DOS REPASSES
Os repasses da cota-parte devida serão realizados mediante fechamento de caixa para a chave PIX informada: ${prof.pixKey || "A definir"}.

CLÁUSULA QUARTA - DA AUTONOMIA E HORÁRIOS
As partes declaram inexistência de vínculo empregatício nos termos da Lei nº 13.352/2016, comprometendo-se o(a) PROFISSIONAL-PARCEIRO(A) a manter alinhamento com a agenda de atendimento (${prof.startTime || "09:00"} às ${prof.endTime || "19:00"}) e zelar pelas normas de biossegurança e excelência no atendimento.

CLÁUSULA QUINTA - PROTEÇÃO DE DADOS (LGPD)
O(A) PROFISSIONAL-PARCEIRO(A) compromete-se a manter absoluto sigilo sobre os dados pessoais e fichas técnicas das clientes cadastradas na plataforma do SALÃO-PARCEIRO.

Local e Data: _______________________, ${new Date().toLocaleDateString("pt-BR")}.`;

    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, y);

    y += splitText.length * 5.2 + 25;

    doc.line(20, y, 92, y);
    doc.text(salonTitle.substring(0, 28), 56, y + 6, { align: "center" });

    doc.line(115, y, 188, y);
    doc.text(prof.name.substring(0, 28), 151, y + 6, { align: "center" });

    doc.save(
      `contrato_parceria_${prof.name.replace(/\s+/g, "_").toLowerCase()}.pdf`,
    );
  };

  const totalPendingAll = teamMetrics.reduce(
    (acc, m) => acc + m.pendingCommission,
    0,
  );
  const totalPaidAll = teamMetrics.reduce((acc, m) => acc + m.paidCommission, 0);
  const totalFixedPayroll = professionals.reduce(
    (acc, p) => acc + (p.fixedSalary || 0),
    0,
  );

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Equipe, Comissões & Produtividade" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Profissionais Ativas
              </span>
              <div className="p-2 rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                <Users size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {professionals.filter((p) => p.active !== false).length}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {professionals.length} cadastradas no total
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Comissões Pendentes
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Clock size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">
              R$ {totalPendingAll.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Sobre serviços efetivamente pagos
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Comissões Já Repassadas
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">
              R$ {totalPaidAll.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Repasses quitados no período
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Salários Fixos Mensais
              </span>
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              R$ {totalFixedPayroll.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Folha fixa + recepção/apoio
            </p>
          </div>
        </div>

        {/* Navigation Tabs + Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex overflow-x-auto bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] w-full md:w-fit no-scrollbar">
            {[
              { id: "team", label: "Equipe & Permissões", icon: Users },
              { id: "commissions", label: "Cálculo de Comissões", icon: DollarSign },
              { id: "productivity", label: "Metas & Produtividade", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer w-full md:w-auto"
          >
            <Plus size={18} />
            Nova Profissional / Colaboradora
          </button>
        </div>

        {/* TAB 1: TEAM & PERMISSIONS */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamMetrics.map(
              ({ prof, completedCount, totalRevenue, goalProgress }) => (
                <div
                  key={prof.id}
                  className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0"
                          style={{ backgroundColor: prof.color || "#b83b6b" }}
                        >
                          {prof.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-[var(--foreground)] text-base sm:text-lg leading-tight truncate">
                            {prof.name}
                          </h3>
                          <p className="text-xs text-[var(--muted)] font-medium truncate">
                            {prof.specialty}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
                            <Shield size={10} />
                            {prof.permissions === "owner"
                              ? "Proprietária / Admin"
                              : prof.permissions === "receptionist"
                                ? "Recepcionista"
                                : "Profissional Parceira"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(prof)}
                          className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]/50 transition-colors cursor-pointer"
                          title="Editar profissional"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => generateContract(prof)}
                          className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]/50 transition-colors cursor-pointer"
                          title="Gerar Contrato Salão-Parceiro (PDF)"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(`Deseja remover ${prof.name} da equipe?`)
                            ) {
                              deleteProfessional(prof.id);
                            }
                          }}
                          className="p-2 rounded-xl text-[var(--muted)] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-sm border-t border-[var(--card-border)] pt-4">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Comissão Padrão</span>
                        <span className="font-bold text-emerald-600 tabular-nums">
                          {prof.commission}%
                        </span>
                      </div>
                      {(prof.fixedSalary ?? 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Salário Fixo</span>
                          <span className="font-semibold text-[var(--foreground)] tabular-nums">
                            R$ {(prof.fixedSalary || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)] shrink-0">
                          Expediente
                        </span>
                        <span className="text-xs font-medium text-[var(--foreground)] text-right truncate">
                          {prof.startTime || "09:00"} às {prof.endTime || "19:00"}{" "}
                          ({(prof.workingDays || ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]).join(", ")})
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)] shrink-0">Chave PIX</span>
                        <span className="text-xs font-medium text-[var(--foreground)] truncate max-w-[160px]">
                          {prof.pixKey || "Não informada"}
                        </span>
                      </div>
                    </div>

                    {/* Individual Goal Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--muted)]">
                          Meta Mensal (R$ {(prof.monthlyGoal || 5000).toFixed(0)})
                        </span>
                        <span className="font-bold text-[var(--primary)] tabular-nums">
                          {goalProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all"
                          style={{ width: `${goalProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1.5 tabular-nums">
                        {completedCount} atendimentos concluídos • R${" "}
                        {totalRevenue.toFixed(2)} gerados
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                    <button
                      onClick={() => generateContract(prof)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      <FileText size={14} />
                      Baixar Contrato PDF
                    </button>
                    <button
                      onClick={() => openEditModal(prof)}
                      className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      Configurar Horários & Meta →
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* TAB 2: COMMISSIONS ON PAID SERVICES */}
        {activeTab === "commissions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--card-border)]">
              <div>
                <h3 className="font-bold text-[var(--foreground)]">
                  Repasse de Comissões sobre Serviços Pagos
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  O sistema calcula automaticamente a comissão somente quando o agendamento é concluído e pago.
                </p>
              </div>
              <select
                value={selectedProfFilter}
                onChange={(e) => setSelectedProfFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm font-medium w-full sm:w-auto"
              >
                <option value="all">Todas as Profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {teamMetrics
                .filter(
                  (m) =>
                    selectedProfFilter === "all" ||
                    String(m.prof.id) === selectedProfFilter,
                )
                .map((m) => (
                  <div
                    key={m.prof.id}
                    className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                          style={{ backgroundColor: m.prof.color || "#b83b6b" }}
                        >
                          {m.prof.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--foreground)]">
                            {m.prof.name} ({m.prof.commission}%)
                          </h4>
                          <p className="text-xs text-[var(--muted)]">
                            PIX: {m.prof.pixKey || "Não cadastrado"} •{" "}
                            {m.completedCount} serviços concluídos
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-[var(--muted)] block">
                            Pendente de Repasse
                          </span>
                          <span className="text-lg font-bold text-amber-600 tabular-nums">
                            R$ {m.pendingCommission.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-[var(--muted)] block">
                            Já Pago
                          </span>
                          <span className="text-lg font-bold text-emerald-600 tabular-nums">
                            R$ {m.paidCommission.toFixed(2)}
                          </span>
                        </div>
                        {m.pendingCommission > 0 && (
                          <button
                            onClick={() => handlePayAllCommissions(m.prof.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer w-full sm:w-auto justify-center"
                          >
                            <CheckCircle2 size={15} />
                            Quitar Comissões Pendentes
                          </button>
                        )}
                      </div>
                    </div>

                    {m.completedAppts.length === 0 ? (
                      <p className="text-xs text-[var(--muted)] py-4">
                        Nenhum atendimento concluído para cálculo de comissão ainda.
                      </p>
                    ) : (
                      <div className="overflow-x-auto mt-3">
                        <table className="w-full text-left text-sm min-w-[540px]">
                          <thead>
                            <tr className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                              <th className="py-2">Data</th>
                              <th className="py-2">Cliente</th>
                              <th className="py-2">Serviço</th>
                              <th className="py-2">Valor Pago</th>
                              <th className="py-2">Comissão</th>
                              <th className="py-2 text-right">Status Repasse</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.completedAppts.map((appt) => {
                              const svc = services.find(
                                (s) => String(s.id) === String(appt.serviceId),
                              );
                              const price = appt.price ?? svc?.price ?? 0;
                              const rate =
                                svc?.commissionRate ?? m.prof.commission ?? 0;
                              const comm = (price * rate) / 100;
                              return (
                                <tr
                                  key={appt.id}
                                  className="border-b border-[var(--card-border)]/50 last:border-none"
                                >
                                  <td className="py-2.5 text-xs tabular-nums">
                                    {new Date(
                                      appt.date + "T12:00:00",
                                    ).toLocaleDateString("pt-BR")}
                                  </td>
                                  <td className="py-2.5 font-medium">
                                    {appt.clientName}
                                  </td>
                                  <td className="py-2.5 text-xs text-[var(--muted)]">
                                    {appt.serviceName}
                                  </td>
                                  <td className="py-2.5 font-medium tabular-nums">
                                    R$ {price.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 font-bold text-emerald-700 tabular-nums">
                                    R$ {comm.toFixed(2)} ({rate}%)
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={() =>
                                        updateAppointment(appt.id, {
                                          commissionPaid: !appt.commissionPaid,
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                                        appt.commissionPaid
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                      }`}
                                    >
                                      {appt.commissionPaid
                                        ? "Repassado ✓"
                                        : "Marcar Pago"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTIVITY & GOALS */}
        {activeTab === "productivity" && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Award className="text-[var(--primary)]" size={20} />
              Ranking de Produtividade & Metas Individuais
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-xs text-[var(--muted)] uppercase">
                    <th className="py-3 px-3">Profissional</th>
                    <th className="py-3 px-3">Atendimentos</th>
                    <th className="py-3 px-3">Faturamento Bruto</th>
                    <th className="py-3 px-3">Comissão Total</th>
                    <th className="py-3 px-3">Lucro Retido Salão</th>
                    <th className="py-3 px-3">Atingimento da Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {[...teamMetrics]
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((m, idx) => {
                      const salonRetained = m.totalRevenue - m.totalCommission;
                      return (
                        <tr
                          key={m.prof.id}
                          className="border-b border-[var(--card-border)]/60 hover:bg-[var(--primary-light)]/10"
                        >
                          <td className="py-3.5 px-3 font-bold text-[var(--foreground)] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs flex items-center justify-center shrink-0">
                              {idx + 1}º
                            </span>
                            {m.prof.name}
                          </td>
                          <td className="py-3.5 px-3 tabular-nums">
                            {m.completedCount} concluídos (de {m.totalAppts})
                          </td>
                          <td className="py-3.5 px-3 font-bold text-[var(--foreground)] tabular-nums">
                            R$ {m.totalRevenue.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-amber-700 font-semibold tabular-nums">
                            R$ {m.totalCommission.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-emerald-600 font-bold tabular-nums">
                            R$ {salonRetained.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 w-48">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--primary)]"
                                  style={{ width: `${m.goalProgress}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold tabular-nums">
                                {m.goalProgress}%
                              </span>
                            </div>
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-xl p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                {editingProf
                  ? "Editar Profissional"
                  : "Cadastrar Profissional / Colaboradora"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-[var(--muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    placeholder="Ex: Ana Beatriz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Especialidade *
                  </label>
                  <select
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Perfil de Permissão no Sistema
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() =>
                        setFormData({ ...formData, permissions: r.value })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.permissions === r.value
                          ? "border-[var(--primary)] bg-[var(--primary-light)]/30"
                          : "border-[var(--card-border)]"
                      }`}
                    >
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        {r.label}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">
                        {r.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Comissão Padrão (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Salário Fixo (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fixedSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fixedSalary: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Meta Mensal (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.monthlyGoal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyGoal: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    CPF (Para Contrato)
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Chave PIX para Repasses
                  </label>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) =>
                      setFormData({ ...formData, pixKey: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    placeholder="CPF, E-mail ou Celular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Início Expediente
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Fim Expediente
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1.5 flex items-center gap-1">
                  <Calendar size={13} /> Dias de Atendimento na Semana
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const selected = formData.workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selected
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--background)] text-[var(--muted)] border-[var(--card-border)]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--card-border)] font-semibold text-sm text-[var(--muted)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold text-sm shadow-md"
                >
                  {editingProf ? "Salvar Alterações" : "Cadastrar Profissional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
