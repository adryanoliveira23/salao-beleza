"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  usePlatformConfig,
  PlatformUser,
  PLANS,
  PlanType,
} from "@/contexts/PlatformConfigContext";
import {
  Users,
  Settings,
  UserPlus,
  LogOut,
  Shield,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Activity,
  Crown,
  Clock,
} from "lucide-react";

function getPlanBadgeClass(plan: PlanType) {
  switch (plan) {
    case "premium":
    case "enterprise":
      return "bg-amber-100 text-amber-800 border border-amber-300";
    case "profissional":
      return "bg-purple-100 text-purple-800 border border-purple-200";
    default:
      return "bg-rose-100 text-rose-800 border border-rose-200";
  }
}

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const router = useRouter();
  const { config, users, updateConfig, addUser, updateUser, deleteUser } =
    usePlatformConfig();

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "plans" | "monitoring"
  >("overview");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const getPlanPrice = (plan: PlanType) => {
    if (plan === "premium" || plan === "enterprise") return config.planPrices.premium;
    if (plan === "profissional") return config.planPrices.profissional;
    return config.planPrices.essencial;
  };

  const stats = {
    totalSalons: users.length,
    activeSalons: users.filter((u) => u.status === "active").length,
    trialSalons: users.filter((u) => u.status === "trial").length,
    suspendedSalons: users.filter((u) => u.status === "suspended" || u.status === "inactive").length,
    essencialCount: users.filter((u) => u.plan === "essencial").length,
    profissionalCount: users.filter((u) => u.plan === "profissional").length,
    premiumCount: users.filter((u) => u.plan === "premium" || u.plan === "enterprise").length,
    mrr: users
      .filter((u) => u.status === "active")
      .reduce((sum, u) => sum + getPlanPrice(u.plan), 0),
  };

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      {/* Top Bar */}
      <div className="bg-white border-b border-rose-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#b83b6b] to-[#88234b] rounded-2xl flex items-center justify-center text-white shadow-md">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#2b1822]">
                Super Admin — Gestão SaaS
              </h1>
              <p className="text-xs text-[#7d6570]">
                Controle de salões assinantes, planos, limites, trials e integrações
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-xl bg-rose-50 text-[#b83b6b] text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Ir para Painel do Salão
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 cursor-pointer"
            >
              <LogOut size={15} />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-rose-100 w-fit shadow-xs">
          {[
            { id: "overview", label: "Indicadores SaaS", icon: TrendingUp },
            { id: "users", label: "Salões Cadastrados", icon: Users },
            { id: "plans", label: "Planos, Preços & Limites", icon: Crown },
            { id: "monitoring", label: "Status & Integrações", icon: Activity },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? "bg-[#b83b6b] text-white shadow-sm"
                  : "text-[#7d6570] hover:text-[#2b1822]"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-[#7d6570]">
                    Total de Salões
                  </span>
                  <Users size={18} className="text-[#b83b6b]" />
                </div>
                <p className="text-3xl font-bold text-[#2b1822]">
                  {stats.totalSalons}
                </p>
                <p className="text-xs text-[#7d6570] mt-1">
                  {stats.activeSalons} ativos • {stats.trialSalons} em teste grátis
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-[#7d6570]">
                    MRR (Receita Mensal)
                  </span>
                  <CreditCard size={18} className="text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-emerald-600">
                  R$ {stats.mrr.toFixed(2)}
                </p>
                <p className="text-xs text-[#7d6570] mt-1">
                  Faturamento recorrente ativo
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-[#7d6570]">
                    Período de Teste (Trial)
                  </span>
                  <Clock size={18} className="text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-[#2b1822]">
                  {config.defaultTrialDays} dias
                </p>
                <p className="text-xs text-[#7d6570] mt-1">
                  Configurado para novos cadastros
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-[#7d6570]">
                    Bloqueados / Inativos
                  </span>
                  <CheckCircle2 size={18} className="text-rose-600" />
                </div>
                <p className="text-3xl font-bold text-rose-600">
                  {stats.suspendedSalons}
                </p>
                <p className="text-xs text-[#7d6570] mt-1">
                  Contas suspensas ou expiradas
                </p>
              </div>
            </div>

            {/* 3 Plans Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["essencial", "profissional", "premium"] as const).map((key) => {
                const count =
                  key === "essencial"
                    ? stats.essencialCount
                    : key === "profissional"
                      ? stats.profissionalCount
                      : stats.premiumCount;
                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getPlanBadgeClass(key)}`}
                      >
                        Plano {PLANS[key].name}
                      </span>
                      <span className="text-lg font-bold text-[#b83b6b]">
                        R$ {config.planPrices[key].toFixed(2)}/mês
                      </span>
                    </div>
                    <p className="text-xs text-[#7d6570] mb-4">
                      {PLANS[key].description}
                    </p>
                    <div className="flex items-baseline justify-between pt-3 border-t border-rose-50">
                      <span className="text-2xl font-bold text-[#2b1822]">
                        {count} salões
                      </span>
                      <span className="text-xs text-[#7d6570]">
                        Limite: até {config.planLimits[key]} prof.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SALONS / USERS */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#2b1822]">
                  Salões Cadastrados na Plataforma
                </h2>
                <p className="text-xs text-[#7d6570]">
                  Ative, suspenda, altere o plano ou conceda dias de teste gratuito.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="bg-[#b83b6b] hover:bg-[#88234b] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <UserPlus size={16} />
                Cadastrar Novo Salão
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-rose-100 text-xs uppercase text-[#7d6570]">
                    <th className="py-3 px-3">Salão / Responsável</th>
                    <th className="py-3 px-3">E-mail</th>
                    <th className="py-3 px-3">Plano</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Cadastro</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-rose-50 hover:bg-rose-50/30"
                    >
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#2b1822]">
                          {u.salonName || u.name}
                        </p>
                        <p className="text-xs text-[#7d6570]">{u.name}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#7d6570]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPlanBadgeClass(u.plan)}`}
                        >
                          {PLANS[u.plan]?.name || "Essencial"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : u.status === "trial"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {u.status === "active"
                            ? "Ativo"
                            : u.status === "trial"
                              ? "Em Teste"
                              : "Bloqueado"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#7d6570]">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowUserModal(true);
                          }}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Editar Plano / Status"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLANS, PRICES & LIMITS */}
        {activeTab === "plans" && (
          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-[#2b1822]">
              Configuração Comercial dos 3 Planos SaaS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["essencial", "profissional", "premium"] as const).map((key) => (
                <div
                  key={key}
                  className="p-5 rounded-2xl border border-rose-100 bg-[#faf6f2] space-y-4"
                >
                  <h3 className="font-bold text-base text-[#2b1822]">
                    Plano {PLANS[key].name}
                  </h3>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                      Mensalidade (R$)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      value={config.planPrices[key]}
                      onChange={(e) =>
                        updateConfig({
                          planPrices: {
                            ...config.planPrices,
                            [key]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                      Limite de Profissionais por Salão
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.planLimits[key]}
                      onChange={(e) =>
                        updateConfig({
                          planLimits: {
                            ...config.planLimits,
                            [key]: parseInt(e.target.value, 10) || 1,
                          },
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-sm font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-rose-100">
              <div>
                <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                  Dias de Teste Grátis (Trial)
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.defaultTrialDays}
                  onChange={(e) =>
                    updateConfig({
                      defaultTrialDays: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                  Plano Inicial Padrão
                </label>
                <select
                  value={config.defaultPlan}
                  onChange={(e) =>
                    updateConfig({ defaultPlan: e.target.value as PlanType })
                  }
                  className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-sm"
                >
                  <option value="essencial">Essencial</option>
                  <option value="profissional">Profissional</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-bold text-[#2b1822] p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allowNewSignups}
                    onChange={(e) =>
                      updateConfig({ allowNewSignups: e.target.checked })
                    }
                  />
                  Permitir novos cadastros públicos
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MONITORING & INTEGRATIONS */}
        {activeTab === "monitoring" && (
          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#2b1822]">
              Monitoramento de Integrações & Saúde da Plataforma
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-bold uppercase text-emerald-800">
                  Banco de Dados Multi-Tenant (Firestore)
                </p>
                <p className="text-sm font-bold text-emerald-700 mt-1">
                  ✓ Operacional • Isolamento por Salão Ativo
                </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs font-bold uppercase text-blue-800">
                  Webhook WhatsApp Cloud / Evolution API
                </p>
                <p className="text-sm font-bold text-blue-700 mt-1">
                  ✓ Endpoint /api/webhooks/whatsapp Ativo
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <p className="text-xs font-bold uppercase text-purple-800">
                  Modo Manutenção Global
                </p>
                <label className="flex items-center gap-2 text-sm font-bold text-purple-900 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.maintenanceMode}
                    onChange={(e) =>
                      updateConfig({ maintenanceMode: e.target.checked })
                    }
                  />
                  {config.maintenanceMode ? "Ativo (Bloqueado)" : "Desativado (Online)"}
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={(data) => {
            if (editingUser) {
              updateUser(editingUser.id, data);
            } else {
              addUser(data);
            }
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: PlatformUser | null;
  onClose: () => void;
  onSave: (
    data: Omit<PlatformUser, "id" | "createdAt"> & { password?: string },
  ) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [salonName, setSalonName] = useState(user?.salonName || "");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<PlanType>(user?.plan || "profissional");
  const [status, setStatus] = useState<"active" | "trial" | "inactive" | "suspended">(
    user?.status || "active",
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#2b1822]">
            {user ? "Editar Salão" : "Novo Salão Assinante"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, email, salonName, password, plan, status });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
              Nome da Responsável *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-rose-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
              Nome do Salão
            </label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="w-full p-2.5 border border-rose-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-rose-200 rounded-xl text-sm"
            />
          </div>
          {!user && (
            <div>
              <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                Senha Inicial
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-2.5 border border-rose-200 rounded-xl text-sm"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                Plano SaaS
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="w-full p-2.5 border border-rose-200 rounded-xl text-sm"
              >
                <option value="essencial">Essencial</option>
                <option value="profissional">Profissional</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#7d6570] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full p-2.5 border border-rose-200 rounded-xl text-sm"
              >
                <option value="active">Ativo</option>
                <option value="trial">Período de Teste</option>
                <option value="suspended">Suspenso / Bloqueado</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#b83b6b] text-white text-sm font-bold"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
